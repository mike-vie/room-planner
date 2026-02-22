'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { Group } from 'three';
import { RoundedBox, MeshTransmissionMaterial } from '@react-three/drei';
import { FurnitureDef, FurnitureShape } from '@/types';
import { useRoomStore } from '@/store/useRoomStore';
import {
  createWoodGrainTexture, createWoodNormalMap,
  createFabricWeaveTexture, createFabricNormalMap,
  createWoodRoughnessMap, createFabricRoughnessMap,
} from './textures';

interface FurnitureItem3DProps {
  id: string;
  furnitureDef: FurnitureDef;
  x: number;
  y: number;
  rotation: number;
  roomWidth: number;
  roomHeight: number;
  isSelected: boolean;
  colorOverride?: string;
  elevation?: number;
}

const SCALE = 0.01; // cm to meters

// --- Singleton textures ---
let _woodGrain: THREE.CanvasTexture | null = null;
let _woodNormal: THREE.CanvasTexture | null = null;
let _woodRoughness: THREE.CanvasTexture | null = null;
let _fabricWeave: THREE.CanvasTexture | null = null;
let _fabricNormal: THREE.CanvasTexture | null = null;
let _fabricRoughness: THREE.CanvasTexture | null = null;

function getWoodGrain() { if (!_woodGrain) _woodGrain = createWoodGrainTexture(); return _woodGrain; }
function getWoodNormal() { if (!_woodNormal) _woodNormal = createWoodNormalMap(); return _woodNormal; }
function getWoodRoughness() { if (!_woodRoughness) _woodRoughness = createWoodRoughnessMap(); return _woodRoughness; }
function getFabricWeave() { if (!_fabricWeave) _fabricWeave = createFabricWeaveTexture(); return _fabricWeave; }
function getFabricNormal() { if (!_fabricNormal) _fabricNormal = createFabricNormalMap(); return _fabricNormal; }
function getFabricRoughness() { if (!_fabricRoughness) _fabricRoughness = createFabricRoughnessMap(); return _fabricRoughness; }

// --- Color helpers ---
function darken(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// --- Material factories (props for <meshPhysicalMaterial>) ---

function woodMat(color: string, selected: boolean, lacquered = false) {
  return {
    map: getWoodGrain(),
    normalMap: getWoodNormal(),
    normalScale: new THREE.Vector2(0.2, 0.2),
    roughnessMap: getWoodRoughness(),
    color: selected ? '#60a5fa' : color,
    roughness: lacquered ? 0.35 : 0.72,
    metalness: 0.0,
    clearcoat: lacquered ? 0.6 : 0.08,
    clearcoatRoughness: lacquered ? 0.1 : 0.4,
    emissive: selected ? '#2563eb' : '#000000',
    emissiveIntensity: selected ? 0.15 : 0,
  };
}

function fabricMat(color: string, selected: boolean) {
  const c = selected ? '#60a5fa' : color;
  return {
    map: getFabricWeave(),
    normalMap: getFabricNormal(),
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughnessMap: getFabricRoughness(),
    color: c,
    roughness: 0.92,
    metalness: 0.0,
    sheen: 0.6,
    sheenRoughness: 0.65,
    sheenColor: new THREE.Color(lighten(c, 30)),
    emissive: selected ? '#2563eb' : '#000000',
    emissiveIntensity: selected ? 0.15 : 0,
  };
}

function metalMat(color: string, selected: boolean, brushed = false) {
  return {
    color: selected ? '#7ab8ff' : color,
    roughness: brushed ? 0.35 : 0.2,
    metalness: 0.9,
    ...(brushed ? { anisotropy: 0.8 } : {}),
    emissive: selected ? '#2563eb' : '#000000',
    emissiveIntensity: selected ? 0.15 : 0,
  };
}

function ceramicMat(color: string, selected: boolean) {
  return {
    color: selected ? '#60a5fa' : color,
    roughness: 0.08,
    metalness: 0.0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.05,
    transmission: 0.04,
    thickness: 0.5,
    ior: 1.52,
    emissive: selected ? '#2563eb' : '#000000',
    emissiveIntensity: selected ? 0.15 : 0,
  };
}

function plainMat(color: string, selected: boolean, roughness = 0.45, metalness = 0.0) {
  return {
    color: selected ? '#60a5fa' : color,
    roughness,
    metalness,
    emissive: selected ? '#2563eb' : '#000000',
    emissiveIntensity: selected ? 0.15 : 0,
  };
}

interface ShapeProps {
  w: number;
  d: number;
  h: number;
  color: string;
  sel: boolean;
}

// --- Shared sub-components ---

/** Cylindrical handle bar with two mounting discs at each end. */
function Handle({ position, length = 0.06, horizontal = false, sel, color = '#c0c0c0' }: {
  position: [number, number, number];
  length?: number;
  horizontal?: boolean;
  sel: boolean;
  color?: string;
}) {
  const r = 0.006;
  const discR = 0.008;
  const discH = 0.008;
  const mat = metalMat(color, sel, true);
  const rot: [number, number, number] = horizontal ? [0, 0, Math.PI / 2] : [0, 0, 0];
  return (
    <group position={position} rotation={rot}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, length, 8]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      <mesh position={[0, length / 2 + discH / 2, 0]} castShadow>
        <cylinderGeometry args={[discR, discR, discH, 8]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      <mesh position={[0, -(length / 2 + discH / 2), 0]} castShadow>
        <cylinderGeometry args={[discR, discR, discH, 8]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
    </group>
  );
}

/**
 * Curved J-shaped faucet: vertical stem → quarter-torus arc → tapered spout.
 * By default the arc curves in the +X direction.
 * Pass rotation={[0, -Math.PI/2, 0]} to make it curve toward +Z (toward viewer).
 */
function Faucet({ position, rotation, sel, color = '#b0b0b0' }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  sel: boolean;
  color?: string;
}) {
  const mat = metalMat(color, sel, true);
  const stemH = 0.08;
  const arcR = 0.05;
  // Torus rotation [PI/2, PI, 0] places arc start at (0,stemH,0) and end at (arcR, stemH-arcR, 0)
  const torusRot: [number, number, number] = [Math.PI / 2, Math.PI, 0];
  return (
    <group position={position} rotation={rotation ?? [0, 0, 0]}>
      {/* Vertical stem */}
      <mesh position={[0, stemH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, stemH, 8]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* Quarter-circle torus arc */}
      <mesh position={[arcR, stemH, 0]} rotation={torusRot} castShadow>
        <torusGeometry args={[arcR, 0.01, 8, 16, Math.PI / 2]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* Tapered spout at arc end */}
      <mesh position={[arcR, stemH - arcR - 0.025 / 2, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.008, 0.025, 8]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
    </group>
  );
}

// --- Shape builders ---
// All dimensions in meters. Origin at center-bottom of bounding box.

function WardrobeShape({ w, d, h, color, sel }: ShapeProps) {
  const t = 0.02;
  const sockelH = 0.06;
  const doorH = h - sockelH - t;
  const doorW = (w - t * 2) / 2;
  return (
    <group>
      {/* Back */}
      <mesh position={[0, h / 2, -d / 2 + t / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, h, t]} />
        <meshPhysicalMaterial {...woodMat(color, sel, true)} />
      </mesh>
      {/* Left side */}
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel, true)} />
      </mesh>
      {/* Right side */}
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel, true)} />
      </mesh>
      {/* Top */}
      <mesh position={[0, h - t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel, true)} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, sockelH + t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel, true)} />
      </mesh>
      {/* Left door */}
      <mesh position={[-doorW / 2, sockelH + t + doorH / 2, d / 2 - t / 2]} castShadow>
        <boxGeometry args={[doorW - 0.003, doorH, t]} />
        <meshPhysicalMaterial {...woodMat(lighten(color, 6), sel, true)} />
      </mesh>
      {/* Right door */}
      <mesh position={[doorW / 2, sockelH + t + doorH / 2, d / 2 - t / 2]} castShadow>
        <boxGeometry args={[doorW - 0.003, doorH, t]} />
        <meshPhysicalMaterial {...woodMat(lighten(color, 6), sel, true)} />
      </mesh>
      {/* Door gap */}
      <mesh position={[0, sockelH + t + doorH / 2, d / 2 - 0.001]} castShadow>
        <boxGeometry args={[0.004, doorH, 0.002]} />
        <meshPhysicalMaterial {...woodMat(darken(color, 40), sel, true)} />
      </mesh>
      {/* Left door handle */}
      <Handle position={[-0.02, h / 2, d / 2 + 0.012]} length={0.06} sel={sel} />
      {/* Right door handle */}
      <Handle position={[0.02, h / 2, d / 2 + 0.012]} length={0.06} sel={sel} />
      {/* Sockelleiste */}
      <mesh position={[0, sockelH / 2, d / 2 - 0.02]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.04, sockelH, 0.02]} />
        <meshPhysicalMaterial {...woodMat(darken(color, 25), sel, true)} />
      </mesh>
    </group>
  );
}

