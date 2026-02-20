import { FurnitureDef } from '@/types';

export const furnitureCatalog: FurnitureDef[] = [
  // Aufbewahrung
  { id: 'pax-100', name: 'PAX Schrank', series: 'PAX', category: 'Aufbewahrung', width: 100, depth: 58, height: 201, color: '#b8a088', shape: 'wardrobe' },
  { id: 'pax-150', name: 'PAX Schrank breit', series: 'PAX', category: 'Aufbewahrung', width: 150, depth: 58, height: 201, color: '#f0ebe4', shape: 'wardrobe' },
  { id: 'kallax-2x2', name: 'KALLAX Regal 2x2', series: 'KALLAX', category: 'Aufbewahrung', width: 77, depth: 39, height: 77, color: '#f0ebe4', shape: 'shelf' },
  { id: 'kallax-2x4', name: 'KALLAX Regal 2x4', series: 'KALLAX', category: 'Aufbewahrung', width: 77, depth: 39, height: 147, color: '#f0ebe4', shape: 'shelf' },
  { id: 'billy-80', name: 'BILLY Bücherregal', series: 'BILLY', category: 'Aufbewahrung', width: 80, depth: 28, height: 202, color: '#e8e2da', shape: 'shelf' },
  { id: 'hemnes-kommode', name: 'HEMNES Kommode', series: 'HEMNES', category: 'Aufbewahrung', width: 108, depth: 50, height: 96, color: '#7a6348', shape: 'dresser' },
  { id: 'besta-tv', name: 'BESTÅ TV-Bank', series: 'BESTÅ', category: 'Aufbewahrung', width: 180, depth: 42, height: 38, color: '#4a4a4a', shape: 'tv-unit' },

  // Schlafen
  { id: 'malm-160', name: 'MALM Bett 160cm', series: 'MALM', category: 'Schlafen', width: 160, depth: 200, height: 38, color: '#a08868', shape: 'bed' },
  { id: 'malm-140', name: 'MALM Bett 140cm', series: 'MALM', category: 'Schlafen', width: 140, depth: 200, height: 38, color: '#a08868', shape: 'bed' },
  { id: 'malm-120-220', name: 'MALM Bett 120x220', series: 'MALM', category: 'Schlafen', width: 120, depth: 220, height: 38, color: '#a08868', shape: 'bed' },
  { id: 'malm-110-220', name: 'MALM Bett 110x220', series: 'MALM', category: 'Schlafen', width: 110, depth: 220, height: 38, color: '#a08868', shape: 'bed' },
  { id: 'malm-nachttisch', name: 'MALM Nachttisch', series: 'MALM', category: 'Schlafen', width: 40, depth: 48, height: 55, color: '#a08868', shape: 'nightstand' },
  { id: 'hemnes-bett', name: 'HEMNES Bett 160cm', series: 'HEMNES', category: 'Schlafen', width: 174, depth: 212, height: 66, color: '#e8e2da', shape: 'bed' },
  { id: 'hemnes-nachttisch', name: 'HEMNES Nachttisch', series: 'HEMNES', category: 'Schlafen', width: 46, depth: 35, height: 70, color: '#7a6348', shape: 'nightstand' },

  // Wohnen
  { id: 'lack-90', name: 'LACK Couchtisch', series: 'LACK', category: 'Wohnen', width: 90, depth: 55, height: 45, color: '#3a3a3a', shape: 'table' },
  { id: 'lack-55', name: 'LACK Beistelltisch', series: 'LACK', category: 'Wohnen', width: 55, depth: 55, height: 45, color: '#e8e2da', shape: 'table' },
  { id: 'kivik-sofa', name: 'KIVIK 3er-Sofa', series: 'KIVIK', category: 'Wohnen', width: 228, depth: 95, height: 83, color: '#8c8c88', shape: 'sofa' },
  { id: 'kivik-2er', name: 'KIVIK 2er-Sofa', series: 'KIVIK', category: 'Wohnen', width: 190, depth: 95, height: 83, color: '#8c8c88', shape: 'sofa' },
  { id: 'ekedalen-tisch', name: 'EKEDALEN Esstisch', series: 'EKEDALEN', category: 'Wohnen', width: 120, depth: 80, height: 75, color: '#6b5740', shape: 'table' },
  { id: 'ekedalen-stuhl', name: 'EKEDALEN Stuhl', series: 'EKEDALEN', category: 'Wohnen', width: 43, depth: 51, height: 95, color: '#6b5740', shape: 'chair' },

  // Arbeiten
  { id: 'bekant-160', name: 'BEKANT Schreibtisch', series: 'BEKANT', category: 'Arbeiten', width: 160, depth: 80, height: 65, color: '#e8e2da', shape: 'desk' },
  { id: 'micke-105', name: 'MICKE Schreibtisch', series: 'MICKE', category: 'Arbeiten', width: 105, depth: 50, height: 75, color: '#f0ebe4', shape: 'desk' },
  { id: 'markus-stuhl', name: 'MARKUS Bürostuhl', series: 'MARKUS', category: 'Arbeiten', width: 62, depth: 60, height: 140, color: '#3a3a3a', shape: 'chair' },
  { id: 'alex-schublade', name: 'ALEX Schubladenelement', series: 'ALEX', category: 'Arbeiten', width: 36, depth: 58, height: 70, color: '#e8e2da', shape: 'dresser' },
  { id: 'magnus-pro-150', name: 'Gaming Desk 150', series: 'MAGNUS Pro', category: 'Arbeiten', width: 150, depth: 70, height: 75, color: '#1a1a1a', shape: 'gaming-desk' },
  { id: 'magnus-pro-177', name: 'Gaming Desk XL 177', series: 'MAGNUS Pro', category: 'Arbeiten', width: 177, depth: 80, height: 75, color: '#1a1a1a', shape: 'gaming-desk' },
  { id: 'gaming-chair-1', name: 'Gaming Stuhl', series: 'Racing Pro', category: 'Arbeiten', width: 68, depth: 68, height: 130, color: '#1a1a1a', shape: 'gaming-chair' },
];

export const categories = ['Aufbewahrung', 'Schlafen', 'Wohnen', 'Arbeiten'] as const;
