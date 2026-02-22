import { FurnitureDef } from '@/types';

export const furnitureCatalog: FurnitureDef[] = [
  // Aufbewahrung
  { id: 'pax-100', name: 'Kleiderschrank 100cm', series: 'Schrank', category: 'Aufbewahrung', width: 100, depth: 58, height: 201, color: '#b8a088', shape: 'wardrobe' },
  { id: 'pax-150', name: 'Kleiderschrank 150cm', series: 'Schrank', category: 'Aufbewahrung', width: 150, depth: 58, height: 201, color: '#f0ebe4', shape: 'wardrobe' },
  { id: 'pax-100-231', name: 'Kleiderschrank 100cm (231)', series: 'Schrank', category: 'Aufbewahrung', width: 100, depth: 58, height: 231, color: '#b8a088', shape: 'wardrobe' },
  { id: 'pax-150-231', name: 'Kleiderschrank 150cm (231)', series: 'Schrank', category: 'Aufbewahrung', width: 150, depth: 58, height: 231, color: '#f0ebe4', shape: 'wardrobe' },
  { id: 'kallax-2x2', name: 'Würfelregal 2×2', series: 'Regal', category: 'Aufbewahrung', width: 77, depth: 39, height: 77, color: '#f0ebe4', shape: 'shelf' },
  { id: 'kallax-2x4', name: 'Würfelregal 2×4', series: 'Regal', category: 'Aufbewahrung', width: 77, depth: 39, height: 147, color: '#f0ebe4', shape: 'shelf' },
  { id: 'billy-80', name: 'Bücherregal 80cm', series: 'Regal', category: 'Aufbewahrung', width: 80, depth: 28, height: 202, color: '#e8e2da', shape: 'shelf' },
  { id: 'hemnes-kommode', name: 'Kommode 108cm', series: 'Kommode', category: 'Aufbewahrung', width: 108, depth: 50, height: 96, color: '#7a6348', shape: 'dresser' },
  { id: 'besta-tv', name: 'TV-Lowboard 180cm', series: 'Lowboard', category: 'Aufbewahrung', width: 180, depth: 42, height: 38, color: '#4a4a4a', shape: 'tv-unit' },

  // Schlafen
  { id: 'malm-160', name: 'Doppelbett 160cm', series: 'Bett', category: 'Schlafen', width: 160, depth: 200, height: 38, color: '#a08868', shape: 'bed' },
  { id: 'malm-140', name: 'Doppelbett 140cm', series: 'Bett', category: 'Schlafen', width: 140, depth: 200, height: 38, color: '#a08868', shape: 'bed' },
  { id: 'malm-120-220', name: 'Einzelbett 120×220', series: 'Bett', category: 'Schlafen', width: 120, depth: 220, height: 38, color: '#a08868', shape: 'bed' },
  { id: 'malm-110-220', name: 'Einzelbett 110×220', series: 'Bett', category: 'Schlafen', width: 110, depth: 220, height: 38, color: '#a08868', shape: 'bed' },
  { id: 'einzelbett-100-220', name: 'Einzelbett 100×220', series: 'Bett', category: 'Schlafen', width: 100, depth: 220, height: 38, color: '#a08868', shape: 'bed' },
  { id: 'einzelbett-90-220', name: 'Einzelbett 90×220', series: 'Bett', category: 'Schlafen', width: 90, depth: 220, height: 38, color: '#a08868', shape: 'bed' },
  { id: 'malm-nachttisch', name: 'Nachttisch schmal', series: 'Nachttisch', category: 'Schlafen', width: 40, depth: 48, height: 55, color: '#a08868', shape: 'nightstand' },
  { id: 'hemnes-bett', name: 'Holzbett 160cm', series: 'Bett', category: 'Schlafen', width: 174, depth: 212, height: 66, color: '#e8e2da', shape: 'bed' },
  { id: 'hemnes-nachttisch', name: 'Nachttisch breit', series: 'Nachttisch', category: 'Schlafen', width: 46, depth: 35, height: 70, color: '#7a6348', shape: 'nightstand' },

  // Wohnen
  { id: 'samsung-tv-85', name: 'LCD Fernseher 85"', series: 'Samsung', category: 'Wohnen', width: 188, depth: 8, height: 106, color: '#111111', shape: 'lcd-tv' },
  { id: 'lack-90', name: 'Couchtisch 90cm', series: 'Couchtisch', category: 'Wohnen', width: 90, depth: 55, height: 45, color: '#3a3a3a', shape: 'table' },
  { id: 'lack-55', name: 'Beistelltisch 55cm', series: 'Beistelltisch', category: 'Wohnen', width: 55, depth: 55, height: 45, color: '#e8e2da', shape: 'table' },
  { id: 'kivik-sofa', name: '3er-Sofa 228cm', series: 'Sofa', category: 'Wohnen', width: 228, depth: 95, height: 83, color: '#8c8c88', shape: 'sofa' },
  { id: 'kivik-2er', name: '2er-Sofa 190cm', series: 'Sofa', category: 'Wohnen', width: 190, depth: 95, height: 83, color: '#8c8c88', shape: 'sofa' },
  { id: 'ecksofa-links', name: 'Ecksofa links 220cm', series: 'Sofa', category: 'Wohnen', width: 220, depth: 160, height: 83, color: '#8c8c88', shape: 'corner-sofa' },
  { id: 'ekedalen-tisch', name: 'Esstisch 120cm', series: 'Esstisch', category: 'Wohnen', width: 120, depth: 80, height: 75, color: '#6b5740', shape: 'table' },
  { id: 'ekedalen-stuhl', name: 'Essstuhl', series: 'Stuhl', category: 'Wohnen', width: 43, depth: 51, height: 95, color: '#6b5740', shape: 'chair' },

  // Arbeiten
  { id: 'bekant-160', name: 'Schreibtisch 160cm', series: 'Schreibtisch', category: 'Arbeiten', width: 160, depth: 80, height: 65, color: '#e8e2da', shape: 'desk' },
  { id: 'micke-105', name: 'Schreibtisch 105cm', series: 'Schreibtisch', category: 'Arbeiten', width: 105, depth: 50, height: 75, color: '#f0ebe4', shape: 'desk' },
  { id: 'markus-stuhl', name: 'Bürostuhl', series: 'Stuhl', category: 'Arbeiten', width: 62, depth: 60, height: 140, color: '#3a3a3a', shape: 'chair' },
  { id: 'alex-schublade', name: 'Schubladencontainer', series: 'Container', category: 'Arbeiten', width: 36, depth: 58, height: 70, color: '#e8e2da', shape: 'dresser' },
  { id: 'magnus-pro-150', name: 'Gaming-Schreibtisch 150cm', series: 'Gaming', category: 'Arbeiten', width: 150, depth: 70, height: 75, color: '#1a1a1a', shape: 'gaming-desk' },
  { id: 'magnus-pro-177', name: 'Gaming-Schreibtisch 177cm', series: 'Gaming', category: 'Arbeiten', width: 177, depth: 80, height: 75, color: '#1a1a1a', shape: 'gaming-desk' },
  { id: 'gaming-chair-1', name: 'Gaming-Stuhl', series: 'Gaming', category: 'Arbeiten', width: 68, depth: 68, height: 130, color: '#1a1a1a', shape: 'gaming-chair' },

  // Küche
  { id: 'metod-herd', name: 'Herd 60cm', series: 'Küche', category: 'Küche', width: 60, depth: 60, height: 85, color: '#c0c0c0', shape: 'stove' },
  { id: 'metod-kuehlschrank', name: 'Kühlschrank', series: 'Küche', category: 'Küche', width: 60, depth: 65, height: 185, color: '#f5f5f5', shape: 'fridge' },
  { id: 'havsen-spuele', name: 'Spüle 80cm', series: 'Küche', category: 'Küche', width: 80, depth: 60, height: 22, color: '#d0d0d0', shape: 'kitchen-sink' },
  { id: 'metod-zeile-120', name: 'Küchenzeile 120cm', series: 'Küche', category: 'Küche', width: 120, depth: 60, height: 85, color: '#e8e2da', shape: 'kitchen-unit' },
  { id: 'metod-zeile-60', name: 'Küchenzeile 60cm', series: 'Küche', category: 'Küche', width: 60, depth: 60, height: 85, color: '#e8e2da', shape: 'kitchen-unit' },
  { id: 'metod-haenge-30', name: 'Hängeschrank 30cm', series: 'Küche', category: 'Küche', width: 30, depth: 37, height: 72, color: '#e8e2da', shape: 'kitchen-wall-unit' },
  { id: 'metod-haenge-50', name: 'Hängeschrank 50cm', series: 'Küche', category: 'Küche', width: 50, depth: 37, height: 72, color: '#e8e2da', shape: 'kitchen-wall-unit' },
  { id: 'metod-haenge-60', name: 'Hängeschrank 60cm', series: 'Küche', category: 'Küche', width: 60, depth: 37, height: 72, color: '#e8e2da', shape: 'kitchen-wall-unit' },
  { id: 'metod-regal-30', name: 'Hängeregal 30cm', series: 'Küche', category: 'Küche', width: 30, depth: 25, height: 60, color: '#e8e2da', shape: 'wall-shelf' },

  // Bad
  { id: 'toftbo-wc', name: 'WC', series: 'Bad', category: 'Bad', width: 38, depth: 65, height: 40, color: '#f0f0f0', shape: 'toilet' },
  { id: 'badaren-wanne', name: 'Badewanne 170cm', series: 'Bad', category: 'Bad', width: 75, depth: 170, height: 58, color: '#f5f5f5', shape: 'bathtub' },
  { id: 'kombi-badewanne-dusche', name: 'Badewanne mit Dusche', series: 'Bad', category: 'Bad', width: 75, depth: 170, height: 58, color: '#f5f5f5', shape: 'bathtub-shower' },
  { id: 'lillangen-dusche', name: 'Dusche 90×90', series: 'Bad', category: 'Bad', width: 90, depth: 90, height: 5, color: '#e8e8e8', shape: 'shower' },
  { id: 'odensvik-waschbecken', name: 'Waschbecken 63cm', series: 'Bad', category: 'Bad', width: 63, depth: 49, height: 15, color: '#f0f0f0', shape: 'washbasin' },
  { id: 'lettan-spiegel', name: 'Badezimmerspiegel', series: 'Bad', category: 'Bad', width: 65, depth: 3, height: 100, color: '#c8d8e8', shape: 'mirror' },
];

export const categories = ['Aufbewahrung', 'Schlafen', 'Wohnen', 'Arbeiten', 'Küche', 'Bad'] as const;
