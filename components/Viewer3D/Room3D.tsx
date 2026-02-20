'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import {
  WallOpening, WallSide, InteriorWall,
  WINDOW_WIDTH, WINDOW_HEIGHT, WINDOW_SILL_HEIGHT,
  WINDOW_TALL_WIDTH, WINDOW_TALL_HEIGHT, WINDOW_TALL_SILL_HEIGHT,
  BALCONY_DOOR_WIDTH, BALCONY_DOOR_HEIGHT, DOOR_WIDTH, DOOR_HEIGHT,
} from '@/types';
import { createFloorTexture, createFloorNormalMap, createFloorRoughnessMap, createWallTexture, createWallNormalMap } from './textures';

const SCALE = 0.01;
const WALL_HEIGHT = 2.5;
const WALL_THICKNESS = 0.1;
const BASEBOARD_HEIGHT = 0.08;
const BASEBOARD_DEPTH = 0.012;
const WALL_COLOR = '#f2efe9';

interface Room3DProps {
  roomWidth: number;
  roomHeight: number;
  interiorWalls?: InteriorWall[];
  wallOpenings?: WallOpening[];
  hiddenWalls?: WallSide[];
  onToggleDoor?: (id: string) => void;
}

// --- Rectangle mode helpers (unchanged) ---

interface WallSegmentBox {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  transparent?: boolean;
  opacity?: number;
}

