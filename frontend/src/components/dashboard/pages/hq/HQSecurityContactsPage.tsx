import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataStore } from "@/lib/data";
import { ShieldCheck, User, Mail, Phone, Building2, Filter, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "../../shared/DashboardComponents";

export function HQSecurityContactsPage() {
  const { 
    securityContacts, 
    branches, 
    fetchSecurityContacts, 
    fetchBranches 
  } = useDataStore();
  
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    fetchSecurityContacts();
    fetchBranches();
  }, [fetchSecurityContacts, fetchBranches]);

  const filteredContacts = useMemo(() => {
    return securityContacts.filter((c) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase()) ||
        (c.district && c.district.toLowerCase().includes(search.toLowerCase()));
      
      const matchesBranch = branchFilter === "all" || String(c.branchId) === branchFilter;
      
      return matchesSearch && matchesBranch;
    });
  }, [securityContacts, search, branchFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, branchFilter]);

  const totalPages = Math.ceil(filteredContacts.length / rowsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Audit data: count contacts per branch
  const branchAudit = useMemo(() => {
    const counts: Record<string, number> = {};
    branches.forEach(b => counts[b.id] = 0);
    securityContacts.forEach(c => {
      if (counts[c.branchId] !== undefined) {
        counts[c.branchId]++;
      }
    });
    return counts;
  }, [branches, securityContacts]);

  const lowPersonnelBranches = branches.filter(b => branchAudit[b.id] < 2);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Overview Cards for Audit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Personnel</p>
              <h3 className="text-2xl font-bold">{securityContacts.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-success">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Branches</p>
              <h3 className="text-2xl font-bold">{branches.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className={lowPersonnelBranches.length > 0 ? "bg-warning/5 border-warning/20" : "bg-success/5 border-success/20"}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Understaffed Branches</p>
              <h3 className="text-2xl font-bold">{lowPersonnelBranches.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">National Security Directory</h2>
          </div>
          
          <div className="flex flex-1 gap-4 items-center justify-end">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Search by name, phone, email..."
              className="max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-secondary/20 p-3 px-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>HQ Oversight Mode: View-only access to all regional security personnel. Contact branch responders directly for escalation.</span>
        </div>

        <ScrollArea className="h-[calc(100vh-380px)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="text-left">
                  <th className="p-4 font-medium text-muted-foreground">Personnel Name</th>
                  <th className="p-4 font-medium text-muted-foreground">Direct Contact</th>
                  <th className="p-4 font-medium text-muted-foreground">Assigned Branch</th>
                  <th className="p-4 font-medium text-muted-foreground">Coverage Area</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedContacts.length > 0 ? (
                  paginatedContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4 font-medium flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <User className="h-4 w-4" />
                        </div>
                        {contact.name}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Mail className="h-3.5 w-3.5" />
                            {contact.email}
                          </div>
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-primary hover:underline font-medium">
                            <Phone className="h-3.5 w-3.5" />
                            {contact.phone}
                          </a>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs bg-secondary px-2.5 py-1 rounded-full w-fit font-semibold border border-border">
                          <Building2 className="h-3 w-3" />
                          {contact.branch?.name || "Unknown"}
                        </div>
                      </td>
                      <td className="p-4">
                        {contact.district ? (
                          <div className="space-y-1">
                            <div className="text-xs font-medium">{contact.district}, {contact.province}</div>
                            <div className="text-[10px] text-muted-foreground">{contact.cell}, {contact.sector}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No specific area</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20 uppercase">
                          Active Responder
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No personnel matching your criteria were found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ScrollArea>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Audit Summary for HQ */}
      {branchFilter === "all" && lowPersonnelBranches.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <h4 className="text-sm font-bold text-warning flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" /> Audit Alert: Understaffed Branches
            </h4>
            <div className="flex flex-wrap gap-2">
              {lowPersonnelBranches.map(b => (
                <div key={b.id} className="text-[10px] px-2 py-1 bg-warning/10 border border-warning/20 rounded-md text-warning font-bold">
                  {b.name}: {branchAudit[b.id]} Responders
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">National policy requires at least 2 security responders per branch for effective escalation.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
