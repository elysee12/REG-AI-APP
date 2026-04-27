import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, TrendingUp, AlertTriangle, Building2, Calendar } from "lucide-react";
import { useDataStore } from "@/lib/data";
import { toast } from "sonner";

export function HQReportsPage() {
  const { incidents, branches, fetchIncidents, fetchBranches } = useDataStore();
  
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRegion, setSelectedRegion] = useState("all");

  useEffect(() => {
    fetchBranches();
    fetchIncidents();
  }, [fetchBranches, fetchIncidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      const incidentDate = new Date(i.time).toISOString().split('T')[0];
      const matchesDate = incidentDate >= dateFrom && incidentDate <= dateTo;
      
      let matchesRegion = true;
      if (selectedRegion !== "all") {
        const branch = branches.find(b => String(b.id) === String(i.branchId));
        matchesRegion = branch?.region === selectedRegion;
      }
      
      return matchesDate && matchesRegion;
    });
  }, [incidents, branches, dateFrom, dateTo, selectedRegion]);

  const stats = useMemo(() => {
    const total = filteredIncidents.length;
    const critical = filteredIncidents.filter(i => i.severity === "critical").length;
    const resolved = filteredIncidents.filter(i => i.status === "resolved").length;
    const responseRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";
    
    return { total, critical, resolved, responseRate };
  }, [filteredIncidents]);

  const branchTrends = useMemo(() => {
    return branches.map(branch => {
      const current = filteredIncidents.filter(i => String(i.branchId) === String(branch.id)).length;
      // Mock previous data for comparison UI
      const previous = Math.floor(current * 0.8) + 2; 
      return { name: branch.name, current, previous };
    }).sort((a, b) => b.current - a.current);
  }, [branches, filteredIncidents]);

  const regionalRisks = useMemo(() => {
    const regions = ["Kigali", "Eastern", "Western", "Northern", "Southern"];
    return regions.map(reg => {
      const count = filteredIncidents.filter(i => {
        const b = branches.find(br => String(br.id) === String(i.branchId));
        return b?.region === reg;
      }).length;
      
      let level = "Low";
      if (count > 20) level = "Critical";
      else if (count > 10) level = "High";
      else if (count > 5) level = "Medium";
      
      return { region: reg, level, count };
    }).sort((a, b) => b.count - a.count);
  }, [branches, filteredIncidents]);

  const hourlyDistribution = useMemo(() => {
    const hours = Array(24).fill(0);
    filteredIncidents.forEach(i => {
      const hour = new Date(i.time).getHours();
      hours[hour]++;
    });
    const max = Math.max(...hours, 1);
    return hours.map(count => (count / max) * 100);
  }, [filteredIncidents]);

  const handlePrint = () => {
    window.print();
    toast.success("Preparing executive summary...");
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Branch,Region,Incident Type,Severity,Time,Status\n"
      + filteredIncidents.map(i => {
          const b = branches.find(br => String(br.id) === String(i.branchId));
          return `"${b?.name || 'Unknown'}",${b?.region || 'Unknown'},${i.type},${i.severity},${i.time},${i.status}`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `national_security_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exporting national data...");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">National Vandalism Analytics</h1>
          <p className="text-muted-foreground">Network-wide summary of infrastructure security and branch performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print Executive Summary</Button>
          <Button size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export All Data</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card p-5 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Analysis Period</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => setDateFrom(e.target.value)}
                className="block h-9 rounded-md border border-input bg-background px-3 text-xs" 
              />
              <span className="text-muted-foreground">to</span>
              <input 
                type="date" 
                value={dateTo} 
                onChange={(e) => setDateTo(e.target.value)}
                className="block h-9 rounded-md border border-input bg-background px-3 text-xs" 
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Region Focus</label>
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="block h-9 rounded-md border border-input bg-background px-3 text-xs min-w-[120px]"
            >
              <option value="all">All Rwanda</option>
              <option value="Kigali">Kigali City</option>
              <option value="Eastern">Eastern</option>
              <option value="Western">Western</option>
              <option value="Northern">Northern</option>
              <option value="Southern">Southern</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Network Intrusions" value={String(stats.total)} trend={`${stats.critical} critical`} icon={AlertTriangle} tone="critical" />
        <KpiCard label="Resolution Rate" value={`${stats.responseRate}%`} trend="Overall" icon={TrendingUp} tone="success" />
        <KpiCard label="Active Branches" value={String(branches.length)} trend="Monitored" icon={Building2} tone="default" />
        <KpiCard label="Total Resolved" value={String(stats.resolved)} trend="Confirmed" icon={CheckCircle2} tone="success" />
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
            {branchTrends.length > 0 ? (
              branchTrends.slice(0, 5).map((bt, i) => (
                <BranchComparison key={i} name={bt.name} current={bt.current} previous={bt.previous} />
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground italic">No branch data available for this period.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-card p-5">
            <h2 className="font-semibold mb-4 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              High-Risk Regions
            </h2>
            <div className="space-y-4">
              {regionalRisks.slice(0, 3).map((risk, i) => (
                <RiskItem key={i} region={risk.region} level={risk.level} count={risk.count} />
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-card p-5">
            <h2 className="font-semibold mb-4 text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Incident Peak Times
            </h2>
            <div className="h-32 flex items-end gap-1">
              {hourlyDistribution.map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-primary/20 hover:bg-primary transition-colors rounded-t-sm" 
                  style={{ height: `${Math.max(h, 2)}%` }}
                  title={`${i}:00 - Frequency: ${Math.round(h)}%`}
                />
              ))}
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
  const total = current + previous || 1;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-xs font-bold">{current} <span className="text-muted-foreground font-normal">vs {previous}</span></span>
      </div>
      <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden flex">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(current / total) * 100}%` }} />
        <div className="h-full bg-secondary" style={{ width: `${(previous / total) * 100}%` }} />
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

import { CheckCircle2 } from "lucide-react";