function buildWallWithOpenings(
  wallSide: WallSide, openings: WallOpening[], roomW: number, roomD: number,
  wallH: number, wallT: number, hiddenWalls: Set<WallSide>
): WallSegmentBox[] {
  const segments: WallSegmentBox[] = [];
  const isHorizontal = wallSide === 'top' || wallSide === 'bottom';
  const wallLength = isHorizontal ? roomW : roomD;
  const isHidden = hiddenWalls.has(wallSide);
  const wallColor = isHorizontal ? '#f2efe9' : '#edeae4';

  const sorted = [...openings].sort((a, b) => a.position - b.position);

  let wallPos: [number, number, number];
  let lengthAxis: 0 | 2;
  let wallSize: (len: number, h: number) => [number, number, number];

  switch (wallSide) {
    case 'top':    wallPos = [0, 0, -roomD / 2]; lengthAxis = 0; wallSize = (l, h) => [l, h, wallT]; break;
    case 'bottom': wallPos = [0, 0,  roomD / 2]; lengthAxis = 0; wallSize = (l, h) => [l, h, wallT]; break;
    case 'left':   wallPos = [-roomW / 2, 0, 0]; lengthAxis = 2; wallSize = (l, h) => [wallT, h, l]; break;
    case 'right':  wallPos = [ roomW / 2, 0, 0]; lengthAxis = 2; wallSize = (l, h) => [wallT, h, l]; break;
  }

  if (sorted.length === 0) {
    if (isHidden) return segments;
    const size = wallSize(isHorizontal ? roomW + wallT * 2 : roomD, wallH);
    const pos: [number, number, number] = [...wallPos] as [number, number, number];
    pos[1] = wallH / 2;
    segments.push({ position: pos, size, color: wallColor });
    return segments;
  }

  let cursor = -wallLength / 2;
  for (const opening of sorted) {
    const ow = (opening.type === 'window' ? WINDOW_WIDTH : opening.type === 'window-tall' ? WINDOW_TALL_WIDTH : opening.type === 'door' ? DOOR_WIDTH : BALCONY_DOOR_WIDTH) * SCALE;
    const oh = (opening.type === 'window' ? WINDOW_HEIGHT : opening.type === 'window-tall' ? WINDOW_TALL_HEIGHT : opening.type === 'door' ? DOOR_HEIGHT : BALCONY_DOOR_HEIGHT) * SCALE;
    const sillH = opening.type === 'window' ? WINDOW_SILL_HEIGHT * SCALE : opening.type === 'window-tall' ? WINDOW_TALL_SILL_HEIGHT * SCALE : 0;
    const openCenter = (opening.position * SCALE) - (wallLength / 2);
    const openLeft = openCenter - ow / 2;
    const openRight = openCenter + ow / 2;

    if (!isHidden) {
      const leftLen = openLeft - cursor;
      if (leftLen > 0.001) {
        const pos: [number, number, number] = [...wallPos] as [number, number, number];
        pos[1] = wallH / 2; pos[lengthAxis] = wallPos[lengthAxis] + cursor + leftLen / 2;
        segments.push({ position: pos, size: wallSize(leftLen, wallH), color: wallColor });
      }
      const lintelH = wallH - sillH - oh;
      if (lintelH > 0.001) {
        const pos: [number, number, number] = [...wallPos] as [number, number, number];
        pos[1] = sillH + oh + lintelH / 2; pos[lengthAxis] = wallPos[lengthAxis] + openCenter;
        segments.push({ position: pos, size: wallSize(ow, lintelH), color: wallColor });
      }
      if (sillH > 0.001) {
        const pos: [number, number, number] = [...wallPos] as [number, number, number];
        pos[1] = sillH / 2; pos[lengthAxis] = wallPos[lengthAxis] + openCenter;
        segments.push({ position: pos, size: wallSize(ow, sillH), color: wallColor });
      }
    }

    if (opening.type !== 'door') {
      const pos: [number, number, number] = [...wallPos] as [number, number, number];
      pos[1] = sillH + oh / 2; pos[lengthAxis] = wallPos[lengthAxis] + openCenter;
      const size = wallSize(ow, oh);
      if (lengthAxis === 0) size[2] = 0.01; else size[0] = 0.01;
      segments.push({ position: pos, size, color: '#a8d8ea', transparent: true, opacity: 0.3 });
    }

    if (opening.type === 'door') { cursor = openRight; continue; }

    const frameT = 0.03; const frameD = wallT + 0.01;
    const addFrame = (py: number, w: number, h: number, isVert: boolean) => {
      const pos: [number, number, number] = [...wallPos] as [number, number, number];
      pos[1] = py; pos[lengthAxis] = wallPos[lengthAxis] + (isVert ? py : openCenter); // will fix below
      const size = wallSize(w, h);
      if (lengthAxis === 0) size[2] = frameD; else size[0] = frameD;
      return { position: pos, size, color: '#ffffff' };
    };
    // Top frame
    { const pos: [number, number, number] = [...wallPos] as [number, number, number]; pos[1] = sillH + oh + frameT / 2; pos[lengthAxis] = wallPos[lengthAxis] + openCenter; const size = wallSize(ow + frameT * 2, frameT); if (lengthAxis === 0) size[2] = frameD; else size[0] = frameD; segments.push({ position: pos, size, color: '#ffffff' }); }
    // Bottom frame
    { const pos: [number, number, number] = [...wallPos] as [number, number, number]; pos[1] = Math.max(frameT / 2, sillH - frameT / 2); pos[lengthAxis] = wallPos[lengthAxis] + openCenter; const size = wallSize(ow + frameT * 2, frameT); if (lengthAxis === 0) size[2] = frameD; else size[0] = frameD; if (sillH > 0.001) segments.push({ position: pos, size, color: '#ffffff' }); }
    // Left frame
    { const pos: [number, number, number] = [...wallPos] as [number, number, number]; pos[1] = sillH + oh / 2; pos[lengthAxis] = wallPos[lengthAxis] + openLeft - frameT / 2; const size = wallSize(frameT, oh); if (lengthAxis === 0) size[2] = frameD; else size[0] = frameD; segments.push({ position: pos, size, color: '#ffffff' }); }
    // Right frame
    { const pos: [number, number, number] = [...wallPos] as [number, number, number]; pos[1] = sillH + oh / 2; pos[lengthAxis] = wallPos[lengthAxis] + openRight + frameT / 2; const size = wallSize(frameT, oh); if (lengthAxis === 0) size[2] = frameD; else size[0] = frameD; segments.push({ position: pos, size, color: '#ffffff' }); }

    cursor = openRight;
    void addFrame; // suppress unused warning
  }

  if (!isHidden) {
    const rightLen = wallLength / 2 - cursor;
    if (rightLen > 0.001) {
      const pos: [number, number, number] = [...wallPos] as [number, number, number];
      pos[1] = wallH / 2; pos[lengthAxis] = wallPos[lengthAxis] + cursor + rightLen / 2;
      segments.push({ position: pos, size: wallSize(rightLen, wallH), color: wallColor });
    }
  }
  return segments;
}

