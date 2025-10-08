"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense, useMemo, useCallback } from "react"; 
import Schedule from "@/components/Schedule";
import { useRouter } from "next/navigation";
import { Clock, Calendar, FileText, ArrowLeft, ArrowRight, Stethoscope, User, Building, CheckCircle } from "lucide-react";
import { AvailabilityService, Availability } from '@/lib/availability-service';
import { AppointmentService, BookedSlot } from '@/lib/appointment-service';
import { DoctorService } from '@/lib/doctor-service';

const DRAFT_KEY = "bookingDraft";

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

// ===================== Utility Functions =====================
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

const getCurrentWeekDates = (): Date[] => {
  const today = new Date();
  const startOfWeek = getStartOfWeek(new Date(today));
  const weekDates = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDates.push(date);
  }
  
  return weekDates;
};

const generateWeeklySchedule = (
  viewStart: Date,
  availabilities: Availability[],
  bookedSlots: Map<string, BookedSlot[]>
): DaySchedule[] => {
  const schedule: DaySchedule[] = [];
  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(viewStart);
    currentDate.setDate(viewStart.getDate() + i);
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    const dayOfWeekNumber = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayAvailabilities = availabilities.filter(av => 
      av.dayOfWeek === dayOfWeekNumber && av.isActive
    );
    
    const slots: TimeSlot[] = [];
    const bookedForDay = bookedSlots.get(dateString) || [];
    
    dayAvailabilities.forEach(availability => {
      const startHour = parseInt(availability.startTime.split(':')[0]);
      const endHour = parseInt(availability.endTime.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
        const isBooked = bookedForDay.some(booked => booked.startTime === timeSlot);
        
        if (!slots.find(slot => slot.time === timeSlot)) {
          slots.push({
            time: timeSlot,
            available: !isBooked,
            status: isBooked ? 'booked' : 'available'
          });
        }
      }
    });
    
    schedule.push({
      day: dayNames[i],
      dayFull: currentDate.toLocaleDateString('th-TH', { weekday: 'long' }),
      dateObj: currentDate,
      slots: slots.sort((a, b) => a.time.localeCompare(b.time))
    });
  }
  
  return schedule;
};

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [depart,setDepart] = useState<string>(searchParams.get("depart") ?? "");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [viewStart, setViewStart] = useState<Date>(getStartOfWeek(new Date()));
  
  // ✅ แยกเป็น 2 ตัวแปร
  const [bookingType, setBookingType] = useState<string>("");  // 'auto' หรือ 'manual'
  const [symptoms, setSymptoms] = useState("");  // อาการจริงๆ
  
  // ✅ States สำหรับ availability และ booked slots
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Map<string, BookedSlot[]>>(new Map());
  const [doctorsInDepartment, setDoctorsInDepartment] = useState<Doctor[]>([]);
  
  const apiService = new DoctorService();

  const selectionParam = searchParams.get("selection");

  // ✅ เก็บ state ตอนกดกลับจากหน้า patientForm - โหลดแค่ครั้งเดียว
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const stored = raw ? JSON.parse(raw) : {};

    if (!depart && stored.depart) setDepart(stored.depart);
    if (!selectedTimeSlot && stored.selectedTime) setSelectedTimeSlot(stored.selectedTime);
    if (stored.selectedDate) setSelectedDate(new Date(stored.selectedDate));

    // ✅ โหลด bookingType
    if (!bookingType && stored.bookingType) {
      setBookingType(stored.bookingType);
    } else if (!stored.bookingType && selectionParam) {
      setBookingType(selectionParam);
    }
  }, [selectionParam]); // ✅ dependency เฉพาะ selectionParam

  // ✅ โหลด symptoms แยกต่างหาก - แค่ครั้งเดียว
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    
    if (!symptoms && stored.symptoms) {
      setSymptoms(stored.symptoms);
    }
  }, []); // ✅ ทำงานแค่ครั้งเดียวตอน mount

  // ✅ โหมด auto จะใช้ UI เดียวกับ manual โดยให้เลือกเวลาเอง
  // แต่ระบบจะจัดแพทย์ให้ onsite ในขั้นตอนยืนยัน
  useEffect(() => {
    if (bookingType === 'auto') {
      // ตั้งค่า dummy doctor info สำหรับโหมด auto
      const existingRaw = sessionStorage.getItem(DRAFT_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        ...existing,
        selectedDoctor: '-',
        selectedDoctorId: -1  // dummy ID สำหรับโหมด auto
      }));
    }
  }, [bookingType]);

  // ✅ บันทึกข้อมูลหลัก (ไม่รวม symptoms เพื่อป้องกัน input lag)
  useEffect(() => {
    const existingRaw = sessionStorage.getItem(DRAFT_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};

    sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
            ...existing,
            depart,
            selectedTime: selectedTimeSlot,
            selectedDate: selectedDate?.toISOString() ?? null,
            bookingType,  // ✅ เก็บ bookingType
        })
    );
  }, [depart, selectedTimeSlot, selectedDate, bookingType]);

  // ✅ บันทึก symptoms แยกต่างหาก ใช้ debounce เพื่อป้องกัน input lag
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const existingRaw = sessionStorage.getItem(DRAFT_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        ...existing,
        symptoms,     // ✅ เก็บอาการแยกต่างหาก
      }));
    }, 300); // รอ 300ms หลังจากผู้ใช้หยุดพิมพ์

    return () => clearTimeout(timeoutId);
  }, [symptoms]);

  // Load all doctors for the selected department and their availabilities
  useEffect(() => {
    const loadDoctorsForDepartment = async () => {
      if (!depart) return;
      
      try {
        setLoadingAvailability(true);
        console.log('🔵 Loading doctors for specialty:', depart);
        
        // First, let's get specialties to find the specialty ID
        const specialtiesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/specialties/with-count`);
        const specialtiesData = await specialtiesResponse.json();
        
        // Find the specialty ID by name
        const specialty = specialtiesData.specialties.find((s: any) => s.name === depart);
        
        if (!specialty) {
          console.warn('❌ Specialty not found:', depart);
          setAvailabilities([]);
          return;
        }
        
        console.log('✅ Found specialty:', specialty);
        
        // Get doctors by specialty
        const doctorsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/doctors/specialty/${specialty.id}?page=0&size=100`);
        const doctorsData = await doctorsResponse.json();
        
        console.log('✅ Doctors loaded:', doctorsData.doctors?.length || 0, 'doctors');
        setDoctorsInDepartment(doctorsData.doctors || []);
        
        // Load availability for all doctors in the specialty
        const allAvailabilities: Availability[] = [];
        if (doctorsData.doctors && doctorsData.doctors.length > 0) {
          await Promise.all(
            doctorsData.doctors.map(async (doctor: any) => {
              try {
                const doctorAvailabilities = await AvailabilityService.getDoctorAvailability(doctor.id);
                allAvailabilities.push(...doctorAvailabilities);
              } catch (error) {
                console.warn(`Failed to load availability for doctor ${doctor.id}:`, error);
              }
            })
          );
        }
        
        console.log('✅ All availabilities loaded:', allAvailabilities.length, 'slots');
        setAvailabilities(allAvailabilities);
        
      } catch (error) {
        console.error('❌ Failed to load doctors:', error);
        setAvailabilities([]);
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadDoctorsForDepartment();
  }, [depart]);

  // Load booked slots for the current week across all doctors in department
  useEffect(() => {
    const loadBookedSlotsForWeek = async () => {
      if (!depart || doctorsInDepartment.length === 0) return;

      try {
        console.log('🔵 Loading booked slots for', doctorsInDepartment.length, 'doctors');
        
        const weekDates = getCurrentWeekDates();
        const newBookedSlots = new Map<string, BookedSlot[]>();

        // Fetch booked slots for each doctor and date combination
        await Promise.all(
          doctorsInDepartment.map(async (doctor: any) => {
            await Promise.all(
              weekDates.map(async (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;

                try {
                  const slots = await AppointmentService.getBookedTimeSlots(doctor.id, dateString);
                  const existingSlots = newBookedSlots.get(dateString) || [];
                  newBookedSlots.set(dateString, [...existingSlots, ...slots]);
                } catch (error) {
                  console.warn(`Failed to load booked slots for doctor ${doctor.id} on ${dateString}:`, error);
                }
              })
            );
          })
        );

        console.log('📊 All booked slots loaded:', Object.fromEntries(newBookedSlots));
        setBookedSlots(newBookedSlots);
        
      } catch (error) {
        console.error('❌ Failed to load booked slots:', error);
        setBookedSlots(new Map());
      }
    };

    loadBookedSlotsForWeek();
  }, [depart, viewStart, doctorsInDepartment]);

  // Generate weekly schedule from availabilities and booked slots
  const weeklySchedule = useMemo(() => {
    if (!depart) return [];
    return generateWeeklySchedule(viewStart, availabilities, bookedSlots);
  }, [depart, viewStart, availabilities, bookedSlots]);

  // Handle time slot selection from weekly calendar
  const handleTimeSlotClick = (date: Date, slot: TimeSlot) => {
    setSelectedDate(date);
    setSelectedTimeSlot(slot.time);
  };

  // Week navigation functions  
  const prevWeek = () => setViewStart(prev => {
    const newDate = new Date(prev);
    newDate.setDate(newDate.getDate() - 7);
    return newDate;
  });

  const nextWeek = () => setViewStart(prev => {
    const newDate = new Date(prev);
    newDate.setDate(newDate.getDate() + 7);
    return newDate;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const existingRaw = sessionStorage.getItem(DRAFT_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};

    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      ...existing,
      symptoms: symptoms,  // ✅ เก็บอาการจริง
      bookingType: bookingType,  // ✅ เก็บประเภทการจอง
      selectedDate: selectedDate?.toISOString(),
      selectedTime: selectedTimeSlot
    }));

    router.push('/patientForm');
  };

  const base =
    "w-full h-12 rounded-lg shadow-md p-2 text-left transition-all duration-200 cursor-pointer border-2";
  const active = "bg-emerald-100 border-emerald-500 ring-2 ring-emerald-200 text-emerald-800 font-semibold";
  const normal = "bg-white border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 text-gray-700";

  const morning = ["9:00-10:00", "10:00-11:00", "11:00-12:00"];
  const afternoon = ["12:00-13:00", "13:00-14:00", "14:00-15:00"];

  const handleSelect = (time: string) => {
    setSelectedTimeSlot(time);
    console.log("เวลาที่เลือก:", time);
  };

  const backButton = () =>{
    router.push("/depart");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-3">
            <Stethoscope className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">จองนัดหมายแพทย์</h1>
              <p className="text-green-100 mt-1">เลือกวันเวลาที่สะดวกสำหรับคุณ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Badge */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-full shadow-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <p className="font-bold text-lg">แผนก{depart}</p>
        </div>

        {/* ✅ Show booking type badge */}
        {bookingType && (
          <div className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg ml-4">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <p className="font-bold text-lg">
              {bookingType === 'auto' ? 'โหมด: เลือกแพทย์ให้ฉัน' : 'โหมด: เลือกแพทย์เอง'}
            </p>
          </div>
        )}

        {/* Doctor Info Display */}
        {bookingType === 'auto' && (
          <div className="mt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-700 font-medium">โรงพยาบาลจะจัดแพทย์ให้ onsite</p>
                  <p className="text-green-800 font-bold">แพทย์: -</p>
                  <p className="text-sm text-green-600">เลือกช่วงเวลาที่ว่างเพื่อจองนัดหมาย</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-emerald-100 p-8">
          {/* Weekly Calendar - Like DocInfoAndBooking */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-emerald-500 text-white">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900">เลือกวันและเวลาที่ต้องการ</h3>
            </div>

            <div className="pl-11">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="button"
                    onClick={prevWeek}
                    className="p-2.5 rounded-lg hover:bg-white text-gray-700 border-2 border-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="text-center">
                    <h4 className="text-lg font-bold text-emerald-800">
                      {viewStart.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                    </h4>
                    <p className="text-sm text-emerald-600 font-medium">
                      {viewStart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {' '}
                      {new Date(viewStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={nextWeek}
                    className="p-2.5 rounded-lg hover:bg-white text-gray-700 border-2 border-gray-300 hover:border-emerald-400 hover:text-emerald-600 transition-all"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Loading State */}
                {loadingAvailability ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                    <p className="text-emerald-600 mt-4 font-medium">กำลังโหลดตารางเวลาว่าง...</p>
                  </div>
                ) : (
                  /* Schedule Grid */
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

                                // Show only available slots
                                if (!slot.available || slotStatus !== 'available') {
                                  return null;
                                }

                                return (
                                  <button
                                    key={slotIndex}
                                    type="button"
                                    onClick={() => handleTimeSlotClick(dayData.dateObj, slot)}
                                    className={`w-full px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                                      isPicked
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-2 border-emerald-200 hover:border-emerald-400'
                                    }`}
                                    title="ว่าง - สามารถจองได้"
                                  >
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span>{slot.time}</span>
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
                )}
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <input type="hidden" name="depart" value={depart} />
            <input type="hidden" name="time" value={selectedTimeSlot ?? ""} />
            <input type="hidden" name="date" value={selectedDate?.toISOString() ?? ""} />

            {/* ✅ Symptom Input - ใช้ symptoms แทน illness */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-800">อาการและปัญหาสุขภาพ</label>
              </div>
              <textarea
                key="symptoms-textarea" 
                name="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-white/90 backdrop-blur-sm"
                placeholder="กรุณาระบุอาการและปัญหาสุขภาพของคุณโดยละเอียด..."
                autoComplete="off"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-emerald-100">
              <button 
                type="button" 
                onClick={backButton}
                className="flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
              >
                <ArrowLeft className="w-5 h-5" />
                กลับ
              </button>
              
              <button
                type="submit"
                disabled={!selectedTimeSlot || !selectedDate}  // ✅ ตรวจสอบแค่เวลาและวันที่
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg font-semibold ${
                  !selectedTimeSlot || !selectedDate
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                ต่อไป
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-700 font-medium">กำลังโหลด...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}