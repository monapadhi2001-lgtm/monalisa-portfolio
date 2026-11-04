import { SITE } from "@/data/site";

/** About and contact, at the bottom of the page. Text lives in data/site.ts. */
export function AboutContact() {
  const socials = SITE.socials.filter((s) => s.url);

  return (
    <footer className="relative z-10 bg-[color:var(--harbor)] px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-5xl gap-16 md:grid-cols-2">
        <section id="about" aria-labelledby="about-title" className="scroll-mt-8">
          <p className="font-mono text-[11px] tracking-[0.24em] text-white/90 uppercase">About</p>
          <h2 id="about-title" className="font-display mt-4 text-4xl leading-[0.95] text-[color:var(--cream)] md:text-5xl">
            {SITE.name}
          </h2>
          <div className="mt-6 flex max-w-[52ch] flex-col gap-4 text-[15px] leading-relaxed text-white/85">
            {SITE.about.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section id="contact" aria-labelledby="contact-title" className="scroll-mt-8">
          <p className="font-mono text-[11px] tracking-[0.24em] text-white/90 uppercase">Contact</p>
          <h2 id="contact-title" className="font-display mt-4 text-4xl leading-[0.95] text-[color:var(--cream)] md:text-5xl">
            Let&apos;s talk
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-white/85">
            Projects, roles or a question about one of the containers. Write to me:
          </p>
          <a
            href={`mailto:${SITE.email}`}
            className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-[color:var(--harbor)] transition-transform select-all hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {SITE.email}
          </a>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-5">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[14px] text-white underline-offset-4 hover:underline">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <p className="mx-auto mt-24 max-w-5xl font-mono text-[11px] tracking-[0.16em] text-white/85 uppercase">
        © {new Date().getFullYear()} {SITE.name}
      </p>
    </footer>
  );
}
