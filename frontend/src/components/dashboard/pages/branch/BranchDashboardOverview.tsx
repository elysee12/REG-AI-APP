import { Siren, ShieldAlert, Radio, Camera, CheckCircle2, MapPin, Bell, Send, FileText, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";
import { useDataStore } from "@/lib/data";
import { useEffect, useMemo } from "react";
import { Kpi, SeverityPill, StatusPill, SummaryRow, QuickAction, MiniMap } from "../../shared/DashboardComponents";
import { useNavigate } from "@tanstack/react-router";

export function BranchDashboardOverview() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { devices, incidents, fetchDevices, fetchIncidents } = useDataStore();
  
  useEffect(() => {
    fetchDevices();
    const branchId = user?.role === 'BRANCH_USER' && user.branchId ? String(user.branchId) : undefined;
    fetchIncidents(branchId);
  }, [fetchDevices, fetchIncidents, user]);

  const branchDevices = useMemo(() => 
    devices.filter(d => d.branchName === user?.branchName),
    [devices, user?.branchName]
  );

  const branchIncidents = useMemo(() => 
    incidents.filter(i => {
      if (user?.role === "HQ_ADMIN") return true;
      // In incidents data, branchId is usually a number from Prisma, but in store it might be stringified
      return String(i.branchId) === String(user?.branchId);
    }),
    [incidents, user?.branchId, user?.role]
  );

  const stats = useMemo(() => {
    const active = branchIncidents.filter(i => i.status === "active" || i.status === "pending").length;
    const critical = branchIncidents.filter(i => i.severity === "critical" && i.status !== "resolved").length;
    const resolvedToday = branchIncidents.filter(i => {
      const isResolved = i.status === "resolved";
      const isToday = new Date(i.time).toDateString() === new Date().toDateString();
      return isResolved && isToday;
    }).length;
    const onlineDevices = branchDevices.filter(d => d.status === "online").length;

    return { active, critical, resolvedToday, onlineDevices };
  }, [branchIncidents, branchDevices]);

  const latestCritical = useMemo(() => 
    branchIncidents.find(i => i.severity === "critical" && i.status !== "resolved"),
    [branchIncidents]
  );

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Critical alert banner */}
      {latestCritical ? (
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
                  BRANCH CRITICAL ALERT
                </div>
                <div className="mt-1 text-lg md:text-xl font-bold truncate">
                  {latestCritical.location}
                </div>
                <div className="text-sm text-primary-foreground/85">
                  {latestCritical.type} · Detected {getRelativeTime(latestCritical.time)} · Severity: {latestCritical.severity.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:shrink-0">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold" 
                onClick={() => navigate({ to: '/dashboard/incidents' })}
              >
                Respond Now
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
            <div className="font-bold text-foreground">All Systems Secure</div>
            <div className="text-xs">No active critical threats detected in your branch area.</div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi icon={Siren} label="Active Incidents" value={String(stats.active)} trend="Live queue" tone={stats.active > 0 ? "critical" : "default"} />
        <Kpi icon={ShieldAlert} label="Critical Alerts" value={String(stats.critical)} trend="Priority response" tone={stats.critical > 0 ? "critical" : "default"} />
        <Kpi icon={MapPin} label="Sites Monitored" value={String(branchDevices.length)} trend="Assigned units" />
        <Kpi icon={Radio} label="Sensors Online" value={String(stats.onlineDevices)} trend={`${((stats.onlineDevices / (branchDevices.length || 1)) * 100).toFixed(0)}% uptime`} tone="success" />
        <Kpi icon={Camera} label="Active Units" value={String(branchDevices.filter(d => d.status === 'online').length)} trend="AI Monitoring" tone="success" />
        <Kpi icon={CheckCircle2} label="Resolved Today" value={String(stats.resolvedToday)} trend="Total completions" tone="success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Live incident feed */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="font-semibold">Live Incident Feed</h2>
              <p className="text-xs text-muted-foreground">Updated continuously from AI detection</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/dashboard/queue' })}>View all alerts</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">ID</th>
                  <th className="text-left px-4 py-2.5 font-medium">Time</th>
                  <th className="text-left px-4 py-2.5 font-medium">Location</th>
                  <th className="text-left px-4 py-2.5 font-medium">Type</th>
                  <th className="text-left px-4 py-2.5 font-medium">Severity</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {branchIncidents.length > 0 ? (
                  branchIncidents.slice(0, 6).map((item) => (
                    <tr key={item.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{item.id.split('-')[0]}</td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{getRelativeTime(item.time)}</td>
                      <td className="px-4 py-3 font-medium truncate max-w-[150px]">{item.location}</td>
                      <td className="px-4 py-3">{item.type}</td>
                      <td className="px-4 py-3"><SeverityPill level={item.severity} /></td>
                      <td className="px-4 py-3"><StatusPill status={item.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-primary hover:text-primary hover:bg-primary/10 font-bold"
                          onClick={() => navigate({ to: '/dashboard/response', search: { incidentId: item.id } })}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground italic">
                      No incident history found for this branch.
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
              <h2 className="font-semibold">Monitoring Map</h2>
              <span className="text-xs text-muted-foreground">Local · Live</span>
            </div>
            <MiniMap items={branchDevices} type="device" />
          </div>

          <div className="bg-card border border-border rounded-xl shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Alarm Summary</h2>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${stats.active > 0 ? 'text-primary' : 'text-success'}`}>
                <span className={`h-2 w-2 rounded-full ${stats.active > 0 ? 'bg-primary blink' : 'bg-success'}`} /> 
                {stats.active > 0 ? 'ALERTS ACTIVE' : 'SECURE'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <SummaryRow label="Unacknowledged" value={String(branchIncidents.filter(i => i.status === 'pending').length)} tone="critical" />
              <SummaryRow label="In progress" value={String(branchIncidents.filter(i => i.status === 'active').length)} tone="warning" />
              <SummaryRow label="Latest site" value={branchIncidents[0]?.location.split(' · ')[0] || "N/A"} />
              <SummaryRow label="Buzzer state" value={stats.active > 0 ? "Active" : "Silent"} tone={stats.active > 0 ? "critical" : "default"} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-card p-4">
            <h2 className="font-semibold mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction icon={Bell} label="Acknowledge" />
              <QuickAction icon={Camera} label="Live Camera" />
              <QuickAction icon={Send} label="Dispatch Team" />
              <QuickAction icon={FileText} label="Branch Reports" />
              <QuickAction icon={Volume2} label="Silence Buzzer" />
              <QuickAction icon={ShieldAlert} label="Escalate" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

