'use client';

import React, { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Banner from "@/components/Banner";
import Footer from "@/components/Footer";

export default function LandingPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState('');

  // เมื่อผู้ใช้เลือก option ให้เก็บลง sessionStorage.bookingDraft.illness
  useEffect(() => {
    if (!selectedOption) return;
    // อ่าน draft เดิม (ถ้ามี)
    const draft = JSON.parse(sessionStorage.getItem('bookingDraft') || '{}');

    // เก็บประเภทเป็นค่า auto/manual
    draft.illness = selectedOption;

    // เคลียร์ค่าที่อาจค้างจากการจองครั้งก่อน (กันแสดงข้อมูลเก่า)
    draft.selectedDoctor = '';
    draft.selectedDate   = '';
    draft.selectedTime   = '';

    sessionStorage.setItem('bookingDraft', JSON.stringify(draft));
  }, [selectedOption]);

  const handleNext = () => {
    if (!selectedOption) {
      alert('กรุณาเลือกตัวเลือกก่อนดำเนินการต่อ');
      return;
    }
    // ส่งค่า selection ไปให้หน้า /depart ด้วย (เพื่อแสดงยืนยันบนหน้านั้น)
    router.push(`/depart?selection=${selectedOption}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header + Log in/Register */}
      <div className="relative">
        <Navbar />
        <div className="absolute right-6 top-3 flex gap-3">
          <a
            href="/login"
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Log in
          </a>
          <a
            href="/register"
            className="px-6 py-2 bg-[#286B81] text-white rounded-lg hover:bg-[#1e5468] transition-colors"
          >
            Register
          </a>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* Banner Component */}
        <Banner />

        {/* Appointment Section */}
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            เริ่มทำการนัดหมายแพทย์
          </h1>

          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-[#286B81]" />
            </div>

            <select
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="px-3 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white w-95 text-lg focus:outline-none focus:ring-2 focus:ring-[#286B81] focus:border-[#286B81]"
            >
              <option value="" disabled>
                กรุณาเลือกตัวเลือก
              </option>
              <option value="auto">เลือกแพทย์ให้ฉัน</option>
              <option value="manual">ฉันต้องการเลือกแพทย์เอง</option>
            </select>
          </div>

          <div className="text-red-500 text-sm mb-4">
            <a href="/login" className="hover:text-red-700 transition-colors">
              จำเป็นต้องมีการลงทะเบียนเพื่อทำการนัดหมาย คลิกที่นี่เพื่อเข้าสู่ระบบ
            </a>
          </div>

          <button
            onClick={handleNext}
            className="w-full max-w-sm bg-[#286B81] hover:bg-[#1e5468] text-white text-lg font-bold py-3 px-6 rounded-lg transition-colors"
          >
            ต่อไป &gt;
          </button>
        </div>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}
