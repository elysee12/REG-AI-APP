import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuthStore } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const title = user?.role === "HQ_ADMIN" 
    ? "Headquarter Control Center" 
    : `Branch Control Center — ${user?.branchName || "Unknown Branch"}`;

  return <DashboardShell title={title} />;
}
