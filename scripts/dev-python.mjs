import { spawn } from "node:child_process";
import path from "node:path";

const serviceRoot = path.join("backend", "python");
const python =
  process.platform === "win32"
    ? path.join(serviceRoot, ".venv", "Scripts", "python.exe")
    : path.join(serviceRoot, "bin", "python");

const child = spawn(
  python,
  [
    "-m",
    "uvicorn",
    "app.main:app",
    "--host",
    "127.0.0.1",
    "--port",
    "8000",
    "--app-dir",
    serviceRoot,
    "--reload",
    "--reload-dir",
    path.join(serviceRoot, "app"),
  ],
  { stdio: "inherit" },
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
