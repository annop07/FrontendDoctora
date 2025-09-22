"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for success message from registration
    const message = searchParams.get('message');
    if (message) {
      const decodedMessage = decodeURIComponent(message);
      setSuccessMessage(decodedMessage);
      
      // Clear the message from URL after showing it
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // Check if user is already logged in (after auth context loads)
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [searchParams, router, isAuthenticated, authLoading, user]);

  // Show loading while auth context is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null); // Clear success message on login attempt
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      // Use the AuthContext login method which handles both token and user state
      const user = await login(email, password);
      
      // Role-based redirect after successful login
      if (user && user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 pb-20">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500" />
            <div className="font-semibold text-lg">Doctora</div>
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-slate-500">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          {successMessage && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
              {successMessage}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-sky-700 font-medium hover:underline">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}