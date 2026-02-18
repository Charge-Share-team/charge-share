'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default function HostDashboard() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [myChargers, setMyChargers] = useState<any[]>([]);
  
  const [newCharger, setNewCharger] = useState({
    name: "",
    connector: "Type 2",
    customConnector: "",
    capacity: "7.4",
    price: "12"
  });

  const [photos, setPhotos] = useState<{ [key: string]: File | null }>({
    charger: null,
    plug: null,
    parking: null
  });

  const fetchMyChargers = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('chargers')
      .select('*')
      .eq('owner_id', userId);
    
    if (error) console.error("Error fetching:", error.message);
    if (data) setMyChargers(data);
  }, [supabase]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        fetchMyChargers(user.id);
      }
    };
    checkUser();
  }, [router, supabase, fetchMyChargers]);

  const toggleVisibility = async (chargerId: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('chargers')
      .update({ is_online: !currentStatus })
      .eq('id', chargerId);
    
    if (!error) {
      setMyChargers(prev => prev.map(c => 
        c.id === chargerId ? { ...c, is_online: !currentStatus } : c
      ));
    }
  };

  const handleRegister = async () => {
    if (!photos.charger || !photos.plug || !photos.parking) {
      return alert("Missing Photos: Please upload all 3 required images.");
    }

    // Check if browser supports Geolocation
    if (!navigator.geolocation) {
      return alert("Geolocation is not supported by your browser.");
    }

    setLoading(true);

    // FETCHING LOCATION AUTOMATICALLY
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          const uploadPhoto = async (file: File, path: string) => {
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
              .from('charger-images')
              .upload(`${path}/${fileName}`, file);
            if (error) throw error;
            const { data: urlData } = supabase.storage.from('charger-images').getPublicUrl(data.path);
            return urlData.publicUrl;
          };

          const [cUrl, pUrl, pkUrl] = await Promise.all([
            uploadPhoto(photos.charger!, 'units'),
            uploadPhoto(photos.plug!, 'plugs'),
            uploadPhoto(photos.parking!, 'parking')
          ]);

          const finalType = newCharger.connector === "Other" ? newCharger.customConnector : newCharger.connector;

          const { error } = await supabase.from('chargers').insert({
            owner_id: user.id,
            name: newCharger.name || "Home Station",
            charger_type: finalType,
            capacity_kwh: parseFloat(newCharger.capacity),
            price_per_kwh: parseFloat(newCharger.price),
            charger_photo_url: cUrl,
            plug_photo_url: pUrl,
            parking_photo_url: pkUrl,
            latitude: latitude, // AUTOMATICALLY FETCHED
            longitude: longitude, // AUTOMATICALLY FETCHED
            is_online: true
          });

          if (error) throw error;
          alert(`Success! Charger registered at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setShowSetup(false);
          fetchMyChargers(user.id);
        } catch (err: any) {
          alert("Registration Error: " + err.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        alert("Location Error: Please enable GPS/Location services to register a charger.");
      },
      { enableHighAccuracy: true }
    );
  };

  if (!user) return <div className="min-h-screen bg-[#050a14]" />;

  return (
    <main className="min-h-screen bg-[#050a14] text-white p-6 pb-32">
      <div className="flex justify-between items-center mb-10 pt-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-emerald-500">Host Mode</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">User: {user.email.split('@')[0]}</p>
        </div>
        <button onClick={() => setShowSetup(!showSetup)} className="bg-emerald-500 text-black px-6 py-2 rounded-full text-xs font-black uppercase tracking-tighter">
          {showSetup ? "Back to Dashboard" : "+ Add Charger"}
        </button>
      </div>

      {!showSetup ? (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="bg-gradient-to-br from-emerald-950/50 to-black border border-emerald-500/20 rounded-[40px] p-10 shadow-2xl">
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Total Earnings</p>
            <h2 className="text-6xl font-black italic tracking-tighter mb-10 text-white">₹0.00</h2>
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
              <div className="text-center">
                <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Live Units</p>
                <p className="text-2xl font-black italic">{myChargers.filter(c => c.is_online).length}</p>
              </div>
              <div className="text-center">
                <p className="text-zinc-500 text-[10px] font-bold uppercase mb-1">Total Energy</p>
                <p className="text-2xl font-black italic text-emerald-400">0 <span className="text-xs">kWh</span></p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest pl-2">Manage Your Assets</h3>
            {myChargers.length === 0 ? (
              <div className="p-16 border-2 border-dashed border-zinc-900 rounded-[40px] text-center text-zinc-700 font-bold uppercase text-[10px]">
                No active chargers found
              </div>
            ) : (
              myChargers.map((charger) => (
                <div key={charger.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[32px] flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                  <div>
                    <p className="font-black italic uppercase text-lg leading-none mb-1">{charger.name}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      {charger.charger_type} • ₹{charger.price_per_kwh}/kWh • {charger.capacity_kwh}kW
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${charger.is_online ? 'text-emerald-500' : 'text-zinc-600'}`}>
                      {charger.is_online ? "Active" : "Offline"}
                    </span>
                    <button 
                      onClick={() => toggleVisibility(charger.id, charger.is_online)}
                      className={`w-14 h-7 rounded-full p-1 transition-all ${charger.is_online ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${charger.is_online ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-lg mx-auto pb-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[40px] space-y-4">
             <p className="text-[10px] font-black uppercase text-emerald-500 px-2">Technical Specs</p>
             <input 
              placeholder="Station Name"
              className="w-full bg-black/50 border border-zinc-800 p-5 rounded-3xl text-sm outline-none"
              onChange={(e) => setNewCharger({...newCharger, name: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="kW (e.g. 7.4)" className="bg-black/50 border border-zinc-800 p-5 rounded-3xl text-sm outline-none" onChange={(e) => setNewCharger({...newCharger, capacity: e.target.value})}/>
              <input type="number" placeholder="Price/kWh" className="bg-black/50 border border-zinc-800 p-5 rounded-3xl text-sm text-emerald-500 font-bold outline-none" onChange={(e) => setNewCharger({...newCharger, price: e.target.value})}/>
            </div>
            <select className="w-full bg-black/50 border border-zinc-800 p-5 rounded-3xl text-sm outline-none" value={newCharger.connector} onChange={(e) => setNewCharger({...newCharger, connector: e.target.value})}>
              <option value="Type 2">Type 2 (AC)</option>
              <option value="CCS2">CCS2 (DC Fast)</option>
              <option value="Other">Other (Manual Entry)</option>
            </select>
            {newCharger.connector === "Other" && (
              <input placeholder="Enter Plug Type" className="w-full bg-emerald-500/10 border border-emerald-500/50 p-5 rounded-3xl text-sm text-emerald-400 font-bold outline-none" onChange={(e) => setNewCharger({...newCharger, customConnector: e.target.value})}/>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[40px] space-y-3">
            <p className="text-[10px] font-black uppercase text-emerald-500 px-2 mb-2">Required Photos</p>
            {['charger', 'plug', 'parking'].map((key) => (
              <label key={key} className="flex flex-col cursor-pointer group">
                <div className="flex justify-between items-center bg-black/40 border border-zinc-800 p-5 rounded-3xl group-hover:border-zinc-600 transition-all">
                  <span className="text-[11px] font-black uppercase text-zinc-400 group-hover:text-white transition-colors">
                    {key} Photo
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500/60 truncate max-w-[150px]">
                    {photos[key as keyof typeof photos] ? (photos[key as keyof typeof photos] as File).name : 'Select File +'}
                  </span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => setPhotos({...photos, [key]: e.target.files?.[0] || null})}
                />
              </label>
            ))}
          </div>

          <button 
            onClick={handleRegister} 
            disabled={loading} 
            className="w-full bg-emerald-500 p-8 rounded-[40px] font-black italic uppercase text-black shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Capturing Location..." : "Publish & Fetch Location"}
          </button>
        </div>
      )}

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-xs h-16 bg-black/80 backdrop-blur-3xl border border-white/5 rounded-full flex items-center justify-around px-8 shadow-2xl z-50">
        <Link href="/" className="text-zinc-600 text-[10px] font-black uppercase">Home</Link>
        <button className="text-emerald-400 text-[10px] font-black uppercase">Host</button>
        <Link href="/profile" className="text-zinc-600 text-[10px] font-black uppercase">Profile</Link>
      </nav>
    </main>
  );
}