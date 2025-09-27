'use client';

import React, { useEffect, useState } from 'react';
import { Heart, Clock, Users, Stethoscope, Calendar, ArrowRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Navbar from "@/components/Navbar";
import Banner from "@/components/Banner";
import Footer from "@/components/Footer";

// ⬇️ เพิ่มคีย์กลางไว้ใช้กับ sessionStorage
const DRAFT_KEY = 'bookingDraft';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedOption, setSelectedOption] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ตรวจสอบว่าเรากำลังรันใน client หรือไม่
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ⬇️ โหลดค่าที่เคยเลือกไว้ (auto/manual) เมื่อเข้าหน้านี้
  useEffect(() => {
    if (!isClient) return;
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
    if (draft.illness === 'auto' || draft.illness === 'manual') {
      setSelectedOption(draft.illness);
    }
  }, [isClient]);

  // ⬇️ เซฟค่า illness ลง draft ทุกครั้งที่ผู้ใช้เปลี่ยนตัวเลือก
  useEffect(() => {
    if (!selectedOption || !isClient) return;
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        ...draft,
        illness: selectedOption,     // "auto" | "manual"
        // เคลียร์ค่าจองเก่าที่อาจค้าง
        selectedDoctor: '',
        selectedDate: '',
        selectedTime: '',
      })
    );
  }, [selectedOption, isClient]);

  const handleNext = () => {
    if (!selectedOption) {
      alert('กรุณาเลือกตัวเลือกก่อนดำเนินการต่อ');
      return;
    }

    // ถ้ายังไม่ล็อกอินให้เด้ง modal
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // ⬇️ กันเคสผู้ใช้กดเร็ว: ยืนยันเซฟ illness อีกรอบก่อนนำทาง
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, illness: selectedOption }));

    router.push(`/depart?selection=${selectedOption}`);
  };

  // ---- ส่วนเดิมทั้งหมดด้านล่างไม่เปลี่ยน ----

  const features = [
    {
      icon: Heart,
      title: "แพทย์เชี่ยวชาญ",
      description: "ทีมแพทย์ที่มีคุณภาพและประสบการณ์สูง",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: Clock,
      title: "รวดเร็วทันใจ",
      description: "จองนัดหมายได้ง่ายๆ ภายในไม่กี่คลิก",
      color: "from-teal-500 to-cyan-600"
    },
    {
      icon: Users,
      title: "บริการ 24/7",
      description: "พร้อมให้บริการคุณตลอด 24 ชั่วโมง",
      color: "from-cyan-500 to-blue-600"
    }
  ];

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
              <p className="text-emerald-700 font-medium">กำลังโหลด...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Banner Component */}
        <Banner />

        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <Stethoscope className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-emerald-900 mb-4">
            ยินดีต้อนรับสู่ <span className="text-emerald-600">Doctora</span>
          </h1>
          <p className="text-xl text-emerald-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            ระบบจองนัดหมายแพทย์ออนไลน์ที่ทันสมัย ปลอดภัย และใช้งานง่าย
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-emerald-700 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Appointment Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-emerald-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-emerald-900 mb-3">
                เริ่มจองนัดหมายแพทย์
              </h2>
              <p className="text-emerald-700">
                เลือกวิธีการจองที่เหมาะสมกับคุณ
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div 
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedOption === 'auto' 
                    ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                    : 'border-emerald-200 bg-white hover:border-emerald-300 hover:bg-emerald-25'
                }`}
                onClick={() => setSelectedOption('auto')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                    selectedOption === 'auto' ? 'border-emerald-500' : 'border-emerald-300'
                  }`}>
                    {selectedOption === 'auto' && (
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Stethoscope className="w-5 h-5 text-emerald-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-emerald-900">เลือกแพทย์ให้ฉัน</h3>
                      <p className="text-sm text-emerald-600">ระบบจะแนะนำแพทย์ที่เหมาะสมตามอาการ</p>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedOption === 'manual' 
                    ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                    : 'border-emerald-200 bg-white hover:border-emerald-300 hover:bg-emerald-25'
                }`}
                onClick={() => setSelectedOption('manual')}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                    selectedOption === 'manual' ? 'border-emerald-500' : 'border-emerald-300'
                  }`}>
                    {selectedOption === 'manual' && (
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-emerald-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-emerald-900">ฉันต้องการเลือกแพทย์เอง</h3>
                      <p className="text-sm text-emerald-600">เลือกแพทย์และเวลาที่ต้องการเองทั้งหมด</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <div 
                onClick={() => router.push('/login')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm cursor-pointer hover:bg-amber-100 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>
                  {isAuthenticated ? 'คุณได้เข้าสู่ระบบแล้ว' : 'จำเป็นต้องเข้าสู่ระบบเพื่อทำการนัดหมาย'}
                </span>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                selectedOption
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-emerald-200 text-emerald-400 cursor-not-allowed'
              }`}
            >
              เริ่มจองนัดหมาย
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      <Footer />

      {showLoginModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                จำเป็นต้องเข้าสู่ระบบ
              </h3>
              <p className="text-gray-600 mb-6">
                จำเป็นต้องมีการเข้าสู่ระบบก่อนจึงจะสามารถทำการจองได้
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
