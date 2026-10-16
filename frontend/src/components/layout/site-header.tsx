"use client";

import { useScreen } from "@/components/scene/screen-context";

export function SiteHeader({ name }: { name: string }) {
  const { setOpen } = useScreen();

  return (
    <header className="fixed top-12 z-40 w-full text-ink">
      <div className="mx-auto flex max-w-6xl items-center px-5 md:px-8">
        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer font-serif text-xl tracking-tight">
          {name}
        </button>
      </div>
    </header>
  );
}
