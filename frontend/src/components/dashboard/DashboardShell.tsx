import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PasswordChangeAlert } from "./PasswordChangeAlert";
import { useAuthStore } from "@/lib/auth";
import { Lock } from "lucide-react";

interface DashboardShellProps {
  title: string;
  children?: React.ReactNode;
}

export function DashboardShell({ title, children }: DashboardShellProps) {
  const user = useAuthStore((state) => state.user);
  const mustChange = user?.mustChangePassword;

  return (
    <div className="flex h-screen bg-secondary overflow-hidden">
      <PasswordChangeAlert />
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header title={title} />
        
        <main className="flex-1 overflow-y-auto relative">
          {children ?? <Outlet />}
          
          {mustChange && (
            <div className="absolute inset-0 z-40 bg-background/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
              <div className="max-w-md animate-in zoom-in-95 duration-300">
                <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard Restricted</h2>
                <p className="text-muted-foreground mt-2">
                  Access to monitoring tools and data is restricted until you update your account password. 
                  Please use the security prompt to continue.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
