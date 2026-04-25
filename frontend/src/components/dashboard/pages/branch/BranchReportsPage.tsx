import { Button } from "@/components/ui/button";
import { Download, Printer, FileText, MapPin, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useDataStore } from "@/lib/data";

export function BranchReportsPage() {
  const user = useAuthStore((state) => state.user);
  const { devices } = useDataStore();
  const branchDevices = devices.filter(d => d.branchName === user?.branchName);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vandalism Incident History</h1>
          <p className="text-muted-foreground">Historical security data for all detection units in {user?.branchName}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print Branch Log</Button>
          <Button size="sm"><Download className="h-4 w-4 mr-2" />Export Branch Data</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" defaultValue="2026-04-01" className="block h-9 rounded-md border border-input bg-background px-3 text-xs" />
              <span className="text-muted-foreground">to</span>
              <input type="date" defaultValue="2026-04-23" className="block h-9 rounded-md border border-input bg-background px-3 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Unit Selection</label>
            <select className="block h-9 rounded-md border border-input bg-background px-3 text-xs min-w-[150px]">
              <option>All Branch Units</option>
              {branchDevices.map(d => (
                <option key={d.id} value={d.id}>{d.id} - {d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Incident Type</label>
            <select className="block h-9 rounded-md border border-input bg-background px-3 text-xs min-w-[150px]">
              <option>All Incident Types</option>
              <option>Perimeter Breach</option>
              <option>Vibration Anomaly</option>
              <option>Cable Cut Suspected</option>
              <option>Camera Tampering</option>
            </select>
          </div>
          <Button variant="secondary" size="sm" className="h-9">Apply Filter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UnitStat cardTitle="Branch Incidents" value="124" trend="+5 vs last month" icon={AlertTriangle} />
        <UnitStat cardTitle="Active Alerts" value="3" trend="Critical" icon={ShieldAlert} tone="critical" />
        <UnitStat cardTitle="Successful Responded" value="118" trend="95.1% rate" icon={CheckCircle2} tone="success" />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Unit-Specific Vandalism Log</h2>
          <p className="text-xs text-muted-foreground">Detailed history for each detection unit location.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-secondary/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Detection Unit ID</th>
                <th className="text-left px-4 py-3 font-medium">Unit Location & Address</th>
                <th className="text-left px-4 py-3 font-medium">Incident Type</th>
                <th className="text-left px-4 py-3 font-medium">Severity</th>
                <th className="text-left px-4 py-3 font-medium">Date & Time</th>
                <th className="text-left px-4 py-3 font-medium">Resolution Status</th>
              </tr>
            </thead>
            <tbody>
              {VANDALISM_HISTORY.map((item, i) => (
                <tr key={i} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-mono font-bold text-xs uppercase">{item.unitId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs font-medium">{item.location}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.address}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-medium text-xs">{item.type}</span>
                  </td>
                  <td className="px-4 py-4">
                    <SeverityBadge level={item.severity} />
                  </td>
                  <td className="px-4 py-4 text-xs font-mono">
                    {item.timestamp}
                  </td>
                  <td className="px-4 py-4">
                    <ResolutionBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const VANDALISM_HISTORY = [
  { unitId: "REG-AI-8821", location: "KGL-S-08 · Gasabo", address: "Sector: Gasabo, District: Gasabo, Province: Kigali", type: "Perimeter Breach", severity: "Critical", timestamp: "2026-04-22 14:32:05", status: "Resolved" },
  { unitId: "REG-AI-8821", location: "KGL-S-08 · Gasabo", address: "Sector: Gasabo, District: Gasabo, Province: Kigali", type: "Vibration Anomaly", severity: "High", timestamp: "2026-04-20 02:15:42", status: "Resolved" },
  { unitId: "REG-AI-9932", location: "RWM-T-0421 · Rwamagana", address: "Sector: Kigabiro, District: Rwamagana, Province: Eastern", type: "Cable Cut Suspected", severity: "Critical", timestamp: "2026-04-18 23:45:12", status: "Dispatched" },
  { unitId: "REG-AI-8821", location: "KGL-S-08 · Gasabo", address: "Sector: Gasabo, District: Gasabo, Province: Kigali", type: "Camera Tampering", severity: "Medium", timestamp: "2026-04-15 11:20:18", status: "Resolved" },
  { unitId: "REG-AI-9932", location: "RWM-T-0421 · Rwamagana", address: "Sector: Kigabiro, District: Rwamagana, Province: Eastern", type: "Perimeter Breach", severity: "High", timestamp: "2026-04-12 01:10:55", status: "Resolved" },
];

function UnitStat({ cardTitle, value, trend, icon: Icon, tone }: { cardTitle: string; value: string; trend: string; icon: any; tone?: string }) {
  const tones = {
    critical: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    default: "bg-secondary text-muted-foreground"
  } as any;
  
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${tones[tone || 'default']}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{cardTitle}</div>
        </div>
        <div className="ml-auto text-[10px] font-bold text-muted-foreground">{trend}</div>
      </div>
    </div>
  );
}

function SeverityBadge({ level }: { level: string }) {
  const map = {
    Critical: "bg-primary/15 text-primary border-primary/30",
    High: "bg-primary/10 text-primary border-primary/20",
    Medium: "bg-warning/15 text-warning border-warning/30",
    Low: "bg-success/10 text-success border-success/30",
  } as any;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${map[level]}`}>
      {level}
    </span>
  );
}

function ResolutionBadge({ status }: { status: string }) {
  const map = {
    Resolved: "bg-success text-success-foreground",
    Dispatched: "bg-foreground text-background",
    Pending: "bg-warning text-warning-foreground",
  } as any;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${map[status]}`}>
      {status}
    </span>
  );
}
