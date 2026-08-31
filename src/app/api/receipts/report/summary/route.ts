import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { getOrCreateSettings } from "@/lib/settings";
import { formatBusinessDate } from "@/lib/date";
import {
  buildReportDocument,
  escapeHtml,
  formatReportAmount,
  groupReceiptsByDate,
  renderHtmlToPdf,
  reportPdfResponse,
  resolveReportPeriod,
} from "@/lib/pdf-report";

type SevaTotal = { name: string; qty: number; amount: number };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = resolveReportPeriod(searchParams);
  if ("error" in period) {
    return new Response(period.error, { status: 400 });
  }

  await connectToDatabase();

  const [receipts, settings] = await Promise.all([
    ReceiptModel.find(period.query).sort({ businessDate: 1, receiptNo: 1 }),
    getOrCreateSettings(),
  ]);

  const groupsByDate = groupReceiptsByDate(receipts);

  let rowsHtml = "";
  let grandTotal = 0;

  for (const [businessDate, group] of groupsByDate) {
    const gbns = group.map((r) => r.receiptNo);
    const startGbn = Math.min(...gbns);
    const endGbn = Math.max(...gbns);
    const dayTotal = group.reduce((sum, r) => sum + r.total, 0);
    grandTotal += dayTotal;

    const sevaTotals = new Map<string, SevaTotal>();
    for (const receipt of group) {
      for (const item of receipt.items) {
        const key = item.sevaId.toString();
        const existing = sevaTotals.get(key);
        if (existing) {
          existing.qty += item.quantity;
          existing.amount += item.amount;
        } else {
          sevaTotals.set(key, { name: item.sevaName, qty: item.quantity, amount: item.amount });
        }
      }
    }

    const sortedSevas = [...sevaTotals.values()].sort((a, b) => a.name.localeCompare(b.name));

    rowsHtml += `<tr class="group-header">
      <td>${escapeHtml(`${formatBusinessDate(businessDate)}   R.No ${startGbn} - ${endGbn}`)}</td>
      <td></td>
      <td></td>
    </tr>`;

    for (const seva of sortedSevas) {
      rowsHtml += `<tr>
        <td>${escapeHtml(seva.name)}</td>
        <td class="qty">${seva.qty}</td>
        <td class="amount">${formatReportAmount(seva.amount)}</td>
      </tr>`;
    }

    rowsHtml += `<tr class="total">
      <td>Total</td>
      <td></td>
      <td class="amount">${formatReportAmount(dayTotal)}</td>
    </tr>`;
  }

  rowsHtml += `<tr class="grand-total">
    <td>GRAND TOTAL</td>
    <td></td>
    <td class="amount">${formatReportAmount(grandTotal)}</td>
  </tr>`;

  const html = buildReportDocument({
    templeSettings: { name: settings.name, place: settings.place, phone: settings.phone },
    title: period.title,
    columns: [
      { label: "NAME" },
      { label: "QTY", align: "center", width: "15%" },
      { label: "AMOUNT", align: "right", width: "20%" },
    ],
    rowsHtml,
  });

  const buffer = await renderHtmlToPdf(html);
  return reportPdfResponse(buffer, `seva-report-${period.filenameSuffix}.pdf`);
}
