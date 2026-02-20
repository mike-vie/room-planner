'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { Group } from 'three';
import { FurnitureDef, FurnitureShape } from '@/types';
import { useRoomStore } from '@/store/useRoomStore';
import { createWoodGrainTexture, createWoodNormalMap, createFabricWeaveTexture, createFabricNormalMap } from './textures';

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
}

const SCALE = 0.01; // cm to meters

// Singleton neutral textures — generated once, shared by all furniture.
// material.color provides the actual hue.
let _woodGrain: THREE.CanvasTexture | null = null;
let _woodNormal: THREE.CanvasTexture | null = null;
let _fabricWeave: THREE.CanvasTexture | null = null;
let _fabricNormal: THREE.CanvasTexture | null = null;

function getWoodGrain(): THREE.CanvasTexture {
  if (!_woodGrain) _woodGrain = createWoodGrainTexture();
  return _woodGrain;
}
function getWoodNormal(): THREE.CanvasTexture {
  if (!_woodNormal) _woodNormal = createWoodNormalMap();
  return _woodNormal;
}
function getFabricWeave(): THREE.CanvasTexture {
  if (!_fabricWeave) _fabricWeave = createFabricWeaveTexture();
  return _fabricWeave;
}
function getFabricNormal(): THREE.CanvasTexture {
  if (!_fabricNormal) _fabricNormal = createFabricNormalMap();
  return _fabricNormal;
}

// Material presets — neutral textures tinted by material.color
function woodMat(color: string, selected: boolean) {
  return {
    map: getWoodGrain(),
    normalMap: getWoodNormal(),
    normalScale: new THREE.Vector2(0.2, 0.2),
    color: selected ? '#60a5fa' : color,
    roughness: 0.75,
    metalness: 0.0,
    emissive: selected ? '#2563eb' : '#000000',
    emissiveIntensity: selected ? 0.15 : 0,
  };
}

function fabricMat(color: string, selected: boolean) {
  return {
    map: getFabricWeave(),
    normalMap: getFabricNormal(),
    normalScale: new THREE.Vector2(0.25, 0.25),
    color: selected ? '#60a5fa' : color,
    roughness: 0.92,
    metalness: 0.0,
    emissive: selected ? '#2563eb' : '#000000',
    emissiveIntensity: selected ? 0.15 : 0,
  };
}

function metalMat(color: string, selected: boolean) {
  return {
    color: selected ? '#7ab8ff' : color,
    roughness: 0.2,
    metalness: 0.85,
    emissive: selected ? '#2563eb' : '#000000',
    emissiveIntensity: selected ? 0.15 : 0,
  };
}

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

interface ShapeProps {
  w: number;
  d: number;
  h: number;
  color: string;
  sel: boolean;
}

// --- Shape builders ---
// All dimensions in meters. Origin at center-bottom of bounding box.

