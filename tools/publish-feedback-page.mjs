import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { normalizeFeedbackData, renderFeedbackPageHtml } from "./render-feedback-page.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteBaseUrl = (process.env.SITE_BASE_URL || "https://procodejh.github.io/feedback-share-url/").replace(/\/+$/, "") + "/";

function run(command, args) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8"
  }).trim();
}

function hasPendingChange(relativeFilePath) {
  const output = run("git", ["status", "--short", "--", relativeFilePath]);
  return Boolean(output.trim());
}

export function getPublishedUrl(slug) {
  return siteBaseUrl + encodeURIComponent(slug) + "/";
}

export async function publishFeedbackPage(rawData = {}) {
  const data = normalizeFeedbackData(rawData);
  const pageDir = path.join(repoRoot, data.slug);
  const pageFile = path.join(pageDir, "index.html");
  const relativePageFile = path.posix.join(data.slug, "index.html");

  await mkdir(pageDir, { recursive: true });
  await writeFile(pageFile, renderFeedbackPageHtml(data), "utf8");

  if (!hasPendingChange(relativePageFile)) {
    return {
      slug: data.slug,
      url: getPublishedUrl(data.slug),
      committed: false,
      data
    };
  }

  run("git", ["add", relativePageFile]);
  run("git", ["commit", "-m", `Publish feedback page: ${data.slug}`]);
  run("git", ["push"]);

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
