import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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
import { useDataStore, Technician } from "@/lib/data";
import { User as UserIcon, Mail, Phone, ShieldCheck, Briefcase, Plus, Search, Trash2, Edit2, Building2, AlertTriangle, Upload, X } from "lucide-react";
import { Pagination, SeverityPill } from "../../shared/DashboardComponents";
import { BASE_URL } from "@/lib/config";

export function TechniciansPage() {
  const { technicians, branches, fetchTechnicians, fetchBranches, addTechnician, updateTechnician, deleteTechnician } = useDataStore();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [technicianToDelete, setTechnicianToDelete] = useState<Technician | null>(null);

  const [formData, setFormData] = useState({
    staffId: "",
    fullName: "",
    email: "",
    phone: "",
    role: "",
    branchId: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const MAX_PROFILE_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

  useEffect(() => {
    fetchTechnicians();
    fetchBranches();
  }, [fetchTechnicians, fetchBranches]);

  const filteredTechnicians = technicians.filter((t) =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.staffId.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredTechnicians.length / rowsPerPage);
  const paginatedTechnicians = filteredTechnicians.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleOpenAdd = () => {
    setEditingTechnician(null);
    setFormData({
      staffId: "",
      fullName: "",
      email: "",
      phone: "",
      role: "Senior Technician",
      branchId: branches[0]?.id || "",
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (tech: Technician) => {
    setEditingTechnician(tech);
    setFormData({
      staffId: tech.staffId,
      fullName: tech.fullName,
      email: tech.email,
      phone: tech.phone,
      role: tech.role,
      branchId: String(tech.branchId),
    });
    setSelectedFile(null);
    setPreviewUrl(tech.profileImage ? `${BASE_URL}${tech.profileImage}` : null);
    setFileError(null);
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileError(null);
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileError("Image is too large. Please select a file smaller than 10MB.");
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append("staffId", formData.staffId);
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("role", formData.role);
    data.append("branchId", formData.branchId);
    if (selectedFile) {
      data.append("image", selectedFile);
    }

    if (fileError) {
      toast.error(fileError);
      return;
    }

    if (editingTechnician) {
      const result = await updateTechnician(editingTechnician.id, data);
      if (result.success) {
        toast.success("Technician updated successfully");
        setIsDialogOpen(false);
      } else {
        toast.error(result.message || "Failed to update technician. Please check the image and try again.");
      }
    } else {
      const result = await addTechnician(data);
      if (result.success) {
        toast.success("Technician added successfully");
        setIsDialogOpen(false);
      } else {
        toast.error(result.message || "Failed to add technician. Please check the form and try again.");
      }
    }
  };

  const handleDelete = async () => {
    if (!technicianToDelete) return;
    const success = await deleteTechnician(technicianToDelete.id);
    if (success) {
      toast.success("Technician record deleted");
      setIsDeleteConfirmOpen(false);
    } else {
      toast.error("Failed to delete technician");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-secondary/10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Field Technicians</h1>
          <p className="text-muted-foreground">Manage on-site maintenance and response personnel.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 shadow-lg">
          <Plus className="h-4 w-4" /> Add Technician
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-card/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or Staff ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            Showing {paginatedTechnicians.length} of {filteredTechnicians.length} technicians
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-muted-foreground bg-secondary/50 tracking-wider">
              <tr>
                <th className="text-left px-6 py-4 font-bold">Technician</th>
                <th className="text-left px-6 py-4 font-bold">Staff ID</th>
                <th className="text-left px-6 py-4 font-bold">Contact</th>
                <th className="text-left px-6 py-4 font-bold">Branch / Role</th>
                <th className="text-left px-6 py-4 font-bold">Status</th>
                <th className="text-right px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTechnicians.map((tech) => (
                <tr key={tech.id} className="hover:bg-secondary/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold overflow-hidden">
                        {tech.profileImage ? (
                          <img src={`${BASE_URL}${tech.profileImage}`} alt={tech.fullName} className="h-full w-full object-cover" />
                        ) : (
                          tech.fullName[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{tech.fullName}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{tech.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{tech.staffId}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span>{tech.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{tech.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-secondary border border-border">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium">{tech.branchName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${tech.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {tech.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tech)} className="h-8 w-8 p-0">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setTechnicianToDelete(tech);
                        setIsDeleteConfirmOpen(true);
                      }} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedTechnicians.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                    No technicians found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              {editingTechnician ? "Update Technician Record" : "Register New Technician"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="relative group">
                <div className="h-24 w-24 rounded-2xl bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden group-hover:border-primary/50 transition-colors">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Upload className="h-8 w-8 mb-1" />
                      <span className="text-[10px] font-medium">Upload Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">JPG, PNG or WEBP. Max 10MB.</p>
              {fileError && <p className="text-[10px] text-destructive mt-1">{fileError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffId">Staff ID</Label>
                <Input
                  id="staffId"
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  placeholder="e.g., TECH-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@reg.rw"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+250..."
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Designation / Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Senior Technician">Senior Technician</SelectItem>
                    <SelectItem value="Field Engineer">Field Engineer</SelectItem>
                    <SelectItem value="Maintenance Officer">Maintenance Officer</SelectItem>
                    <SelectItem value="Security Lead">Security Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Assigned Branch</Label>
                <Select
                  value={formData.branchId}
                  onValueChange={(v) => setFormData({ ...formData, branchId: v })}
                >
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingTechnician ? "Save Changes" : "Register Technician"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete the record for <span className="font-bold text-foreground">{technicianToDelete?.fullName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Technician</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
