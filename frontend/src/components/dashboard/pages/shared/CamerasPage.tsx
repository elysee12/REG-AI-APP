import { Camera, Maximize2, Radio, Battery, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const TABS = ["Cameras", "Sensors", "Device Health"] as const;

export function CamerasPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Cameras");
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-card border border-border rounded-xl shadow-card">
        <div className="border-b border-border px-4 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab === "Cameras" && <CamerasGrid />}
          {tab === "Sensors" && <SensorsTable />}
          {tab === "Device Health" && <DeviceHealth />}
        </div>
      </div>
    </div>
  );
}

function CamerasGrid() {
  const cams = Array.from({ length: 8 }).map((_, i) => ({
    id: `CAM-${String(100 + i).padStart(3, "0")}`,
    site: ["Nyagatare", "Gasabo", "Musanze", "Rusizi", "Huye", "Karongi", "Rubavu", "Nyamasheke"][i],
    online: i !== 3 && i !== 6,
    alert: i === 0,
  }));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cams.map((c) => (
        <div key={c.id} className="rounded-lg border border-border overflow-hidden bg-sidebar group">
          <div className="relative aspect-video bg-grid-pattern bg-sidebar">
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="h-10 w-10 text-sidebar-foreground/20" />
            </div>
            {c.alert && (
              <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary text-primary-foreground text-[11px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground blink" /> ALERT
              </div>
            )}
            {!c.online && (
              <div className="absolute inset-0 bg-sidebar/80 flex items-center justify-center text-sidebar-foreground/60 text-sm font-medium">
                Offline
              </div>
            )}
            <button className="absolute bottom-2 right-2 p-1.5 rounded bg-sidebar-foreground/10 text-sidebar-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{c.id}</div>
                <div className="text-xs text-muted-foreground">{c.site}</div>
              </div>
              <span className={`h-2 w-2 rounded-full ${c.online ? "bg-success" : "bg-muted-foreground"}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SensorsTable() {
  const rows = [
    { id: "VIB-2104", type: "Vibration", site: "NYG-T-0421", reading: "0.82 g", status: "alert", batt: 78 },
    { id: "MOT-1198", type: "Motion", site: "KGL-S-08", reading: "Active", status: "ok", batt: 91 },
    { id: "INT-3320", type: "Intrusion", site: "MUS-T-117", reading: "Idle", status: "ok", batt: 64 },
    { id: "VIB-2207", type: "Vibration", site: "RUS-S-02", reading: "0.12 g", status: "ok", batt: 22 },
    { id: "DOR-0501", type: "Door", site: "HUY-T-340", reading: "Closed", status: "ok", batt: 88 },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-muted-foreground bg-secondary/50">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium">Sensor ID</th>
            <th className="text-left px-4 py-2.5 font-medium">Type</th>
            <th className="text-left px-4 py-2.5 font-medium">Location</th>
            <th className="text-left px-4 py-2.5 font-medium">Last reading</th>
            <th className="text-left px-4 py-2.5 font-medium">Status</th>
            <th className="text-left px-4 py-2.5 font-medium">Battery</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border hover:bg-secondary/40">
              <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
              <td className="px-4 py-3 flex items-center gap-2"><Radio className="h-4 w-4 text-muted-foreground" />{r.type}</td>
              <td className="px-4 py-3">{r.site}</td>
              <td className="px-4 py-3 font-medium">{r.reading}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${r.status === "alert" ? "text-primary" : "text-success"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${r.status === "alert" ? "bg-primary blink" : "bg-success"}`} />
                  {r.status === "alert" ? "Alert" : "Normal"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Battery className={`h-4 w-4 ${r.batt < 30 ? "text-warning" : "text-muted-foreground"}`} />
                  <span className={`text-xs ${r.batt < 30 ? "text-warning font-semibold" : ""}`}>{r.batt}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeviceHealth() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <HealthCard title="Offline devices" value="14" tone="critical" detail="3 cameras · 11 sensors" icon={Wifi} />
      <HealthCard title="Weak signal" value="38" tone="warning" detail="Mostly Western Province" icon={Wifi} />
      <HealthCard title="Low battery" value="52" tone="warning" detail="Below 30%" icon={Battery} />
      <HealthCard title="Maintenance due" value="7" tone="default" detail="Scheduled this week" icon={Radio} />
      <div className="sm:col-span-2 lg:col-span-4 bg-secondary/40 border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Connectivity over 24h</h3>
        <div className="h-32 flex items-end gap-1">
          {Array.from({ length: 48 }).map((_, i) => {
            const h = 50 + Math.sin(i / 3) * 20 + Math.random() * 25;
            return <div key={i} className="flex-1 rounded-t bg-primary/60" style={{ height: `${h}%` }} />;
          })}
        </div>
      </div>
    </div>
  );
}

function HealthCard({ title, value, tone, detail, icon: Icon }: { title: string; value: string; tone: "critical" | "warning" | "default"; detail: string; icon: React.ComponentType<{ className?: string }> }) {
  const c = tone === "critical" ? "bg-primary/10 text-primary" : tone === "warning" ? "bg-warning/15 text-warning" : "bg-secondary text-foreground";
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`inline-flex p-2 rounded-lg ${c}`}><Icon className="h-4 w-4" /></div>
      <div className="mt-3 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{detail}</div>
    </div>
  );
}
