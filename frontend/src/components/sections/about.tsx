import type { Profile } from "@/types/content";

export function About({ profile }: { profile: Profile }) {
  return (
    <section id="about" className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <div className="glass max-w-2xl p-6 md:p-10">
          <h2 className="title-shadow font-serif text-5xl tracking-tight md:text-6xl">About</h2>
          <div className="mt-8 max-w-xl space-y-5 text-lg leading-relaxed text-cream/85">
            {profile.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
