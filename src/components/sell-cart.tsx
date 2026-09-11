"use client";

import * as React from "react";
import { Minus, Plus, Printer, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomSevaDialog, type CustomSevaSubmission } from "@/components/custom-seva-dialog";
import { PrinterConnectButton } from "@/components/printer-connect-button";
import { ReceiptDocument } from "@/components/receipt-document";
import { formatCurrency } from "@/lib/format";
import { getAuthorizedPrinter, printReceiptToUsb } from "@/lib/thermal-printer";
import type { ReceiptDTO, SevaDTO, TempleHeaderDTO } from "@/lib/dto";

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
  templeSettings: TempleHeaderDTO;
}) {
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [customSeva, setCustomSeva] = React.useState<SevaDTO | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [printReceipt, setPrintReceipt] = React.useState<ReceiptDTO | null>(null);
  const [printing, setPrinting] = React.useState(false);
  const [printerConnected, setPrinterConnected] = React.useState(true);
  const [browserPrintJob, setBrowserPrintJob] = React.useState<{
    receipt: ReceiptDTO;
    isCopy: boolean;
  } | null>(null);

  React.useEffect(() => {
    getAuthorizedPrinter().then((device) => setPrinterConnected(device !== null));
  }, []);

  React.useEffect(() => {
    if (!browserPrintJob) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        await Promise.all([
          document.fonts.load('400 16px "Noto Sans Kannada"'),
          document.fonts.load('700 16px "Noto Sans Kannada"'),
        ]);
      } catch {
        // Print with whatever font is available rather than blocking forever.
      }
      if (!cancelled) window.print();
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [browserPrintJob]);

  React.useEffect(() => {
    function handleAfterPrint() {
      setBrowserPrintJob(null);
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

  async function printBill(receipt: ReceiptDTO, isCopy = false) {
    setPrinting(true);
    try {
      await printReceiptToUsb(receipt, templeSettings, isCopy);
    } catch (err) {
      console.warn("USB print failed, falling back to browser print:", err);
      setBrowserPrintJob({ receipt, isCopy });
    } finally {
      setPrinting(false);
    }
  }

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
      await printBill(data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      <Card className={`print:hidden ${printerConnected ? "" : "border-destructive/50"}`}>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <p className="text-sm text-muted-foreground">
            {printerConnected
              ? "Thermal printer connected."
              : "No printer connected — bills will be saved but won't print until you connect one."}
          </p>
          <PrinterConnectButton onConnected={() => setPrinterConnected(true)} />
        </CardContent>
      </Card>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-4">
        <Card className="hidden print:hidden lg:block">
          <CardHeader>
            <CardTitle className="text-base">Sevas</CardTitle>
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {filteredSevas.map((seva) => (
                      <button
                        key={seva.id}
                        type="button"
                        onClick={() =>
                          seva.price === null ? setCustomSeva(seva) : addFixedSeva(seva)
                        }
                        className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-secondary/60"
                      >
                        <span className="text-lg font-bold">{seva.name}</span>
                        <span className="text-base font-bold text-muted-foreground">
                          {seva.price === null ? "Custom amount" : formatCurrency(seva.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hidden lg:sticky lg:top-20 lg:self-start lg:block">
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
                          {line.bhaktaName}
                          {line.bhaktaPhone ? ` · ${line.bhaktaPhone}` : null}
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

            {printReceipt ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={printing}
                aria-label={`Print bill ${printReceipt.receiptNo} again`}
                onClick={() => printBill(printReceipt)}
              >
                <Printer className="size-4" />
                Print Again
              </Button>
            ) : null}

            <Button
              className="w-full"
              disabled={cart.length === 0 || submitting}
              onClick={handleCheckout}
            >
              {submitting ? "Saving..." : "Save & Print"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="print:hidden lg:hidden">
        <CardHeader>
          <CardTitle className="text-base">Seva</CardTitle>
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
                            <p className="truncate text-lg font-bold">{seva.name}</p>
                            <p className="text-base font-bold text-muted-foreground">
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
                                  {entry.bhaktaName}
                                  {entry.bhaktaPhone ? ` · ${entry.bhaktaPhone}` : null}
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

      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 print:hidden lg:hidden">
        <div className="flex w-full items-center justify-between gap-3 px-3 py-3 sm:px-6">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{formatCurrency(total)}</p>
          </div>
          <div className="flex items-center gap-2">
            {printReceipt ? (
              <Button
                type="button"
                variant="outline"
                disabled={printing}
                aria-label={`Print bill ${printReceipt.receiptNo} again`}
                onClick={() => printBill(printReceipt)}
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

      {browserPrintJob ? (
        <div className="hidden print:block">
          <ReceiptDocument
            receipt={browserPrintJob.receipt}
            templeSettings={templeSettings}
            isCopy={browserPrintJob.isCopy}
          />
        </div>
      ) : null}
    </div>
  );
}
