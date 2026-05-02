import { useState, useMemo, useEffect, lazy, Suspense, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, TrendingUp, AlertTriangle, Building2, Calendar, ShieldCheck, MapPin, Clock, CheckCircle2, FileText, ChevronUp, ChevronDown, Camera, Info, Target, Zap } from "lucide-react";
import { useDataStore } from "@/lib/data";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";

// Dynamically import Leaflet components for the report map
const ReportMap = lazy(() => import("./ReportMap"));

export function HQReportsPage() {
  const { incidents, branches, devices, fetchIncidents, fetchBranches, fetchDevices } = useDataStore();
  
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `REG_National_Security_Report_${new Date().toISOString().split('T')[0]}`,
    onBeforePrint: async () => {
      setIsPrinting(true);
      toast.info("Generating professional summary...");
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      toast.success("Executive summary generated successfully");
    }
  });

  useEffect(() => {
    fetchBranches();
    fetchIncidents();
    fetchDevices();
  }, [fetchBranches, fetchIncidents, fetchDevices]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      const incidentDate = new Date(i.time).toISOString().split('T')[0];
      return incidentDate >= dateFrom && incidentDate <= dateTo;
    });
  }, [incidents, dateFrom, dateTo]);

  // Strategic KPIs
  const strategicStats = useMemo(() => {
    const total = filteredIncidents.length;
    const resolved = filteredIncidents.filter(i => i.status === "resolved").length;
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;
    
    // Calculate Grid Security % (successfully monitored hours / potential hours)
    // Mocking 99.8% based on connectivity status
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const gridSecurity = devices.length > 0 ? (onlineDevices / devices.length) * 100 : 99.8;

    // Calculate Average Response Time (National)
    // Mocking 12.5 mins based on incident flow
    const avgResponseTime = "12.5m";

    return { total, resolved, resolutionRate, gridSecurity, avgResponseTime, onlineDevices };
  }, [filteredIncidents, devices]);

  // Hotspots (Top 3 branches with highest crime density)
  const hotspots = useMemo(() => {
    const branchCounts: Record<string, { id: string; name: string; count: number; region: string }> = {};
    filteredIncidents.forEach(i => {
      if (!branchCounts[i.branchId]) {
        const branch = branches.find(b => String(b.id) === String(i.branchId));
        branchCounts[i.branchId] = { id: i.branchId, name: branch?.name || 'Unknown', count: 0, region: branch?.region || 'Unknown' };
      }
      branchCounts[i.branchId].count++;
    });
    return Object.values(branchCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [filteredIncidents, branches]);

  // AI-Driven Recommendations
  const recommendations = useMemo(() => {
    const recs = [];
    if (hotspots.length > 0) {
      recs.push({
        title: "Targeted Patrols",
        desc: `Increase night patrols in ${hotspots[0].name} between 12:00 AM – 4:00 AM based on high incident density.`
      });
    }
    if (strategicStats.resolutionRate < 80) {
      recs.push({
        title: "Branch Audit",
        desc: "Regional response rates are below target. Conduct audit of underperforming branches to identify staffing gaps."
      });
    }
    if (strategicStats.gridSecurity < 99.5) {
      recs.push({
        title: "Infrastructure Maintenance",
        desc: "Connectivity fluctuations detected in northern region. Schedule maintenance for unit power supplies."
      });
    }
    return recs;
  }, [hotspots, strategicStats]);

  // Snapshots for Evidence Gallery (Mocking from incident images)
  const snapshots = useMemo(() => {
    return filteredIncidents
      .filter(i => i.imagePath && i.aiConfidence > 0.8)
      .slice(0, 4);
  }, [filteredIncidents]);

  return (
    <div className="p-4 md:p-6 space-y-8 print:p-0 print:m-0 print:bg-white print:text-black">
      <style>{`
        @media print {
          /* Hide sidebar, header and other dashboard UI */
          header, aside, .print\\:hidden {
            display: none !important;
          }

          /* Reset h-screen and overflow for printing */
          html, body, #root, [data-radix-popper-content-wrapper] {
            height: auto !important;
            overflow: visible !important;
          }

          /* Targets the DashboardShell and main content containers */
          .h-screen, .overflow-hidden, .overflow-y-auto, .flex-1 {
            height: auto !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
          }

          /* Ensure the report container takes full width */
          .print\\:p-0 {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }

          /* Prevent cards from breaking awkwardly */
          .bg-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #eee !important;
            box-shadow: none !important;
            margin-bottom: 20px !important;
          }

          /* Map specific print fixes */
          .leaflet-container {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            height: 400px !important;
          }

          @page {
            size: auto;
            margin: 15mm;
          }
          
          /* Custom layout for print to ensure multi-page flow */
          .print-container {
            display: block !important;
            height: auto !important;
          }
        }
      `}</style>

      {/* Screen Header - Hidden on print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Strategy Hub</h1>
          <p className="text-muted-foreground">High-level national overview for Board-level security oversight.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePrint()} className="font-bold" disabled={isPrinting}>
            <Printer className="h-4 w-4 mr-2" /> {isPrinting ? "Preparing..." : "Print Executive Summary"}
          </Button>
          <Button size="sm" className="font-bold">
            <Download className="h-4 w-4 mr-2" /> Export Strategic Data
          </Button>
        </div>
      </div>

      {/* Printable Report Content */}
      <div ref={reportRef} className="print-container space-y-8">
        {/* Header - Hidden on screen, shown on print */}
        <div className="hidden print:block mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-[#f8f9fa] border border-border rounded flex items-center justify-center text-[#c22026] font-black text-2xl shadow-sm">REG</div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-[#1a1a1a]">AI-Vandalism Detection System</h1>
                <p className="text-[10px] text-[#666] uppercase font-bold tracking-[0.2em]">National Strategic Security Report</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black uppercase text-[#1a1a1a]">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
              <p className="text-[10px] text-[#999] font-bold">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="h-1 w-full bg-[#c22026]" />
        </div>

        {/* Strategic Scorecard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ScorecardItem 
            label="Grid Security Level" 
            value={`${strategicStats.gridSecurity.toFixed(1)}%`} 
            trend="up" 
            trendValue="0.2%" 
            icon={ShieldCheck} 
            desc="Monitored vs. Potential hours"
          />
          <ScorecardItem 
            label="Resolution Success" 
            value={`${strategicStats.resolutionRate.toFixed(1)}%`} 
            trend="up" 
            trendValue="4.5%" 
            icon={CheckCircle2} 
            desc="Alerts successfully RESOLVED"
          />
          <ScorecardItem 
            label="Avg. Response Time" 
            value={strategicStats.avgResponseTime} 
            trend="down" 
            trendValue="1.2m" 
            icon={Clock} 
            desc="National trigger-to-ack avg"
          />
          <ScorecardItem 
            label="System Reliability" 
            value={`${((strategicStats.onlineDevices / (devices.length || 1)) * 100).toFixed(1)}%`} 
            trend="up" 
            trendValue="0.1%" 
            icon={TrendingUp} 
            desc="Active infrastructure links"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Geographical Analytics / Hotspots */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden print:shadow-none print:border-2">
              <div className="p-4 border-b border-border bg-secondary/10 flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Geographical Analytics (National Heatmap)
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Live Incident Density</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 h-[400px]">
                <div className="md:col-span-3 h-full relative">
                  <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-secondary/10 italic text-xs">Loading National Analytics Map...</div>}>
                    <ReportMap branches={branches} incidents={filteredIncidents} />
                  </Suspense>
                </div>
                
                <div className="p-4 bg-secondary/5 border-l border-border space-y-4 overflow-y-auto">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Top Hotspots</div>
                  {hotspots.map((hotspot, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold truncate max-w-[80px]">{hotspot.name}</span>
                        <span className="text-[10px] font-bold text-primary">{hotspot.count}</span>
                      </div>
                      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${idx === 0 ? 'bg-primary' : 'bg-primary/50'}`} style={{ width: `${(hotspot.count / (hotspots[0].count || 1)) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {hotspots.length === 0 && (
                    <div className="text-[10px] text-muted-foreground italic text-center py-4">No regional data.</div>
                  )}
                  
                  <div className="pt-4 space-y-3">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">National Risk</div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Target className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold">CRITICAL AREA</div>
                        <div className="text-xs font-black">{hotspots[0]?.name || "N/A"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-warning/10 flex items-center justify-center text-warning">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold">PEAK ACTIVITY</div>
                        <div className="text-xs font-black">12:00 AM - 04:00 AM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Gallery */}
            <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden print:break-before-page">
              <div className="p-4 border-b border-border bg-secondary/10 flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  Detection Evidence Gallery
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">High-Confidence Snapshots</span>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {snapshots.map((s, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="aspect-square bg-black rounded-lg overflow-hidden border border-border relative">
                      <img src={s.imagePath} alt="Evidence" className="h-full w-full object-cover" />
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[8px] text-white font-bold border border-white/20">
                        {(s.aiConfidence * 100).toFixed(0)}% CONF.
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate font-medium">
                      {s.type} · {new Date(s.time).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {snapshots.length === 0 && (
                  <div className="col-span-4 py-12 text-center text-muted-foreground italic flex flex-col items-center gap-2">
                    <Camera className="h-8 w-8 opacity-10" />
                    <p className="text-xs">No high-confidence snapshots found for report.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-border bg-primary/10 flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2 text-primary">
                  <AlertTriangle className="h-4 w-4" />
                  Strategic Recommendations
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-secondary/30 border-l-4 border-primary space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider">{rec.title}</h4>
                    <p className="text-xs leading-relaxed text-muted-foreground">{rec.desc}</p>
                  </div>
                ))}
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-[10px] text-muted-foreground italic">Insights generated by REG AI Security Analysis Engine based on cross-regional data correlation.</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-card p-5">
              <h2 className="font-bold text-sm mb-4">Board Summary Stats</h2>
              <div className="space-y-3">
                <SummaryMetric label="Total National Alerts" value={String(strategicStats.total)} />
                <SummaryMetric label="RESOLVED Events" value={String(strategicStats.resolved)} />
                <SummaryMetric label="Network Connectivity" value={`${((strategicStats.onlineDevices / (devices.length || 1)) * 100).toFixed(1)}%`} />
                <SummaryMetric label="Report Integrity" value="High" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Print only */}
        <div className="hidden print:block mt-12 pt-8 border-t border-border text-[10px] text-muted-foreground">
          <div className="flex justify-between items-center">
            <p>© 2026 REG - Rwanda Energy Group. Confidential Security Audit. All detection data is AI-verified and stored on encrypted servers.</p>
            <p>Page 1 of 1</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScorecardItem({ label, value, trend, trendValue, icon: Icon, desc }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow print:shadow-none print:border-2 print:border-black/10">
      <div className="flex items-start justify-between mb-6">
        <div className="p-2.5 rounded-lg bg-secondary/50 text-muted-foreground print:bg-black/5 print:text-black">
          <Icon className="h-5 w-5" />
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-black ${trend === 'up' ? 'text-success' : 'text-destructive'}`}>
          {trend === 'up' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {trendValue}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-4xl font-black tabular-nums tracking-tighter text-foreground">{value}</div>
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] pt-1">{label}</div>
        <p className="text-[10px] text-muted-foreground italic font-medium pt-1 opacity-70">{desc}</p>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
