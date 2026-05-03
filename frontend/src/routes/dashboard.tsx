import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuthStore } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ location }) => {
    // Check if we are in a browser environment
    if (typeof window === 'undefined') return;

    const authStr = localStorage.getItem('auth-storage');
    const auth = authStr ? JSON.parse(authStr) : {};
    const token = auth.state?.token;
    
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const title = user?.role === "HQ_ADMIN" 
    ? "Headquarter Control Center" 
    : `Branch Control Center — ${user?.branchName || "Unknown Branch"}`;

  return <DashboardShell title={title} />;
}
