import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, MessageSquare, Phone, Truck, Bell } from "lucide-react";

export function ResponsePage() {
  return (
    <div className="p-4 md:p-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Dispatch */}
      <div className="bg-card border border-border rounded-xl shadow-card p-5 xl:col-span-1">
        <h2 className="font-semibold flex items-center gap-2"><Truck className="h-4 w-4 text-primary" />Dispatch Panel</h2>
        <p className="text-xs text-muted-foreground mb-4">Incident INC-2614 — NYG-T-0421</p>
        <div className="space-y-3">
          <div>
            <Label>Response team</Label>
            <select className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>Nyagatare Rapid Response — 4 available</option>
              <option>Eastern Mobile Unit — 2 available</option>
            </select>
          </div>
          <div>
            <Label>Vehicle</Label>
            <select className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>RR-04 (Toyota Hilux) · 8 km away</option>
              <option>RR-07 (Land Cruiser) · 12 km away</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ETA</Label>
              <Input className="mt-1" defaultValue="14 min" />
            </div>
            <div>
              <Label>Channel</Label>
              <select className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option>SMS + App</option>
                <option>App only</option>
                <option>Email</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked /> Notify supervisor on dispatch
          </label>
          <Button className="w-full"><Send className="h-4 w-4 mr-2" />Dispatch team</Button>
        </div>
      </div>

      {/* Communication */}
      <div className="bg-card border border-border rounded-xl shadow-card p-5 xl:col-span-1">
        <h2 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Communication</h2>
        <p className="text-xs text-muted-foreground mb-4">Field team status & contacts</p>
        <ul className="space-y-2.5">
          {[
            { name: "Lt. E. Habimana", role: "Team lead · RR-04", status: "online" },
            { name: "Sgt. F. Iradukunda", role: "Field officer · RR-04", status: "online" },
            { name: "Supervisor C. Mukamana", role: "Eastern region", status: "online" },
            { name: "Cpl. T. Bizimana", role: "Backup · RR-07", status: "away" },
          ].map((p) => (
            <li key={p.name} className="flex items-center justify-between p-2.5 rounded-md border border-border hover:bg-secondary/40">
              <div>
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.role}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${p.status === "online" ? "bg-success" : "bg-warning"}`} />
                <Button size="sm" variant="ghost" className="px-2"><Phone className="h-4 w-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Label>Quick message</Label>
          <textarea className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background p-3 text-sm" placeholder="Type message…" defaultValue="Critical alert at NYG-T-0421. Proceed with extreme caution." />
          <div className="mt-2 flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">Use template: Intrusion</Button>
            <Button variant="outline" size="sm">Cable cut</Button>
            <Button size="sm" className="ml-auto">Send</Button>
          </div>
        </div>
      </div>

      {/* Action history */}
      <div className="bg-card border border-border rounded-xl shadow-card p-5 xl:col-span-1">
        <h2 className="font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />Action History</h2>
        <p className="text-xs text-muted-foreground mb-4">All actions on current incident</p>
        <ol className="relative border-l border-border ml-2 space-y-4 pl-5">
          {[
            { t: "14:32:51", title: "Incident acknowledged", who: "J. Mugisha" },
            { t: "14:33:10", title: "Camera CAM-NYG-04 reviewed", who: "J. Mugisha" },
            { t: "14:34:02", title: "Marked as Verified", who: "J. Mugisha" },
            { t: "14:34:55", title: "Supervisor notified", who: "System" },
            { t: "14:35:40", title: "Dispatch RR-04 — ETA 14 min", who: "J. Mugisha" },
          ].map((e, i) => (
            <li key={i}>
              <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-card border-2 border-primary" />
              <div className="text-xs text-muted-foreground tabular-nums">{e.t} · {e.who}</div>
              <div className="text-sm font-medium">{e.title}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
