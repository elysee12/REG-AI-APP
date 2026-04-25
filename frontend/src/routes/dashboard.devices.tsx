import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const DevicesPage = lazy(() =>
  import("@/components/dashboard/pages/shared/DevicesPage").then((m) => ({
    default: m.DevicesPage,
  })),
);

export const Route = createFileRoute("/dashboard/devices")({
  component: () => (
    <Suspense fallback={null}>
      <DevicesPage />
    </Suspense>
  ),
});
