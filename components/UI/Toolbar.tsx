'use client';

import { useState } from 'react';
import { useRoomStore } from '@/store/useRoomStore';

interface ToolbarProps {
  is3DFullscreen: boolean;
  onToggle3DFullscreen: () => void;
}

export default function Toolbar({ is3DFullscreen, onToggle3DFullscreen }: ToolbarProps) {
  const {
    roomWidth, roomHeight, setRoomSize, clearAll, furniture,
    placementMode, setPlacementMode, hiddenWalls, toggleWall,
    drawingInteriorWall, setDrawingInteriorWall,
    interiorWalls, selectedInteriorWallId, selectInteriorWall, removeInteriorWall,
    outerWallColors, interiorWallColor, setOuterWallColor, setInteriorWallColor,
  } = useRoomStore();
  const [width, setWidth] = useState(roomWidth.toString());
  const [height, setHeight] = useState(roomHeight.toString());

  const handleApply = () => {
    const w = Math.max(100, Math.min(2000, parseInt(width) || 400));
    const h = Math.max(100, Math.min(2000, parseInt(height) || 500));
    setWidth(w.toString());
    setHeight(h.toString());
    setRoomSize(w, h);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 flex-wrap">
      <span className="font-semibold text-sm">Raumplaner</span>
      <div className="h-4 w-px bg-gray-300" />

      {/* Room size */}
      <div className="flex items-center gap-2 text-sm">
        <label className="text-gray-600">Breite:</label>
        <input
          type="number"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-sm"
          min={100} max={2000}
        />
        <label className="text-gray-600">Tiefe:</label>
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="w-16 px-1.5 py-0.5 border border-gray-300 rounded text-sm"
          min={100} max={2000}
        />
        <span className="text-gray-400 text-xs">cm</span>
        <button
          onClick={handleApply}
          className="px-2 py-0.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Anwenden
        </button>
      </div>
      <div className="h-4 w-px bg-gray-300" />

      {/* Interior wall drawing */}
      <button
        onClick={() => setDrawingInteriorWall(!drawingInteriorWall)}
        className={`px-2 py-0.5 rounded text-sm transition-colors ${
          drawingInteriorWall
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {drawingInteriorWall ? 'Zeichnen beenden' : 'Innenwand'}
      </button>
      {drawingInteriorWall && (
        <span className="text-xs text-orange-600 font-medium">
          1. Klick = Startpunkt · 2. Klick = Endpunkt · Esc = Abbrechen
        </span>
      )}


      {!drawingInteriorWall && (
        <>
          <div className="h-4 w-px bg-gray-300" />

          {/* Openings */}
          <button
            onClick={() => setPlacementMode(placementMode === 'window' ? 'none' : 'window')}
            className={`px-2 py-0.5 rounded text-sm transition-colors ${
              placementMode === 'window' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Fenster
          </button>
          <button
            onClick={() => setPlacementMode(placementMode === 'window-tall' ? 'none' : 'window-tall')}
            className={`px-2 py-0.5 rounded text-sm transition-colors ${
              placementMode === 'window-tall' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hohes Fenster
          </button>
          <button
            onClick={() => setPlacementMode(placementMode === 'balcony-door' ? 'none' : 'balcony-door')}
            className={`px-2 py-0.5 rounded text-sm transition-colors ${
              placementMode === 'balcony-door' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Balkontür
          </button>
          <button
            onClick={() => setPlacementMode(placementMode === 'door' ? 'none' : 'door')}
            className={`px-2 py-0.5 rounded text-sm transition-colors ${
              placementMode === 'door' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tür
          </button>
          {placementMode !== 'none' && (
            <span className="text-xs text-blue-600 font-medium">Klick auf Wand</span>
          )}

          <div className="h-4 w-px bg-gray-300" />

          {/* Outer wall visibility + per-wall color */}
          {([
            ['top', 'Hinten'],
            ['left', 'Links'],
            ['bottom', 'Vorne'],
            ['right', 'Rechts'],
          ] as const).map(([side, label]) => {
            const isHidden = hiddenWalls.includes(side);
            return (
              <div key={side} className="flex items-center gap-0.5">
                <button
                  onClick={() => toggleWall(side)}
                  className={`px-2 py-0.5 rounded-l text-sm transition-colors ${
                    isHidden ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-gray-700 text-white hover:bg-gray-800'
                  }`}
                  title={isHidden ? `${label} Wand einblenden` : `${label} Wand ausblenden`}
                >
                  {label}
                </button>
                <input
                  type="color"
                  value={outerWallColors[side] ?? '#f2efe9'}
                  onChange={(e) => setOuterWallColor(side, e.target.value)}
                  className="w-6 h-[1.375rem] rounded-r border border-l-0 border-gray-300 cursor-pointer p-0"
                  title={`${label} Wandfarbe`}
                />
              </div>
            );
          })}
        </>
      )}

      <div className="h-4 w-px bg-gray-300" />

      {/* Interior wall color */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-600 text-xs">Innenwand:</span>
        <input
          type="color"
          value={interiorWallColor}
          onChange={(e) => setInteriorWallColor(e.target.value)}
          className="w-6 h-6 border border-gray-300 rounded cursor-pointer p-0"
          title="Innenwand Farbe"
        />
      </div>

      <div className="h-4 w-px bg-gray-300" />
      <span className="text-xs text-gray-500">{furniture.length} Möbel</span>

      <div className="flex-1" />


<button
        onClick={onToggle3DFullscreen}
        title={is3DFullscreen ? 'Vollbild beenden' : '3D Vollbild'}
        className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
      >
        {is3DFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
            <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
          </svg>
        )}
        {is3DFullscreen ? 'Vollbild beenden' : '3D Vollbild'}
      </button>
      <div className="flex items-center gap-1 border border-gray-300 rounded px-2 py-0.5 bg-gray-50">
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Innenwände:</span>
        {interiorWalls.length === 0 && <span className="text-xs text-gray-400">–</span>}
        {interiorWalls.map((iw, i) => {
          const len = Math.round(Math.hypot(iw.x2 - iw.x1, iw.y2 - iw.y1));
          const isSelected = selectedInteriorWallId === iw.id;
          return (
            <span key={iw.id} className="flex items-center gap-0.5">
              <button
                onClick={() => selectInteriorWall(isSelected ? null : iw.id)}
                className={`text-xs px-1 rounded ${isSelected ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                W{i + 1}
              </button>
              <button
                onClick={() => removeInteriorWall(iw.id)}
                className="text-gray-400 hover:text-red-500 text-xs leading-none"
              >×</button>
            </span>
          );
        })}
      </div>
      <button
        onClick={clearAll}
        className="px-2 py-0.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
      >
        Alles zurücksetzen
      </button>
    </div>
  );
}
