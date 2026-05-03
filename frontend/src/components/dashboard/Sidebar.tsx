import { Link, useLocation } from "@tanstack/react-router";
import { RegLogo } from "@/components/RegLogo";
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
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth";

const items = [
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

export function Sidebar() {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const filteredItems = items.filter((item) => {
    // Shared items that HQ admins should NOT see (operational details)
    const operationalItems = ["/dashboard/incidents", "/dashboard/queue", "/dashboard/response"];
    if (user?.role === "HQ_ADMIN" && operationalItems.includes(item.to)) {
      return false;
    }

    if ("role" in item && item.role === "HQ_ADMIN") {
      return user?.role === "HQ_ADMIN";
    }
    return true;
  });

  return (
    <aside className="hidden md:flex w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-2xl z-50">
      <div className="px-6 py-12 border-b border-sidebar-border bg-gradient-to-br from-primary/10 via-transparent to-transparent relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.6)]" />
        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary/40 transition-all duration-300 shadow-lg">
              <RegLogo className="h-12" variant="dark" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white leading-none">GRIDGuard <span className="text-primary italic">AI</span></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/90 mt-1.5">Infrastructure Protection</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-[2px] w-14 bg-primary/50 rounded-full" />
            <p className="text-[14px] font-bold leading-relaxed text-white/95 balance tracking-tight">
              AI-based Solutions to Fight Vandalism in Power Infrastructure
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((it) => {
          const active = pathname === it.to || (it.to !== "/dashboard" && pathname.startsWith(it.to));
          const Icon = it.icon;
          const disabled = user?.mustChangePassword && it.to !== "/dashboard/settings"; // Allow settings for profile/password change
          
          return (
            <Link
              key={it.to}
              to={it.to}
              preload="intent"
              disabled={disabled}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