// --- Rectangle mode door ---
function Door3D({ opening, roomW, roomD, onToggle }: { opening: WallOpening; roomW: number; roomD: number; onToggle: () => void }) {
  const ow = DOOR_WIDTH * SCALE;
  const oh = DOOR_HEIGHT * SCALE;
  const doorT = 0.045; const frameT = 0.03;
  const isOpen = opening.isOpen ?? false;
  const swingAngle = isOpen ? -Math.PI / 2 : 0;

  const isHoriz = opening.wall === 'top' || opening.wall === 'bottom';
  const wallLength = isHoriz ? roomW : roomD;
  const openCenter = (opening.position * SCALE) - (wallLength / 2);

  let hingePos: [number, number, number];
  let hingeRotY: number;

  switch (opening.wall) {
    case 'top':    hingePos = [openCenter - ow / 2, 0, -roomD / 2]; hingeRotY = 0; break;
    case 'bottom': hingePos = [openCenter + ow / 2, 0,  roomD / 2]; hingeRotY = Math.PI; break;
    case 'left':   hingePos = [-roomW / 2, 0, openCenter + ow / 2]; hingeRotY = Math.PI / 2; break;
    case 'right':  hingePos = [ roomW / 2, 0, openCenter - ow / 2]; hingeRotY = -Math.PI / 2; break;
    default:       hingePos = [0, 0, 0]; hingeRotY = 0;
  }

  const panelColor = '#6B4226'; const frameColor = '#e8e3dc'; const handleColor = '#C0C0C0';
  const panelW = ow - 0.01;

  return (
    <group position={hingePos} rotation={[0, hingeRotY, 0]}>
      <group rotation={[0, swingAngle, 0]}>
        <mesh position={[panelW / 2, oh / 2, 0]} castShadow receiveShadow onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          <boxGeometry args={[panelW, oh, doorT]} /><meshStandardMaterial color={panelColor} roughness={0.7} />
        </mesh>
        <mesh position={[panelW / 2, oh * 0.7, doorT / 2 + 0.001]}><boxGeometry args={[panelW * 0.7, oh * 0.25, 0.005]} /><meshStandardMaterial color="#5A3520" roughness={0.8} /></mesh>
        <mesh position={[panelW / 2, oh * 0.3, doorT / 2 + 0.001]}><boxGeometry args={[panelW * 0.7, oh * 0.25, 0.005]} /><meshStandardMaterial color="#5A3520" roughness={0.8} /></mesh>
        <mesh position={[panelW - 0.06, oh * 0.48, doorT / 2 + 0.014]} castShadow><boxGeometry args={[0.09, 0.014, 0.014]} /><meshStandardMaterial color={handleColor} roughness={0.15} metalness={0.9} /></mesh>
        {[oh * 0.15, oh * 0.85].map((hy, i) => (
          <mesh key={i} position={[0.01, hy, -doorT / 2 - 0.005]}><boxGeometry args={[0.02, 0.08, 0.012]} /><meshStandardMaterial color="#888888" roughness={0.3} metalness={0.8} /></mesh>
        ))}
      </group>
      <mesh position={[ow / 2, oh + frameT / 2, 0]}><boxGeometry args={[ow + frameT * 2, frameT, WALL_THICKNESS + 0.01]} /><meshStandardMaterial color={frameColor} roughness={0.5} /></mesh>
      <mesh position={[-frameT / 2, oh / 2, 0]}><boxGeometry args={[frameT, oh, WALL_THICKNESS + 0.01]} /><meshStandardMaterial color={frameColor} roughness={0.5} /></mesh>
      <mesh position={[ow + frameT / 2, oh / 2, 0]}><boxGeometry args={[frameT, oh, WALL_THICKNESS + 0.01]} /><meshStandardMaterial color={frameColor} roughness={0.5} /></mesh>
    </group>
  );
}

