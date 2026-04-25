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
import { useDataStore } from "@/lib/data";

export function BranchesPage() {
  const { branches, addBranch, fetchBranches, fetchProvinces, fetchDistricts } = useDataStore();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    region: "",
    address: "",
  });

  useEffect(() => {
    fetchBranches();
    fetchProvinces().then(setProvinces);
  }, [fetchBranches, fetchProvinces]);

  useEffect(() => {
    if (formData.region) {
      fetchDistricts(formData.region).then(setDistricts);
    } else {
      setDistricts([]);
    }
  }, [formData.region, fetchDistricts]);

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.region.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBranch(formData);
    setFormData({ name: "", region: "", address: "" });
    setIsDialogOpen(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
          <h2 className="font-semibold">Branches Management</h2>
          <Input
            placeholder="Search branches or addresses…"
            className="ml-auto max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={() => setIsDialogOpen(true)}>+ Add branch</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-secondary/40">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Branch Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Province</th>
                <th className="text-left px-4 py-2.5 font-medium">District</th>
                <th className="text-left px-4 py-2.5 font-medium">ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3">{b.region}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.address}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{b.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <div className="space-y-1.5">
              <Label htmlFor="region">Province</Label>
              <Select
                value={formData.region}
                onValueChange={(v) => setFormData({ ...formData, region: v, address: "" })}
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
              <Label htmlFor="address">District</Label>
              <Select
                value={formData.address}
                onValueChange={(v) => setFormData({ ...formData, address: v })}
                disabled={!formData.region}
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
            <DialogFooter>
              <Button type="submit">Create Branch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
