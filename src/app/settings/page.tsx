import { getOrCreateSettings } from "@/lib/settings";
import { connectToDatabase } from "@/lib/mongodb";
import { getSequenceValue } from "@/models/Counter";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await connectToDatabase();
  const [settings, currentGbn] = await Promise.all([
    getOrCreateSettings(),
    getSequenceValue("receiptNo"),
  ]);

  return (
    <SettingsForm
      initialValues={{
        name: settings.name,
        place: settings.place,
        phone: settings.phone,
      }}
      currentGbn={currentGbn}
    />
  );
}
