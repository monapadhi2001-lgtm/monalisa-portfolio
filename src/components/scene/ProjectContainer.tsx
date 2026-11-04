"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { CONTAINER, COLORS } from "@/lib/constants";
import { getCorrugation, makeCodeTexture, makeLabelTexture } from "@/lib/textures";
import type { ContainerSlot } from "@/data/site";

/** The parts of a container the crane animation needs to move. */
export type ContainerHandle = {
  group: THREE.Group; // whole container (position / rotation / scale)
  leftDoor: THREE.Group; // hinge pivots
  rightDoor: THREE.Group;
};

type Props = {
  /** Unique id, used for picking and by the crane. */
  id: string;
  /** Stencil text on the left door ("\n" = new line). */
  label: string;
  /** Small ID on the right door, e.g. "PD-03". */
  code: string;
  /** Paint colour. */
  color: string;
  /** Where it rests in the pile when first mounted. */
  slot: ContainerSlot;
  hovered: boolean;
  interactive: boolean;
  register: (id: string, handle: ContainerHandle | null) => void;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  children?: React.ReactNode; // content shown inside (when open)
};

const { length: L, height: H, depth: D } = CONTAINER;
const DOOR_W = L / 2 - 0.06;
const DOOR_H = H - 0.16;
const POST = 0.08;

/**
 * ProjectContainer — one procedural 20ft-style shipping container.
 *
 * Reusable: give it an id, a label, a code and a colour and it builds
 * corrugated walls, a steel frame, two hinged doors with locking bars and a
 * dark interior with a ceiling light strip. It knows nothing about cranes or
 * projects; the Depot animates it through the handle it registers.
 */
