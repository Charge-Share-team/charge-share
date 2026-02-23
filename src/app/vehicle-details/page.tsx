'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVehicle } from '@/context/VehicleContext';

// 1. Comprehensive Data Object for all cars
const CAR_DATA: Record<string, any> = {
  'nexon': {
    name: 'Tata Nexon.ev',
    edition: 'Empowered+ LR',
    image: 'https://ev.tatamotors.com/images/nexon-ev/nexon-ev-exterior.png',
    health: '98%', battery: '45 kWh', range: '310 km', currentCharge: 82, estimatedKm: 245, temp: '32°C', cycles: '142'
  },
  'tiago': {
    name: 'Tata Tiago.ev',
    edition: 'XZ+ Tech Lux',
    image: 'https://ev.tatamotors.com/images/tiago-ev/tiago-ev-exterior.png',
    health: '96%', battery: '24 kWh', range: '250 km', currentCharge: 65, estimatedKm: 162, temp: '30°C', cycles: '89'
  },
  'punch': {
    name: 'Tata Punch.ev',
    edition: 'Empowered+ S',
    image: 'https://ev.tatamotors.com/images/punch-ev/punch-ev-exterior.png',
    health: '99%', battery: '35 kWh', range: '365 km', currentCharge: 90, estimatedKm: 328, temp: '29°C', cycles: '45'
  },
  'curvv': {
    name: 'Tata Curvv.ev',
    edition: 'Empowered+ A',
    image: 'https://ev.tatamotors.com/images/curvv-ev/curvv-ev-exterior.png',
    health: '100%', battery: '55 kWh', range: '585 km', currentCharge: 95, estimatedKm: 550, temp: '31°C', cycles: '12'
  },
  'windsor': {
    name: 'MG Windsor EV',
    edition: 'Essence',
    image: 'https://www.mgmotor.co.in/content/dam/mgmotor/india/master/windsor-ev/exterior.png',
    health: '97%', battery: '38 kWh', range: '331 km', currentCharge: 70, estimatedKm: 232, temp: '33°C', cycles: '67'
  }
};

export default function VehiclePage() {
  const router = useRouter();
  const { selectedCar, setSelectedCar } = useVehicle(); // Using the context we set up in Layout

  // Fallback to nexon if context isn't ready or key is missing
  const carKey = CAR_DATA[selectedCar] ? selectedCar : 'nexon';
  const car = CAR_DATA[carKey];

  return (
    <main className="min-h-screen bg-black text-white p-6 pb-40 font-sans overflow-x-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <button onClick={() => router.back()} className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
          ←
        </button>
        <h1 className="text-xl font-black italic uppercase tracking-tighter italic">Your Garage</h1>
      </div>

      {/* 🏎️ HORIZONTAL CAR SELECTOR */}
      <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar">
        {Object.entries(CAR_DATA).map(([key, data]) => (
          <button 
            key={key}
            onClick={() => setSelectedCar(key)}
            className={`flex-shrink-0 w-28 p-3 rounded-[24px] border-2 transition-all duration-300 ${
              selectedCar === key 
                ? 'border-emerald-500 bg-emerald-500/10 scale-105' 
                : 'border-zinc-800 bg-zinc-900/50 opacity-60'
            }`}
          >
            <img src={data.image} alt={data.name} className="w-full h-12 object-contain mb-2" />
            <p className="text-[7px] font-black uppercase text-center tracking-tighter">{data.name}</p>
          </button>
        ))}
      </div>

      {/* 🖼️ DYNAMIC HERO CARD */}
      <div className="bg-gradient-to-b from-zinc-800/40 to-zinc-900 border border-zinc-800 rounded-[40px] p-8 mb-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full"></div>
        
        <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2 animate-pulse">Connected Live</p>
        <h2 className="text-3xl font-black italic uppercase mb-1">{car.name}</h2>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{car.edition}</p>
        
        <div className="my-10 relative flex justify-center items-center h-44">
            <div className="absolute w-48 h-12 bg-emerald-500/10 blur-3xl rounded-full bottom-4"></div>
            <img 
              src={car.image} 
              alt={car.name}
              className="w-72 object-contain drop-shadow-[0_20px_40px_rgba(16,185,129,0.25)] transform transition-all duration-700"
            />
        </div>

        {/* Range Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-3 px-2">
            <span className="text-5xl font-black italic">{car.currentCharge}<span className="text-xl text-zinc-500">%</span></span>
            <span className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">~{car.estimatedKm} KM Range</span>
          </div>
          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-1000 ease-out" 
              style={{ width: `${car.currentCharge}%` }}
            ></div>
          </div>
        </div>

        {/* Status Row */}
        <div className="grid grid-cols-3 bg-black/40 py-5 rounded-3xl border border-white/5 backdrop-blur-md">
            <div className="text-center">
                <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Health</p>
                <p className="text-sm font-black text-emerald-400 italic">{car.health}</p>
            </div>
            <div className="border-x border-zinc-800/50 text-center">
                <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Cycles</p>
                <p className="text-sm font-black text-white italic">{car.cycles}</p>
            </div>
            <div className="text-center">
                <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Temp</p>
                <p className="text-sm font-black text-white italic">{car.temp}</p>
            </div>
        </div>
      </div>

      {/* Technical Specs List */}
      <div className="space-y-3 mb-10">
        {[
          { label: 'Battery Capacity', val: car.battery },
          { label: 'Real-World Range', val: car.range },
          { label: 'Charging Standard', val: 'CCS 2' }
        ].map((s, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-2xl flex justify-between items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{s.label}</span>
            <span className="text-sm font-black uppercase italic">{s.val}</span>
          </div>
        ))}
      </div>

      {/* Global Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-[#121212]/90 backdrop-blur-xl border border-zinc-800/50 rounded-full flex items-center justify-around px-6 z-50">
        <Link href="/" className="text-zinc-500 flex flex-col items-center gap-1">
          <span className="text-lg">◓</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Home</span>
        </Link>
        <Link href="/host" className="text-zinc-500 flex flex-col items-center gap-1">
          <span className="text-lg">◇</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Host Mode</span>
        </Link>
        <Link href="/wallet" className="text-zinc-500 flex flex-col items-center gap-1">
          <span className="text-lg">◍</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Wallet</span>
        </Link>
        <Link href="/profile" className="text-zinc-500 flex flex-col items-center gap-1">
          <span className="text-lg">○</span>
          <span className="text-[8px] font-bold uppercase tracking-tighter">Profile</span>
        </Link>
      </nav>
    </main>
  );
}