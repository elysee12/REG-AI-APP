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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDataStore, Branch } from "@/lib/data";
import { Edit, Trash2, MoreHorizontal, Search, Plus } from "lucide-react";
import { toast } from "sonner";

export function BranchesPage() {
  const { 
    branches, 
    addBranch, 
    updateBranch, 
    deleteBranch, 
    fetchBranches, 
    fetchProvinces, 
    fetchDistricts,
    fetchSectors,
    fetchCells
  } = useDataStore();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [cells, setCells] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    region: "",
    address: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
  });

  useEffect(() => {
    fetchBranches();
    fetchProvinces().then(setProvinces);
  }, [fetchBranches, fetchProvinces]);

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

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.region.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = `${formData.cell}, ${formData.sector}, ${formData.district}`;
    const payload = {
      name: formData.name,
      region: formData.province,
      address: address
    };
    const success = await addBranch(payload);
    if (success) {
      toast.success("Branch created successfully");
      setFormData({ name: "", region: "", address: "", province: "", district: "", sector: "", cell: "" });
      setIsAddDialogOpen(false);
    } else {
      toast.error("Failed to create branch");
    }
  };

  const handleEditClick = (branch: Branch) => {
    setSelectedBranch(branch);
    // Try to parse the address back into components if possible, or just reset
    const addressParts = branch.address.split(", ");
    setFormData({
      name: branch.name,
      region: branch.region,
      address: branch.address,
      province: branch.region,
      district: addressParts[2] || "",
      sector: addressParts[1] || "",
      cell: addressParts[0] || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    const address = `${formData.cell}, ${formData.sector}, ${formData.district}`;
    const payload = {
      name: formData.name,
      region: formData.province,
      address: address
    };
    const success = await updateBranch(selectedBranch.id, payload);
    if (success) {
      toast.success("Branch updated successfully");
      setIsEditDialogOpen(false);
      setSelectedBranch(null);
      setFormData({ name: "", region: "", address: "", province: "", district: "", sector: "", cell: "" });
    } else {
      toast.error("Failed to update branch");
    }
  };

  const handleDeleteClick = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBranch) return;
    const success = await deleteBranch(selectedBranch.id);
    if (success) {
      toast.success("Branch deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedBranch(null);
    } else {
      toast.error("Failed to delete branch");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
          <h2 className="font-semibold">Branches Management</h2>
          <div className="ml-auto flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
                className="pl-9 w-[200px] md:w-[300px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => {
              setFormData({ name: "", region: "", address: "" });
              setIsAddDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add branch
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-secondary/40">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Branch Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Province</th>
                <th className="text-left px-4 py-2.5 font-medium">District</th>
                <th className="text-left px-4 py-2.5 font-medium">ID</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3">{b.region}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.address}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{b.id}</td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(b)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(b)}
                          className="text-primary focus:text-primary focus:bg-primary/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredBranches.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                    No branches found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Branch Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Branch Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Kigali Main Branch"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="province">Province</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="district">District</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="sector">Sector</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="cell">Cell</Label>
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
            <DialogFooter>
              <Button type="submit">Create Branch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Branch Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Kigali Main Branch"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-province">Province</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="edit-district">District</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="edit-sector">Sector</Label>
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
              <div className="space-y-1.5">
                <Label htmlFor="edit-cell">Cell</Label>
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
            <DialogFooter>
              <Button type="submit">Update Branch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              <span className="font-bold text-foreground">{selectedBranch?.name}</span> and remove its
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBranch(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
