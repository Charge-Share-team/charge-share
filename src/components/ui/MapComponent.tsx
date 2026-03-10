"use client";
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { Target } from 'lucide-react';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// @ts-ignore
declare module 'leaflet.markercluster';

const RoutingControl = dynamic(() => import("./RoutingControl"), { ssr: false });

// ── Marker icons using unpkg (reliable, no 404) ──
const SHADOW = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: SHADOW,
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor:[1, -34],
});

const blueIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: SHADOW,
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor:[1, -34],
});

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="pulse"></div>`,
  iconSize:   [20, 20],
  iconAnchor: [10, 10],
});

interface MapComponentProps {
  setMapInstance?: (map: L.Map) => void;
  destination: [number, number] | null;
  setDestination: (coords: [number, number] | null) => void;
}

export default function MapComponent({ setMapInstance, destination, setDestination }: MapComponentProps) {
  const mapContainerRef  = useRef<HTMLDivElement>(null);
  const mapRef           = useRef<L.Map | null>(null);
  const userMarkerRef    = useRef<L.Marker | null>(null);
  const clusterGroupRef  = useRef<any>(null);
  const didFlyToUser     = useRef(false);
  const lastFetchLatLng  = useRef<[number, number] | null>(null);

  const [userPos,  setUserPos]  = useState<[number, number] | null>(null);
  const [chargers, setChargers] = useState<any[]>([]);
  const [count,    setCount]    = useState(0);

  // ── Haversine distance in metres ──
  const metres = (a: [number,number], b: [number,number]) => {
    const R = 6371000, d2r = Math.PI/180;
    const dLat = (b[0]-a[0])*d2r, dLng = (b[1]-a[1])*d2r;
    const sin2 = Math.sin(dLat/2)**2 + Math.cos(a[0]*d2r)*Math.cos(b[0]*d2r)*Math.sin(dLng/2)**2;
    return 2*R*Math.asin(Math.sqrt(sin2));
  };

  const fetchChargers = async (lat: number, lng: number) => {
    try {
      const res    = await fetch(`/api/chargers?lat=${lat}&lng=${lng}&radius=25`);
      const result = await res.json();

      const local    = (result.local    ?? []).map((c: any) => ({ ...c, source: 'db'  }));
      const external = (result.external ?? []).map((c: any) => ({ ...c, source: 'api' }));

      const processed = [...local, ...external].map((c: any) => {
        const clat = parseFloat(c.latitude  ?? c.AddressInfo?.Latitude  ?? '');
        const clng = parseFloat(c.longitude ?? c.AddressInfo?.Longitude ?? '');
        if (isNaN(clat) || isNaN(clng)) return null;
        return { ...c, lat: clat, lng: clng, name: c.name ?? c.AddressInfo?.Title ?? 'EV Station' };
      }).filter(Boolean);

      setChargers(processed as any[]);
      setCount(processed.length);
    } catch (e) {
      console.error('fetchChargers error:', e);
    }
  };

  const handleRecenter = () => {
    if (mapRef.current && userPos) {
      mapRef.current.flyTo(userPos, 15, { animate: true, duration: 1.2 });
    }
  };

  // ── Init map ──
  useEffect(() => {
    const init = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [30.7333, 76.7794],
        zoom: 12,
        maxZoom: 18,
        minZoom: 3,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
      if (setMapInstance) setMapInstance(map);

      // Inject CSS once
      if (!document.getElementById('cs-map-styles')) {
        const s = document.createElement('style');
        s.id = 'cs-map-styles';
        s.textContent = `
          .pulse{width:15px;height:15px;background:#3b82f6;border-radius:50%;border:2px solid #fff;animation:cs-pulse 2s infinite;}
          @keyframes cs-pulse{0%{transform:scale(.95);box-shadow:0 0 0 0 rgba(59,130,246,.7);}70%{transform:scale(1);box-shadow:0 0 0 12px rgba(59,130,246,0);}100%{transform:scale(.95);box-shadow:0 0 0 0 rgba(59,130,246,0);}}
          .cs-cluster{width:36px;height:36px;background:rgba(16,185,129,.15);border:1.5px solid #10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;}
          .cs-cluster span{color:#10b981;font-size:11px;font-weight:800;}
          .marker-cluster-custom{background:transparent!important;border:none!important;}
          .clean-popup .leaflet-popup-content-wrapper{background:#18181b;border:1px solid #27272a;border-radius:16px;padding:0;box-shadow:0 10px 30px rgba(0,0,0,.6);}
          .clean-popup .leaflet-popup-tip{background:#18181b;}
          .clean-popup .leaflet-popup-content{margin:0;width:auto!important;}
        `;
        document.head.appendChild(s);
      }

      // Cluster group
      try {
        await import('leaflet.markercluster');
        const cg = (L as any).markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          iconCreateFunction: (cluster: any) => L.divIcon({
            html: `<div class="cs-cluster"><span>${cluster.getChildCount()}</span></div>`,
            className: 'marker-cluster-custom',
            iconSize: L.point(40, 40),
          }),
        });
        clusterGroupRef.current = cg;
        // Wait for map to be fully ready before adding layers
        map.whenReady(() => {
          if (mapRef.current && clusterGroupRef.current) {
            mapRef.current.addLayer(clusterGroupRef.current);
          }
        });
      } catch (e) {
        console.error('Cluster load error:', e);
      }
    };

    init();

    // Initial fetch at default centre
    fetchChargers(30.7333, 76.7794);

    // Geolocation watch
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);

        if (mapRef.current) {
          if (!userMarkerRef.current) {
            userMarkerRef.current = L.marker(coords, { icon: userIcon }).addTo(mapRef.current);
          } else {
            userMarkerRef.current.setLatLng(coords);
          }
          // Fly to user once on first lock
          if (!didFlyToUser.current) {
            didFlyToUser.current = true;
            mapRef.current.flyTo(coords, 14, { animate: true, duration: 1.5 });
          }
        }

        // Re-fetch only when moved > 300 m from last fetch origin
        if (!lastFetchLatLng.current || metres(lastFetchLatLng.current, coords) > 300) {
          lastFetchLatLng.current = coords;
          fetchChargers(coords[0], coords[1]);
        }
      },
      (err) => console.warn('Geolocation blocked:', err.message),
      { enableHighAccuracy: true }
    );

    return () => {
      navigator.geolocation.clearWatch(wid);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Add markers whenever chargers list updates ──
  useEffect(() => {
    if (!clusterGroupRef.current || chargers.length === 0) return;
    clusterGroupRef.current.clearLayers();

    chargers.forEach((c) => {
      const icon   = c.source === 'db' ? greenIcon : blueIcon;
      const badge  = c.source === 'db' ? '#10b981' : '#3b82f6';
      const label  = c.source === 'db' ? '● Verified Station' : '● External Station';
      const price  = c.price_per_kwh ? `₹${c.price_per_kwh}/kWh` : '₹11';
      const power  = c.power_kw ? `${c.power_kw} kW` : 'Fast Charging';
      const marker = L.marker([c.lat, c.lng], { icon });

      marker.bindPopup(`
        <div style="background:#18181b;color:#fff;padding:14px;border-radius:16px;min-width:230px;font-family:system-ui,sans-serif;">
          <span style="font-size:10px;font-weight:800;color:${badge};text-transform:uppercase;letter-spacing:.05em;">${label}</span>
          <h3 style="margin:6px 0 2px;font-size:15px;font-weight:700;">${c.name}</h3>
          <p style="margin:0 0 12px;font-size:11px;color:#a1a1aa;">${power} • ${c.address ?? 'India'}</p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button onclick="window.dispatchEvent(new CustomEvent('cs-nav',{detail:{lat:${c.lat},lng:${c.lng}}}))"
              style="width:100%;background:#27272a;color:#fff;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px;">
              🗺️ DIRECTIONS
            </button>
            <button onclick="window.dispatchEvent(new CustomEvent('cs-book',{detail:{lat:${c.lat},lng:${c.lng}}}))"
              style="width:100%;background:#10b981;color:#fff;border:none;padding:10px;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;">
              ⚡ BOOK SESSION (${price})
            </button>
          </div>
        </div>
      `, { className: 'clean-popup', maxWidth: 300, minWidth: 230 });

      clusterGroupRef.current.addLayer(marker);
    });

    const onNav  = (e: any) => { setDestination([e.detail.lat, e.detail.lng]); mapRef.current?.closePopup(); };
    const onBook = (e: any) => { setDestination([e.detail.lat, e.detail.lng]); mapRef.current?.closePopup(); };
    window.addEventListener('cs-nav',  onNav);
    window.addEventListener('cs-book', onBook);
    return () => {
      window.removeEventListener('cs-nav',  onNav);
      window.removeEventListener('cs-book', onBook);
    };
  }, [chargers, setDestination]);

  return (
    <div className="absolute inset-0 bg-zinc-950">
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Station count badge */}
      {count > 0 && (
        <div className="absolute top-20 right-3 z-[400] bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl px-3 py-1.5 pointer-events-none">
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">{count} Stations</p>
        </div>
      )}

      {/* Re-center */}
      <button
        onClick={handleRecenter}
        className="absolute bottom-20 right-3 z-[400] p-3 bg-zinc-900 border border-zinc-800 rounded-full text-blue-400 shadow-lg hover:bg-zinc-800 active:scale-95 transition-all"
        title="My Location"
      >
        <Target size={22} />
      </button>

      {userPos && destination && mapRef.current && (
        <RoutingControl start={userPos} end={destination} map={mapRef.current} />
      )}
    </div>
  );
}