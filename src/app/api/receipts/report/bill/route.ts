import type { Content } from "pdfmake/interfaces";

import { connectToDatabase } from "@/lib/mongodb";
import { ReceiptModel } from "@/models/Receipt";
import { getOrCreateSettings } from "@/lib/settings";
import { formatBusinessDate } from "@/lib/date";
import {
  buildReportDocDefinition,
  buildReportHeader,
  formatReportAmount,
  groupReceiptsByDate,
  renderReportPdf,
  reportPdfResponse,
  reportTableLayout,
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

  const tableBody: Content[][] = [
    [
      { text: "GBN", bold: true },
      { text: "DBN", bold: true },
      { text: "NAME", bold: true },
      { text: "QTY", bold: true, alignment: "right" },
      { text: "AMOUNT", bold: true, alignment: "right" },
    ],
  ];

  let grandTotal = 0;

  for (const [businessDate, group] of groupsByDate) {
    const gbns = group.map((r) => r.receiptNo);
    const startGbn = Math.min(...gbns);
    const endGbn = Math.max(...gbns);
    const dayTotal = group.reduce((sum, r) => sum + r.total, 0);
    grandTotal += dayTotal;

    tableBody.push([
      { text: "", fillColor: "#f0f0f0" },
      { text: "", fillColor: "#f0f0f0" },
      {
        text: `${formatBusinessDate(businessDate)}   R.No ${startGbn} - ${endGbn}`,
        bold: true,
        fillColor: "#f0f0f0",
      },
      { text: "", fillColor: "#f0f0f0" },
      { text: "", fillColor: "#f0f0f0" },
    ]);

    for (const receipt of group) {
      for (const item of receipt.items) {
        tableBody.push([
          String(receipt.receiptNo),
          String(receipt.dbn),
          item.sevaName,
          { text: String(item.quantity), alignment: "right" },
          { text: formatReportAmount(item.amount), alignment: "right" },
        ]);
      }
    }

    tableBody.push([
      "",
      "",
      { text: "TOTAL", bold: true },
      "",
      { text: formatReportAmount(dayTotal), bold: true, alignment: "right" },
    ]);
  }

  tableBody.push([
    "",
    "",
    { text: "GRAND TOTAL", bold: true, fontSize: 11 },
    "",
    { text: formatReportAmount(grandTotal), bold: true, fontSize: 11, alignment: "right" },
  ]);

  const docDefinition = buildReportDocDefinition([
    ...buildReportHeader(settings, period.title),
    {
      table: {
        headerRows: 1,
        widths: [45, 40, "*", 40, 75],
        body: tableBody,
      },
      layout: reportTableLayout,
    },
  ]);

  const buffer = await renderReportPdf(docDefinition);
  return reportPdfResponse(buffer, `bill-report-${period.filenameSuffix}.pdf`);
}
