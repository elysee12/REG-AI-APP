import { useDataStore } from "@/lib/data";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useMemo, useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, ExternalLink } from "lucide-react";

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
    resolved: { c: "bg-success text-success-foreground", l: "Resolved" },
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

const GOOGLE_MAPS_API_KEY = "AIzaSyChDaeqV0Ou4ZnPc0ELiabzbO6_OEQnd8w";

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: -1.9441,
  lng: 30.0619
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    { featureType: "all", elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  ]
};

// Leaflet specific helper to update map view
function MapResizer({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function MiniMap({ 
  items = [], 
  type = 'device',
  isClustered = false,
  onMarkerClick,
  selectedId
}: { 
  items?: any[], 
  type?: 'device' | 'branch',
  isClustered?: boolean,
  onMarkerClick?: (item: any) => void,
  selectedId?: string
}) {
  const [useFallback, setUseFallback] = useState(false);
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  // Detect billing or loading errors
  useEffect(() => {
    if (loadError) setUseFallback(true);
  }, [loadError]);

  const onLoad = useCallback((map: google.maps.Map) => {
    const bounds = new window.google.maps.LatLngBounds();
    items.forEach(item => {
      bounds.extend({
        lat: item.location?.lat || center.lat,
        lng: item.location?.lng || center.lng
      });
    });
    if (items.length > 0) {
      map.fitBounds(bounds);
    }
    setMap(map);
  }, [items]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Update center when selectedId changes
  useEffect(() => {
    if (map && selectedId) {
      const selectedItem = items.find(i => i.id === selectedId);
      if (selectedItem) {
        map.panTo({
          lat: selectedItem.location.lat,
          lng: selectedItem.location.lng
        });
        map.setZoom(15);
      }
    }
  }, [map, selectedId, items]);

  const selectedItem = selectedId ? items.find(i => i.id === selectedId) : null;
  const currentCenter: [number, number] = selectedItem 
    ? [selectedItem.location.lat, selectedItem.location.lng] 
    : [center.lat, center.lng];
  const currentZoom = selectedId ? 15 : 9;

  // Fallback Leaflet Map
  if (useFallback || loadError) {
    return (
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-border shadow-inner bg-secondary/20">
        <MapContainer 
          center={currentCenter} 
          zoom={currentZoom} 
          style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapResizer center={currentCenter} zoom={currentZoom} />
          {items.map((item) => (
            <LeafletMarker 
              key={item.id} 
              position={[item.location?.lat || center.lat, item.location?.lng || center.lng]}
              eventHandlers={{
                click: () => onMarkerClick?.(item),
              }}
            >
              <Popup>
                <div className="p-1">
                  <div className="font-bold text-sm text-black">{item.name || item.id}</div>
                  <div className="text-xs text-gray-600 mt-1">{item.location.address}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${(type === 'device' ? item.incidentStatus === 'vandalism' : item.hasIncident) ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className="text-[10px] font-medium uppercase">
                      {(type === 'device' ? item.incidentStatus === 'vandalism' : item.hasIncident) ? 'Critical Alert' : 'Secure'}
                    </span>
                  </div>
                </div>
              </Popup>
            </LeafletMarker>
          ))}
        </MapContainer>

        {/* Billing Warning Overlay */}
        <div className="absolute top-4 left-4 right-4 z-[1000] animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="bg-destructive/90 backdrop-blur-md text-destructive-foreground px-4 py-3 rounded-lg border border-white/20 shadow-2xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold">Google Maps Billing Required</p>
              <p className="text-[11px] opacity-90 leading-tight mt-0.5">
                The map is currently using OpenStreetMap fallback because billing is not enabled for your Google Cloud Project.
              </p>
            </div>
            <a 
              href="https://console.cloud.google.com/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              Enable Billing <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-card/95 backdrop-blur shadow-lg rounded-lg border border-border px-4 py-2 text-[11px] z-[1000]">
          <div className="flex items-center gap-4">
            <Legend color="bg-primary" label="Vandalism/Alert" />
            <Legend color="bg-success" label="Secure/Safe" />
          </div>
          <span className="text-muted-foreground font-semibold italic">Using OpenStreetMap (Free Fallback)</span>
        </div>
      </div>
    );
  }

  if (!isLoaded) return (
    <div className="w-full h-full flex items-center justify-center bg-secondary animate-pulse">
      <div className="text-muted-foreground text-sm">Loading Google Maps...</div>
    </div>
  );

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={9}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {isClustered ? (
          <MarkerClusterer>
            {(clusterer) => (
              <>
                {items.map((item) => (
                  <Marker
                    key={item.id}
                    position={{
                      lat: item.location?.lat || center.lat,
                      lng: item.location?.lng || center.lng
                    }}
                    clusterer={clusterer}
                    onClick={() => {
                      onMarkerClick?.(item);
                      setActiveMarker(item.id);
                    }}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: (type === 'device' ? item.incidentStatus === 'vandalism' : item.hasIncident) ? "#EF1C25" : "#1E9E57",
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: "#FFFFFF",
                    }}
                  />
                ))}
              </>
            )}
          </MarkerClusterer>
        ) : (
          items.map((item) => (
            <Marker
              key={item.id}
              position={{
                lat: item.location?.lat || center.lat,
                lng: item.location?.lng || center.lng
              }}
              onClick={() => {
                onMarkerClick?.(item);
                setActiveMarker(item.id);
              }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: selectedId === item.id ? 10 : 7,
                fillColor: (type === 'device' ? item.incidentStatus === 'vandalism' : item.hasIncident) ? "#EF1C25" : "#1E9E57",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: selectedId === item.id ? "#000000" : "#FFFFFF",
              }}
            />
          ))
        )}

        {activeMarker && (
          <InfoWindow
            position={{
              lat: items.find(i => i.id === activeMarker)?.location.lat || center.lat,
              lng: items.find(i => i.id === activeMarker)?.location.lng || center.lng
            }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="p-1 min-w-[150px]">
              <div className="font-bold text-sm text-black">
                {items.find(i => i.id === activeMarker)?.name || items.find(i => i.id === activeMarker)?.id}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {items.find(i => i.id === activeMarker)?.location.address}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${(type === 'device' ? items.find(i => i.id === activeMarker)?.incidentStatus === 'vandalism' : items.find(i => i.id === activeMarker)?.hasIncident) ? 'bg-red-500' : 'bg-green-500'}`} />
                <span className="text-[10px] font-medium uppercase">
                  {(type === 'device' ? items.find(i => i.id === activeMarker)?.incidentStatus === 'vandalism' : items.find(i => i.id === activeMarker)?.hasIncident) ? 'Critical Alert' : 'Secure'}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-card/95 backdrop-blur shadow-lg rounded-lg border border-border px-4 py-2 text-[11px] z-10">
        <div className="flex items-center gap-4">
          <Legend color="bg-primary" label="Vandalism/Alert" />
          <Legend color="bg-success" label="Secure/Safe" />
        </div>
        <span className="text-muted-foreground font-semibold">{items.length} {type === 'device' ? 'units' : 'branches'} on map</span>
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
