import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MiniMap, SeverityPill, StatusPill } from "../../shared/DashboardComponents";
import { Filter, Search, MapPin } from "lucide-react";
import { useDataStore } from "@/lib/data";

export function HQMapPage() {
  const { branches, devices } = useDataStore();
  const [search, setSearch] = useState("");
  const [isClustered, setIsClustered] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  // Enhance branches with incident status
  const branchesWithStatus = useMemo(() => {
    return branches.map(branch => {
      const branchDevices = devices.filter(d => d.branchId === branch.id);
      const hasIncident = branchDevices.some(d => d.incidentStatus === 'vandalism');
      return { ...branch, hasIncident, deviceCount: branchDevices.length };
    });
  }, [branches, devices]);

  const filteredBranches = branchesWithStatus.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRecenter = () => {
    setSearch("");
    setSelectedBranch(null);
    setIsClustered(false);
  };

  return (
    <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-4 gap-4 h-[calc(100vh-4rem)]">
      {/* Filters/Search */}
      <aside className="bg-card border border-border rounded-xl shadow-card p-4 xl:col-span-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Search Branches</h2>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search branch name..." 
            className="pl-9 h-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">National Network</div>
            {search && (
              <button onClick={() => setSearch("")} className="text-[10px] text-primary hover:underline font-bold">Clear</button>
            )}
          </div>
          <div className="space-y-2">
            {filteredBranches.map(branch => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedBranch?.id === branch.id 
                    ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20" 
                    : "bg-secondary/20 border-transparent hover:bg-secondary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{branch.name}</span>
                  <div className={`h-2 w-2 rounded-full ${branch.hasIncident ? 'bg-primary animate-pulse' : 'bg-success'}`} />
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{branch.region} Region</span>
                  <span className="ml-auto">{branch.deviceCount} units</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Map */}
      <div className="xl:col-span-3 bg-card border border-border rounded-xl shadow-card flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-semibold">National Infrastructure Map</h2>
            <p className="text-xs text-muted-foreground">{branches.length} branches · {devices.length} AI units active</p>
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
              items={filteredBranches} 
              type="branch" 
              isClustered={isClustered}
              onMarkerClick={setSelectedBranch}
              selectedId={selectedBranch?.id}
            />
          </div>
          {/* Bottom detail card */}
          {selectedBranch && (
            <div className="border-t border-border p-4 bg-secondary/40 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {selectedBranch.hasIncident ? (
                      <SeverityPill level="critical" />
                    ) : (
                      <StatusPill status="resolved" />
                    )}
                    <span className="font-mono text-xs text-muted-foreground">BR-{selectedBranch.id}</span>
                  </div>
                  <h3 className="mt-1 font-semibold">{selectedBranch.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedBranch.address}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.location.href='/dashboard/branches'}>Manage Branch</Button>
                  <Button size="sm" onClick={() => setSelectedBranch(null)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
