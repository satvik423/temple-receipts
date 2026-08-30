const TEMPLE_TIME_ZONE = "Asia/Kolkata";

export function getBusinessDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TEMPLE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatReceiptDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TEMPLE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatReceiptTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TEMPLE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatBusinessDate(businessDate: string): string {
  return formatReceiptDate(new Date(`${businessDate}T00:00:00+05:30`));
}
