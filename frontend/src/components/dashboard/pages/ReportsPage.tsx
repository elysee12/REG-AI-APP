import { useAuthStore } from "@/lib/auth";
import { HQReportsPage } from "./hq/HQReportsPage";
import { BranchReportsPage } from "./branch/BranchReportsPage";

export function ReportsPage() {
  const user = useAuthStore((state) => state.user);
  const isHQ = user?.role === "HQ_ADMIN";

  if (isHQ) {
    return <HQReportsPage />;
  }

  return <BranchReportsPage />;
}
