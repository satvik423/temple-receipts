import { formatCurrency } from "@/lib/format";
import { formatReceiptDate } from "@/lib/date";
import { amountToWords } from "@/lib/number-to-words";
import type { KanikeRowDTO } from "@/lib/dto";
import styles from "./kanike-receipt-view.module.css";

export function KanikeReceiptDocument({
  row,
  templeSettings,
}: {
  row: KanikeRowDTO;
  templeSettings: { name: string; place: string; phone: string };
}) {
  const createdAt = new Date(row.createdAt);

  return (
    <div className={styles.receipt}>
      <div className={styles.center}>
        <p className={styles.templeName}>{templeSettings.name},</p>
        <p>{templeSettings.place}</p>
        <p>Mob: {templeSettings.phone}</p>
      </div>

      <div className={styles.separator} />

      <div className={styles.row}>
        <span>
          GBN #{row.receiptNo} &nbsp; DBN #{row.dbn}
        </span>
        <span>{formatReceiptDate(createdAt)}</span>
      </div>

      <p className={styles.field}>Name: {row.bhaktaName}</p>
      <p className={styles.field}>Kanike Name: {row.sevaName}</p>
      <p className={styles.field}>Phone: {row.bhaktaPhone || "-"}</p>
      {row.bhaktaAddress ? <p className={styles.field}>Address: {row.bhaktaAddress}</p> : null}
      <p className={styles.field}>A sum of Rupees {amountToWords(row.amount)}</p>

      <div className={styles.footer}>
        <span>Amount: {formatCurrency(row.amount)}</span>
        <span className={styles.signature}>Authorised Signature</span>
      </div>
    </div>
  );
}
