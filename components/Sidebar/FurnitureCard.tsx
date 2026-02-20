'use client';

import { FurnitureDef } from '@/types';
import { useRoomStore } from '@/store/useRoomStore';

interface FurnitureCardProps {
  furniture: FurnitureDef;
}

export default function FurnitureCard({ furniture }: FurnitureCardProps) {
  const addFurniture = useRoomStore((s) => s.addFurniture);

  return (
    <button
      onClick={() => addFurniture(furniture.id)}
      className="w-full text-left p-2 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded flex-shrink-0 border border-gray-300"
          style={{ backgroundColor: furniture.color }}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{furniture.name}</div>
          <div className="text-xs text-gray-500">
            {furniture.width} x {furniture.depth} x {furniture.height} cm
          </div>
        </div>
      </div>
    </button>
  );
}
