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

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="pulse"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface MapComponentProps {
  setMapInstance?: (map: L.Map) => void;
  destination: [number, number] | null;
  setDestination: (coords: [number, number] | null) => void;
}

export default function MapComponent({ setMapInstance, destination, setDestination }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const clusterGroupRef = useRef<any>(null);
  
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [chargers, setChargers] = useState<any[]>([]);

  const handleRecenter = () => {
    if (mapRef.current && userPos) {
      mapRef.current.flyTo(userPos, 15, { animate: true, duration: 1.5 });
    } else if (mapRef.current) {
      mapRef.current.locate({ setView: true, maxZoom: 15 });
    }
  };

  useEffect(() => {
    const initMap = async () => {
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
        maxZoom: 18
      }).addTo(map);

      mapRef.current = map;
      if (setMapInstance) setMapInstance(map);

      // Injecting the pulse CSS
      if (!document.getElementById('map-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'map-pulse-style';
        style.innerHTML = `
          .pulse { width: 15px; height: 15px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 0 rgba(59, 130, 246, 0.4); animation: pulse 2s infinite; border: 2px solid white; }
          @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
        `;
        document.head.appendChild(style);
      }

      try {
        await import('leaflet.markercluster');
        const clusterGroup = (L as any).markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true
        });
        clusterGroupRef.current = clusterGroup;

        map.whenReady(() => {
          setTimeout(() => {
            if (mapRef.current && clusterGroupRef.current) {
              mapRef.current.addLayer(clusterGroupRef.current);
            }
          }, 100); 
        });
      } catch (err) {
        console.error("Cluster Load Error:", err);
      }
    };

    initMap();

    const watchId = navigator.geolocation.watchPosition((p) => {
      const coords: [number, number] = [p.coords.latitude, p.coords.longitude];
      setUserPos(coords);
      if (mapRef.current) {
        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker(coords, { icon: userIcon }).addTo(mapRef.current);
        } else {
          userMarkerRef.current.setLatLng(coords);
        }
      }
    }, (err) => console.warn("Location blocked"), { enableHighAccuracy: true });

    fetch(`/api/chargers`)
      .then(res => res.json())
      .then(result => {
        const all = [...(result.local || []), ...(result.external || [])];
        const processed = all.map((c: any) => {
          const lat = parseFloat(c.latitude || c.Latitude || c.AddressInfo?.Latitude);
          const lng = parseFloat(c.longitude || c.Longitude || c.AddressInfo?.Longitude);
          return isNaN(lat) || isNaN(lng) ? null : { ...c, lat, lng, name: c.name || c.AddressInfo?.Title };
        }).filter(Boolean);
        setChargers(processed);
      });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [setMapInstance]);

  useEffect(() => {
    if (!clusterGroupRef.current || !mapRef.current || chargers.length === 0) return;
    clusterGroupRef.current.clearLayers();
    chargers.forEach((c) => {
      const marker = L.marker([c.lat, c.lng], { icon: greenIcon })
        .bindPopup(`
          <div style="color:black; padding:8px; min-width:180px;">
            <b style="font-size:14px;">${c.name || 'EV Station'}</b>
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
              <button onclick="window.dispatchEvent(new CustomEvent('nav-only', {detail: [${c.lat}, ${c.lng}]}))" 
                style="background:#27272a; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-size:11px;">
                🗺️ NAVIGATE
              </button>
              <button onclick="window.dispatchEvent(new CustomEvent('book-nav', {detail: [${c.lat}, ${c.lng}]}))" 
                style="background:#10b981; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:11px;">
                ⚡ BOOK (₹11)
              </button>
            </div>
          </div>
        `);
      clusterGroupRef.current.addLayer(marker);
    });

    const handleNav = (e: any) => { setDestination(e.detail); mapRef.current?.closePopup(); };
    window.addEventListener('nav-only', handleNav);
    window.addEventListener('book-nav', handleNav);
    return () => {
      window.removeEventListener('nav-only', handleNav);
      window.removeEventListener('book-nav', handleNav);
    };
  }, [chargers, setDestination]);

  return (
    <div className="h-full w-full relative bg-zinc-950 overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* Primary Re-center Button */}
      <button 
        onClick={handleRecenter}
        className="absolute bottom-24 right-4 z-[1000] p-3 bg-zinc-900 border border-zinc-800 rounded-full text-blue-500 shadow-lg hover:bg-zinc-800 active:scale-95 transition-all"
        title="Recenter Map"
      >
        <Target size={24} />
      </button>

      {userPos && destination && mapRef.current && (
        <RoutingControl start={userPos} end={destination} map={mapRef.current} />
      )}
    </div>
  );
}