/**
 * A tiny shared object the HTML side writes and the 3D side reads every
 * frame. It is deliberately NOT React state: scroll fires dozens of times a
 * second and re-rendering the whole scene for each event would be wasteful.
 */
export const heroState = {
  /** 0 at the top of the page → 1 when the hero has been scrolled past. */
  scroll: 0,
  /** 0 while loading → 1 once the intro camera move has finished. */
  intro: 0,
  /** 0 normally → 1 while a project is open (camera frames the container). */
  focus: 0,
  /** 0 → 1 while the project detail panel is open (camera makes room for it). */
  panel: 0,
};
