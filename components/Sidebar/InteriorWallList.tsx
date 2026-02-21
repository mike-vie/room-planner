'use client';

import { useRoomStore } from '@/store/useRoomStore';

export default function InteriorWallList() {
  const { interiorWalls, selectedInteriorWallId, selectInteriorWall, removeInteriorWall } = useRoomStore();

  if (interiorWalls.length === 0) return null;

  return (
    <div className="border-b border-gray-200">
      <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Innenwände ({interiorWalls.length})
        </span>
      </div>
      <ul className="max-h-36 overflow-y-auto">
        {interiorWalls.map((iw, i) => {
          const len = Math.round(Math.hypot(iw.x2 - iw.x1, iw.y2 - iw.y1));
          const isSelected = selectedInteriorWallId === iw.id;
          return (
            <li
              key={iw.id}
              className={`flex items-center justify-between px-3 py-1.5 cursor-pointer text-sm border-b border-gray-100 last:border-0 ${
                isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
              onClick={() => selectInteriorWall(isSelected ? null : iw.id)}
            >
              <span className="font-medium">Wand {i + 1}</span>
              <span className={`text-xs mr-auto ml-2 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                {len} cm
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); removeInteriorWall(iw.id); }}
                className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded"
                title="Wand löschen"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
