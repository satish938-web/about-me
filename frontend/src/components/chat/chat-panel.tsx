"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useChat } from "@/components/chat/chat-provider";
import { useScreen, type ScreenRect } from "@/components/scene/screen-context";
import { apiUrl } from "@/lib/api";
import type { AssistantHealth, ChatMessage } from "@/types/chat";

function placeBeside(rect: ScreenRect, width: number, height: number) {
  const gap = 14;
  const rightGutter = width - rect.left - rect.width - gap;
  const leftGutter = rect.left - gap;
  const onRight = rightGutter >= leftGutter;
  const room = onRight ? rightGutter : leftGutter;
  const panelWidth = Math.min(380, Math.floor(room - gap));
  if (panelWidth < 180) {
    return null;
  }
  const top = Math.max(16, rect.top);
  const panelHeight = Math.max(220, Math.min(rect.height, height - top - 16));
  if (onRight) {
    return { top, height: panelHeight, width: panelWidth, right: gap, left: "auto" as const };
  }
  return { top, height: panelHeight, width: panelWidth, left: gap, right: "auto" as const };
}

export function ChatPanel({ name }: { name: string }) {
  const { open, setOpen } = useChat();
  const screen = useScreen();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<AssistantHealth | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.stopImmediatePropagation();
      setOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, setOpen]);

  useLayoutEffect(() => {
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;
    async function loadHealth() {
      try {
        const response = await fetch(apiUrl("/api/health"));
        const data: unknown = await response.json();
        if (!ignore && isHealth(data)) {
          setHealth(data);
        }
      } catch {
        if (!ignore) {
          setHealth({ node: "down", ai: "down", ollama: "down", model: null });
        }
      }
    }

    void loadHealth();
    return () => {
      ignore = true;
    };
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending, open]);

  if (!open) {
    return null;
  }

  const beside =
    screen.open && screen.rect && viewport.width > 0
      ? placeBeside(screen.rect, viewport.width, viewport.height)
      : null;

  async function send() {
    const content = draft.trim();
    if (!content || pending) {
      return;
    }

    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(history);
    setDraft("");
    setPending(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(readError(data) ?? "The assistant could not answer.");
      }
      const answer = readAnswer(data);
      if (!answer) {
        throw new Error("The assistant returned an unexpected answer.");
      }
      setMessages([...history, { role: "assistant", content: answer }]);
    } catch (caught) {
      setMessages((current) => current.slice(0, -1));
      setDraft(content);
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`fixed inset-0 z-[70] ${beside ? "pointer-events-none" : ""}`}>
      {beside ? null : (
        <button
          type="button"
          aria-label="Close chat"
          className="absolute inset-0 bg-night/40"
          onClick={() => setOpen(false)}
        />
      )}
      <section
        id="chat-panel"
        role="dialog"
        aria-modal={!beside}
        aria-labelledby="chat-title"
        style={beside ?? undefined}
        className={`pointer-events-auto flex flex-col bg-night text-cream ${
          beside
            ? "absolute border border-cream/15 shadow-2xl"
            : "absolute inset-0 md:inset-auto md:right-8 md:bottom-20 md:h-[min(640px,calc(100%-6rem))] md:w-[400px] md:border md:border-cream/15"
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-cream/15 px-5 py-4">
          <div>
            <h2 id="chat-title" className="font-serif text-2xl tracking-tight">
              Ask {name}
            </h2>
            <p className="mt-1 text-sm text-cream/70">{statusLine(health)}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs uppercase tracking-[0.16em] text-cream/80"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
          {messages.length === 0 ? (
            <p className="text-sm leading-relaxed text-cream/70">
              Ask about the work, the skills, or how to get in touch. Answers come from the
              content folder.
            </p>
          ) : null}
          {messages.map((message, index) => (
            <p
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-8 border border-cream/20 px-3 py-2 text-sm leading-relaxed"
                  : "mr-6 text-sm leading-relaxed text-cream/90"
              }
            >
              {message.content}
            </p>
          ))}
          {pending ? <p className="text-sm text-cream/60">Thinking…</p> : null}
          {error ? <p className="text-sm text-cream">{error}</p> : null}
          <div ref={bottomRef} />
        </div>

        <form
          className="border-t border-cream/15 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <label htmlFor="chat-draft" className="sr-only">
            Question
          </label>
          <textarea
            id="chat-draft"
            ref={inputRef}
            rows={3}
            value={draft}
            disabled={pending}
            placeholder="What have you worked on?"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-cream/40"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs tracking-[0.14em] text-cream/50 uppercase">
              {health?.model ?? "Model offline"}
            </p>
            <button
              type="submit"
              disabled={pending || draft.trim() === ""}
              className="border border-cream px-3 py-1.5 text-xs uppercase tracking-[0.16em] disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function statusLine(health: AssistantHealth | null): string {
  if (!health) {
    return "Checking the assistant…";
  }
  if (health.node === "down") {
    return "Node API is offline.";
  }
  if (health.ai === "down") {
    return "Python service is offline.";
  }
  if (health.ollama === "down") {
    return "The model is offline. Answers need it to be reachable.";
  }
  return "Answering from your portfolio content.";
}

function isHealth(value: unknown): value is AssistantHealth {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    (record.node === "ok" || record.node === "down") &&
    (record.ai === "ok" || record.ai === "down") &&
    (record.ollama === "ok" || record.ollama === "down") &&
    (typeof record.model === "string" || record.model === null)
  );
}

function readError(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return null;
  }
  const error = (value as { error: unknown }).error;
  return typeof error === "string" ? error : null;
}

function readAnswer(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("message" in value)) {
    return null;
  }
  const message = (value as { message: unknown }).message;
  if (typeof message !== "object" || message === null || !("content" in message)) {
    return null;
  }
  const content = (message as { content: unknown }).content;
  return typeof content === "string" ? content : null;
}
