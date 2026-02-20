# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

## Architecture

**Raumplaner** (German: Room Planner) is a Next.js 16 app with a split-view layout: a 2D floor plan editor (Konva.js) synchronized in real-time with a 3D viewer (Three.js / React Three Fiber).

### State

`store/useRoomStore.ts` — single Zustand store persisted to `localStorage` under key `'room-planner-storage'`. It holds:

- `roomWidth`, `roomHeight` — room dimensions in cm (default: 400×500)
- `furniture` — `PlacedFurniture[]` — placed items with position, rotation, optional color override
- `wallOpenings` — `WallOpening[]` — windows, doors, balcony doors
- `selectedFurnitureId` — currently selected furniture or `null`
- `placementMode` — `'none' | 'window' | 'balcony-door' | 'door'`
- `hiddenWalls` — `WallSide[]` — walls to hide in rectangle mode (default: `['bottom', 'right']`)
- `wallPoints` — `WallPoint[]` — polygon wall mode; ≥3 points activates polygon mode
- `drawingWalls` — `boolean` — transient flag (not persisted), active during polygon drawing

All other components read from and write to this store.

### Two rendering layers

- **2D Editor** (`components/Editor2D/`) — Konva stage.
  - `Canvas2D.tsx` — scale/offset for responsive sizing, wall rendering (rectangle & polygon modes), grid, wall-opening placement (click on wall), furniture drag/drop, polygon drawing with 10 cm snapping and nearest-point snapping, Escape to cancel.
  - `FurnitureItem2D.tsx` — draggable, double-click to rotate 90°, selection highlight.
  - `WallOpening2D.tsx` — draggable along wall axis; distinct visuals for window (white gap + blue frame lines), door (brown swing arc, toggleable open state), balcony door (purple arc). Backspace/Delete to remove.
  - `Wall.tsx` — simple dark-gray wall line renderer.
  - `Grid.tsx` — 10 cm grid with major lines every 100 cm.
- **3D Viewer** (`components/Viewer3D/`) — React Three Fiber canvas.
  - `Scene3D.tsx` — WebGL detection, camera setup, lights, OrbitControls, contact shadows, ACES tone mapping.
  - `Scene3DErrorBoundary.tsx` — error boundary; shows WebGL unavailable message with Chrome flags hint.
  - `Room3D.tsx` — wall geometry with cutouts for openings; supports both rectangle (4-wall) and polygon modes. Wall height 2.5 m, thickness 0.1 m, baseboard 0.08 m × 0.012 m. Contains `Door3D` (rectangle mode) and `LocalDoor3D` (polygon mode) sub-components.
  - `FurnitureItem3D.tsx` — procedural geometry per furniture shape, wood/fabric/metal materials with grain/weave textures, selection glow.
  - `textures.ts` — canvas-based procedural textures (floor planks + normal + roughness, wall plaster + normal, wood grain, fabric weave) using seeded noise / fBm. Textures are singletons.

Both editors are dynamically imported with `ssr: false`.

### UI components

- `components/Toolbar.tsx` — room size inputs (hidden in polygon mode), wall-drawing toggle + instructions, polygon→rectangle mode button, placement mode buttons, wall visibility toggles, furniture count, 3D fullscreen toggle, clear-all button.
- `components/FurnitureCatalog.tsx` — search box, category filter buttons, scrollable card list.
- `components/FurnitureCard.tsx` — color swatch + name + dimensions; click to add to scene.
- `components/PropertiesPanel.tsx` — selected furniture: name/series/dimensions, X/Y position inputs, rotation slider (15° steps), color picker, delete button.

### Key conventions

- **Units:** All dimensions are in **centimeters** internally. The 3D scale factor is `0.01` (cm → meters).
- **Coordinate origin:** (0,0) is top-left of the room; X increases right, Y increases down (2D). In 3D, X maps to width and Z maps to depth with a centered origin.
- **Wall modes:** Rectangle mode uses `WallSide` ('top' | 'right' | 'bottom' | 'left') for openings. Polygon mode uses `wallSegmentId` on `WallOpening` to reference a `CustomWallSegment`.
- **All components are client-side** (`'use client'`); this is a purely client-rendered app despite using Next.js App Router.
- **Language:** UI labels and metadata are in German (`lang="de"`).
- **Furniture catalog:** `data/furniture-catalog.ts` — 38 IKEA-inspired items in 4 German categories (Aufbewahrung, Schlafen, Wohnen, Arbeiten). Each item has dimensions (cm), default color, and a shape type that drives 3D procedural generation.
- **Wall opening dimensions** are defined as constants in `types/index.ts` (Window 120×120 cm at 80 cm sill height, Balcony Door 100×250 cm, Door 90×210 cm).
- **Path alias:** `@/*` resolves to the project root.

### Furniture shape types (12)

`wardrobe`, `shelf`, `desk`, `dresser`, `nightstand`, `tv-unit`, `sofa`, `chair`, `bed`, `table`, `gaming-desk`, `gaming-chair`

Gaming shapes include extra detail: RGB LED edge strip and cable tray (gaming desk), 5-star base + pneumatic post + armrests + lumbar + accent stripes (gaming chair).

### Key dependencies

| Package | Version | Purpose |
|---|---|---|
| next | 16.1.6 | Framework |
| react / react-dom | 19.2.3 | UI |
| konva / react-konva | 10.2 / 19.2.2 | 2D canvas |
| three | 0.183.0 | 3D rendering |
| @react-three/fiber | 9.5.0 | React bindings for Three.js |
| @react-three/drei | 10.7.7 | Three.js helpers |
| zustand | 5.0.11 | State management |
| tailwindcss | 4 | Styling |
