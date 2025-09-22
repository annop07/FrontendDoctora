'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar'; // ปรับ path ตามที่คุณเก็บไฟล์จริง

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const card = document.getElementById('success-card');
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'all 0.6s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 100);
    }

    // ตั้งเวลา 5 วินาที redirect อัตโนมัติ
    const timeout = setTimeout(() => {
      router.push('/'); // เปลี่ยนเป็น first page ของคุณ
    }, 5000);

    // ล้าง timeout เมื่อ component unmount
    return () => clearTimeout(timeout);
  }, [router]);

  const handleButtonClick = () => {
    const button = document.getElementById('action-button');
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
        router.push('/'); // redirect ทันที
      }, 150);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ใช้ Navbar component */}
      <Navbar />

      {/* Main content */}
      <main className="flex flex-1 justify-center items-center p-5 md:p-10">
        <div
          id="success-card"
          className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl p-10 md:p-16 text-center shadow-lg max-w-md w-full relative"
        >
          {/* Check icon */}
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-lg mx-auto flex items-center justify-center shadow-md mb-8">
            <svg
              className="w-10 h-10 md:w-12 md:h-12 stroke-teal-600 stroke-2 fill-none stroke-linecap-round stroke-linejoin-round"
              viewBox="0 0 24 24"
            >
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </div>

          {/* Success message */}
          <h2 className="text-white text-xl md:text-2xl font-semibold mb-8 drop-shadow-sm">
            ทำการนัดหมายเรียบร้อยแล้ว
          </h2>

          {/* Button */}
          <button
            id="action-button"
            onClick={handleButtonClick}
            className="bg-white/90 text-teal-600 font-medium text-base md:text-lg px-6 py-3 rounded-md shadow-md transition-all duration-300 hover:bg-white hover:translate-y-[-2px] active:translate-y-0"
          >
            คลิกเพื่อกลับไปยังหน้าหลัก
          </button>
        </div>
      </main>
    </div>
  );
}
