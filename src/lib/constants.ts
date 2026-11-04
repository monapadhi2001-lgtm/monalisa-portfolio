/**
 * Every "magic number" for the 3D scene lives here, so you can tune the
 * look without digging through components. Units are three.js world units
 * (think of 1 unit ≈ 2 metres in this stylised world).
 */

/** Shipping container size. Doors sit on the long front face (+z). */
export const CONTAINER = {
  length: 3, // x
  height: 1.3, // y
  depth: 1.25, // z
  doorOpenAngle: Math.PI * 0.56, // ~100°, doors swing outward
};

/** The overhead gantry crane. */
export const CRANE = {
  railY: 4.1, // height of the horizontal rail
  railZ: 0.1, // depth of the rail
  trolleyDrop: 0.15, // distance from rail centre to the cable's top
  restCable: 0.5, // cable length when idle (spreader hangs near the top)
  spreaderGap: 0.1, // space between hook point and container roof
  startX: -6, // where the trolley parks after the intro
};

/** Where a lifted container hangs, and how big it gets. */
export const LIFT = {
  // Big and centred under the rail, like the reference (~half the screen width).
  scale: 2.3,
  get cable() {
    return CRANE.restCable + 0.05;
  },
  /** Horizontal position of the lifted container (centre on every screen). */
  x: (_layout: "wide" | "tall") => 0,
};

/** Ground plane the pile rests on. */
export const GROUND_Y = -2.9;

/** Brand colours, mirrored in globals.css. */
export const COLORS = {
  harbor: "#1b5bff", // electric blue background
  cream: "#efe9dc", // big PORTFOLIO lettering
  steel: "#d7dbe1", // crane parts
  interior: "#0b0d13",
};
