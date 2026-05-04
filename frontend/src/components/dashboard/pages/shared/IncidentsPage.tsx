import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeverityPill, StatusPill, Pagination } from "../../shared/DashboardComponents";
import { Camera, MapPin, Radio, ShieldCheck, AlertTriangle, Clock, Send, FileText, X, Video, Activity, Sparkles, CheckCircle2, Pagination as PaginationIcon } from "lucide-react";
import { useDataStore } from "@/lib/data";
import { useAuthStore } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function IncidentsPage() {
  const { devices, incidents, fetchDevices, fetchIncidents, updateIncidentStatus } = useDataStore();
  const user = useAuthStore((state) => state.user);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Camera Live");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const navigate = useNavigate();

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      // Role-based data privacy filtering
      if (user?.role === 'BRANCH_USER' && user.branchId && String(incident.branchId) !== String(user.branchId)) {
        return false;
      }

      // Only show Active and Pending incidents
      if (incident.status === 'solved' || incident.status === 'closed') return false;
      
      const searchLower = search.toLowerCase();
      return (
        incident.deviceId.toLowerCase().includes(searchLower) ||
        incident.location.toLowerCase().includes(searchLower)
      );
    });
  }, [incidents, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredIncidents.length / rowsPerPage);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    fetchDevices();
    // HQ Users fetch all incidents across all branches for the Control Room view
    const branchId = user?.role === 'BRANCH_USER' && user.branchId ? String(user.branchId) : undefined;
    fetchIncidents(branchId);
  }, [fetchDevices, fetchIncidents, user?.role, user?.branchId]);

  useEffect(() => {
    if (filteredIncidents.length > 0 && !selectedId) {
      setSelectedId(filteredIncidents[0].id);
    }
  }, [filteredIncidents, selectedId]);

  const selectedIncident = useMemo(() => {
    return filteredIncidents.find(i => i.id === selectedId) || filteredIncidents[0];
  }, [filteredIncidents, selectedId]);
  
  if (!selectedIncident && filteredIncidents.length === 0) {
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
  const streamUrl = `http://10.227.231.210:8000/stream`;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
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

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedIncident) return;
    const success = await updateIncidentStatus(selectedIncident.id, newStatus);
    if (success) {
      toast.success(`Incident status updated to ${newStatus}`);
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleGenerateReport = () => {
    if (!selectedIncident) return;
    
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const html = `
      <html>
        <head>
          <title>Incident Report - ${selectedIncident.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .id { font-family: monospace; color: #666; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; width: 150px; display: inline-block; }
            .severity { padding: 4px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase; }
            .critical { background: #fee2e2; color: #991b1b; }
            .high { background: #ffedd5; color: #9a3412; }
            .medium { background: #fef3c7; color: #92400e; }
            .low { background: #dcfce7; color: #166534; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Incident Forensic Report</h1>
            <div class="id">Ticket ID: ${selectedIncident.ticketId}</div>
            <div class="id">System UUID: ${selectedIncident.id}</div>
            <div>Generated on: ${new Date().toLocaleString()}</div>
          </div>
          <div class="section">
            <div class="label">AI Class:</div> ${selectedIncident.aiClass || 'N/A'}
          </div>
          <div class="section">
            <div class="label">Alert Status:</div> ${selectedIncident.aiClass || (selectedIncident.alertStatus ? 'CRITICAL' : 'SUSPICIOUS')}
          </div>
          <div class="section">
            <div class="label">Confidence:</div> ${Math.round((selectedIncident.aiConfidence || 0) * 100)}%
          </div>
          <div class="section">
            <div class="label">Time Detected:</div> ${formatTime(selectedIncident.time)}
          </div>
          <div class="section">
            <div class="label">Location:</div> ${selectedIncident.location.split(' · ')[1]} Station Area
          </div>
          <div class="section">
            <div class="label">Serial Number:</div> ${selectedIncident.deviceId}
          </div>
          <div class="section">
            <div class="label">Device IP:</div> ${deviceIp}
          </div>
          <hr/>
          <h2>AI Detection Summary</h2>
          <p>The AI unit ${selectedIncident.deviceId} detected potential unauthorized activity with a confidence level of ${selectedIncident.aiConfidence || '95'}%.</p>
          
          <h2>Telemetric Data</h2>
          <ul>
            <li>Motion: Detected</li>
            <li>Vibration: Normal</li>
            <li>Acceleration: Standard baseline</li>
          </ul>
          
          <div style="margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; font-size: 12px; color: #666;">
            &copy; ${new Date().getFullYear()} GRIDGuard AI - Infrastructure Protection System - National Network
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  return (
    <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* List */}
      <div className="xl:col-span-1 bg-card border border-border rounded-xl shadow-card flex flex-col max-h-[calc(100vh-9rem)]">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Live Incidents</h2>
          <Input 
            placeholder="Filter by ID or site…" 
            className="mt-2 h-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {paginatedIncidents.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelectedId(i.id)}
              className={`w-full text-left p-4 hover:bg-secondary/60 transition-colors ${selectedId === i.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">{i.ticketId}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${i.alertStatus ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"}`}>
                  {i.aiClass || (i.alertStatus ? "CRITICAL" : "SUSPICIOUS")}
                </span>
              </div>
              <div className="mt-2 font-bold text-sm text-foreground">{i.deviceId}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{i.location.split(' · ')[1]} Station Area</div>
              <div className="text-xs text-muted-foreground mt-2 font-medium">{i.aiClass || "AI Detection"}</div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{getRelativeTime(i.time)}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedIncident.alertStatus ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"}`}>
                      {selectedIncident.aiClass || (selectedIncident.alertStatus ? "CRITICAL" : "SUSPICIOUS")}
                    </span>
                    <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">{selectedIncident.ticketId}</span>
                  </div>
                  <h1 className="mt-2 text-xl font-bold">{selectedIncident.aiClass || "AI Detection"} — {selectedIncident.deviceId}</h1>
                  <p className="text-sm text-muted-foreground">{selectedIncident.location.split(' · ')[1]} Station Area</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <Meta label="Detection time" value={formatTime(selectedIncident.time)} />
                <Meta label="AI Class" value={selectedIncident.aiClass || "N/A"} />
                <Meta label="Alert Status" value={selectedIncident.aiClass || (selectedIncident.alertStatus ? "CRITICAL" : "SUSPICIOUS")} />
                <Meta label="Confidence" value={`${Math.round((selectedIncident.aiConfidence || 0) * 100)}%`} />
                <Meta label="Workflow Status" value={selectedIncident.status.toUpperCase()} />
                <Meta label="Device ID" value={selectedIncident.deviceId} />
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
                {["Camera Live", "Video Clip", "Sensor Data", "AI Summary"].map((t) => (
                  <button 
                    key={t} 
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              
              <div className="aspect-video rounded-lg bg-sidebar relative overflow-hidden border border-border">
                {activeTab === "Camera Live" && (
                  <>
                    <iframe 
                      src={streamUrl} 
                      className="absolute inset-0 w-full h-full border-0"
                      allow="autoplay; encrypted-media"
                      title="Camera Live Stream"
                    />
                    <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-primary/90 text-primary-foreground text-xs font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground blink" /> LIVE · {selectedIncident.deviceId}
                    </div>
                  </>
                )}

                {activeTab === "Video Clip" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background text-center">
                    {selectedIncident.videoPath ? (
                      <video 
                        key={selectedIncident.videoPath}
                        controls 
                        className="w-full h-full object-contain"
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        crossOrigin="anonymous"
                      >
                        <source 
                          src={`http://${window.location.hostname}:3000${selectedIncident.videoPath}`} 
                          type="video/mp4" 
                        />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="p-6">
                        <Video className="h-12 w-12 text-primary/40 mb-3 mx-auto" />
                        <h3 className="font-semibold">Recorded Evidence Clip</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                          No video evidence recorded for this incident.
                        </p>
                        <Button variant="outline" size="sm" className="mt-4 gap-2">
                          <Clock className="h-4 w-4" /> Request Archive Data
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "Sensor Data" && (
                  <div className="absolute inset-0 p-6 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto">
                    <SensorChip 
                      icon={Activity} 
                      label="Vibration" 
                      value="Normal"
                      tone="success"
                    />
                    <SensorChip 
                      icon={Radio} 
                      label="Motion" 
                      value="Detected"
                      tone="warning" 
                    />
                    <SensorChip 
                      icon={AlertTriangle} 
                      label="Accelerometer" 
                      value="Stable"
                      tone="success" 
                    />
                    <div className="col-span-2 md:col-span-3 bg-secondary/20 rounded-lg p-4 border border-border">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Telemetry Log</h4>
                      <div className="space-y-2 font-mono text-[10px]">
                        <div className="flex justify-between border-b border-border/50 pb-1">
                          <span>T-0ms: Peak vibration detected</span>
                          <span className="text-primary">8.4Hz</span>
                        </div>
                        <div className="flex justify-between border-b border-border/50 pb-1">
                          <span>T-50ms: AI Classification triggered</span>
                          <span className="text-primary">{selectedIncident.aiClass || "Detection"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>T-120ms: Local alarm broadcast</span>
                          <span className="text-success">OK</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "AI Summary" && (
                  <div className="absolute inset-0 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold italic">Intelligent Incident Summary</h3>
                    </div>
                    <div className="space-y-4 text-sm leading-relaxed">
                      <p>
                        <span className="font-bold text-primary">Detection Analysis:</span> At {formatTime(selectedIncident.time)}, 
                        AI Unit {selectedIncident.deviceId} identified high-probability <span className="font-bold text-primary">{selectedIncident.aiClass || "Unauthorized"}</span> behavior.
                      </p>
                      <p>
                        <span className="font-bold text-primary">Contextual Factors:</span> The pattern matches known <span className="font-bold text-primary">{selectedIncident.aiClass || (selectedIncident.alertStatus ? 'CRITICAL' : 'SUSPICIOUS')}</span> signatures 
                        with <span className="text-primary font-bold">{Math.round((selectedIncident.aiConfidence || 0) * 100)}% confidence</span>. 
                      </p>
                      <div className="p-3 rounded border border-primary/20 bg-primary/5 text-xs">
                        <span className="font-bold block mb-1 uppercase tracking-wider text-[10px]">Source Note</span>
                        System automatically flagged this event based on physical tampering sensors and computer vision analysis.
                      </div>
                    </div>
                  </div>
                )}
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
            
            {selectedIncident.status === 'active' && (
              <Button 
                className="gap-2 bg-warning hover:bg-warning/90 text-warning-foreground"
                onClick={() => handleUpdateStatus('pending')}
              >
                <Activity className="h-4 w-4" /> Mark as Pending
              </Button>
            )}

            {selectedIncident.status === 'pending' && (
              <Button 
                className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => handleUpdateStatus('solved')}
              >
                <CheckCircle2 className="h-4 w-4" /> Mark as RESOLVED
              </Button>
            )}

            {selectedIncident.status === 'solved' && (
              <Button 
                variant="outline"
                className="gap-2 border-success text-success hover:bg-success/10"
                disabled
              >
                <ShieldCheck className="h-4 w-4" /> Incident RESOLVED
              </Button>
            )}

            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleGenerateReport}
            >
              <FileText className="h-4 w-4" /> Generate Incident Report
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
