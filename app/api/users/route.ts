export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await dbConnect();
  const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await dbConnect();
  const { username, email, password, full_name, role } = await req.json();
  if (!username || !email || !password) return NextResponse.json({ error: 'username, email and password are required' }, { status: 400 });
  const exists = await User.findOne({ $or: [{ username }, { email }] });
  if (exists) return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashed, full_name: full_name || '', role: role || 'user', status: 'active' });
  const { password: _p, ...safe } = user.toObject();
  return NextResponse.json(safe, { status: 201 });
}
