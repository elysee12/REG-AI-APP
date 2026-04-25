import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MiniMap, SeverityPill, StatusPill } from "../../shared/DashboardComponents";
import { Filter, Search, MapPin, Camera } from "lucide-react";
import { useDataStore } from "@/lib/data";
import { useAuthStore } from "@/lib/auth";

export function BranchMapPage() {
  const user = useAuthStore((state) => state.user);
  const { devices } = useDataStore();
  
  const [search, setSearch] = useState("");
  const [isClustered, setIsClustered] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    vandalismOnly: false,
    onlineOnly: true,
  });

  const branchDevices = useMemo(() => {
    return devices.filter(d => d.branchName === user?.branchName);
  }, [devices, user]);

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
    <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-4 gap-4 h-[calc(100vh-4rem)]">
      {/* Filters/Search */}
      <aside className="bg-card border border-border rounded-xl shadow-card p-4 xl:col-span-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Local Monitoring</h2>
          </div>
          {(search || filters.vandalismOnly || !filters.onlineOnly) && (
            <button onClick={handleRecenter} className="text-[10px] text-primary hover:underline font-bold">Reset All</button>
          )}
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search Serial Number..." 
            className="pl-9 h-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Filters</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-secondary/40 transition-colors">
                <input 
                  type="checkbox" 
                  checked={filters.vandalismOnly} 
                  onChange={(e) => setFilters({...filters, vandalismOnly: e.target.checked})}
                  className="accent-primary"
                />
                Show Vandalism Alerts
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-secondary/40 transition-colors">
                <input 
                  type="checkbox" 
                  checked={filters.onlineOnly} 
                  onChange={(e) => setFilters({...filters, onlineOnly: e.target.checked})}
                  className="accent-primary"
                />
                Online Units Only
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branch Units ({filteredDevices.length})</div>
            <div className="space-y-2">
              {filteredDevices.map(device => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedDevice?.id === device.id 
                      ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20" 
                      : "bg-secondary/20 border-transparent hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-3.5 w-3.5 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-xs">{device.id}</span>
                        {device.ipAddress && (
                          <span className="text-[8px] font-mono text-muted-foreground">IP: {device.ipAddress}</span>
                        )}
                      </div>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${device.incidentStatus === 'vandalism' ? 'bg-primary animate-pulse' : 'bg-success'}`} />
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground truncate">
                    {device.location.address}
                  </div>
                </button>
              ))}
              {filteredDevices.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground italic">
                  No units matching filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Map */}
      <div className="xl:col-span-3 bg-card border border-border rounded-xl shadow-card flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-semibold">Branch Security Map — {user?.branchName}</h2>
            <p className="text-xs text-muted-foreground">{branchDevices.length} total units · {branchDevices.filter(d => d.incidentStatus === 'vandalism').length} active alerts</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isClustered ? "default" : "outline"} 
              size="sm" 
              className={`gap-2 ${isClustered ? "bg-primary text-primary-foreground shadow-md" : ""}`}
              onClick={() => setIsClustered(!isClustered)}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${isClustered ? "bg-white animate-pulse" : "bg-muted-foreground"}`} />
              Cluster view
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 hover:bg-secondary"
              onClick={handleRecenter}
            >
              <MapPin className="h-3.5 w-3.5" />
              Recenter Map
            </Button>
          </div>
        </div>
        <div className="flex-1 grid grid-rows-[1fr_auto]">
          <div className="relative">
            <MiniMap 
              items={filteredDevices} 
              type="device" 
              isClustered={isClustered}
              onMarkerClick={setSelectedDevice}
              selectedId={selectedDevice?.id}
            />
          </div>
          {/* Bottom detail card */}
          {selectedDevice && (
            <div className="border-t border-border p-4 bg-secondary/40 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {selectedDevice.incidentStatus === 'vandalism' ? (
                      <SeverityPill level="critical" />
                    ) : (
                      <StatusPill status="resolved" />
                    )}
                    <span className="font-mono text-xs text-muted-foreground">{selectedDevice.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedDevice.status === 'online' ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted-foreground'}`}>
                      {selectedDevice.status.toUpperCase()}
                    </span>
                    {selectedDevice.ipAddress && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                        {selectedDevice.ipAddress}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 font-semibold">AI Unit Location</h3>
                  <p className="text-xs text-muted-foreground">{selectedDevice.location.address}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Last Data: {selectedDevice.lastData}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.location.href='/dashboard/incidents'}>View Incidents</Button>
                  <Button size="sm" onClick={() => setSelectedDevice(null)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
