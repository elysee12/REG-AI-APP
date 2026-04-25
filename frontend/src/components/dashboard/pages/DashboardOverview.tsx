import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { useDataStore } from "@/lib/data";
import { HQDashboardOverview } from "./hq/HQDashboardOverview";
import { BranchDashboardOverview } from "./branch/BranchDashboardOverview";

export function DashboardOverview() {
  const user = useAuthStore((state) => state.user);
  const { fetchUsers, fetchBranches, fetchDevices } = useDataStore();
  const isHQ = user?.role === "HQ_ADMIN";

  useEffect(() => {
    fetchUsers();
    fetchBranches();
    fetchDevices();
  }, [fetchUsers, fetchBranches, fetchDevices]);

  if (isHQ) {
    return <HQDashboardOverview />;
  }

  return <BranchDashboardOverview />;
}
