'use client';
import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix Leaflet default marker in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Turn instruction type ─────────────────────────────────────────────────
interface Step {
  instruction: string;
  distance: number; // metres
  type: number;     // OSRM maneuver type
}

// ── Maneuver type → arrow icon ────────────────────────────────────────────
function stepIcon(type: number): string {
  // OSRM types: 0=straight, 1=slight right, 2=right, 3=sharp right,
  // 4=U-turn, 5=sharp left, 6=left, 7=slight left, 8=depart, 9=arrive
  switch (type) {
    case 1: return '↗';
    case 2: return '→';
    case 3: return '↪';
    case 4: return '↩';
    case 5: return '↫';
    case 6: return '←';
    case 7: return '↖';
    case 8: return '📍';
    case 9: return '⚡';
    default: return '↑';
  }
}

function fmtDist(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function fmtDuration(secs: number): string {
  const m = Math.round(secs / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} hr ${m % 60} min`;
}

// ── Component ─────────────────────────────────────────────────────────────
export default function PublicDirectionsModal({
  station,
  userLocation,
  onClose,
}: {
  station: any;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const mapContainerRef  = useRef<HTMLDivElement>(null);
  const mapRef           = useRef<L.Map | null>(null);
  const userMarkerRef    = useRef<L.Marker | null>(null);
  const routingRef       = useRef<any>(null);
  const didFitRef        = useRef(false);

  const [userPos, setUserPos]       = useState<[number, number] | null>(
    userLocation ? [userLocation.lat, userLocation.lng] : null
  );
  const [steps, setSteps]           = useState<Step[]>([]);
  const [totalDist, setTotalDist]   = useState<number>(0);
  const [totalTime, setTotalTime]   = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [sheetOpen, setSheetOpen]   = useState(false); // collapsed by default

  const destLat = parseFloat(station.lat ?? station.latitude);
  const destLng = parseFloat(station.lng ?? station.longitude);
  const dest: [number, number] = [destLat, destLng];

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: dest,
      zoom: 14,
      maxZoom: 18,
      minZoom: 3,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO', maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // ── CSS ─────────────────────────────────────────────────────────────
    if (!document.getElementById('cs-nav-map-styles')) {
      const s = document.createElement('style');
      s.id = 'cs-nav-map-styles';
      s.textContent = `
        .cs-user-dot {
          width:20px;height:20px;background:#4285f4;border-radius:50%;
          border:3px solid #fff;box-shadow:0 2px 8px rgba(66,133,244,.6);
          position:relative;
        }
        .cs-user-dot::after {
          content:'';position:absolute;inset:-8px;border-radius:50%;
          background:rgba(66,133,244,.18);
          animation:cs-ring 2s ease-out infinite;
        }
        @keyframes cs-ring{0%{transform:scale(.6);opacity:.8}100%{transform:scale(1.6);opacity:0}}
        .cs-dest-pin{display:flex;flex-direction:column;align-items:center;}
        .cs-dest-head{
          width:36px;height:36px;background:#1a73e8;
          border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          border:3px solid #fff;box-shadow:0 3px 12px rgba(26,115,232,.6);
          display:flex;align-items:center;justify-content:center;
        }
        .cs-dest-icon{transform:rotate(45deg);font-size:15px;}
        .cs-clean-popup .leaflet-popup-content-wrapper{
          background:#1c1c1e;border:1px solid rgba(255,255,255,.1);
          border-radius:14px;padding:0;box-shadow:0 8px 32px rgba(0,0,0,.6);
        }
        .cs-clean-popup .leaflet-popup-tip{background:#1c1c1e;}
        .cs-clean-popup .leaflet-popup-content{margin:0;width:auto!important;}
        .cs-clean-popup .leaflet-popup-close-button{display:none;}
        .leaflet-routing-container,.leaflet-routing-alt,.leaflet-routing-error{display:none!important;}
      `;
      document.head.appendChild(s);
    }

    // ── Destination marker ──────────────────────────────────────────────
    const destIcon = L.divIcon({
      className: '',
      html: `<div class="cs-dest-pin"><div class="cs-dest-head"><span class="cs-dest-icon">⚡</span></div></div>`,
      iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -48],
    });
    L.marker(dest, { icon: destIcon })
      .bindPopup(`
        <div style="padding:12px 14px;font-family:-apple-system,system-ui,sans-serif;">
          <p style="margin:0 0 2px;font-size:10px;font-weight:700;color:#1a73e8;text-transform:uppercase;letter-spacing:.06em;">Public Charger</p>
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#fff;">${station.name}</p>
          <div style="display:flex;gap:6px;">
            ${station.power_kw ? `<span style="background:rgba(26,115,232,.15);color:#1a73e8;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;">${station.power_kw} kW</span>` : ''}
            <span style="background:rgba(52,199,89,.15);color:#34c759;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;">Free</span>
          </div>
        </div>
      `, { className: 'cs-clean-popup', maxWidth: 220 })
      .addTo(map)
      .openPopup();

    // ── User dot ────────────────────────────────────────────────────────
    const userIcon = L.divIcon({
      className: '', html: `<div class="cs-user-dot"></div>`,
      iconSize: [20, 20], iconAnchor: [10, 10],
    });

    const placeUser = (coords: [number, number]) => {
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(coords, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng(coords);
      }
      if (!didFitRef.current) {
        didFitRef.current = true;
        map.fitBounds(L.latLngBounds([coords, dest]), { padding: [80, 180], animate: true });
      }
    };

    if (userLocation) placeUser([userLocation.lat, userLocation.lng]);

    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        placeUser(coords);

        // Re-calculate route when user moves significantly
        if (routingRef.current) {
          routingRef.current.setWaypoints([
            L.latLng(coords[0], coords[1]),
            L.latLng(dest[0], dest[1]),
          ]);
        }
      },
      (err) => console.warn('GPS:', err.message),
      { enableHighAccuracy: true, maximumAge: 8000 }
    );

    // ── Routing Machine ─────────────────────────────────────────────────
    const startCoords = userLocation
      ? L.latLng(userLocation.lat, userLocation.lng)
      : L.latLng(dest[0], dest[1]);

    const routing = (L as any).Routing.control({
      waypoints: [startCoords, L.latLng(dest[0], dest[1])],
      lineOptions: {
        styles: [
          { color: '#fff', weight: 9, opacity: 0.15 },
          { color: '#1a73e8', weight: 5, opacity: 1 },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: false,
      draggableWaypoints: false,
      createMarker: () => null,
    });

    // ── Extract turn-by-turn steps ──────────────────────────────────────
    routing.on('routesfound', (e: any) => {
      const route = e.routes[0];
      setTotalDist(route.summary.totalDistance);
      setTotalTime(route.summary.totalTime);

      const extracted: Step[] = route.instructions
        .filter((ins: any) => ins.text && ins.distance >= 0)
        .map((ins: any) => ({
          instruction: ins.text,
          distance: ins.distance,
          type: ins.type ?? 0,
        }));

      setSteps(extracted);
      setActiveStep(0);
    });

    routing.addTo(map);
    routingRef.current = routing;

    return () => {
      navigator.geolocation.clearWatch(wid);
      try {
        if (routing.getPlan()) routing.setWaypoints([]);
        if (routing._map) map.removeControl(routing);
      } catch (_) {}
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      routingRef.current = null;
      didFitRef.current = false;
    };
  }, []); // eslint-disable-line

  const reCentre = () => {
    if (!mapRef.current) return;
    const bounds = userPos
      ? L.latLngBounds([userPos, dest])
      : L.latLngBounds([dest, dest]);
    mapRef.current.fitBounds(bounds, { padding: [80, 180], animate: true });
  };

  const currentStep = steps[activeStep];

  return (
    <div className="absolute inset-0 z-[100] bg-[#050505]">

      {/* Map */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
        <div className="flex flex-col items-center pt-11 gap-1.5 px-4">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 backdrop-blur-md px-4 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Navigation Active</span>
          </div>
          <p className="text-white text-base font-bold text-center drop-shadow">{station.name}</p>
          {totalDist > 0 && (
            <p className="text-zinc-400 text-[11px] drop-shadow">
              {fmtDist(totalDist)} · {fmtDuration(totalTime)} away
            </p>
          )}
        </div>
      </div>

      {/* ── Re-centre ── */}
      <button onClick={reCentre}
        className="absolute right-4 z-[500] w-10 h-10 bg-[#1c1c1e] border border-zinc-700/60 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
        style={{ bottom: sheetOpen ? '340px' : '200px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" fill="#1a73e8" stroke="none"/>
          <line x1="12" y1="2" x2="12" y2="7"/>
          <line x1="12" y1="17" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="7" y2="12"/>
          <line x1="17" y1="12" x2="22" y2="12"/>
        </svg>
      </button>

      {/* ── Bottom navigation sheet ── */}
      <div className="absolute bottom-0 left-0 right-0 z-[500]"
        style={{ background: 'linear-gradient(to top, rgba(10,10,12,0.98) 70%, transparent 100%)' }}>
        <div className="px-4 pt-3 pb-6">

          {/* Drag handle */}
          <div className="flex justify-center mb-3">
            <button onClick={() => setSheetOpen(o => !o)}
              className="w-10 h-1 bg-zinc-600 rounded-full active:bg-zinc-400 transition-colors" />
          </div>

          {/* ── Current step card (always visible) ── */}
          {currentStep ? (
            <div className="bg-[#1c2a3a] border border-blue-900/40 rounded-2xl p-4 mb-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1a73e8] rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold text-white">
                {stepIcon(currentStep.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">{currentStep.instruction}</p>
                <p className="text-blue-400 text-[11px] font-bold mt-0.5">{fmtDist(currentStep.distance)}</p>
              </div>
              {/* prev / next */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                  disabled={activeStep === 0}
                  className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-white text-xs disabled:opacity-30 active:scale-95 transition-all">
                  ▲
                </button>
                <button
                  onClick={() => setActiveStep(s => Math.min(steps.length - 1, s + 1))}
                  disabled={activeStep === steps.length - 1}
                  className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-white text-xs disabled:opacity-30 active:scale-95 transition-all">
                  ▼
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3 text-center">
              <p className="text-zinc-500 text-[11px] animate-pulse">Calculating route...</p>
            </div>
          )}

          {/* ── Full steps list (expandable) ── */}
          {sheetOpen && steps.length > 0 && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden mb-3 max-h-48 overflow-y-auto">
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-zinc-800/60 last:border-0 transition-colors ${
                    idx === activeStep ? 'bg-blue-500/10' : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <span className={`text-base w-6 flex-shrink-0 ${idx === activeStep ? 'text-blue-400' : 'text-zinc-500'}`}>
                    {stepIcon(step.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-medium leading-tight truncate ${idx === activeStep ? 'text-white' : 'text-zinc-400'}`}>
                      {step.instruction}
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-600 flex-shrink-0">{fmtDist(step.distance)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Summary + back button */}
          <div className="flex gap-2">
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-3 py-2.5 flex items-center justify-center gap-3">
              <div className="text-center">
                <p className="text-white text-sm font-bold">{fmtDist(totalDist)}</p>
                <p className="text-zinc-500 text-[9px] uppercase tracking-wider">Distance</p>
              </div>
              <div className="w-px h-6 bg-zinc-700" />
              <div className="text-center">
                <p className="text-white text-sm font-bold">{fmtDuration(totalTime)}</p>
                <p className="text-zinc-500 text-[9px] uppercase tracking-wider">ETA</p>
              </div>
            </div>
            <button onClick={onClose}
              className="bg-[#1a73e8] text-white font-bold text-sm px-5 rounded-2xl active:scale-95 transition-all shadow-lg whitespace-nowrap">
              ✕ Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}