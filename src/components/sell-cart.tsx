"use client";

import * as React from "react";
import { Minus, Plus, Printer, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomSevaDialog, type CustomSevaSubmission } from "@/components/custom-seva-dialog";
import { ReceiptDocument } from "@/components/receipt-document";
import { formatCurrency } from "@/lib/format";
import type { ReceiptDTO, SevaDTO } from "@/lib/dto";

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

export function SellCart({
  sevas,
  templeSettings,
}: {
  sevas: SevaDTO[];
  templeSettings: { name: string; place: string; phone: string };
}) {
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [customSeva, setCustomSeva] = React.useState<SevaDTO | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [printReceipt, setPrintReceipt] = React.useState<ReceiptDTO | null>(null);

  React.useEffect(() => {
    if (!printReceipt) return;
    const timer = setTimeout(() => window.print(), 150);
    return () => clearTimeout(timer);
  }, [printReceipt]);

  React.useEffect(() => {
    function handleAfterPrint() {
      setPrintReceipt(null);
    }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const filteredSevas = query.trim()
    ? sevas.filter((seva) => seva.name.toLowerCase().includes(query.trim().toLowerCase()))
    : sevas;

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

  function removeLastCustomEntry(sevaId: string) {
    setCart((prev) => {
      const lastIndex = prev.map((line) => line.sevaId === sevaId && line.isCustom).lastIndexOf(true);
      if (lastIndex === -1) return prev;
      return prev.filter((_, index) => index !== lastIndex);
    });
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
      setPrintReceipt(data);
      toast.success(`Bill #${data.receiptNo} saved`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Sell</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sevas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active sevas yet. Add some from the Sevas page.
            </p>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search sevas..."
                  className="pl-8"
                />
                {query ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Clear search"
                    className="absolute top-1/2 right-1 size-6 -translate-y-1/2"
                    onClick={() => setQuery("")}
                  >
                    <X className="size-3.5" />
                  </Button>
                ) : null}
              </div>

              {filteredSevas.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sevas match &quot;{query}&quot;.</p>
              ) : (
                <div className="divide-y rounded-md border">
                  {filteredSevas.map((seva) => {
                    const isCustomSeva = seva.price === null;
                    const fixedLine = !isCustomSeva
                      ? cart.find((line) => line.sevaId === seva.id && !line.isCustom)
                      : undefined;
                    const customEntries = isCustomSeva
                      ? cart.filter((line) => line.sevaId === seva.id && line.isCustom)
                      : [];
                    const quantity = isCustomSeva ? customEntries.length : (fixedLine?.quantity ?? 0);
                    const lineAmount = fixedLine?.amount ?? 0;

                    return (
                      <div key={seva.id} className="p-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="min-w-0 flex-1 basis-40">
                            <p className="truncate font-medium">{seva.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {isCustomSeva ? "Custom amount" : formatCurrency(seva.price!)}
                            </p>
                          </div>

                          {!isCustomSeva ? (
                            <span className="w-16 shrink-0 text-right font-medium">
                              {quantity > 0 ? formatCurrency(lineAmount) : ""}
                            </span>
                          ) : null}

                          <div className="ml-auto flex shrink-0 items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Decrease ${seva.name}`}
                              disabled={quantity === 0}
                              onClick={() =>
                                isCustomSeva
                                  ? removeLastCustomEntry(seva.id)
                                  : fixedLine && updateQuantity(fixedLine.key, -1)
                              }
                            >
                              <Minus className="size-4" />
                            </Button>
                            <span className="w-6 text-center font-medium">{quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Increase ${seva.name}`}
                              onClick={() =>
                                isCustomSeva ? setCustomSeva(seva) : addFixedSeva(seva)
                              }
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        </div>

                        {isCustomSeva && customEntries.length > 0 ? (
                          <div className="mt-2 space-y-1 rounded-md bg-secondary/40 p-2">
                            {customEntries.map((entry) => (
                              <div
                                key={entry.key}
                                className="flex items-center justify-between gap-2 text-sm"
                              >
                                <span className="min-w-0 truncate text-muted-foreground">
                                  {entry.bhaktaName} · {entry.bhaktaPhone}
                                </span>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="font-medium">{formatCurrency(entry.amount)}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-6 text-muted-foreground hover:text-destructive"
                                    aria-label={`Remove ${entry.bhaktaName} entry`}
                                    onClick={() => removeLine(entry.key)}
                                  >
                                    <X className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{formatCurrency(total)}</p>
          </div>
          <div className="flex items-center gap-2">
            {printReceipt ? (
              <Button
                type="button"
                variant="outline"
                aria-label={`Print bill ${printReceipt.receiptNo} again`}
                onClick={() => window.print()}
              >
                <Printer className="size-4" />
                Print Again
              </Button>
            ) : null}
            <Button size="lg" disabled={cart.length === 0 || submitting} onClick={handleCheckout}>
              {submitting ? "Saving..." : "Save & Print"}
            </Button>
          </div>
        </div>
      </div>

      <CustomSevaDialog
        seva={customSeva}
        onOpenChange={(open) => !open && setCustomSeva(null)}
        onSubmit={(submission) => {
          if (customSeva) addCustomSeva(customSeva, submission);
        }}
      />

      {printReceipt ? (
        <div className="hidden print:block">
          <ReceiptDocument receipt={printReceipt} templeSettings={templeSettings} />
        </div>
      ) : null}
    </div>
  );
}
