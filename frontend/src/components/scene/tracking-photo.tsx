"use client";

import { useEffect, useRef } from "react";

export function TrackingPhoto({
  src,
  alt,
  className,
  face = false,
}: {
  src: string;
  alt: string;
  className?: string;
  face?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const dx = (event.clientX - (box.left + box.width / 2)) / (window.innerWidth * 0.45);
      const dy = (event.clientY - (box.top + box.height / 2)) / (window.innerHeight * 0.45);
      const x = Math.max(-1, Math.min(1, dx));
      const y = Math.max(-1, Math.min(1, dy));
      node.style.setProperty("--look-x", x.toFixed(3));
      node.style.setProperty("--look-y", y.toFixed(3));
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={frame} className={`tracking-photo ${face ? "tracking-photo-face" : ""} ${className ?? ""}`}>
      <div className="tracking-photo-clip">
        <img
          src={src}
          alt={alt}
          style={
            face
              ? {
                  objectPosition: "42% 30%",
                  transformOrigin: "42% 30%",
                  transform:
                    "scale(1.85) translate(calc(var(--look-x) * -0.7%), calc(var(--look-y) * -0.4%))",
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
