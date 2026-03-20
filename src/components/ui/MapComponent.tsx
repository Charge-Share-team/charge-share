"use client";
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { Target } from 'lucide-react';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// @ts-ignore
declare module 'leaflet.markercluster';

const RoutingControl = dynamic(() => import("./RoutingControl"), { ssr: false });

const SHADOW = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: SHADOW, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const blueIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: SHADOW, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="pulse"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10],
});

interface MapComponentProps {
  setMapInstance?: (map: L.Map) => void;
  destination: [number, number] | null;
  setDestination: (coords: [number, number] | null) => void;
}

// Process raw API response into renderable charger objects
function processChargers(local: any[], external: any[]) {
  return [...local.map(c => ({ ...c, source: 'db' })), ...external.map(c => ({ ...c, source: 'api' }))]
    .map((c: any) => {
      const clat = typeof c.latitude === 'number' ? c.latitude : parseFloat(c.latitude ?? c.AddressInfo?.Latitude ?? '');
      const clng = typeof c.longitude === 'number' ? c.longitude : parseFloat(c.longitude ?? c.AddressInfo?.Longitude ?? '');
      if (isNaN(clat) || isNaN(clng)) return null;
      return {
        ...c,
        lat: clat,
        lng: clng,
        name: c.name ?? c.AddressInfo?.Title ?? 'EV Station',
        address: c.address ?? c.AddressInfo?.Town ?? c.AddressInfo?.AddressLine1 ?? 'India',
        price_per_kwh: c.price_per_kwh ?? null,
        power_kw: c.power_kw ?? c.Connections?.[0]?.PowerKW ?? null,
      };
    })
    .filter(Boolean) as any[];
}

