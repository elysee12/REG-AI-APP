import { useState, useMemo, useEffect } from "react";
import { useDataStore } from "@/lib/data";
import { MiniMap, SeverityPill } from "../../shared/DashboardComponents";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { 
  Search, 
  Filter, 
  MapPin, 
  ShieldAlert, 
  Activity, 
  Phone, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Radio, 
  Battery, 
  Zap, 
  X, 
  Maximize2,
  Camera,
  FileText,
  Siren
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function HQMapPage() {
  const navigate = useNavigate();
  const { devices, branches, incidents, fetchDevices, fetchBranches, fetchIncidents, securityContacts, fetchSecurityContacts } = useDataStore();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  useEffect(() => {
    fetchDevices();
    fetchBranches();
    fetchIncidents();
    fetchSecurityContacts();
  }, [fetchDevices, fetchBranches, fetchIncidents, fetchSecurityContacts]);

  // Enhanced Device Data with Branch Info
  const devicesWithDetails = useMemo(() => {
    return devices.map(d => {
      const branch = branches.find(b => b.id === d.branchId);
      const contacts = securityContacts.filter(c => c.branchId === d.branchId);
      const recentIncidents = incidents.filter(i => i.deviceId === d.id);
      
      return {
        ...d,
        branchName: branch?.name || "Unknown Branch",
        securityContacts: contacts,
        recentIncidents,
        location: {
          lat: d.lat,
          lng: d.lng,
          address: d.address
        }
      };
    });
  }, [devices, branches, securityContacts, incidents]);

  // Filters
  const filteredDevices = useMemo(() => {
    return devicesWithDetails.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
      const matchesBranch = branchFilter === "all" || String(d.branchId) === branchFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "problem" ? (d.incidentStatus === "vandalism" || d.status === "offline") : d.status === "online");
      
      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [devicesWithDetails, search, branchFilter, statusFilter]);

  // Live Incident Feed
  const liveIncidents = useMemo(() => {
    return incidents
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)
      .map(i => {
        const device = devicesWithDetails.find(d => d.id === i.deviceId);
        const severity = i.alertStatus ? 'critical' : 'warning';
        return { ...i, device, severity };
      });
  }, [incidents, devicesWithDetails]);

  const handleMarkerClick = (device: any) => {
    setSelectedDevice(device);
    setSelectedId(device.id);
    setIsDetailsOpen(true);
  };

  const handleIncidentClick = (incident: any) => {
    if (incident.device) {
      setSelectedId(incident.device.id);
      setSelectedDevice(incident.device);
      // Automatically open details for critical incidents
      const severity = incident.alertStatus ? 'critical' : 'warning';
      if (severity === 'critical' || severity === 'high') {
        setIsDetailsOpen(true);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-secondary/10 overflow-hidden">
      {/* Top Filter Bar */}
      <div className="bg-card border-b border-border p-4 flex flex-wrap items-center gap-4 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="font-bold text-lg hidden md:block">National Monitoring</h1>
        </div>

        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search towers or IDs..." 
            className="pl-9 h-10 bg-secondary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[180px] h-10 bg-secondary/20 border-border">
              <Building2 className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-10 bg-secondary/20 border-border">
              <Filter className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online Only</SelectItem>
              <SelectItem value="problem">Problem Sites</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden lg:flex items-center gap-4 ml-4 text-[11px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-success" /> Healthy</div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-warning" /> Problem</div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" /> Active Theft</div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Central Map */}
        <div className="flex-1 relative">
          <MiniMap 
            items={filteredDevices} 
            type="device"
            selectedId={selectedId || undefined}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        {/* Live Incident Side Panel */}
        <div className="w-[350px] bg-card border-l border-border flex flex-col hidden xl:flex">
          <div className="p-4 border-b border-border bg-secondary/10 flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Live Incident Feed
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">LIVE</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {liveIncidents.length > 0 ? (
              liveIncidents.map((i) => (
                <button
                  key={i.id}
                  onClick={() => handleIncidentClick(i)}
                  className={`w-full p-4 text-left hover:bg-secondary/40 transition-colors group relative ${selectedId === i.deviceId ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="h-16 w-16 rounded bg-secondary/50 flex-shrink-0 overflow-hidden border border-border flex items-center justify-center relative">
                      {i.imagePath ? (
                        <img src={i.imagePath} alt="Theft" className="h-full w-full object-cover" />
                      ) : (
                        <Camera className="h-6 w-6 text-muted-foreground opacity-20" />
                      )}
                      <div className="absolute top-1 left-1">
                        <SeverityPill level={i.severity} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{i.deviceId}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-[9px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">{i.ticketId}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" /> {i.device?.branchName || "Unknown Branch"}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {new Date(i.time).toLocaleTimeString()}
                      </div>
                      <div className="mt-2 text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                        <Maximize2 className="h-3 w-3" /> Click to Locate
                      </div>
                    </div>
                  </div>
                  {i.severity === 'critical' && (
                    <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground italic flex flex-col items-center gap-3">
                <CheckCircle2 className="h-8 w-8 opacity-20" />
                <p className="text-sm">No active incidents detected across the network.</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-secondary/10 border-t border-border">
            <Button variant="outline" className="w-full text-xs font-bold gap-2" onClick={() => navigate({ to: '/dashboard/reports' })}>
              <FileText className="h-4 w-4" /> GENERATE NATIONAL REPORT
            </Button>
          </div>
        </div>
      </div>

      {/* Device Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-card">
          <div className="h-2 bg-primary" />
          
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${selectedDevice?.status === 'online' ? 'bg-success' : 'bg-warning'}`} />
                  <span className="font-mono text-xs text-primary font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">{selectedDevice?.id}</span>
                </div>
                <DialogTitle className="text-2xl font-bold">{selectedDevice?.district} Station Area</DialogTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3.5 w-3.5" /> {selectedDevice?.location?.address}
                </p>
              </div>
              <div className="text-right">
                <div className="px-3 py-1 rounded bg-secondary/50 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Branch</p>
                  <p className="font-bold text-primary">{selectedDevice?.branchName}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Live Stream View */}
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-border relative flex items-center justify-center group">
                  {selectedDevice?.ipAddress ? (
                    <iframe 
                      src={`http://10.227.231.210:8000/stream`} 
                      className="w-full h-full border-0"
                      title="Tower Live Stream"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Radio className="h-8 w-8 text-white/20 mx-auto mb-2" />
                      <p className="text-xs text-white/50 italic">Live Feed Offline</p>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-primary/90 text-white text-[10px] font-bold flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE STREAM
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-secondary/30 p-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase mb-1">
                      <Battery className="h-3 w-3" /> Battery
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">92%</span>
                      <div className="h-1.5 w-12 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-success w-[92%]" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase mb-1">
                      <Zap className="h-3 w-3" /> Connectivity
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">4G/LTE</span>
                      <Activity className="h-3.5 w-3.5 text-success" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Contacts & Response */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" /> Branch Security Team
                  </h3>
                  <div className="space-y-2">
                    {selectedDevice?.securityContacts?.length > 0 ? (
                      selectedDevice.securityContacts.map((c: any) => (
                        <div key={c.id} className="p-3 rounded-lg bg-secondary/30 border border-border flex items-center justify-between group hover:border-primary/30 transition-colors">
                          <div>
                            <p className="font-bold text-sm">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground">{c.phone}</p>
                          </div>
                          <a href={`tel:${c.phone}`} className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                            <Phone className="h-4 w-4" />
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic p-4 bg-secondary/20 rounded-lg text-center">No emergency contacts listed for this branch.</p>
                    )}
                  </div>
                </section>

                <div className="space-y-3">
                  <Button className="w-full font-bold h-11 shadow-elevated gap-2">
                    <Siren className="h-4 w-4" /> INITIATE EMERGENCY DISPATCH
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-xs" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedDevice?.location?.lat},${selectedDevice?.location?.lng}`, '_blank')}>
                      <ExternalLink className="h-3.5 w-3.5 mr-2" /> GOOGLE MAPS
                    </Button>
                    <Button variant="ghost" className="h-11 px-4" onClick={() => setIsDetailsOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
