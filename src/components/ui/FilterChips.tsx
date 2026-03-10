'use client';

import { useState } from 'react';

export type FilterType = 'All' | 'Fast' | 'Available' | 'Top Rated' | 'Free';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'All' },
  { label: 'Fast ⚡', value: 'Fast' },
  { label: 'Available', value: 'Available' },
  { label: 'Top Rated', value: 'Top Rated' },
  { label: 'Free', value: 'Free' },
];

interface FilterChipsProps {
  onFilterChange?: (filter: FilterType) => void;
  activeFilter?: FilterType;
}

export default function FilterChips({ onFilterChange, activeFilter: externalFilter }: FilterChipsProps) {
  const [internalFilter, setInternalFilter] = useState<FilterType>('All');
  const activeFilter = externalFilter ?? internalFilter;

  const handleClick = (value: FilterType) => {
    setInternalFilter(value);
    onFilterChange?.(value);
  };

  return (
    <div className="w-full flex gap-2 overflow-x-auto py-4 no-scrollbar px-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => handleClick(filter.value)}
          className={`whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${
            activeFilter === filter.value
              ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}