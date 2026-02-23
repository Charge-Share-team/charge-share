'use client';

import { useState } from 'react';
import Link from 'next/link';

const TRANSACTIONS = [
  { id: 1, title: 'Sarah\'s Home Hub', date: 'Today, 2:40 PM', amount: -342.50, type: 'charge', energy: '12.4 kWh' },
  { id: 2, title: 'P2P Hosting Income', date: 'Yesterday', amount: 850.00, type: 'earn', energy: '28.0 kWh' },
  { id: 3, title: 'Sector 17 Fast Hub', date: 'Feb 10', amount: -520.00, type: 'charge', energy: '24.5 kWh' },
];

export default function WalletPage() {
  const [balance] = useState(2450.75);

  return (
    <main className="min-h-screen bg-black text-white p-6 pb-32 font-sans">
      
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-10 pt-4">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Your Vault</h1>
        <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">
          ID
        </div>
      </div>

      {/* 2. Main Balance Card */}
      <div className="w-full bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[32px] p-8 mb-8 relative overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.2)]">
        {/* Decorative Circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        
        <p className="text-black/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Available Balance</p>
        <h2 className="text-4xl font-black italic text-black tracking-tighter">₹{balance.toLocaleString()}</h2>
        
        <div className="mt-8 flex gap-3">
          <button className="flex-1 bg-black text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
            + Add Cash
          </button>
          <button className="flex-1 bg-white/20 backdrop-blur-md text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
            Withdraw
          </button>
        </div>
      </div>

      {/* 3. Eco-Savings Tracker */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px]">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">CO₂ Saved</p>
          <p className="text-xl font-black italic text-emerald-400">12.4 <span className="text-[10px] text-zinc-600 italic">kg</span></p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[24px]">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Vs Petrol</p>
          <p className="text-xl font-black italic text-emerald-400">₹4,200 <span className="text-[10px] text-zinc-600 italic">saved</span></p>
        </div>
      </div>

      {/* 4. Transaction History */}
      <div className="w-full">
        <div className="flex justify-between items-end mb-6 px-2">
          <h3 className="text-xs font-black uppercase tracking-widest">Recent Activity</h3>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest cursor-pointer">View All</span>
        </div>

        <div className="space-y-4">
          {TRANSACTIONS.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm ${tx.type === 'earn' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-400'}`}>
                  {tx.type === 'earn' ? '↙' : '⚡'}
                </div>
                <div>
                  <p className="text-sm font-black italic uppercase tracking-tight leading-none">{tx.title}</p>
                  <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase">{tx.date} • {tx.energy}</p>
                </div>
              </div>
              <p className={`text-sm font-black italic ${tx.type === 'earn' ? 'text-emerald-400' : 'text-white'}`}>
                {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.amount).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Bottom Nav (Wallet Active) */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl flex items-center justify-around px-2 shadow-2xl z-50">
        <Link href="/" className="text-zinc-500 flex flex-col items-center gap-1 hover:text-white transition-colors">
          <span className="text-lg italic font-black">◓</span>
          <span className="text-[9px] font-bold uppercase tracking-tighter">Home</span>
        </Link>
        <Link href="/explore" className="text-zinc-500 flex flex-col items-center gap-1 hover:text-white transition-colors">
          <span className="text-lg italic font-black">◍</span>
          <span className="text-[9px] font-bold uppercase tracking-tighter">Explore</span>
        </Link>
        <button className="flex flex-col items-center text-emerald-400 gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mb-1 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
          <span className="text-[9px] font-bold uppercase tracking-tighter">Wallet</span>
        </button>
        <Link href="/profile" className="text-zinc-500 flex flex-col items-center gap-1 hover:text-white transition-colors">
          <span className="text-lg">○</span>
          <span className="text-[9px] font-bold uppercase tracking-tighter">Profile</span>
        </Link>
      </nav>
    </main>
  );
}