"use client";

import Link from "next/link";

export default function LoginPage() {
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

        <form className="p-6 pt-2 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white hover:bg-sky-700"
          >
            Sign in
          </button>

          <p className="text-center text-sm text-slate-600">
            Don’t have an account?{" "}
            <Link href="/register" className="text-sky-700 font-medium hover:underline">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
