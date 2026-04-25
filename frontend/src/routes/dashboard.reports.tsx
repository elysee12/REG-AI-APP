import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ReportsPage = lazy(() =>
  import("@/components/dashboard/pages/ReportsPage").then((m) => ({
    default: m.ReportsPage,
  })),
);

export const Route = createFileRoute("/dashboard/reports")({
  component: () => (
    <Suspense fallback={null}>
      <ReportsPage />
    </Suspense>
  ),
});
