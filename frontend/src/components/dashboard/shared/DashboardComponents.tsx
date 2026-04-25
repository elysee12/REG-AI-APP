import { useDataStore } from "@/lib/data";

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
  const getXY = (lat: number, lng: number) => {
    const x = 10 + ((lng - 28.8) / (30.9 - 28.8)) * 80;
    const y = 10 + ((lat - (-1.0)) / ((-2.9) - (-1.0))) * 60;
    return { x, y };
  };

  const selectedItem = selectedId ? items.find(item => item.id === selectedId) : null;
  const selectedPos = selectedItem ? getXY(selectedItem.location.lat, selectedItem.location.lng) : null;

  let displayMarkers = items.map(item => {
    const location = item.location || { lat: -1.9441, lng: 30.0619 };
    const { x, y } = getXY(location.lat, location.lng);
    
    let tone: 'success' | 'critical' = 'success';
    if (type === 'device') {
      tone = item.incidentStatus === 'vandalism' ? 'critical' : 'success';
    } else if (type === 'branch') {
      tone = item.hasIncident ? 'critical' : 'success';
    }

    return { ...item, x, y, tone };
  });

  if (isClustered) {
    const clusters: any[] = [];
    const radius = 6;

    displayMarkers.forEach(marker => {
      let foundCluster = clusters.find(c => {
        const dist = Math.sqrt(Math.pow(c.x - marker.x, 2) + Math.pow(c.y - marker.y, 2));
        return dist < radius;
      });

      if (foundCluster) {
        foundCluster.count++;
        if (marker.tone === 'critical') foundCluster.tone = 'critical';
        foundCluster.items.push(marker);
      } else {
        clusters.push({
          x: marker.x,
          y: marker.y,
          count: 1,
          tone: marker.tone,
          items: [marker],
          isCluster: true
        });
      }
    });
    displayMarkers = clusters;
  }

  return (
    <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary to-background bg-grid-pattern overflow-hidden">
      <svg 
        viewBox="0 0 100 80" 
        className={`absolute inset-0 w-full h-full transition-transform duration-700 ease-in-out ${selectedPos ? 'scale-[2.5]' : 'scale-100'}`}
        style={{ 
          transformOrigin: selectedPos ? `${selectedPos.x}% ${selectedPos.y}%` : 'center'
        }}
      >
        <path
          d="M15 25 Q25 10 50 12 Q80 14 88 35 Q92 55 75 70 Q55 78 30 72 Q10 60 15 25 Z"
          fill="oklch(0.92 0.02 152 / 0.4)"
          stroke="oklch(0.6 0.15 152 / 0.5)"
          strokeWidth="0.5"
        />
        {displayMarkers.map((m, i) => {
          const isSelected = !m.isCluster && m.id === selectedId;
          return (
            <g 
              key={i} 
              className="cursor-pointer transition-opacity duration-300"
              style={{ opacity: selectedId && !isSelected && !m.items?.some((it: any) => it.id === selectedId) ? 0.4 : 1 }}
              onClick={() => onMarkerClick?.(m.isCluster ? m.items[0] : m)}
            >
              {/* Pulse effect for alerts or selection */}
              {(m.tone === "critical" || isSelected) && (
                <circle cx={m.x} cy={m.y} r={isSelected ? "5" : m.isCluster ? "4" : "3"} fill={
                  m.tone === "critical" ? "oklch(0.595 0.235 27.5)" : "oklch(0.6 0.15 152)"
                } opacity="0.2">
                  <animate attributeName="r" values={`${isSelected ? 5 : 3};${isSelected ? 8 : 6};${isSelected ? 5 : 3}`} dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              
              <circle cx={m.x} cy={m.y} r={m.isCluster ? "3.5" : isSelected ? "2.5" : "1.8"} fill={
                m.tone === "critical" ? "oklch(0.595 0.235 27.5)"
                  : "oklch(0.6 0.15 152)"
              } stroke="white" strokeWidth={isSelected ? "0.5" : "0"} />

              {m.isCluster && m.count > 1 && (
                <text 
                  x={m.x} 
                  y={m.y + 0.5} 
                  fontSize="2.5" 
                  fill="white" 
                  textAnchor="middle" 
                  alignmentBaseline="middle"
                  className="font-bold pointer-events-none"
                >
                  {m.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-card/90 backdrop-blur rounded-md border border-border px-2.5 py-1.5 text-[11px]">
        <div className="flex items-center gap-3">
          <Legend color="bg-primary" label="Vandalism/Alert" />
          <Legend color="bg-success" label="Secure/Safe" />
        </div>
        <span className="text-muted-foreground font-medium">{items.length} {type === 'device' ? 'units' : 'branches'} listed</span>
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
