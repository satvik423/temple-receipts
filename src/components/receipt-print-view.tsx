"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { formatReceiptDate, formatReceiptTime } from "@/lib/date";
import type { ReceiptDTO } from "@/lib/dto";
import styles from "./receipt-print-view.module.css";

export function ReceiptPrintView({
  receipt,
  templeSettings,
}: {
  receipt: ReceiptDTO;
  templeSettings: { name: string; place: string; phone: string };
}) {
  const hasAutoPrinted = React.useRef(false);
  const createdAt = new Date(receipt.createdAt);
  const customItems = receipt.items.filter((item) => item.isCustom);

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

      <div className={styles.receipt}>
        <div className={styles.center}>
          <p>{templeSettings.name},</p>
          <p>{templeSettings.place}</p>
          <p>Mob: {templeSettings.phone}</p>
        </div>

        <div className={styles.separator} />

        <div className={styles.row}>
          <span className={styles.item}>#{receipt.receiptNo}</span>
          <span>{formatReceiptDate(createdAt)}</span>
          <span>{formatReceiptTime(createdAt)}</span>
        </div>

        <div className={styles.separator} />

        <div className={`${styles.row} ${styles.tableHeader}`}>
          <span className={styles.item}>ITEM</span>
          <span className={styles.qty}>QTY</span>
          <span className={styles.amount}>Amount</span>
        </div>

        <div className={styles.separatorThin} />

        {receipt.items.map((item, index) => (
          <div key={index} className={styles.row}>
            <span className={styles.item}>{item.sevaName}</span>
            <span className={styles.qty}>{item.quantity}</span>
            <span className={styles.amount}>{formatCurrency(item.amount)}</span>
          </div>
        ))}

        {customItems.length > 0 ? (
          <div className={styles.attributions}>
            {customItems.map((item, index) => (
              <p key={index}>
                {item.bhaktaName} has {item.sevaName} {formatCurrency(item.amount)}
              </p>
            ))}
          </div>
        ) : null}

        <div className={styles.separator} />

        <div className={`${styles.row} ${styles.total}`}>
          <span className={styles.item}>TOTAL</span>
          <span className={styles.qty} />
          <span className={styles.amount}>{formatCurrency(receipt.total)}</span>
        </div>
      </div>
    </div>
  );
}
