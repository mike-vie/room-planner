'use client';

import { Group, Rect, Line, Arc } from 'react-konva';
import { WallOpening, CustomWallSegment, WINDOW_WIDTH, WINDOW_TALL_WIDTH, BALCONY_DOOR_WIDTH, DOOR_WIDTH } from '@/types';
import { useRoomStore } from '@/store/useRoomStore';
import { useEffect } from 'react';

interface WallOpening2DProps {
  opening: WallOpening;
  roomWidth: number;
  roomHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  segment?: CustomWallSegment; // provided in polygon mode
}

function getOpeningWidth(type: WallOpening['type']): number {
  switch (type) {
    case 'window': return WINDOW_WIDTH;
    case 'window-tall': return WINDOW_TALL_WIDTH;
    case 'balcony-door': return BALCONY_DOOR_WIDTH;
    case 'door': return DOOR_WIDTH;
  }
}

type OpeningTransform = {
  x: number;
  y: number;
  rotation: number;        // degrees — Group rotation = this - 90
  wallLength: number;
  dragAxis: 'x' | 'y' | null;
};

function getRectOpeningTransform(opening: WallOpening, roomWidth: number, roomHeight: number): OpeningTransform {
  const wallThickness = 6;
  switch (opening.wall) {
    case 'top':    return { x: opening.position, y: 0,                       rotation: 0,  dragAxis: 'x', wallLength: roomWidth };
    case 'bottom': return { x: opening.position, y: roomHeight - wallThickness, rotation: 0,  dragAxis: 'x', wallLength: roomWidth };
    case 'left':   return { x: 0,                y: opening.position,          rotation: 90, dragAxis: 'y', wallLength: roomHeight };
    case 'right':  return { x: roomWidth - wallThickness, y: opening.position, rotation: 90, dragAxis: 'y', wallLength: roomHeight };
    default:       return { x: 0, y: 0, rotation: 0, dragAxis: 'x', wallLength: roomWidth };
  }
}

function getSegmentOpeningTransform(opening: WallOpening, seg: CustomWallSegment): OpeningTransform {
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const cx = seg.x1 + ux * opening.position;
  const cy = seg.y1 + uy * opening.position;
  const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
  return { x: cx, y: cy, rotation: angleDeg, dragAxis: null, wallLength: len };
}

