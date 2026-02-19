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

useEffect(() => {
  if (!map || !start || !end) return;

  const routingControl = L.Routing.control({
    waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
    lineOptions: {
      styles: [{ color: "#10b981", weight: 6, opacity: 0.8 }],
      extendToWaypoints: true,
      missingRouteTolerance: 10
    },
    show: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
  });

  // Safely add to map
  routingControl.addTo(map);

return () => {
    // Check if the control and map still exist before trying to remove
    if (map && routingControl) {
      try {
        // Use removeControl instead of removeLayer for L.Routing
        map.removeControl(routingControl);
      } catch (e) {
        console.warn("Routing cleanup bypassed safely");
      }
    }
  };
}, [map, start, end]);

  return null;
}