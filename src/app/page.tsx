'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BatteryCard from '@/components/ui/BatteryCard';
import FilterChips from '@/components/ui/FilterChips';
import ChargerList from '@/components/ui/ChargerList';
import Link from 'next/link';
import FinalPaymentModal from '@/components/FinalPaymentModal';
import { createClient } from '@/utils/supabase/client';

// --- STABLE MATH HELPER ---
// Uses Haversine formula to calculate distance without needing Leaflet/Window objects
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in KM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  // --- CONSTANTS ---
  const BATTERY_CAPACITY = 30;
  const MAX_RANGE = 325;
  const START_LEVEL = 21;
  const START_RANGE = 63;

  // --- STATES ---
  const [chargingStatus, setChargingStatus] = useState<'IDLE' | 'CHARGING' | 'PAYING' | null>(null);
  const [liveKwh, setLiveKwh] = useState(0.0);
  const [batteryLevel, setBatteryLevel] = useState(START_LEVEL);
  const [range, setRange] = useState(START_RANGE);
  const [stationName, setStationName] = useState("Sarah's Driveway");
  const [stationRate, setStationRate] = useState(11);

  const [nearbyStations, setNearbyStations] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const userVehiclePlug = "Type 2";

  // 1. INITIALIZATION & RECOVERY
  useEffect(() => {
    const savedStatus = localStorage.getItem('chargingStatus') as any;
    const savedKwh = localStorage.getItem('liveKwh');
    const savedBat = localStorage.getItem('batteryLevel');
    const savedRange = localStorage.getItem('range');
    const savedName = localStorage.getItem('currentStationName');
    const savedRate = localStorage.getItem('currentStationRate');

    setChargingStatus(savedStatus || 'IDLE');
    if (savedKwh) setLiveKwh(parseFloat(savedKwh));
    if (savedBat) setBatteryLevel(parseFloat(savedBat));
    if (savedRange) setRange(parseFloat(savedRange));
    if (savedName) setStationName(savedName);
    if (savedRate) setStationRate(parseInt(savedRate));

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }, (err) => console.error("GPS Access Denied:", err));
    }
  }, []);

  // 2. DATA FETCHING (RPC call with safe distance mapping)
  useEffect(() => {
    const fetchNearby = async () => {
      if (!userLocation) return;

      const { data, error } = await supabase.rpc('nearby_chargers', {
        user_lat: userLocation.lat,
        user_long: userLocation.lng,
        radius_meters: 25000
      });

      if (data) {
        const compatible = data
          .filter((c: any) => c.charger_type === userVehiclePlug)
          .map((c: any) => {
            // Safe parsing to prevent NaN
            const cLat = parseFloat(c.latitude || c.lat);
            const cLng = parseFloat(c.longitude || c.lng);

            if (!isNaN(cLat) && !isNaN(cLng)) {
              const dist = calculateDistance(userLocation.lat, userLocation.lng, cLat, cLng);
              return { ...c, distance: dist.toFixed(1) };
            }
            return { ...c, distance: "0.0" };
          });

        setNearbyStations(compatible);
      } else if (error) {
        console.error("Supabase Error:", error);
      }
    };

    fetchNearby();
  }, [userLocation, supabase]);

  // 3. PERSISTENCE
  useEffect(() => {
    if (chargingStatus) {
      localStorage.setItem('chargingStatus', chargingStatus);
      localStorage.setItem('liveKwh', liveKwh.toString());
      localStorage.setItem('batteryLevel', batteryLevel.toString());
      localStorage.setItem('range', range.toString());
    }
  }, [chargingStatus, liveKwh, batteryLevel, range]);

  // 4. CHARGING LOGIC (Physics Ticker)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (chargingStatus === 'CHARGING') {
      interval = setInterval(() => {
        setLiveKwh((prev) => {
          const increment = 0.1;
          const nextKwh = +(prev + increment).toFixed(2);
          const addedPct = (increment / BATTERY_CAPACITY) * 100;
          const addedRange = (increment / BATTERY_CAPACITY) * MAX_RANGE;

          setBatteryLevel((b) => {
            const nextBat = b + addedPct;
            if (nextBat >= 100) {
              setChargingStatus('PAYING');
              return 100;
            }
            return nextBat;
          });
          setRange((r) => Math.min(MAX_RANGE, r + addedRange));
          return nextKwh;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [chargingStatus]);

  const currentTotalCost = liveKwh * stationRate;
  const bookingFee = 11;
  const restAmount = Math.max(0, currentTotalCost - bookingFee);

  const resetDemo = () => {
    localStorage.clear();
    setBatteryLevel(START_LEVEL);
    setRange(START_RANGE);
    setLiveKwh(0);
    setChargingStatus('IDLE');
    window.location.reload();
  };

  if (chargingStatus === null) return <div className="min-h-screen bg-black" />;

  return (
    <main className="min-h-screen bg-black flex flex-col items-center pb-32">
      <div className="w-full max-w-md px-6 pt-12">

        {/* Header Section */}
        <div className="flex justify-between items-start mb-10">
          <div className="w-10" />
          <div className="text-center">
            <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">NexDrive</h1>
            <p className={`text-[10px] uppercase tracking-[0.3em] mt-1 font-bold ${chargingStatus === 'CHARGING' ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`}>
              ● {chargingStatus === 'CHARGING' ? 'Charging Live' : 'System Ready'}
            </p>
          </div>
          <button onClick={resetDemo} className="text-[10px] text-zinc-700 font-bold uppercase border border-zinc-800 px-2 py-1 rounded-md hover:text-white transition-colors">
            Reset
          </button>
        </div>

        <BatteryCard level={Math.floor(batteryLevel)} range={Math.floor(range)} isCharging={chargingStatus === 'CHARGING'} />

        <div className="mt-8 min-h-[320px]">
          {chargingStatus === 'IDLE' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">Stations Near You</h3>
                <span className="text-emerald-500 text-[9px] font-black uppercase">{nearbyStations.length} Compatible</span>
              </div>
              <FilterChips />
              <div className="mt-4">
                {nearbyStations.length === 0 ? (
                  <div className="p-10 border border-dashed border-zinc-900 rounded-[32px] text-center">
                    <p className="text-zinc-700 text-[10px] uppercase font-bold animate-pulse">Scanning 25km radius...</p>
                  </div>
                ) : (
                  <ChargerList
                    items={nearbyStations}
                    onBook={(station: any) => {
                      // 1. Extract values from the station object
                      const rate = station.price_per_kwh || 11;
                      const name = station.name || "Unknown Station";

                      // 2. Save to LocalStorage
                      localStorage.setItem('currentStationRate', rate.toString());
                      localStorage.setItem('currentStationName', name);

                      // 3. Update States
                      setStationRate(rate);
                      setStationName(name);
                      setChargingStatus('CHARGING');
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            /* Active Charging View */
            <div className="bg-zinc-900 border border-emerald-500/30 p-8 rounded-[40px] shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-emerald-500 text-[9px] font-black uppercase mb-1">Active Session</p>
                  <h3 className="text-white text-xl font-black italic uppercase">{stationName}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold">RATE: ₹{stationRate}/kWh</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 animate-pulse border border-emerald-500/20">⚡</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-800/50 p-5 rounded-3xl border border-white/5">
                  <p className="text-zinc-500 text-[8px] uppercase font-black mb-1">Energy Added</p>
                  <p className="text-2xl font-black text-white italic">{liveKwh.toFixed(1)} <span className="text-[10px]">kWh</span></p>
                </div>
                <div className="bg-zinc-800/50 p-5 rounded-3xl border border-white/5">
                  <p className="text-zinc-500 text-[8px] uppercase font-black mb-1">Cost</p>
                  <p className="text-2xl font-black text-emerald-400 italic">₹{currentTotalCost.toFixed(0)}</p>
                </div>
              </div>
              <button
                onClick={() => setChargingStatus('PAYING')}
                className="w-full py-5 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Stop & Pay
              </button>
            </div>
          )}
        </div>

        <button onClick={() => router.push('/explore')} className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest mt-8 active:scale-95 transition-all">
          Open Map View
        </button>
      </div>

      {chargingStatus === 'PAYING' && (
        <FinalPaymentModal
          totalAmount={currentTotalCost}
          bookingFee={bookingFee}
          restAmount={restAmount}
          onComplete={() => {
            setChargingStatus('IDLE');
            setLiveKwh(0.0);
            localStorage.clear();
          }}
        />
      )}

      {/* Persistent Navigation Bar */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-3xl flex items-center justify-around z-50">
        <Link href="/" className="flex flex-col items-center text-emerald-400 gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mb-1"></div>
          <span className="text-[9px] font-bold uppercase">Home</span>
        </Link>
        <Link href="/host" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors">
          <span className="text-lg">◇</span>
          <span className="text-[9px] font-bold uppercase">Host Mode</span>
        </Link>
        <Link href="/wallet" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors">
          <span className="text-lg">◍</span>
          <span className="text-[9px] font-bold uppercase">Wallet</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center text-zinc-500 gap-1 hover:text-white transition-colors">
          <span className="text-lg">○</span>
          <span className="text-[9px] font-bold uppercase">Profile</span>
        </Link>
      </nav>
    </main>
  );
}