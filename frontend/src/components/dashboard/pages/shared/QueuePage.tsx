import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SeverityPill, StatusPill } from "../../shared/DashboardComponents";
import { Download, Filter, Search, X, Camera, MapPin, ShieldCheck, Clock, ExternalLink } from "lucide-react";
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

  useEffect(() => {
    fetchDevices();
    const branchId = user?.role === 'BRANCH_USER' && user.branchId ? String(user.branchId) : undefined;
    fetchIncidents(branchId);
  }, [fetchDevices, fetchIncidents, user]);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const status = (incident.status || "").toLowerCase();
      
      // Search filter
      const matchesSearch = search === "" || 
        incident.id.toLowerCase().includes(search.toLowerCase()) ||
        incident.location.toLowerCase().includes(search.toLowerCase()) ||
        incident.type.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status tab filter (top tabs: All, Pending, Active)
      if (statusFilter !== "all" && status !== statusFilter.toLowerCase()) return false;

      // Quick filters (pills: False Alarm, Closed Incident, Acknowledgment, In Progress)
      // Only apply if at least one pill is selected
      if (activeFilters.length > 0) {
        const matchesPill = activeFilters.some(filter => {
          if (filter === "False Alarm") return status === "dispatched";
          if (filter === "Closed Incident") return status === "resolved";
          if (filter === "Acknowledgment") return status === "pending";
          if (filter === "In Progress") return status === "active";
          return false;
        });
        if (!matchesPill) return false;
      }

      return true;
    });
  }, [incidents, search, activeFilters, statusFilter]);

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
      setSelectedIncident({ ...selectedIncident, status: newStatus.toLowerCase() });
    } else {
      toast.error("Failed to update status");
    }
    setIsUpdatingStatus(false);
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
            {["all", "pending", "active"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s === "all" ? "All" : s === "pending" ? "Pending" : "Active"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
        <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-border bg-secondary/40 text-xs">
          {["False Alarm", "Closed Incident", "Acknowledgment", "In Progress"].map((t) => (
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
                <th className="px-4 py-2.5 w-10"><Checkbox /></th>
                <th className="text-left px-4 py-2.5 font-medium">Priority</th>
                <th className="text-left px-4 py-2.5 font-medium">ID</th>
                <th className="text-left px-4 py-2.5 font-medium">Site</th>
                <th className="text-left px-4 py-2.5 font-medium">Category</th>
                <th className="text-left px-4 py-2.5 font-medium">Detected</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3"><Checkbox /></td>
                    <td className="px-4 py-3"><PriorityBadge severity={r.severity} /></td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{r.id.split('-')[0]}</td>
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{r.location}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.type} <SeverityPill level={r.severity} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-primary hover:text-primary hover:bg-primary/10 font-bold"
                        onClick={() => handleOpenDetail(r)}
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    No incidents match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filteredIncidents.length} of {incidents.length} incidents</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">Acknowledge selected</Button>
            <Button size="sm" variant="outline">Export Selected</Button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <SeverityPill level={selectedIncident?.severity || "medium"} />
                <span className="font-mono text-xs text-muted-foreground uppercase">{selectedIncident?.id}</span>
              </div>
              <StatusPill status={selectedIncident?.status || "pending"} />
            </div>
            <DialogTitle className="text-2xl font-bold">
              {selectedIncident?.type} Alert
            </DialogTitle>
            <DialogDescription>
              Incident detected at {selectedIncident?.location}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
            </div>

            {/* Security & Status */}
            <div className="space-y-4">
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
                <Label className="text-sm font-bold mb-3 block">Update Incident Status</Label>
                <Select 
                  disabled={isUpdatingStatus}
                  onValueChange={handleStatusChange}
                  value={selectedIncident?.status.toUpperCase()}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Change status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending (Unacknowledged)</SelectItem>
                    <SelectItem value="ACTIVE">Active (In Progress)</SelectItem>
                    <SelectItem value="DISPATCHED">Dispatched (False Alarm)</SelectItem>
                    <SelectItem value="RESOLVED">Resolved (Closed)</SelectItem>
                  </SelectContent>
                </Select>
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

function DetailRow({ label, value, tone }: { label: string; value: string; tone?: "success" | "critical" }) {
  const toneClass = tone === "success" ? "text-success font-bold" : tone === "critical" ? "text-primary font-bold" : "text-foreground font-medium";
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className={toneClass}>{value}</span>
    </div>
  );
}
