export type RevenueRange = "daily" | "weekly" | "monthly" | "yearly";

export const REVENUE_RANGES: RevenueRange[] = ["daily", "weekly", "monthly", "yearly"];

export const RANGE_LABELS: Record<RevenueRange, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};
