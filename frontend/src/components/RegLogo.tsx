import regLogo from "@/assets/reg-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "light" | "dark";
  subtitle?: string;
}

export function RegLogo({ 
  className = "h-10", 
  showText = false, 
  variant = "light",
  subtitle = "Infrastructure Protection"
}: LogoProps) {
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
            Rwanda Energy Group
          </div>
          <div
            className={`text-sm font-bold max-w-[180px] ${
              variant === "dark" ? "text-sidebar-foreground" : "text-foreground"
            }`}
          >
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}