function ShelfShape({ w, d, h, color, sel, series }: ShapeProps & { series: string }) {
  const t = 0.02;
  const isKallax = series === 'KALLAX';

  if (isKallax) {
    const cols = 2;
    const rows = Math.round(h / (w / cols));
    const cellW = (w - t * (cols + 1)) / cols;
    const cellH = (h - t * (rows + 1)) / rows;

    const hPanels = Array.from({ length: rows + 1 }, (_, r) => {
      const py = t / 2 + r * (cellH + t);
      return (
        <mesh key={`h${r}`} position={[0, py, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, t, d]} />
          <meshPhysicalMaterial {...woodMat(color, sel)} />
        </mesh>
      );
    });
    const vPanels = Array.from({ length: cols + 1 }, (_, c) => {
      const px = -w / 2 + t / 2 + c * (cellW + t);
      return (
        <mesh key={`v${c}`} position={[px, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[t, h, d]} />
          <meshPhysicalMaterial {...woodMat(color, sel)} />
        </mesh>
      );
    });
    return <group>{hPanels}{vPanels}</group>;
  }

  // BILLY-style
  const shelfCount = Math.max(2, Math.round(h / 0.35));
  const shelves = Array.from({ length: shelfCount + 1 }, (_, i) => {
    const py = (i / shelfCount) * (h - t) + t / 2;
    return (
      <mesh key={`s${i}`} position={[0, py, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - t * 2, t, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
    );
  });
  return (
    <group>
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2 + 0.005]} castShadow receiveShadow>
        <boxGeometry args={[w - t * 2, h, 0.01]} />
        <meshPhysicalMaterial {...woodMat(darken(color, 10), sel)} />
      </mesh>
      {shelves}
    </group>
  );
}

function BedShape({ w, d, h, color, sel }: ShapeProps) {
  const frameH = h;
  const mattressH = 0.18;
  const headH = h + 0.35;
  const t = 0.04;
  return (
    <group>
      {/* Frame */}
      <mesh position={[0, frameH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, frameH, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      {/* Mattress — rounded, soft fabric */}
      <RoundedBox
        args={[w - 0.06, mattressH, d - 0.06]}
        radius={0.025} smoothness={4}
        position={[0, frameH + mattressH / 2, 0.02]}
        castShadow receiveShadow
      >
        <meshPhysicalMaterial {...fabricMat('#e8e4de', sel)} />
      </RoundedBox>
      {/* Headboard */}
      <mesh position={[0, headH / 2, -d / 2 + t / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, headH, t]} />
        <meshPhysicalMaterial {...woodMat(darken(color, 20), sel)} />
      </mesh>
      {/* Pillow left */}
      <RoundedBox
        args={[w * 0.38, 0.08, 0.18]}
        radius={0.03} smoothness={4}
        position={[-w * 0.22, frameH + mattressH + 0.05, -d / 2 + 0.14]}
        castShadow
      >
        <meshPhysicalMaterial {...fabricMat('#f0ece6', sel)} />
      </RoundedBox>
      {/* Pillow right */}
      <RoundedBox
        args={[w * 0.38, 0.08, 0.18]}
        radius={0.03} smoothness={4}
        position={[w * 0.22, frameH + mattressH + 0.05, -d / 2 + 0.14]}
        castShadow
      >
        <meshPhysicalMaterial {...fabricMat('#f0ece6', sel)} />
      </RoundedBox>
    </group>
  );
}

function TableShape({ w, d, h, color, sel }: ShapeProps) {
  const topT = 0.04;
  const legR = 0.02;
  const legH = h - topT;
  const inset = 0.06;
  return (
    <group>
      {/* Table top — lacquered */}
      <mesh position={[0, h - topT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topT, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel, true)} />
      </mesh>
      {[
        [-w / 2 + inset, 0, -d / 2 + inset],
        [w / 2 - inset, 0, -d / 2 + inset],
        [-w / 2 + inset, 0, d / 2 - inset],
        [w / 2 - inset, 0, d / 2 - inset],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, legH / 2, lz]} castShadow receiveShadow>
          <cylinderGeometry args={[legR, legR, legH, 8]} />
          <meshPhysicalMaterial {...woodMat(darken(color, 20), sel)} />
        </mesh>
      ))}
    </group>
  );
}

function DeskShape({ w, d, h, color, sel }: ShapeProps) {
  const topT = 0.03;
  const legH = h - topT;
  const frameW = 0.04;
  const inset = 0.08;
  return (
    <group>
      {/* Desktop — lacquered */}
      <mesh position={[0, h - topT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topT, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel, true)} />
      </mesh>
      {/* Left leg frame */}
      <mesh position={[-w / 2 + inset, legH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameW, legH, d - 0.1]} />
        <meshPhysicalMaterial {...metalMat('#707070', sel)} />
      </mesh>
      {/* Right leg frame */}
      <mesh position={[w / 2 - inset, legH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameW, legH, d - 0.1]} />
        <meshPhysicalMaterial {...metalMat('#707070', sel)} />
      </mesh>
      {/* Cross bar */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - inset * 2, 0.03, 0.03]} />
        <meshPhysicalMaterial {...metalMat('#707070', sel)} />
      </mesh>
    </group>
  );
}

function SofaShape({ w, d, h, color, sel }: ShapeProps) {
  const seatH = h * 0.45;
  const seatD = d * 0.7;
  const backH = h - seatH;
  const armW = 0.12;
  const armH = h * 0.6;
  return (
    <group>
      {/* Seat — rounded */}
      <RoundedBox
        args={[w - armW * 2, seatH, seatD]}
        radius={0.04} smoothness={4}
        position={[0, seatH / 2, d / 2 - seatD / 2]}
        castShadow receiveShadow
      >
        <meshPhysicalMaterial {...fabricMat(color, sel)} />
      </RoundedBox>
      {/* Back — rounded */}
      <RoundedBox
        args={[w - armW * 2, backH, d - seatD]}
        radius={0.035} smoothness={4}
        position={[0, seatH + backH / 2, -d / 2 + (d - seatD) / 2]}
        castShadow receiveShadow
      >
        <meshPhysicalMaterial {...fabricMat(lighten(color, 10), sel)} />
      </RoundedBox>
      {/* Left arm — rounded */}
      <RoundedBox
        args={[armW, armH, d]}
        radius={0.02} smoothness={4}
        position={[-w / 2 + armW / 2, armH / 2, 0]}
        castShadow receiveShadow
      >
        <meshPhysicalMaterial {...fabricMat(darken(color, 12), sel)} />
      </RoundedBox>
      {/* Right arm — rounded */}
      <RoundedBox
        args={[armW, armH, d]}
        radius={0.02} smoothness={4}
        position={[w / 2 - armW / 2, armH / 2, 0]}
        castShadow receiveShadow
      >
        <meshPhysicalMaterial {...fabricMat(darken(color, 12), sel)} />
      </RoundedBox>
    </group>
  );
}

