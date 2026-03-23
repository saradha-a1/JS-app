import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import City from '@/lib/models/City';
import { getSessionFromRequest } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getSessionFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const { id } = await params;
  await City.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
