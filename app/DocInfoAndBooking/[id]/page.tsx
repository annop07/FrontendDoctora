'use client';
import { useParams } from "next/navigation";
import React, { useState, useEffect } from 'react';
import { Calendar, User, Clock, ArrowLeft, ArrowRight, Stethoscope, Building, Heart } from 'lucide-react';
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

interface Doctor {
  id: number;
  doctorName: string;
  email: string;
  specialty: { id: number; name: string };
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  roomNumber: string;
  isActive: boolean;
  bio?: string;
}

interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface DayAvailability {
  dayOfWeek: number;
  dayName: string;
  slots: AvailabilitySlot[];
}

// ===================== API Service =====================
class DoctorApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

  async getDoctorById(id: number): Promise<Doctor> {
    const response = await fetch(`${this.baseUrl}/api/doctors/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch doctor: ${response.status}`);
    }
    
    return response.json();
  }

  async getDoctorAvailability(doctorId: number): Promise<{ schedule: DayAvailability[] }> {
    const response = await fetch(`${this.baseUrl}/api/availabilities/doctor/${doctorId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch availability: ${response.status}`);
    }
    
    return response.json();
  }
}

// ===================== Utilities =====================
function sameYMD(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Start Monday
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

// Generate 30-minute time slots from availability periods
function generateTimeSlotsFromAvailability(slots: AvailabilitySlot[]): TimeSlot[] {
  const timeSlots: TimeSlot[] = [];
  
  slots.forEach(slot => {
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const nextMin = currentMin + 30;
      const nextHour = currentHour + Math.floor(nextMin / 60);
      const actualNextMin = nextMin % 60;
      
      if (nextHour < endHour || (nextHour === endHour && actualNextMin <= endMin)) {
        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}-${String(nextHour).padStart(2, '0')}:${String(actualNextMin).padStart(2, '0')}`;
        timeSlots.push({
          time: timeString,
          available: slot.isActive
        });
      }
      
      currentMin = actualNextMin;
      currentHour = nextHour;
    }
  });
  
  return timeSlots;
}

const DoctorDetailWireframes = () => {
  const router = useRouter();
  const params = useParams();
  const routeId = Number(params?.id) || 1;

  // States
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewStart, setViewStart] = useState<Date>(getStartOfWeek(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const apiService = new DoctorApiService();

  // Load doctor data and availability from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load doctor info
        const doctorData = await apiService.getDoctorById(routeId);
        setDoctor(doctorData);
        
        // Load availability schedule
        const availabilityData = await apiService.getDoctorAvailability(routeId);
        setAvailability(availabilityData.schedule);
        
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [routeId]);

  // Generate schedule for current week based on real availability
  const generateScheduleForWeek = (weekDates: Date[]): DaySchedule[] => {
    return weekDates.map((dateObj) => {
      const jsDay = dateObj.getDay(); // 0=Sunday, 1=Monday, etc.
      const isoDay = jsDay === 0 ? 7 : jsDay; // Convert to ISO (1=Monday, 7=Sunday)
      
      const dayAvail = availability.find(a => a.dayOfWeek === isoDay);
      const slots = dayAvail ? generateTimeSlotsFromAvailability(dayAvail.slots) : [];
      
      return {
        day: dateObj.toLocaleDateString('th-TH', { weekday: 'short' }),
        dayFull: dateObj.toLocaleDateString('th-TH', { weekday: 'long' }),
        dateObj,
        slots
      };
    });
  };

  const getCurrentWeekDates = () => getWeekDates(viewStart);
  const weeklySchedule = generateScheduleForWeek(getCurrentWeekDates());

  // Handle date change
  const handleDateChange = (dateString: string) => {
    const newDate = new Date(dateString);
    if (isNaN(newDate.getTime())) return;
    setSelectedDate(newDate);
    setViewStart(getStartOfWeek(newDate));
    setSelectedTimeSlot(null);
  };

  // Handle time slot selection
  const handleTimeSlotClick = (dayDate: Date, slotData: { time: string, available: boolean }) => {
    if (!slotData.available) return;
    setSelectedDate(dayDate);
    setSelectedTimeSlot(slotData.time);
  };

  // Navigation functions
  const nextWeek = () => {
    const next = new Date(viewStart);
    next.setDate(viewStart.getDate() + 7);
    setViewStart(next);
    setSelectedTimeSlot(null);
  };

  const prevWeek = () => {
    const prev = new Date(viewStart);
    prev.setDate(viewStart.getDate() - 7);
    
    const prevWeekDates = getWeekDates(prev);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastDayOfPrevWeek = prevWeekDates[6];
    lastDayOfPrevWeek.setHours(0, 0, 0, 0);
    
    if (lastDayOfPrevWeek >= today) {
      setViewStart(prev);
      setSelectedTimeSlot(null);
    }
  };

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

  // Booking confirmation
  const handleBookingConfirm = () => {
    if (!selectedTimeSlot || !doctor) return;

    const draft = JSON.parse(sessionStorage.getItem('bookingDraft') || '{}');
    
    draft.doctorId = doctor.id;
    draft.selectedDoctor = doctor.doctorName;
    draft.depart = doctor.specialty.name;
    draft.selectedDate = selectedDate.toISOString();
    draft.selectedTime = selectedTimeSlot;
    
    sessionStorage.setItem('bookingDraft', JSON.stringify(draft));

    router.push('/patientForm');
  };

  // Scroll to booking section when hash is present
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  // Error state
  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-red-800 font-medium mb-2">เกิดข้อผิดพลาด</h3>
              <p className="text-red-700 text-sm mb-4">{error || 'ไม่พบข้อมูลแพทย์'}</p>
              <button 
                onClick={() => router.back()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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

        {/* Doctor Profile Card */}
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
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{doctor.doctorName}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Building className="w-5 h-5" />
                  <p className="text-xl font-medium opacity-90">{doctor.specialty.name}</p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm opacity-90">
                  <span>ประสบการณ์: {doctor.experienceYears} ปี</span>
                  <span>•</span>
                  <span>ค่าตรวจ: ฿{doctor.consultationFee}</span>
                  {doctor.roomNumber && (
                    <>
                      <span>•</span>
                      <span>ห้อง: {doctor.roomNumber}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bio Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">ข้อมูลแพทย์</h3>
            </div>
            <div className="space-y-3">
              <div className="text-emerald-700 font-medium leading-relaxed">
                {doctor.bio || 'แพทย์ผู้เชี่ยวชาญที่มีประสบการณ์ในการรักษาผู้ป่วย'}
              </div>
              <div className="pt-2 border-t border-emerald-100">
                <p className="text-sm text-gray-600 mb-1">เลขใบประกอบวิชาชีพ</p>
                <p className="font-semibold text-gray-800">{doctor.licenseNumber}</p>
              </div>
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">ข้อมูลติดต่อ</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">อีเมล</p>
                <p className="font-semibold text-gray-800">{doctor.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">สถานะ</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  doctor.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {doctor.isActive ? 'พร้อมให้บริการ' : 'ไม่พร้อมให้บริการ'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Booking Section */}
        <div id="booking-section" className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">การนัดเข้ารักษา</h2>
                <p className="text-emerald-100 text-sm">{doctor.doctorName}</p>
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
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                    ✓ จากระบบ Backend
                  </span>
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

              {/* Schedule Table */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                <div className="grid grid-cols-7 gap-3">
                  {weeklySchedule.map((dayData: DaySchedule, index: number) => {
                    const isSelected = sameYMD(dayData.dateObj, selectedDate);
                    const isToday = sameYMD(dayData.dateObj, new Date());
                    const isPastDate = dayData.dateObj < new Date(new Date().setHours(0, 0, 0, 0));
                    
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

        {/* Backend Integration Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-green-800 font-medium mb-2">✅ Real Backend Integration</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p>✅ <strong>Connected:</strong> Doctor profile data from backend API</p>
            <p>✅ <strong>Connected:</strong> Availability schedule from backend (availabilities table)</p>
            <p>✅ <strong>Real Data:</strong> Time slots generated from doctor's actual schedule in database</p>
            <p>📊 <strong>Current Schedule:</strong> {availability.filter(a => a.slots.length > 0).length} days with availability</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DoctorDetailWireframes;