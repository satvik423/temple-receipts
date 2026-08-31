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

    rowsHtml += `<tr class="group-header">
      <td></td>
      <td></td>
      <td>${escapeHtml(`${formatBusinessDate(businessDate)}   R.No ${startGbn} - ${endGbn}`)}</td>
      <td></td>
      <td></td>
    </tr>`;

    for (const receipt of group) {
      for (const item of receipt.items) {
        rowsHtml += `<tr>
          <td>${receipt.receiptNo}</td>
          <td>${receipt.dbn}</td>
          <td>${escapeHtml(item.sevaName)}</td>
          <td class="qty">${item.quantity}</td>
          <td class="amount">${formatReportAmount(item.amount)}</td>
        </tr>`;
      }
    }

    rowsHtml += `<tr class="total">
      <td></td>
      <td></td>
      <td>TOTAL</td>
      <td></td>
      <td class="amount">${formatReportAmount(dayTotal)}</td>
    </tr>`;
  }

  rowsHtml += `<tr class="grand-total">
    <td></td>
    <td></td>
    <td>GRAND TOTAL</td>
    <td></td>
    <td class="amount">${formatReportAmount(grandTotal)}</td>
  </tr>`;

  const html = buildReportDocument({
    templeSettings: { name: settings.name, place: settings.place, phone: settings.phone },
    title: period.title,
    columns: [
      { label: "GBN", width: "12%" },
      { label: "DBN", width: "12%" },
      { label: "NAME" },
      { label: "QTY", align: "center", width: "10%" },
      { label: "AMOUNT", align: "right", width: "18%" },
    ],
    rowsHtml,
  });

  const buffer = await renderHtmlToPdf(html);
  return reportPdfResponse(buffer, `bill-report-${period.filenameSuffix}.pdf`);
}
