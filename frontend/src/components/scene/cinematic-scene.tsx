"use client";

import dynamic from "next/dynamic";

const Stage = dynamic(() => import("@/components/scene/stage").then((mod) => mod.Stage), {
  ssr: false,
});

export function CinematicScene() {
  return (
    <>
      <div className="fixed inset-0 z-0">
        <Stage />
      </div>
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="letterbox" aria-hidden="true" />
    </>
  );
}
