import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Outfit } from "next/font/google";

import { BootScreen } from "@/components/boot/boot-screen";
import { AskButton } from "@/components/chat/ask-button";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatProvider } from "@/components/chat/chat-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { CinematicScene } from "@/components/scene/cinematic-scene";
import { ProfileScreen } from "@/components/scene/profile-screen";
import { ScreenProvider } from "@/components/scene/screen-context";
import { getContent } from "@/lib/content";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateMetadata(): Metadata {
  const { profile } = getContent();
  return {
    title: `${profile.name} — ${profile.role}`,
    description: profile.summary,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const content = getContent();
  const { profile } = content;

  return (
    <html lang="en" className={`${outfit.variable} ${instrument.variable}`}>
      <body className="h-dvh overflow-hidden bg-night font-sans text-cream antialiased">
        <ScreenProvider>
          <CinematicScene />
          <BootScreen name={profile.name} role={profile.role} company={profile.availability} />
          <ChatProvider>
            <ProfileScreen content={content} />
            <SiteHeader name={profile.name} />
            <AskButton name={profile.name} />
            {children}
            <ChatPanel name={profile.name} />
          </ChatProvider>
        </ScreenProvider>
      </body>
    </html>
  );
}
