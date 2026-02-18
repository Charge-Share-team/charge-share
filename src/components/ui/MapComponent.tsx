"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { createClient } from '@/utils/supabase/client';
import PaymentModal from '@/components/PaymentModal';

// Helper to update map view when position changes
function RecenterMap({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(pos);
  }, [pos, map]);
  return null;
}

export default function MapComponent() {
  const router = useRouter();
  const supabase = createClient();
  const [chargers, setChargers] = useState<any[]>([]);
  const [pos, setPos] = useState<[number, number]>([30.7333, 76.7794]); 
  const [showPayment, setShowPayment] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);

  // Define icons INSIDE the component to avoid "window is not defined" during build
  const iconPrivate = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41],
  });

  const iconPublic = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41],
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (p) => {
        const userPos: [number, number] = [p.coords.latitude, p.coords.longitude];
        setPos(userPos);
        
        const { data } = await supabase.rpc('nearby_chargers', {
          user_lat: userPos[0],
          user_long: userPos[1],
          radius_meters: 25000
        });
        if (data) setChargers(data);
      });
    }
  }, [supabase]);

  const handleBookClick = (station: any) => {
    setSelectedStation(station);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    const rate = selectedStation?.price_per_kwh || 12;
    localStorage.setItem('chargingStatus', 'CHARGING');
    localStorage.setItem('currentStationName', selectedStation.name);
    localStorage.setItem('currentStationRate', rate.toString());
    localStorage.setItem('batteryLevel', '21'); 
    localStorage.setItem('liveKwh', '0.0');
    router.push('/');
  };

  return (
    <div className="h-full w-full relative">
      {showPayment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <PaymentModal 
             amount="11" 
             onSuccess={handlePaymentSuccess} 
             onClose={() => setShowPayment(false)}
           />
        </div>
      )}

      <MapContainer center={pos} zoom={12} className="h-full w-full">
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <RecenterMap pos={pos} />
        
        {chargers.map((charger) => (
          <Marker 
            key={charger.id} 
            position={[charger.latitude, charger.longitude]} 
            icon={charger.is_public ? iconPublic : iconPrivate}
          >
            <Popup>
              <div className="p-2 text-black min-w-[150px]">
                <h3 className="font-bold text-sm uppercase italic">{charger.name}</h3>
                <p className="text-[10px] text-zinc-500 mb-2">{charger.charger_type} • ₹{charger.price_per_kwh}/kWh</p>
                <button 
                  onClick={() => handleBookClick(charger)} 
                  className="w-full bg-emerald-500 text-black py-2 rounded-lg text-[9px] font-black uppercase"
                >
                  Book Station
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}