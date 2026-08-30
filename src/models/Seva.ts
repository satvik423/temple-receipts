import mongoose, { Schema, type InferSchemaType } from "mongoose";

const SevaSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: null, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type Seva = InferSchemaType<typeof SevaSchema> & { _id: mongoose.Types.ObjectId };

export const SevaModel =
  (mongoose.models.Seva as mongoose.Model<Seva>) ?? mongoose.model<Seva>("Seva", SevaSchema);
