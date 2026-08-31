"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GbnSettingsForm({ currentGbn }: { currentGbn: number }) {
  const router = useRouter();
  const [nextGbn, setNextGbn] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/settings/gbn", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextGbn: Number(nextGbn) }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong");
        return;
      }

      toast.success("Grand Bill Number updated");
      setNextGbn("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grand Bill Number</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {currentGbn > 0
            ? `Last bill issued was #${currentGbn}. The next sale will be #${currentGbn + 1}.`
            : "No bills issued yet. The next sale will be #1."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="next-gbn">Continue from bill number</Label>
            <Input
              id="next-gbn"
              type="number"
              min={currentGbn + 1}
              step={1}
              placeholder={String(currentGbn + 1)}
              value={nextGbn}
              onChange={(e) => setNextGbn(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <Button type="submit" disabled={submitting || !nextGbn.trim()}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </form>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <p className="text-xs text-muted-foreground">
          Only needed if you&apos;re switching from an existing paper or billing system and want
          to continue its numbering. Leave this alone otherwise.
        </p>
      </CardContent>
    </Card>
  );
}
