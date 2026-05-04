import { Bell, Search, ShieldCheck, User, Mail, Building, MapPin, Edit2, Save, X, CheckCircle2, Clock as ClockIcon, KeyRound, Menu } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate, Link, useLocation } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { RegLogo } from "@/components/RegLogo";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/config";
import {
  LayoutDashboard,
  Siren,
  Map,
  Camera,
  ListChecks,
  Send,
  FileBarChart,
  Users,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";

const menuItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/incidents", label: "Live Incidents", icon: Siren },
  { to: "/dashboard/map", label: "Monitoring Map", icon: Map },
  { to: "/dashboard/devices", label: "Devices", icon: Camera },
  { to: "/dashboard/security-contacts", label: "Security Contacts", icon: ShieldCheck },
  { to: "/dashboard/queue", label: "Incident Queue", icon: ListChecks },
  { to: "/dashboard/response", label: "Response Actions", icon: Send },
  { to: "/dashboard/reports", label: "Reports", icon: FileBarChart },
  { to: "/dashboard/branches", label: "Branches", icon: Building2, role: "HQ_ADMIN" },
  { to: "/dashboard/users", label: "Users / Roles", icon: Users, role: "HQ_ADMIN" },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

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
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const updateUserInDataStore = useDataStore((state) => state.updateUser);
  const { isAlarmActive, setAlarmActive, lastAlarmStopTimestamp } = useDataStore();
  const isMobile = useIsMobile();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Password change states
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [passwordStep, setPasswordStep] = useState<"request" | "otp" | "new">("request");
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const alarmAudio = useRef<HTMLAudioElement | null>(null);
  
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  });

  const filteredItems = menuItems.filter((item) => {
    if ("role" in item && item.role === "HQ_ADMIN") {
      return user?.role === "HQ_ADMIN";
    }
    return true;
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "??";

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

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

  const requestPasswordChange = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/request-password-change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ currentPassword }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Verification code sent to your email");
        setPasswordStep("otp");
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(data.message || "Failed to send verification code");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPasswordChangeOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/verify-change-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Code verified. Please enter your new password.");
        setPasswordStep("new");
      } else {
        toast.error(data.message || "Invalid verification code");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/change-password-with-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ currentPassword, otp, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Password changed successfully!");
        setIsPasswordMode(false);
        setPasswordStep("request");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
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
    if (!user) return false;
    // HQ Admin has full visibility of all incidents
    if (user.role === 'HQ_ADMIN') return true;
    
    if (assignedDeviceIds.length > 0) {
      return assignedDeviceIds.includes(incident.deviceId);
    }
    if (user.role === 'BRANCH_USER') {
      return String(incident.branchId) === String(user.branchId);
    }
    return false;
  };

  // Handle Alarm sound for AI Detections (Control Room Alarm for HQ)
  useEffect(() => {
    if (!user || !incidents) return;

    const HIGH_PRIORITY_TYPES = ['Climbing', 'Vendor', 'Wire cutting', 'Box opening'];

    const hasActiveThreat = incidents.some(i => {
      const isAlert = i.alertStatus === true;
      const isActiveIncident = i.status === 'active' || i.status === 'pending';
      const isNewerThanStop = new Date(i.time).getTime() > lastAlarmStopTimestamp;
      
      // HQ Control Room Alarm: Alarms for high-priority types or any critical alert across ALL devices
      if (user.role === 'HQ_ADMIN') {
        const isHighPriority = HIGH_PRIORITY_TYPES.some(type => 
          i.aiClass?.toLowerCase().includes(type.toLowerCase())
        );
        return (isAlert || isHighPriority) && isActiveIncident && isNewerThanStop;
      }

      // Branch User Alarm: Only for assigned devices or their branch
      const isAssignedOrBranch = isIncidentAssignedOrBranch(i);
      return isAlert && isAssignedOrBranch && isActiveIncident && isNewerThanStop;
    });
    
    if (hasActiveThreat && !isAlarmActive) {
      const latestThreat = incidents.find(i => {
        const isActive = i.status === 'active' || i.status === 'pending';
        const isNewer = new Date(i.time).getTime() > lastAlarmStopTimestamp;
        if (user.role === 'HQ_ADMIN') {
          const isHighPriority = HIGH_PRIORITY_TYPES.some(type => 
            i.aiClass?.toLowerCase().includes(type.toLowerCase())
          );
          return (i.alertStatus === true || isHighPriority) && isActive && isNewer;
        }
        return i.alertStatus === true && isIncidentAssignedOrBranch(i) && isActive && isNewer;
      });
      
      setAlarmActive(true);
      toast.error(`${latestThreat?.aiClass || 'CRITICAL'} INCIDENT DETECTED!`, {
        duration: 10000,
        description: `Control Room Alert: ${latestThreat?.location || 'Unknown location'}`
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
        // HQ Admin: Show all significant incidents from all devices
        if (user?.role === "HQ_ADMIN") {
          return incident.alertStatus === true || incident.aiConfidence >= 0.8;
        }
        
        return incident.alertStatus === true && isIncidentAssignedOrBranch(incident);
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5) // Show top 5 latest
      .map((incident) => ({
        id: incident.id,
        title: incident.aiClass || 'AI Detection',
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
      {/* Mobile Menu Trigger */}
      {isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-0">
            <SheetHeader className="p-6 border-b border-sidebar-border bg-gradient-to-br from-primary/10 via-transparent to-transparent text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.6)]" />
              <SheetTitle className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <RegLogo className="h-8" variant="dark" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tighter text-white leading-none">GRIDGuard <span className="text-primary italic">AI</span></span>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-white/70 leading-relaxed balance">
                  AI-based Solutions to Fight Vandalism in Power Infrastructure
                </p>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {filteredItems.map((it) => {
                const active = pathname === it.to || (it.to !== "/dashboard" && pathname.startsWith(it.to));
                const Icon = it.icon;
                
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="min-w-0">
        <div className="text-[10px] md:text-xs text-muted-foreground truncate uppercase tracking-widest font-bold">GRIDGuard AI ▸ Control Center</div>
        <h1 className="text-sm md:text-base font-bold text-foreground truncate">{title}</h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search incident ID, tower, site, district…"
          className="pl-9 bg-secondary border-transparent focus-visible:bg-card"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <Clock />

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Live
        </div>

        <NoSsr>
          {user?.role !== 'HQ_ADMIN' && (
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary blink shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            </button>
          )}
        </NoSsr>

        <div 
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-2 pl-2 md:pl-3 border-l border-border cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-primary-foreground flex items-center justify-center text-xs md:text-sm font-bold shadow-md border border-white/10">
            {initials}
          </div>
          <div className="hidden lg:block leading-tight text-left">
            <div className="text-sm font-bold">{user?.fullName || "Guest User"}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3 text-primary" /> {user?.role === "HQ_ADMIN" ? "Administrator" : "Operator"}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <Dialog open={isProfileOpen} onOpenChange={(open) => {
        setIsProfileOpen(open);
        if (!open) {
          setIsEditing(false);
          setIsPasswordMode(false);
          setPasswordStep("request");
          setCurrentPassword("");
        }
      }}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl [&>button]:hidden">
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
            {/* Primary Close Button (Top Right) */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 z-50 h-10 w-10 text-white hover:bg-white/20 rounded-full transition-all border border-white/20" 
              onClick={() => setIsProfileOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="p-6 space-y-6 bg-card max-h-[60vh] overflow-y-auto">
            {!isPasswordMode ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" /> Personal Details
                    </h3>
                    {user?.role === "HQ_ADMIN" && (
                      !isEditing ? (
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
                      )
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

                {user?.role === "BRANCH_USER" && (
                  <div className="pt-4 border-t border-border flex flex-col gap-3">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                      onClick={() => setIsPasswordMode(true)}
                    >
                      <KeyRound className="h-4 w-4" /> Change Account Password
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full lg:hidden" 
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Close Profile Window
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPasswordMode(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <h3 className="font-bold">Security Settings</h3>
                </div>

                {passwordStep === "request" && (
                  <div className="space-y-6 text-center py-2">
                    <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Verify Your Identity</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        To change your password, please enter your <strong>Current Password</strong>. We'll then send a verification code to your email.
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-left">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        required
                      />
                    </div>

                    <Button
                      onClick={requestPasswordChange}
                      className="w-full h-11"
                      disabled={isLoading || !currentPassword}
                    >
                      {isLoading ? "Verifying..." : "Verify & Send Code"}
                    </Button>
                  </div>
                )}

                {passwordStep === "otp" && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit verification code sent to <strong>{user?.email}</strong>
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="header-change-otp">Verification Code</Label>
                      <Input
                        id="header-change-otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="text-center text-lg tracking-widest font-mono"
                        maxLength={6}
                      />
                    </div>
                    <Button
                      onClick={verifyPasswordChangeOtp}
                      className="w-full"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Didn't receive the code?{" "}
                      <button
                        type="button"
                        onClick={requestPasswordChange}
                        disabled={cooldown > 0}
                        className="text-primary hover:underline disabled:text-muted-foreground"
                      >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                      </button>
                    </p>
                  </div>
                )}

                {passwordStep === "new" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="header-new-password">New Password</Label>
                      <Input
                        id="header-new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-confirm-password">Confirm Password</Label>
                      <Input
                        id="header-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                      />
                    </div>
                    <Button
                      onClick={changePassword}
                      className="w-full"
                      disabled={isLoading || !newPassword || !confirmPassword}
                    >
                      {isLoading ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border bg-secondary/10 flex justify-center sm:justify-end gap-3">
             <Button 
               variant="outline" 
               className="w-full sm:w-auto font-bold border-primary/20 text-primary hover:bg-primary/5" 
               onClick={() => setIsProfileOpen(false)}
             >
               CLOSE PROFILE
             </Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Modal */}
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl [&>button]:hidden">
          <div className="p-4 border-b border-border bg-card flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> Notifications
              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{dynamicNotifications.length}</span>
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-[10px] h-7 uppercase font-bold text-muted-foreground hover:text-primary">
                Mark all as read
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setIsNotificationsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
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
