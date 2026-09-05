import { formatCurrency } from "@/lib/format";
import { formatReceiptDate, formatReceiptTime } from "@/lib/date";
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

  return (
    <div className={styles.receipt}>
      <div className={styles.center}>
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
    </div>
  );
}
