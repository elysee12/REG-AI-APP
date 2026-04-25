import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SeverityPill, StatusPill } from "../../shared/DashboardComponents";
import { Download, Filter, Search } from "lucide-react";

export function QueuePage() {
  const rows = [
    { p: 1, id: "INC-2614", site: "NYG-T-0421 · Nyagatare", cat: "Perimeter breach", time: "14:32", op: "J. Mugisha", severity: "critical", status: "active" },
    { p: 1, id: "INC-2611", site: "RUS-S-02 · Rusizi", cat: "Cable cut", time: "13:48", op: "A. Uwase", severity: "high", status: "dispatched" },
    { p: 2, id: "INC-2613", site: "KGL-S-08 · Gasabo", cat: "Vibration", time: "14:20", op: "Unassigned", severity: "high", status: "pending" },
    { p: 2, id: "INC-2612", site: "MUS-T-117 · Musanze", cat: "Camera tamper", time: "14:05", op: "Unassigned", severity: "medium", status: "pending" },
    { p: 3, id: "INC-2609", site: "KAR-S-04 · Karongi", cat: "Door open", time: "11:22", op: "P. Niyonzima", severity: "medium", status: "resolved" },
    { p: 3, id: "INC-2610", site: "HUY-T-340 · Huye", cat: "Motion", time: "12:42", op: "P. Niyonzima", severity: "low", status: "resolved" },
  ];
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-card border border-border rounded-xl shadow-card">
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-border">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search incident ID, site or operator…" className="pl-9" />
          </div>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" />Filters</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
        <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-border bg-secondary/40 text-xs">
          {["Critical only", "Unacknowledged", "Assigned to me", "False alarms", "Closed incidents"].map((t, i) => (
            <button key={t} className={`px-3 py-1 rounded-full border ${i === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-secondary/40">
              <tr>
                <th className="px-4 py-2.5"><Checkbox /></th>
                <th className="text-left px-4 py-2.5 font-medium">Priority</th>
                <th className="text-left px-4 py-2.5 font-medium">ID</th>
                <th className="text-left px-4 py-2.5 font-medium">Site</th>
                <th className="text-left px-4 py-2.5 font-medium">Category</th>
                <th className="text-left px-4 py-2.5 font-medium">Detected</th>
                <th className="text-left px-4 py-2.5 font-medium">Operator</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3"><Checkbox /></td>
                  <td className="px-4 py-3"><PriorityBadge p={r.p} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.site}</td>
                  <td className="px-4 py-3">{r.cat} <span className="ml-1"><SeverityPill level={r.severity} /></span></td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{r.time}</td>
                  <td className="px-4 py-3">{r.op}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">Open</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing 6 of 142 incidents</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">Acknowledge selected</Button>
            <Button size="sm" variant="outline">Assign selected</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ p }: { p: number }) {
  const map: Record<number, string> = {
    1: "bg-primary text-primary-foreground",
    2: "bg-warning text-warning-foreground",
    3: "bg-secondary text-foreground border border-border",
  };
  return <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${map[p]}`}>P{p}</span>;
}
