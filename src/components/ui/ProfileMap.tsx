'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/ui/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-900 animate-pulse" />,
});

// ✅ Wrapper so profile page (server component) can pass required props to MapComponent
export default function ProfileMap() {
  const [destination, setDestination] = useState<[number, number] | null>(null);

  return (
    <MapComponent
      destination={destination}
      setDestination={setDestination}
    />
  );
}