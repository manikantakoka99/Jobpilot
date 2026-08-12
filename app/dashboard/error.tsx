"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would report to a monitoring service.
    console.error(error);
  }, [error]);

  return (
    <Card className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-5" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground max-w-sm text-sm text-pretty">
          We couldn&apos;t load this page. Please try again — if the problem persists, come back a
          little later.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        <RotateCw className="size-4" />
        Try again
      </Button>
    </Card>
  );
}
