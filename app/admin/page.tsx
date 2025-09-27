// app/admin/page.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import AdminDashboard from '@/components/AdminDashboard';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user } = useAuth();
  const { isLoading } = useProtectedRoute();
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin after auth loads
    if (!isLoading && user && user.role !== 'ADMIN') {
      // Redirect non-admin users
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to access this page.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render admin dashboard for admin users
  return <AdminDashboard />;
}