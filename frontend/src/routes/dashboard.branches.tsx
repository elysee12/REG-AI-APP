import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const BranchesPage = lazy(() =>
  import("@/components/dashboard/pages/hq/BranchesPage").then((m) => ({
    default: m.BranchesPage,
  })),
);

export const Route = createFileRoute("/dashboard/branches")({
  component: () => (
    <Suspense fallback={null}>
      <BranchesPage />
    </Suspense>
  ),
});