export function ProjectContainer({
  id,
  label,
  code,
  color,
  slot,
  hovered,
  interactive,
  register,
  onHover,
  onSelect,
  children,
}: Props) {
  const group = useRef<THREE.Group>(null!);
  const initialSlot = useRef(slot); // later moves are animated by the Depot
  const hoverGroup = useRef<THREE.Group>(null!);
  const leftDoor = useRef<THREE.Group>(null!);
  const rightDoor = useRef<THREE.Group>(null!);

  // Materials are created once per container and cleaned up on unmount.
  const mats = useMemo(() => {
    const base = new THREE.Color(color);
    const door = getCorrugation(12);
    const wall = getCorrugation(24);
    const common = { color: base, roughness: 0.55, metalness: 0.15 };
    return {
      door: new THREE.MeshStandardMaterial({ ...common, ...door }),
      wall: new THREE.MeshStandardMaterial({ ...common, ...wall }),
      frame: new THREE.MeshStandardMaterial({
        color: base.clone().multiplyScalar(0.78),
        roughness: 0.5,
        metalness: 0.2,
      }),
      bar: new THREE.MeshStandardMaterial({ color: "#c9cdd3", roughness: 0.35, metalness: 0.6 }),
      // Dark corrugated interior, like the inside walls in the reference.
      interior: new THREE.MeshStandardMaterial({
        color: COLORS.interior,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.BackSide,
        normalMap: wall.normalMap,
      }),
      label: new THREE.MeshStandardMaterial({
        map: makeLabelTexture(label),
        transparent: true,
        roughness: 0.6,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      code: new THREE.MeshStandardMaterial({
        map: makeCodeTexture(code),
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    };
  }, [color, label, code]);

  useEffect(
    () => () => {
      // Corrugation textures are shared between containers, so only the
      // per-container lettering textures are disposed here.
      mats.label.map?.dispose();
      mats.code.map?.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats]
  );

  // Place the container in its pile slot once, then hand our refs to the
  // parent so the crane timeline can animate them. (Position is set here,
  // not as a JSX prop, so React re-renders never fight with GSAP.)
  useLayoutEffect(() => {
    group.current.position.set(...initialSlot.current.position);
    group.current.rotation.set(...initialSlot.current.rotation);
    register(id, {
      group: group.current,
      leftDoor: leftDoor.current,
      rightDoor: rightDoor.current,
    });
    return () => register(id, null);
  }, [register, id]);

  // Hover: lift slightly and glow. `damp` gives a smooth, frame-rate independent ease.
  useFrame((_, delta) => {
    const lift = hovered && interactive ? 0.14 : 0;
    hoverGroup.current.position.y = THREE.MathUtils.damp(hoverGroup.current.position.y, lift, 10, delta);
    const glow = hovered && interactive ? 0.12 : 0;
    for (const m of [mats.door, mats.wall]) {
      m.emissive.copy(m.color);
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, glow, 10, delta);
    }
  });

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (interactive) onHover(id);
    },
    onPointerOut: () => onHover(null),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (interactive) onSelect(id);
    },
  };

  return (
    <group ref={group}>
      <group ref={hoverGroup} {...handlers}>
        {/* Shell: back wall, end walls, roof, floor */}
        <mesh material={mats.wall} position={[0, 0, -D / 2 + 0.02]} castShadow receiveShadow>
          <boxGeometry args={[L, H, 0.04]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={mats.wall} position={[s * (L / 2 - 0.02), 0, 0]} castShadow>
            <boxGeometry args={[0.04, H, D]} />
          </mesh>
        ))}
        <mesh material={mats.frame} position={[0, H / 2 - 0.025, 0]} castShadow>
          <boxGeometry args={[L, 0.05, D]} />
        </mesh>
        <mesh material={mats.frame} position={[0, -H / 2 + 0.025, 0]} receiveShadow>
          <boxGeometry args={[L, 0.05, D]} />
        </mesh>

        {/* Dark interior lining (rendered from the inside only) */}
        <mesh material={mats.interior}>
          <boxGeometry args={[L - 0.09, H - 0.09, D - 0.09]} />
        </mesh>

        {/* Steel frame: corner posts + front rails */}
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh
              key={`${sx}${sz}`}
              material={mats.frame}
              position={[sx * (L / 2 - POST / 2), 0, sz * (D / 2 - POST / 2)]}
            >
              <boxGeometry args={[POST, H, POST]} />
            </mesh>
          ))
        )}
        {[-1, 1].map((sy) => (
          <mesh key={sy} material={mats.frame} position={[0, sy * (H / 2 - POST / 2), D / 2 - POST / 2]}>
            <boxGeometry args={[L, POST, POST]} />
          </mesh>
        ))}

        {/* Left door — pivots on its left edge, swings outward */}
        <group ref={leftDoor} position={[-L / 2 + 0.06, 0, D / 2]}>
          <Door material={mats.door} bar={mats.bar} offset={DOOR_W / 2} />
          <mesh material={mats.label} position={[DOOR_W / 2, 0, 0.035]}>
            <planeGeometry args={[DOOR_W, DOOR_H]} />
          </mesh>
        </group>

        {/* Right door — pivots on its right edge */}
        <group ref={rightDoor} position={[L / 2 - 0.06, 0, D / 2]}>
          <Door material={mats.door} bar={mats.bar} offset={-DOOR_W / 2} />
          <mesh material={mats.code} position={[-0.32, -DOOR_H / 2 + 0.1, 0.035]}>
            <planeGeometry args={[0.5, 0.125]} />
          </mesh>
        </group>

        {/* Ceiling light strip (the Depot shines a warm light from here when open) */}
        <mesh position={[0, H / 2 - 0.06, 0]}>
          <boxGeometry args={[L * 0.6, 0.02, 0.05]} />
          <meshBasicMaterial color="#fff1d6" toneMapped={false} />
        </mesh>

        {children}
      </group>
    </group>
  );
}

function Door({
  material,
  bar,
  offset,
}: {
  material: THREE.Material;
  bar: THREE.Material;
  offset: number;
}) {
  return (
    <group position={[offset, 0, 0]}>
      <mesh material={material} castShadow>
        <boxGeometry args={[DOOR_W, DOOR_H, 0.04]} />
      </mesh>
      {/* Two vertical locking bars */}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} material={bar} position={[x * DOOR_W * Math.sign(offset), 0, 0.045]}>
          <cylinderGeometry args={[0.012, 0.012, DOOR_H * 0.96, 8]} />
        </mesh>
      ))}
    </group>
  );
}
