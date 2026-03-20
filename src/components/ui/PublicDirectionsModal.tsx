'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const RoutingControl = dynamic(() => import('@/components/ui/RoutingControl'), { ssr: false });

export default function PublicDirectionsModal({
  station,
  userLocation,
  onClose,
}: {
  station: any;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(
    userLocation ? [userLocation.lat, userLocation.lng] : null
  );

  const dest: [number, number] = [
    parseFloat(station.lat ?? station.latitude),
    parseFloat(station.lng ?? station.longitude),
  ];

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

    if (!document.getElementById('cs-pub-styles')) {
      const s = document.createElement('style');
      s.id = 'cs-pub-styles';
      s.textContent = `
        .cs-pub-dot{width:18px;height:18px;background:#3b82f6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 5px rgba(59,130,246,.25);animation:cs-pub-pulse 2s infinite;}
        @keyframes cs-pub-pulse{0%{box-shadow:0 0 0 4px rgba(59,130,246,.3);}70%{box-shadow:0 0 0 12px rgba(59,130,246,0);}100%{box-shadow:0 0 0 4px rgba(59,130,246,.3);}}
        .cs-pub-dest{display:flex;flex-direction:column;align-items:center;}
        .cs-pub-circle{width:40px;height:40px;background:#3b82f6;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,.3),0 6px 20px rgba(59,130,246,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;}
        .cs-pub-stem{width:3px;height:10px;background:#3b82f6;border-radius:0 0 2px 2px;}
        .clean-popup .leaflet-popup-content-wrapper{background:#18181b;border:1px solid #27272a;border-radius:16px;padding:0;box-shadow:0 10px 30px rgba(0,0,0,.7);}
        .clean-popup .leaflet-popup-tip{background:#18181b;}
        .clean-popup .leaflet-popup-content{margin:0;width:auto!important;}
        .leaflet-routing-container{display:none!important;}
      `;
      document.head.appendChild(s);
    }

    const destIcon = L.divIcon({
      className: '',
      html: `<div class="cs-pub-dest"><div class="cs-pub-circle">⚡</div><div class="cs-pub-stem"></div></div>`,
      iconSize: [40, 50], iconAnchor: [20, 50],
    });
    L.marker(dest, { icon: destIcon })
      .bindPopup(`
        <div style="padding:12px 16px;font-family:system-ui,sans-serif;">
          <p style="margin:0 0 2px;font-size:10px;font-weight:800;color:#3b82f6;text-transform:uppercase;letter-spacing:.06em;">Public Charger</p>
          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#fff;">${station.name}</p>
          <p style="margin:0;font-size:11px;color:#a1a1aa;">${station.address || ''}</p>
          ${station.power_kw ? `<div style="margin-top:10px;"><span style="background:#27272a;color:#3b82f6;padding:4px 10px;border-radius:8px;font-size:10px;font-weight:700;">${station.power_kw} kW</span></div>` : ''}
        </div>
      `, { className: 'clean-popup', maxWidth: 260 })
      .addTo(map).openPopup();

    const userIcon = L.divIcon({
      className: '', html: `<div class="cs-pub-dot"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9],
    });

    if (userLocation) {
      const coords: [number, number] = [userLocation.lat, userLocation.lng];
      userMarkerRef.current = L.marker(coords, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      map.fitBounds(L.latLngBounds([coords, dest]), { padding: [80, 80], animate: true });
    }

    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker(coords, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
          map.fitBounds(L.latLngBounds([coords, dest]), { padding: [80, 80], animate: true });
        } else {
          userMarkerRef.current.setLatLng(coords);
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
    };
  }, []); // eslint-disable-line

  const reCentre = () => {
    if (!mapRef.current) return;
    const bounds = userPos ? L.latLngBounds([userPos, dest]) : L.latLngBounds([dest, dest]);
    mapRef.current.fitBounds(bounds, { padding: [80, 80], animate: true });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {mapRef.current && userPos && (
        <RoutingControl start={userPos} end={dest} map={mapRef.current} />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)', paddingBottom: '40px' }}>
        <div className="flex flex-col items-center pt-10 gap-2 px-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 backdrop-blur-md px-4 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
            </span>
            <span className="text-blue-300 text-[10px] font-black uppercase tracking-widest">Public Charger · Free to Use</span>
          </div>
          <h1 className="text-white text-lg font-black italic uppercase tracking-tighter text-center drop-shadow-lg">{station.name}</h1>
          {station.address && <p className="text-zinc-400 text-[10px] font-bold drop-shadow text-center">{station.address}</p>}
        </div>
      </div>

      {/* Re-centre */}
      <button onClick={reCentre}
        className="absolute right-4 z-[500] w-11 h-11 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-full flex items-center justify-center text-blue-400 shadow-xl active:scale-95 transition-all"
        style={{ bottom: '180px' }}>
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
              { label: 'Type', value: 'Public' },
              { label: 'Power', value: station.power_kw ? `${station.power_kw} kW` : '—' },
              { label: 'Cost', value: station.price_per_kwh ? `₹${station.price_per_kwh}/kWh` : 'Free' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-zinc-900/80 backdrop-blur border border-zinc-800/80 rounded-2xl p-3 text-center">
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1">{label}</p>
                <p className="text-white text-[11px] font-black italic">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-zinc-500 text-[9px] font-bold text-center">
            Public station — no booking required. Just show up and plug in.
          </p>
          <button onClick={onClose}
            className="w-full py-5 bg-zinc-800 text-white font-black uppercase text-xs tracking-widest rounded-[24px] active:scale-95 transition-all border border-zinc-700">
            ← Back to Stations
          </button>
        </div>
      </div>
    </div>
  );
}