"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The page hit an unexpected error. You can try again, or head back to Sell.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => reset()}>Try Again</Button>
            <Button variant="outline" asChild>
              <a href="/sell">Go to Sell</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
