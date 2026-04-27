import { useState } from "react";
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
import { useAuthStore } from "@/lib/auth";
import { useDataStore } from "@/lib/data";
import { toast } from "sonner";
import { User, Mail, Building, MapPin, Shield, Edit2, Save, X, KeyRound } from "lucide-react";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const updateUserInDataStore = useDataStore((state) => state.updateUser);

  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState<"request" | "otp" | "new">("request");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  });

  const handleSave = () => {
    if (user) {
      const updates = {
        fullName: formData.fullName,
        email: formData.email,
      };
      updateUserInDataStore(user.id, updates);
      setUser({ ...user, ...updates });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  const requestPasswordChange = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/request-password-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Verification code sent to your email");
        setPasswordStep("otp");
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(data.message || "Failed to send verification code");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPasswordChangeOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/verify-change-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Code verified. Please enter your new password.");
        setPasswordStep("new");
      } else {
        toast.error(data.message || "Invalid verification code");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/change-password-with-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword,
          otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Password changed successfully!");
        setIsPasswordDialogOpen(false);
        setPasswordStep("request");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const closePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setPasswordStep("request");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account settings.</p>
        </div>
        <div className="flex gap-2">
          {user?.role === "BRANCH_USER" && (
            <Button
              onClick={() => setIsPasswordDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" /> Change Password
            </Button>
          )}
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
              <Edit2 className="h-4 w-4" /> Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="ghost" className="gap-2">
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 text-center shadow-sm">
            <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary-dark text-primary-foreground flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
              {user?.fullName?.split(" ").map(n => n[0]).join("").toUpperCase()}
            </div>
            <h2 className="text-xl font-bold">{user?.fullName}</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-bold uppercase tracking-wider">
              <Shield className="h-3 w-3" /> {user?.role === "HQ_ADMIN" ? "HQ Administrator" : "Branch Operator"}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Account Status</h3>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="font-medium capitalize">{user?.status}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-secondary/20">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Personal Information
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-secondary/30" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className={`pl-10 ${!isEditing ? "bg-secondary/30" : ""}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-secondary/20">
              <h3 className="font-semibold flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" /> Professional Assignment
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Branch</span>
                <p className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" /> {user?.branchName}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Region</span>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> {user?.region}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isPasswordDialogOpen} onOpenChange={closePasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {passwordStep === "request" && "Change Password"}
              {passwordStep === "otp" && "Enter Verification Code"}
              {passwordStep === "new" && "Create New Password"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {passwordStep === "request" && (
              <div className="space-y-6 text-center py-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Verify Your Identity</h3>
                  <p className="text-sm text-muted-foreground">
                    To change your password, we'll send a 6-digit verification code to your registered email:
                  </p>
                  <p className="font-medium text-foreground">{user?.email}</p>
                </div>
                <Button
                  onClick={requestPasswordChange}
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Verification Code"}
                </Button>
              </div>
            )}

            {passwordStep === "otp" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit verification code sent to <strong>{user?.email}</strong>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="change-otp">Verification Code</Label>
                  <Input
                    id="change-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-lg tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setPasswordStep("current")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={verifyPasswordChangeOtp}
                    className="flex-1"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={requestPasswordChange}
                    disabled={cooldown > 0}
                    className="text-primary hover:underline disabled:text-muted-foreground"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                  </button>
                </p>
              </div>
            )}

            {passwordStep === "new" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Verification successful! Create your new password below.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="new-password-profile">New Password</Label>
                  <Input
                    id="new-password-profile"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password-profile">Confirm Password</Label>
                  <Input
                    id="confirm-password-profile"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setPasswordStep("otp")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={changePassword}
                    className="flex-1"
                    disabled={isLoading || !newPassword || !confirmPassword}
                  >
                    {isLoading ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
