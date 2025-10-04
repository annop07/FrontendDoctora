'use client';
import { useParams } from "next/navigation";
import React, { useState, useEffect } from 'react';
import { Calendar, User, ArrowLeft, ArrowRight, Stethoscope, Building, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter } from "next/navigation";
import { AvailabilityService, Availability } from '@/lib/availability-service';
import { AppointmentService, BookedSlot } from '@/lib/appointment-service';

// ===================== Interfaces =====================
interface TimeSlot {
  time: string;
  available: boolean;
  status?: 'available' | 'pending' | 'booked'; // booking status
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
}

// ===================== Utilities =====================
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
  const params = useParams();
  const routeId = Number(params?.id) || 1;

  // States
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewStart, setViewStart] = useState<Date>(getStartOfWeek(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Map<string, BookedSlot[]>>(new Map());

  const apiService = new DoctorApiService();

  // Load doctor data from backend
  useEffect(() => {
    const loadDoctor = async () => {
      try {
        setLoading(true);
        const doctorData = await apiService.getDoctorById(routeId);
        setDoctor(doctorData);
      } catch (error) {
        console.error('Failed to load doctor:', error);
        setError(error instanceof Error ? error.message : 'Failed to load doctor data');
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [routeId]);

  // Load doctor availability from backend
  useEffect(() => {
    const loadAvailability = async () => {
      if (!routeId) return;

      try {
        setLoadingAvailability(true);
        console.log('🔵 Loading availability for doctor:', routeId);
        const data = await AvailabilityService.getDoctorAvailability(routeId);
        console.log('✅ Availability data loaded:', data);
        setAvailabilities(data);
      } catch (error) {
        console.error('❌ Failed to load availability:', error);
        // Don't set error state - just use empty array for no availability
        setAvailabilities([]);
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAvailability();
  }, [routeId]);

  // Load booked slots for the current week
  useEffect(() => {
    const loadBookedSlotsForWeek = async () => {
      if (!routeId) return;

      const weekDates = getCurrentWeekDates();
      const newBookedSlots = new Map<string, BookedSlot[]>();

      console.log('🔵 [loadBookedSlots] Loading booked slots for doctor:', routeId);

      // Fetch booked slots for each day in the week
      await Promise.all(
        weekDates.map(async (date) => {
          // Use local date format (YYYY-MM-DD) to avoid timezone issues
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;

          try {
            const slots = await AppointmentService.getBookedTimeSlots(routeId, dateString);
            console.log(`✅ [loadBookedSlots] ${dateString}: ${slots.length} booked slots`, slots);
            newBookedSlots.set(dateString, slots);
          } catch (error) {
            console.error(`❌ [loadBookedSlots] Failed to load booked slots for ${dateString}:`, error);
            newBookedSlots.set(dateString, []);
          }
        })
      );

      console.log('📊 [loadBookedSlots] All booked slots:', Object.fromEntries(newBookedSlots));
      setBookedSlots(newBookedSlots);
    };

    loadBookedSlotsForWeek();
  }, [routeId, viewStart]);

  // Generate real schedule from availability data
  const generateScheduleFromAvailability = (weekDates: Date[]) => {
    return weekDates.map((dateObj) => {
      const dayOfWeek = dateObj.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

      // Convert to backend format: 1=Monday, 7=Sunday
      const backendDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

      // Use local date format to match the booked slots Map keys
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      // Find availability for this day of week (using backend format)
      const dayAvailabilities = availabilities.filter(av => av.dayOfWeek === backendDayOfWeek);

      // Get booked slots for this date
      const dayBookedSlots = bookedSlots.get(dateString) || [];
      console.log(`🔍 [generateSchedule] ${dateString}: ${dayBookedSlots.length} booked slots from Map`);

      // Generate time slots from availability data
      const slots: TimeSlot[] = [];

      dayAvailabilities.forEach(availability => {
        // Convert startTime and endTime to time slots
        const startTime = AvailabilityService.formatTime(availability.startTime);
        const endTime = AvailabilityService.formatTime(availability.endTime);

        // Parse times
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        // Generate 1-hour slots within the availability window
        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
          const nextHour = currentMin + 60 >= 60 ? currentHour + 1 : currentHour;
          const nextMin = (currentMin + 60) % 60;

          // Don't create slots that go past the end time
          if (nextHour > endHour || (nextHour === endHour && nextMin > endMin)) {
            break;
          }

          const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
          const slotEnd = `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`;
          const timeRange = `${slotStart}-${slotEnd}`;

          // Check if this slot is booked
          const bookedSlot = dayBookedSlots.find(booked => {
            // Extract date and time from backend format: "2025-10-01T12:00:00"
            const bookedDateTime = booked.startTime;
            const bookedDate = bookedDateTime.split('T')[0]; // "2025-10-01"
            const bookedTime = bookedDateTime.split('T')[1]?.substring(0, 5); // "12:00"

            // Compare both date and time
            return bookedDate === dateString && bookedTime === slotStart;
          });

          console.log(`[Slot Check] ${dateString} ${slotStart}: bookedSlot=`, bookedSlot);

          let slotStatus: 'available' | 'pending' | 'booked' = 'available';
          let isAvailable = true;

          if (bookedSlot) {
            console.log(`⚠️ [Slot ${dateString} ${slotStart}] Found booking:`, bookedSlot);
            if (bookedSlot.status === 'CONFIRMED' || bookedSlot.status === 'COMPLETED') {
              slotStatus = 'booked';
              isAvailable = false; // Cannot book
              console.log(`❌ [Slot ${dateString} ${slotStart}] Status: BOOKED (disabled)`);
            } else if (bookedSlot.status === 'PENDING') {
              slotStatus = 'pending';
              isAvailable = true; // Can still book but show warning
              console.log(`🟡 [Slot ${dateString} ${slotStart}] Status: PENDING (warning)`);
            }
          }

          slots.push({
            time: timeRange,
            available: isAvailable,
            status: slotStatus,
          });

          currentHour = nextHour;
          currentMin = nextMin;
        }
      });

      return {
        day: dateObj.toLocaleDateString('th-TH', { weekday: 'short' }),
        dayFull: dateObj.toLocaleDateString('th-TH', { weekday: 'long' }),
        dateObj,
        slots: slots.sort((a, b) => a.time.localeCompare(b.time)), // Sort by time
      };
    });
  };

  const getCurrentWeekDates = () => getWeekDates(viewStart);
  const weeklySchedule = generateScheduleFromAvailability(getCurrentWeekDates());

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
    draft.selectedDoctor = doctor.doctorName;
    draft.selectedDoctorId = doctor.id; // เพิ่ม doctorId
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
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <Stethoscope className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              ข้อมูลแพทย์และการจองนัด
            </h1>
          </div>
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
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <Stethoscope className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              ข้อมูลแพทย์และการจองนัด
            </h1>
          </div>
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
        <div id="booking-section" className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">จองนัดหมายแพทย์</h2>
                <p className="text-white/90 text-sm">{doctor.doctorName} • {doctor.specialty.name}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Step 1: Date Selection */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  selectedDate ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  1
                </div>
                <h3 className="text-lg font-bold text-gray-900">เลือกวันที่</h3>
              </div>

              <div className="flex items-center gap-4 pl-11">
                <input
                  type="date"
                  className="flex-1 max-w-xs px-4 py-3 border-2 border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-medium transition-all hover:border-emerald-300"
                  value={new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().slice(0,10)}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <div className="text-sm text-gray-600">
                  {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 mb-8"></div>

            {/* Step 2: Time Selection */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  selectedTimeSlot ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  2
                </div>
                <h3 className="text-lg font-bold text-gray-900">เลือกช่วงเวลา</h3>
                {loadingAvailability && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-medium">
                    กำลังโหลด...
                  </span>
                )}
              </div>

              <div className="pl-11">
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-6 bg-gray-50 rounded-xl p-4">
                  <button
                    onClick={prevWeek}
                    disabled={!canGoPrevious()}
                    className={`p-2.5 rounded-lg transition-all ${
                      canGoPrevious()
                        ? 'hover:bg-white text-gray-700 border-2 border-gray-300 hover:border-emerald-400 hover:text-emerald-600'
                        : 'text-gray-300 cursor-not-allowed border-2 border-gray-200'
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="text-base font-semibold text-gray-800">
                    {getCurrentWeekDates()[0].toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })} - {getCurrentWeekDates()[6].toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}
                  </div>

                  <button
                    onClick={nextWeek}
                    className="p-2.5 rounded-lg hover:bg-white text-gray-700 border-2 border-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-all"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Schedule Grid */}
                <div className="grid grid-cols-7 gap-3">
                  {weeklySchedule.map((dayData: DaySchedule, index: number) => {
                    const isSelected = sameYMD(dayData.dateObj, selectedDate);
                    const isToday = sameYMD(dayData.dateObj, new Date());
                    const isPastDate = dayData.dateObj < new Date(new Date().setHours(0, 0, 0, 0));

                    const availableSlots = (dayData.slots && !isPastDate)
                      ? dayData.slots.filter((slot: TimeSlot) => slot.available)
                      : [];

                    return (
                      <div key={index} className={`rounded-xl overflow-hidden border-2 transition-all ${
                        isPastDate
                          ? 'opacity-40 border-gray-200'
                          : isSelected
                            ? 'border-emerald-500 shadow-lg shadow-emerald-100'
                            : 'border-gray-200 hover:border-emerald-300'
                      }`}>
                        {/* Day Header */}
                        <div className={`p-3 text-center ${
                          isPastDate
                            ? 'bg-gray-100 text-gray-400'
                            : isSelected
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                              : isToday
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-50 text-gray-700'
                        }`}>
                          <div className="text-xs font-semibold mb-1 uppercase tracking-wide">{dayData.day}</div>
                          <div className="text-2xl font-bold">{dayData.dateObj.getDate()}</div>
                        </div>

                        {/* Time Slots */}
                        <div className="p-2 space-y-1.5 max-h-80 overflow-y-auto bg-white">
                          {availableSlots.length > 0 ? (
                            availableSlots.map((slot: TimeSlot, slotIndex: number) => {
                              const isPicked = sameYMD(dayData.dateObj, selectedDate) && selectedTimeSlot === slot.time;
                              const slotStatus = slot.status || 'available';

                              // Determine button styling based on status
                              let buttonClass = '';
                              let statusBadge = null;

                              if (!slot.available) {
                                // Booked/Confirmed - Gray, disabled
                                buttonClass = 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300';
                                statusBadge = <span className="text-xs">เต็ม</span>;
                              } else if (isPicked) {
                                // Selected - Emerald gradient
                                buttonClass = 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md';
                              } else if (slotStatus === 'pending') {
                                // Pending - Yellow warning
                                buttonClass = 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-2 border-yellow-300 hover:border-yellow-400';
                                statusBadge = <span className="text-xs">มีคิวรอ</span>;
                              } else {
                                // Available - Green
                                buttonClass = 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-2 border-emerald-200 hover:border-emerald-400';
                              }

                              return (
                                <button
                                  key={slotIndex}
                                  onClick={() => handleTimeSlotClick(dayData.dateObj, slot)}
                                  disabled={!slot.available}
                                  className={`w-full px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${buttonClass}`}
                                  title={
                                    !slot.available
                                      ? 'เวลานี้เต็มแล้ว'
                                      : slotStatus === 'pending'
                                        ? 'มีคิวรอยืนยัน - ยังสามารถจองได้'
                                        : 'ว่าง - สามารถจองได้'
                                  }
                                >
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span>{slot.time}</span>
                                    {statusBadge}
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="text-center py-12">
                              <div className="text-gray-400 text-sm font-medium">
                                {isPastDate ? 'ผ่านแล้ว' : 'ไม่มีเวลาว่าง'}
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

            {/* Step 3: Confirmation */}
            {selectedTimeSlot && (
              <>
                <div className="border-t border-gray-200 mb-8"></div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-emerald-500 text-white">
                      3
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">ยืนยันการจอง</h3>
                  </div>

                  <div className="pl-11">
                    <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 rounded-2xl p-6 shadow-xl">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-white">
                            <p className="text-sm font-medium opacity-90 mb-2">นัดหมายของคุณ</p>
                            <div className="text-xl font-bold mb-1">
                              {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <div className="text-lg font-semibold opacity-95">
                              เวลา {selectedTimeSlot} น.
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleBookingConfirm}
                          className="bg-white hover:bg-gray-50 text-emerald-600 px-10 py-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-3 whitespace-nowrap"
                        >
                          <Calendar className="w-5 h-5" />
                          ยืนยันการจอง
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DoctorDetailWireframes;