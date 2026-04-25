import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeverityPill, StatusPill } from "../../shared/DashboardComponents";
import { Camera, MapPin, Radio, ShieldCheck, AlertTriangle, Clock, Send, FileText, X } from "lucide-react";

export function IncidentsPage() {
  return (
    <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* List */}
      <div className="xl:col-span-1 bg-card border border-border rounded-xl shadow-card flex flex-col max-h-[calc(100vh-9rem)]">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Live Incidents</h2>
          <Input placeholder="Filter by ID or site…" className="mt-2 h-9" />
        </div>
        <div className="overflow-y-auto divide-y divide-border">
          {LIST.map((i, idx) => (
            <button
              key={i.id}
              className={`w-full text-left p-4 hover:bg-secondary/60 transition-colors ${idx === 0 ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
                <SeverityPill level={i.severity} />
              </div>
              <div className="mt-1 font-semibold text-sm">{i.location}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{i.type}</div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{i.time}</span>
                <span className="ml-auto"><StatusPill status={i.status} /></span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="xl:col-span-2 space-y-4">
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <SeverityPill level="critical" />
                  <span className="font-mono text-xs text-muted-foreground">INC-2614</span>
                </div>
                <h1 className="mt-2 text-xl font-bold">Perimeter breach — Tower NYG-T-0421</h1>
                <p className="text-sm text-muted-foreground">Nyagatare Substation, Eastern Province</p>
              </div>
              <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Meta label="Detection time" value="14:32:18" />
              <Meta label="Type" value="Vibration + Motion" />
              <Meta label="GPS" value="-1.2918, 30.3214" />
              <Meta label="Region" value="Nyagatare Op." />
            </div>
          </div>

          {/* Evidence tabs */}
          <div className="p-5">
            <div className="flex gap-1 border-b border-border mb-4">
              {["Camera Snapshot", "Video Clip", "Sensor Data", "AI Summary"].map((t, i) => (
                <button key={t} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${i === 0 ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="aspect-video rounded-lg bg-sidebar relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern opacity-20" />
              <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-primary/90 text-primary-foreground text-xs font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground blink" /> LIVE · CAM-NYG-04
              </div>
              <div className="absolute bottom-3 left-3 text-sidebar-foreground/70 text-xs font-mono">14:32:18 · 1080p</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-16 w-16 text-sidebar-foreground/20" />
              </div>
              <div className="absolute top-1/3 left-1/3 w-32 h-24 border-2 border-primary rounded">
                <span className="absolute -top-5 left-0 text-xs font-bold text-primary bg-card px-1.5 rounded">PERSON · 94%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow + Timeline */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl shadow-card p-5">
            <h3 className="font-semibold mb-3">Response Workflow</h3>
            <div className="space-y-2">
              <Button className="w-full justify-start"><ShieldCheck className="h-4 w-4 mr-2" />Acknowledge Incident</Button>
              <Button className="w-full justify-start" variant="outline"><ShieldCheck className="h-4 w-4 mr-2 text-success" />Mark as Verified</Button>
              <Button className="w-full justify-start" variant="outline"><AlertTriangle className="h-4 w-4 mr-2 text-warning" />Mark as False Alarm</Button>
              <Button className="w-full justify-start" variant="outline"><Send className="h-4 w-4 mr-2" />Escalate to Supervisor</Button>
              <Button className="w-full justify-start" variant="outline"><Send className="h-4 w-4 mr-2 text-primary" />Dispatch Field Team</Button>
              <Button className="w-full justify-start" variant="ghost">Close Incident</Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-card p-5">
            <h3 className="font-semibold mb-3">Activity Timeline</h3>
            <ol className="relative border-l border-border ml-2 space-y-4 pl-5">
              {TIMELINE.map((e, i) => (
                <li key={i}>
                  <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-card border-2 border-primary" />
                  <div className="text-xs text-muted-foreground tabular-nums">{e.time}</div>
                  <div className="text-sm font-medium">{e.title}</div>
                  {e.note && <div className="text-xs text-muted-foreground mt-0.5">{e.note}</div>}
                </li>
              ))}
            </ol>
            <Button variant="outline" size="sm" className="mt-4 w-full"><FileText className="h-4 w-4 mr-2" />Add note</Button>
          </div>
        </div>

        {/* Sensor strip */}
        <div className="bg-card border border-border rounded-xl shadow-card p-5">
          <h3 className="font-semibold mb-3">Sensor Stream</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SensorChip icon={Radio} label="Vibration" value="HIGH" tone="critical" />
            <SensorChip icon={Radio} label="Motion" value="DETECTED" tone="critical" />
            <SensorChip icon={Radio} label="Intrusion" value="TRIPPED" tone="critical" />
            <SensorChip icon={MapPin} label="Geo-fence" value="BREACHED" tone="warning" />
          </div>
        </div>
      </div>
    </div>
  );
}

const LIST = [
  { id: "INC-2614", location: "NYG-T-0421 · Nyagatare", type: "Perimeter breach", severity: "critical", status: "active", time: "Now · 00:42 ago" },
  { id: "INC-2613", location: "KGL-S-08 · Gasabo", type: "Vibration anomaly", severity: "high", status: "pending", time: "12 min ago" },
  { id: "INC-2612", location: "MUS-T-117 · Musanze", type: "Camera tamper", severity: "medium", status: "pending", time: "27 min ago" },
  { id: "INC-2611", location: "RUS-S-02 · Rusizi", type: "Cable cut suspected", severity: "high", status: "dispatched", time: "1 hr ago" },
  { id: "INC-2610", location: "HUY-T-340 · Huye", type: "Motion after hours", severity: "low", status: "resolved", time: "2 hr ago" },
] as const;

const TIMELINE = [
  { time: "14:32:18", title: "Alarm triggered by AI vision + vibration sensor" },
  { time: "14:32:24", title: "Buzzer activated in control room" },
  { time: "14:32:51", title: "Operator J. Mugisha opened the alert" },
  { time: "14:33:10", title: "Camera CAM-NYG-04 reviewed", note: "Confirmed person inside perimeter" },
  { time: "—", title: "Awaiting dispatch decision", note: "Recommended action: Dispatch nearest team" },
];

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function SensorChip({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: "critical" | "warning" | "success" }) {
  const c = tone === "critical" ? "bg-primary/10 text-primary border-primary/30" : tone === "warning" ? "bg-warning/15 text-warning border-warning/30" : "bg-success/10 text-success border-success/30";
  return (
    <div className={`rounded-lg border p-3 ${c}`}>
      <div className="flex items-center gap-2 text-xs font-medium">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-1 text-base font-bold">{value}</div>
    </div>
  );
}
