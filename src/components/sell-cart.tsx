"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomSevaDialog, type CustomSevaSubmission } from "@/components/custom-seva-dialog";
import { formatCurrency } from "@/lib/format";
import type { SevaDTO } from "@/lib/dto";

type CartLine = {
  key: string;
  sevaId: string;
  sevaName: string;
  isCustom: boolean;
  quantity: number;
  unitPrice: number;
  amount: number;
  bhaktaName?: string;
  bhaktaPhone?: string;
};

export function SellCart({ sevas }: { sevas: SevaDTO[] }) {
  const router = useRouter();
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [customSeva, setCustomSeva] = React.useState<SevaDTO | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function addFixedSeva(seva: SevaDTO) {
    setCart((prev) => {
      const existing = prev.find((line) => line.sevaId === seva.id && !line.isCustom);
      if (existing) {
        return prev.map((line) =>
          line.key === existing.key
            ? { ...line, quantity: line.quantity + 1, amount: (line.quantity + 1) * line.unitPrice }
            : line,
        );
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          sevaId: seva.id,
          sevaName: seva.name,
          isCustom: false,
          quantity: 1,
          unitPrice: seva.price!,
          amount: seva.price!,
        },
      ];
    });
  }

  function updateQuantity(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + delta, amount: (line.quantity + delta) * line.unitPrice }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((line) => line.key !== key));
  }

  function addCustomSeva(seva: SevaDTO, submission: CustomSevaSubmission) {
    setCart((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        sevaId: seva.id,
        sevaName: seva.name,
        isCustom: true,
        quantity: 1,
        unitPrice: submission.amount,
        amount: submission.amount,
        bhaktaName: submission.bhaktaName,
        bhaktaPhone: submission.bhaktaPhone,
      },
    ]);
  }

  const total = cart.reduce((sum, line) => sum + line.amount, 0);

  async function handleCheckout() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((line) => ({
            sevaId: line.sevaId,
            quantity: line.quantity,
            amount: line.isCustom ? line.amount : undefined,
            bhaktaName: line.bhaktaName,
            bhaktaPhone: line.bhaktaPhone,
          })),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error ?? "Could not complete sale");
        return;
      }

      setCart([]);
      router.push(`/print/${data.receiptNo}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sevas</CardTitle>
        </CardHeader>
        <CardContent>
          {sevas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active sevas yet. Add some from the Sevas page.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {sevas.map((seva) => (
                <button
                  key={seva.id}
                  type="button"
                  onClick={() => (seva.price === null ? setCustomSeva(seva) : addFixedSeva(seva))}
                  className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-secondary/60"
                >
                  <span className="text-sm font-medium">{seva.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {seva.price === null ? "Custom amount" : formatCurrency(seva.price)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-base">Cart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet. Tap a seva to add it.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((line) => (
                <div key={line.key} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{line.sevaName}</p>
                    {line.isCustom ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {line.bhaktaName} · {line.bhaktaPhone}
                      </p>
                    ) : (
                      <div className="mt-1 flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-6"
                          onClick={() => updateQuantity(line.key, -1)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-5 text-center text-xs">{line.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-6"
                          onClick={() => updateQuantity(line.key, 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-medium">{formatCurrency(line.amount)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${line.sevaName}`}
                      onClick={() => removeLine(line.key)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            disabled={cart.length === 0 || submitting}
            onClick={handleCheckout}
          >
            {submitting ? "Saving..." : "Print Receipt"}
          </Button>
        </CardContent>
      </Card>

      <CustomSevaDialog
        seva={customSeva}
        onOpenChange={(open) => !open && setCustomSeva(null)}
        onSubmit={(submission) => {
          if (customSeva) addCustomSeva(customSeva, submission);
        }}
      />
    </div>
  );
}
