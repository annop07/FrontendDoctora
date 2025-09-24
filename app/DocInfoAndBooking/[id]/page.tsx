'use client';
import { useParams } from "next/navigation";
import React, { useState, useEffect } from 'react';
import { Calendar, User, GraduationCap, Languages, Clock, ArrowLeft, ArrowRight, Stethoscope, Building, Heart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter } from "next/navigation";

// ===================== Interfaces =====================
interface TimeSlot {
  time: string;
  available: boolean;
}

interface DaySchedule {
  day: string;
  dayFull: string;
  dateObj: Date;
  slots: TimeSlot[];
}

// ===================== Utilities (hoisted) =====================
function sameYMD(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day; // start Sunday
  return new Date(d.setDate(diff));
}

function getWeekDates(startDate: Date) {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

const DoctorDetailWireframes = () => {
  const router = useRouter();

  // States for UI - ใช้โครงสร้างที่ปรับปรุงแล้ว
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewStart, setViewStart] = useState<Date>(getStartOfWeek(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // อ่าน :id จาก /DocInfoAndBooking/[id]
  const params = useParams();
  const routeId = Number(params?.id) || 1;

  // Mock doctors data
  const mockDoctors = [
    { 
      id: 1, 
      name: "นพ. กฤต อินทรจินดา", 
      department: "กระดูกและข้อ",
      gender: "ชาย",
      education: "แพทยศาสตรดุษฎีบัณฑิต มหาวิทยาลัยมหิดล",
      languages: ["ไทย", "อังกฤษ"],
      specialties: "ผ่าตัดข้อเข่า, การรักษากระดูกสันหลัง, การผ่าตัดกระดูกหัก, การรักษาข้อเสื่อม",
      availableTimes: ["9:00-10:00", "10:00-11:00", "13:00-14:00"],
      nextAvailableTime: "9:00-10:00"
    },
    { 
      id: 2, 
      name: "นพ.รีโม", 
      department: "หัวใจและทรวงอก",
      gender: "ชาย",
      education: "แพทยศาสตรดุษฎีบัณฑิต จุฬาลงกรณ์มหาวิทยาลัย",
      languages: ["ไทย", "อังกฤษ", "ญี่ปุ่น"],
      specialties: "ผ่าตัดหัวใจ, การรักษาหลอดเลือดหัวใจ, การใส่เครื่องกระตุ้นหัวใจ, การผ่าตัดลิ้นหัวใจ",
      availableTimes: ["10:00-11:00", "14:00-15:00"],
      nextAvailableTime: "10:00-11:00"
    },
    { 
      id: 3, 
      name: "นพ.อิง", 
      department: "นรีเวชกรรม",
      gender: "หญิง",
      education: "แพทยศาสตรดุษฎีบัณฑิต มหาวิทยาลัยศิริราช",
      languages: ["ไทย", "อังกฤษ"],
      specialties: "การตั้งครรภ์และคลอด, การรักษาปัญหาฮอร์โมน, การผ่าตัดนรีเวช, การตรวจมะเร็งมดลูก",
      availableTimes: ["11:00-12:00", "15:00-16:00"],
      nextAvailableTime: "11:00-12:00"
    },
    { 
      id: 4, 
      name: "นพ.ก้อง", 
      department: "กุมารเวชกรรม",
      gender: "ชาย",
      education: "แพทยศาสตรดุษฎีบัณฑิต มหาวิทยาลัยรามาธิบดี",
      languages: ["ไทย", "อังกฤษ"],
      specialties: "การรักษาเด็กแรกเกิด, วัคซีนเด็ก, โรคติดเชื้อในเด็ก, การเจริญเติบโตของเด็ก",
      availableTimes: ["9:00-10:00", "12:00-13:00"],
      nextAvailableTime: "12:00-13:00"
    },
    { 
      id: 5, 
      name: "นพ.ฟิล์ม", 
      department: "กุมารเวชกรรม",
      gender: "ชาย",
      education: "แพทยศาสตรดุษฎีบัณฑิต มหาวิทยาลัยเชียงใหม่",
      languages: ["ไทย", "อังกฤษ"],
      specialties: "การรักษาโรคภูมิแพ้ในเด็ก, โรคหอบหืดเด็ก, การพัฒนาการเด็ก, โภชนาการเด็ก",
      availableTimes: ["9:00-10:00", "12:00-13:00"],
      nextAvailableTime: "12:00-13:00"
    }
  ];

  // หาข้อมูลหมอจาก ID - ใช้ mock data เป็นหลัก
  const doctor = mockDoctors.find(doc => doc.id === routeId) || mockDoctors[0];

  // สร้างตารางเวลาประจำสัปดาห์ (mock) - แบบช่วงเวลา 1 ชั่วโมงตามรูปแบบเดิม
  const BASE_SLOTS = [
    "09:00-10:00", "10:00-11:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"
  ];

  const generateScheduleForDoctor = (doctorId: number, weekDates: Date[]) => {
    const getSeedForDate = (doctorId: number, date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      let hash = 0;
      const str = `${doctorId}-${dateString}`;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash) % 100;
    };

    return weekDates.map((dateObj) => {
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const seed = getSeedForDate(doctorId, dateObj);
      
      return {
        day: dateObj.toLocaleDateString('th-TH', { weekday: 'short' }),
        dayFull: dateObj.toLocaleDateString('th-TH', { weekday: 'long' }),
        dateObj,
        slots: BASE_SLOTS.map((time, i) => ({
          time,
          available: isWeekend ? (seed + i) % 4 !== 0 : (seed + i) % 3 !== 0,
        }))
      };
    });
  };

  // ให้ตารางเวลาตามสัปดาห์ที่กำลังแสดงผล (อิง viewStart)
  const getCurrentWeekDates = () => getWeekDates(viewStart);
  const mockWeeklySchedule = generateScheduleForDoctor(doctor.id, getCurrentWeekDates());

  // เปลี่ยนวันที่ (อัปเดต selectedDate + viewStart ให้โชว์สัปดาห์เดียวกัน)
  const handleDateChange = (dateString: string) => {
    const newDate = new Date(dateString);
    if (isNaN(newDate.getTime())) return;
    setSelectedDate(newDate);
    setViewStart(getStartOfWeek(newDate));
    setSelectedTimeSlot(null);
  };

  // เลือก time slot (คลิกคอลัมน์วันไหน → เลือกวันนั้นด้วย)
  const handleTimeSlotClick = (dayDate: Date, slotData: { time: string, available: boolean }) => {
    if (!slotData.available) return;
    setSelectedDate(dayDate);
    setSelectedTimeSlot(slotData.time);
  };

  // เลื่อนสัปดาห์
  const nextWeek = () => {
    const next = new Date(viewStart);
    next.setDate(viewStart.getDate() + 7);
    setViewStart(next);
    setSelectedTimeSlot(null);
  };

  const prevWeek = () => {
    const prev = new Date(viewStart);
    prev.setDate(viewStart.getDate() - 7);
    
    // ตรวจสอบว่าสัปดาห์ก่อนหน้ามีวันที่เป็นอนาคตหรือไม่
    const prevWeekDates = getWeekDates(prev);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // รีเซ็ตเวลาให้เป็น 00:00:00
    
    // หาวันสุดท้ายของสัปดาห์ก่อนหน้า (วันเสาร์)
    const lastDayOfPrevWeek = prevWeekDates[6];
    lastDayOfPrevWeek.setHours(0, 0, 0, 0);
    
    // ถ้าวันสุดท้ายของสัปดาห์ก่อนหน้าเป็นวันปัจจุบันหรืออนาคต ให้เลื่อนได้
    if (lastDayOfPrevWeek >= today) {
      setViewStart(prev);
      setSelectedTimeSlot(null);
    }
  };

  // ตรวจสอบว่าสามารถเลื่อนกลับได้หรือไม่
  const canGoPrevious = () => {
    const prev = new Date(viewStart);
    prev.setDate(viewStart.getDate() - 7);
    const prevWeekDates = getWeekDates(prev);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastDayOfPrevWeek = prevWeekDates[6];
    lastDayOfPrevWeek.setHours(0, 0, 0, 0);
    
    return lastDayOfPrevWeek >= today;
  };

  // ยืนยันการจอง
  const handleBookingConfirm = () => {
    if (!selectedTimeSlot) return;

    const draft = JSON.parse(sessionStorage.getItem('bookingDraft') || '{}');
    draft.selectedDoctor = doctor.name;
    draft.depart = doctor.department;
    draft.selectedDate = selectedDate.toISOString();
    draft.selectedTime = selectedTimeSlot;
    sessionStorage.setItem('bookingDraft', JSON.stringify(draft));

    router.push('/patientForm');
  };

  // เพิ่ม useEffect สำหรับการ scroll เมื่อมาจากปุ่ม "นัดหมาย"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Stethoscope className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            ข้อมูลแพทย์และการจองนัด
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            รายละเอียดข้อมูลแพทย์และตารางเวลาสำหรับการจองนัดหมาย
          </p>
        </div>

        {/* Doctor Profile Card - Medical Green Theme */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-green-700 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
                  <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{doctor.name}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Building className="w-5 h-5" />
                  <p className="text-xl font-medium opacity-90">{doctor.department}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Information Cards - Medical Theme */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Specialties Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">ความชำนาญ</h3>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {doctor.specialties && doctor.specialties.split(',').map((specialty: string, index: number) => (
                  <span 
                    key={index} 
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200"
                  >
                    {specialty.trim()}
                  </span>
                ))}
                {!doctor.specialties && (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-medium border border-gray-200">
                    ไม่ระบุความชำนาญ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Education Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">การศึกษา</h3>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-emerald-700 text-sm leading-relaxed">{doctor.education}</p>
              <p className="text-xs text-gray-500">ประกาศนียบัตรความเชี่ยวชาญ</p>
            </div>
          </div>

          {/* Languages Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Languages className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">การสื่อสาร</h3>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {doctor.languages.map((lang: string, index: number) => (
                  <span 
                    key={index} 
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Booking Section - Medical Green Theme */}
        <div id="booking-section" className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">การนัดเข้ารักษา</h2>
                <p className="text-emerald-100 text-sm">{doctor.name}</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Date Picker */}
            <div className="text-center">
              <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                เลือกวันที่ต้องการนัดหมาย
              </label>
              <div className="inline-block">
                <input
                  type="date"
                  className="text-lg px-6 py-4 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-semibold bg-white/80 backdrop-blur-sm transition-all duration-200"
                  value={new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().slice(0,10)}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Schedule Table Header */}
            <div>
              <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-bold text-gray-900">ตารางเวลาตรวจ</h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={prevWeek}
                    disabled={!canGoPrevious()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      canGoPrevious() 
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200' 
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline">ก่อนหน้า</span>
                  </button>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600 font-medium">
                      ({getCurrentWeekDates()[0].toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {getCurrentWeekDates()[6].toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
                    </div>
                  </div>
                  
                  <button 
                    onClick={nextWeek}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-emerald-200"
                  >
                    <span className="hidden sm:inline">หน้าต่อไป</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Schedule Table - Medical Green Theme */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                <div className="grid grid-cols-7 gap-3">
                  {mockWeeklySchedule.map((dayData: DaySchedule, index: number) => {
                    const isSelected = sameYMD(dayData.dateObj, selectedDate);
                    const isToday = sameYMD(dayData.dateObj, new Date());
                    const isPastDate = dayData.dateObj < new Date(new Date().setHours(0, 0, 0, 0));
                    
                    // กรองเอาเฉพาะช่วงเวลาที่ว่างและไม่ใช่วันที่ผ่านมาแล้ว
                    const availableSlots = (dayData.slots && !isPastDate) 
                      ? dayData.slots.filter((slot: TimeSlot) => slot.available) 
                      : [];
                    
                    return (
                      <div key={index} className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border-2 transition-all duration-300 hover:shadow-lg ${
                        isPastDate ? 'opacity-50' : isSelected ? 'border-emerald-400 shadow-emerald-200' : 'border-emerald-200'
                      }`}>
                        {/* Day Header */}
                        <div className={`p-3 text-center font-semibold ${
                          isPastDate 
                            ? 'bg-gray-200 text-gray-500'
                            : isSelected 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                              : isToday 
                                ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800'
                                : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700'
                        }`}>
                          <div className="text-xs font-medium">{dayData.day}</div>
                          <div className="text-lg font-bold">{dayData.dateObj.getDate()}</div>
                        </div>

                        {/* Available Time Slots */}
                        <div className="p-3 space-y-2">
                          {availableSlots.length > 0 ? (
                            availableSlots.map((slot: TimeSlot, slotIndex: number) => {
                              const isPicked = sameYMD(dayData.dateObj, selectedDate) && selectedTimeSlot === slot.time;
                              
                              return (
                                <button
                                  key={slotIndex}
                                  onClick={() => handleTimeSlotClick(dayData.dateObj, slot)}
                                  className={`w-full p-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                    isPicked
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-105'
                                      : 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 hover:border-emerald-300'
                                  }`}
                                >
                                  {slot.time}
                                </button>
                              );
                            })
                          ) : (
                            <div className="text-center py-6">
                              <div className="text-gray-400 text-xs">
                                {isPastDate ? 'วันที่ผ่านมาแล้ว' : 'ไม่มีเวลาว่าง'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Booking Summary & Confirm */}
            {selectedTimeSlot && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <Heart className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-lg font-bold text-emerald-800">เลือกเวลาแล้ว</h4>
                    </div>
                    <p className="text-emerald-700 font-medium mb-1">
                      📅 {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-emerald-700 font-medium">⏰ เวลา {selectedTimeSlot}</p>
                    <p className="text-emerald-600 text-sm mt-2">กรุณายืนยันการจองเพื่อทำการนัดหมาย</p>
                  </div>
                  <button 
                    onClick={handleBookingConfirm}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
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