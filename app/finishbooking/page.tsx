'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle, Calendar, Clock, Stethoscope, Home, FileText, ArrowLeft } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const card = document.getElementById('success-card');
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      setTimeout(() => {
        card.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 200);
    }

    // ตั้งเวลา 10 วินาที redirect อัตโนมัติ
    const timeout = setTimeout(() => {
      router.push('/');
    }, 10000);

    return () => clearTimeout(timeout);
  }, [router]);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleBackToBooking = () => {
    // ล้างข้อมุลการจองเดิม
    sessionStorage.removeItem('bookingDraft');
    sessionStorage.removeItem('patientData');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">จองนัดหมายสำเร็จ</h1>
              <p className="text-green-100 mt-1">ขอบคุณที่ใช้บริการของเรา</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 justify-center items-center px-4 py-12">
        <div
          id="success-card"
          className="max-w-2xl w-full"
        >
          {/* Success Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-6">
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">
                นัดหมายสำเร็จแล้ว!
              </h2>
              <p className="text-emerald-100 text-lg">
                คุณได้รับการยืนยันการนัดหมายแล้ว
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Success Message */}
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-6">
                  <Stethoscope className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    ขอบคุณที่เลือกใช้บริการ
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    เราได้ส่งใบยืนยันการนัดหมายให้คุณแล้ว กรุณาเก็บไฟล์ PDF เป็นหลักฐานและนำมาแสดงในวันนัดหมาย
                  </p>
                </div>

                {/* Instructions */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <FileText className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">เตรียมเอกสาร</h4>
                    <p className="text-sm text-gray-600">นำใบยืนยันและบัตรประชาชนมาแสดง</p>
                  </div>
                  
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <Clock className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">มาตรงเวลา</h4>
                    <p className="text-sm text-gray-600">แนะนำให้มาก่อนเวลานัด 15-30 นาที</p>
                  </div>
                  
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <Calendar className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">วันนัดหมาย</h4>
                    <p className="text-sm text-gray-600">ตรวจสอบวันเวลาในใบยืนยัน</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">

                <button
                  onClick={handleGoHome}
                  className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
                >
                  กลับสู่หน้าหลัก
                  <Home className="w-5 h-5" />
                </button>
              </div>

              {/* Auto redirect notice */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  หน้านี้จะเปลี่ยนไปหน้าหลักโดยอัตโนมัติใน 10 วินาที
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