// --- Polygon mode: build wall pieces in local wall space (X = along wall) ---
interface LocalPiece {
  x: number; y: number; // center in local space (x along wall, y height)
  w: number; h: number; // width (along wall), height
  color: string; transparent?: boolean; opacity?: number;
}

function buildLocalWallPieces(lengthM: number, openings: WallOpening[], wallH: number, wallT: number): LocalPiece[] {
  const pieces: LocalPiece[] = [];
  const sorted = [...openings].sort((a, b) => a.position - b.position);
  let cursor = -lengthM / 2; // local X starts at -length/2

  for (const op of sorted) {
    const ow = (op.type === 'window' ? WINDOW_WIDTH : op.type === 'window-tall' ? WINDOW_TALL_WIDTH : op.type === 'door' ? DOOR_WIDTH : BALCONY_DOOR_WIDTH) * SCALE;
    const oh = (op.type === 'window' ? WINDOW_HEIGHT : op.type === 'window-tall' ? WINDOW_TALL_HEIGHT : op.type === 'door' ? DOOR_HEIGHT : BALCONY_DOOR_HEIGHT) * SCALE;
    const sillH = op.type === 'window' ? WINDOW_SILL_HEIGHT * SCALE : op.type === 'window-tall' ? WINDOW_TALL_SILL_HEIGHT * SCALE : 0;
    const openCenterLocal = (op.position * SCALE) - (lengthM / 2);
    const openLeft = openCenterLocal - ow / 2;
    const openRight = openCenterLocal + ow / 2;

    // Left solid piece
    const leftLen = openLeft - cursor;
    if (leftLen > 0.001) pieces.push({ x: cursor + leftLen / 2, y: wallH / 2, w: leftLen, h: wallH, color: WALL_COLOR });

    // Lintel
    const lintelH = wallH - sillH - oh;
    if (lintelH > 0.001) pieces.push({ x: openCenterLocal, y: sillH + oh + lintelH / 2, w: ow, h: lintelH, color: WALL_COLOR });

    // Sill wall (windows)
    if (sillH > 0.001) pieces.push({ x: openCenterLocal, y: sillH / 2, w: ow, h: sillH, color: WALL_COLOR });

    // Glass
    if (op.type !== 'door') {
      pieces.push({ x: openCenterLocal, y: sillH + oh / 2, w: ow, h: oh, color: '#a8d8ea', transparent: true, opacity: 0.3 });
      // Simple white frame
      const fT = 0.03;
      pieces.push({ x: openCenterLocal, y: sillH + oh + fT / 2, w: ow + fT * 2, h: fT, color: '#ffffff' });
      pieces.push({ x: openLeft - fT / 2, y: sillH + oh / 2, w: fT, h: oh, color: '#ffffff' });
      pieces.push({ x: openRight + fT / 2, y: sillH + oh / 2, w: fT, h: oh, color: '#ffffff' });
      if (sillH > 0.001) pieces.push({ x: openCenterLocal, y: sillH - fT / 2, w: ow + fT * 2, h: fT, color: '#ffffff' });
    }

    cursor = openRight;
  }

  // Right solid piece
  const rightLen = lengthM / 2 - cursor;
  if (rightLen > 0.001) pieces.push({ x: cursor + rightLen / 2, y: wallH / 2, w: rightLen, h: wallH, color: WALL_COLOR });

  return pieces;
}

