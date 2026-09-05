"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GbnSettingsForm } from "@/components/gbn-settings-form";
import { UsersSection } from "@/components/users-section";
import { PrinterConnectButton } from "@/components/printer-connect-button";

type SettingsValues = {
  name: string;
  place: string;
  phone: string;
  upiId: string;
};

export function SettingsForm({
  initialValues,
  currentGbn,
  currentUserId,
}: {
  initialValues: SettingsValues;
  currentGbn: number;
  currentUserId: string;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(initialValues.name);
  const [place, setPlace] = React.useState(initialValues.place);
  const [phone, setPhone] = React.useState(initialValues.phone);
  const [upiId, setUpiId] = React.useState(initialValues.upiId);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, place, phone, upiId }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong");
        return;
      }

      toast.success("Settings saved");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length > 0 && place.trim().length > 0 && phone.trim().length > 0;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Settings</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receipt Header</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="temple-name">Temple Name</Label>
                <Input id="temple-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="temple-place">Place</Label>
                <Input
                  id="temple-place"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="Street, Town - PIN"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="temple-phone">Phone Number</Label>
                <Input
                  id="temple-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={submitting || !canSubmit}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receipt Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-muted/30 p-4 text-center font-mono text-xs leading-relaxed">
              <p>{name || "Temple Name"},</p>
              <p>{place || "Place"}</p>
              <p>Mob: {phone || "Phone Number"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">UPI Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="upi-id">UPI ID (VPA)</Label>
              <Input
                id="upi-id"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="temple@upi"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={submitting || !canSubmit}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            When set, a UPI QR code pre-filled with the receipt amount is printed on receipts and
            Kanike vouchers. Leave blank to hide the QR code.
          </p>
        </CardContent>
      </Card>

      <GbnSettingsForm currentGbn={currentGbn} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receipt Printer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <PrinterConnectButton />
          <p className="text-xs text-muted-foreground">
            Connect your USB receipt printer once here. After that, Save &amp; Print and Reprint
            will print straight to it, with no print preview screen.
          </p>
        </CardContent>
      </Card>

      <UsersSection currentUserId={currentUserId} />
    </div>
  );
}
