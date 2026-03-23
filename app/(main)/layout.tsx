import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import MainLayoutClient from './MainLayoutClient';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return <MainLayoutClient userName={session.fullName || session.username} userRole={session.role}>{children}</MainLayoutClient>;
}
