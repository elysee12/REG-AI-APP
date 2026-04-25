import { Siren, ShieldAlert, Radio, Camera, CheckCircle2, MapPin, Send, FileText, UserPlus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/data";
import { useMemo } from "react";
import { Kpi, SeverityPill, StatusPill, SummaryRow, QuickAction, MiniMap } from "../../shared/DashboardComponents";

export function HQDashboardOverview() {
  const { devices, branches } = useDataStore();

  const branchesWithStatus = useMemo(() => {
    return branches.map(branch => {
      const branchDevices = devices.filter(d => d.branchId === branch.id);
      const hasIncident = branchDevices.some(d => d.incidentStatus === 'vandalism');
      return { ...branch, hasIncident };
    });
  }, [branches, devices]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Critical alert banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-elevated">
        <div className="absolute inset-0 bg-grid-pattern opacity-15" />
        <div className="relative p-4 md:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="h-12 w-12 rounded-full bg-primary-foreground/15 flex items-center justify-center pulse-critical">
              <Siren className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-primary-foreground blink" />
                NETWORK-WIDE CRITICAL ALERT
              </div>
              <div className="mt-1 text-lg md:text-xl font-bold">
                Multiple Intrusions Detected
              </div>
              <div className="text-sm text-primary-foreground/85">
                3 branches reporting active incidents · Western, Eastern, and Kigali
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:shrink-0">
            <Button variant="secondary" size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" onClick={() => window.location.href='/dashboard/branches'}>
              Review Branches
            </Button>
            <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
              Acknowledge All
            </Button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi icon={Building2} label="Active Branches" value="12" trend="Across all regions" />
        <Kpi icon={ShieldAlert} label="Critical Alerts" value="5" trend="needs review" tone="warning" />
        <Kpi icon={MapPin} label="Total Sites" value="1,240" trend="all regions" />
        <Kpi icon={Radio} label="Network Health" value="96.4%" trend="Avg. uptime" tone="success" />
        <Kpi icon={Camera} label="AI Units" value={String(devices.length)} trend={`${devices.filter(d => d.status === 'offline').length} offline`} tone="warning" />
        <Kpi icon={CheckCircle2} label="Resolved Today" value="84" trend="+18% vs avg" tone="success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Branch Operational Status */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="font-semibold">Branch Operational Status</h2>
              <p className="text-xs text-muted-foreground">Real-time branch activity</p>
            </div>
            <Button variant="outline" size="sm">View all branches</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Branch Name</th>
                  <th className="text-left px-4 py-2.5 font-medium">Region</th>
                  <th className="text-left px-4 py-2.5 font-medium">Alert Level</th>
                  <th className="text-left px-4 py-2.5 font-medium">Units Online</th>
                  <th className="text-left px-4 py-2.5 font-medium">Last Incident</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {BRANCH_STATUS.map((item) => (
                  <tr key={item.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.region}</td>
                    <td className="px-4 py-3"><SeverityPill level={item.alertLevel} /></td>
                    <td className="px-4 py-3">{item.units}</td>
                    <td className="px-4 py-3">{item.lastIncident}</td>
                    <td className="px-4 py-3"><StatusPill status={item.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                        Oversee
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">Network Map</h2>
              <span className="text-xs text-muted-foreground">Rwanda · Live</span>
            </div>
            <MiniMap items={branchesWithStatus} type="branch" />
          </div>

          <div className="bg-card border border-border rounded-xl shadow-card p-4">
            <h2 className="font-semibold mb-3">Branch Summary</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <SummaryRow label="HQ Active" value="Yes" />
              <SummaryRow label="Branches" value="12" tone="warning" />
              <SummaryRow label="Main Region" value="Central" />
              <SummaryRow label="Total Units" value={String(devices.length)} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-card p-4">
            <h2 className="font-semibold mb-3">HQ Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction icon={Building2} label="Manage Branches" />
              <QuickAction icon={Camera} label="Network Feed" />
              <QuickAction icon={Send} label="Global Dispatch" />
              <QuickAction icon={FileText} label="National Reports" />
              <QuickAction icon={UserPlus} label="Manage Admins" />
              <QuickAction icon={ShieldAlert} label="System Audit" />
            </div>
          </div>
        </div>

        {/* Network Device Inventory */}
        <div className="xl:col-span-3 bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="font-semibold">National Device Inventory & Locations</h2>
              <p className="text-xs text-muted-foreground">Comprehensive list of all AI Vandalism Detection units across Rwanda</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href='/dashboard/devices'}>
              Manage Devices
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Serial Number</th>
                  <th className="text-left px-4 py-2.5 font-medium">Branch</th>
                  <th className="text-left px-4 py-2.5 font-medium">GPS Coordinates</th>
                  <th className="text-left px-4 py-2.5 font-medium">Full Address (Village to Province)</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Camera className="h-3.5 w-3.5 text-primary" />
                        <span className="font-mono font-bold text-xs uppercase">{device.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{device.branchName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <MapPin className="h-3 w-3" />
                        <span>{device.location.lat.toFixed(4)}, {device.location.lng.toFixed(4)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{device.location.address}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${device.status === 'online' ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                        <span className="capitalize text-xs font-medium">{device.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const BRANCH_STATUS = [
  { id: "B1", name: "Eastern Branch", region: "Eastern", alertLevel: "high", units: "240/242", lastIncident: "10m ago", status: "active" },
  { id: "B2", name: "Western Branch", region: "Western", alertLevel: "critical", units: "180/185", lastIncident: "2m ago", status: "active" },
  { id: "B3", name: "Kigali Branch", region: "Central", alertLevel: "low", units: "312/312", lastIncident: "1h ago", status: "resolved" },
  { id: "B4", name: "Northern Branch", region: "Northern", alertLevel: "medium", units: "120/122", lastIncident: "4h ago", status: "pending" },
  { id: "B5", name: "Southern Branch", region: "Southern", alertLevel: "low", units: "80/81", lastIncident: "2d ago", status: "resolved" },
];
