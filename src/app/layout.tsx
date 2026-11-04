import type { Metadata, Viewport } from "next";
import { Archivo_Black, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Fonts are self-hosted by Next.js at build time. The CSS variables are
// used by Tailwind (see globals.css) and by the canvas lettering on the
// containers (see lib/textures.ts).
const display = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-archivo" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Your Name — Portfolio Depot",
  description: "An interactive 3D portfolio: every shipping container holds a part of my story.",
};

export const viewport: Viewport = {
  themeColor: "#1b5bff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
