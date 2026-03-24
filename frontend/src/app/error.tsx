"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Something went wrong
        </h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} className="gradient-primary text-white">
          Try Again
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
