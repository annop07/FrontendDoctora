'use client';

import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { registerAction } from '@/utils/action';
import { useSearchParams } from 'next/navigation';
import { validatePasswords } from '@/utils/validatePass';
import { useState } from 'react';

function SubmitButton({ disabledExtra = false }: { disabledExtra?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabledExtra}
      className="mt-2 w-full rounded-lg bg-teal-600 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
    >
      {pending ? 'Creating...' : 'Create account'}
    </button>
  );
}

export default function RegisterPage() {
  const params = useSearchParams();
  const serverError = params.get('error'); // อย่าใช้ชื่อทับกับ state

  // state สำหรับตรวจรหัสผ่าน
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // ตรวจทุกครั้งที่พิมพ์
  const liveError = validatePasswords(password, confirm); // string | null

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

      {/* ส่งไปที่ server action */}
      <form action={registerAction} className="p-6 pt-2 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">First name</label>
            <input
              name="first"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
            <input
              name="last"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              required
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
          />
          {(liveError || serverError === 'invalid') && (
            <p className="mt-1 text-sm text-red-600">
              {liveError ?? 'Please fill all fields and make sure passwords match.'}
            </p>
          )}
        </div>

        {/* ปุ่มรู้สถานะ pending และปิดเมื่อรหัสผ่านยังไม่ถูกต้อง */}
        <SubmitButton disabledExtra={!!liveError} />

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