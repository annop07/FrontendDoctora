"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Calendar as CalendarIcon, Clock, User, Stethoscope, Building, CheckCircle, Sun, Settings, RotateCcw, ArrowLeft, ArrowRight, Sunset } from "lucide-react";

/** ==================== Calendar (client-only, no SSR time drift) ==================== */
function Calendar({ onChange }: { onChange?: (d: Date | undefined) => void }) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [minDateString, setMinDateString] = useState<string>("");

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow);
    const min = new Date();
    min.setDate(min.getDate() + 1);
    setMinDateString(min.toISOString().split("T")[0]);
  }, []);

  const handleSelect = (d: Date | undefined) => {
    setDate(d);
    onChange?.(d);
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <input
        type="date"
        value={date ? date.toISOString().split("T")[0] : ""}
        min={minDateString || undefined}
        onChange={(e) => handleSelect(e.target.value ? new Date(e.target.value) : undefined)}
        className="w-full p-2 border rounded"
      />
    </div>
  );
}

/** ==================== Types ==================== */
interface Doctor {
  id: number;
  name: string;
  department: string;
  gender: "ชาย" | "หญิง";
  education: string;     // เพิ่ม
  languages: string[];   // เพิ่ม
  availableTimes: string[];
  nextAvailableTime?: string;
  availableDates: string[];
}

/** ==================== Static catalogs ==================== */
const departments = [
  "กระดูกและข้อ", "กุมารเวชกรรม", "นรีเวชกรรม", "ผิวหนัง",
  "ศัลยกรรมตกแต่ง", "ศัลยกรรมทั่วไป", "สุขภาพเพศชาย", "สมองและไขสันหลัง",
  "หลอดเลือด", "หัวใจและทรวงอก", "ศัลยกรรมเด็ก", "มะเร็งเต้านม", "สุขภาพจิต",
  "บุคคลข้ามเพศ", "หู คอ จมูก", "เวชศาสตร์นิวเคลียร์", "โรคหัวใจ"
];

const timeSlots = {
  morning: ["9:00-10:00", "10:00-11:00", "11:00-12:00"],
  afternoon: ["12:00-13:00", "13:00-14:00", "14:00-15:00"]
};

/** ==================== Helpers: deterministic date generation ==================== */
// ใช้ pattern คงที่ (ไม่สุ่ม) เพื่อตัดปัญหา hydration
// 1) ฟังก์ชันวันที่: เริ่มที่ "พรุ่งนี้"
function buildUpcomingDates(days = 7) {
  const out: string[] = [];
  const base = new Date();
  base.setDate(base.getDate() + 1); // เริ่มจากพรุ่งนี้
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
}

function pickDatesDeterministic(all: string[], pickEvery = 2) {
  return all.filter((_, idx) => idx % pickEvery === 0);
}

