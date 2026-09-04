"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  templeName,
  firstTimeSetup,
}: {
  templeName: string;
  firstTimeSetup: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (firstTimeSetup && password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = firstTimeSetup ? "/api/auth/setup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong");
        return;
      }

      const next = searchParams.get("next") || "/sell";
      router.push(next);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    email.length > 0 &&
    password.length > 0 &&
    (!firstTimeSetup || confirm.length > 0) &&
    !isSubmitting;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{templeName}</CardTitle>
          <CardDescription>
            {firstTimeSetup
              ? "Create the first admin account to get started."
              : "Sign in to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={firstTimeSetup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {firstTimeSetup ? (
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {isSubmitting
                ? firstTimeSetup
                  ? "Creating account..."
                  : "Signing in..."
                : firstTimeSetup
                  ? "Create admin account"
                  : "Sign in"}
            </Button>
            {!firstTimeSetup ? (
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/forgot-password" className="hover:underline">
                  Forgot password?
                </Link>
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
