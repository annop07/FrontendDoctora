'use client';
import { useSearchParams, useParams } from "next/navigation";
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, GraduationCap, Languages, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useRouter } from "next/navigation";

const DoctorDetailWireframes = () => {
  const router = useRouter();

  // States for UI
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // States for data loading
  const [doctorData, setDoctorData] = useState<any>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper functions for date calculations
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };
  
  const getWeekDates = (startDate: Date) => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };
  
  const getCurrentWeekDates = () => {
    const startOfSelectedWeek = getStartOfWeek(selectedDate);
    return getWeekDates(startOfSelectedWeek);
  };

  // อ่าน :id จาก /DocInfoAndBooking/[id]
  const params = useParams();
  const routeId = Number(params?.id) || 1;

  // อ่านข้อมูลที่ส่งมาจากหน้า AllDoctor ผ่าน query string
  const sp = useSearchParams();
  const qName        = sp.get("name") || "";
  const qDepartment  = sp.get("department") || "";
  const qGender      = sp.get("gender") || "";
  const qEducation   = sp.get("education") || "";
  const qLanguages   = (sp.get("languages") || "").split(",").map(s => s.trim()).filter(Boolean);

  // ถ้ามีพารามิเตอร์มา จะสร้าง doctor จากค่าพวกนี้
  const doctorFromParams = (qName || qDepartment || qGender || qEducation || qLanguages.length)
    ? {
        id: routeId,
        name: qName || "ไม่ระบุชื่อ",
        department: qDepartment || "ไม่ระบุแผนก",
        gender: (qGender as "ชาย" | "หญิง") || "ชาย",
        education: qEducation || "ไม่ระบุการศึกษา",
        languages: qLanguages.length ? qLanguages : ["ไทย"],
        specialties: "",
        availableTimes: ["9:00-10:00"],
        nextAvailableTime: "9:00-10:00"
      }
    : null;

  // Mock doctors data - ต้องตรงกับหน้า search
  const mockDoctors = [
    { 
      id: 1, 
      name: "นพ. กฤต อินทรจินดา", 
      department: "กระดูกและข้อ",
      gender: "ชาย",
      education: "แพทยศาสตรดุษฎีบัณฑิต มหาวิทยาลัยมหิดล",
      languages: ["ไทย", "อังกฤษ"],
      specialties: "แพทย์เชี่ยวชาญด้านกระดูกและข้อ",
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
      specialties: "แพทย์เชี่ยวชาญด้านหัวใจและทรวงอก",
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
      specialties: "แพทย์เชี่ยวชาญด้านนรีเวชกรรม",
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
      specialties: "แพทย์เชี่ยวชาญด้านกุมารเวชกรรม",
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
      specialties: "แพทย์เชี่ยวชาญด้านกุมารเวชกรรม",
      availableTimes: ["9:00-10:00", "12:00-13:00"],
      nextAvailableTime: "12:00-13:00"
    }
  ];

  // หาข้อมูลหมอจาก ID (ถ้ามีค่าจาก query มาก็ใช้เลย ไม่งั้นหาใน mock)
  const doctor = doctorFromParams
    ? doctorFromParams
    : (mockDoctors.find(doc => doc.id === routeId) || mockDoctors[0]);

  // สร้างตารางเวลาประจำสัปดาห์ (mock)
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

    const schedules: any = {
      1: [
        { day: 'อาทิตย์', dayOfWeek: 0, slots: [] },
        { day: 'จันทร์', dayOfWeek: 1, slots: (date: Date) => [
          { id: 1, time: '09:00-10:00', available: true, appointmentId: null },
          { id: 2, time: '10:00-11:00', available: getSeedForDate(doctorId, date) > 30, appointmentId: getSeedForDate(doctorId, date) > 30 ? null : 123 },
          { id: 3, time: '13:00-14:00', available: true, appointmentId: null }
        ]},
        { day: 'อังคาร', dayOfWeek: 2, slots: (date: Date) => [
          { id: 4, time: '09:00-10:00', available: getSeedForDate(doctorId, date) > 20, appointmentId: getSeedForDate(doctorId, date) > 20 ? null : 456 },
          { id: 5, time: '13:00-14:00', available: true, appointmentId: null }
        ]},
        { day: 'พุธ', dayOfWeek: 3, slots: (date: Date) => [
          { id: 6, time: '09:00-10:00', available: getSeedForDate(doctorId, date) > 40, appointmentId: getSeedForDate(doctorId, date) > 40 ? null : 789 }
        ]},
        { day: 'พฤหัสบดี', dayOfWeek: 4, slots: [] },
        { day: 'ศุกร์', dayOfWeek: 5, slots: (date: Date) => [
          { id: 7, time: '09:00-10:00', available: true, appointmentId: null },
          { id: 8, time: '13:00-14:00', available: getSeedForDate(doctorId, date) > 30, appointmentId: getSeedForDate(doctorId, date) > 30 ? null : 101 }
        ]},
        { day: 'เสาร์', dayOfWeek: 6, slots: [] }
      ],
      2: [
        { day: 'อาทิตย์', dayOfWeek: 0, slots: [] },
        { day: 'จันทร์', dayOfWeek: 1, slots: () => [
          { id: 9, time: '10:00-11:00', available: true, appointmentId: null },
          { id: 10, time: '14:00-15:00', available: true, appointmentId: null }
        ]},
        { day: 'อังคาร', dayOfWeek: 2, slots: (date: Date) => [
          { id: 11, time: '10:00-11:00', available: getSeedForDate(doctorId, date) > 50, appointmentId: getSeedForDate(doctorId, date) > 50 ? null : 789 }
        ]},
        { day: 'พุธ', dayOfWeek: 3, slots: () => [
          { id: 12, time: '10:00-11:00', available: true, appointmentId: null },
          { id: 13, time: '14:00-15:00', available: true, appointmentId: null }
        ]},
        { day: 'พฤหัสบดี', dayOfWeek: 4, slots: [] },
        { day: 'ศุกร์', dayOfWeek: 5, slots: () => [
          { id: 14, time: '10:00-11:00', available: true, appointmentId: null }
        ]},
        { day: 'เสาร์', dayOfWeek: 6, slots: [] }
      ],
    };
    
    const baseSchedule = schedules[doctorId] || schedules[1];
    
    // Map schedule to current week dates
    return baseSchedule.map((dayData: any, index: number) => ({
      ...dayData,
      date: weekDates[index].toISOString().split('T')[0],
      dateObj: weekDates[index],
      slots: typeof dayData.slots === 'function' ? dayData.slots(weekDates[index]) : dayData.slots
    }));
  };

  const mockWeeklySchedule = generateScheduleForDoctor(doctor.id, getCurrentWeekDates());

  // ฟังก์ชันสำหรับดึงข้อมูลหมอ (ตัวอย่าง)
  const fetchDoctorData = async (doctorId: number) => {
    setLoading(true);
    try {
      setTimeout(() => {
        setDoctorData(doctor);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับดึงตารางเวลา (ตัวอย่าง)
  const fetchWeeklySchedule = async (doctorId: number, weekOffset = 0) => {
    try {
      const weekDates = getCurrentWeekDates();
      setWeeklySchedule(generateScheduleForDoctor(doctorId, weekDates));
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  // เปลี่ยนวันที่
  const handleDateChange = (dateString: string) => {
    const newDate = new Date(dateString);
    setSelectedDate(newDate);
    setCurrentWeek(0);
    setSelectedTimeSlot(null);
  };

  // เลือก time slot
  const handleTimeSlotClick = (day: string, slotData: { time: string, available: boolean }) => {
    if (slotData.available) {
      setSelectedTimeSlot(`${day}-${slotData.time}`);
    }
  };

  // ✅ ยืนยันการจอง —> เก็บลง sessionStorage.bookingDraft แล้วไป /confirm
  const handleBookingConfirm = () => {
    if (!selectedTimeSlot) return;
  
    const timeLabel = selectedTimeSlot.includes('-')
      ? selectedTimeSlot.split('-').slice(1).join('-')
      : selectedTimeSlot;
  
    const draft = JSON.parse(sessionStorage.getItem("bookingDraft") || "{}");
    draft.selectedDoctor = doctor.name;              // ✅ ชื่อหมอ
    draft.depart = doctor.department;                // กันเผื่อค่า depart หาย
    draft.selectedDate = selectedDate.toISOString(); // ✅ วัน
    draft.selectedTime = timeLabel;                  // ✅ เวลา
    sessionStorage.setItem("bookingDraft", JSON.stringify(draft));
  
    router.push("/patientForm");
  };
  

  const nextWeek = () => {
    const newWeek = currentWeek + 1;
    setCurrentWeek(newWeek);
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
    setSelectedTimeSlot(null);
  };
  
  const prevWeek = () => {
    const newWeek = Math.max(0, currentWeek - 1);
    setCurrentWeek(newWeek);
    if (currentWeek > 0) {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() - 7);
      setSelectedDate(newDate);
    }
    setSelectedTimeSlot(null);
  };

  return (
    <div >
      {/* Logo Section */}
      <div className="bg-white px-6 py-4 border-b">
        <Navbar />
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        
        {/* Doctor Profile Section with Green Gradient */}
        <div className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 rounded-lg shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{doctor.name}</h1>
              <p className="text-xl opacity-90">{doctor.department}</p>
            </div>
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Doctor Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Department Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">แผนก</h3>
            </div>
            <div className="text-gray-600">
              <p className="font-medium">{doctor.department}</p>
              <p className="text-sm mt-2 opacity-75">{doctor.specialties}</p>
            </div>
          </div>

          {/* Education Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">การศึกษา</h3>
            </div>
            <div className="text-gray-600">
              <p className="font-medium text-sm">{doctor.education}</p>
              <p className="text-xs mt-2 opacity-75">ประกาศนียบัตรกระดูกและข้อ</p>
            </div>
          </div>

          {/* Languages Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Languages className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">ภาษา</h3>
            </div>
            <div className="text-gray-600">
              <div className="flex flex-wrap gap-2">
                {doctor.languages.map((lang: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Booking Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              การนัดเข้ารักษา - {doctor.name}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Date Picker Section - Centered */}
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">เลือกวันที่ต้องการนัดหมาย</label>
              <div className="max-w-md">
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Weekly Schedule Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  ตารางเวลาตรวจ
                </h3>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={prevWeek}
                    disabled={currentWeek === 0}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-medium text-gray-600">
                    สัปดาห์ที่ {currentWeek + 1} 
                    ({getCurrentWeekDates()[0].toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {getCurrentWeekDates()[6].toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
                  </span>
                  <button 
                    onClick={nextWeek}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Schedule Grid */}
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-2 min-w-full">
                  {mockWeeklySchedule.map((dayData: any, index: number) => {
                    const isToday = dayData.dateObj && dayData.dateObj.toDateString() === new Date().toDateString();
                    const isSelected = dayData.dateObj && dayData.dateObj.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Day Header */}
                        <div className={`p-3 text-center border-b border-gray-200 ${
                          isSelected ? 'bg-emerald-500 text-white' : 
                          isToday ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-50'
                        }`}>
                          <div className="font-semibold text-sm">{dayData.day}</div>
                          <div className="text-xs mt-1 opacity-90">
                            {dayData.dateObj ? dayData.dateObj.toLocaleDateString('th-TH', { 
                              day: 'numeric', 
                              month: 'short' 
                            }) : '-'}
                          </div>
                        </div>
                      
                        {/* Time Slots */}
                        <div className="p-3 space-y-2 min-h-[200px]">
                          {dayData.slots && dayData.slots.length > 0 ? (
                            dayData.slots.map((slot: any, slotIndex: number) => {
                              const isSlotSelected = selectedTimeSlot === `${dayData.day}-${slot.time}`;
                              
                              return (
                                <button
                                  key={slotIndex}
                                  onClick={() => handleTimeSlotClick(dayData.day, slot)}
                                  disabled={!slot.available}
                                  className={`w-full p-2 text-xs rounded-md border transition-all duration-200 ${
                                    !slot.available 
                                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                      : isSlotSelected
                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50 hover:border-emerald-300'
                                  }`}
                                >
                                  {!slot.available ? 'เต็มแล้ว' : slot.time}
                                </button>
                              );
                            })
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-xs text-gray-400 text-center">
                                ไม่มีตารางตรวจ<br />ในวันนี้
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Booking Action */}
            {selectedTimeSlot && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-emerald-800">เลือกเวลา: {selectedTimeSlot}</p>
                    <p className="text-sm text-emerald-600 mt-1">กรุณายืนยันการจองเพื่อทำการนัดหมาย</p>
                  </div>
                  <button 
                    onClick={handleBookingConfirm}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    ยืนยันการจอง
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Placeholder */}
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">Footer Section - จะถูกเพิ่มในภายหลัง</p>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetailWireframes;
