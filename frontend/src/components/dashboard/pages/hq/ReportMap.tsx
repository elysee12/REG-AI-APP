import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';

interface ReportMapProps {
  branches: any[];
  incidents: any[];
}

export default function ReportMap({ branches, incidents }: ReportMapProps) {
  const center: [number, number] = [-1.9441, 30.0619]; // Rwanda center

  const branchData = useMemo(() => {
    return branches.map(branch => {
      const count = incidents.filter(i => String(i.branchId) === String(branch.id)).length;
      return {
        ...branch,
        incidentCount: count,
      };
    });
  }, [branches, incidents]);

  return (
    <div className="h-full w-full bg-secondary/10 rounded-lg overflow-hidden relative border border-border">
      <MapContainer 
        center={center} 
        zoom={8.5} 
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ZoomControl position="bottomright" />
        
        {branchData.map((branch) => {
          if (!branch.incidentCount) return null;
          
          // Calculate radius based on incident count (min 5, max 30)
          const radius = Math.min(Math.max(branch.incidentCount * 3, 8), 40);
          
          // Determine color based on severity
          let color = "#10b981"; // Green
          if (branch.incidentCount > 10) color = "#ef4444"; // Red
          else if (branch.incidentCount > 5) color = "#f59e0b"; // Orange

          return (
            <CircleMarker
              key={branch.id}
              center={[branch.lat || -1.9441, branch.lng || 30.0619]}
              radius={radius}
              fillColor={color}
              color={color}
              weight={1}
              opacity={0.3}
              fillOpacity={0.4}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[120px]">
                  <div className="font-bold text-sm border-b pb-1 mb-1">{branch.name}</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Incidents:</span>
                    <span className="font-bold">{branch.incidentCount}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className={`font-bold ${branch.incidentCount > 10 ? 'text-destructive' : 'text-success'}`}>
                      {branch.incidentCount > 10 ? 'CRITICAL' : branch.incidentCount > 5 ? 'HIGH' : 'MODERATE'}
                    </span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur p-2 rounded-md border border-border shadow-sm text-[10px]">
        <div className="font-bold mb-1 uppercase tracking-wider text-muted-foreground">Risk Intensity</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-destructive" /> Critical Hotspot</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-warning" /> High Activity</div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success" /> Stable Region</div>
        </div>
      </div>
    </div>
  );
}
