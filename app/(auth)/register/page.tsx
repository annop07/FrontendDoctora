'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validatePasswords } from '@/utils/validatePass';
import { AuthService } from '@/lib/auth-service';
import type { RegisterRequest } from '@/types/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Live password validation
  const liveError = validatePasswords(password, confirm);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    // Final validation check
    if (liveError) {
      setError(liveError);
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const registerData: RegisterRequest = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        firstName: formData.get('first') as string,
        lastName: formData.get('last') as string,
      };

      console.log('Sending registration data:', registerData);
      await AuthService.register(registerData);
      
      // Registration successful, redirect to login
      router.push('/login?message=Registration successful! Please log in.');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed - check if backend is running');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur mt-10">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-500" />
          <div className="font-semibold text-lg">Doctora</div>
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-1 text-slate-500">Get faster and better healthcare</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">First name</label>
            <input
              name="first"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
            <input
              name="last"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            name="email"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
          <input
            type="password"
            name="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            required
            disabled={isLoading}
          />
        </div>

        {(liveError || error) && (
          <p className="text-sm text-red-600">
            {liveError || error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || !!liveError}
          className="mt-2 w-full rounded-lg bg-teal-600 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}