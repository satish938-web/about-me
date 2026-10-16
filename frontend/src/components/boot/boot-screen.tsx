"use client";

import { IBM_Plex_Mono } from "next/font/google";
import { useEffect, useRef, useState } from "react";

import { openStudio } from "@/components/scene/scroll";
import { TrackingPhoto } from "@/components/scene/tracking-photo";
import { speakText, stopSpeaking } from "@/lib/speech";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
});

const bootLines = [
  "Satish studio — boot",
  "workbench ................ ready",
  "project shelf ............ ready",
  "lights ................... ready",
];

function row(label: string, value: string) {
  const dots = ".".repeat(Math.max(2, 12 - label.length));
  return `${label} ${dots} ${value}`;
}

function readDevice() {
  const agent = navigator.userAgent;
  const os = /Windows/.test(agent)
    ? "Windows"
    : /Mac OS/.test(agent)
      ? "Mac"
      : /Android/.test(agent)
        ? "Android"
        : /iPhone|iPad/.test(agent)
          ? "iPhone"
          : /Linux/.test(agent)
            ? "Linux"
            : "Unknown device";
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Chrome\//.test(agent)
      ? "Chrome"
      : /Firefox\//.test(agent)
        ? "Firefox"
        : /Safari\//.test(agent)
          ? "Safari"
          : "Browser";
  return `${os} · ${browser}`;
}

function readWhen() {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

async function readPlace() {
  try {
    const response = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(2500) });
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null && "success" in data && data.success === true) {
      const record = data as { city?: unknown; region?: unknown; country?: unknown };
      const parts = [record.city, record.region, record.country].filter(
        (part): part is string => typeof part === "string" && part.length > 0,
      );
      if (parts.length > 0) return parts.join(", ");
    }
  } catch {
    // Offline. The clock zone is still useful.
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ");
}

function firstName(name: string) {
  return name.split(" ")[0] || name;
}

function spokenLine(name: string, role: string, company: string) {
  return `Hi, I am ${firstName(name)}. I am a ${role.toLowerCase()} at ${company}, since July 2026. Click the computer to see the detail of my projects.`;
}

export function BootScreen({ name, role, company }: { name: string; role: string; company: string }) {
  const [stage, setStage] = useState<"boot" | "talk" | "exit" | "done">("boot");
  const [visible, setVisible] = useState(1);
  const [sessionLines, setSessionLines] = useState<string[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const speakRef = useRef<() => void>(() => {});
  const line = spokenLine(name, role, company);

  useEffect(() => {
    const when = readWhen();
    const device = readDevice();
    setSessionLines([row("opened", when), row("device", device), row("from", "checking")]);
    let ignore = false;
    void readPlace().then((place) => {
      if (!ignore) setSessionLines([row("opened", when), row("device", device), row("from", place)]);
    });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (stage !== "boot") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || visible >= bootLines.length) {
      const timer = window.setTimeout(() => setStage("talk"), reduced ? 400 : 700);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setVisible((value) => value + 1), 380);
    return () => window.clearTimeout(timer);
  }, [stage, visible]);

  useEffect(() => {
    if (stage === "exit" || stage === "done") openStudio();
  }, [stage]);

  useEffect(() => {
    if (stage !== "exit") return;
    const timer = window.setTimeout(() => setStage("done"), 700);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage === "done") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== "talk") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const timer = window.setTimeout(() => setStage("exit"), 800);
      return () => window.clearTimeout(timer);
    }

    let playing = false;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      setSpeaking(false);
      window.setTimeout(() => setStage("exit"), 700);
    };

    const speak = () => {
      if (finished || playing) return;
      playing = true;
      let heard = false;
      const giveUp = window.setTimeout(() => {
        if (!heard && !finished) {
          playing = false;
          setSpeaking(false);
        }
      }, 1400);
      speakText(line, {
        rate: 0.96,
        pitch: 0.82,
        male: true,
        onstart: () => {
          heard = true;
          window.clearTimeout(giveUp);
          setSpeaking(true);
        },
        onend: () => {
          window.clearTimeout(giveUp);
          playing = false;
          finish();
        },
        onerror: (error) => {
          window.clearTimeout(giveUp);
          playing = false;
          setSpeaking(false);
          if (error === "not-allowed" || error === "interrupted" || error === "canceled") return;
          finish();
        },
      });
    };

    speakRef.current = speak;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const ready = coarse ? 0 : window.setTimeout(speak, 300);
    const fallback = window.setTimeout(finish, 24000);
    const onVoices = () => {
      if (!coarse && !playing && !finished) speak();
    };
    window.speechSynthesis?.addEventListener("voiceschanged", onVoices);

    return () => {
      if (ready) window.clearTimeout(ready);
      window.clearTimeout(fallback);
      window.speechSynthesis?.removeEventListener("voiceschanged", onVoices);
      stopSpeaking();
    };
  }, [line, stage]);

  if (stage === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[80] bg-[#031108] text-[#6dff8a] transition-opacity duration-700 ${
        stage === "exit" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} studio boot`}
    >
      {stage === "boot" ? (
        <div className={`${mono.className} relative mx-auto flex h-full max-w-3xl flex-col justify-center overflow-y-auto px-4 py-16 sm:px-6`}>
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.35) 3px)",
            }}
          />
          <div className="relative space-y-1 text-[12px] leading-5 break-words sm:text-base sm:leading-6">
            {bootLines.slice(0, visible).map((item) => (
              <p key={item}>{item}</p>
            ))}
            {visible >= bootLines.length ? sessionLines.map((item) => <p key={item}>{item}</p>) : null}
          </div>
          <p className="relative mt-4 text-sm">
            <span className="inline-block h-4 w-2 animate-pulse bg-[#6dff8a]" />
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => speakRef.current()}
          className="flex h-full w-full flex-col items-center justify-center overflow-y-auto px-5 pt-8 pb-20 text-[#f6f3ec]"
        >
          <TrackingPhoto
            src="/profile.png"
            alt=""
            face
            className="size-44 rounded-full shadow-[0_18px_40px_rgba(0,0,0,0.45)] ring-4 ring-[#f3e2b3] sm:size-56"
          />
          <p className="mt-6 text-center text-lg font-semibold tracking-tight">{name}</p>
          <p className="mt-3 max-w-md text-center text-[15px] leading-6 text-[#f6f3ec]/85">{line}</p>
          {speaking ? null : (
            <p className="mt-4 rounded-full bg-[#f3e2b3] px-4 py-2 text-[13px] font-medium text-[#1c1a16]">
              Tap to hear the introduction
            </p>
          )}
        </button>
      )}
      <button
        type="button"
        onClick={() => setStage("exit")}
        className="absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] cursor-pointer rounded-full bg-[#f3e2b3] px-4 py-2 text-[12px] font-medium text-[#1c1a16]"
      >
        Skip
      </button>
    </div>
  );
}
