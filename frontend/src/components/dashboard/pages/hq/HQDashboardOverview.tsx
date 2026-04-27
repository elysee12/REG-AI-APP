import { Siren, ShieldAlert, Radio, Camera, CheckCircle2, MapPin, Send, FileText, UserPlus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/data";
import { useMemo, useEffect } from "react";
import { Kpi, SeverityPill, StatusPill, SummaryRow, QuickAction, MiniMap } from "../../shared/DashboardComponents";
import { useNavigate } from "@tanstack/react-router";

export function HQDashboardOverview() {
  const navigate = useNavigate();
  const { devices, branches, incidents, fetchDevices, fetchBranches, fetchIncidents } = useDataStore();

  useEffect(() => {
    fetchDevices();
    fetchBranches();
    fetchIncidents();
  }, [fetchDevices, fetchBranches, fetchIncidents]);

  const branchesWithStatus = useMemo(() => {
    return branches.map(branch => {
      const branchDevices = devices.filter(d => d.branchId === branch.id);
      const hasIncident = branchDevices.some(d => d.incidentStatus === 'vandalism');
      
      const branchIncidents = incidents.filter(i => String(i.branchId) === String(branch.id));
      const activeIncidents = branchIncidents.filter(i => i.status !== "resolved").length;
      const criticalIncidents = branchIncidents.filter(i => i.severity === "critical" && i.status !== "resolved").length;
      const onlineUnits = branchDevices.filter(d => d.status === "online").length;

      return { 
        ...branch, 
        hasIncident, 
        activeIncidents, 
        criticalIncidents,
        onlineUnits,
        totalUnits: branchDevices.length
      };
    });
  }, [branches, devices, incidents]);

  const stats = useMemo(() => {
    const active = incidents.filter(i => i.status !== "resolved").length;
    const critical = incidents.filter(i => i.severity === "critical" && i.status !== "resolved").length;
    const resolvedToday = incidents.filter(i => {
      const isResolved = i.status === "resolved";
      const isToday = new Date(i.time).toDateString() === new Date().toDateString();
      return isResolved && isToday;
    }).length;
    const avgUptime = devices.length > 0 
      ? (devices.filter(d => d.status === 'online').length / devices.length * 100).toFixed(1)
      : "0.0";

    return { active, critical, resolvedToday, avgUptime };
  }, [incidents, devices]);

  const activeBranchNames = useMemo(() => {
    const names = branchesWithStatus
      .filter(b => b.activeIncidents > 0)
      .map(b => b.region);
    const unique = [...new Set(names)];
    if (unique.length === 0) return "No active incidents";
    if (unique.length <= 2) return unique.join(" and ");
    return `${unique.slice(0, 2).join(", ")}, and ${unique.length - 2} more`;
  }, [branchesWithStatus]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Critical alert banner */}
      {stats.critical > 0 ? (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-elevated animate-in fade-in slide-in-from-top-4 duration-500">
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
                  {stats.critical} Critical Threats Detected
                </div>
                <div className="text-sm text-primary-foreground/85">
                  Monitoring {branchesWithStatus.filter(b => b.activeIncidents > 0).length} branches reporting incidents · {activeBranchNames}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:shrink-0">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold" 
                onClick={() => navigate({ to: '/dashboard/queue' })}
              >
                Respond Globally
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 text-muted-foreground">
          <div className="h-10 w-10 rounded-full bg-success/10 text-success flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-foreground">National Network Secure</div>
            <div className="text-xs">All monitored branches are currently reporting safe status across the infrastructure.</div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi icon={Building2} label="Active Branches" value={String(branches.length)} trend="National network" />
        <Kpi icon={ShieldAlert} label="Critical Alerts" value={String(stats.critical)} trend="High priority" tone={stats.critical > 0 ? "critical" : "default"} />
        <Kpi icon={MapPin} label="Total Sites" value={String(devices.length)} trend="All regions" />
        <Kpi icon={Radio} label="Network Health" value={`${stats.avgUptime}%`} trend="Avg. uptime" tone="success" />
        <Kpi icon={Camera} label="AI Units" value={String(devices.length)} trend={`${devices.filter(d => d.status === 'offline').length} offline`} tone="warning" />
        <Kpi icon={CheckCircle2} label="Resolved Today" value={String(stats.resolvedToday)} trend="National completions" tone="success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Branch Operational Status */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="font-semibold">Branch Operational Status</h2>
              <p className="text-xs text-muted-foreground">Real-time national branch activity</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/dashboard/reports' })}>View analytics</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Branch Name</th>
                  <th className="text-left px-4 py-2.5 font-medium">Region</th>
                  <th className="text-left px-4 py-2.5 font-medium">Alert Level</th>
                  <th className="text-left px-4 py-2.5 font-medium">Units Online</th>
                  <th className="text-left px-4 py-2.5 font-medium">Active Alerts</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {branchesWithStatus.length > 0 ? (
                  branchesWithStatus.map((branch) => (
                    <tr key={branch.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3 font-medium">{branch.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{branch.region}</td>
                      <td className="px-4 py-3">
                        <SeverityPill level={branch.criticalIncidents > 0 ? "critical" : branch.activeIncidents > 0 ? "high" : "low"} />
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">{branch.onlineUnits}/{branch.totalUnits}</td>
                      <td className="px-4 py-3 font-bold text-primary">{branch.activeIncidents}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={branch.activeIncidents > 0 ? "active" : "resolved"} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-primary hover:text-primary hover:bg-primary/10 font-bold"
                          onClick={() => navigate({ to: '/dashboard/queue' })}
                        >
                          Oversee
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground italic">
                      No branches found in the network.
                    </td>
                  </tr>
                )}
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
            <h2 className="font-semibold mb-3">Network Summary</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <SummaryRow label="Active Incidents" value={String(stats.active)} tone={stats.active > 0 ? "critical" : "success"} />
              <SummaryRow label="Branches" value={String(branches.length)} />
              <SummaryRow label="Network Uptime" value={`${stats.avgUptime}%`} tone="success" />
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
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/dashboard/devices' })}>
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
                {devices.length > 0 ? (
                  devices.map((device) => (
                    <tr key={device.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                      No devices registered in the national inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

