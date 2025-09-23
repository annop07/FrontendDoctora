"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  const base = "w-full h-12 rounded-md shadow p-2 text-left transition-colors duration-150 cursor-pointer";
  const active = "bg-sky-100 border border-sky-400 ring-1 ring-sky-400";
  const normal = "hover:bg-sky-200";
  const handleTimeSelect = (time: string) => setSelectedTime(time === selectedTime ? "" : time);
  const handleSearch = () => setCurrentPage(1);

  const applyFilters = () => {
    setAppliedFilters({
      gender: selectedGender,
      time: selectedTime,
      date: selectedDate ? selectedDate.toISOString().split("T")[0] : "",
      department: selectedDepartment,
      available: doctorAvailable
    });
    setCurrentPage(1);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-6 py-6">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <input
                type="text"
                placeholder="ค้นหาแพทย์ ชื่อ, ความชำนาญ, ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              ค้นหา
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-3 rounded-md transition-colors"
            >
              ตัวกรอง
            </button>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เพศ</label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value as "ชาย" | "หญิง" | "")}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">แผนก</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ทั้งหมด</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เวลา</label>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">ช่วงเช้า</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.morning.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`${base} ${selectedTime === time ? active : normal}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">ช่วงบ่าย</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.afternoon.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`${base} ${selectedTime === time ? active : normal}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
                <Calendar onChange={setSelectedDate} />
              </div>

              {/* Available */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={doctorAvailable}
                    onChange={(e) => setDoctorAvailable(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">แพทย์พร้อมนัด</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={applyFilters}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors font-medium"
                >
                  ใช้ตัวกรอง
                </button>
                <button
                  onClick={resetFilters}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md transition-colors font-medium"
                >
                  รีเซ็ต
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Department badge */}
        <div className="mb-6">
          <button className="bg-blue-400 text-white px-4 py-2 rounded-md text-sm transition-colors">
            {appliedFilters.department ? appliedFilters.department : "ทั้งหมด"}
          </button>
        </div>

        {/* Applied filters */}
        {(appliedFilters.gender || appliedFilters.time || appliedFilters.available || appliedFilters.date) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">ตัวกรองที่ใช้:</h3>
            <div className="flex flex-wrap gap-2">
              {appliedFilters.gender && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">เพศ: {appliedFilters.gender}</span>
              )}
              {appliedFilters.time && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">เวลา: {appliedFilters.time}</span>
              )}
              {appliedFilters.date && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  วันที่:{" "}
                  {new Date(appliedFilters.date).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
                </span>
              )}
              {appliedFilters.available && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">แพทย์พร้อมนัด</span>
              )}
            </div>
          </div>
        )}

        {/* Doctors grid */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="max-h-[800px] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentDoctors.map((doctor) => (
                <div key={doctor.id} className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{doctor.name}</h3>
                    <p className="text-sm text-gray-600">{doctor.department}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>  goDoc(doctor, "booking")}
                      className="flex-1 bg-teal-100 text-teal-700 px-3 py-2 rounded text-sm font-medium hover:bg-teal-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      นัดหมาย
                    </button>

                    <button
                      onClick={() => goDoc(doctor, "detail")}
                      className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      รายละเอียด
                    </button>
                  </div>
                </div>
              ))}
              {currentDoctors.length === 0 && (
                <div className="col-span-full text-center text-gray-600">ไม่พบแพทย์ที่ตรงกับตัวกรอง</div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">หน้า {currentPage} จาก {totalPages}</div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(4, totalPages) }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded ${
                    currentPage === pageNum ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } transition-colors`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &lt; ก่อนหน้า
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              หน้าต่อไป &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
