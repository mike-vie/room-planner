'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line, Circle } from 'react-konva';
import Konva from 'konva';
import Grid from './Grid';
import Wall from './Wall';
import FurnitureItem2D from './FurnitureItem2D';
import WallOpening2D from './WallOpening2D';
import { useRoomStore } from '@/store/useRoomStore';
import { furnitureCatalog } from '@/data/furniture-catalog';
import { WallSide, WallPoint, CustomWallSegment, WINDOW_WIDTH, BALCONY_DOOR_WIDTH, DOOR_WIDTH } from '@/types';

// Snap to 10cm grid
function snapToGrid(x: number, y: number, grid = 10): WallPoint {
  return { x: Math.round(x / grid) * grid, y: Math.round(y / grid) * grid };
}

// Snap to nearest existing point within threshold (cm)
function nearestPoint(x: number, y: number, points: WallPoint[], threshold: number) {
  for (let i = 0; i < points.length; i++) {
    const d = Math.hypot(x - points[i].x, y - points[i].y);
    if (d < threshold) return { pt: points[i], index: i };
  }
  return null;
}

// Distance from point (px, py) to segment, returns {dist, pos} where pos = cm along segment
function ptToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return { dist: Math.hypot(px - x1, py - y1), pos: 0 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const dist = Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  return { dist, pos: t * Math.sqrt(lenSq) };
}

// Derive wall segments from all saved chains
function chainsToSegments(chains: WallPoint[][]): CustomWallSegment[] {
  return chains.flatMap((pts, c) => {
    if (pts.length < 2) return [];
    return pts.slice(0, pts.length - 1).map((p, s) => ({
      id: `chain-${c}-seg-${s}`,
      x1: p.x, y1: p.y,
      x2: pts[s + 1].x,
      y2: pts[s + 1].y,
    }));
  });
}

