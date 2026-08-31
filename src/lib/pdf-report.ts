import pdfMake from "pdfmake/build/pdfmake.js";
import vfs from "pdfmake/build/vfs_fonts.js";
import type { Content, CustomTableLayout, TDocumentDefinitions } from "pdfmake/interfaces";

import { MONTH_NAMES } from "@/lib/date";
import type { Receipt } from "@/models/Receipt";

pdfMake.addVirtualFileSystem(vfs);

export const REPORT_PAGE_WIDTH = 515;

export function formatReportAmount(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export type ReportPeriod = {
  query: Record<string, unknown>;
  title: string;
  filenameSuffix: string;
};

export function resolveReportPeriod(
  searchParams: URLSearchParams,
): ReportPeriod | { error: string } {
  const type = searchParams.get("type") === "full" ? "full" : "month";

  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;

  if (!Number.isInteger(year) || month < 1 || month > 12) {
    return { error: "Invalid year or month" };
  }

  if (type === "full") {
    return { query: {}, title: "Full Report", filenameSuffix: "full" };
  }

  const mm = String(month).padStart(2, "0");
  const from = `${year}-${mm}-01`;
  const to = `${year}-${mm}-${String(daysInMonth(year, month)).padStart(2, "0")}`;

  return {
    query: { businessDate: { $gte: from, $lte: to } },
    title: `${MONTH_NAMES[month - 1]} month - ${year}`,
    filenameSuffix: `${year}-${mm}`,
  };
}

export function groupReceiptsByDate(receipts: Receipt[]): Map<string, Receipt[]> {
  const groups = new Map<string, Receipt[]>();
  for (const receipt of receipts) {
    const list = groups.get(receipt.businessDate) ?? [];
    list.push(receipt);
    groups.set(receipt.businessDate, list);
  }
  return groups;
}

export function buildReportHeader(
  settings: { name: string; place: string; phone: string },
  title: string,
): Content[] {
  return [
    {
      stack: [
        { text: `${settings.name},`, bold: true },
        { text: settings.place, bold: true },
        { text: `Mob: ${settings.phone}`, bold: true },
      ],
      alignment: "center",
    },
    { canvas: [{ type: "line", x1: 0, y1: 6, x2: REPORT_PAGE_WIDTH, y2: 6, lineWidth: 1 }] },
    { text: title, bold: true, alignment: "center", margin: [0, 8, 0, 8] },
    {
      canvas: [{ type: "line", x1: 0, y1: 0, x2: REPORT_PAGE_WIDTH, y2: 0, lineWidth: 1 }],
      margin: [0, 0, 0, 10],
    },
  ];
}

export const reportTableLayout: CustomTableLayout = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => "#999999",
  vLineColor: () => "#999999",
  paddingTop: () => 4,
  paddingBottom: () => 4,
  paddingLeft: () => 4,
  paddingRight: () => 4,
};

export function buildReportDocDefinition(content: Content[]): TDocumentDefinitions {
  return {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 50],
    defaultStyle: { fontSize: 9 },
    content,
    footer: (currentPage, pageCount) => ({
      text: `${currentPage} of ${pageCount}`,
      alignment: "center",
      fontSize: 9,
      margin: [0, 10, 0, 0],
    }),
  };
}

export async function renderReportPdf(docDefinition: TDocumentDefinitions): Promise<Buffer> {
  return pdfMake.createPdf(docDefinition).getBuffer();
}

export function reportPdfResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
