import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useDataStore } from "@/lib/data";
import { useAuthStore } from "@/lib/auth";
import { ShieldCheck, User, Mail, Phone, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Pagination } from "../../shared/DashboardComponents";

export function BranchSecurityContactsPage() {
  const { 
    securityContacts, 
    fetchSecurityContacts, 
    fetchBranches, 
    addSecurityContact, 
    updateSecurityContact, 
    deleteSecurityContact,
    fetchProvinces,
    fetchDistricts,
    fetchSectors,
    fetchCells
  } = useDataStore();
  const user = useAuthStore((state) => state.user);
  
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [cells, setCells] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSecurityContacts(user?.branchId);
    fetchBranches();
    fetchProvinces().then(setProvinces);
  }, [fetchSecurityContacts, fetchBranches, fetchProvinces, user]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    branchId: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
  });

  useEffect(() => {
    if (formData.province) {
      fetchDistricts(formData.province).then(setDistricts);
      setFormData(prev => ({ ...prev, district: "", sector: "", cell: "" }));
      setSectors([]);
      setCells([]);
    } else {
      setDistricts([]);
      setSectors([]);
      setCells([]);
    }
  }, [formData.province, fetchDistricts]);

  useEffect(() => {
    if (formData.province && formData.district) {
      fetchSectors(formData.province, formData.district).then(setSectors);
      setFormData(prev => ({ ...prev, sector: "", cell: "" }));
      setCells([]);
    } else {
      setSectors([]);
      setCells([]);
    }
  }, [formData.province, formData.district, fetchSectors]);

  useEffect(() => {
    if (formData.province && formData.district && formData.sector) {
      fetchCells(formData.province, formData.district, formData.sector).then(setCells);
      setFormData(prev => ({ ...prev, cell: "" }));
    } else {
      setCells([]);
    }
  }, [formData.province, formData.district, formData.sector, fetchCells]);

  const filteredContacts = securityContacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.toLowerCase().includes(search.toLowerCase()) ||
    (c.district && c.district.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredContacts.length / rowsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleOpenAdd = () => {
    setEditingContact(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      branchId: user?.branchId || "",
      province: "",
      district: "",
      sector: "",
      cell: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      branchId: String(contact.branchId),
      province: contact.province || "",
      district: contact.district || "",
      sector: contact.sector || "",
      cell: contact.cell || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const address = formData.cell ? `${formData.cell}, ${formData.sector}, ${formData.district}, ${formData.province}` : "";

    const payload = {
      ...formData,
      branchId: parseInt(formData.branchId),
      address: address,
      lat: -1.9441, // Default Kigali
      lng: 30.0619
    };

    let success;
    if (editingContact) {
      success = await updateSecurityContact(editingContact.id, payload);
      if (success) toast.success("Security contact updated successfully");
    } else {
      success = await addSecurityContact(payload);
      if (success) toast.success("Security contact added successfully and auto-linked to nearby devices");
    }

    if (success) {
      setIsDialogOpen(false);
    } else {
      toast.error("Failed to save security contact");
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this security contact?")) {
      const success = await deleteSecurityContact(id);
      if (success) {
        toast.success("Security contact deleted");
      } else {
        toast.error("Failed to delete security contact");
      }
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Security Contacts</h2>
          </div>
          <Input
            placeholder="Search contacts…"
            className="ml-auto max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" /> Add Contact
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="text-left">
                  <th className="p-4 font-medium text-muted-foreground">Name</th>
                  <th className="p-4 font-medium text-muted-foreground">Contact Info</th>
                  <th className="p-4 font-medium text-muted-foreground">Branch</th>
                  <th className="p-4 font-medium text-muted-foreground">Assigned Area</th>
                  <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedContacts.length > 0 ? (
                  paginatedContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
                          <div className="flex items-center gap-2 text-xs">
                            <Phone className="h-3.5 w-3.5" />
                            {contact.phone}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs bg-secondary px-2 py-1 rounded-full w-fit">
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
                          <span className="text-xs text-muted-foreground italic">No area assigned</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(contact)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(contact.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No security contacts found for this branch.
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Security Contact" : "Add Security Contact"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+250 788 000 000"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Province</Label>
                <Select
                  value={formData.province}
                  onValueChange={(v) => setFormData({ ...formData, province: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Select
                  value={formData.district}
                  onValueChange={(v) => setFormData({ ...formData, district: v })}
                  disabled={!formData.province}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select
                  value={formData.sector}
                  onValueChange={(v) => setFormData({ ...formData, sector: v })}
                  disabled={!formData.district}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cell</Label>
                <Select
                  value={formData.cell}
                  onValueChange={(v) => setFormData({ ...formData, cell: v })}
                  disabled={!formData.sector}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cell" />
                  </SelectTrigger>
                  <SelectContent>
                    {cells.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : editingContact ? "Update Contact" : "Add Contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
