import type { Profile } from "@/types/content";

export function Hero({ profile }: { profile: Profile }) {
  return (
    <section id="top" className="pointer-events-none min-h-screen">
      <h1 className="sr-only">
        {profile.name}, {profile.role}
      </h1>
    </section>
  );
}
