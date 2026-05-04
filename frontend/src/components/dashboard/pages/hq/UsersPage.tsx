import { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useDataStore } from "@/lib/data";
import { useAuthStore } from "@/lib/auth";
import { API_BASE } from "@/lib/config";
import { User, Role, Mail, Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react";
import { Pagination } from "../../shared/DashboardComponents";

// Remove the local API_BASE constant as it's now imported from config

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export function UsersPage() {
  const { users, branches, addUser, updateUser, disableUser, enableUser, fetchUsers, fetchBranches, secureUpdateUser } = useDataStore();
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);

  // Edit User Password states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [adminCurrentPassword, setAdminCurrentPassword] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [confirmUserPassword, setConfirmUserPassword] = useState("");
  const [showAdminPwd, setShowAdminPwd] = useState(false);
  const [showNewUserPwd, setShowNewUserPwd] = useState(false);
  const [editOtp, setEditOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editCooldown, setEditCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);

  const { requestPasswordReset, resetPassword: performReset } = useDataStore();

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [fetchUsers, fetchBranches]);

  useEffect(() => {
    if (!isDialogOpen) {
      setIsChangingPassword(false);
      setAdminCurrentPassword("");
      setNewUserPassword("");
      setConfirmUserPassword("");
      setEditOtp("");
      setOtpSent(false);
      setOtpExpiry(0);
      setEditCooldown(0);
    }
  }, [isDialogOpen]);

  useEffect(() => {
    let timer: any;
    if (editCooldown > 0) {
      timer = setInterval(() => setEditCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [editCooldown]);

  useEffect(() => {
    let timer: any;
    if (otpExpiry > 0) {
      timer = setInterval(() => setOtpExpiry((prev) => prev - 1), 1000);
    } else if (otpExpiry === 0 && otpSent) {
      // Logic for when OTP expires? maybe just show a message
    }
    return () => clearInterval(timer);
  }, [otpExpiry, otpSent]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "BRANCH_USER" as Role,
    branchName: "",
    region: "",
  });

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      fullName: "",
      email: "",
      role: "BRANCH_USER",
      branchName: "",
      region: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      branchName: user.branchName,
      region: user.region,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsEditLoading(true);
    const success = await updateUser(editingUser.id, formData);
    if (success) {
      toast.success("User profile updated successfully");
      setIsDialogOpen(false);
    } else {
      toast.error("Failed to update user profile");
    }
    setIsEditLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!otpSent || !editOtp) {
      toast.error("Security verification required. Please send and enter the OTP.");
      return;
    }
    
    if (!newUserPassword || newUserPassword !== confirmUserPassword) {
      toast.error("New passwords do not match or are empty");
      return;
    }

    setIsEditLoading(true);
    const result = await secureUpdateUser(editingUser.id, {
      adminCurrentPassword,
      otp: editOtp,
      newUserPassword,
    });

    if (result.success) {
      toast.success("User password updated successfully");
      setIsDialogOpen(true); // Keep it open or close? User might want to see success
      setIsDialogOpen(false);
    } else {
      toast.error(result.message);
    }
    setIsEditLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // This is now handled by separate buttons, but we keep it for fallback or if user hits Enter
      handleUpdateProfile(e);
    } else {
      const success = await addUser({ ...formData, status: "enabled", mustChangePassword: true });
      if (success) {
        toast.success(`User created. Default password: ${(formData.branchName || 'Reg').split(' ')[0]}@2026`);
        setIsDialogOpen(false);
      } else {
        toast.error("Failed to create user. Please check if the email already exists.");
      }
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
          <h2 className="font-semibold">Users & Roles</h2>
          <Input
            placeholder="Search users…"
            className="ml-auto max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {user?.role === "HQ_ADMIN" && (
            <Button onClick={handleOpenAdd}>+ Add user</Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground bg-secondary/40">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Role</th>
                <th className="text-left px-4 py-2.5 font-medium">Branch / Region</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-secondary text-xs font-semibold">
                      {u.role === "HQ_ADMIN" ? "HQ Admin" : "Branch User"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.branchName} <span className="text-muted-foreground">({u.region})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          u.status === "enabled" ? "bg-success" : "bg-destructive"
                        }`}
                      />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {user?.role === "HQ_ADMIN" && (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => {
                            setResetUser(u);
                            setIsResetDialogOpen(true);
                          }}
                        >
                          Reset Password
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(u)}>
                          Edit
                        </Button>
                      </>
                    )}
                    {user?.role === "HQ_ADMIN" && (
                      u.status === "enabled" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={async () => {
                            const success = await disableUser(u.id);
                            if (success) {
                              toast.success(`User ${u.fullName} disabled`);
                            } else {
                              toast.error("Failed to disable user");
                            }
                          }}
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-success hover:text-success"
                          onClick={async () => {
                            const success = await enableUser(u.id);
                            if (success) {
                              toast.success(`User ${u.fullName} enabled`);
                            } else {
                              toast.error("Failed to enable user");
                            }
                          }}
                        >
                          Enable
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[85vh]">
            <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v: Role) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HQ_ADMIN">HQ Admin</SelectItem>
                    <SelectItem value="BRANCH_USER">Branch User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="branch">Branch</Label>
                <Select
                  value={formData.branchName}
                  onValueChange={(v) => {
                    const branch = branches.find((b) => b.name === v);
                    setFormData({
                      ...formData,
                      branchName: v,
                      region: branch?.region || formData.region,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  readOnly
                  className="bg-secondary/50"
                />
              </div>

              {editingUser && (
                <div className="pt-2">
                  <Button 
                    type="button" 
                    onClick={handleUpdateProfile} 
                    disabled={isEditLoading}
                    className="w-full"
                  >
                    {isEditLoading ? "Updating Profile..." : "Update Profile"}
                  </Button>
                </div>
              )}

              {editingUser && (
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Security Verification
                    </Label>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="adminCurrentPassword">Admin Current Password</Label>
                      <div className="relative">
                        <Input
                          id="adminCurrentPassword"
                          type={showAdminPwd ? "text" : "password"}
                          value={adminCurrentPassword}
                          onChange={(e) => setAdminCurrentPassword(e.target.value)}
                          placeholder="Your current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPwd(!showAdminPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showAdminPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-primary" />
                        Change User Password
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                      >
                        {isChangingPassword ? "Cancel" : "Enable Change"}
                      </Button>
                    </div>

                    {isChangingPassword && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                          <Label htmlFor="newUserPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newUserPassword"
                              type={showNewUserPwd ? "text" : "password"}
                              value={newUserPassword}
                              onChange={(e) => setNewUserPassword(e.target.value)}
                              placeholder="Min. 8 characters"
                              required={isChangingPassword}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewUserPwd(!showNewUserPwd)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewUserPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="confirmUserPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmUserPassword"
                              type={showNewUserPwd ? "text" : "password"}
                              value={confirmUserPassword}
                              onChange={(e) => setConfirmUserPassword(e.target.value)}
                              placeholder="Re-enter password"
                              required={isChangingPassword}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewUserPwd(!showNewUserPwd)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showNewUserPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!otpSent ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          if (!adminCurrentPassword) {
                            toast.error("Please enter your current password first");
                            return;
                          }
                          // Verify Admin Password first
                          setIsEditLoading(true);
                          try {
                            // We use request-password-change to verify current password and send OTP to Admin
                            const res = await fetch(`${API_BASE}/auth/request-password-change`, {
                              method: "POST",
                              headers: { 
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${useAuthStore.getState().token}`
                              },
                              body: JSON.stringify({ currentPassword: adminCurrentPassword }),
                            });
                            const data = await res.json();
                          if (data.success) {
                            toast.success("Verification code sent to your email (Admin)");
                            setOtpSent(true);
                            setEditCooldown(60);
                            setOtpExpiry(600); // 10 minutes
                          } else {
                            toast.error(data.message || "Invalid Admin password");
                          }
                          } catch (e) {
                            toast.error("Failed to verify password");
                          } finally {
                            setIsEditLoading(false);
                          }
                        }}
                        disabled={isEditLoading || editCooldown > 0}
                      >
                        {isEditLoading ? "Verifying..." : editCooldown > 0 ? `Resend in ${editCooldown}s` : "Send OTP to Admin"}
                      </Button>
                    ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="editOtp">Verification Code (from Admin Email)</Label>
                        <Input
                          id="editOtp"
                          value={editOtp}
                          onChange={(e) => setEditOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          className="text-center font-mono tracking-widest"
                          required
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={otpExpiry > 0 ? "text-muted-foreground" : "text-destructive font-semibold"}>
                          {otpExpiry > 0 ? `Expires in ${formatTime(otpExpiry)}` : "Code expired"}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (editCooldown > 0) return;
                            setIsEditLoading(true);
                            try {
                              const res = await fetch(`${API_BASE}/auth/request-password-change`, {
                                method: "POST",
                                headers: { 
                                  "Content-Type": "application/json",
                                  "Authorization": `Bearer ${useAuthStore.getState().token}`
                                },
                                body: JSON.stringify({ currentPassword: adminCurrentPassword }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                toast.success("New verification code sent");
                                setEditCooldown(60);
                                setOtpExpiry(600);
                              } else {
                                toast.error(data.message || "Failed to resend code");
                              }
                            } catch (e) {
                              toast.error("Error resending code");
                            } finally {
                              setIsEditLoading(false);
                            }
                          }}
                          disabled={editCooldown > 0 || isEditLoading}
                          className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline font-medium"
                        >
                          {editCooldown > 0 ? `Resend in ${editCooldown}s` : "Resend Code"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button 
                      type="button" 
                      onClick={handleUpdatePassword} 
                      disabled={isEditLoading || !otpSent || !editOtp}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isEditLoading ? "Updating Password..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              {!editingUser && (
                <Button type="submit" disabled={isEditLoading} className="w-full sm:w-auto">
                  {isEditLoading ? "Processing..." : "Create User"}
                </Button>
              )}
            </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AdminResetPasswordDialog 
        open={isResetDialogOpen} 
        onOpenChange={setIsResetDialogOpen} 
        user={resetUser}
      />
    </div>
  );
}

