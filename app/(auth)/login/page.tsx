"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Banner from "@/components/Banner";
import Footer from "@/components/Footer";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Banner Component */}
        <Banner />

        {/* Login Form Section */}
        <div className="max-w-md mx-auto mt-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ลงชื่อเข้าใช้</h2>
          </div>

          <form className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div className="text-center">
              <p className="text-red-500 text-sm mb-4">
                ยังไม่มีบัญชีหรือไม่? <Link href="/register" className="hover:underline">คลิกลงชื่อ</Link>
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              สร้างบัญชีของฉัน
            </button>
          </form>
        </div>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}