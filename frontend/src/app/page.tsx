import { Hero } from "@/components/sections/hero";
import { getContent } from "@/lib/content";

export default function Home() {
  const { profile } = getContent();

  return (
    <main>
      <Hero profile={profile} />
    </main>
  );
}
