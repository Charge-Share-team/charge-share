// src/app/onboarding/page.tsx
'use client';
import { useState } from 'react';
import { EV_BRANDS, EV_MODELS } from '@/data/ev-database';
import { useVehicle } from '@/context/VehicleContext';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState<any>(null);
  const { addCar } = useVehicle();
  const router = useRouter();

  const handleFinish = () => {
    addCar(model);
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-black italic uppercase mb-2">Set Up Your Garage</h1>
      <p className="text-zinc-500 text-xs mb-10 uppercase tracking-widest font-bold">Select your primary EV to get started</p>

      <div className="space-y-8">
        {/* Brand Selector */}
        <div>
          <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest block mb-3">1. Select Brand</label>
          <div className="grid grid-cols-3 gap-3">
            {EV_BRANDS.map(b => (
              <button key={b} onClick={() => setBrand(b)} className={`p-4 rounded-2xl border-2 transition-all font-bold text-xs ${brand === b ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900'}`}>{b}</button>
            ))}
          </div>
        </div>

        {/* Model Selector (Only shows if brand selected) */}
        {brand && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest block mb-3">2. Select Model</label>
            <div className="space-y-3">
              {EV_MODELS[brand].map((m: any) => (
                <button key={m.id} onClick={() => setModel(m)} className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${model?.id === m.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-900'}`}>
                  <span className="font-black italic uppercase">{m.name}</span>
                  <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-md text-zinc-400">{m.charger}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {model && (
          <button onClick={handleFinish} className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
            Complete Setup
          </button>
        )}
      </div>
    </main>
  );
}
