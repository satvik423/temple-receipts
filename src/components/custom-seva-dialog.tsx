"use client";

import * as React from "react";

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
import type { SevaDTO } from "@/lib/dto";

export type CustomSevaSubmission = {
  bhaktaName: string;
  bhaktaPhone: string;
  amount: number;
};

export function CustomSevaDialog({
  seva,
  onOpenChange,
  onSubmit,
}: {
  seva: SevaDTO | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (submission: CustomSevaSubmission) => void;
}) {
  return (
    <Dialog open={seva !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seva?.name}</DialogTitle>
        </DialogHeader>
        {seva ? (
          <CustomSevaForm seva={seva} onOpenChange={onOpenChange} onSubmit={onSubmit} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CustomSevaForm({
  onOpenChange,
  onSubmit,
}: {
  seva: SevaDTO;
  onOpenChange: (open: boolean) => void;
  onSubmit: (submission: CustomSevaSubmission) => void;
}) {
  const [bhaktaName, setBhaktaName] = React.useState("");
  const [bhaktaPhone, setBhaktaPhone] = React.useState("");
  const [amount, setAmount] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ bhaktaName: bhaktaName.trim(), bhaktaPhone: bhaktaPhone.trim(), amount: Number(amount) });
    onOpenChange(false);
  }

  const canSubmit = bhaktaName.trim().length > 0 && Number(amount) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bhakta-name">Bhakta Name</Label>
        <Input
          id="bhakta-name"
          value={bhaktaName}
          onChange={(e) => setBhaktaName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bhakta-phone">
          Phone Number <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="bhakta-phone"
          type="tel"
          inputMode="numeric"
          maxLength={15}
          value={bhaktaPhone}
          onChange={(e) => setBhaktaPhone(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="custom-amount">Amount (₹)</Label>
        <Input
          id="custom-amount"
          type="number"
          min={0}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={!canSubmit}>
          Add to Cart
        </Button>
      </DialogFooter>
    </form>
  );
}