export default function Canvas2D() {
  const {
    roomWidth, roomHeight, furniture, selectedFurnitureId, selectFurniture,
    wallOpenings, placementMode, addWallOpening, setPlacementMode,
    wallChains, drawingWalls, addWallChain, setDrawingWalls,
  } = useRoomStore();

  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 600, height: 500 });
  const [scale, setScale] = useState(1);

  // Drawing state (local only)
  const [drawingPts, setDrawingPts] = useState<WallPoint[]>([]);
  const [previewPt, setPreviewPt] = useState<WallPoint | null>(null);

  const padding = 40;
  const isPolygonMode = wallChains.some(c => c.length >= 2);
  const customSegments = chainsToSegments(wallChains);

  // Bounding box for canvas scale (account for all saved chains + current drawing)
  const allActivePts = [...wallChains.flat(), ...drawingPts];
  const bboxMinX = allActivePts.length > 0 ? Math.min(0, ...allActivePts.map(p => p.x)) : 0;
  const bboxMinY = allActivePts.length > 0 ? Math.min(0, ...allActivePts.map(p => p.y)) : 0;
  const bboxMaxX = allActivePts.length > 0 ? Math.max(roomWidth, ...allActivePts.map(p => p.x)) : roomWidth;
  const bboxMaxY = allActivePts.length > 0 ? Math.max(roomHeight, ...allActivePts.map(p => p.y)) : roomHeight;
  const bboxW = bboxMaxX - bboxMinX;
  const bboxH = bboxMaxY - bboxMinY;

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      setStageSize({ width: w, height: h });
      const sx = (w - padding * 2) / bboxW;
      const sy = (h - padding * 2) / bboxH;
      setScale(Math.min(sx, sy, 1.5));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [roomWidth, roomHeight, bboxW, bboxH]);

  const offsetX = (stageSize.width - bboxW * scale) / 2 - bboxMinX * scale;
  const offsetY = (stageSize.height - bboxH * scale) / 2 - bboxMinY * scale;

  // Snap threshold in cm based on current scale
  const snapCm = 20 / scale;

  // Default 4-wall rectangle
  const rectWalls = [
    { id: 'w-top',    x1: 0,         y1: 0,          x2: roomWidth, y2: 0 },
    { id: 'w-right',  x1: roomWidth, y1: 0,          x2: roomWidth, y2: roomHeight },
    { id: 'w-bottom', x1: roomWidth, y1: roomHeight, x2: 0,         y2: roomHeight },
    { id: 'w-left',   x1: 0,         y1: roomHeight, x2: 0,         y2: 0 },
  ];
  const wallsToRender = isPolygonMode ? customSegments : rectWalls;

  // Escape cancels drawing
  useEffect(() => {
    if (!drawingWalls) { setDrawingPts([]); setPreviewPt(null); return; }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDrawingWalls(false); setDrawingPts([]); setPreviewPt(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawingWalls, setDrawingWalls]);

  // Pointer-to-room coords helper
  const toRoom = (pointer: { x: number; y: number }) => ({
    x: (pointer.x - offsetX) / scale,
    y: (pointer.y - offsetY) / scale,
  });

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!drawingWalls) return;
    const ptr = e.target.getStage()?.getPointerPosition();
    if (!ptr) return;
    const raw = toRoom(ptr);
    const snapped = snapToGrid(raw.x, raw.y);
    const near = nearestPoint(snapped.x, snapped.y, drawingPts, snapCm);
    setPreviewPt(near ? near.pt : snapped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingWalls, offsetX, offsetY, scale, drawingPts, snapCm]);

  // Finish current chain: save it (if ≥2 pts) and reset drawing state.
  // Drawing mode stays active so the user can immediately draw another chain.
  const finishChain = useCallback((pts: WallPoint[]) => {
    if (pts.length >= 2) addWallChain([...pts]);
    setDrawingPts([]);
    setPreviewPt(null);
    // drawingWalls intentionally NOT changed — user continues drawing
  }, [addWallChain]);

  const handleDblClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!drawingWalls) return;
    e.cancelBubble = true;
    // A dblclick fires 2 click events first, so drawingPts has a duplicate last point — remove it
    const pts = drawingPts.length >= 1 ? drawingPts.slice(0, -1) : drawingPts;
    finishChain(pts);
  }, [drawingWalls, drawingPts, finishChain]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const isBackground = e.target === e.target.getStage() || e.target.attrs.id === 'room-floor';

    // --- Drawing mode ---
    if (drawingWalls) {
      const ptr = e.target.getStage()?.getPointerPosition();
      if (!ptr) return;
      const raw = toRoom(ptr);
      const snapped = snapToGrid(raw.x, raw.y);
      const near = nearestPoint(snapped.x, snapped.y, drawingPts, snapCm);
      const newPt = near ? near.pt : snapped;

      // Close polygon when clicking near first point (≥ 3 pts already set)
      if (drawingPts.length >= 3) {
        const distToFirst = Math.hypot(newPt.x - drawingPts[0].x, newPt.y - drawingPts[0].y);
        if (distToFirst < snapCm) { finishChain(drawingPts); return; }
      }
      setDrawingPts(prev => [...prev, newPt]);
      return;
    }

    // --- Placement mode (window / door / balcony-door) ---
    if (placementMode !== 'none') {
      const ptr = e.target.getStage()?.getPointerPosition();
      if (!ptr) return;
      const { x: roomX, y: roomY } = toRoom(ptr);
      const openingWidth = placementMode === 'window' ? WINDOW_WIDTH : placementMode === 'door' ? DOOR_WIDTH : BALCONY_DOOR_WIDTH;
      const halfW = openingWidth / 2;

      if (isPolygonMode && customSegments.length > 0) {
        // Find nearest polygon segment
        let best = { seg: customSegments[0], dist: Infinity, pos: 0 };
        for (const seg of customSegments) {
          const segLen = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
          const { dist, pos } = ptToSeg(roomX, roomY, seg.x1, seg.y1, seg.x2, seg.y2);
          const clampedPos = Math.max(halfW, Math.min(segLen - halfW, pos));
          if (dist < best.dist) best = { seg, dist, pos: clampedPos };
        }
        addWallOpening(null, placementMode, best.pos, best.seg.id);
      } else {
        // Rectangle mode — nearest of 4 walls
        const candidates: { wall: WallSide; dist: number; pos: number }[] = [
          { wall: 'top',    dist: Math.abs(roomY),              pos: Math.max(halfW, Math.min(roomWidth  - halfW, roomX)) },
          { wall: 'bottom', dist: Math.abs(roomY - roomHeight), pos: Math.max(halfW, Math.min(roomWidth  - halfW, roomX)) },
          { wall: 'left',   dist: Math.abs(roomX),              pos: Math.max(halfW, Math.min(roomHeight - halfW, roomY)) },
          { wall: 'right',  dist: Math.abs(roomX - roomWidth),  pos: Math.max(halfW, Math.min(roomHeight - halfW, roomY)) },
        ];
        const nearest = candidates.reduce((a, b) => (a.dist < b.dist ? a : b));
        addWallOpening(nearest.wall, placementMode, nearest.pos);
      }
      setPlacementMode('none');
      return;
    }

    if (isBackground) {
      selectFurniture(null);
      setSelectedOpeningId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectFurniture, placementMode, addWallOpening, setPlacementMode, offsetX, offsetY, scale,
      roomWidth, roomHeight, drawingWalls, drawingPts, isPolygonMode, customSegments, snapCm,
      finishChain]);

  return (
    <div ref={containerRef} className={`w-full h-full bg-gray-50 ${drawingWalls ? 'cursor-crosshair' : ''}`}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onDblClick={handleDblClick}
        onMouseMove={handleMouseMove}
      >
        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          <Grid width={Math.max(roomWidth, bboxMaxX)} height={Math.max(roomHeight, bboxMaxY)} step={10} />

          {/* Room floor background (rectangle reference) */}
          <Rect
            id="room-floor"
            x={0} y={0}
            width={roomWidth} height={roomHeight}
            fill="#fafafa" stroke="#d1d5db" strokeWidth={1}
          />

          {/* Walls */}
          {wallsToRender.map((w) => (
            <Wall key={w.id} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} />
          ))}

          {/* ---- Drawing mode overlay ---- */}
          {drawingWalls && drawingPts.map((p, i) => (
            <Circle
              key={`dp${i}`}
              x={p.x} y={p.y}
              radius={7 / scale}
              fill={i === 0 && drawingPts.length >= 3 ? '#22c55e' : '#2563eb'}
              stroke="white" strokeWidth={1.5 / scale}
            />
          ))}
          {/* Line from last point to preview */}
          {drawingWalls && drawingPts.length > 0 && previewPt && (
            <Line
              points={[drawingPts[drawingPts.length - 1].x, drawingPts[drawingPts.length - 1].y, previewPt.x, previewPt.y]}
              stroke="#2563eb" strokeWidth={3 / scale} dash={[10 / scale, 5 / scale]}
            />
          )}
          {/* Dashed segments already drawn in drawing mode */}
          {drawingWalls && drawingPts.map((p, i) => {
            if (i === 0) return null;
            const prev = drawingPts[i - 1];
            return (
              <Line key={`dl${i}`} points={[prev.x, prev.y, p.x, p.y]}
                stroke="#1d4ed8" strokeWidth={4 / scale} />
            );
          })}
          {/* Cursor dot */}
          {drawingWalls && previewPt && (
            <Circle
              x={previewPt.x} y={previewPt.y} radius={4 / scale}
              fill="#2563eb" opacity={0.6}
            />
          )}

          {/* Wall openings */}
          {wallOpenings
            .filter(o => isPolygonMode ? !!o.wallSegmentId : !!o.wall)
            .map((opening) => {
              const seg = opening.wallSegmentId
                ? customSegments.find(s => s.id === opening.wallSegmentId)
                : undefined;
              if (opening.wallSegmentId && !seg) return null;
              return (
                <WallOpening2D
                  key={opening.id}
                  opening={opening}
                  roomWidth={roomWidth}
                  roomHeight={roomHeight}
                  isSelected={selectedOpeningId === opening.id}
                  segment={seg}
                  onSelect={() => { setSelectedOpeningId(opening.id); selectFurniture(null); }}
                />
              );
            })}

          {/* Furniture */}
          {furniture.map((item) => {
            const def = furnitureCatalog.find((f) => f.id === item.furnitureId);
            if (!def) return null;
            return (
              <FurnitureItem2D
                key={item.id} id={item.id}
                furnitureDef={def} x={item.x} y={item.y}
                rotation={item.rotation} isSelected={selectedFurnitureId === item.id}
                colorOverride={item.color}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
