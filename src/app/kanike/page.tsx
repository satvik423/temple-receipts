import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SevaModel } from "@/models/Seva";
import { toSevaDTO } from "@/lib/dto";
import { getBusinessDate } from "@/lib/date";
import { getOrCreateSettings } from "@/lib/settings";
import { KanikeShell } from "@/components/kanike-shell";

export const dynamic = "force-dynamic";

export default async function KanikePage() {
  await requireUser("/kanike");

  const today = getBusinessDate();

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
    <KanikeShell kanikeTypes={kanikeTypeDTOs} today={today} templeSettings={templeSettings} />
  );
}
