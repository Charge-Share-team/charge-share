'use client';

import { useState } from 'react';

const FILTERS = ['All', 'Fast ⚡', 'Available', 'Top Rated', 'Free'];

export default function FilterChips() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    /* We added 'no-scrollbar' here to hide the bar while keeping the scroll */
    <div className="w-full flex gap-2 overflow-x-auto py-4 no-scrollbar px-2">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          className={`whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${
            activeFilter === filter
              ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}