import { formatCurrency } from "@/lib/format";
import { formatReceiptDate, formatReceiptTime } from "@/lib/date";
import { buildUpiUri, generateQrDataUrl } from "@/lib/upi-qr";
import type { ReceiptDTO, TempleHeaderDTO } from "@/lib/dto";
import styles from "./receipt-print-view.module.css";

export function ReceiptDocument({
  receipt,
  templeSettings,
  isCopy = false,
}: {
  receipt: ReceiptDTO;
  templeSettings: TempleHeaderDTO;
  isCopy?: boolean;
}) {
  const createdAt = new Date(receipt.createdAt);
  const customItems = receipt.items.filter((item) => item.isCustom);
  const qrDataUrl = templeSettings.upiId
    ? generateQrDataUrl(
        buildUpiUri({
          upiId: templeSettings.upiId,
          payeeName: templeSettings.name,
          amount: receipt.total,
          note: `Receipt #${receipt.receiptNo}`,
        }),
      )
    : null;

  return (
    <div className={styles.receipt}>
      <div className={styles.center}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className={styles.logo} />
        <p>{templeSettings.name},</p>
        <p>{templeSettings.place}</p>
        <p>Mob: {templeSettings.phone}</p>
      </div>

      {isCopy ? <div className={styles.copyBadge}>*** COPY ***</div> : null}

      <div className={styles.separator} />

      <div className={styles.row}>
        <span className={styles.item}>GBN #{receipt.receiptNo}</span>
        <span>DBN #{receipt.dbn}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.item}>{formatReceiptDate(createdAt)}</span>
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
              {item.remark ? ` ${item.remark}` : ""}
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

      {qrDataUrl ? (
        <div className={styles.qrSection}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="" className={styles.qrCode} />
          <p className={styles.qrCaption}>Scan &amp; Pay via UPI</p>
        </div>
      ) : null}
    </div>
  );
}
