import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { RegLogo } from "@/components/RegLogo";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Mail } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useDataStore } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Operator Login — REG Infrastructure Protection" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const resetAlarmStopTimestamp = useDataStore((state) => state.resetAlarmStopTimestamp);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    
    const success = await login(email, password);
    
    if (success) {
      resetAlarmStopTimestamp();
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } else {
      toast.error("Invalid email or password, or account disabled.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left — brand panel */}
      <div className="relative hidden lg:flex flex-col bg-sidebar text-sidebar-foreground p-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-0 right-0 h-64 w-64 bg-primary/30 rounded-full blur-3xl -translate-y-20 translate-x-20" />
        <div className="relative z-10 flex flex-col h-full">
          <RegLogo className="h-10" showText variant="dark" />

          <div className="my-auto max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-semibold">
              CONTROL CENTER ACCESS
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight">
              Sign in to monitor alarms,
              <br />
              verify incidents, and
              <br />
              <span className="text-primary">coordinate response.</span>
            </h1>
            <p className="mt-6 text-sidebar-foreground/70">
              Authorised operators only. All sessions are recorded for audit and incident
              traceability.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            <SystemStatus label="Server" />
            <SystemStatus label="Detection Engine" />
            <SystemStatus label="Notifications" />
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="lg:hidden">
            <RegLogo className="h-8" />
          </div>
        </div>

        <div className="m-auto w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Operator Sign In</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your credentials to access the control panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@reg.gov.rw"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Tip: First-time users, use [BranchName]@2026
              </p>
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>

            <div className="pt-4 border-t border-border">
              <div className="bg-secondary/50 rounded-lg p-3 flex items-start gap-3 border border-border">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold">Security Note</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    This is a secure system. Your session is monitored for compliance.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SystemStatus({ label }: { label: string }) {
  return (
    <div className="p-3 rounded-lg bg-sidebar-foreground/5 border border-sidebar-foreground/10">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider font-bold opacity-50">
          {label}
        </span>
      </div>
      <div className="text-xs font-medium">Online</div>
    </div>
  );
}


