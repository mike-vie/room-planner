'use client';

import { useRoomStore } from '@/store/useRoomStore';

export default function InteriorWallPanel() {
  const { interiorWalls, selectedInteriorWallId, selectInteriorWall, removeInteriorWall } = useRoomStore();

  if (interiorWalls.length === 0) return null;

  return (
    <div className="absolute top-8 right-2 z-10 bg-white rounded-lg shadow-lg border border-gray-200 w-44">
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Innenwände
        </span>
      </div>
      <ul className="max-h-48 overflow-y-auto py-1">
        {interiorWalls.map((iw, i) => {
          const len = Math.round(Math.hypot(iw.x2 - iw.x1, iw.y2 - iw.y1));
          const isSelected = selectedInteriorWallId === iw.id;
          return (
            <li
              key={iw.id}
              onClick={() => selectInteriorWall(isSelected ? null : iw.id)}
              className={`flex items-center justify-between px-3 py-1.5 cursor-pointer text-sm transition-colors ${
                isSelected
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-xs">Wand {i + 1}</span>
                <span className={`text-xs ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}>{len} cm</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeInteriorWall(iw.id); }}
                className="text-gray-300 hover:text-red-500 transition-colors p-0.5 rounded"
                title="Löschen"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
