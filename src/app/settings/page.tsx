import { getOrCreateSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getOrCreateSettings();

  return (
    <SettingsForm
      initialValues={{
        name: settings.name,
        place: settings.place,
        phone: settings.phone,
      }}
    />
  );
}
