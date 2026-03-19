"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useCallback } from "react";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import { useUIStore } from "@/lib/stores/ui-store";
import type { WasteBin } from "@/types";

function getFillColor(fill: number): string {
  if (fill < 25) return "#22c55e";
  if (fill < 50) return "#eab308";
  if (fill < 75) return "#f97316";
  return "#ef4444";
}

function createBinIcon(bin: WasteBin): L.DivIcon {
  const color = getFillColor(bin.current_fill_percent);
  const isCritical = bin.current_fill_percent >= 80;
  const pulseClass = isCritical ? "pulse-critical" : "";

  return L.divIcon({
    className: "custom-bin-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
    html: `
      <div class="${pulseClass}" style="
        width: 36px; height: 36px; border-radius: 50%;
        background: ${color}20; border: 2px solid ${color};
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; font-weight: 700; color: ${color};
        cursor: pointer; transition: transform 0.2s;
      ">
        ${Math.round(bin.current_fill_percent)}%
      </div>
    `,
  });
}

function getPopupContent(bin: WasteBin): string {
  const typeLabels: Record<string, string> = {
    general: "Genel",
    recyclable: "Geri Donusum",
    organic: "Organik",
    hazardous: "Tehlikeli",
  };
  const statusLabels: Record<string, string> = {
    normal: "Normal",
    warning: "Uyari",
    critical: "Kritik",
    collecting: "Toplanıyor",
    offline: "Cevrimdisi",
  };

  return `
    <div style="font-family: system-ui; min-width: 180px;">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #e2e8f0;">${bin.name}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
        <span style="color: #94a3b8;">Doluluk:</span>
        <span style="color: ${getFillColor(bin.current_fill_percent)}; font-weight: 600;">${bin.current_fill_percent.toFixed(1)}%</span>
        <span style="color: #94a3b8;">Sicaklik:</span>
        <span style="color: #e2e8f0;">${bin.temperature.toFixed(1)}°C</span>
        <span style="color: #94a3b8;">Batarya:</span>
        <span style="color: #e2e8f0;">${bin.battery_level.toFixed(0)}%</span>
        <span style="color: #94a3b8;">Tip:</span>
        <span style="color: #e2e8f0;">${typeLabels[bin.waste_type] || bin.waste_type}</span>
        <span style="color: #94a3b8;">Durum:</span>
        <span style="color: #e2e8f0;">${statusLabels[bin.status] || bin.status}</span>
        <span style="color: #94a3b8;">Bolge:</span>
        <span style="color: #e2e8f0; text-transform: capitalize;">${bin.zone}</span>
      </div>
    </div>
  `;
}

interface MapInnerProps {
  routePoints?: { latitude: number; longitude: number }[];
}

export default function MapInner({ routePoints }: MapInnerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const routeLineRef = useRef<L.Polyline | null>(null);

  const bins = useSimulationStore((s) => s.bins);
  const selectBin = useUIStore((s) => s.selectBin);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -1,
      maxZoom: 3,
      zoomControl: true,
      attributionControl: false,
    });

    const bounds: L.LatLngBoundsExpression = [
      [0, 0],
      [700, 1000],
    ];
    L.imageOverlay("/campus/campus-map.svg", bounds).addTo(map);
    map.fitBounds(bounds);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Update markers when bins change
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || bins.length === 0) return;

    for (const bin of bins) {
      const existing = markersRef.current.get(bin.id);

      if (existing) {
        existing.setIcon(createBinIcon(bin));
        existing.setPopupContent(getPopupContent(bin));
      } else {
        const marker = L.marker([bin.latitude, bin.longitude], {
          icon: createBinIcon(bin),
        })
          .addTo(map)
          .bindPopup(getPopupContent(bin), {
            className: "dark-popup",
            maxWidth: 250,
          });

        marker.on("click", () => selectBin(bin.id));
        markersRef.current.set(bin.id, marker);
      }
    }
  }, [bins, selectBin]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Draw route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (routePoints && routePoints.length > 1) {
      const latlngs = routePoints.map(
        (p) => L.latLng(p.latitude, p.longitude) as L.LatLng
      );

      routeLineRef.current = L.polyline(latlngs, {
        color: "#a3e635",
        weight: 3,
        opacity: 0.8,
        dashArray: "8, 8",
      }).addTo(map);
    }
  }, [routePoints]);

  return (
    <>
      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .dark-popup .leaflet-popup-tip {
          background: #1e293b;
          border: 1px solid #334155;
        }
        .dark-popup .leaflet-popup-close-button {
          color: #94a3b8;
        }
        .custom-bin-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full rounded-xl" />
    </>
  );
}
