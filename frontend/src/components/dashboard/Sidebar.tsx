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
    if ("role" in item && item.role === "HQ_ADMIN") {
      return user?.role === "HQ_ADMIN";
    }
    return true;
  });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <RegLogo className="h-9" showText variant="dark" />
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
