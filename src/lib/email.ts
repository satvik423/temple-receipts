import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null | undefined;
let cachedFrom: string | null = null;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) {
    transporter = null;
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER ?? "";
  const password = process.env.SMTP_PASSWORD ?? "";

  const from = process.env.SMTP_FROM || (user ? `Temple Receipts <${user}>` : "Temple Receipts <noreply@example.com>");
  cachedFrom = from;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass: password } : undefined,
  });
  return transporter;
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const subject = "Your password reset code";
  const text = `Your password reset code is ${code}. It expires in 10 minutes.`;
  const html = `<p>Your password reset code is <strong>${code}</strong>.</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`;

  const t = getTransporter();
  if (!t) {
    console.warn(
      "[email] SMTP_HOST is not set. Falling back to console logging. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD to send real emails.",
    );
    console.log(`[email] OTP for ${to}: ${code}`);
    return;
  }

  try {
    await t.sendMail({
      from: cachedFrom ?? undefined,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error(`[email] Failed to send OTP to ${to}:`, err);
    // Re-throw so the caller can decide. In practice, the forgot endpoint logs and
    // still returns 200 to the user, but the failure is visible in server logs.
    throw err;
  }
}
