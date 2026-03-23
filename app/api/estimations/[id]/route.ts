import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Estimation from '@/lib/models/Estimation';
import { getSessionFromRequest } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getSessionFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const { id } = await params;
  const body = await req.json();
  const doc = await Estimation.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(doc);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getSessionFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const { id } = await params;
  await Estimation.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
