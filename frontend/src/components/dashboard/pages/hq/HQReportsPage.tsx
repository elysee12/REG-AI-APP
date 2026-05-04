import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, Building2, Search } from "lucide-react";
import { useDataStore } from "@/lib/data";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function HQReportsPage() {
  const { incidents, branches, devices, fetchIncidents, fetchBranches, fetchDevices } = useDataStore();
  
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [deviceSearch, setDeviceSearch] = useState("");
  const [filterPreset, setFilterPreset] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly");

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

  const setPreset = (preset: "daily" | "weekly" | "monthly") => {
    const end = new Date();
    const start = new Date();
    if (preset === "daily") start.setDate(end.getDate() - 1);
    else if (preset === "weekly") start.setDate(end.getDate() - 7);
    else if (preset === "monthly") start.setMonth(end.getMonth() - 1);
    
    setDateFrom(start.toISOString().split('T')[0]);
    setDateTo(end.toISOString().split('T')[0]);
    setFilterPreset(preset);
  };

  useEffect(() => {
    fetchBranches();
    fetchIncidents();
    fetchDevices();
  }, [fetchBranches, fetchIncidents, fetchDevices]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      const incidentDate = new Date(i.time).toISOString().split('T')[0];
      const matchesDate = incidentDate >= dateFrom && incidentDate <= dateTo;
      const matchesBranch = selectedBranch === "all" || String(i.branchId) === selectedBranch;
      const matchesDevice = deviceSearch.trim() === "" || String(i.deviceId).toLowerCase().includes(deviceSearch.trim().toLowerCase());
      return matchesDate && matchesBranch && matchesDevice;
    });
  }, [incidents, dateFrom, dateTo, selectedBranch, deviceSearch]);

  // Table Data: Group by Device for HQ Report
  const reportData = useMemo(() => {
    const dataMap: Record<string, {
      deviceId: string;
      deviceName: string;
      branchName: string;
      total: number;
      critical: number;
      high: number;
      medium: number;
      resolved: number;
      lastIncident: string;
    }> = {};

    filteredIncidents.forEach(i => {
      if (!dataMap[i.deviceId]) {
        const device = devices.find(d => d.id === i.deviceId);
        dataMap[i.deviceId] = {
          deviceId: i.deviceId,
          deviceName: i.deviceName || 'Unknown Device',
          branchName: branches.find(b => String(b.id) === String(i.branchId))?.name || 'Unknown',
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          resolved: 0,
          lastIncident: i.time
        };
      }
      const entry = dataMap[i.deviceId];
      entry.total++;
      if (i.severity === 'critical') entry.critical++;
      else if (i.severity === 'high') entry.high++;
      else entry.medium++;

      if (i.status === 'resolved' || i.status === 'solved') entry.resolved++;
      if (new Date(i.time) > new Date(entry.lastIncident)) entry.lastIncident = i.time;
    });

    return Object.values(dataMap).sort((a, b) => b.total - a.total);
  }, [filteredIncidents, devices, branches]);

  const paginatedData = reportData;

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
      <div className="flex flex-col gap-6 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Executive HQ Report</h1>
            <p className="text-muted-foreground">Corporate report layout with device serial-number focus and executive performance metrics.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePrint()} className="font-bold" disabled={isPrinting}>
              <Printer className="h-4 w-4 mr-2" /> {isPrinting ? "Preparing..." : "Print Report"}
            </Button>
            <Button size="sm" className="font-bold">
              <Download className="h-4 w-4 mr-2" /> Export Report
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm print:hidden">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setFilterPreset("custom"); }}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setFilterPreset("custom"); }}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Branch Focus</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-9 text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <SelectValue placeholder="All branches" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Device Serial Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  placeholder="Search serial number"
                  className="h-9 text-xs pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="print-container space-y-8">
        <div className="hidden print:block mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-[#f8f9fa] border border-border rounded flex items-center justify-center text-[#c22026] font-black text-2xl shadow-sm">AI</div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-[#1a1a1a]">HQ Corporate Security Report</h1>
                <p className="text-[10px] text-[#666] uppercase font-bold tracking-[0.2em]">Board review summary</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black uppercase text-[#1a1a1a]">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
              <p className="text-[10px] text-[#999] font-bold">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="h-1 w-full bg-[#c22026]" />
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between mb-6 print:mb-4">
            <div>
              <h2 className="text-lg font-bold">Corporate Device Performance Table</h2>
              <p className="text-sm text-muted-foreground max-w-2xl print:hidden">Filter by serial number to focus on single units or device clusters in the HQ report.</p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={() => handlePrint()} disabled={isPrinting}>
                <Printer className="h-4 w-4 mr-2" /> {isPrinting ? "Printing" : "Print"}
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6 print:hidden">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setFilterPreset("custom"); }}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setFilterPreset("custom"); }}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-9 text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <SelectValue placeholder="Any Branch" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Device Serial</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  placeholder="Search serial number"
                  className="h-9 text-xs pl-10"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-y-2">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground bg-secondary/50">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Device ID</th>
                  <th className="text-left px-6 py-3 font-semibold">Device Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Branch</th>
                  <th className="text-center px-6 py-3 font-semibold">Total Events</th>
                  <th className="text-center px-6 py-3 font-semibold">Critical</th>
                  <th className="text-center px-6 py-3 font-semibold">High</th>
                  <th className="text-center px-6 py-3 font-semibold">Resolved %</th>
                  <th className="text-right px-6 py-3 font-semibold">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row) => {
                    const resolvedRate = row.total ? (row.resolved / row.total) * 100 : 0;
                    return (
                      <tr key={row.deviceId} className="bg-card border border-border rounded-2xl transition-shadow hover:shadow-lg">
                        <td className="px-6 py-4 font-mono text-xs text-primary">{row.deviceId}</td>
                        <td className="px-6 py-4 font-semibold">{row.deviceName}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{row.branchName}</td>
                        <td className="px-6 py-4 text-center font-semibold">{row.total}</td>
                        <td className="px-6 py-4 text-center text-destructive font-semibold">{row.critical}</td>
                        <td className="px-6 py-4 text-center text-warning font-semibold">{row.high}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-xs font-bold">{resolvedRate.toFixed(1)}%</div>
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-muted-foreground">{new Date(row.lastIncident).toLocaleDateString()}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground italic bg-secondary/5">
                      No matching device records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col lg:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Showing {reportData.length} devices in full report</p>
          </div>
        </div>

        <div className="hidden print:block mt-12 pt-8 border-t border-border text-[10px] text-muted-foreground">
          <div className="flex justify-between items-center">
            <p>© 2026 GRIDGuard AI - Rwanda Energy Group Infrastructure Protection. Confidential Security Audit. All detection data is AI-verified and stored on encrypted servers.</p>
            <p>Page 1 of 1</p>
          </div>
        </div>
      </div>
    </div>
  );
}

