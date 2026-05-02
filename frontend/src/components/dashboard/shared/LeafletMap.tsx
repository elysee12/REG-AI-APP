import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix Leaflet icon issue for production builds
// @ts-ignore
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Helper component to handle map recentering and zooming
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, {
      animate: true,
      duration: 1
    });
  }, [center, zoom, map]);
  return null;
}

interface LeafletMapProps {
  items: any[];
  type: 'device' | 'branch';
  currentCenter: [number, number];
  currentZoom: number;
  onMarkerClick?: (item: any) => void;
}

export default function LeafletMap({ 
  items, 
  type, 
  currentCenter, 
  currentZoom, 
  onMarkerClick 
}: LeafletMapProps) {
  return (
    <MapContainer 
      center={currentCenter} 
      zoom={currentZoom} 
      style={{ height: '100%', width: '100%', background: '#111827' }}
      zoomControl={true}
      className="z-0"
    >
      {/* Dark themed tiles using CartoDB Dark Matter */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      <MapController center={currentCenter} zoom={currentZoom} />
      
      {items.map((item) => {
        if (!item.location?.lat || !item.location?.lng) return null;
        
        const isVandalism = type === 'device' ? item.incidentStatus === 'vandalism' : item.hasIncident;
        const isOffline = type === 'device' && item.status === 'offline';
        
        let color = "#10b981"; // Success (Green)
        if (isVandalism) color = "#ef4444"; // Destructive (Red)
        else if (isOffline) color = "#f59e0b"; // Warning (Yellow)

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="relative flex items-center justify-center">
              <div style="background-color: ${color};" class="w-4 h-4 rounded-full border-2 border-white shadow-lg ${isVandalism ? 'animate-pulse' : ''}"></div>
              ${isVandalism ? `<div style="background-color: ${color};" class="absolute w-4 h-4 rounded-full animate-ping opacity-75"></div>` : ''}
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        return (
          <LeafletMarker 
            key={item.id} 
            position={[item.location.lat, item.location.lng]}
            icon={customIcon}
            eventHandlers={{
              click: () => onMarkerClick?.(item),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[220px] bg-card text-card-foreground">
                <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                  <div className="font-mono font-bold text-sm text-primary truncate pr-2">{item.id}</div>
                  <div className={`h-2.5 w-2.5 rounded-full ${isVandalism ? 'bg-red-500 animate-pulse' : isOffline ? 'bg-yellow-500' : 'bg-green-500'}`} />
                </div>
                
                {type === 'device' && (
                  <div className="aspect-video bg-black rounded-md mb-3 overflow-hidden flex items-center justify-center text-[10px] text-white/50 italic border border-border group relative">
                    {item.ipAddress ? (
                      <iframe 
                        src={`http://10.227.231.210:8000/stream`} 
                        className="w-full h-full border-0"
                        title="Live Stream"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>Stream Offline</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5 text-[11px] mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Status</span>
                    <span className={`font-bold uppercase ${isOffline ? 'text-warning' : isVandalism ? 'text-destructive' : 'text-success'}`}>
                      {item.status || 'Online'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-muted-foreground font-medium shrink-0">Location</span>
                    <span className="text-right line-clamp-2">{item.location.address}</span>
                  </div>
                </div>

                <button 
                  onClick={() => onMarkerClick?.(item)}
                  className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  VIEW SITE DETAILS
                </button>
              </div>
            </Popup>
          </LeafletMarker>
        );
      })}
    </MapContainer>
  );
}
