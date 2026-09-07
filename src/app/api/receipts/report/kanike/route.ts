import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { getOrCreateSettings } from "@/lib/settings";
import { formatBusinessDate } from "@/lib/date";
import { formatBhaktaDetail, toKanikeRowDTO, type KanikeRowDTO } from "@/lib/dto";
import {
  buildReportDocument,
  escapeHtml,
  formatReportAmount,
  groupReceiptsByDate,
  renderHtmlToPdf,
  reportPdfResponse,
  resolveReportPeriod,
} from "@/lib/pdf-report";

// Cold starts on Vercel download and launch a headless Chromium; give that room to finish.
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = resolveReportPeriod(searchParams);
  if ("error" in period) {
    return new Response(period.error, { status: 400 });
  }

  await connectToDatabase();

  const [receipts, settings] = await Promise.all([
    ReceiptModel.find({ ...period.query, "items.isKanike": true }).sort({
      businessDate: 1,
      receiptNo: 1,
    }),
    getOrCreateSettings(),
  ]);

  const groupsByDate = groupReceiptsByDate(receipts);

  let rowsHtml = "";
  let grandTotal = 0;

  for (const [businessDate, group] of groupsByDate) {
    const rows = group.map(toKanikeRowDTO).filter((row): row is KanikeRowDTO => row !== null);
    if (rows.length === 0) continue;

    const gbns = rows.map((r) => r.receiptNo);
    const startGbn = Math.min(...gbns);
    const endGbn = Math.max(...gbns);
    const dayTotal = rows.reduce((sum, r) => sum + r.amount, 0);
    grandTotal += dayTotal;

    rowsHtml += `<tr class="group-header">
      <td></td>
      <td></td>
      <td>${escapeHtml(`${formatBusinessDate(businessDate)}   R.No ${startGbn} - ${endGbn}`)}</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>`;

    for (const row of rows) {
      rowsHtml += `<tr>
        <td>${row.receiptNo}</td>
        <td>${row.dbn}</td>
        <td>${escapeHtml(row.sevaName)}</td>
        <td>${escapeHtml(formatBhaktaDetail(row))}</td>
        <td class="center">${row.isOnlinePay ? "Online" : "Cash"}</td>
        <td class="amount">${formatReportAmount(row.amount)}</td>
      </tr>`;
    }

    rowsHtml += `<tr class="total">
      <td></td>
      <td></td>
      <td>TOTAL</td>
      <td></td>
      <td></td>
      <td class="amount">${formatReportAmount(dayTotal)}</td>
    </tr>`;
  }

  rowsHtml += `<tr class="grand-total">
    <td></td>
    <td></td>
    <td>GRAND TOTAL</td>
    <td></td>
    <td></td>
    <td class="amount">${formatReportAmount(grandTotal)}</td>
  </tr>`;

  const html = buildReportDocument({
    templeSettings: { name: settings.name, place: settings.place, phone: settings.phone },
    title: `Kanike Report - ${period.title}`,
    columns: [
      { label: "GBN", width: "8%" },
      { label: "DBN", width: "8%" },
      { label: "KANIKE NAME", width: "16%" },
      { label: "BHAKTHA DETAIL", width: "40%" },
      { label: "PAYMENT", align: "center", width: "12%" },
      { label: "AMOUNT", align: "right", width: "16%" },
    ],
    rowsHtml,
  });

  const buffer = await renderHtmlToPdf(html);
  return reportPdfResponse(buffer, `kanike-report-${period.filenameSuffix}.pdf`);
}
