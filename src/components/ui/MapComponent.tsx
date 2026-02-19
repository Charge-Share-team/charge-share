"use client";
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Standard Leaflet Icons (Ensures visibility)
const blueIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Pulsating User Icon
const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="pulse"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const RoutingControl = dynamic(() => import("./RoutingControl"), { ssr: false });

export default function MapComponent() {
  const mapRef = useRef<L.Map | null>(null); // Ref to control map programmatically
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [chargers, setChargers] = useState<any[]>([]);

  // Function to set route and clear popup for the driver
  const handleNavigate = (coords: [number, number]) => {
    setDestination(coords);
    
    // Auto-close any open popups so the path is clear
    if (mapRef.current) {
      mapRef.current.closePopup();
    }
  };

  useEffect(() => {
    // Inject Pulse CSS
    const style = document.createElement('style');
    style.innerHTML = `
      .pulse { width: 15px; height: 15px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 0 rgba(59, 130, 246, 0.4); animation: pulse 2s infinite; border: 2px solid white; }
      @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
    `;
    document.head.appendChild(style);

    navigator.geolocation.getCurrentPosition((p) => {
      const uCoords: [number, number] = [p.coords.latitude, p.coords.longitude];
      setUserPos(uCoords);

      const fetchAll = async () => {
        try {
          const res = await fetch(`/api/chargers`);
          const result = await res.json();
          
          const local = (result.local || []).map((c: any) => ({ ...c, isLocal: true }));
          const external = (result.external || []).map((c: any) => ({ ...c, isLocal: false }));
          const combined = [...local, ...external];

          const processed = combined.map((c: any) => {
            const lat = parseFloat(c.latitude || c.Latitude || c.AddressInfo?.Latitude);
            const lng = parseFloat(c.longitude || c.Longitude || c.AddressInfo?.Longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            const dist = (L.latLng(uCoords).distanceTo(L.latLng(lat, lng)) / 1000).toFixed(1);

            return {
              ...c,
              lat, 
              lng,
              distance: dist,
              name: c.name || c.AddressInfo?.Title || "EV Station",
            };
          }).filter(Boolean);

          setChargers(processed);
        } catch (err) {
          console.error("API Fetch Error:", err);
        }
      };
      fetchAll();
    }, (err) => console.error("Geolocation Error:", err));
  }, []);

  return (
    <div className="h-screen w-full relative">
      <MapContainer 
        center={userPos || [30.7333, 76.7794]} 
        zoom={11} 
        className="h-full"
        ref={mapRef} // Set the reference here
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
        {userPos && <Marker position={userPos} icon={userIcon} />}
        {userPos && destination && <RoutingControl start={userPos} end={destination} />}

        {chargers.map((c, i) => (
          <Marker 
            key={`${c.id}-${i}`} 
            position={[c.lat, c.lng]} 
            icon={c.isLocal ? greenIcon : blueIcon} 
          >
            <Popup>
              <div className="text-black">
                <p className="font-bold">{c.name}</p>
                <p className="text-emerald-600 font-bold">{c.distance} KM away</p>
                <button 
                  onClick={() => handleNavigate([c.lat, c.lng])} // Call the cleaner handler
                  className="mt-2 bg-emerald-500 text-white px-4 py-1 rounded w-full font-bold uppercase text-[10px]"
                >
                  Book & Navigate
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}