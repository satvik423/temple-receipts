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
  const nameAndAddress = row.bhaktaAddress
    ? `${row.bhaktaName}, ${row.bhaktaAddress}`
    : row.bhaktaName;

  return (
    <div className={styles.outer}>
      <div className={styles.receipt}>
        <div className={styles.center}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className={styles.logo} />
          <p className={styles.templeName}>{templeSettings.name},</p>
          <p>{templeSettings.place}</p>
          <p>Mob: {templeSettings.phone}</p>
        </div>

        <div className={styles.ornamentDivider}>
          <span className={styles.dividerLine} />
          <span className={styles.ornament}>❧</span>
          <span className={styles.dividerLine} />
        </div>

        <div className={styles.row}>
          <span>
            R.No- <span className={styles.filled}>{row.receiptNo}</span>
          </span>
          <span>
            Date <span className={styles.filled}>{formatReceiptDate(createdAt)}</span>
          </span>
        </div>

        <p className={styles.field}>
          Name &amp; Address Sri/Smt <span className={styles.filled}>{nameAndAddress}</span>
        </p>

        <p className={styles.field}>
          Kanike Name <span className={styles.filled}>{row.sevaName}</span>
        </p>

        <div className={styles.row}>
          <span>
            By <span className={styles.filled}>{row.isOnlinePay ? "Online" : "Cash"}</span>
          </span>
          <span>
            Mob. No <span className={styles.filled}>{row.bhaktaPhone || "-"}</span>
          </span>
        </div>

        <p className={styles.field}>
          a sum of Rupees <span className={styles.filled}>{amountToWords(row.amount)}</span>
        </p>

        <div className={styles.footer}>
          <div className={styles.amountBox}>
            ₹ <span className={styles.filled}>{row.amount.toLocaleString("en-IN")}</span>
          </div>
          <div className={styles.signature}>Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}
