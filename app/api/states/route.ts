import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import State from '@/lib/models/State';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!getSessionFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const data = await State.find().sort({ name: 1 }).lean();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!getSessionFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const { name } = await req.json();
  const doc = await State.create({ name });
  return NextResponse.json(doc, { status: 201 });
}
