"use client";

import { useScreen } from "@/components/scene/screen-context";

export function SiteHeader({ name }: { name: string }) {
  const { setOpen } = useScreen();

  return (
    <header className="fixed top-[max(0.75rem,env(safe-area-inset-top))] z-40 w-full text-ink md:top-12">
      <div className="mx-auto flex max-w-6xl items-center px-4 md:px-8">
        <button type="button" onClick={() => setOpen(false)} className="cursor-pointer font-serif text-lg tracking-tight sm:text-xl">
          {name}
        </button>
      </div>
    </header>
  );
}
