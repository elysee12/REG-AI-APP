import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const SecurityContactsPage = lazy(() =>
  import("@/components/dashboard/pages/shared/SecurityContactsPage").then((m) => ({
    default: m.SecurityContactsPage,
  })),
);

export const Route = createFileRoute("/dashboard/security-contacts")({
  component: () => (
    <Suspense fallback={null}>
      <SecurityContactsPage />
    </Suspense>
  ),
});
