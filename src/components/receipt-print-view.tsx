"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReceiptDocument } from "@/components/receipt-document";
import type { ReceiptDTO } from "@/lib/dto";

export function ReceiptPrintView({
  receipt,
  templeSettings,
}: {
  receipt: ReceiptDTO;
  templeSettings: { name: string; place: string; phone: string };
}) {
  const hasAutoPrinted = React.useRef(false);

  React.useEffect(() => {
    if (hasAutoPrinted.current) return;
    hasAutoPrinted.current = true;
    const timer = setTimeout(() => window.print(), 150);
    return () => clearTimeout(timer);
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
