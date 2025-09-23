'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { registerAction } from '@/utils/action';
import { useSearchParams } from 'next/navigation';
import { validatePasswords } from '@/utils/validatePass';
import { useState } from 'react';

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
      className="w-full rounded-lg bg-teal-600 py-3 px-6 font-medium text-white hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'กำลังสร้าง...' : 'สร้างบัญชีของฉัน'}
    </button>
  );
}

export default function RegisterPage() {
  const params = useSearchParams();
  const serverError = params.get('error');

  const [password, setPassword] = useState('');

  const liveError = validatePasswords(password);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Navbar */}
        <Navbar />
        
        {/* Banner */}
        <Banner />
        
        {/* Register Form */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">สร้างบัญชีของท่าน</h2>
          
          <form action={registerAction} className="space-y-4 max-w-sm mx-auto">
            
            {/* Email Field */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                  liveError ? 'border-red-400' : 'border-gray-300 focus:border-teal-500'
                }`}
                required
              />
            </div>

            {/* Error Message */}
            {(liveError || serverError === 'invalid') && (
              <p className="text-sm text-red-600 text-left">
                {liveError ?? 'มีข้อผิดพลาด? คลิกลบ'}
              </p>
            )}

            {/* Hidden fields */}
            <input type="hidden" name="first" value="User" />
            <input type="hidden" name="last" value="Name" />

            {/* Submit Button */}
            <SubmitButton disabledExtra={!!liveError} />
            
          </form>
        </div>

        {/* Footer */}
        <Footer />
        
      </div>
    </div>
  );
}
