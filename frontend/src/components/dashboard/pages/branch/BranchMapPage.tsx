import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MiniMap, SeverityPill, StatusPill } from "../../shared/DashboardComponents";
import { Filter, Search, MapPin, Camera } from "lucide-react";
import { useDataStore } from "@/lib/data";
import { useAuthStore } from "@/lib/auth";
import { getDistrictCenter } from "@/lib/locations";

export function BranchMapPage() {
  const user = useAuthStore((state) => state.user);
  const { devices, incidents, fetchDevices, fetchIncidents } = useDataStore();
  
  const [search, setSearch] = useState("");
  const [isClustered, setIsClustered] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showCoords, setShowCoords] = useState(false);

  // Default center based on branch name or region
  const branchCenter = useMemo(() => {
    return getDistrictCenter(user?.branchName) || getDistrictCenter(user?.region);
  }, [user]);
  
  // Filters state
  const [filters, setFilters] = useState({
    vandalismOnly: false,
    onlineOnly: true,
  });

  useEffect(() => {
    fetchDevices();
    if (user?.branchId) {
      fetchIncidents(String(user.branchId));
    } else {
      fetchIncidents();
    }
  }, [fetchDevices, fetchIncidents, user]);

  // Enrich devices with real-time incident status
  const enrichedDevices = useMemo(() => {
    return devices.map(device => {
      // A device has a 'vandalism' status if there's any active or pending incident for it
      const hasActiveIncident = incidents.some(
        i => i.deviceId === device.id && (i.status === 'active' || i.status === 'pending')
      );
      
      return {
        ...device,
        incidentStatus: hasActiveIncident ? 'vandalism' : 'safe'
      };
    });
  }, [devices, incidents]);

  const branchDevices = useMemo(() => {
    return enrichedDevices.filter(d => d.branchName === user?.branchName);
  }, [enrichedDevices, user]);

  const displayedSelectedDevice = useMemo(() => {
    if (!selectedDevice) return null;
    return enrichedDevices.find(d => d.id === selectedDevice.id) || selectedDevice;
  }, [selectedDevice, enrichedDevices]);

  const filteredDevices = useMemo(() => {
    return branchDevices.filter(d => {
      const matchesSearch = d.id.toLowerCase().includes(search.toLowerCase());
      const matchesVandalism = !filters.vandalismOnly || d.incidentStatus === 'vandalism';
      const matchesOnline = !filters.onlineOnly || d.status === 'online';
      return matchesSearch && matchesVandalism && matchesOnline;
    });
  }, [branchDevices, search, filters]);

  const handleRecenter = () => {
    setSearch("");
    setSelectedDevice(null);
    setIsClustered(false);
    setFilters({
      vandalismOnly: false,
      onlineOnly: true,
    });
  };

  return (
    <div className="p-2 md:p-6 grid grid-cols-1 xl:grid-cols-4 gap-3 md:gap-4 h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* Filters/Search - Hide on mobile if device selected */}
      <aside className={`bg-card border border-border rounded-xl shadow-card p-4 xl:col-span-1 overflow-y-auto ${selectedDevice ? "hidden xl:block" : "block"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="font-bold tracking-tight">Branch Monitoring</h2>
          </div>
          {(search || filters.vandalismOnly || !filters.onlineOnly) && (
            <button onClick={handleRecenter} className="text-[10px] text-primary hover:underline font-black uppercase">Reset</button>
          )}
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search Serial Number..." 
            className="pl-9 h-11 md:h-10 text-sm font-medium" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Filters</div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm font-bold cursor-pointer p-3 rounded-lg hover:bg-secondary/40 transition-colors border border-transparent hover:border-border">
                <input 
                  type="checkbox" 
                  checked={filters.vandalismOnly} 
                  onChange={(e) => setFilters({...filters, vandalismOnly: e.target.checked})}
                  className="accent-primary h-4 w-4"
                />
                Show Vandalism Alerts
              </label>
              <label className="flex items-center gap-3 text-sm font-bold cursor-pointer p-3 rounded-lg hover:bg-secondary/40 transition-colors border border-transparent hover:border-border">
                <input 
                  type="checkbox" 
                  checked={filters.onlineOnly} 
                  onChange={(e) => setFilters({...filters, onlineOnly: e.target.checked})}
                  className="accent-primary h-4 w-4"
                />
                Online Units Only
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Branch Units ({filteredDevices.length})</div>
            <div className="space-y-2 pb-4">
              {filteredDevices.map(device => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedDevice?.id === device.id 
                      ? "bg-primary/10 border-primary shadow-md ring-1 ring-primary/20" 
                      : "bg-secondary/20 border-transparent hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Camera className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-xs tracking-tight">{device.id}</span>
                        {device.ipAddress && (
                          <span className="text-[9px] font-mono text-muted-foreground font-bold">IP: {device.ipAddress}</span>
                        )}
                      </div>
                    </div>
                    <div className={`h-2.5 w-2.5 rounded-full ${device.incidentStatus === 'vandalism' ? 'bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-success'}`} />
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground truncate font-medium">
                    {device.location.address}
                  </div>
                </button>
              ))}
              {filteredDevices.length === 0 && (
                <div className="text-center py-10 text-xs text-muted-foreground italic font-medium opacity-50">
                  No units matching filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Map */}
      <div className={`xl:col-span-3 bg-card border border-border rounded-xl shadow-card flex flex-col overflow-hidden ${selectedDevice ? "flex" : "hidden xl:flex"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border-b border-border bg-secondary/5 gap-3">
          <div>
            <h2 className="font-black text-foreground tracking-tight flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {user?.branchName} Security Map
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
              {branchDevices.length} Total Units · <span className="text-primary">{branchDevices.filter(d => d.incidentStatus === 'vandalism').length} Critical Alerts</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isClustered ? "default" : "outline"} 
              size="sm" 
              className={`flex-1 sm:flex-none gap-2 h-9 text-[10px] font-black uppercase tracking-widest ${isClustered ? "bg-primary text-primary-foreground shadow-md" : ""}`}
              onClick={() => setIsClustered(!isClustered)}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${isClustered ? "bg-white animate-pulse" : "bg-muted-foreground"}`} />
              Cluster
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 sm:flex-none gap-2 h-9 text-[10px] font-black uppercase tracking-widest hover:bg-secondary"
              onClick={handleRecenter}
            >
              <MapPin className="h-3.5 w-3.5" />
              Recenter
            </Button>
          </div>
        </div>
        <div className="flex-1 grid grid-rows-[1fr_auto] relative">
          <div className="relative w-full h-full min-h-[300px]">
            <MiniMap 
              items={filteredDevices} 
              type="device" 
              isClustered={isClustered}
              onMarkerClick={setSelectedDevice}
              selectedId={selectedDevice?.id}
              center={branchCenter || undefined}
            />
          </div>
          {/* Bottom detail card */}
          {displayedSelectedDevice && (
            <div className="border-t border-border p-4 bg-card/95 backdrop-blur-md animate-in slide-in-from-bottom-full duration-500 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {displayedSelectedDevice.incidentStatus === 'vandalism' ? (
                      <SeverityPill level="critical" />
                    ) : (
                      <StatusPill status="solved" />
                    )}
                    <span className="font-mono text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded tracking-widest">{displayedSelectedDevice.id}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${displayedSelectedDevice.status === 'online' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {displayedSelectedDevice.status}
                    </span>
                    {displayedSelectedDevice.ipAddress && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                        {displayedSelectedDevice.ipAddress}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Location Hub</span>
                      <span className="text-sm font-black text-foreground tracking-tight">{displayedSelectedDevice.district} Station — {displayedSelectedDevice.cell || 'Main Site'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Live Coordinates</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-primary">GPS: {displayedSelectedDevice.location.lat.toFixed(6)}, {displayedSelectedDevice.location.lng.toFixed(6)}</span>
                        <button 
                          className="text-[10px] font-black text-primary hover:underline uppercase tracking-tighter"
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${displayedSelectedDevice.location.lat},${displayedSelectedDevice.location.lng}`, '_blank')}
                        >
                          Navigate →
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[11px] font-bold text-muted-foreground mt-3 italic leading-snug">
                    <MapPin className="h-3 w-3 inline mr-1 text-primary" />
                    {displayedSelectedDevice.location.address}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border sm:border-0 sm:pt-0">
                  <Button variant="outline" className="flex-1 h-11 md:h-9 font-black uppercase tracking-widest text-[10px] gap-2" onClick={() => window.location.href='/dashboard/incidents'}>
                    <Camera className="h-3.5 w-3.5" /> View Incidents
                  </Button>
                  <Button className="flex-1 h-11 md:h-9 font-black uppercase tracking-widest text-[10px] bg-foreground text-background" onClick={() => setSelectedDevice(null)}>
                    Close Panel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

