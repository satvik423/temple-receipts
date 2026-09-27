import { MONTH_NAMES, formatBusinessDate } from "@/lib/date";
import type { Receipt } from "@/models/Receipt";

export type ReportPeriod = {
  query: Record<string, unknown>;
  title: string;
  filenameSuffix: string;
};

const BUSINESS_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidBusinessDate(value: string): boolean {
  if (!BUSINESS_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

export function resolveReportPeriod(
  searchParams: URLSearchParams,
): ReportPeriod | { error: string } {
  const rawType = searchParams.get("type");
  const type: "month" | "full" | "range" =
    rawType === "full" || rawType === "range" ? rawType : "month";

  if (type === "range") {
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    if (!isValidBusinessDate(from)) {
      return { error: "Invalid 'from' date" };
    }
    if (!isValidBusinessDate(to)) {
      return { error: "Invalid 'to' date" };
    }
    if (from > to) {
      return { error: "'from' must be on or before 'to'" };
    }
    return {
      query: { businessDate: { $gte: from, $lte: to } },
      title: `${formatBusinessDate(from)} to ${formatBusinessDate(to)}`,
      filenameSuffix: `${from}-to-${to}`,
    };
  }

  if (type === "full") {
    return { query: {}, title: "Full Report", filenameSuffix: "full" };
  }

  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;

  if (!Number.isInteger(year) || month < 1 || month > 12) {
    return { error: "Invalid year or month" };
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
