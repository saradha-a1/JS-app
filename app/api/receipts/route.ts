export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Receipt from '@/lib/models/Receipt';
import Customer from '@/lib/models/Customer';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const filter = session.role === 'admin' ? {} : { created_by: session.userId };
  const receipts = await Receipt.find(filter).sort({ createdAt: -1 }).lean();
  const customers = await Customer.find({}, '_id first_name last_name').lean();
  const custMap: Record<string, string> = {};
  customers.forEach((c: any) => { custMap[c._id.toString()] = `${c.first_name} ${c.last_name || ''}`.trim(); });
  const result = receipts.map((r: any) => ({ ...r, customer_name: custMap[r.customer_id] || 'Unknown' }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const body = await req.json();
  const doc = await Receipt.create({ ...body, created_by: session.userId });
  return NextResponse.json(doc, { status: 201 });
}
