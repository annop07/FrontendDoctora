"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react"; 
import { Slot } from "@radix-ui/react-slot"
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

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [depart,setDepart] = useState<string>(searchParams.get("depart") ?? "");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [illness,setIllness] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(false);
  const [doctorSelectionError, setDoctorSelectionError] = useState<string | null>(null);
  const previousDateRef = useRef<Date | null>(null);

  //เก็บstateตอนกดกลับจากหน้า patientForm
  const selectionParam = searchParams.get("selection");

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const stored = raw ? JSON.parse(raw) : {};

    if (!depart && stored.depart) setDepart(stored.depart);
    if (!selectedTime && stored.selectedTime) setSelectedTime(stored.selectedTime);
    if (!selectedDate && stored.selectedDate) setSelectedDate(new Date(stored.selectedDate));

    if (!illness && stored.illness) {
      setIllness(stored.illness);
    } else if (!stored.illness && selectionParam) {
      setIllness(selectionParam);
    }
  }, [depart, selectedTime, selectedDate, illness, selectionParam]);

  // Auto select doctor when illness is 'auto' - ใช้ Smart Selection API
  useEffect(() => {
    const autoSelectDoctor = async () => {
      // เช็คว่าวันที่เปลี่ยนหรือไม่
      const dateChanged = selectedDate !== previousDateRef.current;

      // ✅ รอให้ผู้ใช้เลือกวันที่ก่อน และเลือกใหม่เมื่อวันที่เปลี่ยน
      if (illness === 'auto' && depart && selectedDate && dateChanged && !isLoadingDoctor) {
        // บันทึกวันที่ปัจจุบัน
        previousDateRef.current = selectedDate;

        // เคลียร์ state เก่า
        setSelectedDoctor(null);
        setDoctorSelectionError(null);
        setIsLoadingDoctor(true);
        try {
          console.log('🎯 [Auto Select] Calling smart-select API for specialty:', depart);
          console.log('🎯 [Auto Select] Selected date:', selectedDate);

          // Build URL with date parameter (required for auto mode)
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;

          let url = `http://localhost:8082/api/doctors/smart-select?specialty=${encodeURIComponent(depart)}&date=${dateString}`;
          console.log('🎯 [Auto Select] Using date for availability check:', dateString);

          // เรียก Smart Selection API ใหม่
          const response = await fetch(url);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ [Auto Select] Response:', data);

            if (data.doctor) {
              // ระบบเลือกแพทย์ให้แล้ว
              setSelectedDoctor(data.doctor);
              setDoctorSelectionError(null); // เคลียร์ error

              // บันทึกลง sessionStorage
              const existingRaw = sessionStorage.getItem(DRAFT_KEY);
              const existing = existingRaw ? JSON.parse(existingRaw) : {};
              sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
                ...existing,
                selectedDoctor: data.doctor.doctorName,
                selectedDoctorId: data.doctor.id
              }));

              console.log(`🎯 [Auto Select] Selected: ${data.doctor.doctorName} (ID: ${data.doctor.id})`);
            } else {
              // ไม่มีแพทย์ว่างในวันที่เลือก
              console.warn('⚠️ [Auto Select] No doctor available:', data.message);
              setSelectedDoctor(null);
              setDoctorSelectionError(data.message || 'ไม่มีแพทย์ว่างในวันที่เลือก');
            }
          } else {
            console.error('❌ [Auto Select] API error:', response.status);
            setDoctorSelectionError('เกิดข้อผิดพลาดในการเลือกแพทย์');
          }
        } catch (error) {
          console.error('❌ [Auto Select] Error:', error);
          setDoctorSelectionError('ไม่สามารถเชื่อมต่อกับระบบได้');
        } finally {
          setIsLoadingDoctor(false);
        }
      }
    };

    autoSelectDoctor();
  }, [illness, depart, isLoadingDoctor, selectedDate]); // ลบ selectedDoctor ออก!

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
            illness,
        })
    );
  }, [depart,selectedTime,selectedDate,illness]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // บันทึกข้อมูลลง sessionStorage
    const existingRaw = sessionStorage.getItem(DRAFT_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};

    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      ...existing,
      symptoms: illness,
      selectedDate: selectedDate?.toISOString(),
      selectedTime: selectedTime
    }));

    // ไปหน้าถัดไป
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

        {/* Auto Selected Doctor Display */}
        {illness === 'auto' && (
          <div className="mt-6">
            {isLoadingDoctor ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-blue-700 font-medium">กำลังเลือกแพทย์ที่เหมาะสมให้คุณ...</p>
                </div>
              </div>
            ) : doctorSelectionError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">ไม่สามารถเลือกแพทย์ได้</p>
                    <p className="text-sm text-red-700 mt-1">{doctorSelectionError}</p>
                    <p className="text-xs text-red-600 mt-2">💡 แนะนำ: ลองเปลี่ยนวันที่อื่นหรือเลือกโหมด "เลือกแพทย์เอง"</p>
                  </div>
                </div>
              </div>
            ) : selectedDoctor ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-green-700 font-medium">แพทย์ที่ระบบเลือกให้คุณ:</p>
                    <p className="text-green-800 font-bold">{selectedDoctor.doctorName}</p>
                    <p className="text-sm text-green-600">ห้อง {selectedDoctor.roomNumber} • ค่าตรวจ {selectedDoctor.consultationFee} บาท</p>
                  </div>
                </div>
              </div>
            ) : !selectedDate ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                <p className="text-blue-700 font-medium">📅 กรุณาเลือกวันที่เพื่อค้นหาแพทย์ที่ว่าง</p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md">
                <p className="text-amber-700 font-medium">ไม่พบแพทย์ในแผนกนี้ กรุณาเลือกแผนกอื่น</p>
              </div>
            )}
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

            {/* Symptom Input */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-800">อาการและปัญหาสุขภาพ</label>
              </div>
              <textarea
                 name="illness"
                value={illness === "auto" ? "" : illness}
                onChange={(e) => setIllness(e.target.value)}
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
                disabled={
                  illness === 'auto' && (
                    isLoadingDoctor ||
                    doctorSelectionError !== null ||
                    !selectedDoctor
                  )
                }
                title={
                  illness === 'auto' && (isLoadingDoctor || doctorSelectionError !== null || !selectedDoctor)
                    ? 'กรุณารอให้ระบบเลือกแพทย์ หรือเปลี่ยนวันที่อื่น'
                    : ''
                }
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg font-semibold ${
                  illness === 'auto' && (isLoadingDoctor || doctorSelectionError !== null || !selectedDoctor)
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
