"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CONTAINER, CRANE, COLORS } from "@/lib/constants";

/**
 * A plain object GSAP animates. The crane (and any container it is
 * carrying) reads these numbers every frame. Keeping animation state in a
 * mutable object — not React state — avoids re-rendering 60 times a second.
 */
export type CraneState = {
  x: number; // trolley position along the rail
  z: number; // depth of the gantry (rail, trolley and hook move together)
  cable: number; // cable length
  scale: number; // size of the spreader (matches the carried container)
};

/** World-space point where the spreader hangs, for a given crane state. */
export function hookPosition(c: CraneState, target = new THREE.Vector3()) {
  return target.set(c.x, CRANE.railY - CRANE.trolleyDrop - c.cable, c.z);
}

const UP = new THREE.Vector3(0, 1, 0);

export function Crane({ state }: { state: CraneState }) {
  const rail = useRef<THREE.Mesh>(null!);
  const trolley = useRef<THREE.Group>(null!);
  const cable = useRef<THREE.Mesh>(null!);
  const spreader = useRef<THREE.Group>(null!);

  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLORS.steel, roughness: 0.35, metalness: 0.35 }),
    []
  );
  const dark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8d949e", roughness: 0.4, metalness: 0.5 }),
    []
  );

  const top = useMemo(() => new THREE.Vector3(), []);
  const hook = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    // The whole gantry moves in depth, so the cable always hangs straight down.
    rail.current.position.z = state.z;
    trolley.current.position.set(state.x, CRANE.railY, state.z);

    top.set(state.x, CRANE.railY - CRANE.trolleyDrop, state.z);
    hookPosition(state, hook);

    // Stretch a unit-length cylinder between the trolley and the hook.
    dir.subVectors(hook, top);
    const len = Math.max(dir.length(), 0.001);
    cable.current.position.copy(top).addScaledVector(dir, 0.5);
    cable.current.scale.set(1, len, 1);
    cable.current.quaternion.setFromUnitVectors(UP, dir.normalize().negate());

    spreader.current.position.copy(hook);
    spreader.current.scale.setScalar(state.scale);
  });

  const span = CONTAINER.length + 0.12;

  return (
    <group>
      {/* Rail spanning the whole screen (nothing above it, as in the reference) */}
      <mesh ref={rail} material={steel} position={[0, CRANE.railY, CRANE.railZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 40, 16]} />
      </mesh>

      {/* Trolley riding on the rail */}
      <group ref={trolley}>
        <mesh material={steel} position={[0, -0.05, 0]}>
          <boxGeometry args={[0.55, 0.2, 0.32]} />
        </mesh>
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} material={dark} position={[x, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.2, 16]} />
          </mesh>
        ))}
      </group>

      {/* Cable (unit cylinder, stretched every frame) */}
      <mesh ref={cable} material={steel}>
        <cylinderGeometry args={[0.035, 0.035, 1, 8]} />
      </mesh>

      {/* Spreader: hook block, top beam and two legs that grip the container ends */}
      <group ref={spreader}>
        {/* Twin hook blocks, as on the reference crane */}
        <mesh material={steel} position={[0, 0.2, 0]}>
          <boxGeometry args={[0.34, 0.13, 0.2]} />
        </mesh>
        <mesh material={dark} position={[0, 0.12, 0]}>
          <boxGeometry args={[0.06, 0.05, 0.06]} />
        </mesh>
        <mesh material={steel} position={[0, 0.03, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.2]} />
        </mesh>
        <mesh material={steel} position={[0, -0.06, 0]}>
          <boxGeometry args={[span, 0.07, 0.16]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * (span / 2 - 0.035), -0.06, 0]}>
            <mesh material={steel} position={[0, -0.17, 0]}>
              <boxGeometry args={[0.07, 0.34, 0.16]} />
            </mesh>
            <mesh material={dark} position={[-s * 0.06, -0.31, 0]}>
              <boxGeometry args={[0.12, 0.05, 0.14]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
