import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, MapPin, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useDataStore } from "@/lib/data";
import { SeverityPill, StatusPill, Pagination } from "../../shared/DashboardComponents";
import { toast } from "sonner";

export function BranchReportsPage() {
  const user = useAuthStore((state) => state.user);
  const { devices, incidents, fetchIncidents, fetchDevices } = useDataStore();
  
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    fetchDevices();
    const branchId = user?.role === 'BRANCH_USER' && user.branchId ? String(user.branchId) : undefined;
    fetchIncidents(branchId);
  }, [fetchDevices, fetchIncidents, user]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      // Role-based data privacy filtering
      if (user?.role === 'BRANCH_USER' && user.branchId && String(i.branchId) !== String(user.branchId)) {
        return false;
      }

      const incidentDate = new Date(i.time).toISOString().split('T')[0];
      const matchesDate = incidentDate >= dateFrom && incidentDate <= dateTo;
      const matchesUnit = selectedUnit === "all" || i.deviceId === selectedUnit;
      const matchesType = selectedType === "all" || i.type === selectedType;
      return matchesDate && matchesUnit && matchesType;
    });
  }, [incidents, dateFrom, dateTo, selectedUnit, selectedType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, selectedUnit, selectedType]);

  const totalPages = Math.ceil(filteredIncidents.length / rowsPerPage);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const stats = useMemo(() => {
    const total = filteredIncidents.length;
    const active = filteredIncidents.filter(i => i.status === "active" || i.status === "pending").length;
    const resolved = filteredIncidents.filter(i => i.status === "solved").length;
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";
    
    return { total, active, resolved, resolutionRate };
  }, [filteredIncidents]);

  const handlePrint = () => {
    window.print();
    toast.success("Preparing print view...");
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Unit ID,Location,Type,Severity,Time,Status\n"
      + filteredIncidents.map(i => `${i.deviceId},"${i.location}",${i.type},${i.severity},${i.time},${i.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `incident_report_${user?.branchName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exporting data as CSV...");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vandalism Incident History</h1>
          <p className="text-muted-foreground">Historical security data for all detection units in {user?.branchName}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print Branch Log</Button>
          <Button size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export Branch Data</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card p-5 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date Range</label>
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
            <label className="text-xs font-medium text-muted-foreground">Unit Selection</label>
            <select 
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="block h-9 rounded-md border border-input bg-background px-3 text-xs min-w-[200px]"
            >
              <option value="all">All Branch Units</option>
              {devices.filter(d => String(d.branchId) === String(user?.branchId)).map(d => (
                <option key={d.id} value={d.id}>{d.id} - {d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Incident Type</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block h-9 rounded-md border border-input bg-background px-3 text-xs min-w-[150px]"
            >
              <option value="all">All Incident Types</option>
              <option value="VANDAL">VANDAL</option>
              <option value="CLIMBING">CLIMBING</option>
              <option value="CUTTING_WIRES">CUTTING WIRES</option>
              <option value="OPENING_BOX">OPENING BOX</option>
              <option value="SUSPICIOUS">SUSPICIOUS</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UnitStat cardTitle="Branch Incidents" value={String(stats.total)} trend="Filtered Period" icon={AlertTriangle} />
        <UnitStat cardTitle="Active Alerts" value={String(stats.active)} trend="High Risk" icon={ShieldAlert} tone="critical" />
        <UnitStat cardTitle="Successful RESOLVED" value={String(stats.resolved)} trend={`${stats.resolutionRate}% rate`} icon={CheckCircle2} tone="success" />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="font-semibold">Unit-Specific Vandalism Log</h2>
            <p className="text-xs text-muted-foreground">Detailed history for each detection unit location.</p>
          </div>
          <div className="text-xs font-medium text-muted-foreground print:hidden">
            Showing {filteredIncidents.length} records
          </div>
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
              {paginatedIncidents.length > 0 ? (
                paginatedIncidents.map((item) => (
                  <tr key={item.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                          <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-mono font-bold text-xs uppercase">{item.deviceId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-medium">{item.location}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px]">{devices.find(d => d.id === item.deviceId)?.location.address || "Unknown Address"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-xs">{item.type}</span>
                    </td>
                    <td className="px-4 py-4">
                      <SeverityPill level={item.severity} />
                    </td>
                    <td className="px-4 py-4 text-xs font-mono">
                      {new Date(item.time).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill status={item.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic">
                    No incidents found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
}

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

