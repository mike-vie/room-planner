'use client';

import { Group, Rect, Text } from 'react-konva';
import { FurnitureDef } from '@/types';
import { useRoomStore } from '@/store/useRoomStore';

interface FurnitureItem2DProps {
  id: string;
  furnitureDef: FurnitureDef;
  x: number;
  y: number;
  rotation: number;
  isSelected: boolean;
  colorOverride?: string;
}

export default function FurnitureItem2D({
  id,
  furnitureDef,
  x,
  y,
  rotation,
  isSelected,
  colorOverride,
}: FurnitureItem2DProps) {
  const { updateFurniture, selectFurniture } = useRoomStore();
  const { width, depth, color, name } = furnitureDef;

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable
      onClick={() => selectFurniture(id)}
      onTap={() => selectFurniture(id)}
      onDragEnd={(e) => {
        updateFurniture(id, { x: e.target.x(), y: e.target.y() });
      }}
      onDblClick={() => {
        updateFurniture(id, { rotation: (rotation + 90) % 360 });
      }}
      onDblTap={() => {
        updateFurniture(id, { rotation: (rotation + 90) % 360 });
      }}
    >
      <Rect
        width={width}
        height={depth}
        offsetX={width / 2}
        offsetY={depth / 2}
        fill={colorOverride ?? color}
        stroke={isSelected ? '#2563eb' : '#374151'}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={2}
        shadowColor={isSelected ? '#2563eb' : undefined}
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={0.3}
      />
      <Text
        text={name}
        width={width}
        height={depth}
        offsetX={width / 2}
        offsetY={depth / 2}
        align="center"
        verticalAlign="middle"
        fontSize={Math.min(12, width / 6)}
        fill="#1f2937"
        listening={false}
      />
    </Group>
  );
}
