import { ReceiptModel } from "@/models/Receipt";
import { getBusinessDate } from "@/lib/date";
import { RANGE_LABELS, REVENUE_RANGES, type RevenueRange } from "@/lib/analytics-shared";

export { RANGE_LABELS, REVENUE_RANGES };
export type { RevenueRange };

export type RevenuePoint = { label: string; total: number };
export type SevaBreakdownEntry = { name: string; total: number; quantity: number };
export type PeriodStat = { label: string; total: number; count: number };

const RANGE_WINDOW_DAYS: Record<RevenueRange, number> = {
  daily: 14,
  weekly: 56,
  monthly: 400,
  yearly: 1900,
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function addDays(businessDate: string, delta: number): string {
  const date = new Date(`${businessDate}T00:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + delta);
  return getBusinessDate(date);
}

function getIsoWeekStart(businessDate: string): string {
  const date = new Date(`${businessDate}T00:00:00+05:30`);
  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - diff);
  return getBusinessDate(date);
}

export function getRangeStartDate(range: RevenueRange, today: string): string {
  return addDays(today, -(RANGE_WINDOW_DAYS[range] - 1));
}

const RANGE_STEP_UNITS: Record<RevenueRange, number> = {
  daily: 14,
  weekly: 56,
  monthly: 12,
  yearly: 5,
};

export function getAnchorDate(range: RevenueRange, today: string, offset: number): string {
  if (offset <= 0) return today;

  if (range === "daily" || range === "weekly") {
    return addDays(today, -RANGE_STEP_UNITS[range] * offset);
  }

  if (range === "monthly") {
    const [year, month] = today.split("-").map(Number);
    const monthIndex = year * 12 + (month - 1) - RANGE_STEP_UNITS.monthly * offset;
    const newYear = Math.floor(monthIndex / 12);
    const newMonth = (monthIndex % 12) + 1;
    return `${newYear}-${String(newMonth).padStart(2, "0")}-01`;
  }

  const year = Number(today.slice(0, 4)) - RANGE_STEP_UNITS.yearly * offset;
  return `${year}-01-01`;
}

async function getDailyTotals(
  startDate: string,
  endDate: string,
): Promise<Map<string, number>> {
  const rows = await ReceiptModel.aggregate([
    { $match: { businessDate: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: "$businessDate", total: { $sum: "$total" } } },
  ]);
  return new Map(rows.map((row) => [row._id as string, row.total as number]));
}

export async function getRevenueSeries(
  range: RevenueRange,
  today: string,
): Promise<RevenuePoint[]> {
  const startDate = getRangeStartDate(range, today);
  const dailyTotals = await getDailyTotals(startDate, today);

  if (range === "daily") {
    const points: RevenuePoint[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = addDays(today, -i);
      const [, month, day] = date.split("-");
      points.push({ label: `${day}/${month}`, total: dailyTotals.get(date) ?? 0 });
    }
    return points;
  }

  if (range === "weekly") {
    const points: RevenuePoint[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = addDays(today, -(w * 7 + 6));
      let sum = 0;
      for (let i = 0; i < 7; i++) {
        sum += dailyTotals.get(addDays(weekStart, i)) ?? 0;
      }
      const [, month, day] = weekStart.split("-");
      points.push({ label: `${day}/${month}`, total: sum });
    }
    return points;
  }

  if (range === "monthly") {
    const monthTotals = new Map<string, number>();
    for (const [date, total] of dailyTotals) {
      const yearMonth = date.slice(0, 7);
      monthTotals.set(yearMonth, (monthTotals.get(yearMonth) ?? 0) + total);
    }

    const [todayYear, todayMonth] = today.split("-").map(Number);
    const points: RevenuePoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthIndex = todayYear * 12 + (todayMonth - 1) - i;
      const year = Math.floor(monthIndex / 12);
      const month = monthIndex % 12;
      const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
      points.push({
        label: `${MONTH_LABELS[month]} '${String(year).slice(2)}`,
        total: monthTotals.get(yearMonth) ?? 0,
      });
    }
    return points;
  }

  const yearTotals = new Map<string, number>();
  for (const [date, total] of dailyTotals) {
    const year = date.slice(0, 4);
    yearTotals.set(year, (yearTotals.get(year) ?? 0) + total);
  }

  const currentYear = Number(today.slice(0, 4));
  const points: RevenuePoint[] = [];
  for (let i = 4; i >= 0; i--) {
    const year = String(currentYear - i);
    points.push({ label: year, total: yearTotals.get(year) ?? 0 });
  }
  return points;
}

export type SinglePeriod = { start: string; end: string; label: string };

function lastDayOfMonth(year: number, month: number): string {
  // day 0 of the next month is the last day of this one
  return getBusinessDate(new Date(Date.UTC(year, month, 0)));
}

/** Bounds + label for exactly one daily/weekly/monthly/yearly bucket, `offset` buckets back from today. */
export function getSinglePeriod(range: RevenueRange, today: string, offset: number): SinglePeriod {
  if (range === "daily") {
    const date = addDays(today, -offset);
    const [, month, day] = date.split("-");
    return { start: date, end: date, label: `${day}/${month}` };
  }

  if (range === "weekly") {
    const start = addDays(getIsoWeekStart(today), -7 * offset);
    const end = addDays(start, 6);
    const [, sm, sd] = start.split("-");
    const [, em, ed] = end.split("-");
    return { start, end, label: `${sd}/${sm} – ${ed}/${em}` };
  }

  if (range === "monthly") {
    const [year, month] = today.split("-").map(Number);
    const monthIndex = year * 12 + (month - 1) - offset;
    const y = Math.floor(monthIndex / 12);
    const m = (monthIndex % 12) + 1;
    return {
      start: `${y}-${String(m).padStart(2, "0")}-01`,
      end: lastDayOfMonth(y, m),
      label: `${MONTH_LABELS[m - 1]} ${y}`,
    };
  }

  const year = Number(today.slice(0, 4)) - offset;
  return { start: `${year}-01-01`, end: `${year}-12-31`, label: String(year) };
}

export async function getSevaBreakdown(
  startDate: string,
  endDate: string,
): Promise<SevaBreakdownEntry[]> {
  const rows = await ReceiptModel.aggregate([
    { $match: { businessDate: { $gte: startDate, $lte: endDate } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.sevaName",
        total: { $sum: "$items.amount" },
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { total: -1 } },
  ]);
  return rows.map((row) => ({ name: row._id as string, total: row.total, quantity: row.quantity }));
}

async function aggregatePeriod(start: string, end: string): Promise<{ total: number; count: number }> {
  const rows = await ReceiptModel.aggregate([
    { $match: { businessDate: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
  ]);
  return { total: rows[0]?.total ?? 0, count: rows[0]?.count ?? 0 };
}

export async function getPeriodStats(today: string): Promise<PeriodStat[]> {
  const startOfWeek = getIsoWeekStart(today);
  const startOfMonth = `${today.slice(0, 7)}-01`;
  const startOfYear = `${today.slice(0, 4)}-01-01`;

  const [todayStat, weekStat, monthStat, yearStat] = await Promise.all([
    aggregatePeriod(today, today),
    aggregatePeriod(startOfWeek, today),
    aggregatePeriod(startOfMonth, today),
    aggregatePeriod(startOfYear, today),
  ]);

  return [
    { label: "Today", ...todayStat },
    { label: "This Week", ...weekStat },
    { label: "This Month", ...monthStat },
    { label: "This Year", ...yearStat },
  ];
}
