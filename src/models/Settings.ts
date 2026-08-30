import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const SETTINGS_DOC_ID = "temple";

const SettingsSchema = new Schema(
  {
    _id: { type: String, default: SETTINGS_DOC_ID },
    name: { type: String, required: true, trim: true },
    place: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type Settings = InferSchemaType<typeof SettingsSchema>;

export const SettingsModel =
  (mongoose.models.Settings as mongoose.Model<Settings>) ??
  mongoose.model<Settings>("Settings", SettingsSchema);
