'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const RoutingControl = dynamic(() => import('@/components/ui/RoutingControl'), { ssr: false });

type Status = 'pending' | 'approved' | 'en_route' | 'active' | 'completed' | 'denied' | 'cancelled';

interface SessionData {
  id: string;
  charger_id: number;
  driver_id: string;
  host_id: string;
  status: Status;
  rate_per_kwh: number;
  hold_amount: number;
  time_limit_mins: number;
  started_at: string | null;
  ended_at: string | null;
  kwh_delivered: number;
  amount_charged: number;
  approved_at: string | null;
}

interface ChargerData {
  name: string;
  address: string;
  power_kw: number;
  latitude: number;
  longitude: number;
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Navigation Map ────────────────────────────────────────────────────────────
function NavigationMap({
  charger, session, onArrived,
}: {
  charger: ChargerData; session: SessionData; onArrived: () => Promise<void>;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const didFlyRef = useRef(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [arrivedLoading, setArrivedLoading] = useState(false);
  const dest: [number, number] = [charger.latitude, charger.longitude];

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: dest, zoom: 14, maxZoom: 18, minZoom: 3,
      zoomControl: false, attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO', maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    if (!document.getElementById('cs-nav-styles')) {
      const s = document.createElement('style');
      s.id = 'cs-nav-styles';
      s.textContent = `
        .cs-user-dot{width:18px;height:18px;background:#3b82f6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 5px rgba(59,130,246,.25);animation:cs-loc-pulse 2s infinite;}
        @keyframes cs-loc-pulse{0%{box-shadow:0 0 0 4px rgba(59,130,246,.3);}70%{box-shadow:0 0 0 12px rgba(59,130,246,0);}100%{box-shadow:0 0 0 4px rgba(59,130,246,.3);}}
        .cs-dest-wrap{display:flex;flex-direction:column;align-items:center;}
        .cs-dest-circle{width:40px;height:40px;background:#10b981;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(16,185,129,.3),0 6px 20px rgba(16,185,129,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;}
        .cs-dest-stem{width:3px;height:10px;background:#10b981;border-radius:0 0 2px 2px;}
        .clean-popup .leaflet-popup-content-wrapper{background:#18181b;border:1px solid #27272a;border-radius:16px;padding:0;box-shadow:0 10px 30px rgba(0,0,0,.7);}
        .clean-popup .leaflet-popup-tip{background:#18181b;}
        .clean-popup .leaflet-popup-content{margin:0;width:auto!important;}
        .leaflet-routing-container{display:none!important;}
      `;
      document.head.appendChild(s);
    }

    const destIcon = L.divIcon({
      className: '',
      html: `<div class="cs-dest-wrap"><div class="cs-dest-circle">⚡</div><div class="cs-dest-stem"></div></div>`,
      iconSize: [40, 50], iconAnchor: [20, 50],
    });
    L.marker(dest, { icon: destIcon })
      .bindPopup(`
        <div style="padding:12px 16px;font-family:system-ui,sans-serif;">
          <p style="margin:0 0 2px;font-size:10px;font-weight:800;color:#10b981;text-transform:uppercase;letter-spacing:.06em;">Your Charger</p>
          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#fff;">${charger.name}</p>
          <p style="margin:0;font-size:11px;color:#a1a1aa;">${charger.address}</p>
          <div style="margin-top:10px;display:flex;gap:8px;">
            <span style="background:#27272a;color:#10b981;padding:4px 10px;border-radius:8px;font-size:10px;font-weight:700;">${charger.power_kw} kW</span>
            <span style="background:#27272a;color:#fff;padding:4px 10px;border-radius:8px;font-size:10px;font-weight:700;">₹${session.rate_per_kwh}/kWh</span>
          </div>
        </div>
      `, { className: 'clean-popup', maxWidth: 260 })
      .addTo(map).openPopup();

    const userIcon = L.divIcon({
      className: '', html: `<div class="cs-user-dot"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9],
    });

    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker(coords, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        } else {
          userMarkerRef.current.setLatLng(coords);
        }
        if (!didFlyRef.current) {
          didFlyRef.current = true;
          map.fitBounds(L.latLngBounds([coords, dest]), { padding: [90, 90], animate: true, duration: 1.2 });
        }
      },
      (err) => console.warn('GPS:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(wid);
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      didFlyRef.current = false;
    };
  }, []); // eslint-disable-line

  const reCentre = () => {
    if (!mapRef.current) return;
    const bounds = userPos ? L.latLngBounds([userPos, dest]) : L.latLngBounds([dest, dest]);
    mapRef.current.fitBounds(bounds, { padding: [90, 90], animate: true });
  };

  return (
    <div className="relative h-screen w-full bg-zinc-950 overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {mapRef.current && userPos && (
        <RoutingControl start={userPos} end={dest} map={mapRef.current} />
      )}

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)', paddingBottom: '40px' }}>
        <div className="flex flex-col items-center pt-10 gap-2 px-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 backdrop-blur-md px-4 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
            </span>
            <span className="text-blue-300 text-[10px] font-black uppercase tracking-widest">Navigation Active</span>
          </div>
          <h1 className="text-white text-lg font-black italic uppercase tracking-tighter text-center drop-shadow-lg">{charger.name}</h1>
          <p className="text-zinc-400 text-[10px] font-bold drop-shadow text-center">{charger.address}</p>
        </div>
      </div>

      {/* Re-centre */}
      <button onClick={reCentre}
        className="absolute right-4 z-[500] w-11 h-11 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-full flex items-center justify-center text-blue-400 shadow-xl active:scale-95 transition-all"
        style={{ bottom: '230px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/>
          <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
        </svg>
      </button>

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-[500]"
        style={{ background: 'linear-gradient(to top, rgba(5,5,10,0.98) 70%, transparent 100%)' }}>
        <div className="px-4 pt-6 pb-8 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Power', value: `${charger.power_kw} kW` },
              { label: 'Rate', value: `₹${session.rate_per_kwh}/kWh` },
              { label: 'Time Limit', value: `${session.time_limit_mins} min` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-zinc-900/80 backdrop-blur border border-zinc-800/80 rounded-2xl p-3 text-center">
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">{label}</p>
                <p className="text-white text-[11px] font-black italic">{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl px-4 py-2.5 flex justify-between items-center">
            <p className="text-orange-300 text-[9px] font-black uppercase tracking-wide">Pre-Auth Hold Active</p>
            <p className="text-orange-400 font-black text-sm">₹{session.hold_amount}</p>
          </div>
          <button
            onClick={async () => { setArrivedLoading(true); await onArrived(); setArrivedLoading(false); }}
            disabled={arrivedLoading}
            className="w-full py-5 bg-emerald-500 text-black font-black uppercase text-xs tracking-[0.2em] rounded-[24px] active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.35)] disabled:opacity-60">
            {arrivedLoading ? 'Starting Session...' : "⚡ I've Arrived — Start Charging"}
          </button>
          <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest text-center">
            Tap only when physically at the charger
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Active charging screen ────────────────────────────────────────────────────
function ActiveScreen({
  session, charger, onStop,
}: {
  session: SessionData; charger: ChargerData; onStop: (kwh: number, cost: number) => void;
}) {
  const POWER_KW = charger.power_kw || 7.4;
  const KWH_PER_TICK = (POWER_KW / 3600) * 10;
  const [kwh, setKwh] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [power, setPower] = useState(POWER_KW);
  const timeLimitSecs = (session.time_limit_mins || 120) * 60;
  const timeRemaining = Math.max(0, timeLimitSecs - timeElapsed);
  const cost = +(kwh * session.rate_per_kwh).toFixed(2);
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const maxKwh = POWER_KW * (session.time_limit_mins / 60);
  const pct = Math.min(100, (kwh / maxKwh) * 100);
  const kwhRef = useRef(0); const costRef = useRef(0);
  kwhRef.current = kwh; costRef.current = cost;

  useEffect(() => {
    const kwhTimer = setInterval(() => {
      setKwh(prev => +(prev + KWH_PER_TICK).toFixed(3));
      setPower(+(POWER_KW + (Math.random() * 0.4 - 0.2)).toFixed(1));
    }, 10_000);
    const clockTimer = setInterval(() => {
      setTimeElapsed(prev => {
        const next = prev + 1;
        if (next >= timeLimitSecs) {
          clearInterval(kwhTimer); clearInterval(clockTimer);
          onStop(kwhRef.current, costRef.current);
        }
        return next;
      });
    }, 1000);
    return () => { clearInterval(kwhTimer); clearInterval(clockTimer); };
  }, []); // eslint-disable-line

  return (
    <main className="min-h-screen bg-[#050a14] text-white flex flex-col items-center justify-between p-6 pb-12">
      <div className="pt-10 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest italic">Charging Active</span>
        </div>
        <h1 className="text-xl font-black italic tracking-tighter uppercase">{charger.name}</h1>
        <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">₹{session.rate_per_kwh}/kWh · {charger.power_kw} kW</p>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute w-56 h-56 bg-emerald-500/5 blur-[90px] rounded-full animate-pulse" />
        <svg className="w-72 h-72 transform -rotate-90">
          <circle cx="144" cy="144" r={radius} stroke="#18181b" strokeWidth="8" fill="transparent" />
          <circle cx="144" cy="144" r={radius} stroke="#10b981" strokeWidth="10" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * pct) / 100}
            strokeLinecap="round"
            className="transition-all duration-[10000ms] ease-linear"
            style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' }} />
        </svg>
        <div className="absolute text-center">
          <p className="text-5xl font-black tracking-tighter italic leading-none">
            {kwh.toFixed(2)}<span className="text-lg text-emerald-500"> kWh</span>
          </p>
          <p className="text-emerald-400 text-xl font-black italic mt-2">₹{cost.toFixed(0)}</p>
          <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-1 italic">Cost so far</p>
        </div>
      </div>

      <div className="w-full max-w-sm grid grid-cols-3 gap-3">
        {[
          { label: 'Power', value: `${power} kW`, red: false },
          { label: 'Elapsed', value: fmt(timeElapsed), red: false },
          { label: 'Left', value: fmt(timeRemaining), red: timeRemaining < 300 },
        ].map(({ label, value, red }) => (
          <div key={label} className={`border p-4 rounded-3xl text-center ${red ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900/40 border-zinc-800/50'}`}>
            <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest mb-1">{label}</p>
            <p className={`text-sm font-black italic tabular-nums ${red ? 'text-red-400' : ''}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-sm">
        <button onClick={() => onStop(kwh, cost)}
          className="w-full py-5 bg-zinc-900/80 backdrop-blur-md border border-red-900/30 text-red-400 font-black text-[10px] uppercase tracking-[0.4em] rounded-[24px] hover:bg-red-500/10 transition-all active:scale-95 shadow-xl">
          Stop Session
        </button>
        <p className="text-zinc-700 text-[8px] font-bold uppercase tracking-widest text-center mt-3">
          Session auto-ends at {session.time_limit_mins} min limit
        </p>
      </div>
    </main>
  );
}

// ── Post-session payment + rating ─────────────────────────────────────────────
function CompletedScreen({
  session, kwh, cost, userId, onDone,
}: {
  session: SessionData; kwh: number; cost: number; userId: string; onDone: () => void;
}) {
  const supabase = createClient();
  const [step, setStep] = useState<'bill' | 'processing' | 'rating' | 'done'>('bill');
  const [rating, setRating] = useState(0);
  // Amount driver pays beyond what was held (usually 0 if cost ≤ holdAmount)
  const restAmount = Math.max(0, cost - session.hold_amount);

  const handleSettle = async () => {
    setStep('processing');

    const { data: wallet } = await supabase
      .from('wallets').select('balance, held').eq('user_id', userId).single();

    if (wallet) {
      // ── CORRECT WALLET MATH ──────────────────────────────────────────
      // At booking:     held += holdAmount  (balance was NOT reduced)
      // At completion:  balance -= actualCost  (deduct only what was used)
      //                 held    -= holdAmount  (release the full hold)
      // Net: if cost < holdAmount, driver keeps the difference in balance
      await supabase.from('wallets').update({
        balance: Math.max(0, wallet.balance - cost),
        held:    Math.max(0, wallet.held - session.hold_amount),
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);

      // Charge transaction (actual cost)
      await supabase.from('wallet_transactions').insert({
        user_id: userId, type: 'charge', amount: -cost,
        description: 'Session payment', session_id: session.id,
      });

      // Release transaction for the hold (so wallet history is clean)
      await supabase.from('wallet_transactions').insert({
        user_id: userId, type: 'release', amount: session.hold_amount,
        description: 'Pre-auth hold released', session_id: session.id,
      });

      // Credit host 85%
      const hostPayout = +(cost * 0.85).toFixed(2);
      const { data: hw } = await supabase.from('wallets')
        .select('balance').eq('user_id', session.host_id).single();
      if (hw) {
        await supabase.from('wallets').update({
          balance: hw.balance + hostPayout,
          updated_at: new Date().toISOString(),
        }).eq('user_id', session.host_id);
        await supabase.from('wallet_transactions').insert({
          user_id: session.host_id, type: 'payout', amount: hostPayout,
          description: 'Session earnings (85%)', session_id: session.id,
        });
      }
    }

    await supabase.from('session_requests').update({
      status: 'completed', ended_at: new Date().toISOString(),
      kwh_delivered: kwh, amount_charged: cost,
    }).eq('id', session.id);

    setTimeout(() => setStep('rating'), 1200);
  };

  const submitRating = async (score: number) => {
    if (score > 0) {
      await supabase.from('ratings').insert({
        session_id: session.id, from_user: userId, to_user: session.host_id, score,
      });
      const { data: all } = await supabase.from('ratings').select('score').eq('to_user', session.host_id);
      if (all?.length) {
        const avg = all.reduce((s: number, r: any) => s + r.score, 0) / all.length;
        await supabase.from('profiles').update({ rating: avg }).eq('id', session.host_id);
      }
    }
    setStep('done');
  };

  return (
    <div className="fixed inset-0 bg-black/97 backdrop-blur-xl z-[100] flex items-center justify-center p-5">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[36px] overflow-hidden shadow-2xl">

        {step === 'bill' && (
          <div className="p-6 animate-in fade-in zoom-in duration-300 space-y-5">
            <h2 className="text-white font-black italic uppercase text-center tracking-tighter text-xl">Session Complete</h2>
            <div className="space-y-3">
              {[
                { label: 'Energy Delivered', value: `${kwh.toFixed(2)} kWh`, color: 'text-white' },
                { label: 'Total Cost', value: `₹${cost.toFixed(2)}`, color: 'text-white' },
                { label: 'Pre-Auth Hold', value: `-₹${session.hold_amount.toFixed(2)}`, color: 'text-orange-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-zinc-500">{label}</span>
                  <span className={`italic font-black ${color}`}>{value}</span>
                </div>
              ))}
              <div className="h-px bg-zinc-800" />
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-400 text-[12px] font-black uppercase">Amount Due</span>
                <span className="text-4xl font-black text-white italic">₹{restAmount.toFixed(0)}</span>
              </div>
              <p className="text-zinc-600 text-[8px] font-bold text-center">Deducted from your ChargeShare wallet</p>
            </div>
            <button onClick={handleSettle}
              className="w-full py-5 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all">
              Confirm & Pay →
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-white font-black italic uppercase text-xs tracking-widest animate-pulse">Processing Payment...</p>
          </div>
        )}

        {step === 'rating' && (
          <div className="p-6 text-center animate-in slide-in-from-right duration-500 space-y-5">
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">Rate this session</p>
            <h3 className="text-white text-xl font-black italic uppercase">How was your host?</h3>
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setRating(star)}
                  className={`text-3xl transition-all ${rating >= star ? 'scale-110' : 'opacity-25'}`}>⚡</button>
              ))}
            </div>
            <button onClick={() => submitRating(rating)}
              className="w-full py-4 bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl active:scale-95">
              Submit Review
            </button>
            <button onClick={() => submitRating(0)}
              className="w-full py-2 text-zinc-600 font-bold uppercase text-[9px] tracking-widest hover:text-white transition-colors">
              Skip
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="p-8 text-center animate-in zoom-in duration-500 space-y-5">
            <div className="w-24 h-24 bg-emerald-500 text-black rounded-full flex items-center justify-center mx-auto text-4xl font-black shadow-[0_0_40px_rgba(16,185,129,0.3)]">✓</div>
            <h3 className="text-white font-black italic uppercase text-2xl tracking-tighter">All Done!</h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Session Closed · Wallet Updated</p>
            <button onClick={onDone}
              className="w-full py-5 bg-zinc-800 text-white font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95 transition-all">
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#050a14] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Loading Session...</p>
      </div>
    </main>
  );
}

function ErrorScreen({ msg, onBack }: { msg: string; onBack: () => void }) {
  return (
    <main className="min-h-screen bg-[#050a14] flex items-center justify-center p-6">
      <div className="text-center max-w-sm space-y-5">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-2xl">✕</div>
        <h2 className="text-white font-black italic uppercase text-xl">Something went wrong</h2>
        <p className="text-zinc-500 text-sm">{msg}</p>
        <button onClick={onBack} className="w-full py-4 bg-zinc-800 text-white font-black uppercase text-xs tracking-widest rounded-2xl active:scale-95">Back to Home</button>
      </div>
    </main>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = useRef(createClient()).current;

  const [session, setSession] = useState<SessionData | null>(null);
  const [charger, setCharger] = useState<ChargerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalKwh, setFinalKwh] = useState(0);
  const [finalCost, setFinalCost] = useState(0);

  const loadSession = useCallback(async () => {
    if (!id) return;
    const { data: sess, error: e } = await supabase.from('session_requests').select('*').eq('id', id).single();
    if (e || !sess) { setError('Session not found.'); setLoading(false); return; }
    setSession(sess as SessionData);
    const { data: ch } = await supabase.from('chargers')
      .select('name, address, power_kw, latitude, longitude').eq('id', sess.charger_id).single();
    if (ch) setCharger(ch as ChargerData);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadSession(); }, [loadSession]);

  // Realtime
  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`session-page-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_requests', filter: `id=eq.${id}` },
        (payload) => setSession(prev => prev ? { ...prev, ...(payload.new as SessionData) } : null))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const handleArrived = async () => {
    if (!session) return;
    await supabase.from('session_requests').update({
      status: 'active', started_at: new Date().toISOString(),
    }).eq('id', session.id);
    await supabase.from('notifications').insert({
      user_id: session.host_id, type: 'session_started', title: 'Driver has arrived',
      body: 'The driver has arrived and started charging.', data: { session_id: session.id }, read: false,
    });
    setSession(prev => prev ? { ...prev, status: 'active', started_at: new Date().toISOString() } : null);
  };

  const handleStop = useCallback((kwh: number, cost: number) => {
    setFinalKwh(kwh); setFinalCost(cost);
    setSession(prev => prev ? { ...prev, status: 'completed' } : null);
  }, []);

  if (loading) return <LoadingScreen />;
  if (error || !session || !charger) return <ErrorScreen msg={error || 'Could not load session.'} onBack={() => router.replace('/')} />;

  const isDriver = user?.id === session.driver_id;
  const isHost = user?.id === session.host_id;

  if (session.status === 'completed' && isDriver && finalKwh > 0) {
    return (
      <>
        <main className="min-h-screen bg-[#050a14]" />
        <CompletedScreen session={session} kwh={finalKwh} cost={finalCost} userId={user!.id} onDone={() => router.replace('/')} />
      </>
    );
  }

  if (session.status === 'approved' || session.status === 'en_route') {
    if (isDriver) return <NavigationMap charger={charger} session={session} onArrived={handleArrived} />;
    return (
      <main className="min-h-screen bg-[#050a14] text-white flex flex-col items-center justify-center p-6 gap-6">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Driver is on the way</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">{charger.name}</h1>
          <p className="text-zinc-500 text-[10px] mt-1">Session begins when driver arrives</p>
        </div>
        <button onClick={() => router.replace('/host')} className="py-3 px-8 border border-zinc-800 rounded-2xl text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
          Back to Host Dashboard
        </button>
      </main>
    );
  }

  if (session.status === 'active') return <ActiveScreen session={session} charger={charger} onStop={handleStop} />;

  return <ErrorScreen msg={`Session status: ${session.status}`} onBack={() => router.replace('/')} />;
}