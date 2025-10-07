'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Banner from '@/components/Banner';
import Footer from '@/components/Footer';
import { AuthService } from '@/lib/auth-service';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(''); // เพิ่ม debug info
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo(''); // Clear debug info

    // Validate
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🚀 Starting registration...');
      setDebugInfo('Sending request to backend...');
      
      const result = await AuthService.register({
        email: formData.email,
        password: formData.password,
        firstName: '',
        lastName: ''
      });

      console.log('✅ Registration successful:', result);
      setDebugInfo('Registration successful! Redirecting...');

      // Redirect to login
      setTimeout(() => {
        router.push('/login?message=Registration successful! Please login.');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      setError(errorMessage);
      setDebugInfo(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-6">
        <Banner />
        
        <div className="max-w-md mx-auto mt-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">สร้างบัญชีของท่าน</h2>
            <p className="text-gray-600 text-sm">กรอกข้อมูลเพื่อสร้างบัญชีใหม่</p>
          </div>
          
          {/* Debug Info - แสดงเฉพาะตอน development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <strong>Debug Info:</strong>
              <br />
              API URL: {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set'}
              {debugInfo && (
                <>
                  <br />
                  Status: {debugInfo}
                </>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                name="email"
                placeholder="อีเมล"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-gray-600 text-sm mb-4">
                มีบัญชีอยู่แล้ว? <Link href="/login" className="text-emerald-600 hover:underline">คลิกเพื่อลงชื่อเข้าใช้</Link>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'กำลังสร้าง...' : 'สร้างบัญชีของฉัน'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              คุณสามารถเพิ่มชื่อ-นามสกุลได้ในภายหลังที่หน้าโปรไฟล์
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}