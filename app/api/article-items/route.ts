import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ArticleItem from '@/lib/models/ArticleItem';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!getSessionFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const data = await ArticleItem.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!getSessionFromRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const { name } = await req.json();
  const doc = await ArticleItem.create({ name, status: 'active' });
  return NextResponse.json(doc, { status: 201 });
}
