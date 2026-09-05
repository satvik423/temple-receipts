"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBusinessDate } from "@/lib/date";
import type { KanikeRowDTO, SevaDTO } from "@/lib/dto";

export function KanikeEditDialog({
  row,
  kanikeTypes,
  onOpenChange,
  onSaved,
}: {
  row: KanikeRowDTO | null;
  kanikeTypes: SevaDTO[];
  onOpenChange: (open: boolean) => void;
  onSaved: (newBusinessDate: string) => void;
}) {
  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Kanike Entry</DialogTitle>
        </DialogHeader>
        {row ? (
          <KanikeEditForm
            row={row}
            kanikeTypes={kanikeTypes}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function KanikeEditForm({
  row,
  kanikeTypes,
  onOpenChange,
  onSaved,
}: {
  row: KanikeRowDTO;
  kanikeTypes: SevaDTO[];
  onOpenChange: (open: boolean) => void;
  onSaved: (newBusinessDate: string) => void;
}) {
  const [bhaktaName, setBhaktaName] = React.useState(row.bhaktaName ?? "");
  const [bhaktaPhone, setBhaktaPhone] = React.useState(row.bhaktaPhone ?? "");
  const [bhaktaAddress, setBhaktaAddress] = React.useState(row.bhaktaAddress ?? "");
  const [remark, setRemark] = React.useState(row.remark ?? "");
  const [sevaId, setSevaId] = React.useState(row.sevaId);
  const [onlinePay, setOnlinePay] = React.useState(row.isOnlinePay);
  const [businessDate, setBusinessDate] = React.useState(row.businessDate);
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
          bhaktaAddress: bhaktaAddress.trim(),
          remark: remark.trim(),
          sevaId,
          isOnlinePay: onlinePay,
          businessDate,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong");
        return;
      }

      toast.success("Kanike entry updated");
      onOpenChange(false);
      onSaved(data.businessDate);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = bhaktaName.trim().length > 0 && businessDate.length > 0;

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
        <Label htmlFor="kanike-edit-date">Date</Label>
        <Input
          id="kanike-edit-date"
          type="date"
          max={getBusinessDate()}
          value={businessDate}
          onChange={(e) => e.target.value && setBusinessDate(e.target.value)}
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
        <Label htmlFor="kanike-edit-address">
          Address <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="kanike-edit-address"
          value={bhaktaAddress}
          onChange={(e) => setBhaktaAddress(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kanike-edit-remark">
          Remark <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input id="kanike-edit-remark" value={remark} onChange={(e) => setRemark(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Type of Kanike</Label>
        <div className="flex flex-wrap gap-2">
          {kanikeTypes.map((type) => (
            <Button
              key={type.id}
              type="button"
              variant={sevaId === type.id ? "default" : "outline"}
              onClick={() => setSevaId(type.id)}
            >
              {type.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="kanike-edit-online-pay"
          checked={onlinePay}
          onCheckedChange={(checked) => setOnlinePay(checked === true)}
        />
        <Label htmlFor="kanike-edit-online-pay" className="font-normal">
          Online Pay
        </Label>
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
