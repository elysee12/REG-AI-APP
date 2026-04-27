import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeverityPill, StatusPill } from "../../shared/DashboardComponents";
import { Camera, MapPin, Radio, ShieldCheck, AlertTriangle, Clock, Send, FileText, X } from "lucide-react";
import { useDataStore } from "@/lib/data";
import { useAuthStore } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

export function IncidentsPage() {
  const { devices, incidents, fetchDevices, fetchIncidents } = useDataStore();
  const user = useAuthStore((state) => state.user);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDevices();
    const branchId = user?.role === 'BRANCH_USER' && user.branchId ? String(user.branchId) : undefined;
    fetchIncidents(branchId);
  }, [fetchDevices, fetchIncidents, user]);

  useEffect(() => {
    if (incidents.length > 0 && !selectedId) {
      setSelectedId(incidents[0].id);
    }
  }, [incidents, selectedId]);

  const selectedIncident = incidents.find(i => i.id === selectedId) || incidents[0];
  
  if (!selectedIncident && incidents.length === 0) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="text-center">
          <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
          <p className="text-muted-foreground">No active incidents detected.</p>
        </div>
      </div>
    );
  }

  const associatedDevice = devices.find(d => d.id === selectedIncident?.deviceId);
  const deviceIp = associatedDevice?.ipAddress || selectedIncident?.deviceIp || "172.22.13.126";
  const streamUrl = `http://${deviceIp}:8001/stream-only`;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* List */}
      <div className="xl:col-span-1 bg-card border border-border rounded-xl shadow-card flex flex-col max-h-[calc(100vh-9rem)]">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Live Incidents</h2>
          <Input placeholder="Filter by ID or site…" className="mt-2 h-9" />
        </div>
        <div className="overflow-y-auto divide-y divide-border">
          {incidents.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelectedId(i.id)}
              className={`w-full text-left p-4 hover:bg-secondary/60 transition-colors ${selectedId === i.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground uppercase">{i.id.split('-')[0]}</span>
                <SeverityPill level={i.severity} />
              </div>
              <div className="mt-1 font-semibold text-sm">{i.location}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{i.type}</div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{getRelativeTime(i.time)}</span>
                <span className="ml-auto"><StatusPill status={i.status} /></span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      {selectedIncident && (
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="p-5 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <SeverityPill level={selectedIncident.severity} />
                    <span className="font-mono text-xs text-muted-foreground uppercase">{selectedIncident.id}</span>
                  </div>
                  <h1 className="mt-2 text-xl font-bold">{selectedIncident.type} — {selectedIncident.location.split(' · ')[0]}</h1>
                  <p className="text-sm text-muted-foreground">{selectedIncident.location.split(' · ')[1]} Station Area</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Meta label="Detection time" value={formatTime(selectedIncident.time)} />
                <Meta label="Type" value={selectedIncident.type} />
                <Meta 
                  label="GPS" 
                  value={associatedDevice ? `${associatedDevice.location.lat.toFixed(4)}, ${associatedDevice.location.lng.toFixed(4)}` : "N/A"} 
                  onClick={() => {
                    if (associatedDevice) {
                      window.open(`https://www.google.com/maps/search/?api=1&query=${associatedDevice.location.lat},${associatedDevice.location.lng}`, '_blank');
                    }
                  }}
                />
                <Meta label="Device IP" value={deviceIp} />
              </div>
            </div>

            {/* Evidence tabs */}
            <div className="p-5">
              <div className="flex gap-1 border-b border-border mb-4">
                {["Camera Live", "Video Clip", "Sensor Data", "AI Summary"].map((t, i) => (
                  <button key={t} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${i === 0 ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="aspect-video rounded-lg bg-sidebar relative overflow-hidden">
                <iframe 
                  src={streamUrl} 
                  className="absolute inset-0 w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                  title="Camera Live Stream"
                />
                <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-primary/90 text-primary-foreground text-xs font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground blink" /> LIVE · {selectedIncident.deviceId}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate({ to: "/dashboard/response", search: { incidentId: selectedIncident.id } })}
            >
              <Send className="h-4 w-4" /> Response Actions
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" /> Generate Incident Report
            </Button>
            <Button className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Resolve Incident
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <div className={`space-y-1 ${onClick ? "cursor-pointer group" : ""}`} onClick={onClick}>
      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider group-hover:text-primary transition-colors">{label}</div>
      <div className={`font-semibold text-foreground truncate ${onClick ? "text-primary group-hover:underline" : ""}`}>{value}</div>
    </div>
  );
}

const LIST = []; // Removed static list

function SensorChip({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: "critical" | "warning" | "success" }) {
  const c = tone === "critical" ? "bg-primary/10 text-primary border-primary/30" : tone === "warning" ? "bg-warning/15 text-warning border-warning/30" : "bg-success/10 text-success border-success/30";
  return (
    <div className={`rounded-lg border p-3 ${c}`}>
      <div className="flex items-center gap-2 text-xs font-medium">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-1 text-base font-bold">{value}</div>
    </div>
  );
}
