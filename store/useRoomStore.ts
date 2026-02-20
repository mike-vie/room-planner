import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlacedFurniture, WallOpening, WallOpeningType, WallSide, WallPoint } from '@/types';

type PlacementMode = 'none' | 'window' | 'balcony-door' | 'door';

interface RoomStore {
  roomWidth: number;
  roomHeight: number;
  furniture: PlacedFurniture[];
  wallOpenings: WallOpening[];
  selectedFurnitureId: string | null;
  placementMode: PlacementMode;
  hiddenWalls: WallSide[];
  wallChains: WallPoint[][];  // [] = rectangle mode; each chain ≥2 pts = custom wall segment
  drawingWalls: boolean;      // wall drawing mode active (not persisted)

  setRoomSize: (width: number, height: number) => void;
  addFurniture: (furnitureId: string) => void;
  updateFurniture: (id: string, updates: Partial<PlacedFurniture>) => void;
  removeFurniture: (id: string) => void;
  selectFurniture: (id: string | null) => void;
  setPlacementMode: (mode: PlacementMode) => void;
  addWallOpening: (wall: WallSide | null, type: WallOpeningType, position: number, wallSegmentId?: string) => void;
  removeWallOpening: (id: string) => void;
  updateWallOpening: (id: string, updates: Partial<WallOpening>) => void;
  toggleWall: (wall: WallSide) => void;
  toggleDoorOpen: (id: string) => void;
  clearAll: () => void;
  addWallChain: (chain: WallPoint[]) => void;  // save one chain; drawing mode stays active
  setDrawingWalls: (active: boolean) => void;
  resetWalls: () => void;
}

export const useRoomStore = create<RoomStore>()(
  persist(
    (set, get) => ({
      roomWidth: 400,
      roomHeight: 500,
      furniture: [],
      wallOpenings: [],
      selectedFurnitureId: null,
      placementMode: 'none' as PlacementMode,
      hiddenWalls: ['bottom', 'right'] as WallSide[],
      wallChains: [],
      drawingWalls: false,

      setRoomSize: (width, height) => set({ roomWidth: width, roomHeight: height }),

      addFurniture: (furnitureId) => {
        const id = `placed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const { roomWidth, roomHeight } = get();
        set((state) => ({
          furniture: [
            ...state.furniture,
            { id, furnitureId, x: roomWidth / 2, y: roomHeight / 2, rotation: 0 },
          ],
          selectedFurnitureId: id,
        }));
      },

      updateFurniture: (id, updates) =>
        set((state) => ({
          furniture: state.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),

      removeFurniture: (id) =>
        set((state) => ({
          furniture: state.furniture.filter((f) => f.id !== id),
          selectedFurnitureId: state.selectedFurnitureId === id ? null : state.selectedFurnitureId,
        })),

      selectFurniture: (id) => set({ selectedFurnitureId: id }),

      setPlacementMode: (mode) => set({ placementMode: mode }),

      addWallOpening: (wall, type, position, wallSegmentId) => {
        const id = `opening-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const opening: WallOpening = { id, type, position };
        if (wallSegmentId) opening.wallSegmentId = wallSegmentId;
        else if (wall) opening.wall = wall;
        set((state) => ({ wallOpenings: [...state.wallOpenings, opening] }));
      },

      removeWallOpening: (id) =>
        set((state) => ({
          wallOpenings: state.wallOpenings.filter((o) => o.id !== id),
        })),

      updateWallOpening: (id, updates) =>
        set((state) => ({
          wallOpenings: state.wallOpenings.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        })),

      toggleWall: (wall) =>
        set((state) => ({
          hiddenWalls: state.hiddenWalls.includes(wall)
            ? state.hiddenWalls.filter((w) => w !== wall)
            : [...state.hiddenWalls, wall],
        })),

      toggleDoorOpen: (id) =>
        set((state) => ({
          wallOpenings: state.wallOpenings.map((o) =>
            o.id === id ? { ...o, isOpen: !o.isOpen } : o
          ),
        })),

      clearAll: () => set({ furniture: [], wallOpenings: [], selectedFurnitureId: null, placementMode: 'none' as PlacementMode }),

      addWallChain: (chain) =>
        set((state) => ({ wallChains: [...state.wallChains, chain] })),
        // Note: drawingWalls is intentionally NOT changed here — user stays in drawing mode

      setDrawingWalls: (active) => set({ drawingWalls: active }),

      resetWalls: () =>
        set((state) => ({
          wallChains: [],
          drawingWalls: false,
          // Remove custom-wall openings (their segments no longer exist)
          wallOpenings: state.wallOpenings.filter((o) => !o.wallSegmentId),
        })),
    }),
    {
      name: 'room-planner-storage',
      // Don't persist transient UI state
      partialize: (state) => ({
        roomWidth: state.roomWidth,
        roomHeight: state.roomHeight,
        furniture: state.furniture,
        wallOpenings: state.wallOpenings,
        hiddenWalls: state.hiddenWalls,
        wallChains: state.wallChains,
      }),
    }
  )
);
