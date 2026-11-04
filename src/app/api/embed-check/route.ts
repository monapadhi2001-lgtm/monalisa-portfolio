import { PROJECTS } from "@/data/projects";

/**
 * GET /api/embed-check?url=https://…
 * → { embeddable: boolean, reason?: string }
 *
 * Browsers can't tell a page whether an iframe was refused, so the server
 * fetches the site once and reads the two headers that control embedding:
 *   - X-Frame-Options: DENY / SAMEORIGIN
 *   - Content-Security-Policy: frame-ancestors …
 *
 * For safety it only checks URLs listed in data/projects.ts, so it can't be
 * used to make the server fetch arbitrary addresses.
 */

export const runtime = "nodejs";

const ALLOWED = new Set(
  PROJECTS.flatMap((p) => p.websites ?? [])
    .map((w) => w.url)
    .filter((u): u is string => !!u)
);

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url") ?? "";
  if (!ALLOWED.has(target)) {
    return Response.json({ embeddable: false, reason: "not-listed" }, { status: 400 });
  }

  try {
    const res = await fetch(target, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; PortfolioEmbedCheck/1.0)" },
    });
    // We only need the headers.
    res.body?.cancel().catch(() => {});

    const xfo = (res.headers.get("x-frame-options") ?? "").toLowerCase();
    if (xfo.includes("deny") || xfo.includes("sameorigin")) {
      return reply(false, "x-frame-options");
    }

    const csp = (res.headers.get("content-security-policy") ?? "").toLowerCase();
    const ancestors = csp
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("frame-ancestors"));
    if (ancestors) {
      const sources = ancestors.split(/\s+/).slice(1);
      const ourHost = new URL(request.url).host;
      const allowed = sources.some((s) => s === "*" || s.includes(ourHost));
      if (!allowed) return reply(false, "frame-ancestors");
    }

    return reply(true);
  } catch {
    // Unreachable site: let the browser try; the component has its own timeout.
    return reply(true, "unchecked");
  }
}

function reply(embeddable: boolean, reason?: string) {
  return Response.json(
    { embeddable, reason },
    { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
