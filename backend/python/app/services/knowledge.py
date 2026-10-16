import json
from pathlib import Path

from app.core.config import settings
from app.core.errors import ServiceError


class Knowledge:
    def __init__(self) -> None:
        self._stamp: tuple[int, ...] | None = None
        self._prompt = ""

    def system_prompt(self) -> str:
        directory = settings.resolved_content_dir
        try:
            stamp = tuple(path.stat().st_mtime_ns for path in self._files(directory))
            if stamp != self._stamp:
                self._prompt = self._build(directory)
                self._stamp = stamp
        except (OSError, json.JSONDecodeError, KeyError, TypeError) as exc:
            raise ServiceError("Portfolio content could not be read.", 500) from exc
        return self._prompt

    def _files(self, directory: Path) -> list[Path]:
        return [
            directory / "profile.json",
            directory / "projects.json",
            directory / "skills.json",
        ]

    def _read(self, path: Path) -> object:
        return json.loads(path.read_text(encoding="utf-8"))

    def _build(self, directory: Path) -> str:
        profile = self._read(directory / "profile.json")
        projects = self._read(directory / "projects.json")
        skills = self._read(directory / "skills.json")
        if not isinstance(profile, dict) or not isinstance(projects, list) or not isinstance(skills, list):
            raise TypeError("Unexpected content shape")

        name = str(profile["name"])
        role = str(profile["role"])
        lines = [
            f"You are the portfolio assistant for {name}, a {role}.",
            "Answer only with facts from the portfolio below.",
            "If a detail is missing, say you do not have it. Do not invent employers, numbers, or links.",
            "Reply in the same language the visitor uses. Keep answers short and specific.",
            "",
            "Portfolio:",
            self._format_profile(profile),
            "",
            "Projects:",
            self._format_projects(projects),
            "",
            "Skills:",
            self._format_skills(skills),
        ]
        return "\n".join(lines)

    def _format_profile(self, profile: dict[str, object]) -> str:
        about = profile["about"]
        links = profile["links"]
        if not isinstance(about, list) or not isinstance(links, list):
            raise TypeError("Unexpected profile shape")

        lines = [
            f"Name: {profile['name']}",
            f"Role: {profile['role']}",
            f"Location: {profile['location']}",
            f"Email: {profile['email']}",
            f"Phone: {profile.get('phone') or 'none'}",
            f"Availability: {profile['availability']}",
            f"Summary: {profile['summary']}",
            "About:",
        ]
        for paragraph in about:
            lines.append(f"- {paragraph}")
        points = profile.get("points")
        if isinstance(points, list) and points:
            lines.append("How he works as a developer:")
            for point in points:
                lines.append(f"- {point}")
        education = profile.get("education")
        if isinstance(education, list) and education:
            lines.append("Education:")
            for entry in education:
                if isinstance(entry, dict):
                    lines.append(f"- {entry.get('degree')}, {entry.get('school')}. {entry.get('detail')}")
        work = profile.get("work")
        if isinstance(work, list) and work:
            lines.append("Work:")
            for entry in work:
                if not isinstance(entry, dict):
                    continue
                lines.append(
                    f"- {entry.get('role')} at {entry.get('company')}, {entry.get('place')} ({entry.get('dates')})"
                )
                duties = entry.get("points")
                if isinstance(duties, list):
                    for duty in duties:
                        lines.append(f"  - {duty}")
        achievements = profile.get("achievements")
        if isinstance(achievements, list) and achievements:
            lines.append("Achievements:")
            for item in achievements:
                lines.append(f"- {item}")
        lines.append("Links:")
        for link in links:
            if not isinstance(link, dict):
                raise TypeError("Unexpected link shape")
            lines.append(f"- {link['label']}: {link['href']}")
        return "\n".join(lines)

    def _format_projects(self, projects: list[object]) -> str:
        lines: list[str] = []
        for project in projects:
            if not isinstance(project, dict):
                raise TypeError("Unexpected project shape")
            tags = project["tags"]
            if not isinstance(tags, list):
                raise TypeError("Unexpected project tags")
            href = project.get("href") or "none"
            features = project.get("features") if isinstance(project.get("features"), list) else []
            feature_text = ", ".join(str(feature) for feature in features) or "none"
            section_lines = []
            sections = project.get("sections") if isinstance(project.get("sections"), list) else []
            for section in sections:
                if not isinstance(section, dict):
                    continue
                items = section.get("items") if isinstance(section.get("items"), list) else []
                section_lines.append(
                    f"{section.get('label')}: {', '.join(str(item) for item in items)}"
                )
            extra = f" Details: {'; '.join(section_lines)}." if section_lines else ""
            shots = project.get("shots") if isinstance(project.get("shots"), list) else []
            shot_bits = [
                f"{shot.get('title')}: {shot.get('text')}"
                for shot in shots
                if isinstance(shot, dict) and shot.get("title") and shot.get("text")
            ]
            screens = f" Screens: {'; '.join(shot_bits)}." if shot_bits else ""
            lines.append(
                f"- {project['title']}: {project['summary']} "
                f"Tech stack: {', '.join(str(tag) for tag in tags)}. "
                f"Features: {feature_text}.{extra}{screens} Link: {href}"
            )
        return "\n".join(lines) if lines else "- none"

    def _format_skills(self, skills: list[object]) -> str:
        lines: list[str] = []
        for group in skills:
            if not isinstance(group, dict):
                raise TypeError("Unexpected skill group")
            items = group["items"]
            if not isinstance(items, list):
                raise TypeError("Unexpected skill items")
            detail = group.get("detail")
            extra = f" {detail}" if isinstance(detail, str) and detail.strip() else ""
            lines.append(f"- {group['label']}: {', '.join(str(item) for item in items)}.{extra}")
        return "\n".join(lines) if lines else "- none"
