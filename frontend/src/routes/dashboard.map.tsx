import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const MapPage = lazy(() =>
  import("@/components/dashboard/pages/shared/MapPage").then((m) => ({
    default: m.MapPage,
  })),
);

export const Route = createFileRoute("/dashboard/map")({
  component: () => (
    <Suspense fallback={null}>
      <MapPage />
    </Suspense>
  ),
});
