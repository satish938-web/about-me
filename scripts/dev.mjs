import { spawn } from "node:child_process";
import path from "node:path";

const children = [];
let stopping = false;

function start(name, args, cwd) {
  const child = spawn(process.execPath, args, {
    cwd: path.resolve(cwd),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  pipe(child.stdout, name, process.stdout);
  pipe(child.stderr, name, process.stderr);

  child.on("exit", (code) => {
    if (!stopping) {
      shutdown(code ?? 1);
    }
  });

  children.push(child);
}

function pipe(stream, name, output) {
  let rest = "";
  stream.on("data", (chunk) => {
    rest += chunk.toString();
    const lines = rest.split("\n");
    rest = lines.pop() ?? "";
    for (const line of lines) {
      output.write(`[${name}] ${line}\n`);
    }
  });
}

function killTree(child) {
  if (!child.pid) {
    return;
  }
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    return;
  }
  child.kill("SIGTERM");
}

function shutdown(code) {
  if (stopping) {
    return;
  }
  stopping = true;
  for (const child of children) {
    killTree(child);
  }
  setTimeout(() => process.exit(code), 400);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start("frontend", ["node_modules/next/dist/bin/next", "dev"], "frontend");
start("node", ["--watch", "src/server.js"], "backend/node");
start("python", ["scripts/dev-python.mjs"], ".");