function AdminResetPasswordDialog({ 
  open, 
  onOpenChange,
  user
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  user: User | null;
}) {
  const { requestPasswordReset, resetPassword: performReset } = useDataStore();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiry, setExpiry] = useState(0);

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
    if (user) {
      setEmail(user.email);
    }
  }, [user, open]);

  const handleRequestOtp = async () => {
    if (!email) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    const data = await requestPasswordReset(email);
    
    if (data.success) {
      toast.success(`Verification code sent to ${email}`);
      setStep("reset");
      setCooldown(60);
      setExpiry(600);
    } else {
      toast.error(data.message || "Failed to send verification code");
    }
    setIsLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a 6-digit verification code");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    const data = await performReset({ email, otp, newPassword });
    
    if (data.success) {
      toast.success("Password reset successful!");
      onOpenChange(false);
      setStep("email");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(data.message || "Failed to reset password");
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset Password
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6 pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">User Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@reg.gov.rw"
                  className="pl-10"
                  disabled={step === "reset"}
                />
              </div>
            </div>

            {step === "email" ? (
              <Button 
                onClick={handleRequestOtp} 
                className="w-full"
                disabled={isLoading || cooldown > 0}
              >
                {isLoading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Send OTP"}
              </Button>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-lg tracking-widest font-mono"
                    maxLength={6}
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

                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setStep("email")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? "Resetting..." : "Reset"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
