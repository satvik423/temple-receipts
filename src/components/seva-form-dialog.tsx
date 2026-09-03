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
import { Switch } from "@/components/ui/switch";
import type { SevaDTO } from "@/lib/dto";

export function SevaFormDialog({
  seva,
  open,
  onOpenChange,
  onSaved,
}: {
  seva?: SevaDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seva ? "Edit Seva" : "Add Seva"}</DialogTitle>
        </DialogHeader>
        {open ? (
          <SevaForm
            key={seva?.id ?? "new"}
            seva={seva ?? null}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SevaForm({
  seva,
  onOpenChange,
  onSaved,
}: {
  seva: SevaDTO | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(seva);
  const [name, setName] = React.useState(seva?.name ?? "");
  const [nameEn, setNameEn] = React.useState(seva?.nameEn ?? "");
  const [isCustom, setIsCustom] = React.useState(seva ? seva.price === null : false);
  const [price, setPrice] = React.useState(seva?.price != null ? String(seva.price) : "");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = { name, nameEn, isCustom, price: isCustom ? null : Number(price) };
      const url = isEdit ? `/api/sevas/${seva!.id}` : "/api/sevas";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong");
        return;
      }

      toast.success(isEdit ? "Seva updated" : "Seva added");
      onOpenChange(false);
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length > 0 && (isCustom || price.trim().length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seva-name">Name</Label>
        <Input id="seva-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>

      <div className="space-y-2">
        <Label htmlFor="seva-name-en">
          Name in English <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="seva-name-en"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="text-sm font-medium">Custom price</p>
          <p className="text-xs text-muted-foreground">
            Ask amount, name &amp; phone at sale time
          </p>
        </div>
        <Switch checked={isCustom} onCheckedChange={setIsCustom} />
      </div>

      {!isCustom ? (
        <div className="space-y-2">
          <Label htmlFor="seva-price">Price (₹)</Label>
          <Input
            id="seva-price"
            type="number"
            min={0}
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DialogFooter>
        <Button type="submit" disabled={submitting || !canSubmit}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