// Polygon mode door in local wall space
function LocalDoor3D({ opening, lengthM, onToggle }: { opening: WallOpening; lengthM: number; onToggle: () => void }) {
  const ow = DOOR_WIDTH * SCALE;
  const oh = DOOR_HEIGHT * SCALE;
  const doorT = 0.045; const frameT = 0.03;
  const isOpen = opening.isOpen ?? false;
  const openCenterLocal = (opening.position * SCALE) - (lengthM / 2);
  const hingeX = openCenterLocal - ow / 2;
  const panelW = ow - 0.01;
  const handleColor = '#C0C0C0';

  return (
    <group position={[hingeX, 0, 0]}>
      <group rotation={[0, isOpen ? -Math.PI / 2 : 0, 0]}>
        <mesh position={[panelW / 2, oh / 2, 0]} castShadow receiveShadow onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          <boxGeometry args={[panelW, oh, doorT]} /><meshStandardMaterial color="#6B4226" roughness={0.7} />
        </mesh>
        <mesh position={[panelW / 2, oh * 0.7, doorT / 2 + 0.001]}><boxGeometry args={[panelW * 0.7, oh * 0.25, 0.005]} /><meshStandardMaterial color="#5A3520" roughness={0.8} /></mesh>
        <mesh position={[panelW / 2, oh * 0.3, doorT / 2 + 0.001]}><boxGeometry args={[panelW * 0.7, oh * 0.25, 0.005]} /><meshStandardMaterial color="#5A3520" roughness={0.8} /></mesh>
        <mesh position={[panelW - 0.06, oh * 0.48, doorT / 2 + 0.014]}><boxGeometry args={[0.09, 0.014, 0.014]} /><meshStandardMaterial color={handleColor} roughness={0.15} metalness={0.9} /></mesh>
      </group>
      <mesh position={[ow / 2, oh + frameT / 2, 0]}><boxGeometry args={[ow + frameT * 2, frameT, WALL_THICKNESS + 0.01]} /><meshStandardMaterial color="#e8e3dc" roughness={0.5} /></mesh>
      <mesh position={[-frameT / 2, oh / 2, 0]}><boxGeometry args={[frameT, oh, WALL_THICKNESS + 0.01]} /><meshStandardMaterial color="#e8e3dc" roughness={0.5} /></mesh>
      <mesh position={[ow + frameT / 2, oh / 2, 0]}><boxGeometry args={[frameT, oh, WALL_THICKNESS + 0.01]} /><meshStandardMaterial color="#e8e3dc" roughness={0.5} /></mesh>
    </group>
  );
}

