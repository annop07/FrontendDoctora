"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Banner from "@/components/Banner";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Mock login - ในการใช้งานจริงจะเรียก API
      if (email && password) {
        // จำลองการเข้าสู่ระบบ
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // บันทึกข้อมูลผู้ใช้ลง localStorage
        const userData = { email };
        localStorage.setItem('user', JSON.stringify(userData));
        
        // ไปหน้าแรก
        router.push('/');
        
        // รีเฟรชหน้าเพื่ออัพเดท Navbar
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        setError("กรุณากรอกอีเมลและรหัสผ่าน");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setIsLoading(false);
    }
  };

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            {error && (
              <div className="text-center">
                <p className="text-red-500 text-sm mb-4">{error}</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-red-500 text-sm mb-4">
                ยังไม่มีบัญชีหรือไม่? <Link href="/register" className="hover:underline">คลิกลงชื่อ</Link>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}