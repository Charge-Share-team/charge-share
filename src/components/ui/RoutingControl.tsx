"use client";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useMap } from "react-leaflet";

interface RoutingProps {
  start: [number, number];
  end: [number, number];
}

export default function RoutingControl({ start, end }: RoutingProps) {
  const map = useMap();

  // Inside src/components/ui/RoutingControl.tsx

  useEffect(() => {
    if (!map || !start || !end) return;

    // Use 'any' type cast if the leaflet-routing-machine types are being stubborn
    const routingControl = (L as any).Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      lineOptions: {
        styles: [{ color: "#10b981", weight: 6, opacity: 0.8 }],
      },
      show: false,
      addWaypoints: false,
      draggable: false, // ✅ FIXED: Changed from draggableWaypoints
      fitSelectedRoutes: true,
    });

    routingControl.addTo(map);

    return () => {
      // Safety check to prevent the "removeLayer of null" error
      if (map && routingControl) {
        try {
          map.removeControl(routingControl);
        } catch (e) {
          console.warn("Cleanup handled:", e);
        }
      }
    };
  }, [map, start, end]);

  return null;
}