// --- Main Room3D ---
export default function Room3D({
  roomWidth, roomHeight, interiorWalls = [], wallOpenings = [],
  hiddenWalls: hiddenWallsProp = ['bottom', 'right'], onToggleDoor,
}: Room3DProps) {
  const w = roomWidth * SCALE;
  const d = roomHeight * SCALE;
  const h = WALL_HEIGHT;
  const t = WALL_THICKNESS;

  // Textures
  const floorTex      = useMemo(() => { const tx = createFloorTexture();      tx.repeat.set(w / 2, d / 2); return tx; }, [w, d]);
  const floorNormal   = useMemo(() => { const tx = createFloorNormalMap();     tx.repeat.set(w / 2, d / 2); return tx; }, [w, d]);
  const floorRoughness= useMemo(() => { const tx = createFloorRoughnessMap();  tx.repeat.set(w / 2, d / 2); return tx; }, [w, d]);
  const wallTexBack   = useMemo(() => { const tx = createWallTexture('#f2efe9'); tx.repeat.set(w, h); return tx; }, [w, h]);
  const wallTexSide   = useMemo(() => { const tx = createWallTexture('#edeae4'); tx.repeat.set(d, h); return tx; }, [d, h]);
  const wallNormal    = useMemo(() => { const tx = createWallNormalMap();       tx.repeat.set(3, 3); return tx; }, []);

  const hiddenWalls = new Set<WallSide>(hiddenWallsProp);
  const openingsByWall: Record<WallSide, WallOpening[]> = {
    top:    wallOpenings.filter(o => o.wall === 'top'),
    bottom: wallOpenings.filter(o => o.wall === 'bottom'),
    left:   wallOpenings.filter(o => o.wall === 'left'),
    right:  wallOpenings.filter(o => o.wall === 'right'),
  };
  const allSegments: WallSegmentBox[] = [];
  for (const side of ['top', 'bottom', 'left', 'right'] as WallSide[]) {
    allSegments.push(...buildWallWithOpenings(side, openingsByWall[side], w, d, h, t, hiddenWalls));
  }

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={floorTex} normalMap={floorNormal} normalScale={new THREE.Vector2(0.3, 0.3)} roughnessMap={floorRoughness} roughness={0.7} metalness={0.02} />
      </mesh>

      {/* Walls */}
      {allSegments.map((seg, i) => {
        const isGlass = seg.transparent && seg.color === '#a8d8ea';
        const isWall  = !seg.transparent && seg.color !== '#ffffff';
        const isHorizWall = isWall && Math.abs(seg.size[2]) < 0.15;
        return (
          <mesh key={i} position={seg.position} receiveShadow={!seg.transparent}>
            <boxGeometry args={seg.size} />
            <meshStandardMaterial
              map={isWall ? (isHorizWall ? wallTexBack : wallTexSide) : undefined}
              normalMap={isWall ? wallNormal : undefined}
              normalScale={isWall ? new THREE.Vector2(0.15, 0.15) : undefined}
              color={isWall ? '#ffffff' : seg.color}
              roughness={isGlass ? 0.05 : seg.color === '#ffffff' ? 0.4 : 0.92}
              metalness={isGlass ? 0.1 : 0}
              transparent={seg.transparent} opacity={seg.opacity ?? 1}
            />
          </mesh>
        );
      })}

      {/* Baseboards */}
      <mesh position={[0, BASEBOARD_HEIGHT / 2, -d / 2 + t / 2 + BASEBOARD_DEPTH / 2]} receiveShadow>
        <boxGeometry args={[w, BASEBOARD_HEIGHT, BASEBOARD_DEPTH]} />
        <meshStandardMaterial color="#e8e3dc" roughness={0.6} />
      </mesh>
      <mesh position={[-w / 2 + t / 2 + BASEBOARD_DEPTH / 2, BASEBOARD_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[BASEBOARD_DEPTH, BASEBOARD_HEIGHT, d]} />
        <meshStandardMaterial color="#e8e3dc" roughness={0.6} />
      </mesh>

      {/* Interactive doors (outer walls) */}
      {wallOpenings.filter(o => o.type === 'door' && o.wall).map(opening => (
        <Door3D key={opening.id} opening={opening} roomW={w} roomD={d} onToggle={() => onToggleDoor?.(opening.id)} />
      ))}

      {/* Interior walls */}
      {interiorWalls.map(iw => {
        const dx3d = (iw.x2 - iw.x1) * SCALE;
        const dz3d = (iw.y2 - iw.y1) * SCALE;
        const lengthM = Math.hypot(dx3d, dz3d);
        if (lengthM < 0.01) return null;
        const midX = ((iw.x1 + iw.x2) / 2 - roomWidth / 2) * SCALE;
        const midZ = ((iw.y1 + iw.y2) / 2 - roomHeight / 2) * SCALE;
        const rotY = Math.atan2(-dz3d, dx3d);
        const iwOpenings = wallOpenings.filter(o => o.wallSegmentId === iw.id);
        const pieces = buildLocalWallPieces(lengthM, iwOpenings, h, t);
        return (
          <group key={iw.id} position={[midX, 0, midZ]} rotation={[0, rotY, 0]}>
            {pieces.map((piece, pi) => (
              <mesh key={pi} position={[piece.x, piece.y, 0]} castShadow={!piece.transparent} receiveShadow={!piece.transparent}>
                <boxGeometry args={[piece.w, piece.h, piece.transparent ? 0.01 : t]} />
                <meshStandardMaterial
                  color={piece.color}
                  roughness={piece.transparent ? 0.05 : piece.color === '#ffffff' ? 0.4 : 0.9}
                  metalness={piece.transparent ? 0.1 : 0}
                  transparent={piece.transparent}
                  opacity={piece.opacity ?? 1}
                />
              </mesh>
            ))}
            {iwOpenings.filter(o => o.type === 'door').map(o => (
              <LocalDoor3D key={o.id} opening={o} lengthM={lengthM} onToggle={() => onToggleDoor?.(o.id)} />
            ))}
          </group>
        );
      })}
    </group>
  );
}
