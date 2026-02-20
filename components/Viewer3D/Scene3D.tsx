'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import Room3D from './Room3D';
import FurnitureItem3D from './FurnitureItem3D';
import { useRoomStore } from '@/store/useRoomStore';
import { furnitureCatalog } from '@/data/furniture-catalog';

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export default function Scene3D() {
  const { roomWidth, roomHeight, furniture, selectedFurnitureId, selectFurniture, wallOpenings, hiddenWalls, toggleDoorOpen, interiorWalls } = useRoomStore();

  const camDistance = Math.max(roomWidth, roomHeight) * 0.012;

  if (!checkWebGL()) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 gap-3 p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p className="font-medium text-gray-700">3D-Vorschau nicht verfügbar</p>
        <div className="text-sm max-w-sm text-left bg-white rounded p-3 border border-gray-200">
          <p className="font-medium text-gray-700 mb-2">So aktivierst du WebGL:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Alle Chrome-Fenster schließen (auch im Tray)</li>
            <li>In PowerShell/CMD ausführen:</li>
          </ol>
          <code className="block mt-2 bg-gray-100 text-xs p-2 rounded break-all">
            chrome.exe --use-gl=swiftshader --ignore-gpu-blocklist --disable-gpu-sandbox http://localhost:3001
          </code>
          <p className="mt-2 text-xs text-gray-400">
            Alternativ: chrome://flags → „Override software rendering list" aktivieren
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-sky-100 to-sky-50">
      <Canvas
        shadows
        camera={{
          position: [camDistance * 0.8, camDistance * 0.7, camDistance * 0.8],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        onPointerMissed={() => selectFurniture(null)}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} color="#faf5ef" />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.4}
            color="#fff8ee"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-3, 5, -2]} intensity={0.25} color="#e8eeff" />
          <directionalLight position={[0, 6, 4]} intensity={0.15} color="#fff5e0" />

          <Environment preset="apartment" />

          <Room3D roomWidth={roomWidth} roomHeight={roomHeight} interiorWalls={interiorWalls} wallOpenings={wallOpenings} hiddenWalls={hiddenWalls} onToggleDoor={toggleDoorOpen} />

          {furniture.map((item) => {
            const def = furnitureCatalog.find((f) => f.id === item.furnitureId);
            if (!def) return null;
            return (
              <FurnitureItem3D
                key={item.id}
                id={item.id}
                furnitureDef={def}
                x={item.x}
                y={item.y}
                rotation={item.rotation}
                roomWidth={roomWidth}
                roomHeight={roomHeight}
                isSelected={selectedFurnitureId === item.id}
                colorOverride={item.color}
              />
            );
          })}

          <ContactShadows
            position={[0, 0.001, 0]}
            opacity={0.4}
            scale={20}
            blur={2}
            far={5}
          />
        </Suspense>

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          maxPolarAngle={Math.PI / 2.1}
          minDistance={1}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}
