const pythonBase = (process.env.PYTHON_SERVICE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

const offlineHealth = { ai: "down", ollama: "down", model: null };

export async function proxyPython(path: "/api/health" | "/api/chat", request?: Request): Promise<Response> {
  const timeout = path === "/api/chat" ? 55_000 : 8_000;
  try {
    const response = await fetch(`${pythonBase}${path}`, {
      method: request?.method ?? "GET",
      headers: request ? { "Content-Type": "application/json" } : undefined,
      body: request ? await request.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(timeout),
    });
    const body = await response.text();
    return new Response(body || "{}", {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    if (path === "/api/health") {
      return Response.json(offlineHealth);
    }
    return Response.json({ error: "The assistant could not be reached." }, { status: 503 });
  }
}
