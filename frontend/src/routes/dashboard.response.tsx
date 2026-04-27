import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ResponsePage = lazy(() =>
  import("@/components/dashboard/pages/shared/ResponsePage").then((m) => ({
    default: m.ResponsePage,
  })),
);

type ResponseSearchParams = {
  incidentId?: string;
};

export const Route = createFileRoute("/dashboard/response")({
  validateSearch: (search: Record<string, unknown>): ResponseSearchParams => {
    return {
      incidentId: (search.incidentId as string) || undefined,
    };
  },
  component: () => (
    <Suspense fallback={null}>
      <ResponsePage />
    </Suspense>
  ),
});

