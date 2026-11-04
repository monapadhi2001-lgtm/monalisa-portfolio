/**
 * Finishing layer over the 3D scene. The reference is flat and clean, so this
 * only adds a soft light falling from the top centre and a faint shading in
 * the bottom corners — no grain, no heavy vignette.
 */
export function CinemaOverlay() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[15]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_30%,rgba(255,255,255,0.07),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_65%,rgba(6,24,110,0.22)_100%)]" />
    </div>
  );
}