function WardrobeShape({ w, d, h, color, sel }: ShapeProps) {
  const t = 0.02;
  const sockelH = 0.06;
  const doorH = h - sockelH - t; // height between bottom shelf and top
  const doorW = (w - t * 2) / 2; // two doors
  return (
    <group>
      {/* Back */}
      <mesh position={[0, h / 2, -d / 2 + t / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, h, t]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      {/* Left side */}
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      {/* Right side */}
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      {/* Top */}
      <mesh position={[0, h - t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, sockelH + t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      {/* Left door */}
      <mesh position={[-doorW / 2, sockelH + t + doorH / 2, d / 2 - t / 2]} castShadow>
        <boxGeometry args={[doorW - 0.003, doorH, t]} />
        <meshStandardMaterial {...woodMat(lighten(color, 6), sel)} />
      </mesh>
      {/* Right door */}
      <mesh position={[doorW / 2, sockelH + t + doorH / 2, d / 2 - t / 2]} castShadow>
        <boxGeometry args={[doorW - 0.003, doorH, t]} />
        <meshStandardMaterial {...woodMat(lighten(color, 6), sel)} />
      </mesh>
      {/* Door gap (center line) */}
      <mesh position={[0, sockelH + t + doorH / 2, d / 2 - 0.001]} castShadow>
        <boxGeometry args={[0.004, doorH, 0.002]} />
        <meshStandardMaterial {...woodMat(darken(color, 40), sel)} />
      </mesh>
      {/* Left door handle */}
      <mesh position={[-0.02, h / 2, d / 2 + 0.005]} castShadow>
        <boxGeometry args={[0.012, 0.06, 0.012]} />
        <meshStandardMaterial {...metalMat('#999999', sel)} />
      </mesh>
      {/* Right door handle */}
      <mesh position={[0.02, h / 2, d / 2 + 0.005]} castShadow>
        <boxGeometry args={[0.012, 0.06, 0.012]} />
        <meshStandardMaterial {...metalMat('#999999', sel)} />
      </mesh>
      {/* Sockelleiste */}
      <mesh position={[0, sockelH / 2, d / 2 - 0.02]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.04, sockelH, 0.02]} />
        <meshStandardMaterial {...woodMat(darken(color, 25), sel)} />
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
          <meshStandardMaterial {...woodMat(color, sel)} />
        </mesh>
      );
    });
    const vPanels = Array.from({ length: cols + 1 }, (_, c) => {
      const px = -w / 2 + t / 2 + c * (cellW + t);
      return (
        <mesh key={`v${c}`} position={[px, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[t, h, d]} />
          <meshStandardMaterial {...woodMat(color, sel)} />
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
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
    );
  });
  return (
    <group>
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2 + 0.005]} castShadow receiveShadow>
        <boxGeometry args={[w - t * 2, h, 0.01]} />
        <meshStandardMaterial {...woodMat(darken(color, 10), sel)} />
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
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      {/* Mattress — lighter, soft */}
      <mesh position={[0, frameH + mattressH / 2, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.06, mattressH, d - 0.06]} />
        <meshStandardMaterial {...fabricMat('#e8e4de', sel)} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, headH / 2, -d / 2 + t / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, headH, t]} />
        <meshStandardMaterial {...woodMat(darken(color, 20), sel)} />
      </mesh>
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
      <mesh position={[0, h - topT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topT, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      {[
        [-w / 2 + inset, 0, -d / 2 + inset],
        [w / 2 - inset, 0, -d / 2 + inset],
        [-w / 2 + inset, 0, d / 2 - inset],
        [w / 2 - inset, 0, d / 2 - inset],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, legH / 2, lz]} castShadow receiveShadow>
          <cylinderGeometry args={[legR, legR, legH, 8]} />
          <meshStandardMaterial {...woodMat(darken(color, 20), sel)} />
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
      <mesh position={[0, h - topT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topT, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      {/* Left leg frame */}
      <mesh position={[-w / 2 + inset, legH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameW, legH, d - 0.1]} />
        <meshStandardMaterial {...metalMat('#707070', sel)} />
      </mesh>
      {/* Right leg frame */}
      <mesh position={[w / 2 - inset, legH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameW, legH, d - 0.1]} />
        <meshStandardMaterial {...metalMat('#707070', sel)} />
      </mesh>
      {/* Cross bar */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - inset * 2, 0.03, 0.03]} />
        <meshStandardMaterial {...metalMat('#707070', sel)} />
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
      {/* Seat */}
      <mesh position={[0, seatH / 2, d / 2 - seatD / 2]} castShadow receiveShadow>
        <boxGeometry args={[w - armW * 2, seatH, seatD]} />
        <meshStandardMaterial {...fabricMat(color, sel)} />
      </mesh>
      {/* Back */}
      <mesh position={[0, seatH + backH / 2, -d / 2 + (d - seatD) / 2]} castShadow receiveShadow>
        <boxGeometry args={[w - armW * 2, backH, d - seatD]} />
        <meshStandardMaterial {...fabricMat(lighten(color, 10), sel)} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-w / 2 + armW / 2, armH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[armW, armH, d]} />
        <meshStandardMaterial {...fabricMat(darken(color, 12), sel)} />
      </mesh>
      {/* Right arm */}
      <mesh position={[w / 2 - armW / 2, armH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[armW, armH, d]} />
        <meshStandardMaterial {...fabricMat(darken(color, 12), sel)} />
      </mesh>
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
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, seatH + backH / 2, -d / 2 + backT / 2]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.04, backH, backT]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      {[
        [-w / 2 + inset, 0, -d / 2 + inset],
        [w / 2 - inset, 0, -d / 2 + inset],
        [-w / 2 + inset, 0, d / 2 - inset],
        [w / 2 - inset, 0, d / 2 - inset],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, seatH / 2, lz]} castShadow receiveShadow>
          <cylinderGeometry args={[legR, legR, seatH, 8]} />
          <meshStandardMaterial {...woodMat(darken(color, 20), sel)} />
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
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, h - t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2 + 0.005]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.01]} />
        <meshStandardMaterial {...woodMat(darken(color, 10), sel)} />
      </mesh>
      {Array.from({ length: drawerCount }).map((_, i) => {
        const py = t + drawerH * i + drawerH / 2;
        return (
          <group key={i}>
            <mesh position={[0, py, d / 2 - t / 2]} castShadow>
              <boxGeometry args={[w - t * 2 - gap * 2, drawerH - gap * 2, t]} />
              <meshStandardMaterial {...woodMat(lighten(color, 8), sel)} />
            </mesh>
            <mesh position={[0, py, d / 2 + 0.005]} castShadow>
              <boxGeometry args={[0.06, 0.012, 0.012]} />
              <meshStandardMaterial {...metalMat('#999999', sel)} />
            </mesh>
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
          <meshStandardMaterial {...woodMat(darken(color, 20), sel)} />
        </mesh>
      ))}
      <mesh position={[-w / 2 + t / 2, legH + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, bodyH, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[w / 2 - t / 2, legH + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, bodyH, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, h - t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, legH + bodyH / 2, -d / 2 + 0.005]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, 0.01]} />
        <meshStandardMaterial {...woodMat(darken(color, 10), sel)} />
      </mesh>
      {Array.from({ length: drawerCount }).map((_, i) => {
        const py = legH + t / 2 + drawerH * i + drawerH / 2;
        return (
          <group key={i}>
            <mesh position={[0, py, d / 2 - t / 2]} castShadow>
              <boxGeometry args={[w - t * 2 - gap * 2, drawerH - gap * 2, t]} />
              <meshStandardMaterial {...woodMat(lighten(color, 8), sel)} />
            </mesh>
            <mesh position={[0, py, d / 2 + 0.005]} castShadow>
              <boxGeometry args={[0.04, 0.01, 0.01]} />
              <meshStandardMaterial {...metalMat('#999999', sel)} />
            </mesh>
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
          <meshStandardMaterial {...metalMat('#555555', sel)} />
        </mesh>
      ))}
      <mesh position={[0, h - t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, legH + t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, t, d]} />
        <meshStandardMaterial {...woodMat(color, sel)} />
      </mesh>
      <mesh position={[0, legH + bodyH / 2, -d / 2 + 0.005]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, 0.01]} />
        <meshStandardMaterial {...woodMat(darken(color, 10), sel)} />
      </mesh>
      {Array.from({ length: compartments + 1 }).map((_, i) => {
        const px = -w / 2 + t / 2 + i * (compW + t);
        return (
          <mesh key={`div${i}`} position={[px, legH + bodyH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[t, bodyH, d]} />
            <meshStandardMaterial {...woodMat(color, sel)} />
          </mesh>
        );
      })}
    </group>
  );
}

