import regLogo from "@/assets/reg-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "light" | "dark";
}

export function RegLogo({ className = "h-10", showText = false, variant = "light" }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <img src={regLogo} alt="Rwanda Energy Group" className={className} />
      {showText && (
        <div className="hidden sm:block leading-tight">
          <div
            className={`text-xs font-semibold uppercase tracking-wider ${
              variant === "dark" ? "text-sidebar-foreground/60" : "text-muted-foreground"
            }`}
          >
            REG
          </div>
          <div
            className={`text-sm font-bold ${
              variant === "dark" ? "text-sidebar-foreground" : "text-foreground"
            }`}
          >
            Infrastructure Protection
          </div>
        </div>
      )}
    </div>
  );
}
