import { Siren, ShieldAlert, Radio, Camera, CheckCircle2, MapPin, Bell, Send, FileText, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";
import { useDataStore } from "@/lib/data";
import { Kpi, SeverityPill, StatusPill, SummaryRow, QuickAction, MiniMap } from "../../shared/DashboardComponents";

export function BranchDashboardOverview() {
  const user = useAuthStore((state) => state.user);
  const { devices } = useDataStore();
  const branchDevices = devices.filter(d => d.branchName === user?.branchName);

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
                BRANCH CRITICAL ALERT
              </div>
              <div className="mt-1 text-lg md:text-xl font-bold">
                Tower NYG-T-0421 · Nyagatare Substation
              </div>
              <div className="text-sm text-primary-foreground/85">
                Vibration + perimeter breach · Detected 00:00:42 ago · Severity: HIGH
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:shrink-0">
            <Button variant="secondary" size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" onClick={() => window.location.href='/dashboard/incidents'}>
              View Incident
            </Button>
            <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
              Acknowledge
            </Button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi icon={Siren} label="Active Incidents" value="7" trend="+2 last hr" tone="critical" />
        <Kpi icon={ShieldAlert} label="Critical Alerts" value="2" trend="needs review" tone="warning" />
        <Kpi icon={MapPin} label="Sites Monitored" value="420" trend="all regions" />
        <Kpi icon={Radio} label="Sensors Online" value="1,212" trend="98.4% up" tone="success" />
        <Kpi icon={Camera} label="Active Units" value={String(branchDevices.length)} trend="All functional" tone="warning" />
        <Kpi icon={CheckCircle2} label="Resolved Today" value="23" trend="+18% vs avg" tone="success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Live incident feed */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="font-semibold">Live Incident Feed</h2>
              <p className="text-xs text-muted-foreground">Updated continuously</p>
            </div>
            <Button variant="outline" size="sm">View all alerts</Button>
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
                {INCIDENTS.map((item) => (
                  <tr key={item.id} className="border-t border-border hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{item.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.time}</td>
                    <td className="px-4 py-3 font-medium">{item.location}</td>
                    <td className="px-4 py-3">{item.type}</td>
                    <td className="px-4 py-3"><SeverityPill level={item.severity} /></td>
                    <td className="px-4 py-3"><StatusPill status={item.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                        Open
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
              <h2 className="font-semibold">Monitoring Map</h2>
              <span className="text-xs text-muted-foreground">Local · Live</span>
            </div>
            <MiniMap items={branchDevices} type="device" />
          </div>

          <div className="bg-card border border-border rounded-xl shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Alarm Summary</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary blink" /> BUZZER ON
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <SummaryRow label="Unacknowledged" value="3" tone="critical" />
              <SummaryRow label="In progress" value="4" tone="warning" />
              <SummaryRow label="Latest site" value="NYG-T-0421" />
              <SummaryRow label="Buzzer state" value="Active" tone="critical" />
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

const INCIDENTS = [
  { id: "INC-2614", time: "00:42", location: "NYG-T-0421 · Nyagatare", type: "Perimeter breach", severity: "critical", status: "active" },
  { id: "INC-2613", time: "12 min", location: "KGL-S-08 · Gasabo", type: "Vibration anomaly", severity: "high", status: "pending" },
  { id: "INC-2612", time: "27 min", location: "MUS-T-117 · Musanze", type: "Camera tamper", severity: "medium", status: "pending" },
  { id: "INC-2611", time: "1 hr", location: "RUS-S-02 · Rusizi", type: "Cable cut suspected", severity: "high", status: "dispatched" },
  { id: "INC-2610", time: "2 hr", location: "HUY-T-340 · Huye", type: "Motion outside hours", severity: "low", status: "resolved" },
  { id: "INC-2609", time: "3 hr", location: "KAR-S-04 · Karongi", type: "Door open alarm", severity: "medium", status: "resolved" },
] as const;
