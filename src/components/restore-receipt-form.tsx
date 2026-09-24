"use client";

import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { formatReceiptDate } from "@/lib/date";
import { displaySevaName, type ReceiptDTO } from "@/lib/dto";

export function RestoreReceiptForm() {
  const [gbn, setGbn] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const [result, setResult] = React.useState<ReceiptDTO | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setResult(null);

    try {
      const res = await fetch(`/api/receipts/by-gbn/${gbn.trim()}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error ?? "No receipt found with that GBN");
        return;
      }

      setResult(data as ReceiptDTO);
    } finally {
      setSearching(false);
    }
  }

  async function handleRestore() {
    if (!result) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/receipts/${result.id}`, { method: "PATCH" });
      if (!res.ok) {
        toast.error("Could not restore receipt");
        return;
      }
      toast.success("Receipt restored");
      setResult({ ...result, active: true });
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Restore Deleted Receipt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Search a GBN number to view and, if it was deleted by mistake, restore it.
        </p>

        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="restore-gbn">GBN number</Label>
            <Input
              id="restore-gbn"
              type="number"
              min={1}
              step={1}
              value={gbn}
              onChange={(e) => setGbn(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <Button type="submit" disabled={searching || !gbn.trim()}>
            {searching ? "Searching..." : "Search"}
          </Button>
        </form>

        {result ? (
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3">
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <span>
                  #{result.receiptNo} · DBN #{result.dbn}
                </span>
                <Badge variant={result.active ? "secondary" : "destructive"}>
                  {result.active ? "Active" : "Deleted"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{formatReceiptDate(new Date(result.createdAt))}</p>
              <p className="text-muted-foreground">
                {result.items.map((item) => displaySevaName(item)).join(", ")}
              </p>
              <p className="font-medium">{formatCurrency(result.total)}</p>
            </div>
            {!result.active ? (
              <Button size="sm" disabled={restoring} onClick={handleRestore}>
                {restoring ? "Restoring..." : "Restore"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
