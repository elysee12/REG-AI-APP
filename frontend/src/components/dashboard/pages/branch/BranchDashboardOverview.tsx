import { Siren, ShieldAlert, Radio, Camera, CheckCircle2, MapPin, Bell, Send, FileText, Volume2, VolumeX, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";
import { useDataStore } from "@/lib/data";
import { useEffect, useMemo, useState } from "react";
import { Kpi, SeverityPill, StatusPill, SummaryRow, QuickAction, MiniMap, Pagination } from "../../shared/DashboardComponents";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function BranchDashboardOverview() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { devices, incidents, securityContacts, fetchDevices, fetchIncidents, fetchSecurityContacts, isAlarmActive, setAlarmActive, stopAlarm } = useDataStore();
  
  useEffect(() => {
    fetchDevices();
    fetchSecurityContacts();
    const branchId = user?.role === 'BRANCH_USER' && user.branchId ? String(user.branchId) : undefined;
    fetchIncidents(branchId);
  }, [fetchDevices, fetchIncidents, fetchSecurityContacts, user]);

  // Resolve assigned devices based on email mapping
  const assignedDeviceIds = useMemo(() => {
    if (!user || user.role === 'HQ_ADMIN') return [];
    const contact = securityContacts.find(c => c.email.toLowerCase() === user.email.toLowerCase());
    return contact?.devices?.map((d: any) => d.id) || [];
  }, [user, securityContacts]);

  const branchDevices = useMemo(() => {
    const baseDevices = user?.role !== 'BRANCH_USER' || !user.branchId 
      ? devices 
      : devices.filter(d => String(d.branchId) === String(user.branchId));

    return baseDevices.map(device => {
      const hasActiveIncident = incidents.some(
        i => i.deviceId === device.id && (i.status === 'active' || i.status === 'pending')
      );
      
      return {
        ...device,
        incidentStatus: hasActiveIncident ? 'vandalism' : 'safe'
      };
    });
  }, [devices, user?.role, user?.branchId, incidents]);

  const branchIncidents = useMemo(() => {
    if (user?.role === 'HQ_ADMIN') return incidents;
    return incidents.filter(i => String(i.branchId) === String(user?.branchId));
  }, [incidents, user?.role, user?.branchId]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const handleToggleAlarm = () => {
    if (isAlarmActive) {
      stopAlarm();
      toast.info("Audible alarm has been manually silenced.");
    } else {
      setAlarmActive(true);
    }
  };

  const stats = useMemo(() => {
    const filteredIncidents = user?.role === 'BRANCH_USER' && assignedDeviceIds.length > 0
      ? branchIncidents.filter(i => assignedDeviceIds.includes(i.deviceId))
      : branchIncidents;
    
    const filteredDevices = user?.role === 'BRANCH_USER' && assignedDeviceIds.length > 0
      ? branchDevices.filter(d => assignedDeviceIds.includes(d.id))
      : branchDevices;

    const active = filteredIncidents.filter(i => i.status === "active" || i.status === "pending").length;
    const critical = filteredIncidents.filter(i => i.severity === "critical" && i.status !== "solved").length;
    const resolvedToday = filteredIncidents.filter(i => {
      const isResolved = i.status === "solved";
      const isToday = new Date(i.time).toDateString() === new Date().toDateString();
      return isResolved && isToday;
    }).length;
    const onlineDevices = filteredDevices.filter(d => d.status === "online").length;

    return { active, critical, resolvedToday, onlineDevices };
  }, [branchIncidents, branchDevices, assignedDeviceIds, user?.role]);

  const latestCritical = useMemo(() => {
    const filteredIncidents = user?.role === 'BRANCH_USER' && assignedDeviceIds.length > 0
      ? branchIncidents.filter(i => assignedDeviceIds.includes(i.deviceId))
      : branchIncidents;
    
    return [...filteredIncidents]
      .filter(i => i.severity === "critical" && i.status !== "solved")
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];
  }, [branchIncidents, assignedDeviceIds, user?.role]);

  const totalPages = Math.ceil(branchIncidents.length / rowsPerPage);
  const paginatedIncidents = branchIncidents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
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
                  BRANCH CRITICAL ALERT — <span className="bg-primary-foreground/20 px-1.5 py-0.5 rounded">{latestCritical.ticketId}</span>
                </div>
                <div className="mt-1 text-lg md:text-xl font-bold truncate">
                  {latestCritical.deviceId}
                </div>
                <div className="text-sm text-primary-foreground/85">
                  {latestCritical.location.split(' · ')[1]} Station Area · Detected {getRelativeTime(latestCritical.time)}
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

      {/* Alarm Monitoring Control Panel */}
      <div className={`rounded-xl border p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 ${isAlarmActive ? 'bg-primary/10 border-primary animate-pulse shadow-elevated' : 'bg-card border-border'}`}>
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isAlarmActive ? 'bg-primary text-primary-foreground animate-bounce' : 'bg-secondary text-muted-foreground'}`}>
            {isAlarmActive ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">Alarm Monitoring System</h2>
              {isAlarmActive && <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">SOUNDING</span>}
            </div>
            <p className="text-sm text-muted-foreground">
              {isAlarmActive 
                ? `Continuous audible alert is active due to a ${latestCritical?.aiClass || 'security'} detection.` 
                : "Audible alarm system is standby. It will sound automatically on critical incidents."}
            </p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          {isAlarmActive ? (
            <Button 
              onClick={handleToggleAlarm}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-6 shadow-lg gap-2"
            >
              <VolumeX className="h-4 w-4" /> STOP ALARM SOUND
            </Button>
          ) : (
            <Button 
              variant="outline"
              className="border-border hover:bg-secondary h-11 px-6 gap-2 text-muted-foreground"
              disabled
            >
              <CheckCircle2 className="h-4 w-4 text-success" /> SYSTEM STANDBY
            </Button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi icon={Siren} label="Active Incidents" value={String(stats.active)} trend="Live queue" tone={stats.active > 0 ? "critical" : "default"} />
        <Kpi icon={ShieldAlert} label="Critical Alerts" value={String(stats.critical)} trend="Priority response" tone={stats.critical > 0 ? "critical" : "default"} />
        <Kpi icon={MapPin} label="Sites Monitored" value={String(branchDevices.length)} trend="Assigned units" />
        <Kpi icon={Radio} label="Sensors Online" value={String(stats.onlineDevices)} trend={`${((stats.onlineDevices / (branchDevices.length || 1)) * 100).toFixed(0)}% uptime`} tone="success" />
        <Kpi icon={Camera} label="Active Units" value={String(branchDevices.filter(d => d.status === 'online').length)} trend="AI Monitoring" tone="success" />
        <Kpi icon={CheckCircle2} label="RESOLVED Today" value={String(stats.resolvedToday)} trend="Total completions" tone="success" />
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
                  <th className="text-left px-4 py-2.5 font-medium">Ticket ID</th>
                  <th className="text-left px-4 py-2.5 font-medium">Time</th>
                  <th className="text-left px-4 py-2.5 font-medium">Serial Number</th>
                  <th className="text-left px-4 py-2.5 font-medium">Area</th>
                  <th className="text-left px-4 py-2.5 font-medium">Classification</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIncidents.length > 0 ? (
                  paginatedIncidents.map((item) => (
                    <tr key={item.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">{item.ticketId}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">{getRelativeTime(item.time)}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{item.deviceId}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.location.split(' · ')[1]}</td>
                      <td className="px-4 py-3 text-xs font-medium">{item.type}</td>
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
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
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
              <SummaryRow label="New Alerts" value={String(branchIncidents.filter(i => i.status === 'active').length)} tone="critical" />
              <SummaryRow label="In progress" value={String(branchIncidents.filter(i => i.status === 'pending').length)} tone="warning" />
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

