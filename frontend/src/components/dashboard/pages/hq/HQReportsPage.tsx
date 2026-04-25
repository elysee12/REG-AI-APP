import { Button } from "@/components/ui/button";
import { Download, Printer, FileText, TrendingUp, AlertTriangle, Building2, Calendar } from "lucide-react";

export function HQReportsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">National Vandalism Analytics</h1>
          <p className="text-muted-foreground">Network-wide summary of infrastructure security and branch performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print Executive Summary</Button>
          <Button size="sm"><Download className="h-4 w-4 mr-2" />Export All Data</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Analysis Period</label>
            <div className="flex items-center gap-2">
              <input type="date" defaultValue="2026-04-01" className="block h-9 rounded-md border border-input bg-background px-3 text-xs" />
              <span className="text-muted-foreground">to</span>
              <input type="date" defaultValue="2026-04-23" className="block h-9 rounded-md border border-input bg-background px-3 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Region Focus</label>
            <select className="block h-9 rounded-md border border-input bg-background px-3 text-xs min-w-[120px]">
              <option>All Rwanda</option>
              <option>Kigali City</option>
              <option>Eastern</option>
              <option>Western</option>
              <option>Northern</option>
              <option>Southern</option>
            </select>
          </div>
          <Button variant="secondary" size="sm" className="h-9">Generate Comparison</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Network Intrusions" value="1,248" trend="+12% vs last month" icon={AlertTriangle} tone="critical" />
        <KpiCard label="Branch Avg. Response" value="4m 12s" trend="-45s improved" icon={TrendingUp} tone="success" />
        <KpiCard label="Infrastructure Uptime" value="99.2%" trend="Stable" icon={Building2} tone="default" />
        <KpiCard label="Reports Generated" value="84" trend="12 pending review" icon={FileText} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl shadow-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold">Vandalism Trends by Branch</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Incidents</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary" /> Prev. Period</span>
            </div>
          </div>
          <div className="space-y-6">
            <BranchComparison name="Eastern Branch" current={342} previous={280} />
            <BranchComparison name="Western Branch" current={215} previous={250} />
            <BranchComparison name="Kigali Branch" current={412} previous={390} />
            <BranchComparison name="Northern Branch" current={156} previous={180} />
            <BranchComparison name="Southern Branch" current={123} previous={110} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-card p-5">
            <h2 className="font-semibold mb-4 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              High-Risk Regions
            </h2>
            <div className="space-y-4">
              <RiskItem region="Kigali City" level="Critical" count={412} />
              <RiskItem region="Eastern" level="High" count={342} />
              <RiskItem region="Western" level="Medium" count={215} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-card p-5">
            <h2 className="font-semibold mb-4 text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Incident Peak Times
            </h2>
            <div className="h-32 flex items-end gap-1">
              {Array.from({ length: 24 }).map((_, i) => {
                const h = [5,3,2,2,4,8,12,15,18,22,25,30,35,40,45,50,60,75,90,100,85,60,40,20][i];
                return (
                  <div 
                    key={i} 
                    className="flex-1 bg-primary/20 hover:bg-primary transition-colors rounded-t-sm" 
                    style={{ height: `${h}%` }}
                    title={`${i}:00 - ${h}% frequency`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, trend, icon: Icon, tone }: { label: string; value: string; trend: string; icon: any; tone: string }) {
  const colors = {
    critical: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    default: "bg-secondary text-muted-foreground"
  } as any;
  
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors[tone]}`}><Icon className="h-4 w-4" /></div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tone === 'success' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
          {trend}
        </span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function BranchComparison({ name, current, previous }: { name: string; current: number; previous: number }) {
  const max = Math.max(current, previous);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-xs font-bold">{current} <span className="text-muted-foreground font-normal">vs {previous}</span></span>
      </div>
      <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden flex">
        <div className="h-full bg-primary" style={{ width: `${(current / (current + previous)) * 100}%` }} />
        <div className="h-full bg-secondary" style={{ width: `${(previous / (current + previous)) * 100}%` }} />
      </div>
    </div>
  );
}

function RiskItem({ region, level, count }: { region: string; level: string; count: number }) {
  const levelColors = {
    Critical: "text-primary",
    High: "text-primary/80",
    Medium: "text-warning",
    Low: "text-success"
  } as any;
  
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
      <div>
        <div className="text-xs font-bold">{region}</div>
        <div className={`text-[10px] uppercase font-bold ${levelColors[level]}`}>{level} Risk</div>
      </div>
      <div className="text-lg font-bold tabular-nums">{count}</div>
    </div>
  );
}
