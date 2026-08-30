"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SettingsValues = {
  name: string;
  place: string;
  phone: string;
};

export function SettingsForm({ initialValues }: { initialValues: SettingsValues }) {
  const router = useRouter();
  const [name, setName] = React.useState(initialValues.name);
  const [place, setPlace] = React.useState(initialValues.place);
  const [phone, setPhone] = React.useState(initialValues.phone);
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
        body: JSON.stringify({ name, place, phone }),
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
    </div>
  );
}
