import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const SettingsPage = lazy(() =>
  import("@/components/dashboard/pages/shared/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);

export const Route = createFileRoute("/dashboard/settings")({
  component: () => (
    <Suspense fallback={null}>
      <SettingsPage />
    </Suspense>
  ),
});
