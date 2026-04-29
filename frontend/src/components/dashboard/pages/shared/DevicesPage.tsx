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
import { useDataStore, Device } from "@/lib/data";
import { useAuthStore } from "@/lib/auth";
import { SeverityPill, StatusPill } from "../../shared/DashboardComponents";
import { Camera, Radio, Radar, MapPin, Trash2, Activity, Building2, ShieldCheck, UserPlus, X, Clock, Shield, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function DevicesPage() {
  const { 
    devices, 
    branches, 
    securityContacts,
    addDevice, 
    removeDevice, 
    fetchDevices, 
    fetchBranches,
    fetchSecurityContacts,
    linkContactToDevice,
    unlinkContactFromDevice,
    fetchProvinces,
    fetchDistricts,
    fetchSectors,
    fetchCells
  } = useDataStore();
  const incidents = useDataStore((state) => state.incidents);
  const fetchIncidents = useDataStore((state) => state.fetchIncidents);
  const user = useAuthStore((state) => state.user);
  
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [cells, setCells] = useState<string[]>([]);

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isDetectionDialogOpen, setIsDetectionDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    fetchDevices();
    fetchBranches();
    fetchSecurityContacts();
    fetchProvinces().then(setProvinces);
  }, [fetchDevices, fetchBranches, fetchSecurityContacts, fetchProvinces]);

  const handleOpenLinkDialog = (device: Device) => {
    setSelectedDevice(device);
    setIsLinkDialogOpen(true);
  };

  const handleOpenDetectionDialog = (device: Device) => {
    setSelectedDevice(device);
    fetchIncidents(undefined, device.id);
    setIsDetectionDialogOpen(true);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLinkContact = async (contactId: string) => {
    if (!selectedDevice) return;
    const success = await linkContactToDevice(contactId, selectedDevice.id);
    if (success) {
      toast.success("Security contact linked successfully");
      // Refresh selected device to show updated contacts
      const updatedDevice = useDataStore.getState().devices.find(d => d.id === selectedDevice.id);
      if (updatedDevice) setSelectedDevice(updatedDevice);
    } else {
      toast.error("Failed to link security contact");
    }
  };

  const handleUnlinkContact = async (contactId: string) => {
    if (!selectedDevice) return;
    const success = await unlinkContactFromDevice(contactId, selectedDevice.id);
    if (success) {
      toast.success("Security contact unlinked");
      // Refresh selected device
      const updatedDevice = useDataStore.getState().devices.find(d => d.id === selectedDevice.id);
      if (updatedDevice) setSelectedDevice(updatedDevice);
    } else {
      toast.error("Failed to unlink security contact");
    }
  };
  
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    serialNumber: "",
    branchId: "",
    ipAddress: "",
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

  // Filter devices based on user role and search
  const filteredDevices = devices.filter((d) => {
    const matchesSearch = d.id.toLowerCase().includes(search.toLowerCase()) || 
                         d.branchName.toLowerCase().includes(search.toLowerCase());
    if (user?.role === "HQ_ADMIN") return matchesSearch;
    return matchesSearch && d.branchName === user?.branchName;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find(b => b.id === formData.branchId);
    if (branch) {
      const address = `${formData.cell}, ${formData.sector}, ${formData.district}, ${formData.province}`;
      addDevice({
        serialNumber: formData.serialNumber,
        branchId: formData.branchId,
        branchName: branch.name,
        ipAddress: formData.ipAddress,
        province: formData.province,
        district: formData.district,
        sector: formData.sector,
        cell: formData.cell,
        address: address,
        lat: -1.9441, // Default Kigali for now, could be enhanced with real geo lookup
        lng: 30.0619
      });
      setIsDialogOpen(false);
      setFormData({ 
        serialNumber: "", 
        branchId: "", 
        ipAddress: "",
        province: "",
        district: "",
        sector: "",
        cell: ""
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user?.role === "HQ_ADMIN" ? "Network Device Management" : "Branch Devices"}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === "HQ_ADMIN" 
              ? "Overseeing all AI Vandalism Detection units across the national network."
              : `Monitoring AI units assigned to ${user?.branchName}.`}
          </p>
        </div>
        {user?.role === "HQ_ADMIN" && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Radio className="h-4 w-4" />
            Register New Unit
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search by Serial Number or branch…"
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-secondary/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Serial Number</th>
                <th className="text-left px-4 py-3 font-medium">Device Info</th>
                {user?.role === "HQ_ADMIN" && <th className="text-left px-4 py-3 font-medium">Branch</th>}
                <th className="text-left px-4 py-3 font-medium">Security Personnel</th>
                <th className="text-left px-4 py-3 font-medium">Location & Address</th>
                <th className="text-left px-4 py-3 font-medium">Live Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((d) => (
                <tr key={d.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Camera className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-mono text-sm font-bold uppercase tracking-wider">{d.id}</div>
                        {d.ipAddress && (
                          <div className="text-[10px] text-muted-foreground font-mono bg-secondary/50 px-1.5 py-0.5 rounded border border-border w-fit">
                            IP: {d.ipAddress}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium">{d.name}</div>
                    <div className="text-[10px] text-muted-foreground">Version 2.4.1-Stable</div>
                  </td>
                  {user?.role === "HQ_ADMIN" && (
                    <td className="px-4 py-4">
                      <div className="font-medium">{d.branchName}</div>
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {d.securityContacts && d.securityContacts.length > 0 ? (
                        d.securityContacts.map((c: any) => (
                          <div key={c.id} className="bg-primary/5 text-primary border border-primary/20 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            {c.name}
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-muted-foreground italic">None linked</div>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-1" 
                        onClick={() => handleOpenLinkDialog(d)}
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-4 max-w-[250px]">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium">{d.location.lat.toFixed(4)}, {d.location.lng.toFixed(4)}</div>
                        <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {d.cell ? `${d.cell}, ${d.sector}, ${d.district}, ${d.province}` : d.location.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${d.status === 'online' ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                        <span className="text-xs font-medium capitalize">{d.status}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-secondary/50 p-1 rounded border border-border/50">
                        <Activity className="h-3 w-3" />
                        <span className="truncate">{d.lastData}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {user?.role === "HQ_ADMIN" ? (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeDevice(d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8"
                        onClick={() => handleOpenDetectionDialog(d)}
                      >
                        View Detection Data
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No AI Vandalism Detection units found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Link Security Personnel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Select security personnel to link to device <span className="font-mono font-bold uppercase">{selectedDevice?.id}</span>.
            </p>
            <div className="space-y-3">
              <Label>Linked Personnel</Label>
              <div className="space-y-2">
                {selectedDevice?.securityContacts && selectedDevice.securityContacts.length > 0 ? (
                  selectedDevice.securityContacts.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/30">
                      <div className="text-sm">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleUnlinkContact(c.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic text-center py-4 border border-dashed border-border rounded-md">
                    No personnel linked yet.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <Label>Available Personnel (Branch: {selectedDevice?.branchName})</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {securityContacts
                  .filter(c => String(c.branchId) === String(selectedDevice?.branchId) && !selectedDevice?.securityContacts?.some((sc: any) => sc.id === c.id))
                  .map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-muted/30 transition-colors">
                      <div className="text-sm">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleLinkContact(c.id)}>
                        Link
                      </Button>
                    </div>
                  ))}
                {securityContacts.filter(c => String(c.branchId) === String(selectedDevice?.branchId) && !selectedDevice?.securityContacts?.some((sc: any) => sc.id === c.id)).length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No other personnel available in this branch.
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsLinkDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetectionDialogOpen} onOpenChange={setIsDetectionDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SeverityPill level={selectedDevice?.incidentStatus === 'vandalism' ? 'high' : 'low'} />
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{selectedDevice?.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${selectedDevice?.status === 'online' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {selectedDevice?.status}
                </span>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold mt-2">
              {selectedDevice?.name}
              <p className="text-sm font-normal text-muted-foreground mt-1 italic">
                {selectedDevice?.incidentStatus === 'vandalism' 
                  ? "Recent incident activity detected at this site."
                  : "Unit is secure and monitoring live signals."}
              </p>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: AI Detection & Evidence */}
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4" /> AI Detection Analysis
                </h3>
                <div className="bg-secondary/40 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">AI Classification:</span>
                    <span className="font-semibold capitalize">{selectedDevice?.incidentStatus || 'normal'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="font-bold text-primary">95.0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Motion Status:</span>
                    <span className="font-semibold">{selectedDevice?.status === 'online' ? 'detected' : 'offline'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vibration Status:</span>
                    <span className="font-semibold">normal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Telemetry:</span>
                    <span className="font-mono text-xs">{selectedDevice?.lastData}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4" /> Evidence Media
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-[10px] text-muted-foreground border border-border italic">
                    Camera Stream Not Active
                  </div>
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-[10px] text-muted-foreground border border-border italic">
                    AI Overlay Preview
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Device & Location Info */}
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
                  <Radio className="h-4 w-4" /> Device Details
                </h3>
                <div className="bg-secondary/40 rounded-lg p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device ID:</span>
                    <span className="font-mono font-bold uppercase">{selectedDevice?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device Name:</span>
                    <span>{selectedDevice?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP Address:</span>
                    <span className="font-mono">{selectedDevice?.ipAddress || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Live Status:</span>
                    <span className={selectedDevice?.status === 'online' ? "text-success font-bold" : "text-destructive font-bold"}>
                      {selectedDevice?.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4" /> Geographical Info
                </h3>
                <div className="bg-secondary/40 rounded-lg p-4 space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Full Address:</span>
                    <span className="leading-tight">{selectedDevice?.cell}, {selectedDevice?.sector}, {selectedDevice?.district}, {selectedDevice?.province}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/50">
                    <span className="text-xs font-mono text-muted-foreground">
                      {selectedDevice?.location.lat.toFixed(6)}, {selectedDevice?.location.lng.toFixed(6)}
                    </span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary flex items-center gap-1" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedDevice?.location.lat},${selectedDevice?.location.lng}`, '_blank')}>
                      MAP VIEW <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4" /> Security Personnel
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDevice?.securityContacts && selectedDevice.securityContacts.length > 0 ? (
                    selectedDevice.securityContacts.map((c: any) => (
                      <div key={c.id} className="bg-muted px-2 py-1 rounded border border-border text-[11px] font-medium flex items-center gap-1.5">
                        <Shield className="h-3 w-3 text-primary" /> {c.name}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No linked personnel</span>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Incident History Section */}
          <section className="mt-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4" /> Incident History
            </h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Time</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Severity</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-right px-4 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {incidents && incidents.length > 0 ? (
                    incidents.map((i) => (
                      <tr key={i.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{formatTime(i.time)}</div>
                          <div className="text-[10px] text-muted-foreground">{getRelativeTime(i.time)}</div>
                        </td>
                        <td className="px-4 py-3 font-medium capitalize">{i.type}</td>
                        <td className="px-4 py-3"><SeverityPill level={i.severity} /></td>
                        <td className="px-4 py-3"><StatusPill status={i.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => window.location.href='/dashboard/incidents'}>
                            DETAILS <ExternalLink className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                        No incident history found for this device.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <DialogFooter className="mt-6 pt-6 border-t border-border">
            <Button onClick={() => setIsDetectionDialogOpen(false)}>Close Overview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register AI Vandalism Detection Unit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="e.g. REG-AI-XXXX"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ipAddress">Device IP Address</Label>
                <Input
                  id="ipAddress"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  placeholder="e.g. 192.168.1.100"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="branch">Assigned Branch</Label>
              <Select
                value={formData.branchId}
                onValueChange={(v) => setFormData({ ...formData, branchId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} ({b.region})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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
              <Button type="submit" className="w-full">Initialize & Register Unit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
