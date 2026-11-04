"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { GROUND_Y } from "@/lib/constants";
import { heroState } from "@/lib/heroState";
import type { Layout } from "@/data/site";
import { Depot, type Phase } from "./Depot";

type Props = {
  requestedId: string | null;
  openId: string | null;
  phase: Phase;
  hoveredId: string | null;
  started: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onPhaseChange: (phase: Phase, id: string | null) => void;
  onExplore: () => void;
  onCloseContainer: () => void;
  onBackgroundClick: () => void;
  /** Called once the first frames have rendered (used by the loading screen). */
  onReady: () => void;
};

const FOV = 35;

/**
 * The WebGL canvas. It is transparent, so the electric-blue background and
 * the giant "PORTFOLIO" word (plain HTML) show through behind the containers.
 */
export default function Experience({ onBackgroundClick, onReady, ...depotProps }: Props) {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0 }}
      shadows="soft"
      flat // no tone mapping → colours stay as bright as in the design
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 7, 34], fov: FOV, near: 0.1, far: 120 }}
      onPointerMissed={onBackgroundClick}
      onCreated={() => {
        // Wait two frames so shaders are compiled before the loader leaves.
        requestAnimationFrame(() => requestAnimationFrame(onReady));
      }}
    >
      <Scene {...depotProps} />
    </Canvas>
  );
}

function Scene(props: Omit<Props, "onBackgroundClick" | "onReady">) {
  const size = useThree((s) => s.size);
  const layout: Layout = size.width / size.height < 0.9 ? "tall" : "wide";
  const mobile = size.width < 768;

  return (
    <>
      <CameraRig layout={layout} />

      {/* Cinematic lighting: warm key from top-left, cool rim from behind, soft sky fill */}
      <hemisphereLight args={["#e3ebff", "#173aa8", 0.85]} />
      <directionalLight
        color="#fff1de"
        position={[-6, 10, 7]}
        intensity={2.3}
        castShadow
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={8}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight color="#a9c6ff" position={[7, 4, -9]} intensity={1.5} />
      <directionalLight color="#ffffff" position={[0, -2, 10]} intensity={0.25} />

      {/* Studio reflections built from light panels — nothing is downloaded */}
      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 5, 5]} scale={[10, 3, 1]} />
        <Lightformer intensity={1.2} position={[-6, 1, 3]} scale={[3, 6, 1]} color="#b9ccff" />
        <Lightformer intensity={1} position={[6, 1, 3]} scale={[3, 6, 1]} color="#ffe6c7" />
      </Environment>

      <Suspense fallback={null}>
        <Depot {...props} layout={layout} />
      </Suspense>

      <ContactShadows
        position={[0, GROUND_Y, 0]}
        scale={24}
        blur={2.6}
        far={4}
        resolution={mobile ? 256 : 512}
        opacity={0.55}
        color="#0a2470"
      />
    </>
  );
}

/**
 * Drives the camera:
 *  - intro: a slow dolly in from far away while the containers land
 *  - scroll: rises up and looks down into the pile as you scroll past
 *  - mouse: a gentle parallax that follows the pointer
 *  - focus: when a project opens, frames the big lifted container centred
 *    under the rail; when the detail panel opens, slides it to the left half
 *    (or above the bottom sheet on phones)
 *  - fit: backs off so the whole pile fits on any screen shape
 */
function CameraRig({ layout }: { layout: Layout }) {
  const { camera, size, pointer } = useThree();
  const look = useMemo(() => new THREE.Vector3(0, 0.2, 0), []);
  const smooth = useMemo(() => ({ scroll: 0 }), []);
  const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  useFrame((_, delta) => {
    const aspect = size.width / size.height;
    // Width of the scene that must stay visible (pile + a little margin).
    const needed = layout === "tall" ? 10.8 : 15.4;
    const base = THREE.MathUtils.clamp(needed / (2 * tan * aspect), 14, 40);

    smooth.scroll = THREE.MathUtils.damp(smooth.scroll, heroState.scroll, 5, delta);
    const s = smooth.scroll;
    const away = 1 - heroState.intro; // 1 before the intro, 0 after
    const f = heroState.focus;
    const parallax = (layout === "tall" ? 0.2 : 1) * (1 - f * 0.7);

    // Normal framing
    let tx = pointer.x * 0.7 * parallax * (1 - s);
    let ty = 1.2 + pointer.y * 0.35 * parallax + s * 4.2 + away * 6;
    let tz = base * (1 - s * 0.22) + away * base * 1.3;
    let ly = 0.2 - s * 1.4;
    let lx = 0;

    // Focused framing: the lifted container hangs centred under the rail
    // (centre ≈ y 1.7, about 7 units wide), like the reference.
    if (f > 0) {
      const p = heroState.panel; // detail panel open → make room for it
      let fx: number, fy: number, fz: number, flx: number, fly: number;
      if (layout === "wide") {
        fz = base * 0.96 + p * 2.2;
        const shift = p * 3.7; // container slides to the left half while the panel is open
        fx = shift + pointer.x * 0.25 * (1 - p);
        fy = 1.9 + pointer.y * 0.15 * (1 - p);
        flx = shift;
        fly = 1.25;
      } else {
        fz = THREE.MathUtils.clamp(7.8 / (2 * tan * aspect), 9, 44);
        const visH = 2 * tan * fz;
        fx = 0;
        fly = 1.7 - visH * (0.16 + p * 0.16); // container in the top third; higher still above the sheet
        fy = fly + 0.5;
        flx = 0;
      }
      tx = THREE.MathUtils.lerp(tx, fx, f);
      ty = THREE.MathUtils.lerp(ty, fy, f);
      tz = THREE.MathUtils.lerp(tz, fz, f);
      ly = THREE.MathUtils.lerp(ly, fly, f);
      lx = THREE.MathUtils.lerp(lx, flx, f);
    }

    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 2.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, ty, 2.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tz, 2.5, delta);
    look.set(lx, ly, 0);
    camera.lookAt(look);
  });

  return null;
}
