'use client';

import { useFormStatus } from 'react-dom';
import { registerAction } from '@/utils/action';
import { useSearchParams } from 'next/navigation';
import { validatePasswords } from '@/utils/validatePass';
import { useState } from 'react';
import Link from 'next/link';

// import components
import Navbar from '@/components/Navbar';
import Banner from '@/components/Banner';
import Footer from '@/components/Footer';

function SubmitButton({ disabledExtra = false }: { disabledExtra?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabledExtra}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'กำลังสร้าง...' : 'สร้างบัญชีของฉัน'}
    </button>
  );
}

export default function RegisterPage() {
  const params = useSearchParams();
  const serverError = params.get('error');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const liveError = hasSubmitted ? validatePasswords(password, confirmPassword) : null;
  const isPasswordTooShort = password.length < 6;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Banner Component */}
        <Banner />
        
        {/* Register Form */}
        <div className="max-w-md mx-auto mt-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">สร้างบัญชีของท่าน</h2>
          </div>
          
          <form action={registerAction} className="space-y-4" onSubmit={() => setHasSubmitted(true)}>
            
            {/* Email Field */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <input
                type="password"
                name="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 transition-colors ${
                  hasSubmitted && liveError ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                }`}
                required
              />
            </div>

            {/* Error Message */}
            {((hasSubmitted && liveError) || serverError === 'invalid') && (
              <div className="text-center">
                <p className="text-red-500 text-sm mb-4">
                  {liveError ?? 'มีข้อผิดพลาด? คลิกลบ'}
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="text-red-500 text-sm mb-4">
                มีบัญชีอยู่แล้ว? <Link href="/login" className="hover:underline">คลิกเพื่อลงชื่อเข้าใช้</Link>
              </p>
            </div>

            {/* Hidden fields */}
            <input type="hidden" name="first" value="User" />
            <input type="hidden" name="last" value="Name" />

            {/* Submit Button */}
            <SubmitButton disabledExtra={isPasswordTooShort || (hasSubmitted && !!liveError)} />
            
          </form>
        </div>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}
