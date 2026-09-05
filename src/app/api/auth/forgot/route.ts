import { createHash, randomInt } from "node:crypto";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendOtpEmail } from "@/lib/email";
import { OTP_EXPIRY_MS, OtpModel } from "@/models/Otp";
import { UserModel } from "@/models/User";

const FORGOT_RATE_LIMIT = 3;
const FORGOT_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(email)) {
    // Don't leak validation: respond the same way as success.
    return NextResponse.json({ ok: true });
  }

  const rateKey = `forgot:${email}`;
  const rate = checkRateLimit(rateKey, FORGOT_RATE_LIMIT, FORGOT_WINDOW_MS);
  if (!rate.ok) {
    return NextResponse.json({ ok: true });
  }

  await connectToDatabase();
  const user = await UserModel.findOne({ email, active: true });
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const code = generateCode();
  await OtpModel.create({
    email,
    codeHash: hashOtp(code),
    purpose: "reset",
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    attempts: 0,
  });

  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    console.error(`[forgot] Failed to send OTP email to ${email}:`, err);
    // Still return 200 to the user (we don't want to leak email-send failures).
  }

  return NextResponse.json({ ok: true });
}
