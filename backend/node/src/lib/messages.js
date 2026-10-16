const MAX_MESSAGES = 16;
const MAX_CHARS = 2000;

export class MessageError extends Error {
  constructor(message) {
    super(message);
    this.name = "MessageError";
  }
}

export function parseMessages(body) {
  if (typeof body !== "object" || body === null || !Array.isArray(body.messages)) {
    throw new MessageError("Send a message.");
  }

  const { messages } = body;
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    throw new MessageError("Send a message.");
  }

  const parsed = messages.map((message) => parseMessage(message));
  if (parsed[parsed.length - 1]?.role !== "user") {
    throw new MessageError("The last message should be a question.");
  }
  return parsed;
}

function parseMessage(value) {
  if (typeof value !== "object" || value === null) {
    throw new MessageError("Send a message.");
  }
  if (value.role !== "user" && value.role !== "assistant") {
    throw new MessageError("Send a message.");
  }
  if (typeof value.content !== "string") {
    throw new MessageError("Send a message.");
  }

  const content = value.content.trim();
  if (!content) {
    throw new MessageError("Send a message.");
  }
  if (content.length > MAX_CHARS) {
    throw new MessageError("Keep the message under 2000 characters.");
  }

  return { role: value.role, content };
}
