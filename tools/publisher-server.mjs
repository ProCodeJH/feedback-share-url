import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { publishFeedbackPage } from "./publish-feedback-page.mjs";
import { renderFeedbackPageHtml } from "./render-feedback-page.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adminFile = path.join(repoRoot, "publisher", "index.html");
const logoFile = path.join(repoRoot, "logo.png");
const port = Number(process.env.PORT || 4317);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, contentType, text) {
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(text);
}

function collectRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    if (!request.url) {
      sendJson(response, 400, { error: "Missing URL." });
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host || `127.0.0.1:${port}`}`);

    if (request.method === "GET" && url.pathname === "/") {
      const html = await readFile(adminFile, "utf8");
      sendText(response, 200, "text/html; charset=utf-8", html);
      return;
    }

    if (request.method === "GET" && url.pathname === "/logo.png") {
      const image = await readFile(logoFile);
      response.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
      response.end(image);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/preview") {
      const rawBody = await collectRequestBody(request);
      const payload = JSON.parse(rawBody || "{}");
      const html = renderFeedbackPageHtml(payload, { logoSrc: "/logo.png" });
      sendText(response, 200, "text/html; charset=utf-8", html);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/publish") {
      const rawBody = await collectRequestBody(request);
      const payload = JSON.parse(rawBody || "{}");
      const result = await publishFeedbackPage(payload);
      sendJson(response, 200, result);
      return;
    }

    sendJson(response, 404, { error: "Not found." });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Feedback publisher running at http://127.0.0.1:${port}`);
});