export default function MapComponent({ setMapInstance, destination, setDestination }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const cgRef           = useRef<any>(null);   // cluster group
  const userMarkerRef   = useRef<L.Marker | null>(null);
  const countBadgeRef   = useRef<HTMLDivElement>(null);
  const didFlyToUser    = useRef(false);
  const lastFetchRef    = useRef<[number, number] | null>(null);

  const metres = (a: [number, number], b: [number, number]) => {
    const R = 6371000, d2r = Math.PI / 180;
    const dLat = (b[0] - a[0]) * d2r, dLng = (b[1] - a[1]) * d2r;
    const sin2 = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * d2r) * Math.cos(b[0] * d2r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(sin2));
  };

  // Directly renders markers into cluster group — no React state involved
  const renderMarkers = (chargers: any[]) => {
    const cg = cgRef.current;
    if (!cg) return;
    cg.clearLayers();

    chargers.forEach((c) => {
      const icon  = c.source === 'db' ? greenIcon : blueIcon;
      const badge = c.source === 'db' ? '#10b981' : '#3b82f6';
      const label = c.source === 'db' ? '● P2P Station' : '● Public Station';
      const price = c.price_per_kwh ? `₹${c.price_per_kwh}/kWh` : 'See operator';
      const power = c.power_kw ? `${c.power_kw} kW` : 'Fast Charging';

      L.marker([c.lat, c.lng], { icon })
        .bindPopup(`
          <div style="background:#18181b;color:#fff;padding:14px;border-radius:16px;min-width:230px;font-family:system-ui,sans-serif;">
            <span style="font-size:10px;font-weight:800;color:${badge};text-transform:uppercase;letter-spacing:.05em;">${label}</span>
            <h3 style="margin:6px 0 2px;font-size:15px;font-weight:700;">${c.name}</h3>
            <p style="margin:0 0 12px;font-size:11px;color:#a1a1aa;">${power} • ${c.address}</p>
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
        `, { className: 'clean-popup', maxWidth: 300, minWidth: 230 })
        .addTo(cg);
    });

    // Update count badge directly via DOM ref — no React re-render needed
    if (countBadgeRef.current) {
      countBadgeRef.current.textContent = `${chargers.length} Stations`;
      countBadgeRef.current.style.display = chargers.length > 0 ? 'block' : 'none';
    }
  };

  const fetchAndRender = async (lat: number, lng: number, radius = 500) => {
    try {
      const res    = await fetch(`/api/chargers?lat=${lat}&lng=${lng}&radius=${radius}`);
      const result = await res.json();
      const chargers = processChargers(result.local ?? [], result.external ?? []);
      renderMarkers(chargers);
    } catch (e) {
      console.error('fetchChargers error:', e);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // ── 1. Create map ──────────────────────────────────────────────────
    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      maxZoom: 18,
      minZoom: 3,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO', maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;
    if (setMapInstance) setMapInstance(map);

    // ── 2. CSS ─────────────────────────────────────────────────────────
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

    // ── 3. Load markercluster + fetch chargers together ────────────────
    // Key insight: add cluster group BEFORE fetching data.
    // markercluster's onAdd only needs the map container to exist — 
    // it doesn't call getBounds until markers are actually added.
    // So add the empty cluster group now, then add markers later.
    import('leaflet.markercluster').then(() => {
      const cg = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        chunkedLoading: true,
        iconCreateFunction: (cluster: any) => L.divIcon({
          html: `<div class="cs-cluster"><span>${cluster.getChildCount()}</span></div>`,
          className: 'marker-cluster-custom',
          iconSize: L.point(40, 40),
        }),
      });

      cgRef.current = cg;

      // Try adding immediately; if map panes aren't ready yet, retry after 500ms
      const tryAddLayer = () => {
        try {
          map.addLayer(cg);
          fetchAndRender(20.5937, 78.9629, 500);
        } catch {
          setTimeout(() => {
            if (mapRef.current) {
              try { map.addLayer(cg); } catch {}
              fetchAndRender(20.5937, 78.9629, 500);
            }
          }, 500);
        }
      };
      tryAddLayer();
    });

    // ── 4. Geolocation ─────────────────────────────────────────────────
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];

        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker(coords, { icon: userIcon }).addTo(map);
        } else {
          userMarkerRef.current.setLatLng(coords);
        }

        if (!didFlyToUser.current) {
          didFlyToUser.current = true;
          map.flyTo(coords, 13, { animate: true, duration: 1.5 });
          // Re-fetch centred on user
          fetchAndRender(coords[0], coords[1], 500);
        }

        if (!lastFetchRef.current || metres(lastFetchRef.current, coords) > 5000) {
          lastFetchRef.current = coords;
          fetchAndRender(coords[0], coords[1], 500);
        }
      },
      (err) => console.warn('GPS:', err.message),
      { enableHighAccuracy: true }
    );

    // ── 5. Custom map events ───────────────────────────────────────────
    const onNav  = (e: any) => { setDestination([e.detail.lat, e.detail.lng]); map.closePopup(); };
    const onBook = (e: any) => { setDestination([e.detail.lat, e.detail.lng]); map.closePopup(); };
    window.addEventListener('cs-nav',  onNav);
    window.addEventListener('cs-book', onBook);

    return () => {
      navigator.geolocation.clearWatch(wid);
      window.removeEventListener('cs-nav',  onNav);
      window.removeEventListener('cs-book', onBook);
      map.remove();
      mapRef.current = null;
      cgRef.current  = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 bg-zinc-950">
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Count badge — updated via DOM ref, not React state */}
      <div
        ref={countBadgeRef}
        style={{ display: 'none' }}
        className="absolute top-20 right-3 z-[400] bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl px-3 py-1.5 pointer-events-none text-emerald-400 text-[10px] font-black uppercase tracking-wider"
      />

      <button
        onClick={() => { if (mapRef.current && userMarkerRef.current) mapRef.current.flyTo(userMarkerRef.current.getLatLng(), 15); }}
        className="absolute bottom-20 right-3 z-[400] p-3 bg-zinc-900 border border-zinc-800 rounded-full text-blue-400 shadow-lg hover:bg-zinc-800 active:scale-95 transition-all"
        title="My Location"
      >
        <Target size={22} />
      </button>

      {mapRef.current && destination && userMarkerRef.current && (
        <RoutingControl
          start={[userMarkerRef.current.getLatLng().lat, userMarkerRef.current.getLatLng().lng]}
          end={destination}
          map={mapRef.current}
        />
      )}
    </div>
  );
}