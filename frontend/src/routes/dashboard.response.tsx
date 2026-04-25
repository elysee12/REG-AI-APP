import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ResponsePage = lazy(() =>
  import("@/components/dashboard/pages/shared/ResponsePage").then((m) => ({
    default: m.ResponsePage,
  })),
);

export const Route = createFileRoute("/dashboard/response")({
  component: () => (
    <Suspense fallback={null}>
      <ResponsePage />
    </Suspense>
  ),
});
