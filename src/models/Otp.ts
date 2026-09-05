import mongoose, { Schema, type InferSchemaType } from "mongoose";

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes

const OtpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["reset"], required: true, default: "reset" },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index — Mongo auto-deletes documents once `expiresAt` passes.
      // expireAfterSeconds: 0 means "delete when this Date is in the past".
    },
    attempts: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type Otp = InferSchemaType<typeof OtpSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const OtpModel =
  (mongoose.models.Otp as mongoose.Model<Otp>) ?? mongoose.model<Otp>("Otp", OtpSchema);

export const OTP_EXPIRY_MS = OTP_TTL_SECONDS * 1000;
