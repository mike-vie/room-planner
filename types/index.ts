export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface WallPoint {
  x: number;
  y: number;
}

export interface CustomWallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PlacedFurniture {
  id: string;
  furnitureId: string;
  x: number;
  y: number;
  rotation: number;
  color?: string;
}

export type WallSide = 'top' | 'right' | 'bottom' | 'left';
export type WallOpeningType = 'window' | 'balcony-door' | 'door';

export interface WallOpening {
  id: string;
  wall?: WallSide;          // rectangle mode
  wallSegmentId?: string;   // polygon mode
  type: WallOpeningType;
  position: number; // cm along the wall / segment (center of opening)
  isOpen?: boolean;
}

// Window: 120x120cm, sill at 80cm
export const WINDOW_WIDTH = 120;
export const WINDOW_HEIGHT = 120;
export const WINDOW_SILL_HEIGHT = 80;

// Balcony door: 100x250cm, floor to ceiling
export const BALCONY_DOOR_WIDTH = 100;
export const BALCONY_DOOR_HEIGHT = 250;

// Door: 90x210cm, floor level
export const DOOR_WIDTH = 90;
export const DOOR_HEIGHT = 210;

export type FurnitureShape =
  | 'wardrobe' | 'shelf' | 'bed' | 'table' | 'sofa'
  | 'chair' | 'desk' | 'dresser' | 'nightstand' | 'tv-unit'
  | 'gaming-desk' | 'gaming-chair';

export interface FurnitureDef {
  id: string;
  name: string;
  series: string;
  category: 'Schlafen' | 'Wohnen' | 'Arbeiten' | 'Aufbewahrung';
  width: number;   // cm
  depth: number;   // cm
  height: number;  // cm
  color: string;
  shape: FurnitureShape;
}

export interface RoomState {
  walls: Wall[];
  furniture: PlacedFurniture[];
  wallOpenings: WallOpening[];
  roomWidth: number;   // cm
  roomHeight: number;  // cm
  selectedFurnitureId: string | null;
}
