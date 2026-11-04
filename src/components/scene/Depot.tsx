"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import * as THREE from "three";
import { PROJECTS } from "@/data/projects";
import { slotFor, type Layout } from "@/data/site";
import { CONTAINER, CRANE, LIFT } from "@/lib/constants";
import { heroState } from "@/lib/heroState";
import { Crane, hookPosition, type CraneState } from "./Crane";
import { ProjectContainer, type ContainerHandle } from "./ProjectContainer";
import { ContainerContent } from "./ContainerContent";

export type Phase = "idle" | "fetching" | "open" | "closing";

type Props = {
  /** Which container the UI wants open (null = none). */
  requestedId: string | null;
  /** The container that is currently open (drives the content fade). */
  openId: string | null;
  phase: Phase;
  hoveredId: string | null;
  /** Pile arrangement for the current screen shape. */
  layout: Layout;
  /** Becomes true when the loading screen leaves — starts the intro. */
  started: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onPhaseChange: (phase: Phase, id: string | null) => void;
  /** "Explore project" inside the open container → open the detail panel. */
  onExplore: () => void;
  /** "Close" inside the open container. */
  onCloseContainer: () => void;
};

// Let a new tween take over properties an older tween is still animating
// (e.g. clicking a container while the intro is still playing).
gsap.defaults({ overwrite: "auto" });

const byId = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));

/** Cable length needed for the hook to reach a container resting at `y`. */
function cableToReach(y: number) {
  return CRANE.railY - CRANE.trolleyDrop - (y + CONTAINER.height / 2 + CRANE.spreaderGap);
}

/**
 * The depot = the pile of containers + the crane, and the choreography
 * between them. Each "fetch" is one GSAP timeline:
 *   trolley slides over → cable lowers → grab → lift & straighten → doors open.
 * Closing plays the reverse journey and puts the container back in the pile.
 */
