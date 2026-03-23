'use client';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm text-center">
        <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Forgot Password</h2>
        <p className="text-gray-600 mb-6">Contact your administrator to reset your password.</p>
        <button onClick={() => router.push('/login')} className="w-full py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4a6f]">
          Back to Login
        </button>
      </div>
    </div>
  );
}