/** ==================== Page ==================== */
export default function DoctorSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /** -------- Search & filters (UI state) -------- */
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedGender, setSelectedGender] = useState<"ชาย" | "หญิง" | "">("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [doctorAvailable, setDoctorAvailable] = useState(false);

  /** -------- Applied filters (actual) -------- */
  const [appliedFilters, setAppliedFilters] = useState({
    gender: "",
    time: "",
    date: "",         // จะถูกตั้งหลัง mount
    department: "",
    available: false
  });

  /** -------- Pagination -------- */
  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 12;

  /** -------- Build doctors list (deterministic, no Math.random) -------- */
  // สร้างแพทย์ "โครง" แบบคงที่ ไม่ใช้วันที่/เวลา ณ โมดูลท็อปเลเวล
  const baseDoctors: Doctor[] = useMemo(() => {
    const basics: Doctor[] = [
      {
        id: 1,
        name: "นพ. กฤต อินทรจินดา",
        department: "กระดูกและข้อ",
        gender: "ชาย",
        education: "MD, Orthopedics — KKU",
        languages: ["ไทย", "อังกฤษ"],
        availableTimes: ["9:00-10:00", "10:00-11:00", "13:00-14:00"],
        nextAvailableTime: "9:00-10:00",
        availableDates: []
      },
      {
        id: 2,
        name: "นพ.รีโม",
        department: "หัวใจและทรวงอก",
        gender: "ชาย",
        education: "MD, Cardiothoracic — CMU",
        languages: ["ไทย"],
        availableTimes: ["10:00-11:00", "14:00-15:00"],
        nextAvailableTime: "10:00-11:00",
        availableDates: []
      },
      {
        id: 3,
        name: "นพ.อิง",
        department: "นรีเวชกรรม",
        gender: "หญิง",
        education: "MD, OB-GYN — PSU",
        languages: ["ไทย", "อังกฤษ"],
        availableTimes: ["11:00-12:00", "15:00-16:00"],
        nextAvailableTime: "11:00-12:00",
        availableDates: []
      },
      {
        id: 4,
        name: "นพ.ก้อง",
        department: "กุมารเวชกรรม",
        gender: "ชาย",
        education: "MD, Pediatrics — KKU",
        languages: ["ไทย"],
        availableTimes: ["9:00-10:00", "12:00-13:00"],
        nextAvailableTime: "12:00-13:00",
        availableDates: []
      },
      {
        id: 5,
        name: "นพ.ฟิล์ม",
        department: "กุมารเวชกรรม",
        gender: "ชาย",
        education: "MD, Pediatrics — KU",
        languages: ["ไทย", "อังกฤษ"],
        availableTimes: ["9:00-10:00", "12:00-13:00"],
        nextAvailableTime: "12:00-13:00",
        availableDates: []
      }
    ];

    // เติมรายการแบบกำหนดเพศคงที่ (ไม่ใช้ Math.random)
    const more: Doctor[] = Array.from({ length: 20 }, (_, i) => ({
      id: i + 6,
      name: `นพ. ทดสอบ ${i + 1}`,
      department: "ศัลยกรรมทั่วไป",
      gender: i % 2 === 0 ? ("ชาย" as const) : ("หญิง" as const),
      education: i % 2 === 0 ? "MD, General Surgery — KKU" : "MD, General Surgery — CMU",
      languages: i % 3 === 0 ? ["ไทย", "อังกฤษ"] : ["ไทย"],
      availableTimes: ["9:00-10:00", "10:00-11:00"],
      nextAvailableTime: "9:00-10:00",
      availableDates: []
    }));

    return [...basics, ...more];
  }, []);

  /** -------- Doctors (state with dates filled after mount) -------- */
  const [doctors, setDoctors] = useState<Doctor[]>(baseDoctors);

  useEffect(() => {
    // เติม availableDates แบบ deterministic หลัง mount (กัน SSR mismatch)
    const all = buildUpcomingDates(7);
    const patched = baseDoctors.map((d, idx) => ({
      ...d,
      availableDates: pickDatesDeterministic(all, (idx % 3) + 2) // สลับ pattern 2/3/4 วัน
    }));
    setDoctors(patched);

    // ตั้งค่า default date (พรุ่งนี้) สำหรับฟิลเตอร์
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
    setAppliedFilters((prev) => ({
      ...prev,
      date: tomorrow.toISOString().split("T")[0]
    }));
  }, [baseDoctors]);

  /** -------- read department from URL -------- */
  useEffect(() => {
    const department = searchParams.get("depart");
    if (department) {
      setSelectedDepartment(department);
      setAppliedFilters((prev) => ({ ...prev, department }));
    }
  }, [searchParams]);

  /** -------- Filtering -------- */
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        searchTerm === "" ||
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGender = appliedFilters.gender === "" || doctor.gender === appliedFilters.gender;
      const matchesDepartment =
        appliedFilters.department === "" || doctor.department === appliedFilters.department;
      const matchesTime =
        appliedFilters.time === "" || doctor.availableTimes.includes(appliedFilters.time);
      const matchesDate =
        appliedFilters.date === "" || doctor.availableDates.includes(appliedFilters.date);
      const matchesAvailable = !appliedFilters.available || doctor.nextAvailableTime !== undefined;

      return (
        matchesSearch &&
        matchesGender &&
        matchesDepartment &&
        matchesTime &&
        matchesDate &&
        matchesAvailable
      );
    });
  }, [doctors, searchTerm, appliedFilters]);

  /** -------- Pagination -------- */
  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / doctorsPerPage));
  const currentDoctors = filteredDoctors.slice(
    (currentPage - 1) * doctorsPerPage,
    currentPage * doctorsPerPage
  );

  /** -------- UI helpers -------- */
  const handleTimeSelect = (time: string) => setSelectedTime(time === selectedTime ? "" : time);
  
  const handleSearch = () => {
    // เมื่อกดค้นหา ให้ใช้ตัวกรองที่มีอยู่ทันทีและรีเซ็ตไปหน้าแรก
    setAppliedFilters({
      gender: selectedGender,
      time: selectedTime,
      date: selectedDate ? selectedDate.toISOString().split("T")[0] : "",
      department: selectedDepartment,
      available: doctorAvailable
    });
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters({
      gender: selectedGender,
      time: selectedTime,
      date: selectedDate ? selectedDate.toISOString().split("T")[0] : "",
      department: selectedDepartment,
      available: doctorAvailable
    });
    setCurrentPage(1);
    setShowFilters(false); // ปิดช่องตัวกรองอัตโนมัติ
  };

  const resetFilters = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedGender("");
    setSelectedTime("");
    setSelectedDate(tomorrow);
    setDoctorAvailable(false);
    setAppliedFilters({
      gender: "",
      time: "",
      date: tomorrow.toISOString().split("T")[0],
      department: selectedDepartment,
      available: false
    });
    setCurrentPage(1);
  };

  /** -------- Routing with params -> /DocInfoAndBooking/[id] -------- */
