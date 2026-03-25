"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <Skeleton className="w-full h-full rounded-xl" />
  ),
});

interface CampusMapProps {
  routePoints?: { latitude: number; longitude: number }[];
  collectingIndex?: number;
  collectedBinIds?: Set<number>;
  className?: string;
}

export function CampusMap({ routePoints, collectingIndex, collectedBinIds, className }: CampusMapProps) {
  return (
    <div className={className || "w-full h-[600px]"}>
      <MapInner
        routePoints={routePoints}
        collectingIndex={collectingIndex}
        collectedBinIds={collectedBinIds}
      />
    </div>
  );
}
