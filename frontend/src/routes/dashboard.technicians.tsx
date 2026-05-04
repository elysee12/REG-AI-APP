import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const TechniciansPage = lazy(() =>
  import("@/components/dashboard/pages/hq/TechniciansPage").then((m) => ({
    default: m.TechniciansPage,
  })),
);

export const Route = createFileRoute("/dashboard/technicians")({
  component: () => (
    <Suspense fallback={null}>
      <TechniciansPage />
    </Suspense>
  ),
});