// ปรับฟังก์ชัน
const goDoc = (d: Doctor, mode: "detail" | "booking") => {
  const q = new URLSearchParams({
    name: d.name,
    department: d.department,
    gender: d.gender,
    education: d.education,
    languages: d.languages.join(","),
  }).toString();

  const hash = mode === "booking" ? "#booking" : "";
  router.push(`/DocInfoAndBooking/${d.id}?${q}${hash}`);
};




  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Stethoscope className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            เลือกแพทย์ผู้เชี่ยวชาญ
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            ค้นหาและเลือกแพทย์ที่เหมาะสมกับความต้องการของคุณ พร้อมระบบจองนัดหมายที่สะดวกรวดเร็ว
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="ค้นหาแพทย์ ชื่อ, ความชำนาญ, แผนก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80"
              />
            </div>

            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-emerald-200"
            >
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">ค้นหา</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`${
                showFilters 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              } px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">ตัวกรอง</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-8 pt-6 border-t border-emerald-200 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">ตัวกรองการค้นหา</h3>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Gender */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    เพศ
                  </label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value as "ชาย" | "หญิง" | "")}
                    className="w-full rounded-xl border-2 border-emerald-200 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-white/80"
                  >
                    <option value="">เลือกเพศทั้งหมด</option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-600" />
                    ความชำนาญ
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full rounded-xl border-2 border-emerald-200 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-white/80"
                  >
                    <option value="">เลือกแผนกทั้งหมด</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Status */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={doctorAvailable}
                      onChange={(e) => setDoctorAvailable(e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <div className="flex items-center gap-2">   
                      <span className="text-sm font-medium text-gray-700">แพทย์พร้อมนัด</span>
 <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                  </label>
                </div>
              </div>

              {/* Time Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  เวลา
                </label>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-emerald-700 mb-3 flex items-center gap-1">
                      <Sun className="h-4 w-4" />
                      ช่วงเช้า
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {timeSlots.morning.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedTime === time
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-emerald-700 mb-3 flex items-center gap-1">
                      <Sunset className="h-4 w-4" />
                      ช่วงบ่าย
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {timeSlots.afternoon.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedTime === time
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  วันที่
                </label>
                <div className="bg-white/50 p-4 rounded-lg border border-emerald-200">
                  <Calendar onChange={setSelectedDate} />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-emerald-200">
                <button
                  onClick={applyFilters}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  ใช้ตัวกรอง
                </button>
                <button
                  onClick={resetFilters}
                  className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  รีเซ็ต
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Department badge */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md">
            <span>•</span>
            <span>{appliedFilters.department || "แผนกกระดูกและข้อ"}</span>
          </div>
        </div>

        {/* Applied filters */}
        {(appliedFilters.gender || appliedFilters.time || appliedFilters.available || appliedFilters.date) && (
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-emerald-800">ตัวกรองที่ใช้</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {appliedFilters.gender && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200 shadow-sm">
                  <User className="h-4 w-4" />
                  เพศ: {appliedFilters.gender}
                </span>
              )}
              {appliedFilters.time && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200 shadow-sm">
                  <Clock className="h-4 w-4" />
                  เวลา: {appliedFilters.time}
                </span>
              )}
              {appliedFilters.date && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200 shadow-sm">
                  <CalendarIcon className="h-4 w-4" />
                  วันที่: {new Date(appliedFilters.date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
                </span>
              )}
              {appliedFilters.available && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200 shadow-sm">
                  <CheckCircle className="h-4 w-4" />
                  แพทย์พร้อมนัด
                </span>
              )}
            </div>
          </div>
        )}

        {/* Doctors grid */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 mb-8">
          <div className="max-h-[800px] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentDoctors.map((doctor) => (
                <div 
                  key={doctor.id} 
                  className="group bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 border border-emerald-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 hover:scale-105"
                >
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-emerald-200">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Stethoscope className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-emerald-800 transition-colors">
                      {doctor.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <Building className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm text-gray-600 font-medium">{doctor.department}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => goDoc(doctor, "booking")}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-200"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">นัดหมาย</span>
                    </button>

                    <button
                      onClick={() => goDoc(doctor, "detail")}
                      className="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 hover:border-emerald-400 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">รายละเอียด</span>
                    </button>
                  </div>
                </div>
              ))}
              {currentDoctors.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-gray-600">
                      <h3 className="text-lg font-semibold mb-1">ไม่พบแพทย์ที่ตรงกับการค้นหา</h3>
                      <p className="text-sm">กรุณาลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 font-medium">
              แสดง {((currentPage - 1) * doctorsPerPage) + 1}-{Math.min(currentPage * doctorsPerPage, filteredDoctors.length)} จาก {filteredDoctors.length} แพทย์
              <span className="text-emerald-600 ml-1">(หน้า {currentPage} จาก {totalPages})</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                ก่อนหน้า
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                        currentPage === pageNum 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200" 
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-emerald-200"
              >
                หน้าต่อไป
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
