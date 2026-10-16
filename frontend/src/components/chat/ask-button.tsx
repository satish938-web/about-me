"use client";

import { useChat } from "@/components/chat/chat-provider";
import { useScreen } from "@/components/scene/screen-context";

export function AskButton({ name }: { name: string }) {
  const { open, setOpen } = useChat();
  const screen = useScreen();
  const first = name.split(" ")[0] ?? name;

  if (open || screen.open) return null;

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="chat-panel"
      onClick={() => setOpen(true)}
      className="group fixed right-3 bottom-16 z-[75] flex cursor-pointer items-center gap-2 rounded-full border border-[#f4efe6]/25 bg-[#1c1612]/80 py-1.5 pr-3 pl-1.5 text-left text-cream shadow-[0_16px_40px_rgba(70,32,12,0.35)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-[#e07a3d]/70 sm:right-6 sm:bottom-28 sm:gap-3 sm:py-2 sm:pr-5 sm:pl-2"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e07a3d] text-[#1c1612] shadow-[0_0_0_5px_rgba(224,122,61,0.22)]">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v7A2.5 2.5 0 0 1 16.5 15H12l-3.6 3.2c-.7.6-1.9.1-1.9-.8V15H7.5A2.5 2.5 0 0 1 5 12.5v-7Z"
          />
        </svg>
      </span>
      <span>
        <span className="block font-serif text-lg leading-none">Ask about {first}</span>
        <span className="mt-1 hidden text-[11px] tracking-wide text-cream/70 sm:block">Work, skills, and how to reach him</span>
      </span>
    </button>
  );
}
