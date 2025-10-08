"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react"; 
import Schedule from "@/components/Schedule";
import { useRouter } from "next/navigation";
import { Clock, Calendar, FileText, ArrowLeft, ArrowRight, Stethoscope, User } from "lucide-react";

const DRAFT_KEY = "bookingDraft";

// Doctor interface
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

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [depart,setDepart] = useState<string>(searchParams.get("depart") ?? "");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // ✅ แยกเป็น 2 ตัวแปร
  const [bookingType, setBookingType] = useState<string>("");  // 'auto' หรือ 'manual'
  const [symptoms, setSymptoms] = useState("");  // อาการจริงๆ
  
  // ✅ ไม่ต้อง track doctor states เพราะใช้ UI เดียวกันทั้ง auto และ manual

  const selectionParam = searchParams.get("selection");

  // ✅ เก็บ state ตอนกดกลับจากหน้า patientForm
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const stored = raw ? JSON.parse(raw) : {};

    if (!depart && stored.depart) setDepart(stored.depart);
    if (!selectedTime && stored.selectedTime) setSelectedTime(stored.selectedTime);
    if (!selectedDate && stored.selectedDate) setSelectedDate(new Date(stored.selectedDate));

    // ✅ โหลด bookingType และ symptoms แยกกัน
    if (!bookingType && stored.bookingType) {
      setBookingType(stored.bookingType);
    } else if (!stored.bookingType && selectionParam) {
      setBookingType(selectionParam);
    }
    
    if (!symptoms && stored.symptoms) {
      setSymptoms(stored.symptoms);
    }
  }, [depart, selectedTime, selectedDate, bookingType, symptoms, selectionParam]);

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

  // ✅ บันทึกข้อมูลทั้ง bookingType และ symptoms
  useEffect(() => {
    const existingRaw = sessionStorage.getItem(DRAFT_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};

    sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
            ...existing,
            depart,
            selectedTime,
            selectedDate: selectedDate?.toISOString() ?? null,
            bookingType,  // ✅ เก็บ bookingType
            symptoms,     // ✅ เก็บอาการ
        })
    );
  }, [depart, selectedTime, selectedDate, bookingType, symptoms]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const existingRaw = sessionStorage.getItem(DRAFT_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};

    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      ...existing,
      symptoms: symptoms,  // ✅ เก็บอาการจริง
      bookingType: bookingType,  // ✅ เก็บประเภทการจอง
      selectedDate: selectedDate?.toISOString(),
      selectedTime: selectedTime
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
    setSelectedTime(time);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Calendar Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-800">เลือกวันที่</h2>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6">
                <Schedule onChange={(d)=> setSelectedDate(d ?? null)} />
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-800">เลือกเวลา</h2>
              </div>
              
              {/* Morning Times */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                  ช่วงเช้า
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {morning.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleSelect(time)}
                      className={`${base} ${
                        selectedTime === time ? active : normal
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Afternoon Times */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-6 border border-emerald-100">
                <h3 className="text-lg font-semibold text-teal-800 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
                  ช่วงบ่าย
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {afternoon.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleSelect(time)}
                      className={`${base} ${
                        selectedTime === time ? active : normal
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <input type="hidden" name="depart" value={depart} />
            <input type="hidden" name="time" value={selectedTime ?? ""} />
            <input type="hidden" name="date" value={selectedDate?.toISOString() ?? ""} />

            {/* ✅ Symptom Input - ใช้ symptoms แทน illness */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-800">อาการและปัญหาสุขภาพ</label>
              </div>
              <textarea
                name="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
                className="w-full p-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-white/90 backdrop-blur-sm"
                placeholder="กรุณาระบุอาการและปัญหาสุขภาพของคุณโดยละเอียด..."
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
                disabled={!selectedTime || !selectedDate}  // ✅ ตรวจสอบแค่เวลาและวันที่
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg font-semibold ${
                  !selectedTime || !selectedDate
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