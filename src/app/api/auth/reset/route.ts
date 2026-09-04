import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { resetRateLimit } from "@/lib/rate-limit";
import { OtpModel } from "@/models/Otp";
import { UserModel } from "@/models/User";

const MAX_OTP_ATTEMPTS = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = /^\d{6}$/;

function getPepper(): string {
  const pepper = process.env.SESSION_SECRET;
  if (!pepper) {
    throw new Error("Missing SESSION_SECRET environment variable");
  }
  return pepper;
}

function hashOtp(code: string): string {
  return createHash("sha256").update(`${getPepper()}:${code}`).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!CODE_PATTERN.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  await connectToDatabase();

  const otp = await OtpModel.findOne({ email, purpose: "reset" }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Code is invalid or expired" }, { status: 401 });
  }
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    await OtpModel.deleteMany({ email, purpose: "reset" });
    return NextResponse.json(
      { error: "Too many attempts. Request a new code." },
      { status: 429 },
    );
  }

  const expected = hashOtp(code);
  if (expected !== otp.codeHash) {
    otp.attempts += 1;
    await otp.save();
    return NextResponse.json({ error: "Code is invalid or expired" }, { status: 401 });
  }

  const user = await UserModel.findOne({ email, active: true });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  await OtpModel.deleteMany({ email, purpose: "reset" });
  resetRateLimit(`forgot:${email}`);

  return NextResponse.json({ ok: true });
}
