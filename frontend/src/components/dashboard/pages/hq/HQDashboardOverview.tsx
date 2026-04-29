import { Siren, Radio, Camera, CheckCircle2, MapPin, Send, FileText, UserPlus, Building2, ShieldAlert, TrendingUp, BarChart3, Clock, AlertTriangle, Phone, Wallet, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/data";
import { useMemo, useEffect, useState } from "react";
import { Kpi, SummaryRow, QuickAction, MiniMap, SeverityPill, StatusPill } from "../../shared/DashboardComponents";
import { useNavigate } from "@tanstack/react-router";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function HQDashboardOverview() {
  const navigate = useNavigate();
  const { devices, branches, incidents, fetchDevices, fetchBranches, fetchIncidents } = useDataStore();
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedBranchForContact, setSelectedBranchForContact] = useState<any>(null);

  useEffect(() => {
    fetchDevices();
    fetchBranches();
    fetchIncidents();
  }, [fetchDevices, fetchBranches, fetchIncidents]);

  // Strategic Filtered Data
  const filteredIncidents = useMemo(() => {
    if (branchFilter === "all") return incidents;
    return incidents.filter(i => String(i.branchId) === branchFilter);
  }, [incidents, branchFilter]);

  // 1. National System Health
  const systemHealth = useMemo(() => {
    const total = devices.length;
    if (total === 0) return { online: 0, offline: 0, percent: 0 };
    const online = devices.filter(d => d.status === 'online').length;
    const offline = total - online;
    const percent = Math.round((online / total) * 100);
    return { online, offline, percent };
  }, [devices]);

  // 2. Financial Impact (Estimated Loss in FRW)
  const financialImpact = useMemo(() => {
    const rates = {
      critical: 1500000,
      high: 500000,
      medium: 150000,
      low: 50000
    };
    return filteredIncidents.reduce((acc, i) => {
      const severity = (i.severity || 'medium').toLowerCase() as keyof typeof rates;
      return acc + (rates[severity] || rates.medium);
    }, 0);
  }, [filteredIncidents]);

  // 3. Resolution Rate
  const resolutionStats = useMemo(() => {
    const total = filteredIncidents.length;
    if (total === 0) return { resolved: 0, rate: 0 };
    const resolved = filteredIncidents.filter(i => i.status === "resolved").length;
    const rate = ((resolved / total) * 100).toFixed(1);
    return { resolved, rate };
  }, [filteredIncidents]);

  // 4. Branch Performance Ranking
  const branchPerformance = useMemo(() => {
    return branches.map(b => {
      const bIncidents = incidents.filter(i => String(i.branchId) === String(b.id));
      const bResolved = bIncidents.filter(i => i.status === "resolved").length;
      const resRate = bIncidents.length > 0 ? (bResolved / bIncidents.length * 100) : 100;
      return {
        id: b.id,
        name: b.name,
        incidents: bIncidents.length,
        resRate: resRate.toFixed(1),
        manager: "Manager " + b.name.split(' ')[0] // Mock manager name
      };
    }).sort((a, b) => b.incidents - a.incidents).slice(0, 5);
  }, [branches, incidents]);

  // 5. Incident Heatmap (by Province)
  const provinceStats = useMemo(() => {
    const provinces = ["Kigali", "Northern", "Southern", "Eastern", "Western"];
    return provinces.map(p => ({
      name: p,
      value: incidents.filter(i => {
        const branch = branches.find(b => String(b.id) === String(i.branchId));
        return branch?.region === p;
      }).length
    })).sort((a, b) => b.value - a.value);
  }, [incidents, branches]);

  // 6. High Severity Queue (HQ only sees High/Critical)
  const highSeverityQueue = useMemo(() => {
    return filteredIncidents
      .filter(i => (i.severity === "critical" || i.severity === "high") && i.status !== "resolved")
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [filteredIncidents]);

  // Trend Data (Filtered)
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toDateString();
    });

    return last7Days.map(day => {
      const count = filteredIncidents.filter(i => new Date(i.time).toDateString() === day).length;
      return {
        name: day.split(' ').slice(1, 3).join(' '),
        incidents: count
      };
    });
  }, [filteredIncidents]);

  const handleContactBranch = (branch: any) => {
    setSelectedBranchForContact(branch);
    setIsContactDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-secondary/10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">National Strategic Command</h1>
          <p className="text-muted-foreground">Strategic infrastructure security and national performance analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[200px] bg-card border-border">
              <Building2 className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">National (All Branches)</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2 shadow-card" onClick={() => navigate({ to: '/dashboard/reports' })}>
            <FileText className="h-4 w-4 text-primary" /> Executive Export
          </Button>
        </div>
      </div>

      {/* Strategic KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <Kpi 
          icon={Activity} 
          label="National System Health" 
          value={`${systemHealth.percent}% Online`} 
          trend={`${systemHealth.offline} Units Offline`} 
          tone={systemHealth.percent > 95 ? "success" : "warning"} 
        />
        <Kpi 
          icon={CheckCircle2} 
          label="National Resolution Rate" 
          value={`${resolutionStats.rate}%`} 
          trend={`${resolutionStats.resolved} Issues Fixed`} 
          tone="success" 
        />
        <Kpi 
          icon={ShieldAlert} 
          label="Unresolved Threats" 
          value={String(filteredIncidents.filter(i => i.status !== "resolved").length)} 
          trend="Requires Attention" 
          tone="critical" 
        />
        <Kpi 
          icon={Wallet} 
          label="Estimated Damage Cost" 
          value={`${financialImpact.toLocaleString()} FRW`} 
          trend="Projected Impact" 
          tone="critical" 
        />
        <Kpi 
          icon={TrendingUp} 
          label="Active Branches" 
          value={String(branches.length)} 
          trend="Nationwide Coverage" 
          tone="default" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* National Vandalism Trends */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Strategic Vandalism Trends
              </h2>
              <p className="text-xs text-muted-foreground">National incident frequency analysis (Filtered by Branch)</p>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorIncidents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Heatmap (Mini) */}
        <div className="bg-card border border-border rounded-xl shadow-card p-6 flex flex-col">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Regional Hotspots
          </h2>
          <div className="flex-1 space-y-4">
            {provinceStats.map((p, idx) => (
              <div key={p.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{p.name} Province</span>
                  <span className="text-primary font-bold">{p.value} Incidents</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${idx === 0 ? 'bg-primary' : 'bg-primary/60'}`} 
                    style={{ width: `${(p.value / (provinceStats[0].value || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">
              Geographical distribution of threats
            </p>
          </div>
        </div>

        {/* Branch Performance Ranking */}
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Branch Performance Ranking
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-muted-foreground bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Branch</th>
                  <th className="text-center px-4 py-2 font-medium">Alerts</th>
                  <th className="text-center px-4 py-2 font-medium">Efficiency</th>
                  <th className="text-right px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {branchPerformance.map((b) => (
                  <tr key={b.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-center font-bold text-primary">{b.incidents}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${Number(b.resRate) > 80 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {b.resRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleContactBranch(b)}>
                        <Phone className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic High-Severity Queue */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Executive Incident Watch
              </h2>
              <p className="text-[10px] text-muted-foreground">High-Severity items requiring strategic oversight</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate({ to: '/dashboard/map' })}>
              View Map
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-muted-foreground bg-secondary/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">ID</th>
                  <th className="text-left px-4 py-2 font-medium">Location</th>
                  <th className="text-left px-4 py-2 font-medium">Severity</th>
                  <th className="text-left px-4 py-2 font-medium">Time</th>
                  <th className="text-right px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {highSeverityQueue.length > 0 ? (
                  highSeverityQueue.map((i) => (
                    <tr key={i.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs uppercase text-muted-foreground">{i.id.split('-')[0]}</td>
                      <td className="px-4 py-3 font-medium">{i.location}</td>
                      <td className="px-4 py-3"><SeverityPill level={i.severity} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(i.time).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-right"><StatusPill status={i.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                      No high-severity threats active.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contact Branch Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact Branch Manager</DialogTitle>
            <DialogDescription>
              Establish direct communication with the manager of {selectedBranchForContact?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/20">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-bold">{selectedBranchForContact?.manager}</p>
                <p className="text-sm text-muted-foreground">Operations Manager</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button className="w-full gap-2" onClick={() => {
                toast.success("Dialing " + selectedBranchForContact?.name + "...");
                setIsContactDialogOpen(false);
              }}>
                <Phone className="h-4 w-4" /> Voice Call (Direct)
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => {
                toast.success("Opening WhatsApp chat...");
                setIsContactDialogOpen(false);
              }}>
                <Send className="h-4 w-4" /> Message via WhatsApp
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsContactDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

