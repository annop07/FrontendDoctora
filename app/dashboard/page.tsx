// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/auth-context';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { isLoading } = useProtectedRoute();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-teal-500" />
              <span className="ml-2 text-xl font-semibold">Doctora</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">
                {user?.role}
              </span>
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg min-h-96 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard
              </h1>
              <p className="text-gray-600 mb-6">
                Welcome to your dashboard, {user?.firstName}!
              </p>
              
              {/* Role-specific content */}
              {user?.role === 'ADMIN' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Admin Features</h3>
                  <p className="text-blue-700 mb-3">Manage the entire healthcare system</p>
                  <Link
                    href="/admin"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Go to Admin Panel
                  </Link>
                </div>
              )}

              {user?.role === 'DOCTOR' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Doctor Features</h3>
                  <p className="text-green-700">Manage your practice and appointments</p>
                </div>
              )}

              {user?.role === 'PATIENT' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Patient Features</h3>
                  <p className="text-purple-700">Book appointments and manage your health</p>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500 space-y-1">
                <p>Email: {user?.email}</p>
                <p>Role: {user?.role}</p>
                <p>User ID: {user?.id}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}