function GamingDeskShape({ w, d, h, color, sel }: ShapeProps) {
  const topT = 0.025; // thicker metal surface
  const legH = h - topT;
  const legW = 0.08; // column width
  const legD = d * 0.85; // column depth (most of desk depth)
  const inset = 0.12; // leg inset from edge
  const footW = 0.10;
  const footH = 0.015;
  const footD = d * 0.55;
  const crossH = 0.04;
  const crossW = w - inset * 2 - legW;
  const trayH = 0.02;
  const trayD = d * 0.7;
  const trayDrop = 0.06; // how far below surface
  const edgeGlowH = 0.008;
  const edgeGlowD = 0.003;

  return (
    <group>
      {/* Desktop surface — thick metal plate with slight bevel look */}
      <mesh position={[0, h - topT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, topT, d]} />
        <meshStandardMaterial
          color={sel ? '#60a5fa' : color}
          roughness={0.35}
          metalness={0.7}
          emissive={sel ? '#2563eb' : '#000000'}
          emissiveIntensity={sel ? 0.15 : 0}
        />
      </mesh>

      {/* Front edge accent — subtle chamfer line */}
      <mesh position={[0, h - topT, d / 2 - 0.005]} castShadow>
        <boxGeometry args={[w - 0.01, 0.003, 0.01]} />
        <meshStandardMaterial
          color={sel ? '#60a5fa' : lighten(color, 20)}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* RGB LED strip on front edge */}
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
        <meshStandardMaterial {...metalMat(color, sel)} />
      </mesh>

      {/* Right column leg */}
      <mesh position={[w / 2 - inset - legW / 2, legH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[legW, legH, legD]} />
        <meshStandardMaterial {...metalMat(color, sel)} />
      </mesh>

      {/* Left foot plate */}
      <mesh position={[-w / 2 + inset + legW / 2, footH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[footW, footH, footD]} />
        <meshStandardMaterial {...metalMat(darken(color, 10), sel)} />
      </mesh>

      {/* Right foot plate */}
      <mesh position={[w / 2 - inset - legW / 2, footH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[footW, footH, footD]} />
        <meshStandardMaterial {...metalMat(darken(color, 10), sel)} />
      </mesh>

      {/* Crossbar between legs at bottom */}
      <mesh position={[0, crossH / 2 + footH, 0]} castShadow receiveShadow>
        <boxGeometry args={[crossW, crossH, 0.04]} />
        <meshStandardMaterial {...metalMat(color, sel)} />
      </mesh>

      {/* Cable management tray underneath */}
      {/* Tray bottom */}
      <mesh position={[0, h - topT - trayDrop - trayH / 2, -d * 0.05]} receiveShadow>
        <boxGeometry args={[w * 0.8, trayH, trayD]} />
        <meshStandardMaterial {...metalMat(darken(color, 5), sel)} />
      </mesh>
      {/* Tray back wall */}
      <mesh position={[0, h - topT - trayDrop / 2, -d * 0.05 - trayD / 2 + 0.005]} receiveShadow>
        <boxGeometry args={[w * 0.8, trayDrop, 0.01]} />
        <meshStandardMaterial {...metalMat(darken(color, 5), sel)} />
      </mesh>

      {/* Control panel — small box on right front */}
      <mesh position={[w / 2 - 0.2, h - topT - 0.012, d / 2 - 0.06]} castShadow>
        <boxGeometry args={[0.12, 0.01, 0.04]} />
        <meshStandardMaterial
          color={sel ? '#60a5fa' : '#2a2a2a'}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {/* Control panel LED dots */}
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
              <meshStandardMaterial {...metalMat(baseCol, sel)} />
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
        <meshStandardMaterial {...metalMat('#606060', sel)} />
      </mesh>

      {/* Seat cushion */}
      <mesh position={[0, seatH, 0]} castShadow receiveShadow>
        <boxGeometry args={[seatW, seatT, seatD]} />
        <meshStandardMaterial {...fabricMat(color, sel)} />
      </mesh>
      {/* Seat side bolsters */}
      <mesh position={[-seatW / 2 + 0.025, seatH + seatT * 0.3, 0]} castShadow>
        <boxGeometry args={[0.05, seatT * 0.65, seatD * 0.85]} />
        <meshStandardMaterial {...fabricMat(accent, sel)} />
      </mesh>
      <mesh position={[seatW / 2 - 0.025, seatH + seatT * 0.3, 0]} castShadow>
        <boxGeometry args={[0.05, seatT * 0.65, seatD * 0.85]} />
        <meshStandardMaterial {...fabricMat(accent, sel)} />
      </mesh>

      {/* Backrest */}
      <mesh position={[0, seatH + seatT + backH / 2, -seatD / 2 + backT / 2]} castShadow receiveShadow>
        <boxGeometry args={[backW, backH, backT]} />
        <meshStandardMaterial {...fabricMat(color, sel)} />
      </mesh>
      {/* Back side bolsters */}
      <mesh position={[-backW / 2 + 0.025, seatH + seatT + backH * 0.45, -seatD / 2 + backT / 2]} castShadow>
        <boxGeometry args={[0.05, backH * 0.72, backT + 0.015]} />
        <meshStandardMaterial {...fabricMat(accent, sel)} />
      </mesh>
      <mesh position={[backW / 2 - 0.025, seatH + seatT + backH * 0.45, -seatD / 2 + backT / 2]} castShadow>
        <boxGeometry args={[0.05, backH * 0.72, backT + 0.015]} />
        <meshStandardMaterial {...fabricMat(accent, sel)} />
      </mesh>

      {/* Lumbar pillow */}
      <mesh position={[0, seatH + seatT + backH * 0.25, -seatD / 2 + backT + 0.03]} castShadow>
        <boxGeometry args={[backW * 0.55, backH * 0.18, 0.06]} />
        <meshStandardMaterial {...fabricMat(accent, sel)} />
      </mesh>

      {/* Headrest */}
      <mesh position={[0, seatH + seatT + backH + headH / 2, -seatD / 2 + backT / 2]} castShadow receiveShadow>
        <boxGeometry args={[headW, headH, backT + 0.015]} />
        <meshStandardMaterial {...fabricMat(color, sel)} />
      </mesh>
      {/* Headrest accent stripe */}
      <mesh position={[0, seatH + seatT + backH + headH / 2, -seatD / 2 + backT + 0.01]} castShadow>
        <boxGeometry args={[headW * 0.45, headH * 0.55, 0.018]} />
        <meshStandardMaterial {...fabricMat(accent, sel)} />
      </mesh>

      {/* Left armrest post */}
      <mesh position={[-seatW / 2 + 0.05, seatH - armPostH / 2, -seatD * 0.08]} castShadow receiveShadow>
        <boxGeometry args={[armPostW, armPostH, armPostW]} />
        <meshStandardMaterial {...metalMat(baseCol, sel)} />
      </mesh>
      {/* Left armrest pad */}
      <mesh position={[-seatW / 2 + 0.05, seatH + armPadH / 2, -seatD * 0.08]} castShadow>
        <boxGeometry args={[armD, armPadH, armPostW * 2.5]} />
        <meshStandardMaterial color={sel ? '#60a5fa' : '#2a2a2a'} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Right armrest post */}
      <mesh position={[seatW / 2 - 0.05, seatH - armPostH / 2, -seatD * 0.08]} castShadow receiveShadow>
        <boxGeometry args={[armPostW, armPostH, armPostW]} />
        <meshStandardMaterial {...metalMat(baseCol, sel)} />
      </mesh>
      {/* Right armrest pad */}
      <mesh position={[seatW / 2 - 0.05, seatH + armPadH / 2, -seatD * 0.08]} castShadow>
        <boxGeometry args={[armD, armPadH, armPostW * 2.5]} />
        <meshStandardMaterial color={sel ? '#60a5fa' : '#2a2a2a'} roughness={0.7} metalness={0.1} />
      </mesh>
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
    case 'chair': return <ChairShape {...props} />;
    case 'dresser': return <DresserShape {...props} />;
    case 'nightstand': return <NightstandShape {...props} />;
    case 'tv-unit': return <TvUnitShape {...props} />;
    case 'gaming-desk': return <GamingDeskShape {...props} />;
    case 'gaming-chair': return <GamingChairShape {...props} />;
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

  return (
    <group
      ref={groupRef}
      position={[posX, 0, posZ]}
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
