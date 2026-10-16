import { createServer } from "node:http";

import { parseMessages, MessageError } from "./lib/messages.js";
import { askPython, pythonHealth } from "./lib/python-client.js";

const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);

function applyCors(request, response) {
  const origin = request.headers.origin;
  if (typeof origin === "string" && allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  response.end(payload);
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return null;
  }
  return JSON.parse(raw);
}

const server = createServer(async (request, response) => {
  applyCors(request, response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      const health = await pythonHealth();
      sendJson(response, 200, { node: "ok", ...health });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      await handleChat(request, response);
      return;
    }

    sendJson(response, 404, { error: "Not found." });
  } catch (error) {
    console.error(error);
    if (!response.headersSent) {
      sendJson(response, 500, { error: "The Node API failed." });
    }
  }
});

async function handleChat(request, response) {
  let body;
  try {
    body = await readJson(request);
  } catch {
    sendJson(response, 400, { error: "Send a message." });
    return;
  }

  try {
    const messages = parseMessages(body);
    const message = await askPython(messages);
    sendJson(response, 200, { message });
  } catch (error) {
    if (error instanceof MessageError) {
      sendJson(response, 400, { error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "The assistant could not answer.";
    const status =
      typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : 502;
    sendJson(response, status, { error: message });
  }
}

server.listen(port, "127.0.0.1", () => {
  console.log(`Node API listening on http://127.0.0.1:${port}`);
});
