import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SevaModel } from "@/models/Seva";
import { toSevaDTO } from "@/lib/dto";
import { getBusinessDate } from "@/lib/date";
import { getOrCreateSettings } from "@/lib/settings";
import { KanikeShell } from "@/components/kanike-shell";
import { KanikeData } from "@/components/kanike-data";
import { TableSkeleton } from "@/components/table-skeleton";

export const dynamic = "force-dynamic";

const BUSINESS_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function KanikePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireUser("/kanike");

  const params = await searchParams;
  const today = getBusinessDate();
  const date = params.date && BUSINESS_DATE_PATTERN.test(params.date) ? params.date : today;

  await connectToDatabase();

  const [kanikeTypes, settings] = await Promise.all([
    SevaModel.find({ active: true, category: "kanike" }).sort({ order: 1, createdAt: 1 }),
    getOrCreateSettings(),
  ]);

  const kanikeTypeDTOs = kanikeTypes.map(toSevaDTO);
  const templeSettings = {
    name: settings.name,
    place: settings.place,
    phone: settings.phone,
    upiId: settings.upiId ?? undefined,
  };

  return (
    <KanikeShell
      kanikeTypes={kanikeTypeDTOs}
      date={date}
      today={today}
      templeSettings={templeSettings}
    >
      <Suspense key={date} fallback={<TableSkeleton />}>
        <KanikeData date={date} kanikeTypes={kanikeTypeDTOs} />
      </Suspense>
    </KanikeShell>
  );
}
