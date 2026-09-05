import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SevaModel } from "@/models/Seva";
import { toSevaDTO } from "@/lib/dto";
import { SevaManager } from "@/components/seva-manager";

export const dynamic = "force-dynamic";

export default async function SevasPage() {
  await requireAdmin("/sevas");
  await connectToDatabase();
  const sevas = await SevaModel.find().sort({ order: 1, createdAt: 1 });

  return <SevaManager sevas={sevas.map(toSevaDTO)} />;
}
