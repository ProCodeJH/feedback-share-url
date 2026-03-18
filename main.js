import { app, BrowserWindow, shell } from "electron";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startPublisherServer } from "./tools/publisher-server.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;
let serverInstance;

function isLocalAppUrl(url) {
  return /^http:\/\/127\.0\.0\.1:4325(?:\/|$)/.test(url);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: "코딩쏙 피드백 스튜디오",
    icon: path.join(__dirname, "logo.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isLocalAppUrl(url)) {
      return { action: "allow" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isLocalAppUrl(url) || url === "about:blank") {
      return;
    }

    event.preventDefault();
    shell.openExternal(url);
  });

  // 로딩 화면이나 기본 창 상태를 예쁘게 띄워두고 서버가 뜨길 기다릴 수 있습니다.
  // 서버가 뜨기까지 약간의 딜레이가 있으므로, 처음엔 about:blank 로드.
  mainWindow.loadURL("about:blank");
}

function normalizeCandidate(candidate) {
  const resolved = path.resolve(candidate);

  if (existsSync(resolved)) {
    const stats = statSync(resolved);
    if (stats.isFile()) {
      return path.dirname(resolved);
    }
  }

  return resolved;
}

function expandWorkspaceCandidates(candidates) {
  const expanded = [];
  const seen = new Set();

  for (const candidate of candidates.filter(Boolean)) {
    const resolved = normalizeCandidate(candidate);
    const variants = [
      resolved,
      path.join(resolved, "feedback-share-url"),
      path.join(path.dirname(resolved), "feedback-share-url")
    ];

    for (const variant of variants) {
      if (seen.has(variant)) continue;
      seen.add(variant);
      expanded.push(variant);
    }
  }

  return expanded;
}

function findWorkspaceRoot() {
  const candidates = expandWorkspaceCandidates([
    process.env.FEEDBACK_WORKSPACE_ROOT,
    process.env.PORTABLE_EXECUTABLE_DIR,
    process.env.PORTABLE_EXECUTABLE_FILE,
    process.cwd(),
    app.getPath("exe"),
    process.execPath,
    path.dirname(process.execPath),
    __dirname
  ]);

  for (const candidate of candidates) {
    let current = normalizeCandidate(candidate);

    while (true) {
      if (existsSync(path.join(current, ".git")) && existsSync(path.join(current, "publisher"))) {
        return current;
      }

      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  return normalizeCandidate(process.env.PORTABLE_EXECUTABLE_DIR || process.cwd());
}

async function startServer() {
  const PORT = 4325; // 고정된 포트를 쓰거나 동적 할당 로직을 추가할 수 있습니다.
  const workspaceRoot = findWorkspaceRoot();
  process.env.FEEDBACK_WORKSPACE_ROOT = workspaceRoot;
  const { server, url } = await startPublisherServer({
    port: PORT,
    workspaceRoot
  });

  serverInstance = server;
  console.log(`[Server] ${url} (workspace: ${workspaceRoot})`);

  if (mainWindow) {
    await mainWindow.loadURL(url);
  }
}

app.whenReady().then(async () => {
  createWindow();
  try {
    await startServer();
  } catch (error) {
    console.error(`[Server Error] ${error.message}`);
    if (mainWindow) {
      await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<html lang="ko"><body style="font-family: sans-serif; padding: 24px;"><h2>피드백 스튜디오를 시작하지 못했습니다.</h2><pre>${error.message}</pre></body></html>`)}`);
    }
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 앱 종료 시 백그라운드 서버 프로세스도 확실하게 종료
app.on("will-quit", () => {
  if (serverInstance) {
    serverInstance.close();
  }
});
