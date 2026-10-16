"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ScreenRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type ScreenState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  rect: ScreenRect | null;
  setRect: (rect: ScreenRect) => void;
};

const ScreenContext = createContext<ScreenState | null>(null);

export function ScreenProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<ScreenRect | null>(null);
  return <ScreenContext.Provider value={{ open, setOpen, rect, setRect }}>{children}</ScreenContext.Provider>;
}

export function useScreen() {
  const value = useContext(ScreenContext);
  if (!value) {
    throw new Error("useScreen must be used inside ScreenProvider");
  }
  return value;
}
