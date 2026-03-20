'use client';
import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const MapComponent = dynamic(() => import("@/components/ui/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <p className="text-zinc-500 font-mono text-xs tracking-widest animate-pulse">INITIALIZING MAP...</p>
    </div>
  ),
});

export default function ExplorePage() {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstance) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', India')}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapInstance.flyTo([lat, lng], 13, { animate: true, duration: 1.5 });
        setSearchQuery('');
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const startHold = () => {
    setIsHolding(true);
    holdTimer.current = setTimeout(() => { setDestination(null); setIsHolding(false); }, 1000);
  };
  const stopHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setIsHolding(false);
  };

  return (
    <main className="relative h-screen w-full bg-black overflow-hidden">

      {/* Full screen map */}
      <MapComponent
        setMapInstance={setMapInstance}
        destination={destination}
        setDestination={setDestination}
      />

      {/* Search bar */}
      {!destination && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[1000]">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search charging stations or cities..."
              className="w-full bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-3xl py-3.5 px-5 pr-12 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xl placeholder:text-zinc-600"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
              {isSearching ? '⏳' : '🔍'}
            </button>
          </form>
        </div>
      )}

      {/* Cancel navigation */}
      {destination && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[1000]">
          <div className="relative">
            <button
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onTouchStart={startHold}
              onTouchEnd={stopHold}
              className={`w-full py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all duration-200 border ${
                isHolding
                  ? 'bg-red-600 scale-95 border-transparent text-white'
                  : 'bg-zinc-900/90 backdrop-blur-xl border-red-500/40 text-red-400'
              }`}
            >
              {isHolding ? 'Release to Confirm' : 'HOLD TO CANCEL'}
            </button>
            {isHolding && (
              <div className="absolute bottom-0 left-0 h-1 bg-red-400 rounded-b-3xl"
                style={{ animation: 'progress 1s linear forwards' }} />
            )}
          </div>
          <p className="text-[8px] text-zinc-500 text-center mt-2 font-bold uppercase tracking-widest">
            Navigation Active • Hold to Stop
          </p>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl flex items-center justify-around z-[1000]">
        <Link href="/" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors">
          <span className="text-lg">○</span>
          <span className="text-[9px] font-bold uppercase">Home</span>
        </Link>
        <Link href="/explore" className="flex flex-col items-center text-emerald-400 gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mb-1 shadow-[0_0_8px_#34d399]"></div>
          <span className="text-[9px] font-bold uppercase">Explore</span>
        </Link>
        <Link href="/wallet" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors">
          <span className="text-lg">◍</span>
          <span className="text-[9px] font-bold uppercase">Wallet</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors">
          <span className="text-lg">◯</span>
          <span className="text-[9px] font-bold uppercase">Profile</span>
        </Link>
      </nav>

      <style jsx global>{`
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </main>
  );
}