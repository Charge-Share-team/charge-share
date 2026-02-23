'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ChargingSession() {
  const [progress, setProgress] = useState(74);
  const [isFinished, setIsFinished] = useState(false);
  const [power, setPower] = useState(7.2);
  const [mounted, setMounted] = useState(false);

  // Constants for calculation
  const STARTING_SOC = 74;
  const RATE_PER_KWH = 11;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;

  // Prevent Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isFinished || !mounted) return;
    
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setIsFinished(true);
          return 100;
        }
        return p + 0.05; // Slightly slower for more realism
      });

      // Jitter power slightly for "live data" effect
      setPower(parseFloat((7.2 + (Math.random() * 0.2 - 0.1)).toFixed(1)));
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, mounted]);

  // Derived Stats
  const unitsAdded = Math.max(0, progress - STARTING_SOC).toFixed(1);
  const finalCost = (parseFloat(unitsAdded) * RATE_PER_KWH).toFixed(2);

  if (!mounted) return <div className="min-h-screen bg-black" />;

  if (isFinished) {
    return (
      <main className="min-h-screen bg-[#050a14] text-white p-6 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-sm bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-[40px] p-8 text-center animate-in zoom-in duration-500 shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <span className="text-emerald-500 text-3xl">⚡</span>
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Session Summary</h2>
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em] mb-8">Sarah's Driveway • Sector 17</p>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between border-b border-zinc-800/50 pb-3">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Energy Added</span>
              <span className="text-white font-black italic">{unitsAdded} kWh</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/50 pb-3">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Session Time</span>
              <span className="text-white font-black italic">42 min</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/50 pb-3">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Total Paid</span>
              <span className="text-emerald-400 font-black italic text-lg">₹{finalCost}</span>
            </div>
          </div>

          <div className="mb-10">
            <p className="text-zinc-500 text-[10px] uppercase font-bold mb-4 tracking-widest">Rate your Host</p>
            <div className="flex justify-center gap-3 text-2xl">
              {['★','★','★','★','☆'].map((s, i) => (
                <span key={i} className={i < 4 ? "text-emerald-400" : "text-zinc-800"}>{s}</span>
              ))}
            </div>
          </div>

          <Link href="/" className="block w-full py-5 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl active:scale-95 transition-transform">
            Done
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050a14] text-white flex flex-col items-center p-6 justify-between font-sans overflow-hidden">
      {/* 1. Header */}
      <div className="pt-10 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest italic">Charging Active</span>
        </div>
        <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">Tata Nexon EV</h1>
        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">Sarah's Home Charger</p>
      </div>

      {/* 2. Visual Charging Circle */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full animate-pulse" />
        
        <svg className="w-80 h-80 transform -rotate-90">
          <circle
            cx="160" cy="160" r={radius}
            stroke="#18181b" strokeWidth="8" fill="transparent"
          />
          <circle
            cx="160" cy="160" r={radius}
            stroke="#10b981" strokeWidth="10" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * progress) / 100}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' }}
          />
        </svg>

        <div className="absolute text-center">
          <span className="text-8xl font-black tracking-tighter italic leading-none">
            {Math.floor(progress)}<span className="text-2xl text-emerald-500">%</span>
          </span>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2 italic">Current SOC</p>
        </div>
      </div>

      {/* 3. Real-time Stats Grid */}
      <div className="w-full grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-3xl backdrop-blur-md">
          <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Power Input</p>
          <p className="text-xl font-black italic">{power} <span className="text-[10px] text-zinc-600 uppercase">kW</span></p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-3xl backdrop-blur-md">
          <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">Added</p>
          <p className="text-xl font-black italic">{unitsAdded} <span className="text-[10px] text-zinc-600 uppercase">kWh</span></p>
        </div>
      </div>

      {/* 4. Action Button */}
      <div className="w-full pb-10 px-2 relative z-10">
        <button 
          onClick={() => setIsFinished(true)}
          className="w-full py-5 bg-zinc-900/80 backdrop-blur-md border border-red-900/20 text-red-500 font-black text-[10px] uppercase tracking-[0.4em] rounded-[24px] hover:bg-red-500/10 transition-all active:scale-95 shadow-xl"
        >
          Stop Session
        </button>
      </div>
    </main>
  );
}