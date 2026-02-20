'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line, Circle, Group, Text } from 'react-konva';
import Konva from 'konva';
import Grid from './Grid';
import Ruler from './Ruler';
import Wall from './Wall';
import FurnitureItem2D from './FurnitureItem2D';
import WallOpening2D from './WallOpening2D';
import { useRoomStore } from '@/store/useRoomStore';
import { furnitureCatalog } from '@/data/furniture-catalog';
import { WallPoint, CustomWallSegment, WINDOW_WIDTH, BALCONY_DOOR_WIDTH, DOOR_WIDTH } from '@/types';

function snapToGrid(x: number, y: number, grid = 10): WallPoint {
  return { x: Math.round(x / grid) * grid, y: Math.round(y / grid) * grid };
}

// Distance from point to line segment; returns dist in room units and pos along segment
function ptToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return { dist: Math.hypot(px - x1, py - y1), pos: 0 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const dist = Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  return { dist, pos: t * Math.sqrt(lenSq) };
}

export default function Canvas2D() {
  const {
    roomWidth, roomHeight, furniture, selectedFurnitureId, selectFurniture,
    wallOpenings, placementMode, addWallOpening, setPlacementMode,
    hiddenWalls,
    interiorWalls, drawingInteriorWall, selectedInteriorWallId,
    addInteriorWall, removeInteriorWall, setDrawingInteriorWall, selectInteriorWall,
  } = useRoomStore();

  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 600, height: 500 });
  const [scale, setScale] = useState(1);

  // Interior wall drawing state (local)
  const [drawStartPt, setDrawStartPt] = useState<WallPoint | null>(null);
  const [previewPt, setPreviewPt] = useState<WallPoint | null>(null);

  const padding = 52; // extra space for ruler

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      setStageSize({ width: w, height: h });
      const sx = (w - padding * 2) / roomWidth;
      const sy = (h - padding * 2) / roomHeight;
      setScale(Math.min(sx, sy, 1.5));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [roomWidth, roomHeight]);

  const offsetX = (stageSize.width - roomWidth * scale) / 2;
  const offsetY = (stageSize.height - roomHeight * scale) / 2;

  // Default 4-wall rectangle
  const rectWalls = [
    { id: 'w-top',    x1: 0,         y1: 0,          x2: roomWidth, y2: 0 },
    { id: 'w-right',  x1: roomWidth, y1: 0,          x2: roomWidth, y2: roomHeight },
    { id: 'w-bottom', x1: roomWidth, y1: roomHeight, x2: 0,         y2: roomHeight },
    { id: 'w-left',   x1: 0,         y1: roomHeight, x2: 0,         y2: 0 },
  ];

  // Pointer-to-room coords
  const toRoom = (pointer: { x: number; y: number }) => ({
    x: (pointer.x - offsetX) / scale,
    y: (pointer.y - offsetY) / scale,
  });

  // Escape / cancel drawing
  useEffect(() => {
    if (!drawingInteriorWall) { setDrawStartPt(null); setPreviewPt(null); return; }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawStartPt) {
          setDrawStartPt(null);
          setPreviewPt(null);
        } else {
          setDrawingInteriorWall(false);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawingInteriorWall, drawStartPt, setDrawingInteriorWall]);

  // Delete selected interior wall
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedInteriorWallId) {
        removeInteriorWall(selectedInteriorWallId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedInteriorWallId, removeInteriorWall]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!drawingInteriorWall) return;
    const ptr = e.target.getStage()?.getPointerPosition();
    if (!ptr) return;
    const raw = toRoom(ptr);
    setPreviewPt(snapToGrid(raw.x, raw.y));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingInteriorWall, offsetX, offsetY, scale]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const isBackground = e.target === e.target.getStage() || e.target.attrs.id === 'room-floor';
    const ptr = e.target.getStage()?.getPointerPosition();
    if (!ptr) return;
    const raw = toRoom(ptr);

    // --- Interior wall drawing mode ---
    if (drawingInteriorWall) {
      const roomPt = snapToGrid(raw.x, raw.y);
      if (!drawStartPt) {
        setDrawStartPt(roomPt);
      } else {
        const id = `iw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        addInteriorWall({ id, x1: drawStartPt.x, y1: drawStartPt.y, x2: roomPt.x, y2: roomPt.y });
        setDrawStartPt(null);
        setPreviewPt(null);
      }
      return;
    }

    // --- Placement mode ---
    if (placementMode !== 'none') {
      const { x: roomX, y: roomY } = raw;
      const openingWidth = placementMode === 'window' ? WINDOW_WIDTH : placementMode === 'door' ? DOOR_WIDTH : BALCONY_DOOR_WIDTH;
      const halfW = openingWidth / 2;

      // Find nearest interior wall
      let bestInterior: { wall: typeof interiorWalls[0]; dist: number; pos: number } | null = null;
      for (const iw of interiorWalls) {
        const segLen = Math.hypot(iw.x2 - iw.x1, iw.y2 - iw.y1);
        const { dist, pos } = ptToSeg(roomX, roomY, iw.x1, iw.y1, iw.x2, iw.y2);
        const clampedPos = Math.max(halfW, Math.min(segLen - halfW, pos));
        if (!bestInterior || dist < bestInterior.dist) {
          bestInterior = { wall: iw, dist, pos: clampedPos };
        }
      }

      // Find nearest outer wall
      const outerCandidates = [
        { wall: 'top'    as const, dist: Math.abs(roomY),              pos: Math.max(halfW, Math.min(roomWidth  - halfW, roomX)) },
        { wall: 'bottom' as const, dist: Math.abs(roomY - roomHeight), pos: Math.max(halfW, Math.min(roomWidth  - halfW, roomX)) },
        { wall: 'left'   as const, dist: Math.abs(roomX),              pos: Math.max(halfW, Math.min(roomHeight - halfW, roomY)) },
        { wall: 'right'  as const, dist: Math.abs(roomX - roomWidth),  pos: Math.max(halfW, Math.min(roomHeight - halfW, roomY)) },
      ];
      const nearestOuter = outerCandidates.reduce((a, b) => (a.dist < b.dist ? a : b));

      if (bestInterior && bestInterior.dist < nearestOuter.dist) {
        addWallOpening(null, placementMode, bestInterior.pos, bestInterior.wall.id);
      } else {
        addWallOpening(nearestOuter.wall, placementMode, nearestOuter.pos);
      }
      setPlacementMode('none');
      return;
    }

    if (isBackground) {
      selectFurniture(null);
      selectInteriorWall(null);
      setSelectedOpeningId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectFurniture, selectInteriorWall, placementMode, addWallOpening, setPlacementMode,
    offsetX, offsetY, scale, roomWidth, roomHeight,
    drawingInteriorWall, drawStartPt, interiorWalls, addInteriorWall,
  ]);

  return (
    <div ref={containerRef} className={`w-full h-full bg-gray-50 ${drawingInteriorWall ? 'cursor-crosshair' : ''}`}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
      >
        <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
          <Grid width={roomWidth} height={roomHeight} step={10} />
          <Ruler width={roomWidth} height={roomHeight} scale={scale} />

          {/* Room floor */}
          <Rect
            id="room-floor"
            x={0} y={0}
            width={roomWidth} height={roomHeight}
            fill="#fafafa" stroke="#d1d5db" strokeWidth={1}
          />

          {/* Outer walls */}
          {rectWalls
            .filter(w => {
              const side = w.id.replace('w-', '') as 'top' | 'right' | 'bottom' | 'left';
              return !hiddenWalls.includes(side);
            })
            .map((w) => (
              <Wall key={w.id} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} />
            ))}

          {/* Interior walls */}
          {interiorWalls.map((iw) => {
            const isSelected = selectedInteriorWallId === iw.id;
            const midX = (iw.x1 + iw.x2) / 2;
            const midY = (iw.y1 + iw.y2) / 2;
            const lenCm = Math.round(Math.hypot(iw.x2 - iw.x1, iw.y2 - iw.y1));
            return (
              <Group key={iw.id}>
                <Line
                  points={[iw.x1, iw.y1, iw.x2, iw.y2]}
                  stroke={isSelected ? '#2563eb' : '#1f2937'}
                  strokeWidth={6}
                  lineCap="round"
                  onClick={(e) => {
                    e.cancelBubble = true;
                    selectInteriorWall(iw.id);
                    selectFurniture(null);
                    setSelectedOpeningId(null);
                  }}
                />
                {isSelected && (
                  <>
                    {/* Length label */}
                    <Text
                      x={midX + 8 / scale}
                      y={midY - 18 / scale}
                      text={`${lenCm} cm`}
                      fontSize={13 / scale}
                      fill="#2563eb"
                      fontStyle="bold"
                      listening={false}
                    />
                    {/* Delete button */}
                    <Group
                      x={midX}
                      y={midY}
                      onClick={(e) => { e.cancelBubble = true; removeInteriorWall(iw.id); }}
                    >
                      <Circle radius={14 / scale} fill="#ef4444" />
                      <Text
                        text="✕"
                        fontSize={12 / scale}
                        fill="white"
                        fontStyle="bold"
                        offsetX={4.5 / scale}
                        offsetY={5.5 / scale}
                        listening={false}
                      />
                    </Group>
                  </>
                )}
              </Group>
            );
          })}

          {/* Drawing preview */}
          {drawingInteriorWall && drawStartPt && (
            <>
              <Circle
                x={drawStartPt.x} y={drawStartPt.y}
                radius={7 / scale}
                fill="#2563eb" stroke="white" strokeWidth={1.5 / scale}
              />
              {previewPt && (
                <>
                  <Line
                    points={[drawStartPt.x, drawStartPt.y, previewPt.x, previewPt.y]}
                    stroke="#2563eb" strokeWidth={3 / scale} dash={[10 / scale, 5 / scale]}
                  />
                  {/* Length label */}
                  <Text
                    x={(drawStartPt.x + previewPt.x) / 2 + 8 / scale}
                    y={(drawStartPt.y + previewPt.y) / 2 - 18 / scale}
                    text={`${Math.round(Math.hypot(previewPt.x - drawStartPt.x, previewPt.y - drawStartPt.y))} cm`}
                    fontSize={13 / scale}
                    fill="#1d4ed8"
                    fontStyle="bold"
                    listening={false}
                  />
                </>
              )}
            </>
          )}
          {drawingInteriorWall && previewPt && (
            <Circle x={previewPt.x} y={previewPt.y} radius={4 / scale} fill="#2563eb" opacity={0.6} />
          )}

          {/* Wall openings */}
          {wallOpenings.map((opening) => {
            const seg = opening.wallSegmentId
              ? interiorWalls.find(w => w.id === opening.wallSegmentId) as CustomWallSegment | undefined
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
                onSelect={() => {
                  setSelectedOpeningId(opening.id);
                  selectFurniture(null);
                  selectInteriorWall(null);
                }}
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