function ChairShape({ w, d, h, color, sel }: ShapeProps) {
  const seatH = 0.46;
  const seatT = 0.04;
  const legR = 0.015;
  const inset = 0.04;
  const backH = h - seatH;
  const backT = 0.03;
  return (
    <group>
      <mesh position={[0, seatH, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, seatT, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, seatH + backH / 2, -d / 2 + backT / 2]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.04, backH, backT]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      {[
        [-w / 2 + inset, 0, -d / 2 + inset],
        [w / 2 - inset, 0, -d / 2 + inset],
        [-w / 2 + inset, 0, d / 2 - inset],
        [w / 2 - inset, 0, d / 2 - inset],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, seatH / 2, lz]} castShadow receiveShadow>
          <cylinderGeometry args={[legR, legR, seatH, 8]} />
          <meshPhysicalMaterial {...woodMat(darken(color, 20), sel)} />
        </mesh>
      ))}
    </group>
  );
}

function DresserShape({ w, d, h, color, sel }: ShapeProps) {
  const t = 0.02;
  const drawerCount = Math.max(2, Math.round(h / 0.2));
  const drawerH = (h - t * 2) / drawerCount;
  const gap = 0.005;
  return (
    <group>
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, h - t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2 + 0.005]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.01]} />
        <meshPhysicalMaterial {...woodMat(darken(color, 10), sel)} />
      </mesh>
      {Array.from({ length: drawerCount }).map((_, i) => {
        const py = t + drawerH * i + drawerH / 2;
        return (
          <group key={i}>
            <mesh position={[0, py, d / 2 - t / 2]} castShadow>
              <boxGeometry args={[w - t * 2 - gap * 2, drawerH - gap * 2, t]} />
              <meshPhysicalMaterial {...woodMat(lighten(color, 8), sel)} />
            </mesh>
            <Handle position={[0, py, d / 2 + 0.01]} length={0.06} horizontal sel={sel} />
          </group>
        );
      })}
    </group>
  );
}

function NightstandShape({ w, d, h, color, sel }: ShapeProps) {
  const legH = 0.12;
  const legR = 0.015;
  const bodyH = h - legH;
  const t = 0.02;
  const drawerCount = 2;
  const drawerH = (bodyH - t) / drawerCount;
  const gap = 0.004;
  const inset = 0.03;
  return (
    <group>
      {[
        [-w / 2 + inset, 0, -d / 2 + inset],
        [w / 2 - inset, 0, -d / 2 + inset],
        [-w / 2 + inset, 0, d / 2 - inset],
        [w / 2 - inset, 0, d / 2 - inset],
      ].map(([lx, , lz], i) => (
        <mesh key={`leg${i}`} position={[lx, legH / 2, lz]} castShadow receiveShadow>
          <cylinderGeometry args={[legR, legR, legH, 8]} />
          <meshPhysicalMaterial {...woodMat(darken(color, 20), sel)} />
        </mesh>
      ))}
      <mesh position={[-w / 2 + t / 2, legH + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, bodyH, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[w / 2 - t / 2, legH + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, bodyH, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, h - t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, legH + bodyH / 2, -d / 2 + 0.005]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, 0.01]} />
        <meshPhysicalMaterial {...woodMat(darken(color, 10), sel)} />
      </mesh>
      {Array.from({ length: drawerCount }).map((_, i) => {
        const py = legH + t / 2 + drawerH * i + drawerH / 2;
        return (
          <group key={i}>
            <mesh position={[0, py, d / 2 - t / 2]} castShadow>
              <boxGeometry args={[w - t * 2 - gap * 2, drawerH - gap * 2, t]} />
              <meshPhysicalMaterial {...woodMat(lighten(color, 8), sel)} />
            </mesh>
            <Handle position={[0, py, d / 2 + 0.01]} length={0.04} horizontal sel={sel} />
          </group>
        );
      })}
    </group>
  );
}

function TvUnitShape({ w, d, h, color, sel }: ShapeProps) {
  const legH = 0.06;
  const legR = 0.015;
  const bodyH = h - legH;
  const t = 0.02;
  const compartments = 3;
  const compW = (w - t * (compartments + 1)) / compartments;
  const inset = 0.06;
  return (
    <group>
      {[
        [-w / 2 + inset, 0, -d / 2 + inset],
        [w / 2 - inset, 0, -d / 2 + inset],
        [-w / 2 + inset, 0, d / 2 - inset],
        [w / 2 - inset, 0, d / 2 - inset],
      ].map(([lx, , lz], i) => (
        <mesh key={`leg${i}`} position={[lx, legH / 2, lz]} castShadow receiveShadow>
          <cylinderGeometry args={[legR, legR, legH, 8]} />
          <meshPhysicalMaterial {...metalMat('#555555', sel)} />
        </mesh>
      ))}
      {/* Top — lacquered */}
      <mesh position={[0, h - t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel, true)} />
      </mesh>
      <mesh position={[0, legH + t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel, true)} />
      </mesh>
      <mesh position={[0, legH + bodyH / 2, -d / 2 + 0.005]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, 0.01]} />
        <meshPhysicalMaterial {...woodMat(darken(color, 10), sel, true)} />
      </mesh>
      {Array.from({ length: compartments + 1 }).map((_, i) => {
        const px = -w / 2 + t / 2 + i * (compW + t);
        return (
          <mesh key={`div${i}`} position={[px, legH + bodyH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[t, bodyH, d]} />
            <meshPhysicalMaterial {...woodMat(color, sel, true)} />
          </mesh>
        );
      })}
    </group>
  );
}

