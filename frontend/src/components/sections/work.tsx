import type { Project } from "@/types/content";

export function Work({ projects }: { projects: Project[] }) {
  return (
    <section id="work" className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <div className="glass max-w-3xl p-6 md:p-10">
          <div className="flex items-end justify-between gap-6">
            <h2 className="title-shadow font-serif text-5xl tracking-tight md:text-6xl">Selected work</h2>
            <p className="text-sm text-cream/70">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </p>
          </div>
          <ol className="mt-10">
            {projects.map((project, index) => (
              <li key={`${project.year}-${project.title}`} className="border-t border-cream/15 py-7">
                <p className="text-xs tracking-[0.22em] text-cream/55 uppercase">
                  {String(index + 1).padStart(2, "0")} / {project.year}
                </p>
                <h3 className="mt-2 font-serif text-3xl tracking-tight">
                  {project.href ? (
                    <a href={project.href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                      {project.title}
                    </a>
                  ) : (
                    project.title
                  )}
                </h3>
                <p className="mt-3 max-w-2xl leading-relaxed text-cream/75">{project.summary}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <li key={tag} className="border border-cream/20 px-2 py-1 text-xs tracking-[0.14em] uppercase">
                      {tag}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
