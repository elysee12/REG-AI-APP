import { useState, useMemo, useEffect } from "react";
import { useDataStore } from "@/lib/data";
import { MiniMap, SeverityPill } from "../../shared/DashboardComponents";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { getDistrictCenter } from "@/lib/locations";
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
  const [showCoords, setShowCoords] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchBranches();
    fetchIncidents();
    fetchSecurityContacts();
  }, [fetchDevices, fetchBranches, fetchIncidents, fetchSecurityContacts]);

  // Enhanced Branch Data for Map
  const branchesWithStatus = useMemo(() => {
    return branches.map(branch => {
      // Find all devices for this branch
      const branchDevices = devices.filter(d => String(d.branchId) === String(branch.id));
      
      // Check if any device in this branch has an active incident
      const hasIncident = incidents.some(i => 
        branchDevices.some(d => d.id === i.deviceId) && 
        (i.status === 'active' || i.status === 'pending')
      );

      // Extract district from address for coordinates
      const addressParts = branch.address.split(', ');
      const districtName = addressParts[2] || branch.region;
      const coords = getDistrictCenter(districtName) || getDistrictCenter(branch.region);

      return {
        ...branch,
        id: String(branch.id),
        hasIncident,
        status: hasIncident ? 'vandalism' : 'online',
        location: {
          lat: coords?.lat || -1.9441,
          lng: coords?.lng || 30.0619,
          address: branch.address
        },
        deviceCount: branchDevices.length,
        activeIncidents: incidents.filter(i => 
          branchDevices.some(d => d.id === i.deviceId) && 
          (i.status === 'active' || i.status === 'pending')
        ).length
      };
    });
  }, [branches, devices, incidents]);

  // Filters for branches
  const filteredBranches = useMemo(() => {
    return branchesWithStatus.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.region.toLowerCase().includes(search.toLowerCase());
      const matchesBranch = branchFilter === "all" || String(b.id) === branchFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "problem" ? b.hasIncident : !b.hasIncident);
      
      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [branchesWithStatus, search, branchFilter, statusFilter]);

  // Live Incident Feed
  const liveIncidents = useMemo(() => {
    return incidents
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)
      .map(i => {
        const device = devices.find(d => d.id === i.deviceId);
        const branch = branches.find(b => String(b.id) === String(device?.branchId));
        const severity = i.alertStatus ? 'critical' : 'warning';
        return { ...i, device, branch, severity };
      });
  }, [incidents, devices, branches]);

  const handleMarkerClick = (branch: any) => {
    setSelectedDevice(branch); // Using selectedDevice state for branch details too
    setSelectedId(branch.id);
    setIsDetailsOpen(true);
  };

  const handleIncidentClick = (incident: any) => {
    if (incident.branch) {
      const branchOnMap = branchesWithStatus.find(b => b.id === incident.branch.id);
      if (branchOnMap) {
        setSelectedId(branchOnMap.id);
        setSelectedDevice(branchOnMap);
        // Automatically open details for critical incidents
        if (incident.severity === 'critical') {
          setIsDetailsOpen(true);
        }
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
              <SelectItem value="online">Healthy Only</SelectItem>
              <SelectItem value="problem">Alert Branches</SelectItem>
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
            items={filteredBranches} 
            type="branch"
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
                  <span className={`h-2.5 w-2.5 rounded-full ${!selectedDevice?.hasIncident ? 'bg-success' : 'bg-destructive animate-pulse'}`} />
                  <span className="font-mono text-xs text-primary font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">BRANCH-{selectedDevice?.id}</span>
                </div>
                <DialogTitle className="text-2xl font-bold">{selectedDevice?.name}</DialogTitle>
                <div className="flex flex-col gap-1 mt-1">
                  <button 
                    onClick={() => setShowCoords(!showCoords)}
                    className="text-sm text-muted-foreground flex items-center gap-1.5 hover:text-primary transition-colors text-left group w-fit"
                  >
                    <MapPin className={`h-3.5 w-3.5 ${showCoords ? 'text-primary' : ''}`} /> 
                    <span className="group-hover:underline">{selectedDevice?.location?.address}</span>
                  </button>
                  {showCoords && (
                    <div className="flex items-center gap-2 p-2 rounded bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-1 duration-200 w-fit">
                      <div className="text-[10px] font-mono text-primary font-bold">
                        GPS: {selectedDevice?.location?.lat.toFixed(6)}, {selectedDevice?.location?.lng.toFixed(6)}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 px-1.5 text-[9px] gap-1 hover:bg-primary/20 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps/search/?api=1&query=${selectedDevice?.location?.lat},${selectedDevice?.location?.lng}`, '_blank');
                        }}
                      >
                        <ExternalLink className="h-2.5 w-2.5" /> LIVE MAP
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="px-3 py-1 rounded bg-secondary/50 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Region</p>
                  <p className="font-bold text-primary">{selectedDevice?.region}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Branch Stats & Status */}
              <div className="space-y-4">
                <div className="bg-secondary/30 p-4 rounded-xl border border-border/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Total AI Units</span>
                    </div>
                    <span className="font-bold text-lg">{selectedDevice?.deviceCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-semibold">Active Alerts</span>
                    </div>
                    <span className={`font-bold text-lg ${selectedDevice?.activeIncidents > 0 ? 'text-destructive' : 'text-success'}`}>
                      {selectedDevice?.activeIncidents || 0}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground mb-1">
                      <span>Network Health</span>
                      <span>{selectedDevice?.hasIncident ? '65%' : '100%'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${selectedDevice?.hasIncident ? 'bg-warning w-[65%]' : 'bg-success w-full'}`} />
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <h4 className="text-[10px] font-bold uppercase text-primary mb-2">Live Status Summary</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {selectedDevice?.hasIncident 
                      ? `ATTENTION: ${selectedDevice.activeIncidents} active security breaches detected in ${selectedDevice.name}. Emergency protocols recommended.`
                      : `All ${selectedDevice?.deviceCount || 0} AI surveillance units in ${selectedDevice?.name} are reporting normal activity. Area is secure.`}
                  </p>
                </div>
              </div>

              {/* Security Contacts & Response */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary" /> Branch Management
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border flex items-center justify-between group hover:border-primary/30 transition-colors">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Contact Person</p>
                        <p className="font-bold text-sm">Branch Manager</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary/10 text-primary">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </section>

                <div className="space-y-3">
                  <Button className="w-full font-bold h-11 shadow-elevated gap-2" onClick={() => navigate({ to: '/dashboard/branches' })}>
                    <Building2 className="h-4 w-4" /> MANAGE BRANCH ASSETS
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