function GamingDeskShape({ w, d, h, color, sel }: ShapeProps) {
  const topT = 0.025;
  const legH = h - topT;
  const legW = 0.08;
  const legD = d * 0.85;
  const inset = 0.12;
  const footW = 0.10;
  const footH = 0.015;
  const footD = d * 0.55;
  const crossH = 0.04;
  const crossW = w - inset * 2 - legW;
  const trayH = 0.02;
  const trayD = d * 0.7;
  const trayDrop = 0.06;
  const edgeGlowH = 0.008;
  const edgeGlowD = 0.003;

  return (
    <group>
      {/* Desktop surface */}
      <mesh position={[0, h - topT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topT, d]} />
        <meshPhysicalMaterial
          color={sel ? '#60a5fa' : color}
          roughness={0.35}
          metalness={0.7}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
          emissive={sel ? '#2563eb' : '#000000'}
          emissiveIntensity={sel ? 0.15 : 0}
        />
      </mesh>
      {/* Front edge accent */}
      <mesh position={[0, h - topT, d / 2 - 0.005]} castShadow>
        <boxGeometry args={[w - 0.01, 0.003, 0.01]} />
        <meshPhysicalMaterial
          color={sel ? '#60a5fa' : lighten(color, 20)}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      {/* RGB LED strip */}
      <mesh position={[0, h - topT / 2, d / 2 + edgeGlowD / 2]}>
        <boxGeometry args={[w * 0.85, edgeGlowH, edgeGlowD]} />
        <meshStandardMaterial
          color="#00ffaa"
          emissive="#00ffaa"
          emissiveIntensity={sel ? 0.3 : 0.8}
          roughness={0.2}
          metalness={0.1}
          toneMapped={false}
        />
      </mesh>
      {/* Left column leg */}
      <mesh position={[-w / 2 + inset + legW / 2, legH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[legW, legH, legD]} />
        <meshPhysicalMaterial {...metalMat(color, sel)} />
      </mesh>
      {/* Right column leg */}
      <mesh position={[w / 2 - inset - legW / 2, legH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[legW, legH, legD]} />
        <meshPhysicalMaterial {...metalMat(color, sel)} />
      </mesh>
      {/* Left foot plate */}
      <mesh position={[-w / 2 + inset + legW / 2, footH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[footW, footH, footD]} />
        <meshPhysicalMaterial {...metalMat(darken(color, 10), sel)} />
      </mesh>
      {/* Right foot plate */}
      <mesh position={[w / 2 - inset - legW / 2, footH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[footW, footH, footD]} />
        <meshPhysicalMaterial {...metalMat(darken(color, 10), sel)} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, crossH / 2 + footH, 0]} castShadow receiveShadow>
        <boxGeometry args={[crossW, crossH, 0.04]} />
        <meshPhysicalMaterial {...metalMat(color, sel)} />
      </mesh>
      {/* Cable tray bottom */}
      <mesh position={[0, h - topT - trayDrop - trayH / 2, -d * 0.05]} receiveShadow>
        <boxGeometry args={[w * 0.8, trayH, trayD]} />
        <meshPhysicalMaterial {...metalMat(darken(color, 5), sel)} />
      </mesh>
      {/* Cable tray back wall */}
      <mesh position={[0, h - topT - trayDrop / 2, -d * 0.05 - trayD / 2 + 0.005]} receiveShadow>
        <boxGeometry args={[w * 0.8, trayDrop, 0.01]} />
        <meshPhysicalMaterial {...metalMat(darken(color, 5), sel)} />
      </mesh>
      {/* Control panel */}
      <mesh position={[w / 2 - 0.2, h - topT - 0.012, d / 2 - 0.06]} castShadow>
        <boxGeometry args={[0.12, 0.01, 0.04]} />
        <meshStandardMaterial
          color={sel ? '#60a5fa' : '#2a2a2a'}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {/* Control panel LEDs */}
      {[-0.03, 0, 0.03].map((dx, i) => (
        <mesh key={`led${i}`} position={[w / 2 - 0.2 + dx, h - topT - 0.006, d / 2 - 0.06]}>
          <boxGeometry args={[0.008, 0.002, 0.008]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#88ccff"
            emissiveIntensity={0.5}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function GamingChairShape({ w, d, h, color, sel }: ShapeProps) {
  const accent = '#cc2200';
  const baseCol = '#222222';

  const seatH = 0.50;
  const seatT = 0.08;
  const seatW = w * 0.85;
  const seatD = d * 0.75;

  const backH = h - seatH - seatT;
  const backT = 0.10;
  const backW = w * 0.80;

  const headH = 0.18;
  const headW = w * 0.55;

  const postH = seatH - 0.06;
  const armPostH = seatH * 0.55;
  const armPostW = 0.03;
  const armD = 0.20;
  const armPadH = 0.04;

  const baseR = w * 0.52;
  const wheelR = 0.025;

  return (
    <group>
      {/* 5-star base */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const armLen = baseR * 0.9;
        return (
          <group key={`arm${i}`}>
            <mesh position={[Math.sin(angle) * armLen / 2, 0.015, Math.cos(angle) * armLen / 2]}
              rotation={[0, -angle, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.035, 0.025, armLen]} />
              <meshPhysicalMaterial {...metalMat(baseCol, sel)} />
            </mesh>
            <mesh position={[Math.sin(angle) * armLen * 0.92, wheelR, Math.cos(angle) * armLen * 0.92]} castShadow>
              <sphereGeometry args={[wheelR, 8, 6]} />
              <meshStandardMaterial color={sel ? '#60a5fa' : '#111111'} roughness={0.85} metalness={0.1} />
            </mesh>
          </group>
        );
      })}

      {/* Pneumatic post */}
      <mesh position={[0, postH / 2 + 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.025, postH, 10]} />
        <meshPhysicalMaterial {...metalMat('#606060', sel)} />
      </mesh>

      {/* Seat cushion — rounded */}
      <RoundedBox
        args={[seatW, seatT, seatD]}
        radius={0.02} smoothness={4}
        position={[0, seatH, 0]}
        castShadow receiveShadow
      >
        <meshPhysicalMaterial {...fabricMat(color, sel)} />
      </RoundedBox>
      {/* Seat side bolsters */}
      <mesh position={[-seatW / 2 + 0.025, seatH + seatT * 0.3, 0]} castShadow>
        <boxGeometry args={[0.05, seatT * 0.65, seatD * 0.85]} />
        <meshPhysicalMaterial {...fabricMat(accent, sel)} />
      </mesh>
      <mesh position={[seatW / 2 - 0.025, seatH + seatT * 0.3, 0]} castShadow>
        <boxGeometry args={[0.05, seatT * 0.65, seatD * 0.85]} />
        <meshPhysicalMaterial {...fabricMat(accent, sel)} />
      </mesh>

      {/* Backrest — rounded */}
      <RoundedBox
        args={[backW, backH, backT]}
        radius={0.015} smoothness={4}
        position={[0, seatH + seatT + backH / 2, -seatD / 2 + backT / 2]}
        castShadow receiveShadow
      >
        <meshPhysicalMaterial {...fabricMat(color, sel)} />
      </RoundedBox>
      {/* Back side bolsters */}
      <mesh position={[-backW / 2 + 0.025, seatH + seatT + backH * 0.45, -seatD / 2 + backT / 2]} castShadow>
        <boxGeometry args={[0.05, backH * 0.72, backT + 0.015]} />
        <meshPhysicalMaterial {...fabricMat(accent, sel)} />
      </mesh>
      <mesh position={[backW / 2 - 0.025, seatH + seatT + backH * 0.45, -seatD / 2 + backT / 2]} castShadow>
        <boxGeometry args={[0.05, backH * 0.72, backT + 0.015]} />
        <meshPhysicalMaterial {...fabricMat(accent, sel)} />
      </mesh>

      {/* Lumbar pillow — rounded */}
      <RoundedBox
        args={[backW * 0.55, backH * 0.18, 0.06]}
        radius={0.02} smoothness={4}
        position={[0, seatH + seatT + backH * 0.25, -seatD / 2 + backT + 0.03]}
        castShadow
      >
        <meshPhysicalMaterial {...fabricMat(accent, sel)} />
      </RoundedBox>

      {/* Headrest — rounded */}
      <RoundedBox
        args={[headW, headH, backT + 0.015]}
        radius={0.025} smoothness={4}
        position={[0, seatH + seatT + backH + headH / 2, -seatD / 2 + backT / 2]}
        castShadow receiveShadow
      >
        <meshPhysicalMaterial {...fabricMat(color, sel)} />
      </RoundedBox>
      {/* Headrest accent stripe */}
      <mesh position={[0, seatH + seatT + backH + headH / 2, -seatD / 2 + backT + 0.01]} castShadow>
        <boxGeometry args={[headW * 0.45, headH * 0.55, 0.018]} />
        <meshPhysicalMaterial {...fabricMat(accent, sel)} />
      </mesh>

      {/* Left armrest post */}
      <mesh position={[-seatW / 2 + 0.05, seatH - armPostH / 2, -seatD * 0.08]} castShadow receiveShadow>
        <boxGeometry args={[armPostW, armPostH, armPostW]} />
        <meshPhysicalMaterial {...metalMat(baseCol, sel)} />
      </mesh>
      {/* Left armrest pad */}
      <mesh position={[-seatW / 2 + 0.05, seatH + armPadH / 2, -seatD * 0.08]} castShadow>
        <boxGeometry args={[armD, armPadH, armPostW * 2.5]} />
        <meshStandardMaterial color={sel ? '#60a5fa' : '#2a2a2a'} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Right armrest post */}
      <mesh position={[seatW / 2 - 0.05, seatH - armPostH / 2, -seatD * 0.08]} castShadow receiveShadow>
        <boxGeometry args={[armPostW, armPostH, armPostW]} />
        <meshPhysicalMaterial {...metalMat(baseCol, sel)} />
      </mesh>
      {/* Right armrest pad */}
      <mesh position={[seatW / 2 - 0.05, seatH + armPadH / 2, -seatD * 0.08]} castShadow>
        <boxGeometry args={[armD, armPadH, armPostW * 2.5]} />
        <meshStandardMaterial color={sel ? '#60a5fa' : '#2a2a2a'} roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}

function StoveShape({ w, d, h, color, sel }: ShapeProps) {
  const topT = 0.02;
  const burnerR = w * 0.13;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...plainMat(color, sel, 0.3, 0.55)} />
      </mesh>
      <mesh position={[0, h + topT / 2, 0]}>
        <boxGeometry args={[w, topT, d]} />
        <meshStandardMaterial {...plainMat('#1a1a1a', sel, 0.25, 0.5)} />
      </mesh>
      {([[-w * 0.22, -d * 0.2], [w * 0.22, -d * 0.2], [-w * 0.22, d * 0.2], [w * 0.22, d * 0.2]] as [number, number][]).map(([bx, bz], i) => (
        <mesh key={i} position={[bx, h + topT + 0.003, bz]}>
          <cylinderGeometry args={[burnerR, burnerR, 0.006, 16]} />
          <meshStandardMaterial {...plainMat('#111111', sel, 0.4, 0.3)} />
        </mesh>
      ))}
      {([-w * 0.3, -w * 0.1, w * 0.1, w * 0.3] as number[]).map((kx, i) => (
        <mesh key={i} position={[kx, h * 0.85, d / 2 + 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.025, 12]} />
          <meshStandardMaterial {...plainMat('#333333', sel, 0.5, 0.3)} />
        </mesh>
      ))}
    </group>
  );
}

function FridgeShape({ w, d, h, color, sel }: ShapeProps) {
  const freezerH = h * 0.28;
  return (
    <group>
      {/* Body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...plainMat(color, sel)} />
      </mesh>
      {/* Freezer divider */}
      <mesh position={[0, h - freezerH, d / 2 - 0.005]}>
        <boxGeometry args={[w - 0.01, 0.008, 0.012]} />
        <meshStandardMaterial {...plainMat(darken(color, 30), sel)} />
      </mesh>
      {/* Main door handle — brushed metal, vertical bar */}
      <Handle position={[w / 2 - 0.04, h * 0.5, d / 2 + 0.02]} length={h * 0.28} sel={sel} />
      {/* Freezer door handle */}
      <Handle position={[w / 2 - 0.04, h - freezerH * 0.5, d / 2 + 0.02]} length={0.08} sel={sel} />
    </group>
  );
}

function KitchenSinkShape({ w, d, h, color, sel }: ShapeProps) {
  const basinDepth = 0.08;
  const basinW = w * 0.42;
  const wallT = 0.015;
  return (
    <group>
      {/* Counter body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...plainMat(color, sel, 0.35, 0.45)} />
      </mesh>
      {/* Left basin */}
      <mesh position={[-w * 0.22, h - basinDepth / 2 + 0.005, 0]}>
        <boxGeometry args={[basinW - wallT * 2, basinDepth, d * 0.75 - wallT * 2]} />
        <meshStandardMaterial {...plainMat(darken(color, 25), sel, 0.2, 0.6)} />
      </mesh>
      {/* Right basin */}
      <mesh position={[w * 0.22, h - basinDepth / 2 + 0.005, 0]}>
        <boxGeometry args={[basinW - wallT * 2, basinDepth, d * 0.75 - wallT * 2]} />
        <meshStandardMaterial {...plainMat(darken(color, 25), sel, 0.2, 0.6)} />
      </mesh>
      {/* Curved J-faucet — arc curves toward +Z (front of sink) */}
      <Faucet position={[0, h, -d * 0.2]} rotation={[0, -Math.PI / 2, 0]} sel={sel} color="#a0a0a0" />
    </group>
  );
}

function KitchenUnitShape({ w, d, h, color, sel }: ShapeProps) {
  const t = 0.018;
  const topT = 0.03;
  const doorCount = Math.max(1, Math.round(w / 0.6));
  const doorW = (w - t * (doorCount + 1)) / doorCount;
  const gap = 0.004;
  return (
    <group>
      {/* Body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h - topT, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      {/* Countertop */}
      <mesh position={[0, h - topT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.02, topT, d + 0.02]} />
        <meshPhysicalMaterial {...woodMat(darken(color, 15), sel)} />
      </mesh>
      {/* Cabinet doors */}
      {Array.from({ length: doorCount }).map((_, i) => {
        const px = -w / 2 + t + doorW / 2 + i * (doorW + t);
        return (
          <group key={i}>
            <mesh position={[px, (h - topT) / 2, d / 2 - t / 2]} castShadow>
              <boxGeometry args={[doorW - gap * 2, h - topT - t * 2 - gap * 2, t]} />
              <meshPhysicalMaterial {...woodMat(lighten(color, 8), sel)} />
            </mesh>
            <Handle position={[px, (h - topT) * 0.3, d / 2 + 0.01]} length={doorW * 0.5} horizontal sel={sel} />
          </group>
        );
      })}
    </group>
  );
}

function KitchenWallUnitShape({ w, d, h, color, sel }: ShapeProps) {
  const t = 0.018;
  const doorCount = Math.max(1, Math.round(w / 0.6));
  const doorW = (w - t * (doorCount + 1)) / doorCount;
  const gap = 0.004;
  return (
    <group>
      {/* Carcass */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial {...woodMat(color, sel)} />
      </mesh>
      {/* Back panel */}
      <mesh position={[0, h / 2, -d / 2 + 0.005]}>
        <boxGeometry args={[w - t * 2, h - t * 2, 0.008]} />
        <meshPhysicalMaterial {...woodMat(darken(color, 10), sel)} />
      </mesh>
      {/* Doors */}
      {Array.from({ length: doorCount }).map((_, i) => {
        const px = -w / 2 + t + doorW / 2 + i * (doorW + t);
        return (
          <group key={i}>
            <mesh position={[px, h / 2, d / 2 - t / 2]} castShadow>
              <boxGeometry args={[doorW - gap * 2, h - t * 2 - gap * 2, t]} />
              <meshPhysicalMaterial {...woodMat(lighten(color, 8), sel)} />
            </mesh>
            <Handle position={[px, h * 0.28, d / 2 + 0.01]} length={doorW * 0.5} horizontal sel={sel} />
          </group>
        );
      })}
    </group>
  );
}

function WallShelfShape({ w, d, h, color, sel }: ShapeProps) {
  const t = 0.016;
  const shelfCount = Math.max(1, Math.round(h / 0.22) - 1);
  const innerH = h - t * 2;
  const spacing = innerH / (shelfCount + 1);
  const mat = woodMat(color, sel);
  const backMat = woodMat(darken(color, 10), sel);
  return (
    <group>
      {/* Back panel */}
      <mesh position={[0, h / 2, -d / 2 + 0.005]}>
        <boxGeometry args={[w - t * 2, h - t * 2, 0.008]} />
        <meshPhysicalMaterial {...backMat} />
      </mesh>
      {/* Left side */}
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* Right side */}
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* Top */}
      <mesh position={[0, h - t / 2, 0]} castShadow>
        <boxGeometry args={[w, t, d]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, t / 2, 0]}>
        <boxGeometry args={[w, t, d]} />
        <meshPhysicalMaterial {...mat} />
      </mesh>
      {/* Inner shelves */}
      {Array.from({ length: shelfCount }).map((_, i) => (
        <mesh key={i} position={[0, t + spacing * (i + 1), 0]}>
          <boxGeometry args={[w - t * 2, t, d - 0.01]} />
          <meshPhysicalMaterial {...mat} />
        </mesh>
      ))}
    </group>
  );
}

function BathtubShowerShape({ w, d, h, color, sel }: ShapeProps) {
  const chrome = metalMat('#c8c8c8', sel, true);

  // ── Tub body ──────────────────────────────────────────────────
  const legH   = 0.06;
  const legR   = 0.022;
  const legBR  = 0.028;
  const inset  = 0.07;
  const shellH = h - legH;
  const wallT  = 0.055;
  const innerW = w - wallT * 2;
  const innerD = d - wallT * 2;
  const innerH = shellH - wallT * 0.9;
  const rimY   = legH + shellH;   // top of tub rim

  // ── Shower screen (right side, x = +w/2) ─────────────────────
  const screenH   = 1.45;
  const glassT    = 0.008;
  const frameT    = 0.018;
  const screenLen = d * 0.72;
  // Screen centred toward head end, leaving gap at foot end for column
  const screenCZ  = d / 2 - screenLen / 2 - 0.05;

  // ── Shower column (floor-standing, foot end) ──────────────────
  const colX      = w / 2 - 0.07;   // near right edge, within tub footprint
  const colZ      = -d / 2 + 0.06;  // foot end
  const riserH    = 1.28;
  const riserTopY = 0.04 + riserH;   // = 1.32 m above floor
  const armLen    = d * 0.60;        // arm reaches over the tub
  const headR     = 0.13;
  const headT     = 0.018;
  const headZ     = colZ + armLen;
  const headY     = riserTopY - 0.20;

  return (
    <group>
      {/* ── 4 chrome adjustable feet ── */}
      {([
        [-w / 2 + inset, -d / 2 + inset],
        [ w / 2 - inset, -d / 2 + inset],
        [-w / 2 + inset,  d / 2 - inset],
        [ w / 2 - inset,  d / 2 - inset],
      ] as [number, number][]).map(([lx, lz], i) => (
        <mesh key={`f${i}`} position={[lx, legH / 2, lz]} castShadow>
          <cylinderGeometry args={[legR, legBR, legH, 8]} />
          <meshPhysicalMaterial {...chrome} />
        </mesh>
      ))}

      {/* ── Outer tub shell (RoundedBox for organic curves) ── */}
      <RoundedBox
        args={[w, shellH, d]}
        radius={0.04}
        smoothness={3}
        position={[0, legH + shellH / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial {...ceramicMat(color, sel)} />
      </RoundedBox>

      {/* ── Inner basin ── */}
      <mesh position={[0, legH + wallT + innerH / 2, 0]}>
        <boxGeometry args={[innerW, innerH, innerD]} />
        <meshPhysicalMaterial {...ceramicMat(darken(color, 14), sel)} />
      </mesh>

      {/* ── Drain ring ── */}
      <mesh position={[0, legH + wallT + 0.003, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.007, 14]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      <mesh position={[0, legH + wallT + 0.005, 0]}>
        <cylinderGeometry args={[0.020, 0.020, 0.005, 12]} />
        <meshPhysicalMaterial color="#555555" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* ── Overflow cover on right wall near head end ── */}
      <mesh
        position={[w / 2 - 0.004, rimY - shellH * 0.35, d / 2 - 0.22]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.034, 0.034, 0.008, 12]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>

      {/* ── Bath faucet/spout at foot end ── */}
      <Faucet
        position={[w * 0.22, rimY - 0.04, -d / 2 + wallT + 0.04]}
        rotation={[0, -Math.PI / 2, 0]}
        sel={sel}
        color="#c0c0c0"
      />

      {/* ════ Shower glass screen (right side) ════ */}
      {/* Bottom rail at rim level */}
      <mesh position={[w / 2, rimY + frameT / 2, screenCZ]}>
        <boxGeometry args={[frameT, frameT, screenLen + frameT * 2]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Top rail */}
      <mesh position={[w / 2, rimY + screenH - frameT / 2, screenCZ]}>
        <boxGeometry args={[frameT, frameT, screenLen + frameT * 2]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Front vertical post (foot-end side) */}
      <mesh position={[w / 2, rimY + screenH / 2, screenCZ - screenLen / 2]} castShadow>
        <boxGeometry args={[frameT, screenH, frameT]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Back vertical post (head-end side) */}
      <mesh position={[w / 2, rimY + screenH / 2, screenCZ + screenLen / 2]}>
        <boxGeometry args={[frameT, screenH, frameT]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Glass panel */}
      <mesh position={[w / 2, rimY + screenH / 2, screenCZ]}>
        <boxGeometry args={[glassT, screenH, screenLen]} />
        <MeshTransmissionMaterial
          samples={2}
          transmission={1}
          thickness={glassT}
          roughness={0.04}
          chromaticAberration={0.01}
        />
      </mesh>

      {/* ════ Shower column (floor-standing) ════ */}
      {/* Base disc */}
      <mesh position={[colX, 0.02, colZ]} castShadow>
        <cylinderGeometry args={[0.048, 0.058, 0.04, 14]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Riser pipe */}
      <mesh position={[colX, 0.04 + riserH / 2, colZ]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, riserH, 8]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Sphere elbow at riser top */}
      <mesh position={[colX, riserTopY, colZ]}>
        <sphereGeometry args={[0.024, 12, 10]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Horizontal arm extending over tub (+Z) */}
      <mesh
        position={[colX, riserTopY, colZ + armLen / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.011, 0.011, armLen, 8]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Vertical drop tube from arm end to showerhead */}
      <mesh position={[colX, headY + (riserTopY - headY) / 2, headZ]}>
        <cylinderGeometry args={[0.011, 0.011, riserTopY - headY, 8]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Rain showerhead disc */}
      <mesh position={[colX, headY, headZ]} castShadow>
        <cylinderGeometry args={[headR, headR, headT, 24]} />
        <meshPhysicalMaterial {...metalMat('#a0a0a0', sel, true)} />
      </mesh>
      {/* Nozzle face plate */}
      <mesh position={[colX, headY - headT / 2 - 0.001, headZ]}>
        <cylinderGeometry args={[headR * 0.86, headR * 0.86, 0.003, 24]} />
        <meshPhysicalMaterial color="#787878" roughness={0.45} metalness={0.88} />
      </mesh>

      {/* ════ Thermostatic mixer on riser ════ */}
      {/* Mixer body */}
      <mesh position={[colX + 0.042, 0.04 + riserH * 0.50, colZ]} castShadow>
        <boxGeometry args={[0.056, 0.125, 0.040]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Knob 1 – temperature */}
      <mesh
        position={[colX + 0.074, 0.04 + riserH * 0.50 + 0.033, colZ]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.019, 0.019, 0.020, 12]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Knob 2 – flow/diverter */}
      <mesh
        position={[colX + 0.074, 0.04 + riserH * 0.50 - 0.033, colZ]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.019, 0.019, 0.020, 12]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>

      {/* ════ Hand shower on slide rail ════ */}
      {/* Slide rail */}
      <mesh
        position={[colX + 0.038, 0.04 + riserH * 0.695, colZ]}
        rotation={[0.15, 0, 0]}
      >
        <cylinderGeometry args={[0.006, 0.006, 0.28, 8]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Holder ring */}
      <mesh position={[colX + 0.038, 0.04 + riserH * 0.60, colZ - 0.04]}>
        <torusGeometry args={[0.017, 0.006, 8, 12]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Hand shower head */}
      <mesh
        position={[colX + 0.038, 0.04 + riserH * 0.57, colZ - 0.05]}
        rotation={[0.35, 0, 0]}
      >
        <cylinderGeometry args={[0.022, 0.024, 0.085, 10]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
    </group>
  );
}

function ToiletShape({ w, d, h, color, sel }: ShapeProps) {
  const tankD = d * 0.32;
  const tankW = w * 0.82;
  const tankH = h * 0.85;
  const tankCenterZ = -d / 2 + tankD / 2;

  const bowlDepth = d - tankD;
  const bowlCenterZ = -d / 2 + tankD + bowlDepth / 2;
  const bowlH = h * 0.60;
  // Oval: radius in X, then scale Z to stretch into ellipse
  const bowlRx = w * 0.42;
  const bowlScaleZ = (bowlDepth * 0.88) / (bowlRx * 2);

  const pedestalH = 0.04;
  const rimT = 0.015;
  const seatT = 0.012;
  const lidT = 0.016;
  const plasticColor = darken(color, 5);

  return (
    <group>
      {/* Bowl pedestal */}
      <mesh position={[0, pedestalH / 2, bowlCenterZ]} scale={[1, 1, bowlScaleZ]} castShadow receiveShadow>
        <cylinderGeometry args={[bowlRx * 0.55, bowlRx * 0.5, pedestalH, 12]} />
        <meshPhysicalMaterial {...ceramicMat(color, sel)} />
      </mesh>
      {/* Bowl outer shell — oval cylinder */}
      <mesh position={[0, pedestalH + bowlH / 2, bowlCenterZ]} scale={[1, 1, bowlScaleZ]} castShadow receiveShadow>
        <cylinderGeometry args={[bowlRx * 0.92, bowlRx * 0.68, bowlH, 16]} />
        <meshPhysicalMaterial {...ceramicMat(color, sel)} />
      </mesh>
      {/* Bowl interior dark disc (water surface illusion) */}
      <mesh position={[0, pedestalH + bowlH - 0.006, bowlCenterZ]} scale={[1, 1, bowlScaleZ]}>
        <cylinderGeometry args={[bowlRx * 0.72, bowlRx * 0.72, 0.004, 16]} />
        <meshPhysicalMaterial color="#b8c8c8" roughness={0.05} metalness={0} clearcoat={0.95} clearcoatRoughness={0.02} />
      </mesh>
      {/* Rim — wider flat cylinder */}
      <mesh position={[0, pedestalH + bowlH - rimT / 2, bowlCenterZ]} scale={[1, 1, bowlScaleZ]}>
        <cylinderGeometry args={[bowlRx, bowlRx * 0.86, rimT, 16]} />
        <meshPhysicalMaterial {...ceramicMat(color, sel)} />
      </mesh>
      {/* Seat — plastic ring */}
      <mesh position={[0, pedestalH + bowlH + seatT / 2, bowlCenterZ]} scale={[1, 1, bowlScaleZ]}>
        <cylinderGeometry args={[bowlRx * 0.93, bowlRx * 0.80, seatT, 16]} />
        <meshPhysicalMaterial {...plainMat(plasticColor, sel, 0.45)} />
      </mesh>
      {/* Lid — closed oval plastic */}
      <mesh position={[0, pedestalH + bowlH + seatT + lidT / 2, bowlCenterZ]} scale={[1, 1, bowlScaleZ]}>
        <cylinderGeometry args={[bowlRx * 0.94, bowlRx * 0.94, lidT, 16]} />
        <meshPhysicalMaterial {...plainMat(plasticColor, sel, 0.45)} />
      </mesh>
      {/* Tank body */}
      <mesh position={[0, tankH / 2, tankCenterZ]} castShadow receiveShadow>
        <boxGeometry args={[tankW, tankH, tankD]} />
        <meshPhysicalMaterial {...ceramicMat(color, sel)} />
      </mesh>
      {/* Tank lid — slight overhang */}
      <mesh position={[0, tankH + 0.013, tankCenterZ]} castShadow>
        <boxGeometry args={[tankW + 0.012, 0.024, tankD + 0.012]} />
        <meshPhysicalMaterial {...ceramicMat(color, sel)} />
      </mesh>
      {/* Flush button */}
      <mesh position={[0, tankH + 0.024 + 0.005, tankCenterZ]}>
        <cylinderGeometry args={[0.02, 0.02, 0.01, 8]} />
        <meshPhysicalMaterial {...metalMat('#c0c0c0', sel)} />
      </mesh>
    </group>
  );
}

function BathtubShape({ w, d, h, color, sel }: ShapeProps) {
  const legH = 0.10;
  const legR = 0.025;
  const legBotR = 0.03;
  const inset = 0.08;
  const shellH = h - legH;
  const wallT = 0.06;
  const innerW = w - wallT * 2;
  const innerD = d - wallT * 2;
  const innerH = shellH - wallT;
  const chromeMat = metalMat('#c8c8c8', sel, true);

  return (
    <group>
      {/* 4 chrome feet */}
      {([[-w / 2 + inset, -d / 2 + inset], [w / 2 - inset, -d / 2 + inset], [-w / 2 + inset, d / 2 - inset], [w / 2 - inset, d / 2 - inset]] as [number, number][]).map(([lx, lz], i) => (
        <mesh key={`foot${i}`} position={[lx, legH / 2, lz]} castShadow>
          <cylinderGeometry args={[legR, legBotR, legH, 8]} />
          <meshPhysicalMaterial {...chromeMat} />
        </mesh>
      ))}
      {/* Outer shell — starts at legH */}
      <mesh position={[0, legH + shellH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, shellH, d]} />
        <meshPhysicalMaterial {...ceramicMat(color, sel)} />
      </mesh>
      {/* Inner basin */}
      <mesh position={[0, legH + wallT + innerH / 2, 0]}>
        <boxGeometry args={[innerW, innerH, innerD]} />
        <meshPhysicalMaterial {...ceramicMat(darken(color, 12), sel)} />
      </mesh>
      {/* Drain ring at basin bottom center */}
      <mesh position={[0, legH + wallT + 0.002, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.006, 12]} />
        <meshPhysicalMaterial {...chromeMat} />
      </mesh>
      {/* Overflow cover — on front face near head-end */}
      <mesh position={[0, legH + shellH * 0.55, d / 2 - 0.004]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.008, 12]} />
        <meshPhysicalMaterial {...chromeMat} />
      </mesh>
      {/* Faucet at head-end */}
      <Faucet position={[w * 0.25, legH + shellH * 0.8, -d / 2 + wallT + 0.04]} rotation={[0, -Math.PI / 2, 0]} sel={sel} color="#c0c0c0" />
    </group>
  );
}

function ShowerShape({ w, d, h, color, sel }: ShapeProps) {
  // Tray height is hardcoded for visual consistency regardless of catalog h
  const trayH = 0.12;
  const frameH = 1.96;
  const postW = 0.025;
  const railT = 0.02;
  const glassT = 0.008;
  const gapW = 0.25; // open entry gap on front panel

  // Corner post at back-left (min X, min Z)
  const postX = -w / 2 + postW / 2;
  const postZ = -d / 2 + postW / 2;

  // Front glass panel: spans from back-left post to (w - gapW), leaving gap on right
  const frontGlassW = w - gapW - postW;
  const frontGlassCX = -w / 2 + postW + frontGlassW / 2;

  // Side glass panel: full depth minus post thickness
  const sideGlassD = d - postW;

  // Shower arm extends from post along +Z into shower
  const armLen = 0.28;
  const armY = trayH + frameH - 0.08;
  const armEndZ = postZ + postW / 2 + armLen;

  const frameMat = metalMat('#b8b8b8', sel, true);
  const headMat = metalMat('#c0c0c0', sel, true);

  return (
    <group>
      {/* Base tray */}
      <mesh position={[0, trayH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, trayH, d]} />
        <meshPhysicalMaterial {...ceramicMat(color, sel)} />
      </mesh>
      {/* Drain */}
      <mesh position={[0, trayH + 0.002, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.004, 16]} />
        <meshPhysicalMaterial {...metalMat('#888888', sel)} />
      </mesh>

      {/* Corner post at back-left */}
      <mesh position={[postX, trayH + frameH / 2, postZ]} castShadow>
        <boxGeometry args={[postW, frameH, postW]} />
        <meshPhysicalMaterial {...frameMat} />
      </mesh>

      {/* Top frame rail along back wall (X direction) */}
      <mesh position={[0, trayH + frameH - railT / 2, postZ]}>
        <boxGeometry args={[w, railT, railT]} />
        <meshPhysicalMaterial {...frameMat} />
      </mesh>
      {/* Top frame rail along left side (Z direction) */}
      <mesh position={[postX, trayH + frameH - railT / 2, 0]}>
        <boxGeometry args={[railT, railT, d]} />
        <meshPhysicalMaterial {...frameMat} />
      </mesh>

      {/* Glass panel — left side (YZ plane at min X) */}
      <mesh position={[-w / 2 + glassT / 2, trayH + frameH / 2, 0]}>
        <boxGeometry args={[glassT, frameH, sideGlassD]} />
        <MeshTransmissionMaterial samples={2} transmission={1} thickness={glassT} roughness={0.05} chromaticAberration={0.01} />
      </mesh>
      {/* Glass panel — front (XZ plane at max Z), with entry gap on right */}
      <mesh position={[frontGlassCX, trayH + frameH / 2, d / 2 - glassT / 2]}>
        <boxGeometry args={[frontGlassW, frameH, glassT]} />
        <MeshTransmissionMaterial samples={2} transmission={1} thickness={glassT} roughness={0.05} chromaticAberration={0.01} />
      </mesh>

      {/* Shower arm — horizontal cylinder from post along +Z */}
      <mesh position={[postX, armY, postZ + postW / 2 + armLen / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, armLen, 8]} />
        <meshPhysicalMaterial {...headMat} />
      </mesh>
      {/* Showerhead disc at end of arm */}
      <mesh position={[postX, armY, armEndZ]} castShadow>
        <cylinderGeometry args={[0.10, 0.10, 0.015, 16]} />
        <meshPhysicalMaterial {...headMat} />
      </mesh>

      {/* Wall mixer on left wall at mid-height */}
      <mesh position={[-w / 2 + 0.035, trayH + frameH * 0.38, d * 0.1]} castShadow>
        <boxGeometry args={[0.04, 0.15, 0.06]} />
        <meshPhysicalMaterial {...headMat} />
      </mesh>
      {/* Mixer knob */}
      <mesh position={[-w / 2 + 0.06, trayH + frameH * 0.38, d * 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.03, 12]} />
        <meshPhysicalMaterial {...headMat} />
      </mesh>
    </group>
  );
}

function WashbasinShape({ w, d, h, color, sel }: ShapeProps) {
  const pedestalH = 0.35;
  const basinH = 0.12;
  const basinDepth = 0.06;
  return (
    <group>
      {/* Pedestal */}
      <mesh position={[0, pedestalH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.4, pedestalH, d * 0.4]} />
        <meshPhysicalMaterial {...ceramicMat(color, sel)} />
      </mesh>
      {/* Basin body */}
      <mesh position={[0, pedestalH + basinH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, basinH, d]} />
        <meshPhysicalMaterial {...ceramicMat(color, sel)} />
      </mesh>
      {/* Basin interior */}
      <mesh position={[0, pedestalH + basinH - basinDepth / 2, 0]}>
        <boxGeometry args={[w - 0.04, basinDepth, d - 0.04]} />
        <meshPhysicalMaterial {...ceramicMat(darken(color, 12), sel)} />
      </mesh>
      {/* Curved J-faucet */}
      <Faucet position={[0, pedestalH + basinH, -d / 2 + 0.08]} rotation={[0, -Math.PI / 2, 0]} sel={sel} color="#b0b0b0" />
    </group>
  );
}

function MirrorShape({ w, d, h, color, sel }: ShapeProps) {
  const frameT = 0.015;
  return (
    <group>
      {/* Frame */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w + frameT * 2, h + frameT * 2, d]} />
        <meshStandardMaterial {...plainMat(darken(color, 20), sel, 0.4)} />
      </mesh>
      {/* Mirror surface */}
      <mesh position={[0, h / 2, d / 2 + 0.001]}>
        <boxGeometry args={[w, h, 0.002]} />
        <meshStandardMaterial
          color={sel ? '#60a5fa' : color}
          roughness={0.0}
          metalness={0.9}
          emissive={sel ? '#2563eb' : '#000000'}
          emissiveIntensity={sel ? 0.15 : 0}
        />
      </mesh>
    </group>
  );
}

function LcdTvShape({ w, d, h, color, sel }: ShapeProps) {
  const bezel = 0.015;
  return (
    <group>
      {/* Panel body */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial color={sel ? '#60a5fa' : color} roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Screen surface */}
      <mesh position={[0, h / 2, d / 2 + 0.001]}>
        <boxGeometry args={[w - bezel * 2, h - bezel * 2, 0.003]} />
        <meshPhysicalMaterial
          color={sel ? '#1a3050' : '#08080f'}
          roughness={0.03}
          metalness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
        />
      </mesh>
    </group>
  );
}

function CornerSofaShape({ w, d, h, color, sel }: ShapeProps) {
  // Corner (Ecke) faces FRONT: chaise at front-left, main section at back.
  // Inner corner Z = cFZ ≈ +0.18 m (front half) → clearly visible from front view.
  const armW = 0.12;
  const armH = h * 0.72;

  const chaiseW = Math.min(w * 0.44, 1.00);
  const mainD   = Math.min(d * 0.61, 1.00);
  const chaiseD = d - mainD;

  const lx = -w / 2, rx = w / 2;
  const fz = d / 2,  bz = -d / 2;
  const cFZ = fz - chaiseD;   // inner corner Z (near front) ✓

  return (
    <group>
      {/* ── Main section (rear, full width) ── */}
      <RoundedBox args={[w - armW * 2, h, mainD]} radius={0.05} smoothness={4}
        position={[0, h / 2, bz + mainD / 2]} castShadow receiveShadow>
        <meshPhysicalMaterial {...fabricMat(color, sel)} />
      </RoundedBox>

      {/* ── Chaise (front-left) ── */}
      <RoundedBox args={[chaiseW - armW * 2, h, chaiseD]} radius={0.05} smoothness={4}
        position={[lx + armW + (chaiseW - armW * 2) / 2, h / 2, cFZ + chaiseD / 2]} castShadow receiveShadow>
        <meshPhysicalMaterial {...fabricMat(color, sel)} />
      </RoundedBox>

      {/* ── Left arm: full depth ── */}
      <RoundedBox args={[armW, armH, d]} radius={0.03} smoothness={4}
        position={[lx + armW / 2, armH / 2, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial {...fabricMat(darken(color, 14), sel)} />
      </RoundedBox>

      {/* ── Right arm: main section depth only ── */}
      <RoundedBox args={[armW, armH, mainD]} radius={0.03} smoothness={4}
        position={[rx - armW / 2, armH / 2, bz + mainD / 2]} castShadow receiveShadow>
        <meshPhysicalMaterial {...fabricMat(darken(color, 14), sel)} />
      </RoundedBox>

      {/* ── Rear arm: across full width ── */}
      <RoundedBox args={[w, armH, armW]} radius={0.03} smoothness={4}
        position={[0, armH / 2, bz + armW / 2]} castShadow receiveShadow>
        <meshPhysicalMaterial {...fabricMat(darken(color, 14), sel)} />
      </RoundedBox>
    </group>
  );
}

function ShapeRenderer({ shape, series, ...props }: ShapeProps & { shape: FurnitureShape; series: string }) {
  switch (shape) {
    case 'wardrobe': return <WardrobeShape {...props} />;
    case 'shelf': return <ShelfShape {...props} series={series} />;
    case 'bed': return <BedShape {...props} />;
    case 'table': return <TableShape {...props} />;
    case 'desk': return <DeskShape {...props} />;
    case 'sofa': return <SofaShape {...props} />;
    case 'corner-sofa': return <CornerSofaShape {...props} />;
    case 'chair': return <ChairShape {...props} />;
    case 'dresser': return <DresserShape {...props} />;
    case 'nightstand': return <NightstandShape {...props} />;
    case 'tv-unit': return <TvUnitShape {...props} />;
    case 'gaming-desk': return <GamingDeskShape {...props} />;
    case 'gaming-chair': return <GamingChairShape {...props} />;
    case 'stove': return <StoveShape {...props} />;
    case 'fridge': return <FridgeShape {...props} />;
    case 'kitchen-sink': return <KitchenSinkShape {...props} />;
    case 'kitchen-unit': return <KitchenUnitShape {...props} />;
    case 'kitchen-wall-unit': return <KitchenWallUnitShape {...props} />;
    case 'wall-shelf': return <WallShelfShape {...props} />;
    case 'toilet': return <ToiletShape {...props} />;
    case 'bathtub': return <BathtubShape {...props} />;
    case 'bathtub-shower': return <BathtubShowerShape {...props} />;
    case 'shower': return <ShowerShape {...props} />;
    case 'washbasin': return <WashbasinShape {...props} />;
    case 'mirror': return <MirrorShape {...props} />;
    case 'lcd-tv': return <LcdTvShape {...props} />;
  }
}

export default function FurnitureItem3D({
  id,
  furnitureDef,
  x,
  y,
  rotation,
  roomWidth,
  roomHeight,
  isSelected,
  colorOverride,
  elevation,
}: FurnitureItem3DProps) {
  const groupRef = useRef<Group>(null);
  const { selectFurniture } = useRoomStore();
  const { width, depth, height, color: catalogColor, shape, series } = furnitureDef;
  const color = colorOverride ?? catalogColor;

  const w = width * SCALE;
  const d = depth * SCALE;
  const h = height * SCALE;

  const posX = (x - roomWidth / 2) * SCALE;
  const posZ = (y - roomHeight / 2) * SCALE;
  const posY = (elevation ?? 0) * SCALE;

  return (
    <group
      ref={groupRef}
      position={[posX, posY, posZ]}
      rotation={[0, -(rotation * Math.PI) / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        selectFurniture(id);
      }}
    >
      <ShapeRenderer shape={shape} series={series} w={w} d={d} h={h} color={color} sel={isSelected} />
    </group>
  );
}
