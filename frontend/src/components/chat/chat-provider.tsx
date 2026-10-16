"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type ChatContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return <ChatContext.Provider value={{ open, setOpen }}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const value = useContext(ChatContext);
  if (!value) {
    throw new Error("useChat must be used inside ChatProvider.");
  }
  return value;
}
