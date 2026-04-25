import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const DashboardOverview = lazy(() =>
  import("@/components/dashboard/pages/DashboardOverview").then((m) => ({
    default: m.DashboardOverview,
  })),
);

export const Route = createFileRoute("/dashboard/")({
  component: () => (
    <Suspense fallback={null}>
      <DashboardOverview />
    </Suspense>
  ),
});
