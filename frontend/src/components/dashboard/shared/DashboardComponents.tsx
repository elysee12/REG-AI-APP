import { useDataStore } from "@/lib/data";
import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import LeafletMap to avoid "window is not defined" error during SSR
const LeafletMap = lazy(() => import("./LeafletMap"));

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/20">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            Showing page <span className="font-medium text-foreground">{currentPage}</span> of <span className="font-medium text-foreground">{totalPages}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Kpi({ icon: Icon, label, value, trend, tone = "default" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; trend: string;
  tone?: "default" | "critical" | "warning" | "success";
}) {
  const tones = {
    default: "bg-secondary text-foreground",
    critical: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/10 text-success",
  } as any;
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-[11px] text-muted-foreground/80">{trend}</div>
    </div>
  );
}

export function SeverityPill({ level }: { level: string }) {
  const map: Record<string, string> = {
    critical: "bg-primary/15 text-primary border-primary/30",
    high: "bg-primary/10 text-primary border-primary/20",
    medium: "bg-warning/15 text-warning border-warning/30",
    low: "bg-success/10 text-success border-success/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border uppercase ${map[level] ?? map.medium}`}>
      {level}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { c: string; l: string }> = {
    active: { c: "bg-primary text-primary-foreground", l: "Active" },
    pending: { c: "bg-warning text-warning-foreground", l: "Pending" },
    dispatched: { c: "bg-foreground text-background", l: "Dispatched" },
    solved: { c: "bg-success text-success-foreground", l: "RESOLVED" },
    resolved: { c: "bg-success text-success-foreground", l: "RESOLVED" },
    false_alarm: { c: "bg-muted text-muted-foreground border border-border", l: "FALSE ALARM" },
  };
  const s = map[status] ?? map.pending;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.c}`}>{s.l}</span>;
}

export function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: "critical" | "warning" }) {
  const c = tone === "critical" ? "text-primary" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-md bg-secondary/60 p-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-semibold ${c}`}>{value}</div>
    </div>
  );
}

export function QuickAction({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-md border border-border bg-secondary/40 hover:bg-secondary hover:border-primary/40 transition-colors text-xs font-medium">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </button>
  );
}

const center = {
  lat: -1.9441,
  lng: 30.0619
};

export function MiniMap({ 
  items = [], 
  type = 'device',
  onMarkerClick,
  selectedId,
  center: propCenter
}: { 
  items?: any[], 
  type?: 'device' | 'branch',
  isClustered?: boolean,
  onMarkerClick?: (item: any) => void,
  selectedId?: string,
  center?: { lat: number, lng: number }
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const selectedItem = selectedId ? items.find(i => i.id === selectedId) : null;
  
  // Calculate center: 
  // 1. If selectedItem exists, use it
  // 2. If propCenter exists, use it
  // 3. If items exist, use the average of items
  // 4. Default to Kigali
  const currentCenter: [number, number] = useMemo(() => {
    if (selectedItem && selectedItem.location?.lat && selectedItem.location?.lng) {
      return [selectedItem.location.lat, selectedItem.location.lng];
    }
    if (propCenter) {
      return [propCenter.lat, propCenter.lng];
    }
    if (items.length > 0) {
      const validItems = items.filter(i => i.location?.lat && i.location?.lng);
      if (validItems.length > 0) {
        const avgLat = validItems.reduce((sum, i) => sum + i.location.lat, 0) / validItems.length;
        const avgLng = validItems.reduce((sum, i) => sum + i.location.lng, 0) / validItems.length;
        return [avgLat, avgLng];
      }
    }
    return [center.lat, center.lng];
  }, [selectedItem, propCenter, items]);

  const currentZoom = selectedId ? 17 : 9;

  if (!isClient) return (
    <div className="w-full h-full flex items-center justify-center bg-secondary/20 min-h-[400px] rounded-lg border border-border">
      <div className="text-muted-foreground text-sm">Initializing Map...</div>
    </div>
  );

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border shadow-inner bg-secondary/20 min-h-[400px]">
      <Suspense fallback={<div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-white/20">Loading Map View...</div>}>
        <LeafletMap 
          items={items}
          type={type}
          currentCenter={currentCenter}
          currentZoom={currentZoom}
          onMarkerClick={onMarkerClick}
        />
      </Suspense>

      <style>{`
        .marker-pin {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 5px rgba(0,0,0,0.5);
        }
        .custom-popup .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          background: white;
          border-radius: 8px;
        }
        .custom-popup .leaflet-popup-content {
          margin: 8px;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-card/95 backdrop-blur shadow-lg rounded-lg border border-border px-4 py-2 text-[11px] z-[1000]">
        <div className="flex items-center gap-4">
          <Legend color="bg-primary" label="Vandalism/Alert" />
          <Legend color="bg-success" label="Secure/Safe" />
        </div>
        <div className="flex items-center gap-2">
          <Info className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground font-semibold italic">OpenStreetMap Mode</span>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
