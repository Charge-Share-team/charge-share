"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

interface RoutingProps {
  start: [number, number];
  end: [number, number];
  map: L.Map;
}

export default function RoutingControl({ start, end, map }: RoutingProps) {
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    const safeRemove = (control: any) => {
      if (!control) return;
      
      try {
        // 1. Manually hide/clear the lines to stop internal update loops
        if (control.getPlan()) {
          control.setWaypoints([]);
        }

        // 2. Only remove if the map still has a reference to this control
        if (control._map && map) {
          map.removeControl(control);
        }
      } catch (e) {
        // Silently catch the 'removeLayer' error if Leaflet beats us to the cleanup
        console.debug("Routing cleanup: safe exit.");
      }
    };

    // Cleanup old instance before starting new one
    safeRemove(routingControlRef.current);

    const control = (L as any).Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      lineOptions: {
        styles: [{ color: "#10b981", weight: 6, opacity: 0.8 }]
      },
      show: false, 
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      draggableWaypoints: false
    }).addTo(map);

    routingControlRef.current = control;

    return () => {
      if (routingControlRef.current) {
        safeRemove(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, start, end]);

  return null; 
}