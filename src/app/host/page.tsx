'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMockAuth } from '@/components/AuthProvider';
import PayoutModal from '@/components/PayoutModal';

const RECENT_PAYOUTS = [
  { id: 1, car: 'Tesla Model 3', energy: '42.5 kWh', amount: '+₹850.00', status: 'Completed' },
  { id: 2, car: 'Tata Nexon EV', energy: '18.2 kWh', amount: '+₹320.00', status: 'Completed' },
  { id: 3, car: 'MG ZS EV', energy: '31.0 kWh', amount: '+₹540.00', status: 'Completed' },
];

export default function HostDashboard() {
  // Use user instead of session
  const { user, login } = useMockAuth();
  
  const [isOnline, setIsOnline] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [newCharger, setNewCharger] = useState({
    name: "My Home Charger",
    connector: "Type 2",
    price: "12"
  });

  // Access Denied Check (Replacing status/session check)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-black italic uppercase mb-4 text-white">Access Denied</h2>
        <p className="text-zinc-500 mb-8 uppercase text-[10px] tracking-widest">Verified Host Credentials Required</p>
        <button 
          onClick={() => login()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full font-black italic uppercase transition-all shadow-lg shadow-blue-600/20"
        >
          Initialize Login
        </button>
      </div>
    );
  }

  const handleRegister = () => {
    if (!("geolocation" in navigator)) {
      alert("GPS required to verify host location.");
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      const hostedStation = {
        ...newCharger,
        id: `host-${Date.now()}`,
        hostId: user.id, // Updated from session
        hostEmail: user.email, // Updated from session
        location: [pos.coords.latitude, pos.coords.longitude],
        type: 'private',
        address: "Private Residence, Chandigarh",
        status: "available",
        timestamp: new Date().toISOString()
      };

      const existing = JSON.parse(localStorage.getItem('my_hosted_chargers') || '[]');
      localStorage.setItem('my_hosted_chargers', JSON.stringify([...existing, hostedStation]));
      
      alert(`Success! Charger registered to ${user.name}`); // Updated from session
      setShowSetup(false);
    }, (err) => {
      alert("Location access denied. Please enable GPS to host.");
    });
  };

  return (
    <main className="min-h-screen bg-[#050a14] text-white p-6 pb-32 font-sans overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Host Mode</h1>
          <p className="text-blue-500 text-[9px] font-bold tracking-[0.3em] uppercase">
            {showSetup ? "Charger Setup" : `HOST: ${user.name.split(' ')[0]}`}
          </p>
        </div>
        <button 
          onClick={() => setShowSetup(!showSetup)}
          className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-[9px] font-black uppercase tracking-widest"
        >
          {showSetup ? "View Dashboard" : "Charger Settings"}
        </button>
      </div>

      {!showSetup ? (
        <>
          {/* Dashboard Stats */}
          <div 
            onClick={() => setShowPayoutModal(true)}
            className="cursor-pointer group bg-gradient-to-br from-blue-900/40 to-black border border-blue-500/20 rounded-[32px] p-8 mb-6 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.02] hover:border-blue-500/40"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[80px] rounded-full"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Earnings</p>
                <h2 className="text-5xl font-black italic tracking-tighter mb-8 text-white group-hover:text-blue-400 transition-colors">₹14,242.80</h2>
              </div>
              <div className="bg-blue-500/20 text-blue-400 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">Withdraw</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
              <div>
                <p className="text-zinc-500 text-[9px] font-bold uppercase mb-1">Active Sessions</p>
                <p className="text-xl font-black italic">12</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[9px] font-bold uppercase mb-1">Energy Shared</p>
                <p className="text-xl font-black italic text-blue-400">842 <span className="text-xs uppercase">kWh</span></p>
              </div>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[24px] flex justify-between items-center mb-8">
            <div>
              <p className="text-sm font-black uppercase italic leading-none">Charger Visibility</p>
              <p className={`text-[10px] font-bold uppercase mt-1 ${isOnline ? 'text-blue-400' : 'text-zinc-500'}`}>
                {isOnline ? 'Online • Public' : 'Offline • Hidden'}
              </p>
            </div>
            <button 
              onClick={() => setIsOnline(!isOnline)}
              className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${isOnline ? 'bg-blue-600' : 'bg-zinc-800'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 ${isOnline ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          {/* Recent Payouts */}
          <div className="mb-6">
            <h3 className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-4 ml-2">Recent Payouts</h3>
            <div className="space-y-3">
              {RECENT_PAYOUTS.map((payout) => (
                <div key={payout.id} className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-2xl flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-blue-400">⚡</div>
                    <div>
                      <p className="text-sm font-black italic uppercase tracking-tight">{payout.car}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">{payout.status} • {payout.energy}</p>
                    </div>
                  </div>
                  <p className="text-blue-400 font-black italic">{payout.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[32px]">
             <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest block mb-4">Charger Hardware</label>
             <select 
               onChange={(e) => setNewCharger({...newCharger, connector: e.target.value})}
               className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm font-bold uppercase outline-none focus:border-blue-500 transition-colors text-white"
             >
               <option value="Type 2">Type 2 (AC - 7.4kW)</option>
               <option value="CCS2">CCS2 (DC Fast - 25kW+)</option>
               <option value="15A">15A Socket (Slow)</option>
             </select>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[32px]">
             <label className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest block mb-4">Set Price (₹/kWh)</label>
             <input 
               type="number" 
               value={newCharger.price}
               onChange={(e) => setNewCharger({...newCharger, price: e.target.value})}
               className="bg-transparent text-3xl font-black italic w-full outline-none text-blue-400"
             />
          </div>
          <button onClick={handleRegister} className="w-full bg-blue-600 p-6 rounded-[32px] font-black italic uppercase">Host My Charger</button>
          <button onClick={() => setShowSetup(false)} className="w-full text-zinc-500 font-black uppercase text-[10px] mt-4">Cancel</button>
        </div>
      )}

      {showPayoutModal && (
        <PayoutModal 
          amount="₹14,242.80" 
          onClose={() => setShowPayoutModal(false)} 
          onSuccess={() => {
            setShowPayoutModal(false);
            alert("Demo: ₹14,242.80 transferred to your bank!");
          }} 
        />
      )}

      {/* Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border border-zinc-800/50 rounded-full flex items-center justify-around px-6 z-50">
        <Link href="/" className="text-zinc-500 hover:text-white flex flex-col items-center gap-1">
          <span className="text-lg">◓</span>
          <span className="text-[8px] font-bold uppercase">Home</span>
        </Link>
        <button className="text-blue-400 flex flex-col items-center gap-1">
          <div className="w-1 h-1 bg-blue-400 rounded-full mb-1"></div>
          <span className="text-lg">◇</span>
          <span className="text-[8px] font-bold uppercase">Host Mode</span>
        </button>
        <Link href="/wallet" className="text-zinc-500 hover:text-white flex flex-col items-center gap-1">
          <span className="text-lg">◍</span>
          <span className="text-[8px] font-bold uppercase">Wallet</span>
        </Link>
        <Link href="/profile" className="text-zinc-500 hover:text-white flex flex-col items-center gap-1">
          <span className="text-lg">○</span>
          <span className="text-[8px] font-bold uppercase">Profile</span>
        </Link>
      </nav>
    </main>
  );
}