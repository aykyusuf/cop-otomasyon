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

function createBinIcon(bin: WasteBin, collected?: boolean): L.DivIcon {
  if (collected) {
    return L.divIcon({
      className: "custom-bin-marker",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
      html: `
        <div class="bin-collected" style="
          width: 36px; height: 36px; border-radius: 50%;
          background: #22c55e30; border: 2px solid #22c55e;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #22c55e;
          cursor: pointer;
        ">
          ✓
        </div>
      `,
    });
  }

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
    recyclable: "Geri Dönüşüm",
    organic: "Organik",
    hazardous: "Tehlikeli",
  };
  const statusLabels: Record<string, string> = {
    normal: "Normal",
    warning: "Uyarı",
    critical: "Kritik",
    collecting: "Toplanıyor",
    offline: "Çevrimdışı",
  };

  return `
    <div style="font-family: system-ui; min-width: 180px;">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #e2e8f0;">${bin.name}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
        <span style="color: #94a3b8;">Doluluk:</span>
        <span style="color: ${getFillColor(bin.current_fill_percent)}; font-weight: 600;">${bin.current_fill_percent.toFixed(1)}%</span>
        <span style="color: #94a3b8;">Sıcaklık:</span>
        <span style="color: #e2e8f0;">${bin.temperature.toFixed(1)}°C</span>
        <span style="color: #94a3b8;">Batarya:</span>
        <span style="color: #e2e8f0;">${bin.battery_level.toFixed(0)}%</span>
        <span style="color: #94a3b8;">Tip:</span>
        <span style="color: #e2e8f0;">${typeLabels[bin.waste_type] || bin.waste_type}</span>
        <span style="color: #94a3b8;">Durum:</span>
        <span style="color: #e2e8f0;">${statusLabels[bin.status] || bin.status}</span>
        <span style="color: #94a3b8;">Bölge:</span>
        <span style="color: #e2e8f0; text-transform: capitalize;">${bin.zone}</span>
      </div>
    </div>
  `;
}

interface MapInnerProps {
  routePoints?: { latitude: number; longitude: number }[];
  collectingIndex?: number;
  collectedBinIds?: Set<number>;
}

export default function MapInner({ routePoints, collectingIndex, collectedBinIds }: MapInnerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const routeLineRef = useRef<L.Polyline | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const completedLineRef = useRef<L.Polyline | null>(null);
  const animFrameRef = useRef<number | null>(null);

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
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      vehicleMarkerRef.current = null;
      completedLineRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  // Update markers when bins change
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || bins.length === 0) return;

    for (const bin of bins) {
      const isCollected = collectedBinIds?.has(bin.id) ?? false;
      const existing = markersRef.current.get(bin.id);

      if (existing) {
        existing.setIcon(createBinIcon(bin, isCollected));
        existing.setPopupContent(getPopupContent(bin));
      } else {
        const marker = L.marker([bin.latitude, bin.longitude], {
          icon: createBinIcon(bin, isCollected),
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
  }, [bins, selectBin, collectedBinIds]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Draw route (when not collecting)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Skip route drawing if collecting — handled by collection effect
    if (collectingIndex !== undefined && collectingIndex >= 0) return;

    // Clean up collection visuals
    if (completedLineRef.current) {
      map.removeLayer(completedLineRef.current);
      completedLineRef.current = null;
    }
    if (vehicleMarkerRef.current) {
      map.removeLayer(vehicleMarkerRef.current);
      vehicleMarkerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

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
  }, [routePoints, collectingIndex]);

  // Collection animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routePoints || routePoints.length < 2) return;
    if (collectingIndex === undefined || collectingIndex < 0) return;

    // Create vehicle marker if not exists
    if (!vehicleMarkerRef.current) {
      const vehicleIcon = L.divIcon({
        className: "custom-vehicle-marker",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        html: `<div class="collection-vehicle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
            <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-1"/>
            <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
          </svg>
        </div>`,
      });
      vehicleMarkerRef.current = L.marker(
        [routePoints[0].latitude, routePoints[0].longitude],
        { icon: vehicleIcon, zIndexOffset: 1000 }
      ).addTo(map);

      // Fit map to show full route so user sees the vehicle start from depot
      const routeBounds = L.latLngBounds(
        routePoints.map((p) => L.latLng(p.latitude, p.longitude))
      );
      map.fitBounds(routeBounds.pad(0.1), { animate: true, duration: 0.5 });
    }

    // Animate vehicle movement
    const fromIdx = Math.max(0, collectingIndex - 1);
    const toIdx = Math.min(collectingIndex, routePoints.length - 1);
    const from = routePoints[fromIdx];
    const to = routePoints[toIdx];

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const duration = 650;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out

      const lat = from.latitude + (to.latitude - from.latitude) * eased;
      const lng = from.longitude + (to.longitude - from.longitude) * eased;
      vehicleMarkerRef.current?.setLatLng([lat, lng]);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);

    // Update route split: completed (solid) vs remaining (dashed)
    const splitIdx = Math.min(collectingIndex, routePoints.length - 1);
    const completedPts = routePoints.slice(0, splitIdx + 1).map(
      (p) => L.latLng(p.latitude, p.longitude) as L.LatLng
    );
    const remainingPts = routePoints.slice(splitIdx).map(
      (p) => L.latLng(p.latitude, p.longitude) as L.LatLng
    );

    // Completed line (solid green)
    if (completedPts.length > 1) {
      if (completedLineRef.current) {
        completedLineRef.current.setLatLngs(completedPts);
      } else {
        completedLineRef.current = L.polyline(completedPts, {
          color: "#22c55e",
          weight: 5,
          opacity: 0.9,
        }).addTo(map);
      }
    }

    // Remaining line (dim dashed)
    if (remainingPts.length > 1) {
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(remainingPts);
        routeLineRef.current.setStyle({
          color: "#a3e635",
          weight: 2,
          opacity: 0.4,
          dashArray: "8, 8",
        });
      } else {
        routeLineRef.current = L.polyline(remainingPts, {
          color: "#a3e635",
          weight: 2,
          opacity: 0.4,
          dashArray: "8, 8",
        }).addTo(map);
      }
    } else if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [collectingIndex, routePoints]);

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
        .custom-vehicle-marker {
          background: transparent !important;
          border: none !important;
        }
        .collection-vehicle {
          width: 36px; height: 36px; border-radius: 50%;
          background: #22c55e; border: 3px solid #fff;
          display: flex; align-items: center; justify-content: center;
          animation: vehicle-pulse 1.5s ease-in-out infinite;
          box-shadow: 0 2px 12px rgba(34,197,94,0.5);
        }
        .bin-collected {
          animation: bin-collected-pop 0.4s ease-out, collected-ring 0.6s ease-out;
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full rounded-xl" />
    </>
  );
}
