export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Customer from '@/lib/models/Customer';
import Order from '@/lib/models/Order';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const [adminCount, userCount, totalCustomers, orders] = await Promise.all([
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'user' }),
    Customer.countDocuments(),
    Order.find({}, 'status').lean(),
  ]);

  const shipped = orders.filter((o: any) => o.status === 'shipped').length;
  const delivered = orders.filter((o: any) => o.status === 'delivered').length;
  const processing = orders.filter((o: any) => o.status === 'processing').length;

  return NextResponse.json({ adminCount, userCount, totalUsers: adminCount + userCount, totalCustomers, totalOrders: orders.length, shipped, delivered, processing });
}
