'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import FurnitureCatalog from '@/components/Sidebar/FurnitureCatalog';
import Toolbar from '@/components/UI/Toolbar';
import PropertiesPanel from '@/components/UI/PropertiesPanel';
import Scene3DErrorBoundary from '@/components/Viewer3D/Scene3DErrorBoundary';

const Canvas2D = dynamic(() => import('@/components/Editor2D/Canvas2D'), { ssr: false });
const Scene3D = dynamic(() => import('@/components/Viewer3D/Scene3D'), { ssr: false });

export default function Home() {
  const [is3DFullscreen, setIs3DFullscreen] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const wasFullscreen = useRef(false);

  useEffect(() => {
    if (wasFullscreen.current && !is3DFullscreen) {
      setSceneKey(k => k + 1);
    }
    wasFullscreen.current = is3DFullscreen;
  }, [is3DFullscreen]);

  const toggle3DFullscreen = () => setIs3DFullscreen(v => !v);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIs3DFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <Toolbar is3DFullscreen={is3DFullscreen} onToggle3DFullscreen={toggle3DFullscreen} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white overflow-hidden">
          <FurnitureCatalog />
        </aside>

        {/* Split View */}
        <div className={is3DFullscreen ? 'fixed inset-0 z-50 flex' : 'flex-1 flex flex-col lg:flex-row'}>
          {/* 2D Editor */}
          <div className={is3DFullscreen ? 'hidden' : 'relative flex-1 min-h-0 border-b lg:border-b-0 lg:border-r border-gray-200'}>
            <div className="absolute top-2 left-2 bg-white/80 text-xs text-gray-500 px-2 py-1 rounded z-10">
              2D Grundriss
            </div>
            <Canvas2D />
            <PropertiesPanel />
          </div>

          {/* 3D Viewer */}
          <div className="relative flex-1 min-h-0">
            <Scene3DErrorBoundary key={sceneKey}>
              <Scene3D />
            </Scene3DErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
