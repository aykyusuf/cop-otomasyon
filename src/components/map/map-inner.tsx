"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useCallback } from "react";
import { useSimulationStore } from "@/lib/stores/simulation-store";
import { useUIStore } from "@/lib/stores/ui-store";
import type { WasteBin } from "@/types";
import {
  CAMPUS_MAP_ASSET,
  CAMPUS_MAP_BOUNDS,
  DEPOT_LABEL,
  DEPOT_POINT,
  WASTE_TYPE_LABELS,
  ZONE_CONFIG,
} from "@/lib/simulation/site-config";

function getFillColor(fill: number): string {
  if (fill < 25) return "#22c55e";
  if (fill < 50) return "#eab308";
  if (fill < 75) return "#f97316";
  return "#ef4444";
}

function createBinIcon(
  bin: WasteBin,
  collected?: boolean,
  selected?: boolean,
  collecting?: boolean,
  collectionProgress: number = 0
): L.DivIcon {
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
          font-size: 11px; font-weight: 700; color: #22c55e;
          cursor: pointer;
        ">
          OK
        </div>
      `,
    });
  }

  const color = getFillColor(bin.current_fill_percent);
  const isCritical = bin.current_fill_percent >= 80;
  const pulseClass = isCritical ? "pulse-critical" : "";
  const ring = selected
    ? "box-shadow: 0 0 0 4px rgba(255,255,255,0.9), 0 0 18px rgba(34,197,94,0.5); transform: scale(1.08);"
    : "";
  const collectingRing = collecting
    ? `background:
        conic-gradient(#22c55e ${Math.max(0, Math.min(100, collectionProgress))}%, rgba(34,197,94,0.14) 0);
       box-shadow: 0 0 0 4px rgba(34,197,94,0.18), 0 0 18px rgba(34,197,94,0.35);`
    : "";

  return L.divIcon({
    className: "custom-bin-marker",
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -20],
    html: `
      <div style="
        width: 46px; height: 46px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        ${collectingRing}
      ">
        <div class="${pulseClass}" style="
          width: 36px; height: 36px; border-radius: 50%;
          background: ${color}20; border: 2px solid ${color};
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: ${color};
          cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
          ${ring}
        ">
          ${Math.round(bin.current_fill_percent)}%
        </div>
      </div>
    `,
  });
}

function getPopupContent(bin: WasteBin): string {
  const statusLabels: Record<string, string> = {
    normal: "Normal",
    warning: "Uyari",
    critical: "Kritik",
    collecting: "Toplaniyor",
    offline: "Cevrimdisi",
  };

  return `
    <div style="font-family: system-ui; min-width: 180px;">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: #e2e8f0;">${bin.name}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
        <span style="color: #94a3b8;">Doluluk:</span>
        <span style="color: ${getFillColor(bin.current_fill_percent)}; font-weight: 600;">${bin.current_fill_percent.toFixed(1)}%</span>
        <span style="color: #94a3b8;">Sicaklik:</span>
        <span style="color: #e2e8f0;">${bin.temperature.toFixed(1)} C</span>
        <span style="color: #94a3b8;">Batarya:</span>
        <span style="color: #e2e8f0;">${bin.battery_level.toFixed(0)}%</span>
        <span style="color: #94a3b8;">Tip:</span>
        <span style="color: #e2e8f0;">${WASTE_TYPE_LABELS[bin.waste_type] || bin.waste_type}</span>
        <span style="color: #94a3b8;">Durum:</span>
        <span style="color: #e2e8f0;">${statusLabels[bin.status] || bin.status}</span>
        <span style="color: #94a3b8;">Bolge:</span>
        <span style="color: #e2e8f0;">${ZONE_CONFIG[bin.zone]?.label || bin.zone}</span>
      </div>
    </div>
  `;
}

interface MapInnerProps {
  routePoints?: { latitude: number; longitude: number }[];
  collectingIndex?: number;
  collectedBinIds?: Set<number>;
  collectingBinId?: number | null;
  collectionProgress?: number;
  waitingNode?: { latitude: number; longitude: number; label: string } | null;
  waitingNodeHint?: string | null;
}

export default function MapInner({
  routePoints,
  collectingIndex,
  collectedBinIds,
  collectingBinId,
  collectionProgress = 0,
  waitingNode,
  waitingNodeHint,
}: MapInnerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const routeLineRef = useRef<L.Polyline | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const completedLineRef = useRef<L.Polyline | null>(null);
  const waitingNodeMarkerRef = useRef<L.Marker | null>(null);
  const waitingZoneRef = useRef<L.CircleMarker | null>(null);
  const depotMarkerRef = useRef<L.Marker | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previousCollectingIndexRef = useRef<number | null>(null);
  const previousRouteKeyRef = useRef<string>("");

  const bins = useSimulationStore((s) => s.bins);
  const selectBin = useUIStore((s) => s.selectBin);
  const selectedBinId = useUIStore((s) => s.selectedBinId);

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

    L.imageOverlay(CAMPUS_MAP_ASSET, CAMPUS_MAP_BOUNDS).addTo(map);
    map.setMaxBounds(CAMPUS_MAP_BOUNDS);
    map.fitBounds(CAMPUS_MAP_BOUNDS);

    const depotIcon = L.divIcon({
      className: "custom-depot-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      html: `
        <div class="depot-marker">
          <span>D</span>
        </div>
      `,
    });

    depotMarkerRef.current = L.marker(
      [DEPOT_POINT.latitude, DEPOT_POINT.longitude],
      { icon: depotIcon, zIndexOffset: 850 }
    )
      .addTo(map)
      .bindPopup(
        `<div style="font-family: system-ui; font-size: 12px; min-width: 120px;">
          <div style="font-weight: 700; margin-bottom: 4px;">${DEPOT_LABEL}</div>
          <div style="color: #e2e8f0;">Toplama araci baslangic ve donus noktasi</div>
        </div>`,
        { className: "dark-popup", maxWidth: 220 }
      );

    mapRef.current = map;
    const markers = markersRef.current;
    let isDisposed = false;
    let resizeFrame: number | null = null;

    const safelyInvalidateSize = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        if (isDisposed || !mapRef.current) return;
        if (!map.getContainer().isConnected) return;
        if (!map.getPane("mapPane")) return;

        try {
          map.invalidateSize({ pan: false });
        } catch {
          // Leaflet can throw during fast route/sidebar transitions before panes settle.
        }
      });
    };

    const resizeObserver = new ResizeObserver(safelyInvalidateSize);
    map.whenReady(() => {
      if (!isDisposed && containerRef.current) {
        resizeObserver.observe(containerRef.current);
        safelyInvalidateSize();
      }
    });

    return () => {
      isDisposed = true;
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markers.clear();
      vehicleMarkerRef.current = null;
      completedLineRef.current = null;
      routeLineRef.current = null;
      waitingNodeMarkerRef.current = null;
      waitingZoneRef.current = null;
      depotMarkerRef.current = null;
      previousCollectingIndexRef.current = null;
      previousRouteKeyRef.current = "";
    };
  }, []);

  // Update markers when bins change
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const activeIds = new Set(bins.map((bin) => bin.id));

    for (const [id, marker] of markersRef.current) {
      if (!activeIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    }

    for (const bin of bins) {
      const isCollected = collectedBinIds?.has(bin.id) ?? false;
      const isSelected = selectedBinId === bin.id;
      const isCollecting = collectingBinId === bin.id;
      const existing = markersRef.current.get(bin.id);

      if (existing) {
        existing.setLatLng([bin.latitude, bin.longitude]);
        existing.setIcon(
          createBinIcon(bin, isCollected, isSelected, isCollecting, collectionProgress)
        );
        existing.setPopupContent(getPopupContent(bin));
      } else {
        const marker = L.marker([bin.latitude, bin.longitude], {
          icon: createBinIcon(
            bin,
            isCollected,
            isSelected,
            isCollecting,
            collectionProgress
          ),
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
  }, [bins, selectBin, collectedBinIds, selectedBinId, collectingBinId, collectionProgress]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (waitingNodeMarkerRef.current) {
      map.removeLayer(waitingNodeMarkerRef.current);
      waitingNodeMarkerRef.current = null;
    }
    if (waitingZoneRef.current) {
      map.removeLayer(waitingZoneRef.current);
      waitingZoneRef.current = null;
    }

    if (!waitingNode) return;

    const waitingIcon = L.divIcon({
      className: "custom-waiting-node-marker",
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      html: `
        <div class="waiting-node-marker">
          <span>W</span>
        </div>
      `,
    });

    waitingNodeMarkerRef.current = L.marker(
      [waitingNode.latitude, waitingNode.longitude],
      { icon: waitingIcon, zIndexOffset: 900 }
    )
      .addTo(map)
      .bindPopup(
        `<div style="font-family: system-ui; font-size: 12px; min-width: 140px;">
          <div style="font-weight: 700; margin-bottom: 4px;">Bekleme Dugumu</div>
          <div style="color: #e2e8f0;">${waitingNode.label}</div>
          ${waitingNodeHint ? `<div style="margin-top: 6px; color: #94a3b8;">${waitingNodeHint}</div>` : ""}
        </div>`,
        { className: "dark-popup", maxWidth: 220 }
      );

    waitingZoneRef.current = L.circleMarker(
      [waitingNode.latitude, waitingNode.longitude],
      {
        radius: 32,
        color: "#38bdf8",
        weight: 1.5,
        fillColor: "#38bdf8",
        fillOpacity: 0.08,
        opacity: 0.7,
        dashArray: "6, 6",
      }
    ).addTo(map);

    map.panTo([waitingNode.latitude, waitingNode.longitude], {
      animate: true,
      duration: 0.35,
    });
    waitingNodeMarkerRef.current.openPopup();
  }, [waitingNode, waitingNodeHint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedBinId == null) return;

    const marker = markersRef.current.get(selectedBinId);
    if (!marker) return;

    map.panTo(marker.getLatLng(), { animate: true, duration: 0.35 });
    marker.openPopup();
  }, [selectedBinId]);

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
    previousCollectingIndexRef.current = null;

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
      previousRouteKeyRef.current = routePoints
        .map((point) => `${point.latitude},${point.longitude}`)
        .join("|");
      map.fitBounds(L.latLngBounds(latlngs).pad(0.15), {
        animate: true,
        maxZoom: 1,
      });
    }
  }, [routePoints, collectingIndex]);

  // Collection animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routePoints || routePoints.length < 2) return;
    if (collectingIndex === undefined || collectingIndex < 0) return;
    const routeKey = routePoints
      .map((point) => `${point.latitude},${point.longitude}`)
      .join("|");
    const hasRouteChanged = previousRouteKeyRef.current !== routeKey;
    const previousIndex = previousCollectingIndexRef.current;
    const shouldResetVehicle =
      hasRouteChanged ||
      previousIndex === null ||
      collectingIndex <= 1 ||
      collectingIndex < previousIndex;

    previousRouteKeyRef.current = routeKey;

    // Create vehicle marker if not exists
    if (!vehicleMarkerRef.current) {
      const vehicleIcon = L.divIcon({
        className: "custom-vehicle-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        html: `<div class="collection-vehicle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
    }

    if (shouldResetVehicle) {
      vehicleMarkerRef.current.setLatLng([
        routePoints[0].latitude,
        routePoints[0].longitude,
      ]);
      if (completedLineRef.current) {
        map.removeLayer(completedLineRef.current);
        completedLineRef.current = null;
      }
    }

    // Animate vehicle movement
    const fromIdx = Math.max(0, collectingIndex - 1);
    const toIdx = Math.min(collectingIndex, routePoints.length - 1);
    const markerLatLng = vehicleMarkerRef.current.getLatLng();
    const from =
      !shouldResetVehicle && previousIndex !== null && collectingIndex === previousIndex + 1
        ? { latitude: markerLatLng.lat, longitude: markerLatLng.lng }
        : routePoints[fromIdx];
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
      } else {
        previousCollectingIndexRef.current = collectingIndex;
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
          weight: 4,
          opacity: 1,
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
        .custom-waiting-node-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-depot-marker {
          background: transparent !important;
          border: none !important;
        }
        .collection-vehicle {
          width: 28px; height: 28px; border-radius: 50%;
          background: #22c55e; border: 3px solid #fff;
          display: flex; align-items: center; justify-content: center;
          animation: vehicle-pulse 1.5s ease-in-out infinite;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .bin-collected {
          animation: bin-collected-pop 0.4s ease-out, collected-ring 0.6s ease-out;
        }
        .waiting-node-marker {
          width: 34px; height: 34px; border-radius: 50%;
          background: #0f172a;
          border: 2px solid #38bdf8;
          color: #38bdf8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 0 0 4px rgba(56,189,248,0.16);
          animation: waiting-node-pulse 1.6s ease-in-out infinite;
        }
        .depot-marker {
          width: 40px; height: 40px; border-radius: 12px;
          background: rgba(163, 230, 53, 0.12);
          border: 2px dashed #a3e635;
          color: #a3e635;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 0 0 4px rgba(163,230,53,0.10);
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full rounded-xl" />
    </>
  );
}
