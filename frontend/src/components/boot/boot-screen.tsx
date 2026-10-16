"use client";

import { IBM_Plex_Mono } from "next/font/google";
import { useEffect, useState } from "react";

import { openStudio } from "@/components/scene/scroll";
import { TrackingPhoto } from "@/components/scene/tracking-photo";

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
  const dots = ".".repeat(Math.max(2, 24 - label.length));
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
  return `Hi, I am ${firstName(name)}. I am a ${role.toLowerCase()}, currently working at ${company}. I have 2 years of experience. Click the computer to see the detail of my projects.`;
}

function pickMaleVoice() {
  const voices = window.speechSynthesis.getVoices();
  const score = (voice: SpeechSynthesisVoice) => {
    const label = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();
    let value = 0;
    if (lang.startsWith("en-in")) value += 6;
    else if (lang.startsWith("en-gb")) value += 3;
    else if (lang.startsWith("en")) value += 1;
    if (/male|david|daniel|ravi|prabhat|george|mark|brian|alex/.test(label)) value += 5;
    if (/female|zira|samantha|heera|veena|susan|victoria/.test(label)) value -= 8;
    return value;
  };
  return voices.slice().sort((a, b) => score(b) - score(a))[0] ?? null;
}

export function BootScreen({ name, role, company }: { name: string; role: string; company: string }) {
  const [stage, setStage] = useState<"boot" | "talk" | "exit" | "done">("boot");
  const [visible, setVisible] = useState(1);
  const [sessionLines, setSessionLines] = useState<string[]>([]);
  const [speaking, setSpeaking] = useState(false);
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

    const synth = window.speechSynthesis;
    let started = false;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      setSpeaking(false);
      window.setTimeout(() => setStage("exit"), 700);
    };

    const speak = () => {
      if (started || finished) return;
      started = true;
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.lang = "en-IN";
      utterance.rate = 0.96;
      utterance.pitch = 0.82;
      utterance.voice = pickMaleVoice();
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = finish;
      utterance.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "interrupted") {
          started = false;
          setSpeaking(false);
          return;
        }
        finish();
      };
      synth.cancel();
      synth.speak(utterance);
      setSpeaking(true);
    };

    const unlock = () => speak();
    window.addEventListener("pointerdown", unlock, { once: true });
    const ready = window.setTimeout(speak, 200);
    const fallback = window.setTimeout(finish, 18000);
    if (synth.getVoices().length === 0) synth.addEventListener("voiceschanged", speak, { once: true });

    return () => {
      window.clearTimeout(ready);
      window.clearTimeout(fallback);
      window.removeEventListener("pointerdown", unlock);
      synth.cancel();
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
        <div className={`${mono.className} relative mx-auto flex h-full max-w-3xl flex-col justify-center px-6 py-16`}>
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.35) 3px)",
            }}
          />
          <div className="relative space-y-1 text-sm leading-6 sm:text-base">
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
        <div className="flex h-full w-full flex-col items-center justify-center px-6 text-[#f6f3ec]">
          <TrackingPhoto
            src="/profile.png"
            alt=""
            face
            className="size-44 rounded-full shadow-[0_18px_40px_rgba(0,0,0,0.45)] ring-4 ring-[#f3e2b3] sm:size-56"
          />
          <p className="mt-6 text-center text-lg font-semibold tracking-tight">{name}</p>
          <p className="mt-3 max-w-md text-center text-[15px] leading-6 text-[#f6f3ec]/85">{line}</p>
          {speaking ? null : (
            <p className="mt-3 text-center text-[12px] text-[#f3e2b3]">Tap the screen if the voice does not start.</p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setStage("exit")}
        className="absolute right-4 bottom-4 cursor-pointer rounded-full bg-[#f3e2b3] px-4 py-2 text-[12px] font-medium text-[#1c1a16]"
      >
        Skip
      </button>
    </div>
  );
}
