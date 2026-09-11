import { formatCurrency } from "@/lib/format";
import { formatBusinessDate, formatReceiptDate, formatReceiptTime } from "@/lib/date";
import type { TempleHeaderDTO } from "@/lib/dto";
import type { KanikeThermalReport } from "@/lib/kanike-thermal-report";
import styles from "./receipt-print-view.module.css";

export function KanikeThermalReportDocument({
  report,
  templeSettings,
  generatedAt,
}: {
  report: KanikeThermalReport;
  templeSettings: TempleHeaderDTO;
  generatedAt: Date;
}) {
  return (
    <div className={styles.receipt}>
      <div className={styles.center}>
        <p>{templeSettings.name},</p>
        <p>{templeSettings.place}</p>
        <p>Mob: {templeSettings.phone}</p>
      </div>

      <div className={styles.separator} />

      <div className={styles.center}>
        <p>
          {formatReceiptDate(generatedAt)} {formatReceiptTime(generatedAt)}
        </p>
      </div>

      <div className={styles.separator} />

      <div className={`${styles.row} ${styles.tableHeader}`}>
        <span className={styles.item}>ITEM</span>
        <span className={styles.amount}>PRICE</span>
        <span className={styles.amount}>TOTAL</span>
      </div>

      <div className={styles.separatorThin} />

      {report.groups.map((group) => (
        <div key={group.businessDate}>
          <p className={styles.groupDate}>{formatBusinessDate(group.businessDate)}</p>

          {group.items.map((item) => (
            <div key={item.name} className={styles.row}>
              <span className={`${styles.item} ${styles.itemName}`}>{item.name}</span>
              <span className={styles.amount}>{formatCurrency(item.price)}</span>
              <span className={styles.amount}>{formatCurrency(item.total)}</span>
            </div>
          ))}

          <div className={`${styles.row} ${styles.total}`}>
            <span className={styles.item}>TOTAL</span>
            <span className={styles.amount} />
            <span className={styles.amount}>{formatCurrency(group.dayTotal)}</span>
          </div>
        </div>
      ))}

      <div className={styles.separator} />

      <div className={`${styles.row} ${styles.total}`}>
        <span className={styles.item}>GRAND TOTAL</span>
        <span className={styles.amount} />
        <span className={styles.amount}>{formatCurrency(report.grandTotal)}</span>
      </div>
    </div>
  );
}
