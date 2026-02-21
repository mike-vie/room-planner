import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlacedFurniture, WallOpening, WallOpeningType, WallSide, InteriorWall } from '@/types';

type PlacementMode = 'none' | 'window' | 'window-tall' | 'balcony-door' | 'door';

interface RoomStore {
  roomWidth: number;
  roomHeight: number;
  furniture: PlacedFurniture[];
  wallOpenings: WallOpening[];
  selectedFurnitureId: string | null;
  placementMode: PlacementMode;
  hiddenWalls: WallSide[];
  interiorWalls: InteriorWall[];
  drawingInteriorWall: boolean;       // transient (not persisted)
  selectedInteriorWallId: string | null; // transient

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
  addInteriorWall: (wall: InteriorWall) => void;
  removeInteriorWall: (id: string) => void;
  setDrawingInteriorWall: (active: boolean) => void;
  selectInteriorWall: (id: string | null) => void;
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
      interiorWalls: [],
      drawingInteriorWall: false,
      selectedInteriorWallId: null,

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
          selectedInteriorWallId: null,
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

      selectFurniture: (id) => set(id !== null
        ? { selectedFurnitureId: id, selectedInteriorWallId: null }
        : { selectedFurnitureId: null }),

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

      clearAll: () => set({
        furniture: [],
        wallOpenings: [],
        interiorWalls: [],
        selectedFurnitureId: null,
        selectedInteriorWallId: null,
        placementMode: 'none' as PlacementMode,
      }),

      addInteriorWall: (wall) =>
        set((state) => ({ interiorWalls: [...state.interiorWalls, wall] })),

      removeInteriorWall: (id) =>
        set((state) => ({
          interiorWalls: state.interiorWalls.filter((w) => w.id !== id),
          wallOpenings: state.wallOpenings.filter((o) => o.wallSegmentId !== id),
          selectedInteriorWallId: state.selectedInteriorWallId === id ? null : state.selectedInteriorWallId,
        })),

      setDrawingInteriorWall: (active) => set({ drawingInteriorWall: active }),

      selectInteriorWall: (id) => set({ selectedInteriorWallId: id }),
    }),
    {
      name: 'room-planner-storage',
      partialize: (state) => ({
        roomWidth: state.roomWidth,
        roomHeight: state.roomHeight,
        furniture: state.furniture,
        wallOpenings: state.wallOpenings,
        hiddenWalls: state.hiddenWalls,
        interiorWalls: state.interiorWalls,
      }),
    }
  )
);
