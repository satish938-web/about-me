"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useChat } from "@/components/chat/chat-provider";
import { TrackingPhoto } from "@/components/scene/tracking-photo";
import { useScreen, type ScreenRect } from "@/components/scene/screen-context";
import { speakText, stopSpeaking } from "@/lib/speech";
import type { PortfolioContent } from "@/types/content";

type DeskId = "about" | "projects" | "skills" | "photos" | "contact" | "sitemap" | "now" | "drive" | "trash";
type Glyph = "folder" | "doc" | "disk" | "mail" | "trash" | "photo" | "ai";
type MenuId = "file" | "edit" | "special" | "help";

type DeskItem = {
  id: DeskId;
  label: string;
  kind: Glyph;
};

const dockOrder = ["about", "projects", "skills", "photos", "contact", "sitemap"] as const;

const dockLabels: Record<(typeof dockOrder)[number], string> = {
  about: "About",
  projects: "Projects",
  skills: "Skills",
  photos: "Photos",
  contact: "Contact",
  sitemap: "Map",
};

const dockGlyph: Record<(typeof dockOrder)[number], Glyph> = {
  about: "doc",
  projects: "folder",
  skills: "folder",
  photos: "photo",
  contact: "mail",
  sitemap: "doc",
};

const titles: Record<DeskId, string> = {
  about: "About Me",
  projects: "Projects",
  skills: "Skills",
  photos: "Photos",
  contact: "Contact",
  sitemap: "Site map",
  now: "Now.txt",
  drive: "Drive",
  trash: "Trash",
};

function placeOnGlass(rect: ScreenRect, viewportWidth: number, viewportHeight: number) {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return {
      left: rect.left,
      top: Math.max(rect.top, 16),
      width: rect.width,
      height: rect.height,
    };
  }
  if (viewportWidth < 760) {
    const pad = 8;
    return {
      left: pad,
      top: pad,
      width: Math.max(280, viewportWidth - pad * 2),
      height: Math.max(320, viewportHeight - pad * 2),
    };
  }

  const pad = 16;
  const left = Math.min(Math.max(rect.left, pad), Math.max(pad, viewportWidth - pad - 320));
  const top = Math.min(Math.max(rect.top, pad), Math.max(pad, viewportHeight - pad - 280));
  const width = Math.max(320, Math.min(rect.width, viewportWidth - pad - left));
  const height = Math.max(280, Math.min(rect.height, viewportHeight - pad - top));
  return { left, top, width, height };
}

function formatClock(date: Date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${weekday} ${time}`;
}

function speakWelcome(name: string) {
  speakText(`Welcome to ${name}'s profile`, { rate: 0.95, pitch: 1 });
}

