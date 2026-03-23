import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/lib/models/Customer';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const filter = session.role === 'admin' ? {} : { created_by: session.userId };
  const customers = await Customer.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const body = await req.json();
  const customer = await Customer.create({ ...body, created_by: session.userId });
  return NextResponse.json(customer, { status: 201 });
}
