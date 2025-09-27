'use client';
import { useParams, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { apiService, type Doctor } from "@/lib/api-service";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const DoctorDetailWireframes = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const routeId = Number(params?.id) || 1;

  // States
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Load doctor data from backend
  useEffect(() => {
    const loadDoctor = async () => {
      try {
        const doctorData = await apiService.getDoctorById(routeId);
        setDoctor(doctorData);
      } catch (error) {
        console.error('Failed to load doctor:', error);
        setError('Failed to load doctor information');
        
        // Fallback to URL params if backend fails
        const urlDoctor: Doctor = {
          id: routeId,
          doctorName: searchParams.get('name') || 'นพ. ไม่ทราบชื่อ',
          email: '',
          specialty: { 
            id: 1, 
            name: searchParams.get('department') || 'ไม่ระบุแผนก' 
          },
          licenseNumber: '',
          experienceYears: 0,
          consultationFee: 500,
          roomNumber: '',
          isActive: true,
          bio: '',
          education: searchParams.get('education') || '',
          languages: searchParams.get('languages')?.split(',') || ['ไทย'],
          availableTimes: ["9:00-10:00", "10:00-11:00", "13:00-14:00"],
          nextAvailableTime: "9:00-10:00"
        };
        setDoctor(urlDoctor);
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [routeId, searchParams]);

  // Auto-scroll to booking section if hash is present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#booking') {
      setTimeout(() => {
        const bookingSection = document.getElementById('booking-section');
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  const handleBookingConfirm = () => {
    if (!selectedTimeSlot || !doctor) return;

    const draft = JSON.parse(sessionStorage.getItem('bookingDraft') || '{}');
    draft.selectedDoctor = doctor.doctorName;
    draft.depart = doctor.specialty.name;
    draft.selectedDate = selectedDate.toISOString();
    draft.selectedTime = selectedTimeSlot;
    sessionStorage.setItem('bookingDraft', JSON.stringify(draft));

    router.push('/patientForm');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
              <p className="text-emerald-700 font-medium">กำลังโหลดข้อมูลแพทย์...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-red-800 font-medium">เกิดข้อผิดพลาด</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button 
                onClick={() => router.back()}
                className="mt-3 text-sm bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
              >
                กลับ
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Doctor Profile Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-green-700 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
                  <span className="text-4xl font-bold text-white">
                    {doctor.doctorName.charAt(doctor.doctorName.indexOf('.') + 1)?.trim().charAt(0) || 'ด'}
                  </span>
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{doctor.doctorName}</h1>
                <p className="text-xl font-medium opacity-90">{doctor.specialty.name}</p>
                <p className="text-emerald-100 mt-2">ประสบการณ์: {doctor.experienceYears} ปี</p>
                <p className="text-emerald-100">ค่าตรวจ: ฿{doctor.consultationFee}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bio Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ประวัติ</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {doctor.bio || 'ไม่มีข้อมูลประวัติ'}
            </p>
          </div>

          {/* Education Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">การศึกษา</h3>
            <p className="text-emerald-700 text-sm leading-relaxed">
              {doctor.education || 'ไม่มีข้อมูลการศึกษา'}
            </p>
          </div>

          {/* Languages Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ภาษาที่ใช้</h3>
            <div className="flex flex-wrap gap-2">
              {doctor.languages?.map((lang, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200"
                >
                  {lang}
                </span>
              )) || (
                <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm">
                  ไม่ระบุ
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div id="booking-section" className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-6">
            <h2 className="text-2xl font-bold">การนัดเข้ารักษา</h2>
            <p className="text-emerald-100 text-sm">{doctor.doctorName}</p>
          </div>

          <div className="p-8 space-y-8">
            {/* Date Picker */}
            <div className="text-center">
              <label className="block text-lg font-semibold text-gray-800 mb-4">
                เลือกวันที่ต้องการนัดหมาย
              </label>
              <input
                type="date"
                className="text-lg px-6 py-4 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-semibold bg-white/80"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Time Slots */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">เลือกเวลา</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {doctor.availableTimes?.map((time, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTimeSlot(time)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      selectedTimeSlot === time
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {time}
                  </button>
                )) || (
                  <p className="col-span-full text-center text-gray-500">ไม่มีเวลาว่าง</p>
                )}
              </div>
            </div>

            {/* Booking Confirmation */}
            {selectedTimeSlot && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <h4 className="text-lg font-bold text-emerald-800 mb-2">เลือกเวลาแล้ว</h4>
                    <p className="text-emerald-700 font-medium mb-1">
                      📅 {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-emerald-700 font-medium">⏰ เวลา {selectedTimeSlot}</p>
                  </div>
                  <button 
                    onClick={handleBookingConfirm}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl"
                  >
                    ยืนยันการจอง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DoctorDetailWireframes;