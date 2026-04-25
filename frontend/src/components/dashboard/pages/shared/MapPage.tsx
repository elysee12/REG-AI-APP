import { useAuthStore } from "@/lib/auth";
import { HQMapPage } from "../hq/HQMapPage";
import { BranchMapPage } from "../branch/BranchMapPage";

export function MapPage() {
  const user = useAuthStore((state) => state.user);
  const isHQ = user?.role === "HQ_ADMIN";

  if (isHQ) {
    return <HQMapPage />;
  }

  return <BranchMapPage />;
}