export default function WallOpening2D({ opening, roomWidth, roomHeight, isSelected, onSelect, segment }: WallOpening2DProps) {
  const { updateWallOpening, removeWallOpening, toggleDoorOpen } = useRoomStore();
  const openingWidth = getOpeningWidth(opening.type);
  const halfW = openingWidth / 2;
  const wallThickness = 6;

  const transform: OpeningTransform = segment
    ? getSegmentOpeningTransform(opening, segment)
    : getRectOpeningTransform(opening, roomWidth, roomHeight);

  useEffect(() => {
    if (!isSelected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') removeWallOpening(opening.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSelected, opening.id, removeWallOpening]);

  const handleDragEnd = (e: { target: { getAbsolutePosition: () => {x: number; y: number}; getLayer: () => { getAbsoluteTransform: () => { copy: () => { invert: () => { point: (p: {x: number; y: number}) => {x: number; y: number} } } } }; position: (p: {x: number; y: number}) => void } }) => {
    const node = e.target;
    const absPos = node.getAbsolutePosition();
    const layerTransform = node.getLayer().getAbsoluteTransform().copy().invert();
    const localPos = layerTransform.point(absPos);

    let newPosition: number;
    let resetX: number;
    let resetY: number;

    if (segment) {
      // Project onto segment
      const dx = segment.x2 - segment.x1;
      const dy = segment.y2 - segment.y1;
      const lenSq = dx * dx + dy * dy;
      const t = Math.max(halfW / transform.wallLength, Math.min(1 - halfW / transform.wallLength,
        ((localPos.x - segment.x1) * dx + (localPos.y - segment.y1) * dy) / lenSq
      ));
      newPosition = t * transform.wallLength;
      const ux = dx / transform.wallLength, uy = dy / transform.wallLength;
      resetX = segment.x1 + ux * newPosition;
      resetY = segment.y1 + uy * newPosition;
    } else if (transform.dragAxis === 'x') {
      newPosition = Math.max(halfW, Math.min(transform.wallLength - halfW, localPos.x));
      resetX = newPosition;
      resetY = transform.y;
    } else {
      newPosition = Math.max(halfW, Math.min(transform.wallLength - halfW, localPos.y));
      resetX = transform.x;
      resetY = newPosition;
    }

    updateWallOpening(opening.id, { position: newPosition });
    node.position({ x: resetX, y: resetY });
  };

  return (
    <Group
      x={transform.x}
      y={transform.y}
      rotation={transform.rotation - 90}
      draggable
      onClick={(e) => { e.cancelBubble = true; onSelect(); }}
      onDblClick={(e) => { e.cancelBubble = true; if (opening.type === 'door') toggleDoorOpen(opening.id); }}
      onTap={(e) => { e.cancelBubble = true; onSelect(); }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onDragEnd={handleDragEnd as any}
    >
      {(opening.type === 'window' || opening.type === 'window-tall') ? (
        <Group>
          <Rect x={-halfW} y={-wallThickness / 2} width={openingWidth} height={wallThickness} fill="white" />
          <Line points={[-halfW, -wallThickness / 2, halfW, -wallThickness / 2]} stroke={isSelected ? '#2563eb' : '#1e40af'} strokeWidth={isSelected ? 2 : 1.5} />
          <Line points={[-halfW, 0, halfW, 0]}                                   stroke={isSelected ? '#2563eb' : '#1e40af'} strokeWidth={isSelected ? 2 : 1.5} />
          <Line points={[-halfW, wallThickness / 2, halfW, wallThickness / 2]}   stroke={isSelected ? '#2563eb' : '#1e40af'} strokeWidth={isSelected ? 2 : 1.5} />
        </Group>
      ) : opening.type === 'door' ? (
        <Group>
          <Rect x={-halfW} y={-wallThickness / 2} width={openingWidth} height={wallThickness} fill="white" />
          <Line points={[-halfW, -wallThickness / 2, halfW, -wallThickness / 2]} stroke={isSelected ? '#2563eb' : '#92400e'} strokeWidth={isSelected ? 2.5 : 2} />
          <Line points={[-halfW, wallThickness / 2, halfW, wallThickness / 2]}   stroke={isSelected ? '#2563eb' : '#92400e'} strokeWidth={isSelected ? 2.5 : 2} />
          {opening.isOpen ? (
            <Line points={[-halfW, wallThickness / 2, -halfW, wallThickness / 2 + openingWidth]} stroke={isSelected ? '#2563eb' : '#92400e'} strokeWidth={2} />
          ) : (
            <Line points={[-halfW, wallThickness / 2, halfW, wallThickness / 2]} stroke={isSelected ? '#2563eb' : '#6B4226'} strokeWidth={3} />
          )}
          <Arc x={-halfW} y={wallThickness / 2} innerRadius={0} outerRadius={openingWidth} angle={90} rotation={-90}
            fill={opening.isOpen ? 'rgba(146,64,14,0.12)' : 'rgba(146,64,14,0.05)'}
            stroke={isSelected ? '#2563eb' : '#92400e'} strokeWidth={1} dash={opening.isOpen ? undefined : [4, 4]} />
        </Group>
      ) : (
        <Group>
          <Rect x={-halfW} y={-wallThickness / 2} width={openingWidth} height={wallThickness} fill="white" />
          <Line points={[-halfW, -wallThickness / 2, halfW, -wallThickness / 2]} stroke={isSelected ? '#2563eb' : '#7c3aed'} strokeWidth={isSelected ? 2.5 : 2} />
          <Line points={[-halfW, wallThickness / 2, halfW, wallThickness / 2]}   stroke={isSelected ? '#2563eb' : '#7c3aed'} strokeWidth={isSelected ? 2.5 : 2} />
          <Arc x={-halfW} y={wallThickness / 2} innerRadius={0} outerRadius={openingWidth} angle={90} rotation={-90}
            fill="rgba(124,58,237,0.05)" stroke={isSelected ? '#2563eb' : '#7c3aed'} strokeWidth={1} dash={[4, 4]} />
        </Group>
      )}
    </Group>
  );
}
