"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReceiptDocument } from "@/components/receipt-document";
import type { ReceiptDTO, TempleHeaderDTO } from "@/lib/dto";

export function ReceiptPrintView({
  receipt,
  templeSettings,
}: {
  receipt: ReceiptDTO;
  templeSettings: TempleHeaderDTO;
}) {
  const hasAutoPrinted = React.useRef(false);

  React.useEffect(() => {
    if (hasAutoPrinted.current) return;
    hasAutoPrinted.current = true;
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
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" asChild>
          <Link href="/sell">
            <Plus className="size-4" />
            New Sale
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Print Again
        </Button>
      </div>

      <ReceiptDocument receipt={receipt} templeSettings={templeSettings} />
    </div>
  );
}
