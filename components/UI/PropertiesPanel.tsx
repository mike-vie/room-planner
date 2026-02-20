'use client';

import { useRoomStore } from '@/store/useRoomStore';
import { furnitureCatalog } from '@/data/furniture-catalog';

export default function PropertiesPanel() {
  const { furniture, selectedFurnitureId, updateFurniture, removeFurniture } = useRoomStore();

  const selected = furniture.find((f) => f.id === selectedFurnitureId);
  if (!selected) return null;

  const def = furnitureCatalog.find((f) => f.id === selected.furnitureId);
  if (!def) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64 z-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{def.name}</h3>
        <button
          onClick={() => removeFurniture(selected.id)}
          className="text-red-500 hover:text-red-700 text-xs font-medium"
        >
          Löschen
        </button>
      </div>
      <div className="text-xs text-gray-500 mb-3">
        {def.series} &middot; {def.width}x{def.depth}x{def.height} cm
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600 w-12">X:</label>
          <input
            type="number"
            value={Math.round(selected.x)}
            onChange={(e) => updateFurniture(selected.id, { x: parseInt(e.target.value) || 0 })}
            className="flex-1 px-1.5 py-0.5 border border-gray-300 rounded text-sm"
          />
          <span className="text-xs text-gray-400">cm</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600 w-12">Y:</label>
          <input
            type="number"
            value={Math.round(selected.y)}
            onChange={(e) => updateFurniture(selected.id, { y: parseInt(e.target.value) || 0 })}
            className="flex-1 px-1.5 py-0.5 border border-gray-300 rounded text-sm"
          />
          <span className="text-xs text-gray-400">cm</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600 w-12">Drehung:</label>
          <input
            type="number"
            value={selected.rotation}
            onChange={(e) => updateFurniture(selected.id, { rotation: parseInt(e.target.value) || 0 })}
            className="flex-1 px-1.5 py-0.5 border border-gray-300 rounded text-sm"
            step={15}
          />
          <span className="text-xs text-gray-400">°</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600 w-12">Farbe:</label>
          <input
            type="color"
            value={selected.color ?? def.color}
            onChange={(e) => updateFurniture(selected.id, { color: e.target.value })}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <span className="text-xs text-gray-400">{selected.color ?? def.color}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">Doppelklick in 2D = 90° drehen</p>
    </div>
  );
}
