export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type AssistantHealth = {
  node: "ok" | "down";
  ai: "ok" | "down";
  ollama: "ok" | "down";
  model: string | null;
};
