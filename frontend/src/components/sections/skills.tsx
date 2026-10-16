import type { SkillGroup } from "@/types/content";

export function Skills({ groups }: { groups: SkillGroup[] }) {
  return (
    <section id="skills" className="min-h-[80vh]">
      <div className="mx-auto flex max-w-6xl justify-end px-5 py-24 md:px-8 md:py-32">
        <div className="glass w-full max-w-xl p-6 md:p-10">
          <h2 className="text-xs tracking-[0.28em] text-cream/60 uppercase">Skills</h2>
          <dl className="mt-8">
            {groups.map((group) => (
              <div key={group.label} className="grid gap-2 border-t border-cream/15 py-5 md:grid-cols-[140px_1fr]">
                <dt className="text-sm text-cream/60">{group.label}</dt>
                <dd className="text-lg">{group.items.join("  ·  ")}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
