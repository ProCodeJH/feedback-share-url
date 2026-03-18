import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extractImageFromDataUrl, normalizeFeedbackData, renderFeedbackPageHtml } from "./render-feedback-page.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteBaseUrl = (process.env.SITE_BASE_URL || "https://procodejh.github.io/feedback-share-url/").replace(/\/+$/, "") + "/";

function normalizeDirectoryPath(value) {
  const resolved = path.resolve(value);

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
    const resolved = normalizeDirectoryPath(candidate);
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

function findGitWorkspaceRoot(startPath) {
  let current = normalizeDirectoryPath(startPath);

  while (true) {
    if (existsSync(path.join(current, ".git")) && existsSync(path.join(current, "publisher"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return "";
}

function resolveWorkspaceRoot(options = {}) {
  const candidates = expandWorkspaceCandidates([
    options.workspaceRoot,
    process.env.FEEDBACK_WORKSPACE_ROOT,
    process.env.PORTABLE_EXECUTABLE_DIR,
    process.env.PORTABLE_EXECUTABLE_FILE,
    process.cwd(),
    repoRoot
  ]);

  for (const candidate of candidates) {
    const workspaceRoot = findGitWorkspaceRoot(candidate);
    if (workspaceRoot) {
      return workspaceRoot;
    }
  }

  throw new Error("Git 저장소를 찾지 못했습니다. exe는 feedback-share-url 폴더 안이나 그 하위 dist 폴더에서 실행해 주세요.");
}

function run(command, args, workspaceRoot = repoRoot) {
  return execFileSync(command, args, {
    cwd: workspaceRoot,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8"
  }).trim();
}

function ensureGitRepo(workspaceRoot) {
  try {
    return run("git", ["rev-parse", "--is-inside-work-tree"], workspaceRoot) === "true";
  } catch {
    throw new Error("Git 저장소를 찾지 못했습니다. exe는 feedback-share-url 폴더 안이나 그 하위 dist 폴더에서 실행해 주세요.");
  }
}

function hasPendingChanges(relativeFilePaths, workspaceRoot) {
  const output = run("git", ["status", "--short", "--", ...relativeFilePaths], workspaceRoot);
  return Boolean(output.trim());
}

function getCurrentBranch(workspaceRoot) {
  return run("git", ["branch", "--show-current"], workspaceRoot);
}

function pushWithFallback(workspaceRoot) {
  try {
    run("git", ["push"], workspaceRoot);
  } catch (error) {
    const stderr = String(error?.stderr || error?.message || "");
    if (!/has no upstream branch/i.test(stderr)) {
      throw error;
    }

    const branch = getCurrentBranch(workspaceRoot);
    if (!branch) {
      throw error;
    }

    run("git", ["push", "-u", "origin", branch], workspaceRoot);
  }
}

export function getPublishedUrl(slug) {
  return siteBaseUrl + slug + "/";
}

export async function publishFeedbackPage(rawData = {}, options = {}) {
  const data = normalizeFeedbackData(rawData);
  const workspaceRoot = resolveWorkspaceRoot(options);
  const pageDir = path.join(workspaceRoot, data.slug);
  const pageFile = path.join(pageDir, "index.html");
  const relativePageFile = path.posix.join(data.slug, "index.html");
  const relativeFilesToCommit = [relativePageFile];
  const detailPhotoAsset = extractImageFromDataUrl(rawData.detailPhotoDataUrl);
  let detailPhotoSrc = "";

  ensureGitRepo(workspaceRoot);
  await mkdir(pageDir, { recursive: true });

  if (detailPhotoAsset) {
    const detailPhotoFileName = `detail-photo.${detailPhotoAsset.extension}`;
    const detailPhotoFile = path.join(pageDir, detailPhotoFileName);
    const relativeDetailPhotoFile = path.posix.join(data.slug, detailPhotoFileName);

    await writeFile(detailPhotoFile, detailPhotoAsset.buffer);
    detailPhotoSrc = `./${detailPhotoFileName}`;
    relativeFilesToCommit.push(relativeDetailPhotoFile);
  }

  await writeFile(pageFile, renderFeedbackPageHtml(data, { detailPhotoSrc }), "utf8");

  if (!hasPendingChanges(relativeFilesToCommit, workspaceRoot)) {
    return {
      slug: data.slug,
      url: getPublishedUrl(data.slug),
      committed: false,
      data
    };
  }

  run("git", ["add", "--", ...relativeFilesToCommit], workspaceRoot);
  run("git", ["commit", "-m", `Publish feedback page: ${data.slug}`], workspaceRoot);
  pushWithFallback(workspaceRoot);

  return {
    slug: data.slug,
    url: getPublishedUrl(data.slug),
    committed: true,
    data
  };
}

async function readJsonFromCli() {
  const inputFlagIndex = process.argv.indexOf("--input");
  if (inputFlagIndex >= 0 && process.argv[inputFlagIndex + 1]) {
    const filePath = path.resolve(process.cwd(), process.argv[inputFlagIndex + 1]);
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(filePath, "utf8"));
  }

  if (process.stdin.isTTY) {
    throw new Error("Provide --input <json-file> or pipe JSON into stdin.");
  }

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const payload = await readJsonFromCli();
    const result = await publishFeedbackPage(payload);
    console.log(result.url);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
