import { Suspense } from "react";
import { getBusinessDate } from "@/lib/date";
import { getOrCreateSettings } from "@/lib/settings";
import { HistoryShell } from "@/components/history-shell";
import { HistoryData } from "@/components/history-data";
import { TableSkeleton } from "@/components/table-skeleton";

export const dynamic = "force-dynamic";

const BUSINESS_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const today = getBusinessDate();
  const date = params.date && BUSINESS_DATE_PATTERN.test(params.date) ? params.date : today;
  const settings = await getOrCreateSettings();

  return (
    <HistoryShell
      date={date}
      today={today}
      templeSettings={{ name: settings.name, place: settings.place, phone: settings.phone }}
    >
      <Suspense key={date} fallback={<TableSkeleton />}>
        <HistoryData date={date} />
      </Suspense>
    </HistoryShell>
  );
}
