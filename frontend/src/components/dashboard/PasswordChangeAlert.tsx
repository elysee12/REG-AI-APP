import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { KeyRound, X, Eye, EyeOff, ShieldAlert, Mail, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDataStore } from "@/lib/data";

export function PasswordChangeAlert() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { requestPasswordChange, changePasswordWithOtp } = useDataStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState<'current' | 'otp' | 'password'>('current');
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrentPwd, setShowCurrentPassword] = useState(false);
  const [showNewPwd, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiry, setExpiry] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let timer: any;
    if (expiry > 0) {
      timer = setInterval(() => setExpiry((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [expiry]);

  useEffect(() => {
    if (user?.mustChangePassword) {
      setIsDialogOpen(true);
    }
  }, [user?.mustChangePassword]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    setIsLoading(true);
    const data = await requestPasswordChange(currentPassword);
    
    if (data.success) {
      toast.success("Verification code sent to your email");
      setStep('otp');
      setCooldown(60);
      setExpiry(600);
    } else {
      toast.error(data.message || "Invalid current password");
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    setStep('password');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    const data = await changePasswordWithOtp({
      currentPassword,
      otp,
      newPassword
    });

    if (data.success) {
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }
      setIsDialogOpen(false);
      toast.success("Password updated successfully! Dashboard access restored.");
      // Reset state
      setStep('current');
      setCurrentPassword("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(data.message || "Failed to update password");
    }
    setIsLoading(false);
  };

  if (!user?.mustChangePassword) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px] outline-none" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" /> 
            Security Action Required
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your account is currently restricted. You must update your password to access the dashboard.
          </p>
        </DialogHeader>
        
        <div className="py-4">
          {step === 'current' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPwd ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Verification Code"}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-2 mb-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Verification code sent to <strong>{user?.email}</strong>
                </p>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className={expiry > 0 ? "text-muted-foreground" : "text-destructive font-semibold"}>
                  {expiry > 0 ? `Code expires in ${formatTime(expiry)}` : "Code expired"}
                </span>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={cooldown > 0 || isLoading}
                  className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline font-medium"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                </button>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('current')}>Back</Button>
                <Button type="submit" className="flex-1">Verify Code</Button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type={showNewPwd ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('otp')}>Back</Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-secondary/50 rounded-lg p-3 flex items-start gap-3 border border-border mt-2">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold">Security Requirement</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              To ensure the security of your account and the branch data, a personalized password is required before you can access any monitoring features.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
