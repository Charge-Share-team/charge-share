'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

// This fixes the "window is not defined" error
const MapWithNoSSR = dynamic(
  () => import('@/components/ui/MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full bg-[#050a14] flex items-center justify-center">
        <div className="text-emerald-500 animate-pulse font-black uppercase italic tracking-widest">
          Loading Live Map...
        </div>
      </div>
    )
  }
);

export default function ExplorePage() {
  return (
    <main className="h-screen w-full bg-[#050a14] relative">
      {/* Dynamic Map Component */}
      <MapWithNoSSR />

      {/* Back UI Overlay */}
      <div className="absolute top-6 left-6 z-[1000]">
        <Link href="/" className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all">
          ← Back to Dashboard
        </Link>
      </div>
    </main>
  );
}