import mongoose, { Schema, type InferSchemaType } from "mongoose";

export type UserRole = "admin" | "user";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], required: true, default: "user" },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ??
  mongoose.model<User>("User", UserSchema);
