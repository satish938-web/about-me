import type { Profile } from "@/types/content";

export function Contact({ profile }: { profile: Profile }) {
  return (
    <section id="contact" className="flex min-h-screen items-end">
      <div className="mx-auto w-full max-w-6xl px-5 pt-24 pb-20 md:px-8">
        <h2 className="text-xs tracking-[0.28em] text-cream/60 uppercase">Contact</h2>
        <a
          href={`mailto:${profile.email}`}
          className="title-shadow mt-6 block max-w-4xl font-serif text-4xl tracking-tight break-all underline-offset-4 hover:underline md:text-7xl"
        >
          {profile.email}
        </a>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/80">
          {profile.links.map((link) => (
            <li key={link.label}>
              <a href={link.href} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
