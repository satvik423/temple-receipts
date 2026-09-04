import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { toUserDTO } from "@/lib/dto";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, type User, type UserRole } from "@/models/User";

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

async function countActiveAdmins(): Promise<number> {
  return UserModel.countDocuments({ role: "admin", active: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const current = await requireAdmin();
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  let changed = false;

  if (typeof body?.password === "string" && body.password.length > 0) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    user.passwordHash = await bcrypt.hash(body.password, 10);
    changed = true;
  }

  if (body && (body.role === "admin" || body.role === "user")) {
    if (user.role === "admin" && body.role === "user") {
      if (user._id.toString() === current.id) {
        return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
      }
      const remaining = await countActiveAdmins();
      if (remaining <= 1) {
        return NextResponse.json({ error: "Cannot demote the last active admin" }, { status: 400 });
      }
    }
    if (user.role !== body.role) {
      user.role = body.role as UserRole;
      changed = true;
    }
  }

  if (typeof body?.active === "boolean" && body.active !== user.active) {
    if (user.role === "admin" && user.active && body.active === false) {
      if (user._id.toString() === current.id) {
        return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 });
      }
      const remaining = await countActiveAdmins();
      if (remaining <= 1) {
        return NextResponse.json({ error: "Cannot deactivate the last active admin" }, { status: 400 });
      }
    }
    user.active = body.active;
    changed = true;
  }

  if (changed) {
    await user.save();
    console.info(`[users] ${current.email} updated user ${user.email}`);
  }

  return NextResponse.json({ user: toUserDTO(user as unknown as User) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const current = await requireAdmin();
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  await connectToDatabase();
  const user = await UserModel.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user._id.toString() === current.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }
  if (user.role === "admin") {
    const remaining = await countActiveAdmins();
    if (remaining <= 1) {
      return NextResponse.json({ error: "Cannot delete the last active admin" }, { status: 400 });
    }
  }

  await UserModel.deleteOne({ _id: id });
  console.info(`[users] ${current.email} deleted user ${user.email}`);
  return NextResponse.json({ ok: true });
}
