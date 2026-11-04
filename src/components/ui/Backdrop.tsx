/**
 * The giant cream "PORTFOLIO" word that sits *behind* the 3D canvas.
 *  - outer div: moved by the scroll animation
 *  - inner div: clips the letters so they can rise in during the intro
 */
export function Backdrop({ word = "PORTFOLIO" }: { word?: string }) {
  return (
    <div
      aria-hidden
      className="backdrop-word pointer-events-none absolute inset-x-0 top-[50%] z-0 flex select-none justify-center md:top-[47%]"
    >
      <div className="flex justify-center overflow-hidden">
        <p className="font-display flex text-[17.5vw] leading-[0.8] tracking-[-0.045em] whitespace-nowrap text-[color:var(--cream)]">
          {word.split("").map((ch, i) => (
            <span key={i} className="backdrop-letter inline-block">
              {ch}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
