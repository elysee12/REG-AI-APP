import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SeverityPill, StatusPill, Pagination } from "../../shared/DashboardComponents";
import { Download, Filter, Search, X, Camera, MapPin, ShieldCheck, Clock, ExternalLink, Video, Image as ImageIcon, Activity, AlertTriangle, Loader2 } from "lucide-react";
import { useDataStore } from "@/lib/data";
import { useAuthStore } from "@/lib/auth";
import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function QueuePage() {
  const { incidents, devices, fetchIncidents, fetchDevices, updateIncidentStatus } = useDataStore();
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    fetchDevices();
    // HQ Users fetch all incidents for the global queue
    const branchId = user?.role === 'BRANCH_USER' && user.branchId ? String(user.branchId) : undefined;
    fetchIncidents(branchId);
  }, [fetchDevices, fetchIncidents, user?.role, user?.branchId]);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      // Role-based data privacy filtering
      if (user?.role === 'BRANCH_USER' && user.branchId && String(incident.branchId) !== String(user.branchId)) {
        return false;
      }

      // Search filter
      const matchesSearch = search === "" || 
        incident.id.toLowerCase().includes(search.toLowerCase()) ||
        incident.location.toLowerCase().includes(search.toLowerCase()) ||
        (incident.aiClass || "").toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      // Filter by status (tabs)
      if (statusFilter !== "all" && incident.status !== statusFilter) return false;

      // Active button filters
      if (activeFilters.length > 0) {
        const statusMap: Record<string, string> = {
          "False Alarm": "false_alarm",
          "In Progress": "pending",
          "Acknowledgment": "active" // Assuming acknowledgment means active but seen
        };
        
        const matchingStatus = activeFilters.map(f => statusMap[f]).filter(Boolean);
        if (matchingStatus.length > 0 && !matchingStatus.includes(incident.status)) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, search, statusFilter, activeFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, activeFilters]);

  const totalPages = Math.ceil(filteredIncidents.length / rowsPerPage);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleOpenDetail = (incident: any) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedIncident) return;
    setIsUpdatingStatus(true);
    const success = await updateIncidentStatus(selectedIncident.id, newStatus);
    if (success) {
      toast.success(`Incident status updated to ${newStatus}`);
      setIsModalOpen(false);
    } else {
      toast.error("Failed to update status");
    }
    setIsUpdatingStatus(false);
  };

  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedIncidents.length === 0) return;
    setIsUpdatingStatus(true);
    let successCount = 0;
    for (const id of selectedIncidents) {
      const success = await updateIncidentStatus(id, newStatus);
      if (success) successCount++;
    }
    if (successCount > 0) {
      toast.success(`Updated ${successCount} incidents to ${newStatus}`);
      setSelectedIncidents([]);
    } else {
      toast.error("Failed to update incidents");
    }
    setIsUpdatingStatus(false);
  };

  const toggleSelectIncident = (id: string) => {
    setSelectedIncidents(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIncidents.length === filteredIncidents.length) {
      setSelectedIncidents([]);
    } else {
      setSelectedIncidents(filteredIncidents.map(i => i.id));
    }
  };

  const associatedDevice = selectedIncident ? devices.find(d => d.id === selectedIncident.deviceId) : null;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-card border border-border rounded-xl shadow-card">
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-border">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search incident ID, site or type…" 
              className="pl-9" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-secondary/40 p-1 rounded-lg border border-border">
            {["all", "active", "pending", "solved"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s === "solved" ? "RESOLVED" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
        <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-border bg-secondary/40 text-xs">
          {["False Alarm", "Acknowledgment", "In Progress"].map((t) => (
            <button 
              key={t} 
              onClick={() => toggleFilter(t)}
              className={`px-3 py-1 rounded-full border transition-colors ${activeFilters.includes(t) ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm" : "bg-card border-border hover:border-primary/40 text-muted-foreground font-medium"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-secondary/40">
              <tr>
                <th className="px-4 py-2.5 w-10">
                  <Checkbox 
                    checked={filteredIncidents.length > 0 && selectedIncidents.length === filteredIncidents.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left px-4 py-2.5 font-medium">Ticket ID</th>
                <th className="text-left px-4 py-2.5 font-medium">Alert Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Incident Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Device ID</th>
                <th className="text-left px-4 py-2.5 font-medium">AI Classification</th>
                <th className="text-left px-4 py-2.5 font-medium">Confidence</th>
                <th className="text-left px-4 py-2.5 font-medium">Site</th>
                <th className="text-left px-4 py-2.5 font-medium">Detected</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIncidents.length > 0 ? (
                paginatedIncidents.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3">
                      <Checkbox 
                        checked={selectedIncidents.includes(r.id)}
                        onCheckedChange={() => toggleSelectIncident(r.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">{r.ticketId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${r.alertStatus ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"}`}>
                        {r.aiClass || (r.alertStatus ? "ALERT" : "SUSPICIOUS")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{r.deviceId}</td>
                    <td className="px-4 py-3">
                      <AiClassBadge aiClass={r.aiClass} />
                    </td>
                    <td className="px-4 py-3">
                      {r.aiConfidence ? (
                        <span className={`text-xs font-bold ${
                          r.aiConfidence >= 80 ? 'text-primary' : 
                          r.aiConfidence >= 50 ? 'text-warning' : 'text-muted-foreground'
                        }`}>
                          {Math.round(r.aiConfidence)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{r.location.split(' · ')[1]} Station Area</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-primary hover:text-primary hover:bg-primary/10 font-bold"
                        onClick={() => handleOpenDetail(r)}
                      >
                        VIEW
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    No incidents match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filteredIncidents.length} of {incidents.length} incidents {selectedIncidents.length > 0 && `(${selectedIncidents.length} selected)`}</span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              disabled={selectedIncidents.length === 0 || isUpdatingStatus}
              onClick={() => handleBatchStatusChange('active')}
            >
              Acknowledge selected
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              disabled={selectedIncidents.length === 0 || isUpdatingStatus}
              onClick={() => handleBatchStatusChange('false_alarm')}
            >
              Mark False Alarm
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedIncident?.alertStatus ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"}`}>
                  {selectedIncident?.aiClass || (selectedIncident?.alertStatus ? "ALERT" : "SUSPICIOUS")}
                </span>
                <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">{selectedIncident?.ticketId}</span>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold">
              {(selectedIncident?.aiClass || "AI Detection")} Alert — {selectedIncident?.deviceId}
            </DialogTitle>
            <DialogDescription>
              Incident detected at {selectedIncident?.location.split(' · ')[1]} Station Area
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* AI Detection Data */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Activity className="h-4 w-4" /> AI Detection Analysis
              </h3>
              <div className="bg-secondary/40 rounded-lg p-4 space-y-3">
                <DetailRow label="AI Classification" value={selectedIncident?.aiClass || "N/A"} />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className={`font-bold ${
                    (selectedIncident?.aiConfidence || 0) >= 0.8 ? 'text-primary' : 
                    (selectedIncident?.aiConfidence || 0) >= 0.5 ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    {selectedIncident?.aiConfidence ? `${(selectedIncident.aiConfidence * 100).toFixed(1)}%` : "N/A"}
                  </span>
                </div>
                <DetailRow label="Alert Status" value={selectedIncident?.aiClass || (selectedIncident?.alertStatus ? "ALERT" : "SUSPICIOUS")} />
              </div>

              {/* Media Section */}
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Evidence Media
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {selectedIncident?.videoPath ? (
                  <div className="relative group rounded-lg overflow-hidden border border-border bg-black aspect-video">
                    <video 
                      key={selectedIncident.videoPath}
                      className="w-full h-full object-contain"
                      muted
                      playsInline
                      controls
                      autoPlay
                      preload="auto"
                      crossOrigin="anonymous"
                    >
                      <source 
                        src={`http://${window.location.hostname}:3000${selectedIncident.videoPath}`} 
                        type="video/mp4" 
                      />
                      Your browser does not support the video tag.
                    </video>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 z-10">
                      <span className="text-white text-[10px] flex items-center gap-1">
                        <Video className="h-3 w-3" /> Clip Video
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                    <span className="text-muted-foreground text-xs">No video evidence available</span>
                  </div>
                )}
              </div>
              {selectedIncident?.sourceNote && (
                <div className="text-xs text-muted-foreground italic px-1">
                  Source: {selectedIncident.sourceNote}
                </div>
              )}
            </div>

            {/* Device Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Camera className="h-4 w-4" /> Device Details
              </h3>
              <div className="bg-secondary/40 rounded-lg p-4 space-y-3">
                <DetailRow label="Device ID" value={associatedDevice?.id || selectedIncident?.deviceId} />
                <DetailRow label="Device Name" value={associatedDevice?.name || "N/A"} />
                <DetailRow label="IP Address" value={associatedDevice?.ipAddress || "N/A"} />
                <DetailRow label="Live Status" value={associatedDevice?.status.toUpperCase() || "UNKNOWN"} tone={associatedDevice?.status === 'online' ? "success" : "critical"} />
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Geographical Info
              </h3>
              <div className="bg-secondary/40 rounded-lg p-4 space-y-3">
                <DetailRow label="Full Address" value={associatedDevice?.location.address || "N/A"} />
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground font-mono">
                    {associatedDevice?.location.lat.toFixed(6)}, {associatedDevice?.location.lng.toFixed(6)}
                  </span>
                  {associatedDevice && (
                    <a 
                      href={`https://www.google.com/maps?q=${associatedDevice.location.lat},${associatedDevice.location.lng}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      MAP VIEW <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Workflow Management
              </h3>
              <div className="bg-secondary/40 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Current Status:</span>
                  <StatusPill status={selectedIncident?.status} />
                </div>
                <div className="pt-2 grid grid-cols-1 gap-2">
                  <Button 
                    className="w-full bg-muted hover:bg-muted/90 text-muted-foreground h-9 text-xs font-bold border border-border"
                    onClick={() => handleStatusChange('false_alarm')}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as False Alarm"}
                  </Button>
                  {selectedIncident?.status === 'active' && (
                    <Button 
                      className="w-full bg-warning hover:bg-warning/90 text-warning-foreground h-9 text-xs font-bold"
                      onClick={() => handleStatusChange('pending')}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as In Progress"}
                    </Button>
                  )}
                  {(selectedIncident?.status === 'active' || selectedIncident?.status === 'pending') && (
                    <Button 
                      className="w-full bg-success hover:bg-success/90 text-success-foreground h-9 text-xs font-bold"
                      onClick={() => handleStatusChange('solved')}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as RESOLVED"}
                    </Button>
                  )}
                  {selectedIncident?.status === 'solved' && (
                    <Button 
                      variant="outline" 
                      className="w-full border-success text-success h-9 text-xs font-bold"
                      disabled
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" /> Incident RESOLVED
                    </Button>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Security Personnel
              </h3>
              <div className="space-y-2">
                {associatedDevice?.securityContacts && associatedDevice.securityContacts.length > 0 ? (
                  associatedDevice.securityContacts.map((contact: any) => (
                    <div key={contact.id} className="bg-secondary/40 rounded-lg p-3 border border-border">
                      <div className="text-sm font-bold">{contact.name}</div>
                      <div className="text-xs text-muted-foreground">{contact.phone}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground italic p-4 border border-dashed border-border rounded-lg text-center">
                    No contacts linked to this area
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-border mt-6">
                <p className="text-xs text-muted-foreground italic text-center">
                  Incident lifecycle is managed by authorized branch personnel.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PriorityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; class: string }> = {
    critical: { label: "P1", class: "bg-primary text-primary-foreground" },
    high: { label: "P1", class: "bg-primary/80 text-primary-foreground" },
    medium: { label: "P2", class: "bg-warning text-warning-foreground" },
    low: { label: "P3", class: "bg-secondary text-foreground border border-border" },
  };
  const config = map[severity.toLowerCase()] || map.medium;
  return <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold ${config.class}`}>{config.label}</span>;
}

function AiClassBadge({ aiClass }: { aiClass?: string }) {
  const normalizedClass = aiClass?.toString().trim().toUpperCase();
  const map: Record<string, { label: string; class: string }> = {
    VANDAL: { label: "VANDAL", class: "bg-primary/15 text-primary border-primary/30" },
    CLIMBING: { label: "CLIMBING", class: "bg-warning/15 text-warning border-warning/30" },
    CUTTING_WIRES: { label: "CUTTING WIRES", class: "bg-primary/15 text-primary border-primary/30" },
    OPENING_BOX: { label: "OPENING BOX", class: "bg-primary/15 text-primary border-primary/30" },
    SUSPICIOUS: { label: "SUSPICIOUS", class: "bg-warning/15 text-warning border-warning/30" },
  };
  const config = normalizedClass ? map[normalizedClass] : null;
  if (!config) return <span className="text-xs text-muted-foreground">{aiClass || "-"}</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${config.class}`}>
      {config.label}
    </span>
  );
}

function DetailRow({ label, value, tone }: { label: string; value: string; tone?: "success" | "critical" }) {
  const toneClass = tone === "success" ? "text-success font-bold" : tone === "critical" ? "text-primary font-bold" : "text-foreground font-medium";
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className={toneClass}>{value}</span>
    </div>
  );
}
