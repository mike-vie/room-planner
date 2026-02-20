'use client';

import { useState } from 'react';
import { furnitureCatalog, categories } from '@/data/furniture-catalog';
import FurnitureCard from './FurnitureCard';

export default function FurnitureCatalog() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = furnitureCatalog.filter((f) => {
    const matchesSearch =
      !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.series.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <h2 className="font-semibold text-sm mb-2">Möbelkatalog</h2>
        <input
          type="text"
          placeholder="Suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
        />
      </div>
      <div className="flex flex-wrap gap-1 p-3 border-b border-gray-200">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
            !activeCategory ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          Alle
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
              activeCategory === cat ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map((f) => (
          <FurnitureCard key={f.id} furniture={f} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-4">Keine Möbel gefunden</p>
        )}
      </div>
    </div>
  );
}
