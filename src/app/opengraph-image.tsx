import { ImageResponse } from "next/og";
import { SITE } from "@/data/site";

/** The preview image shown when the site is shared on LinkedIn, WhatsApp, X… */
export const alt = `${SITE.name} — Portfolio`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const containers = ["#f2711c", "#e2361f", "#2342c4", "#f2b21b", "#9aa3ae"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#1b5bff", padding: 64, position: "relative" }}>
        <div style={{ display: "flex", fontSize: 30, color: "#ffffff", fontWeight: 700 }}>{SITE.wordmark}</div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 22, color: "rgba(255,255,255,0.85)", letterSpacing: 4 }}>
          {SITE.name.toUpperCase()} · PROJECT DEPOT
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, height: 10, background: "#d7dbe1", display: "flex" }} />
        <div style={{ display: "flex", position: "absolute", left: 40, right: 40, bottom: 150, fontSize: 210, fontWeight: 900, color: "#efe9dc", letterSpacing: -10, justifyContent: "center" }}>
          PORTFOLIO
        </div>
        <div style={{ display: "flex", position: "absolute", left: 90, right: 90, bottom: 60, gap: 18 }}>
          {containers.map((c) => (
            <div key={c} style={{ flex: 1, height: 120, background: c, borderRadius: 6, display: "flex" }} />
          ))}
        </div>
      </div>
    ),
    size
  );
}
