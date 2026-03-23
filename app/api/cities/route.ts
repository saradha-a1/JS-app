export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import City from '@/lib/models/City';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!getSessionFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const data = await City.find().sort({ name: 1 }).lean();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!getSessionFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const { name, state_id } = await req.json();
  const doc = await City.create({ name, state_id: state_id || '' });
  return NextResponse.json(doc, { status: 201 });
}
