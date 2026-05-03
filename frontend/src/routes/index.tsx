import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegLogo } from "@/components/RegLogo";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useDataStore } from "@/lib/data";
import { toast } from "sonner";
import heroImg from "@/assets/hero-grid.jpg";

export const Route = createFileRoute("/")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — GRIDGuard AI" },
      {
        name: "description",
        content: "Secure login for GRIDGuard AI Infrastructure Protection System.",
      },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const searchParams: any = useSearch({ from: "/" });
  const login = useAuthStore((state) => state.login);
  const resetAlarmStopTimestamp = useDataStore((state) => state.resetAlarmStopTimestamp);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (searchParams.error === "session_expired") {
      toast.error("Your session has expired. Please sign in again.", {
        id: "session-expired",
        duration: 5000,
      });
    }
  }, [searchParams.error]);

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
    <div className="h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left Side — Branding & Tech Pattern */}
      <div className="relative w-full lg:w-[60%] h-full flex items-center justify-center p-8 overflow-hidden">
        {/* Full Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Infrastructure background"
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/90 via-[#1a1a1a]/80 to-transparent" />
        </div>

        {/* Modern High-Tech Pattern Background Overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="tech-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-primary/40"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tech-grid)" />
          </svg>
        </div>

        {/* Center Content: Logo in Glass-morphism Container */}
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-xl text-center">
          <div className="relative">
            {/* Glass-morphism container */}
            <div className="absolute -inset-6 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-2xl" />
            <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-inner flex items-center justify-center">
              <RegLogo className="h-20" showText variant="dark" subtitle="Infrastructure Protection" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter text-white">
                GRIDGuard <span className="text-primary">AI</span>
              </h2>
              <div className="inline-block px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary leading-none">
                  Infrastructure Protection
                </p>
              </div>
            </div>
            <p className="text-white/80 text-xl font-medium leading-relaxed max-w-md mx-auto pt-4 balance">
              AI-based Solutions to Fight Vandalism in Power Infrastructure.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div className="w-full lg:w-[40%] h-full flex items-center justify-center p-8 sm:p-12 md:p-16 lg:p-20 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tight text-[#1a1a1a]">
              Login
            </h1>
            <p className="text-muted-foreground text-xl">
              Please enter your credentials!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-black uppercase tracking-widest text-[#1a1a1a] opacity-70"
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="h-12 bg-[#f8f9fa] border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base px-5 rounded-xl transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-black uppercase tracking-widest text-[#1a1a1a] opacity-70"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="h-12 bg-[#f8f9fa] border-none focus-visible:ring-2 focus-visible:ring-primary/50 text-base px-5 pr-12 rounded-xl transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2"
                >
                  {showPwd ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white text-lg font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] uppercase tracking-wider"
            >
              Login
            </Button>
          </form>

          <div className="pt-8 border-t border-gray-100">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Powered by <span className="font-black text-[#1a1a1a]">GRIDGuard AI</span>. All rights reserved.
              </p>
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-primary uppercase tracking-widest font-black">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure Control Center Access
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Remove SystemIndicator function as it's no longer used
