import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeverityPill, StatusPill, Pagination } from "../../shared/DashboardComponents";
import { Camera, MapPin, Radio, ShieldCheck, AlertTriangle, Clock, Send, FileText, X, Video, Activity, Sparkles, CheckCircle2, Pagination as PaginationIcon, Info } from "lucide-react";
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
            <div class="label">Confidence:</div> ${Math.round(selectedIncident.aiConfidence || 0)}%
          </div>
          <div class="section">
            <div class="label">Time Detected:</div> ${formatTime(selectedIncident.time)}
          </div>
          <div class="section">
            <div class="label">Location:</div> ${selectedIncident.address || selectedIncident.location}
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
    <div className="p-2 md:p-6 grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-4">
      {/* List */}
      <div className={`xl:col-span-1 bg-card border border-border rounded-xl shadow-card flex flex-col ${selectedId ? "hidden xl:flex" : "flex"} h-[calc(100vh-8rem)] md:max-h-[calc(100vh-9rem)]`}>
        <div className="p-3 md:p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg md:text-base">Live Incidents</h2>
            {user?.role === 'BRANCH_USER' && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Branch View</span>
            )}
          </div>
          <Input 
            placeholder="Search by ID or tower…" 
            className="h-10 md:h-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {paginatedIncidents.length > 0 ? paginatedIncidents.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelectedId(i.id)}
              className={`w-full text-left p-4 hover:bg-secondary/60 transition-colors ${selectedId === i.id ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">{i.ticketId}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${i.alertStatus ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"}`}>
                  {i.aiClass || (i.alertStatus ? "CRITICAL" : "SUSPICIOUS")}
                </span>
              </div>
              <div className="mt-2 font-black text-base md:text-sm text-foreground tracking-tight">{i.deviceId}</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-medium">{i.address || i.location}</div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  {getRelativeTime(i.time)}
                </div>
                <div className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">Details →</div>
              </div>
            </button>
          )) : (
            <div className="p-10 text-center opacity-40">
              <ShieldCheck className="h-10 w-10 mx-auto mb-2" />
              <p className="text-sm">No incidents found</p>
            </div>
          )}
        </div>
        <div className="p-3 md:p-4 border-t border-border bg-secondary/10">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </div>
      </div>

      {/* Detail */}
      {selectedIncident && (
        <div className={`xl:col-span-2 space-y-3 md:space-y-4 ${selectedId ? "block" : "hidden xl:block"}`}>
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="p-4 md:p-5 border-b border-border bg-gradient-to-br from-primary/10 via-background to-transparent">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedIncident.alertStatus ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"}`}>
                      {selectedIncident.aiClass || (selectedIncident.alertStatus ? "CRITICAL" : "SUSPICIOUS")}
                    </span>
                    <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">{selectedIncident.ticketId}</span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded uppercase tracking-tighter">Workflow: {selectedIncident.status}</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground leading-none">
                    {selectedIncident.aiClass || "AI Detection"}
                  </h1>
                  <p className="mt-1 text-sm font-bold text-muted-foreground">{selectedIncident.address || selectedIncident.location}</p>
                </div>
                <Button variant="ghost" size="icon" className="md:hidden -mr-2 -mt-2" onClick={() => setSelectedId(null)}>
                  <X className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="sm" className="hidden md:flex gap-2" onClick={() => setSelectedId(null)}>
                  <X className="h-4 w-4" /> Close Detail
                </Button>
              </div>
              
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-x-4 gap-y-4 border-t border-primary/10 pt-4">
                <Meta label="Detection time" value={formatTime(selectedIncident.time)} />
                <Meta label="AI Confidence" value={`${Math.round(selectedIncident.aiConfidence || 0)}%`} />
                <Meta label="Device ID" value={selectedIncident.deviceId} />
                <Meta 
                  label="GPS Coordinates" 
                  value={associatedDevice ? `${associatedDevice.location.lat.toFixed(4)}, ${associatedDevice.location.lng.toFixed(4)}` : "N/A"}
                  onClick={() => {
                    if (associatedDevice) {
                      window.open(`https://www.google.com/maps/search/?api=1&query=${associatedDevice.location.lat},${associatedDevice.location.lng}`, '_blank');
                    }
                  }}
                />
              </div>
            </div>

            {/* Evidence tabs - Scrollable on mobile */}
            <div className="p-3 md:p-5">
              <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto no-scrollbar scroll-smooth">
                {["Camera Live", "Video Clip", "Device Status", "AI Summary"].map((t) => (
                  <button 
                    key={t} 
                    onClick={() => setActiveTab(t)}
                    className={`px-4 py-2 text-xs md:text-sm font-bold border-b-2 -mb-px transition-all whitespace-nowrap ${activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              
              <div className="aspect-video rounded-xl bg-sidebar relative overflow-hidden border border-border shadow-inner">
                {activeTab === "Camera Live" && (
                  <>
                    <img 
                      src={streamUrl} 
                      className="absolute inset-0 w-full h-full object-cover"
                      alt="Camera Live Stream"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = "https://images.unsplash.com/photo-1557597774-9d2739f05a76?q=80&w=2070&auto=format&fit=crop";
                      }}
                    />
                    <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> LIVE · {selectedIncident.deviceId}
                    </div>
                  </>
                )}
                {/* ... other tabs content ... */}

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

                {activeTab === "Device Status" && (
                  <div className="absolute inset-0 p-6 grid grid-cols-2 md:grid-cols-2 gap-4 overflow-y-auto">
                    <SensorChip 
                      icon={Radio} 
                      label="PIR Sensor Activity" 
                      value={selectedIncident.pirSensor ? `Zone ${selectedIncident.pirSensor}` : "No Activity"}
                      tone={selectedIncident.pirSensor ? "warning" : "success"} 
                    />
                    <SensorChip 
                      icon={Activity} 
                      label="Servo Position" 
                      value={selectedIncident.servoPosition !== undefined ? `${selectedIncident.servoPosition}°` : "N/A"}
                      tone="success" 
                    />
                    <div className="col-span-2 bg-secondary/20 rounded-lg p-5 border border-border">
                      <h4 className="text-xs font-bold uppercase text-primary mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5" /> Hardware Connectivity & GPS
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        <StatusRow 
                          label="Camera Module" 
                          value={associatedDevice?.cameraConnected ? "CONNECTED" : "DISCONNECTED"}
                          status={associatedDevice?.cameraConnected ? "success" : "destructive"}
                        />
                        <StatusRow 
                          label="ESP32 Controller" 
                          value={associatedDevice?.esp32Connected ? "CONNECTED" : "DISCONNECTED"}
                          status={associatedDevice?.esp32Connected ? "success" : "destructive"}
                        />
                        <StatusRow 
                          label="GPS Satellites" 
                          value={associatedDevice?.gpsSatellites ? `${associatedDevice.gpsSatellites} Locked` : "Searching..."}
                          status={associatedDevice?.gpsSatellites ? "primary" : "warning"}
                        />
                        <StatusRow 
                          label="Live GPS" 
                          value={selectedIncident.gpsLatitude ? `${selectedIncident.gpsLatitude.toFixed(4)}, ${selectedIncident.gpsLongitude.toFixed(4)}` : (associatedDevice?.location.lat ? `${associatedDevice.location.lat.toFixed(4)}, ${associatedDevice.location.lng.toFixed(4)}` : "N/A")}
                          status="primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "AI Summary" && (
                  <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-center bg-slate-950 text-slate-50 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold tracking-tight">Intelligent Incident Summary</h3>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">AI Generation Unit</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-6">
                      <div className="space-y-4 leading-relaxed">
                        {selectedIncident.aiSummary ? (
                          <div className="text-base text-slate-200 bg-slate-900/50 p-5 rounded-xl border border-slate-800 shadow-inner">
                            {selectedIncident.aiSummary}
                          </div>
                        ) : (
                          <div className="space-y-4 text-slate-200">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                              <span className="font-bold text-primary block text-xs uppercase tracking-wider mb-1">Detection Analysis</span>
                              <p className="text-lg">
                                At {formatTime(selectedIncident.time)}, AI Unit {selectedIncident.deviceId} identified 
                                high-probability <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">{selectedIncident.aiClass || "Unauthorized"}</span> behavior.
                              </p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                              <span className="font-bold text-primary block text-xs uppercase tracking-wider mb-1">Contextual Factors</span>
                              <p className="text-lg">
                                Pattern matches <span className="font-bold text-primary">{selectedIncident.aiClass || (selectedIncident.alertStatus ? 'CRITICAL' : 'SUSPICIOUS')}</span> signatures 
                                with <span className="text-primary font-bold px-1.5 py-0.5 rounded bg-primary/10">{Math.round(selectedIncident.aiConfidence || 0)}% confidence</span>.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <SummaryStat label="Alert Type" value={selectedIncident.alertType || (selectedIncident.alertStatus ? "THIEF" : "SUSPICIOUS")} color="text-primary" />
                        <SummaryStat label="Detection" value={selectedIncident.aiClass || "Unknown"} color="text-slate-200" />
                        <SummaryStat label="Confidence" value={`${Math.round(selectedIncident.aiConfidence || 0)}%`} color="text-primary" />
                        <SummaryStat label="PIR Status" value={selectedIncident.pirSensor ? `Active (${selectedIncident.pirSensor})` : "Active"} color="text-slate-200" />
                      </div>

                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 text-xs text-slate-400 flex items-start gap-3">
                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block mb-1 uppercase tracking-wider text-[10px] text-slate-300">System Source Note</span>
                          This intelligence report was automatically synthesized using physical telemetry logs and computer vision classification algorithms.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:justify-end gap-2 px-1 pb-4">
            <Button 
              className="gap-2 bg-primary text-primary-foreground h-12 md:h-10 order-first sm:order-none"
              onClick={() => navigate({ to: "/dashboard/response", search: { incidentId: selectedIncident.id } })}
            >
              <Send className="h-4 w-4" /> Response Actions
            </Button>
            
            {selectedIncident.status === 'active' && (
              <Button 
                className="gap-2 bg-warning hover:bg-warning/90 text-warning-foreground h-12 md:h-10"
                onClick={() => handleUpdateStatus('pending')}
              >
                <Activity className="h-4 w-4" /> Mark as Pending
              </Button>
            )}

            {selectedIncident.status === 'pending' && (
              <Button 
                className="gap-2 bg-success hover:bg-success/90 text-success-foreground h-12 md:h-10"
                onClick={() => handleUpdateStatus('solved')}
              >
                <CheckCircle2 className="h-4 w-4" /> Mark as RESOLVED
              </Button>
            )}

            {selectedIncident.status === 'solved' && (
              <Button 
                variant="outline"
                className="gap-2 border-success text-success hover:bg-success/10 h-12 md:h-10"
                disabled
              >
                <ShieldCheck className="h-4 w-4" /> Incident RESOLVED
              </Button>
            )}

            <Button 
              variant="outline" 
              className="gap-2 h-12 md:h-10"
              onClick={handleGenerateReport}
            >
              <FileText className="h-4 w-4" /> Generate Report
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

function SummaryStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1.5 shadow-sm">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`text-sm font-bold break-words whitespace-normal ${color}`}>{value}</span>
    </div>
  );
}

function StatusRow({ label, value, status }: { label: string; value: string; status: "success" | "destructive" | "primary" | "warning" }) {
  const colorMap = {
    success: "text-success",
    destructive: "text-destructive",
    primary: "text-primary",
    warning: "text-warning"
  };
  
  return (
    <div className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className={`text-[11px] font-bold tabular-nums ${colorMap[status]}`}>{value}</span>
    </div>
  );
}