function DeskGlyph({ kind, className = "size-5" }: { kind: Glyph; className?: string }) {
  if (kind === "folder") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow`} aria-hidden="true">
        <path d="M4 11h9l2 2h13v13H4V11Z" fill="#e2b84a" />
        <path d="M4 15h24v11H4V15Z" fill="#f3d56b" />
      </svg>
    );
  }
  if (kind === "disk") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow`} aria-hidden="true">
        <rect x="5" y="8" width="22" height="16" rx="2" fill="#d5d5d5" stroke="#7d7d7d" />
        <rect x="8" y="18" width="16" height="3" rx="0.5" fill="#8eb4d6" />
        <circle cx="22" cy="13" r="1.2" fill="#666" />
      </svg>
    );
  }
  if (kind === "mail") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow`} aria-hidden="true">
        <rect x="4" y="8" width="24" height="16" rx="2" fill="#f7f7f7" stroke="#b9b9b9" />
        <path d="M5 10.5 16 18l11-7.5" fill="none" stroke="#6f97c9" strokeWidth="1.4" />
      </svg>
    );
  }
  if (kind === "trash") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow`} aria-hidden="true">
        <path d="M11 8h10l-1 2H12L11 8Z" fill="#9a9a9a" />
        <path d="M9 11h14l-1.2 14H10.2L9 11Z" fill="#d0d0d0" stroke="#8a8a8a" />
        <path d="M13 14v8M16 14v8M19 14v8" stroke="#8a8a8a" />
      </svg>
    );
  }
  if (kind === "ai") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow`} aria-hidden="true">
        <rect x="4" y="6" width="24" height="16" rx="4" fill="#e07a3d" />
        <path d="M12 22.5 10 27l6-4.5" fill="#e07a3d" />
        <path d="M11 14h10M11 18h6" stroke="#1c1612" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "photo") {
    return (
      <svg viewBox="0 0 32 32" className={`${className} drop-shadow`} aria-hidden="true">
        <rect x="5" y="7" width="22" height="18" rx="2" fill="#d7e3f2" stroke="#9eb0c6" />
        <circle cx="12" cy="13" r="2" fill="#f0d36a" />
        <path d="M7 22l6-6 4 3 3-2 5 5H7Z" fill="#7dba8c" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className={`${className} drop-shadow`} aria-hidden="true">
      <path d="M8 4h11l6 6v18H8V4Z" fill="#fff" stroke="#c8c8c8" />
      <path d="M19 4v6h6" fill="#eee" stroke="#c8c8c8" />
      <path d="M11 16h10M11 19h10M11 22h7" stroke="#b7c3d4" />
    </svg>
  );
}

function ContactMark({ href }: { href: string }) {
  const host = href.toLowerCase();
  if (host.startsWith("tel:")) {
    return (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path
          fill="#12382c"
          d="M8.2 3.5h2.2l1.2 3.1-1.6 1a12 12 0 0 0 5.4 5.4l1-1.6 3.1 1.2v2.2c0 .8-.6 1.5-1.4 1.6A14.2 14.2 0 0 1 6.6 4.9c.1-.8.8-1.4 1.6-1.4Z"
        />
      </svg>
    );
  }
  if (host.startsWith("mailto:") || host.includes("@")) {
    return (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="#f3e2b3" />
        <path d="M4 7.5 12 13l8-5.5" fill="none" stroke="#12382c" strokeWidth="1.6" />
      </svg>
    );
  }
  if (host.includes("github.com")) {
    return (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path
          fill="#1c1a16"
          d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.8c.85 0 1.7.11 2.5.34 1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.86v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2Z"
        />
      </svg>
    );
  }
  if (host.includes("linkedin.com")) {
    return (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <rect width="24" height="24" rx="4" fill="#0a66c2" />
        <path fill="#fff" d="M7.1 9.4H4.7v9.7h2.4V9.4ZM5.9 4.9a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8ZM19.3 13.3c0-2.6-1.4-3.8-3.2-3.8-1.5 0-2.2.8-2.6 1.4V9.4H11.1c0 1.3 0 9.7 0 9.7h2.4v-5.4c0-.3 0-.6.1-.8.2-.6.7-1.2 1.6-1.2 1.1 0 1.6.9 1.6 2.1v5.3h2.5v-5.8Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="#1d5c45" strokeWidth="1.6" />
      <path d="M4 12h16M12 4c2.2 2.4 3.2 5.1 3.2 8S14.2 17.6 12 20c-2.2-2.4-3.2-5.1-3.2-8S9.8 6.4 12 4Z" fill="none" stroke="#1d5c45" strokeWidth="1.4" />
    </svg>
  );
}

function NowNote({
  profile,
  projects,
}: {
  profile: PortfolioContent["profile"];
  projects: PortfolioContent["projects"];
}) {
  const school = profile.education?.[0];
  const blocks: { title: string; body: string }[] = [
    { title: "Now", body: `${profile.role}. ${profile.location}. ${profile.summary}` },
    { title: "Company", body: profile.availability },
    ...profile.about.map((body, index) => ({ title: index === 0 ? "Work" : "", body })),
    ...(profile.work ?? []).map((job) => ({
      title: job.company,
      body: `${job.role}, ${job.place}. ${job.dates}. ${job.points[0] ?? ""}`,
    })),
    ...projects.map((project) => ({
      title: project.title,
      body: `${project.year}. ${project.summary}`,
    })),
    ...(profile.achievements ?? []).map((body, index) => ({ title: index === 0 ? "Done" : "", body })),
    ...(profile.points ?? []).map((body) => ({ title: "", body })),
    ...(school ? [{ title: "Study", body: `${school.degree}, ${school.school}. ${school.detail}` }] : []),
    { title: "Write", body: profile.email },
  ];

  return (
    <div
      className="paper-scroll min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6 text-[13px] leading-[1.45rem] text-[#1c1a16]"
      style={{
        backgroundColor: "#f7f6ef",
        backgroundImage:
          "linear-gradient(to right, transparent 0.85rem, rgba(120,160,210,0.9) 0.85rem, rgba(120,160,210,0.9) calc(0.85rem + 1px), transparent calc(0.85rem + 1px)), repeating-linear-gradient(to bottom, transparent 0, transparent 1.45rem, rgba(150,170,200,0.4) 1.45rem, rgba(150,170,200,0.4) calc(1.45rem + 1px))",
        backgroundAttachment: "local",
      }}
    >
      <div className="pl-4">
        <p className="note-line text-[15px] font-semibold" style={{ animationDelay: "40ms" }}>
          {profile.name}
          <span className="note-caret ml-1 inline-block h-4 w-px translate-y-0.5 bg-[#1d5c45]" />
        </p>
        {blocks.map((block, index) => (
          <div key={`${block.title}-${block.body}`} className="note-line mt-3" style={{ animationDelay: `${120 + index * 70}ms` }}>
            {block.title ? (
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#1d5c45] uppercase">{block.title}</p>
            ) : null}
            <p className="border-l-2 border-[#c4a15a] pl-2">{block.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Paper({ children }: { children: ReactNode }) {
  return (
    <div
      className="paper-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[13px] leading-[1.45rem] text-[#1c1a16]"
      style={{
        backgroundColor: "#f7f6ef",
        backgroundImage:
          "linear-gradient(to right, transparent 0.85rem, rgba(120,160,210,0.9) 0.85rem, rgba(120,160,210,0.9) calc(0.85rem + 1px), transparent calc(0.85rem + 1px)), repeating-linear-gradient(to bottom, transparent 0, transparent 1.45rem, rgba(150,170,200,0.4) 1.45rem, rgba(150,170,200,0.4) calc(1.45rem + 1px))",
        backgroundAttachment: "local",
      }}
    >
      <div className="pl-4">{children}</div>
    </div>
  );
}

function ProjectFolders({
  projects,
  onOpen,
}: {
  projects: PortfolioContent["projects"];
  onOpen: (title: string) => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto bg-[#ececec] p-3 min-[480px]:grid-cols-3">
      {projects.map((project) => (
        <button
          key={project.title}
          type="button"
          onClick={() => onOpen(project.title)}
          className="flex cursor-pointer flex-col items-center gap-1 rounded px-1 py-2 text-[#1c1a16] hover:bg-[#3158c9] hover:text-white"
        >
          <DeskGlyph kind="folder" />
          <span className="line-clamp-2 text-center text-[11px] leading-tight">{project.title}</span>
        </button>
      ))}
    </div>
  );
}

function siteHost(href: string) {
  return href.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function ProjectShots({ shots }: { shots: NonNullable<PortfolioContent["projects"][number]["shots"]> }) {
  const [index, setIndex] = useState(0);
  const count = shots.length;
  const shot = shots[index] ?? shots[0];

  if (!shot) return null;

  const go = (step: number) => {
    setIndex((current) => (current + step + count) % count);
  };

  return (
    <div className="px-3 pt-3">
      <div className="overflow-hidden rounded-xl border border-[#1d5c45]/15 bg-white shadow-[0_10px_24px_rgba(18,56,44,0.08)]">
        <div className="flex items-center gap-1.5 border-b border-[#1d5c45]/10 bg-[#f6f3ec] px-3 py-2">
          <span className="size-2 rounded-full bg-[#e7c3b0]" />
          <span className="size-2 rounded-full bg-[#f3e2b3]" />
          <span className="size-2 rounded-full bg-[#b7d7c8]" />
          <p className="ml-2 truncate text-[10px] tracking-wide text-[#5d6b63]">{shot.title}</p>
        </div>
        <div className="relative bg-[#f3efe6]">
          <img
            key={shot.src}
            src={shot.src}
            alt={shot.title}
            className="photo-in mx-auto max-h-72 w-full object-contain object-top"
          />
        </div>
        <div className="flex items-start justify-between gap-3 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-[#12382c]">{shot.title}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-[#3f3f3f]">{shot.text}</p>
          </div>
          <p className="shrink-0 text-[10px] tracking-wide text-[#8a6a24]">
            {index + 1} / {count}
          </p>
        </div>
      </div>
      {count > 1 ? (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous screen"
            onClick={() => go(-1)}
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#1d5c45]/15 bg-white text-[#12382c]"
          >
            ‹
          </button>
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
            {shots.map((item, itemIndex) => {
              const selected = itemIndex === index;
              return (
                <button
                  key={item.src}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  aria-label={item.title}
                  aria-current={selected ? "true" : undefined}
                  className={`shrink-0 overflow-hidden rounded-md ring-2 ${selected ? "ring-[#1d5c45]" : "ring-transparent opacity-70"}`}
                >
                  <img src={item.src} alt="" className="h-10 w-14 object-cover object-top" />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-label="Next screen"
            onClick={() => go(1)}
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#1d5c45]/15 bg-white text-[#12382c]"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ProjectDetail({
  project,
  onBack,
}: {
  project: PortfolioContent["projects"][number];
  onBack: () => void;
}) {
  return (
    <div className="paper-scroll flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f6f3ec] pb-6 text-[#1c1a16]">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1d5c45]/10 bg-[#f6f3ec]/95 px-3 py-2 backdrop-blur-sm">
        <button type="button" onClick={onBack} className="cursor-pointer text-[11px] font-medium text-[#1d5c45]">
          ← Projects
        </button>
        <p className="text-[10px] tracking-[0.16em] text-[#8a6a24] uppercase">{project.year}</p>
      </div>
      <div className="px-4 pt-4">
        <h2 className="text-[1.35rem] leading-tight font-semibold tracking-tight text-[#12382c]">{project.title}</h2>
        <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#3f3f3f]">{project.summary}</p>
        {project.href ? (
          <a
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg bg-[#12382c] px-3 py-2 text-[12px] font-semibold text-white"
          >
            Visit site
            <span className="truncate font-normal text-white/75">{siteHost(project.href)}</span>
          </a>
        ) : null}
      </div>
      {project.shots?.length ? (
        <ProjectShots shots={project.shots} />
      ) : project.image ? (
        <img src={project.image} alt="" className="mx-3 mt-3 max-h-72 w-[calc(100%-1.5rem)] rounded-xl bg-white object-contain" />
      ) : null}
      <div className="space-y-3 px-3 py-3">
        <section className="rounded-xl border border-[#1d5c45]/15 bg-white p-3">
          <h3 className="text-[10px] font-semibold tracking-[0.16em] text-[#1d5c45] uppercase">Highlights</h3>
          <ul className="mt-2 space-y-2">
            {project.features.map((feature) => (
              <li key={feature} className="flex gap-2 text-[12px] leading-4">
                <span className="mt-0.5 text-[#1d5c45]">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-[#1d5c45]/15 bg-white p-3">
          <h3 className="text-[10px] font-semibold tracking-[0.16em] text-[#1d5c45] uppercase">Stack</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <li key={tag} className="rounded-md border border-[#1d5c45]/15 bg-[#f6f3ec] px-2 py-0.5 text-[10px] text-[#12382c]">
                {tag}
              </li>
            ))}
          </ul>
        </section>
        {project.sections?.map((section) => (
          <section key={section.label} className="rounded-xl border border-[#1d5c45]/15 bg-white p-3">
            <h3 className="text-[10px] font-semibold tracking-[0.16em] text-[#1d5c45] uppercase">{section.label}</h3>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-4">
              {section.items.map((item) => (
                <li key={item} className="border-l-2 border-[#c4a15a] pl-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

const album = [
  { src: "/profile.png", label: "Portrait" },
  { src: "/photos/lab.png", label: "Computer lab" },
  { src: "/photos/lab-2.png", label: "Project day" },
  { src: "/photos/group.png", label: "With the batch" },
  { src: "/photos/bench.png", label: "Campus" },
];

function PhotoAlbum({ name }: { name: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const shot = index === null ? null : album[index];

  if (shot && index !== null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[#141210]">
        <div className="flex items-center gap-2 px-3 pt-3">
          <button
            type="button"
            onClick={() => setIndex(null)}
            className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/90 hover:bg-white/20"
          >
            ← Photos
          </button>
          <p className="min-w-0 truncate text-[11px] tracking-wide text-white/75">{shot.label}</p>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center px-3 pt-3 pb-4">
          <img
            key={shot.src}
            src={shot.src}
            alt={`${name}, ${shot.label}`}
            className="photo-in max-h-full w-auto max-w-full rounded-xl object-contain shadow-[0_16px_36px_rgba(0,0,0,0.45)] ring-1 ring-white/15"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#141210] px-3 py-3 pb-6">
      <div className="grid grid-cols-3 gap-2">
        {album.map((item, itemIndex) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setIndex(itemIndex)}
            className="photo-in overflow-hidden rounded-xl bg-white/5 text-left ring-1 ring-white/10 transition hover:ring-[#f3d56b]"
            style={{ animationDelay: `${itemIndex * 60}ms` }}
          >
            <img src={item.src} alt="" className="aspect-[3/4] w-full object-cover" />
            <span className="block truncate px-2 py-1.5 text-[11px] text-white/80">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WindowBody({
  id,
  content,
  driveLabel,
  projectTitle,
  onOpenProject,
  onOpen,
}: {
  id: DeskId;
  content: PortfolioContent;
  driveLabel: string;
  projectTitle: string | null;
  onOpenProject: (title: string | null) => void;
  onOpen: (id: DeskId) => void;
}) {
  const { profile, projects, skills } = content;

  if (id === "about") {
    const facts = [
      { value: "300+", label: "LeetCode" },
      { value: String(projects.length), label: projects.length === 1 ? "product" : "products" },
    ];

    return (
      <div className="paper-scroll flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f3efe6] text-[#1c1a16]">
        <div className="bg-[linear-gradient(145deg,#0c241c_0%,#1a5c42_48%,#c6a15a_160%)] px-4 py-4 text-[#f6f3ec]">
          <div className="flex items-center gap-3">
            <TrackingPhoto
              src="/profile.png"
              alt={profile.name}
              face
              className="size-16 shrink-0 rounded-2xl shadow-[0_10px_24px_rgba(0,0,0,0.28)] ring-2 ring-[#f3e2b3] sm:size-24"
            />
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.22em] text-[#f3e2b3] uppercase">{profile.role}</p>
              <h2 className="mt-1 text-lg leading-none font-semibold tracking-tight sm:text-[1.35rem]">{profile.name}</h2>
              <p className="mt-1.5 text-[11px] leading-4 text-[#f6f3ec]/80">{profile.availability}</p>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-5 text-[#f6f3ec]/90">{profile.summary}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 px-3 pt-3">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-xl border border-[#1d5c45]/15 bg-white px-2 py-2 text-center shadow-[0_8px_18px_rgba(18,56,44,0.08)]">
              <p className="text-[15px] font-semibold tracking-tight text-[#12382c]">{fact.value}</p>
              <p className="text-[10px] tracking-wide text-[#5d6b63] uppercase">{fact.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2 px-3 py-3">
          <section className="rounded-xl border border-[#1d5c45]/20 bg-white p-3">
            <h3 className="text-[10px] tracking-[0.18em] text-[#1d5c45] uppercase">How I work</h3>
            <ol className="mt-2 space-y-2">
              {(profile.points ?? []).map((point, index) => (
                <li key={point} className="flex gap-2.5">
                  <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${index % 2 === 0 ? "bg-[#12382c] text-[#f3e2b3]" : "bg-[#f3e2b3] text-[#5c4814]"}`}>
                    {index + 1}
                  </span>
                  <p className="text-[12px] leading-4">{point}</p>
                </li>
              ))}
            </ol>
          </section>
          {profile.education?.map((entry) => (
            <section key={entry.school} className="overflow-hidden rounded-xl border border-[#c4a15a]/40 bg-white">
              <div className="flex items-stretch">
                <div className="w-1.5 shrink-0 bg-[linear-gradient(to_bottom,#c4a15a,#8a6a24)]" />
                <div className="min-w-0 flex-1 p-3">
                  <p className="text-[10px] tracking-[0.18em] text-[#8a6a24] uppercase">Education</p>
                  <p className="mt-1 text-[15px] font-semibold">{entry.degree}</p>
                  <p className="text-[12px] leading-4 text-[#3f3f3f]">{entry.school}</p>
                  <p className="mt-2 text-[12px] leading-4">{entry.detail}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {["Computer Science", "Mathematics", "Physics"].map((subject) => (
                      <li key={subject} className="rounded-full bg-[#f3e2b3] px-2 py-0.5 text-[10px] font-medium text-[#5c4814]">
                        {subject}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
          {(profile.work ?? []).length > 0 ? (
            <section className="rounded-xl border border-[#1d5c45]/20 bg-white p-3">
              <h3 className="text-[10px] tracking-[0.18em] text-[#1d5c45] uppercase">Experience</h3>
              <ol className="mt-2 space-y-3">
                {profile.work?.map((job) => (
                  <li key={`${job.company}-${job.dates}`}>
                    <p className="text-[13px] font-semibold leading-4">{job.role}</p>
                    <p className="text-[12px] text-[#3f3f3f]">
                      {job.company}, {job.place}
                    </p>
                    <p className="text-[11px] text-[#8a6a24]">{job.dates}</p>
                    <ul className="mt-1.5 space-y-1">
                      {job.points.map((point) => (
                        <li key={point} className="text-[12px] leading-4">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          {(profile.achievements ?? []).length > 0 ? (
            <section className="rounded-xl border border-[#c4a15a]/40 bg-white p-3">
              <h3 className="text-[10px] tracking-[0.18em] text-[#8a6a24] uppercase">Achievements</h3>
              <ul className="mt-2 space-y-1.5">
                {profile.achievements?.map((item) => (
                  <li key={item} className="text-[12px] leading-4">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="rounded-xl border border-[#1d5c45]/20 bg-white p-3">
            <h3 className="text-[10px] tracking-[0.18em] text-[#1d5c45] uppercase">What I build</h3>
            <ul className="mt-2 space-y-1.5">
              {projects.map((project) => (
                <li key={project.title} className="rounded-lg bg-[#f6f3ec] px-2.5 py-2 text-[12px] font-medium">
                  {project.title}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-black/5 bg-white/80 p-3">
            <h3 className="text-[10px] tracking-[0.18em] text-[#5d6b63] uppercase">In short</h3>
            <div className="mt-2 space-y-2">
              {profile.about.map((paragraph) => (
                <p key={paragraph} className="text-[12px] leading-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (id === "projects") {
    const project = projects.find((item) => item.title === projectTitle);
    if (!project) {
      return <ProjectFolders projects={projects} onOpen={onOpenProject} />;
    }
    return <ProjectDetail project={project} onBack={() => onOpenProject(null)} />;
  }

  if (id === "skills") {
    const tones = [
      { card: "border-sky-200 bg-sky-50", title: "text-sky-800", pill: "bg-sky-600 text-white" },
      { card: "border-violet-200 bg-violet-50", title: "text-violet-800", pill: "bg-violet-600 text-white" },
      { card: "border-emerald-200 bg-emerald-50", title: "text-emerald-800", pill: "bg-emerald-600 text-white" },
      { card: "border-amber-200 bg-amber-50", title: "text-amber-800", pill: "bg-amber-500 text-[#1c1a16]" },
      { card: "border-rose-200 bg-rose-50", title: "text-rose-800", pill: "bg-rose-600 text-white" },
      { card: "border-indigo-200 bg-indigo-50", title: "text-indigo-800", pill: "bg-indigo-600 text-white" },
    ];
    return (
      <div className="paper-scroll flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f3f0ff] pb-4 text-[#1c1a16]">
        <div className="bg-[linear-gradient(135deg,#4c1d95_0%,#0369a1_55%,#ea580c_130%)] px-4 py-4 text-white">
          <p className="text-[10px] tracking-[0.2em] text-amber-200 uppercase">All-rounder</p>
          <h2 className="mt-1 text-xl leading-tight font-semibold tracking-tight">Full product, one engineer</h2>
          <p className="mt-2 max-w-xl text-[12px] leading-5 text-white/85">
            Public site, staff desk, API, calls, and AI assistants. MERN travel, CRM, and chat sit alongside the VFC products.
          </p>
        </div>
        <div className="space-y-2 px-3 py-3">
          {skills.map((group, index) => {
            const tone = tones[index % tones.length];
            return (
              <section
                key={group.label}
                className={`note-line rounded-lg border p-3 ${tone.card}`}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <h3 className={`text-[11px] font-semibold tracking-[0.14em] uppercase ${tone.title}`}>{group.label}</h3>
                {group.detail ? <p className="mt-1.5 text-[12px] leading-4">{group.detail}</p> : null}
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li key={item} className={`rounded-full px-2 py-0.5 text-[10px] ${tone.pill}`}>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  if (id === "photos") {
    return <PhotoAlbum name={profile.name} />;
  }

  if (id === "contact") {
    const rows = [
      ...(profile.phone
        ? [{ label: "Phone", href: `tel:${profile.phone.replace(/[^\d+]/g, "")}`, text: profile.phone }]
        : []),
      { label: "Email", href: `mailto:${profile.email}`, text: profile.email },
      ...profile.links.map((link) => ({ label: link.label, href: link.href, text: link.href.replace(/^https?:\/\//, "") })),
    ];
    return (
      <div className="paper-scroll flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f3efe6] text-[#1c1a16]">
        <div className="bg-[linear-gradient(145deg,#0c241c_0%,#1a5c42_48%,#c6a15a_160%)] px-4 py-4 text-[#f6f3ec]">
          <p className="text-[10px] tracking-[0.22em] text-[#f3e2b3] uppercase">Contact</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{profile.name}</h2>
          <p className="mt-1 text-[11px] leading-4 text-[#f6f3ec]/80">
            {profile.location} · {profile.availability}
          </p>
        </div>
        <ul className="space-y-2 p-3">
          {rows.map((row) => (
            <li key={row.href}>
              <a
                href={row.href}
                target={row.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={row.href.startsWith("mailto:") ? undefined : "noreferrer"}
                className="flex items-center gap-3 rounded-lg border border-[#1d5c45]/15 bg-white px-3 py-2.5 hover:border-[#1d5c45]/40"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f6f3ec]">
                  <ContactMark href={row.href} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold">{row.label}</span>
                  <span className="block truncate text-[11px] text-[#5d6b63]">{row.text}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (id === "sitemap") {
    const pages: { id: DeskId; label: string }[] = [
      { id: "about", label: "About Me" },
      { id: "projects", label: "Projects" },
      { id: "skills", label: "Skills" },
      { id: "photos", label: "Photos" },
      { id: "contact", label: "Contact" },
      { id: "now", label: "Now.txt" },
      { id: "drive", label: driveLabel },
    ];
    return (
      <Paper>
        <ul>
          {pages.map((page) => (
            <li key={page.id}>
              <button type="button" onClick={() => onOpen(page.id)} className="cursor-pointer text-[#1d4ed8] underline">
                {page.label}
              </button>
            </li>
          ))}
        </ul>
      </Paper>
    );
  }

  if (id === "now") {
    return <NowNote profile={profile} projects={projects} />;
  }

  if (id === "drive") {
    return (
      <Paper>
        <p className="font-semibold">{driveLabel}</p>
        <p>This site runs on this machine. The page, the notes, and the assistant all live here.</p>
      </Paper>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 place-items-center bg-[#f4f4f4] text-sm text-[#444]">Trash is empty.</div>
  );
}

export function ProfileScreen({ content }: { content: PortfolioContent }) {
  const { open, setOpen, rect } = useScreen();
  const { open: chatOpen, setOpen: setChatOpen } = useChat();
  const { profile } = content;
  const first = profile.name.split(" ")[0] ?? profile.name;
  const driveLabel = `${first} HD`;
  const items: DeskItem[] = [
    { id: "photos", label: "Photos", kind: "photo" },
    { id: "drive", label: driveLabel, kind: "disk" },
    { id: "sitemap", label: "Site map", kind: "doc" },
    { id: "about", label: "About Me", kind: "doc" },
    { id: "skills", label: "Skills", kind: "folder" },
    { id: "projects", label: "Projects", kind: "folder" },
    { id: "contact", label: "Contact", kind: "mail" },
    { id: "trash", label: "Trash", kind: "trash" },
    { id: "now", label: "Now.txt", kind: "doc" },
  ];
  const [active, setActive] = useState<DeskId | null>(null);
  const [maximized, setMaximized] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuId | null>(null);
  const [sound, setSound] = useState(true);
  const [clock, setClock] = useState("");
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    const measure = () => {
      const view = window.visualViewport;
      setViewport({ width: view?.width ?? window.innerWidth, height: view?.height ?? window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("screen-open", open);
    if (!open) {
      stopSpeaking();
      return;
    }

    if (soundRef.current) speakWelcome(first);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.cursor = "";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      stopSpeaking();
    };
  }, [open, setOpen, first]);

  useEffect(() => {
    if (!open) {
      setActive(null);
      setMaximized(true);
      setMinimized(false);
      setProjectTitle(null);
      setMenu(null);
    }
  }, [open]);

  function toggleSound() {
    setSound((value) => {
      const next = !value;
      if (next) speakWelcome(first);
      else stopSpeaking();
      return next;
    });
  }

  const box = rect ? placeOnGlass(rect, viewport.width, viewport.height) : null;
  const compact = box ? box.width < 720 : viewport.width < 760;
  const openProject = active === "projects" ? content.projects.find((item) => item.title === projectTitle) : undefined;
  const windowTitle = openProject
    ? openProject.title
    : active
      ? active === "drive"
        ? driveLabel
        : titles[active]
      : "";

  function openDesk(id: DeskId) {
    setProjectTitle(null);
    setMinimized(false);
    setMaximized(true);
    setActive(id);
  }

  function closeWindow() {
    if (projectTitle) {
      setProjectTitle(null);
      return;
    }
    setActive(null);
    setMinimized(false);
  }

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-500 ${
        open ? "pointer-events-auto opacity-100 delay-300" : "pointer-events-none opacity-0"
      }`}
      onClick={() => setOpen(false)}
    >
      {box ? (
      <>
      {compact ? null : (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(false);
        }}
        className="absolute z-[70] cursor-pointer rounded-full bg-white/92 px-3 py-1.5 text-[13px] text-[#1c1a16] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        style={{
          left: Math.max(16, box.left),
          top: box.top + box.height + 44 > viewport.height ? box.top + box.height - 46 : box.top + box.height + 10,
        }}
      >
        ← Back to desk {"{Esc}"}
      </button>
      )}
      <div
        className="absolute overflow-hidden text-white"
        style={box}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#241433_0%,#6d3a55_34%,#e08a62_62%,#2a1838_100%)]" />
          <div className="absolute right-0 bottom-0 left-0 h-[34%] bg-[linear-gradient(180deg,transparent,#140e1c)]" />
        </div>

        <div className="relative z-20 flex h-7 items-center justify-between gap-2 bg-black/35 px-2 text-[11px] backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-4 shrink-0 cursor-pointer place-items-center rounded-[3px] bg-white text-[9px] font-bold text-black [text-shadow:none]"
              aria-label="Back to desk"
            >
              {first.slice(0, 1)}
            </button>
            {(
              [
                ["file", "File"],
                ["edit", "Edit"],
                ["special", "Special"],
                ["help", "Help"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="cursor-pointer rounded px-1 hover:bg-white/15"
                onClick={() => setMenu((current) => (current === id ? null : id))}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={toggleSound}
              className="cursor-pointer rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-[#1c1a16] [text-shadow:none]"
            >
              {sound ? "On" : "Off"}
            </button>
            <span className="truncate">{compact ? clock.split(" ").slice(-2).join(" ") : clock}</span>
          </div>
          {menu ? (
            <div className="absolute top-6 left-7 z-40 min-w-40 border border-black/25 bg-[#f3f3f3] py-1 text-[12px] text-[#111] shadow-lg [text-shadow:none]">
              {menu === "file" ? (
                <>
                  <button
                    type="button"
                    disabled={!active}
                    onClick={() => {
                      closeWindow();
                      setMenu(null);
                    }}
                    className="block w-full cursor-pointer px-3 py-1 text-left hover:bg-[#3158c9] hover:text-white disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#111]"
                  >
                    Close window
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="block w-full cursor-pointer px-3 py-1 text-left hover:bg-[#3158c9] hover:text-white"
                  >
                    Back to desk
                  </button>
                </>
              ) : null}
              {menu === "edit" ? <p className="px-3 py-1 text-[#888]">Nothing to undo</p> : null}
              {menu === "special" ? (
                <button
                  type="button"
                  onClick={() => {
                    toggleSound();
                    setMenu(null);
                  }}
                  className="block w-full cursor-pointer px-3 py-1 text-left hover:bg-[#3158c9] hover:text-white"
                >
                  Sound {sound ? "off" : "on"}
                </button>
              ) : null}
              {menu === "help" ? <p className="px-3 py-1 leading-5">Open a file on the desktop. Esc leaves the screen.</p> : null}
            </div>
          ) : null}
        </div>

        <div className="relative z-10 flex h-[calc(100%-1.75rem)] flex-col" onClick={() => setMenu(null)}>
          <div className="relative min-h-0 flex-1">
          <div className="desk-icons absolute top-2 right-1 bottom-2 z-20 grid w-[11.5rem] grid-cols-2 content-start justify-items-center gap-x-1 gap-y-2 overflow-y-auto sm:right-3 sm:w-[13rem]">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded px-1 py-1 ${
                chatOpen ? "bg-[#3158c9]" : "hover:bg-white/10"
              }`}
            >
              <DeskGlyph kind="ai" className="size-8" />
              <span className="max-w-full text-center text-[10px] leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.85)] sm:text-[11px]">
                Ask AI
              </span>
            </button>
            {items.map((item) => {
              const selected = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openDesk(item.id)}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded px-1 py-1 ${
                    selected ? "bg-[#3158c9]" : "hover:bg-white/10"
                  }`}
                >
                  <DeskGlyph kind={item.kind} className="size-8 sm:size-8" />
                  <span className="max-w-full text-center text-[10px] leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.85)] sm:text-[11px]">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {active && !minimized ? (
            <section
              className={`window-in absolute flex flex-col overflow-hidden bg-[#e6e6e6] shadow-[0_22px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(0,0,0,0.45)] ${
                maximized
                  ? "inset-0 z-40"
                  : compact
                    ? "top-10 right-[5rem] bottom-2 left-2 z-10"
                    : "top-1.5 right-[6.4rem] bottom-2 left-2 z-10"
              }`}
            >
              <div
                className="relative flex h-10 shrink-0 items-center border-b border-[#8d8d8d] pr-[6.6rem] pl-3 text-[13px] text-[#1a1a1a]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, #f7f7f7 0px, #f7f7f7 1px, #d5d5d5 1px, #d5d5d5 3px)",
                }}
              >
                <span className="truncate font-medium">{windowTitle}</span>
                <div className="absolute top-0 right-0 flex h-full">
                  <button
                    type="button"
                    aria-label="Minimize"
                    onClick={() => setMinimized(true)}
                    className="grid w-9 cursor-pointer place-items-center border-l border-[#8d8d8d] bg-[#ececec] hover:bg-white"
                  >
                    <span className="block h-px w-3 bg-[#1a1a1a]" />
                  </button>
                  <button
                    type="button"
                    aria-label={maximized ? "Restore" : "Maximize"}
                    onClick={() => setMaximized((value) => !value)}
                    className="grid w-9 cursor-pointer place-items-center border-l border-[#8d8d8d] bg-[#ececec] hover:bg-white"
                  >
                    <span className={`block size-2.5 border border-[#1a1a1a] ${maximized ? "shadow-[-3px_-3px_0_#ececec,inset_-3px_-3px_0_#ececec]" : ""}`} />
                  </button>
                  <button
                    type="button"
                    aria-label={projectTitle ? "Back to projects" : "Close window"}
                    onClick={closeWindow}
                    className="grid w-9 cursor-pointer place-items-center border-l border-[#8d8d8d] bg-[#ececec] text-[15px] leading-none hover:bg-[#e81123] hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </div>
              <WindowBody
                id={active}
                content={content}
                driveLabel={driveLabel}
                projectTitle={projectTitle}
                onOpenProject={setProjectTitle}
                onOpen={openDesk}
              />
            </section>
          ) : null}
          </div>

          <nav className="grid shrink-0 grid-cols-7 gap-0.5 border-t border-white/15 bg-black/55 px-1 py-1 text-white backdrop-blur-md">
            {dockOrder.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (active === id && minimized) {
                    setMinimized(false);
                    return;
                  }
                  openDesk(id);
                }}
                className={`flex min-w-0 cursor-pointer flex-col items-center gap-0.5 rounded-md px-0.5 py-1 ${
                  active === id ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                <DeskGlyph kind={dockGlyph[id]} className="size-5" />
                <span className="w-full truncate text-center text-[9px] leading-none">{dockLabels[id]}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className={`flex min-w-0 cursor-pointer flex-col items-center gap-0.5 rounded-md px-0.5 py-1 ${
                chatOpen ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <DeskGlyph kind="ai" className="size-5" />
              <span className="w-full truncate text-center text-[9px] leading-none">Ask</span>
            </button>
          </nav>
        </div>
      </div>
      </>
      ) : null}
    </div>
  );
}
