import { cache } from "react";
import { connectToDatabase } from "@/lib/mongodb";
import { SettingsModel, SETTINGS_DOC_ID, type Settings } from "@/models/Settings";

const DEFAULT_SETTINGS = {
  name: "Shree Guru Raghavendra Swamy Vrindavanam",
  place: "Tellar Road, Karkala - 574104",
  phone: "9448003161",
};

export const getOrCreateSettings = cache(async (): Promise<Settings> => {
  await connectToDatabase();
  const settings = await SettingsModel.findByIdAndUpdate(
    SETTINGS_DOC_ID,
    { $setOnInsert: DEFAULT_SETTINGS },
    { returnDocument: "after", upsert: true },
  );
  return settings;
});
