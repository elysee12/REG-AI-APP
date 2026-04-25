import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const IncidentsPage = lazy(() =>
  import("@/components/dashboard/pages/shared/IncidentsPage").then((m) => ({
    default: m.IncidentsPage,
  })),
);

export const Route = createFileRoute("/dashboard/incidents")({
  component: () => (
    <Suspense fallback={null}>
      <IncidentsPage />
    </Suspense>
  ),
});
