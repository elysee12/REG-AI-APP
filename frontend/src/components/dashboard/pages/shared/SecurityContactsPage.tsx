import { useAuthStore } from "@/lib/auth";
import { HQSecurityContactsPage } from "../hq/HQSecurityContactsPage";
import { BranchSecurityContactsPage } from "../branch/BranchSecurityContactsPage";

export function SecurityContactsPage() {
  const user = useAuthStore((state) => state.user);
  const isHQ = user?.role === "HQ_ADMIN";

  if (isHQ) {
    return <HQSecurityContactsPage />;
  }

  return <BranchSecurityContactsPage />;
}
