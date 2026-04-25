import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const QueuePage = lazy(() =>
  import("@/components/dashboard/pages/shared/QueuePage").then((m) => ({
    default: m.QueuePage,
  })),
);

export const Route = createFileRoute("/dashboard/queue")({
  component: () => (
    <Suspense fallback={null}>
      <QueuePage />
    </Suspense>
  ),
});
