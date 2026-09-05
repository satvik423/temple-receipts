"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KanikeRowDTO } from "@/lib/dto";

export function KanikeEditDialog({
  row,
  onOpenChange,
  onSaved,
}: {
  row: KanikeRowDTO | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Kanike Entry</DialogTitle>
        </DialogHeader>
        {row ? <KanikeEditForm row={row} onOpenChange={onOpenChange} onSaved={onSaved} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function KanikeEditForm({
  row,
  onOpenChange,
  onSaved,
}: {
  row: KanikeRowDTO;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [bhaktaName, setBhaktaName] = React.useState(row.bhaktaName ?? "");
  const [bhaktaPhone, setBhaktaPhone] = React.useState(row.bhaktaPhone ?? "");
  const [remark, setRemark] = React.useState(row.remark ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/kanike/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bhaktaName: bhaktaName.trim(),
          bhaktaPhone: bhaktaPhone.trim(),
          remark: remark.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong");
        return;
      }

      toast.success("Kanike entry updated");
      onOpenChange(false);
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = bhaktaName.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="kanike-edit-name">Bhakta Name</Label>
        <Input
          id="kanike-edit-name"
          value={bhaktaName}
          onChange={(e) => setBhaktaName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kanike-edit-phone">
          Phone Number <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="kanike-edit-phone"
          type="tel"
          inputMode="numeric"
          maxLength={15}
          value={bhaktaPhone}
          onChange={(e) => setBhaktaPhone(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kanike-edit-remark">
          Remark <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="kanike-edit-remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DialogFooter>
        <Button type="submit" disabled={submitting || !canSubmit}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
