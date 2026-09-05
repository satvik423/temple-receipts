import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { toUserDTO } from "@/lib/dto";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, type User, type UserRole } from "@/models/User";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  await requireAdmin();
  await connectToDatabase();
  const users = await UserModel.find().sort({ createdAt: 1 }).lean<User[]>();
  return NextResponse.json({ users: users.map(toUserDTO) });
}

export async function POST(request: Request) {
  const current = await requireAdmin();
  await connectToDatabase();

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role: UserRole = body?.role === "admin" ? "admin" : "user";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await UserModel.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ email, passwordHash, role, active: true });
  console.info(`[users] ${current.email} created user ${email} (${role})`);
  return NextResponse.json({ user: toUserDTO(user) }, { status: 201 });
}
