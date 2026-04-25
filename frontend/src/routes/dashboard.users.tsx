import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const UsersPage = lazy(() =>
  import("@/components/dashboard/pages/hq/UsersPage").then((m) => ({
    default: m.UsersPage,
  })),
);

export const Route = createFileRoute("/dashboard/users")({
  component: () => (
    <Suspense fallback={null}>
      <UsersPage />
    </Suspense>
  ),
});
