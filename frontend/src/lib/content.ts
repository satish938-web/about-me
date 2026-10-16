import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { PortfolioContent, Profile, ProfileLink, Project, SkillGroup, Work } from "@/types/content";

function contentDirectory(): string {
  if (process.env.CONTENT_DIR) {
    return path.resolve(process.env.CONTENT_DIR);
  }
  return path.resolve(process.cwd(), "..", "content");
}

function readJson(fileName: string): unknown {
  const filePath = path.join(contentDirectory(), fileName);
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    throw new Error(`Could not read ${fileName} from ${filePath}. ${detail}`);
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function asStringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty list.`);
  }
  return value.map((item, index) => asString(item, `${label}[${index}]`));
}

function parseProfile(value: unknown): Profile {
  const record = asRecord(value, "profile.json");
  const links = record.links;
  if (!Array.isArray(links)) {
    throw new Error("profile.json links must be a list.");
  }

  const profile: Profile = {
    name: asString(record.name, "profile.name"),
    role: asString(record.role, "profile.role"),
    location: asString(record.location, "profile.location"),
    email: asString(record.email, "profile.email"),
    availability: asString(record.availability, "profile.availability"),
    summary: asString(record.summary, "profile.summary"),
    about: asStringList(record.about, "profile.about"),
    links: links.map((link, index) => parseLink(link, index)),
  };

  if (Array.isArray(record.points)) {
    profile.points = asStringList(record.points, "profile.points");
  }

  if (typeof record.phone === "string" && record.phone.trim() !== "") {
    profile.phone = record.phone.trim();
  }

  if (Array.isArray(record.education)) {
    profile.education = record.education.map((entry, index) => {
      const item = asRecord(entry, `profile.education[${index}]`);
      return {
        degree: asString(item.degree, `profile.education[${index}].degree`),
        school: asString(item.school, `profile.education[${index}].school`),
        detail: asString(item.detail, `profile.education[${index}].detail`),
      };
    });
  }

  if (Array.isArray(record.work)) {
    profile.work = record.work.map((entry, index) => parseWork(entry, index));
  }

  if (Array.isArray(record.achievements)) {
    profile.achievements = asStringList(record.achievements, "profile.achievements");
  }

  return profile;
}

function parseWork(value: unknown, index: number): Work {
  const item = asRecord(value, `profile.work[${index}]`);
  return {
    role: asString(item.role, `profile.work[${index}].role`),
    company: asString(item.company, `profile.work[${index}].company`),
    place: asString(item.place, `profile.work[${index}].place`),
    dates: asString(item.dates, `profile.work[${index}].dates`),
    points: asStringList(item.points, `profile.work[${index}].points`),
  };
}

function parseLink(value: unknown, index: number): ProfileLink {
  const record = asRecord(value, `profile.links[${index}]`);
  return {
    label: asString(record.label, `profile.links[${index}].label`),
    href: asString(record.href, `profile.links[${index}].href`),
  };
}

function parseProject(value: unknown, index: number): Project {
  const record = asRecord(value, `projects[${index}]`);
  const href = record.href;
  const image = record.image;
  const project: Project = {
    title: asString(record.title, `projects[${index}].title`),
    year: asString(record.year, `projects[${index}].year`),
    summary: asString(record.summary, `projects[${index}].summary`),
    tags: asStringList(record.tags, `projects[${index}].tags`),
    features: Array.isArray(record.features) ? asStringList(record.features, `projects[${index}].features`) : [],
  };

  if (typeof image === "string" && image.trim() !== "") {
    project.image = image.trim();
  }
  if (typeof href === "string" && href.trim() !== "") {
    project.href = href.trim();
  }
  if (Array.isArray(record.sections)) {
    project.sections = record.sections.map((section, sectionIndex) => {
      const item = asRecord(section, `projects[${index}].sections[${sectionIndex}]`);
      return {
        label: asString(item.label, `projects[${index}].sections[${sectionIndex}].label`),
        items: asStringList(item.items, `projects[${index}].sections[${sectionIndex}].items`),
      };
    });
  }
  if (Array.isArray(record.shots)) {
    project.shots = record.shots.map((shot, shotIndex) => {
      const item = asRecord(shot, `projects[${index}].shots[${shotIndex}]`);
      return {
        src: asString(item.src, `projects[${index}].shots[${shotIndex}].src`),
        title: asString(item.title, `projects[${index}].shots[${shotIndex}].title`),
        text: asString(item.text, `projects[${index}].shots[${shotIndex}].text`),
      };
    });
  }

  return project;
}

function parseProjects(value: unknown): Project[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("projects.json must be a non-empty list.");
  }
  return value.map((project, index) => parseProject(project, index));
}

function parseSkillGroup(value: unknown, index: number): SkillGroup {
  const record = asRecord(value, `skills[${index}]`);
  const detail = record.detail;
  const group: SkillGroup = {
    label: asString(record.label, `skills[${index}].label`),
    items: asStringList(record.items, `skills[${index}].items`),
  };
  if (typeof detail === "string" && detail.trim() !== "") {
    group.detail = detail.trim();
  }
  return group;
}

function parseSkills(value: unknown): SkillGroup[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("skills.json must be a non-empty list.");
  }
  return value.map((group, index) => parseSkillGroup(group, index));
}

export function getContent(): PortfolioContent {
  const directory = contentDirectory();
  if (!existsSync(directory)) {
    throw new Error(`Content folder not found at ${directory}.`);
  }

  return {
    profile: parseProfile(readJson("profile.json")),
    projects: parseProjects(readJson("projects.json")),
    skills: parseSkills(readJson("skills.json")),
  };
}
