import type { Metadata, Viewport } from "next";
import { Archivo_Black, Inter, JetBrains_Mono } from "next/font/google";
import { SEO, SITE, siteUrl } from "@/data/site";
import "./globals.css";

// Fonts are self-hosted by Next.js at build time. The CSS variables are
// used by Tailwind (see globals.css) and by the canvas lettering on the
// containers (see lib/textures.ts).
const display = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-archivo", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SEO.title, template: `%s · ${SITE.name}` },
  description: SEO.description,
  keywords: SEO.keywords,
  authors: [{ name: SITE.name, url: SITE.socials[0]?.url || undefined }],
  creator: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    title: SEO.title,
    description: SEO.description,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: SEO.title, description: SEO.description },
  robots: { index: true, follow: true },
  // The Open Graph image and the favicon come from app/opengraph-image.tsx and app/icon.svg.
};

export const viewport: Viewport = {
  themeColor: "#1b5bff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Structured data so search engines understand who the site is about. */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  url: siteUrl(),
  email: `mailto:${SITE.email}`,
  sameAs: SITE.socials.map((s) => s.url).filter(Boolean),
  alumniOf: "Masters Union",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
