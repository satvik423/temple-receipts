import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SevaModel } from "@/models/Seva";
import { ReceiptModel } from "@/models/Receipt";
import { toSevaDTO, toKanikeRowDTO, type KanikeRowDTO } from "@/lib/dto";
import { getBusinessDate } from "@/lib/date";
import { getOrCreateSettings } from "@/lib/settings";
import { KanikeView } from "@/components/kanike-view";

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

  const [kanikeTypes, receipts, settings] = await Promise.all([
    SevaModel.find({ active: true, category: "kanike" }).sort({ order: 1, createdAt: 1 }),
    ReceiptModel.find({ businessDate: date, "items.isKanike": true }).sort({ receiptNo: -1 }),
    getOrCreateSettings(),
  ]);

  const rows = receipts
    .map(toKanikeRowDTO)
    .filter((row): row is KanikeRowDTO => row !== null);

  return (
    <KanikeView
      kanikeTypes={kanikeTypes.map(toSevaDTO)}
      rows={rows}
      date={date}
      today={today}
      templeSettings={{ name: settings.name, place: settings.place, phone: settings.phone }}
    />
  );
}
