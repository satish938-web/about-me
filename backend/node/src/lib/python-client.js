const pythonUrl = (process.env.PYTHON_SERVICE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export async function pythonHealth() {
  try {
    const response = await fetch(`${pythonUrl}/api/health`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    if (!response.ok || !isHealthPayload(data)) {
      return { ai: "down", ollama: "down", model: null };
    }
    return { ai: "ok", ollama: data.ollama, model: data.model };
  } catch {
    return { ai: "down", ollama: "down", model: null };
  }
}

export async function askPython(messages) {
  let response;
  try {
    response = await fetch(`${pythonUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("The model took too long to answer.");
    }
    throw new Error("The Python AI service is not running.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(readError(data) ?? "The assistant could not answer.");
    error.statusCode = response.status;
    throw error;
  }
  if (!isChatPayload(data)) {
    throw new Error("The assistant returned an unexpected answer.");
  }
  return { role: "assistant", content: data.message.content };
}

function isHealthPayload(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    (value.ollama === "ok" || value.ollama === "down") && typeof value.model === "string"
  );
}

function isChatPayload(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.message === "object" &&
    value.message !== null &&
    typeof value.message.content === "string"
  );
}

function readError(value) {
  if (typeof value !== "object" || value === null || typeof value.error !== "string") {
    return null;
  }
  return value.error;
}