export function Depot({
  requestedId,
  openId,
  phase,
  hoveredId,
  layout,
  started,
  onHover,
  onSelect,
  onPhaseChange,
  onExplore,
  onCloseContainer,
}: Props) {
  const root = useRef<THREE.Group>(null!);
  const handles = useRef(new Map<string, ContainerHandle>());
  const crane = useRef<CraneState>({ x: CRANE.startX, z: CRANE.railZ, cable: CRANE.restCable, scale: 1 }).current;
  const carried = useRef<string | null>(null); // container hanging from the hook
  const busy = useRef(false);
  const current = useRef<string | null>(null); // container that is lifted/open
  const pending = useRef<string | null | undefined>(undefined);
  const phaseCb = useRef(onPhaseChange);
  phaseCb.current = onPhaseChange;
  const layoutRef = useRef(layout);
  const lamp = useRef<THREE.PointLight>(null!); // warm light inside the open container
  const initialLayout = useRef(layout).current;

  /** Resting slot of a container in the *current* layout. */
  const slotOf = useCallback((id: string) => slotFor(byId[id], layoutRef.current), []);

  const register = useCallback((id: string, handle: ContainerHandle | null) => {
    if (handle) handles.current.set(id, handle);
    else handles.current.delete(id);
  }, []);

  const canPick = started && (phase === "idle" || phase === "open");
  useCursor(!!hoveredId && canPick && hoveredId !== openId);

  // ---- Intro: containers drop into the pile, trolley rolls in ---------------
  useGSAP(
    () => {
      if (!started) return;
      const tl = gsap.timeline({ delay: 0.25 });
      PROJECTS.forEach((s, i) => {
        const h = handles.current.get(s.id);
        if (!h) return;
        const at = 0.15 + i * 0.11;
        tl.from(h.group.position, { y: "+=9", duration: 0.8, ease: "power2.in" }, at);
        tl.from(h.group.rotation, { z: `+=${i % 2 ? 0.45 : -0.45}`, duration: 1, ease: "power2.out" }, at);
        // Tiny "thud" when it lands.
        tl.to(h.group.position, { y: "-=0.06", duration: 0.08, yoyo: true, repeat: 1, ease: "power1.out" }, at + 0.8);
      });
      tl.from(crane, { x: -16, duration: 1.8, ease: "power3.out" }, 0.5);
    },
    { dependencies: [started] }
  );

  // ---- Screen shape changed: slide resting containers to their new slots ----
  useEffect(() => {
    if (layoutRef.current === layout) return;
    layoutRef.current = layout;
    PROJECTS.forEach((s) => {
      if (s.id === current.current) return; // the lifted one is put back by its own timeline
      const h = handles.current.get(s.id);
      if (!h) return;
      const slot = slotFor(s, layout);
      gsap.to(h.group.position, { x: slot.position[0], y: slot.position[1], z: slot.position[2], duration: 0.9, ease: "power3.inOut" });
      gsap.to(h.group.rotation, { x: slot.rotation[0], y: slot.rotation[1], z: slot.rotation[2], duration: 0.9 });
    });
  }, [layout]);

  // ---- Every frame: carried container follows the hook; scroll tilts the depot
  const hook = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const s = heroState.scroll;
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, s * -0.32, 4, delta);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, s * -0.9, 4, delta);

    if (!carried.current) return;
    const h = handles.current.get(carried.current);
    if (!h) return;
    hookPosition(crane, hook);
    const drop = (CONTAINER.height / 2 + CRANE.spreaderGap) * crane.scale;
    h.group.position.set(hook.x, hook.y - drop, hook.z);
    h.group.scale.setScalar(crane.scale);
    lamp.current.position.set(hook.x, hook.y - drop + 0.3 * crane.scale, hook.z + 0.2);
  });

  // ---- Timelines -------------------------------------------------------------
  const fetchContainer = useCallback(
    (id: string, done: () => void) => {
      const h = handles.current.get(id);
      if (!h || !byId[id]) return done();
      const [x, y, z] = slotOf(id).position;
      const grab = cableToReach(y);
      phaseCb.current("fetching", id);

      gsap
        .timeline({ onComplete: done })
        .to(crane, { x, z, duration: 0.45 + Math.abs(crane.x - x) * 0.07, ease: "power2.inOut" })
        .to(crane, { cable: grab, duration: 0.6, ease: "power2.in" })
        .add(() => {
          carried.current = id;
        })
        .to(crane, { cable: grab - 0.35, duration: 0.4, ease: "power2.out" })
        .to(h.group.rotation, { x: 0, y: 0, z: 0, duration: 0.5, ease: "power2.out" }, "<")
        // Lift and swing into the spotlight while the camera moves in.
        .to(crane, { x: LIFT.x(layoutRef.current), z: CRANE.railZ, cable: LIFT.cable, scale: LIFT.scale, duration: 1.3, ease: "power3.inOut" })
        .to(heroState, { focus: 1, duration: 1.6, ease: "power3.inOut" }, "<0.15")
        // A beat of stillness, then the doors swing open and light spills out.
        .to(h.leftDoor.rotation, { y: -CONTAINER.doorOpenAngle, duration: 1.0, ease: "back.out(1.5)" }, "+=0.1")
        .to(h.rightDoor.rotation, { y: CONTAINER.doorOpenAngle, duration: 1.0, ease: "back.out(1.5)" }, "<0.1")
        .to(lamp.current, { intensity: 5, duration: 0.8, ease: "power2.out" }, "<0.1")
        .add(() => phaseCb.current("open", id), "-=0.55");
    },
    [crane, slotOf]
  );

  const returnContainer = useCallback(
    (id: string, done: () => void) => {
      const h = handles.current.get(id);
      if (!h || !byId[id]) return done();
      const slot = slotOf(id);
      const [x, y, z] = slot.position;
      const [rx, ry, rz] = slot.rotation;
      const grab = cableToReach(y);
      phaseCb.current("closing", id);

      gsap
        .timeline({ onComplete: done })
        // Wait for the detail panel to slide away, then shut the doors.
        .to(lamp.current, { intensity: 0, duration: 0.5 }, 0.35)
        .to([h.leftDoor.rotation, h.rightDoor.rotation], { y: 0, duration: 0.6, ease: "power2.inOut" }, 0.4)
        .to(heroState, { focus: 0, duration: 1.5, ease: "power3.inOut" }, 0.7)
        .to(crane, { x, z, cable: grab - 0.35, scale: 1, duration: 1.2, ease: "power3.inOut" }, 0.9)
        .to(crane, { cable: grab, duration: 0.45, ease: "power2.in" })
        .to(h.group.rotation, { x: rx, y: ry, z: rz, duration: 0.4, ease: "power2.out" }, "<0.1")
        .add(() => {
          carried.current = null;
        })
        .to(crane, { cable: CRANE.restCable, duration: 0.6, ease: "power2.out" });
    },
    [crane, slotOf]
  );

  // ---- Queue: handle one request at a time ----------------------------------
  const run = useCallback(() => {
    if (busy.current || pending.current === undefined) return;
    const target = pending.current;
    pending.current = undefined;
    if (target === current.current) return;

    busy.current = true;
    const next = () => {
      busy.current = false;
      run();
    };

    if (current.current) {
      // Put the open container back first, then fetch the new one (if any).
      const closing = current.current;
      returnContainer(closing, () => {
        current.current = null;
        if (pending.current === undefined && target) pending.current = target;
        if (!target && pending.current === undefined) phaseCb.current("idle", null);
        next();
      });
    } else if (target) {
      fetchContainer(target, () => {
        current.current = target;
        next();
      });
    } else {
      next();
    }
  }, [fetchContainer, returnContainer]);

  useEffect(() => {
    if (!started) return;
    pending.current = requestedId;
    run();
  }, [requestedId, run, started]);

  return (
    <group ref={root}>
      <Crane state={crane} />
      <pointLight ref={lamp} color="#ffd9a8" intensity={0} distance={6} decay={2} />
      {PROJECTS.map((s) => (
        <ProjectContainer
          key={s.id}
          id={s.id}
          label={s.label}
          code={s.code}
          color={s.color}
          slot={slotFor(s, initialLayout)}
          hovered={hoveredId === s.id}
          interactive={canPick && openId !== s.id}
          register={register}
          onHover={onHover}
          onSelect={onSelect}
        >
          {openId === s.id && (
            <ContainerContent project={s} visible={phase === "open"} onExplore={onExplore} onClose={onCloseContainer} />
          )}
        </ProjectContainer>
      ))}
    </group>
  );
}
