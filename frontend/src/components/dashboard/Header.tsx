import { Bell, Search, ShieldCheck, User, Mail, Building, MapPin, Edit2, Save, X, CheckCircle2, Clock as ClockIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NoSsr } from "../ui/no-ssr";
import { memo, useEffect, useState, useMemo, useRef } from "react";
import { useAuthStore } from "@/lib/auth";
import { useDataStore } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

interface HeaderProps {
  title: string;
}

const Clock = memo(function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return (
      <div className="hidden lg:flex flex-col items-end leading-tight opacity-0">
        <span className="text-sm font-medium tabular-nums">00:00:00 AM</span>
        <span className="text-xs text-muted-foreground">--- --- --</span>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col items-end leading-tight">
      <span className="text-sm font-medium tabular-nums">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
      <span className="text-xs text-muted-foreground">
        {now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
      </span>
    </div>
  );
});

export function Header({ title }: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const updateUserInDataStore = useDataStore((state) => state.updateUser);
  const { isAlarmActive, setAlarmActive, lastAlarmStopTimestamp } = useDataStore();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);
  // Remove prevIncidentCount as we'll use timestamp-based logic
  
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  });

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "??";

  const handleSaveProfile = () => {
    if (user) {
      const updates = {
        fullName: profileData.fullName,
        email: profileData.email,
      };
      updateUserInDataStore(user.id, updates);
      setUser({ ...user, ...updates });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    }
  };

  const { incidents, fetchIncidents, fetchAssignedIncidents, securityContacts, fetchSecurityContacts } = useDataStore();

  useEffect(() => {
    // Initialize alarm audio
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
    audio.loop = true;
    alarmAudio.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      alarmAudio.current = null;
    };
  }, []);

  // Sync audio play/pause with global state
  useEffect(() => {
    const audio = alarmAudio.current;
    if (!audio) return;

    if (isAlarmActive) {
      console.log("Playing alarm audio");
      audio.play().catch(e => {
        console.error("Error playing alarm:", e);
        if (e.name === 'NotAllowedError') {
          toast.warning("Audio playback blocked. Please click anywhere on the page to enable the alarm sound.", {
            id: "audio-blocked",
            duration: 5000
          });
        }
      });
    } else {
      console.log("Pausing alarm audio");
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isAlarmActive]);

  useEffect(() => {
    const branchId = user?.role === 'BRANCH_USER' && user.branchId ? String(user.branchId) : undefined;
    fetchIncidents(branchId);
    fetchSecurityContacts();
    // Refresh incidents every 10 seconds for live notifications
    const interval = setInterval(() => {
      fetchIncidents(branchId);
      fetchSecurityContacts();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchIncidents, fetchSecurityContacts, user?.role, user?.branchId]);

  // Resolve assigned devices based on email mapping
  const assignedDeviceIds = useMemo(() => {
    if (!user || user.role === 'HQ_ADMIN') return [];
    
    // Find the security contact that matches the logged-in user's email
    const contact = securityContacts.find(c => c.email.toLowerCase() === user.email.toLowerCase());
    if (!contact || !contact.devices) return [];
    
    return contact.devices.map((d: any) => d.id);
  }, [user, securityContacts]);

  const isIncidentAssignedOrBranch = (incident: any) => {
    if (!user || user.role === 'HQ_ADMIN') return false;
    if (assignedDeviceIds.length > 0) {
      return assignedDeviceIds.includes(incident.deviceId);
    }
    if (user.role === 'BRANCH_USER') {
      return String(incident.branchId) === String(user.branchId);
    }
    return false;
  };

  // Handle Alarm sound for HIGHLY SUSPICIOUS (Branch Users Only - Assigned Devices or Branch)
  useEffect(() => {
    if (!user || user.role === 'HQ_ADMIN' || !incidents) return;

    const hasActiveThreat = incidents.some(i => {
      const isHighlySuspicious = i.alertStatus === true || i.aiClass?.toString().trim().toUpperCase() === 'THIEF';
      const isAssignedOrBranch = isIncidentAssignedOrBranch(i);
      const isActiveIncident = i.status === 'active' || i.status === 'pending';
      const isNewerThanStop = new Date(i.time).getTime() > lastAlarmStopTimestamp;
      return isHighlySuspicious && isAssignedOrBranch && isActiveIncident && isNewerThanStop;
    });
    
    if (hasActiveThreat && !isAlarmActive) {
      setAlarmActive(true);
      toast.error("HIGHLY SUSPICIOUS INCIDENT DETECTED!", {
        duration: 10000,
        description: "Priority response required immediately."
      });
    } else if (!hasActiveThreat && isAlarmActive) {
      // Auto-deactivate if no more active threats exist
      setAlarmActive(false);
    }
  }, [incidents, isAlarmActive, setAlarmActive, user, assignedDeviceIds, lastAlarmStopTimestamp]);

  const dynamicNotifications = useMemo(() => {
    if (!incidents || incidents.length === 0) return [];

    return incidents
      .filter((incident) => {
        // HQ Admin: Only show if AI Confidence > 90% (but hidden in UI rendering anyway)
        if (user?.role === "HQ_ADMIN") {
          return incident.aiConfidence >= 0.9;
        }
        
        const isHighlySuspicious = incident.alertStatus === true || incident.aiClass?.toString().trim().toUpperCase() === 'THIEF';
        return isHighlySuspicious && isIncidentAssignedOrBranch(incident);
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5) // Show top 5 latest
      .map((incident) => ({
        id: incident.id,
        title: incident.alertStatus ? 'HIGHLY SUSPICIOUS' : (incident.aiClass?.toString().trim().toUpperCase() === 'THIEF' ? 'HIGHLY SUSPICIOUS' : (incident.aiClass || 'AI Detection')),
        message: `${incident.severity.toUpperCase()} severity incident at ${incident.location}`,
        time: new Date(incident.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: incident.severity === 'critical' ? 'warning' : 'info',
        incidentId: incident.id
      }));
  }, [incidents, user, assignedDeviceIds]);

  const handleNotificationClick = (incidentId: string) => {
    setIsNotificationsOpen(false);
    navigate({ 
      to: "/dashboard/incidents", 
      search: { incidentId } as any
    });
  };

  return (
    <header className="h-16 shrink-0 border-b border-border bg-card flex items-center gap-4 px-4 md:px-6">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">REG ▸ Control Center</div>
        <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search incident ID, tower, site, district…"
          className="pl-9 bg-secondary border-transparent focus-visible:bg-card"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Clock />

        <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-success/10 text-success text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-success" />
          Detection Active
        </div>

        <NoSsr>
          {user?.role !== 'HQ_ADMIN' && (
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-md hover:bg-secondary transition-colors"
            >
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary blink" />
            </button>
          )}
        </NoSsr>

        <div 
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-2 pl-3 border-l border-border cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-primary-foreground flex items-center justify-center text-sm font-semibold shadow-sm">
            {initials}
          </div>
          <div className="hidden lg:block leading-tight text-left">
            <div className="text-sm font-medium">{user?.fullName || "Guest User"}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> {user?.role === "HQ_ADMIN" ? "Administrator" : "Operator"}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <Dialog open={isProfileOpen} onOpenChange={(open) => {
        setIsProfileOpen(open);
        if (!open) setIsEditing(false);
      }}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-primary-foreground relative">
            <div className="relative z-10 flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-bold border-4 border-white/30 shadow-xl mb-4">
                {initials}
              </div>
              <h2 className="text-2xl font-bold">{user?.fullName}</h2>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider border border-white/10">
                <ShieldCheck className="h-3.5 w-3.5" /> {user?.role === "HQ_ADMIN" ? "HQ Administrator" : "Branch Operator"}
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10" 
                onClick={() => setIsProfileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="p-6 space-y-6 bg-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Personal Details
                </h3>
                {!isEditing ? (
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-3 w-3" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSaveProfile}>
                      <Save className="h-3 w-3" /> Save
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/70">Full Name</Label>
                  <Input 
                    value={profileData.fullName} 
                    onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-secondary/30 border-transparent" : "border-primary/30"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground/70">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={profileData.email} 
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      disabled={!isEditing}
                      className={`pl-10 ${!isEditing ? "bg-secondary/30 border-transparent" : "border-primary/30"}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" /> Assignment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Branch</span>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-primary" /> {user?.branchName}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Region</span>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {user?.region}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Modal */}
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-4 border-b border-border bg-card flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> Notifications
              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{dynamicNotifications.length}</span>
            </h2>
            <Button variant="ghost" size="sm" className="text-[10px] h-7 uppercase font-bold text-muted-foreground hover:text-primary">
              Mark all as read
            </Button>
          </div>
          <div className="max-h-[400px] overflow-y-auto bg-card">
            {dynamicNotifications.length > 0 ? (
              dynamicNotifications.map((n) => (
                <div 
                  key={n.id} 
                  className="p-4 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer group"
                  onClick={() => handleNotificationClick(n.incidentId)}
                >
                  <div className="flex gap-3">
                    <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center ${
                      n.type === 'success' ? 'bg-success/10 text-success' : 
                      n.type === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                    }`}>
                      {n.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : 
                       n.type === 'warning' ? <ShieldCheck className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold truncate group-hover:text-primary transition-colors">{n.title}</h4>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                          <ClockIcon className="h-2.5 w-2.5" /> {n.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground italic text-xs">
                No new strategic notifications.
              </div>
            )}
          </div>
          <div className="p-3 bg-secondary/20 text-center border-t border-border">
            <Button variant="ghost" size="sm" className="w-full text-xs font-semibold h-8" onClick={() => setIsNotificationsOpen(false)}>
              Close Panel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
