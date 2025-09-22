'use client';
import React, { useState, useEffect } from 'react';
import {
  Calendar, User, GraduationCap,
  Languages, Clock, Filter, ArrowLeft
} from 'lucide-react';

// Mock Data
const mockDoctors = [
  {
    id: 1,
    name: "นพ. กฤต อินทรจินดา",
    department: "กระดูกและข้อ",
    gender: "ชาย",
    education: "แพทยศาสตรดุษฎีบัณฑิต มหาวิทยาลัยมหิดล",
    languages: ["ไทย", "อังกฤษ"],
    specialties: "แพทย์เชี่ยวชาญด้านกระดูกและข้อ มีประสบการณ์ 15 ปี",
    availableTimes: ["9:00-10:00", "10:00-11:00", "13:00-14:00"],
    nextAvailableTime: "9:00-10:00",
    availableDates: ["2025-09-22", "2025-09-23", "2025-09-24", "2025-09-25"]
  },
  {
    id: 2,
    name: "นพ.รีโม",
    department: "หัวใจและทรวงอก",
    gender: "ชาย",
    education: "แพทยศาสตรดุษฎีบัณฑิต จุฬาลงกรณ์มหาวิทยาลัย",
    languages: ["ไทย", "อังกฤษ", "ญี่ปุ่น"],
    specialties: "แพทย์เชี่ยวชาญด้านหัวใจและทรวงอก ผู้เชี่ยวชาญการผ่าตัดหัวใจ",
    availableTimes: ["10:00-11:00", "14:00-15:00"],
    nextAvailableTime: "10:00-11:00",
    availableDates: ["2025-09-23", "2025-09-25", "2025-09-27"]
  },
  {
    id: 3,
    name: "นพ.อิง",
    department: "นรีเวชกรรม",
    gender: "หญิง",
    education: "แพทยศาสตรดุษฎีบัณฑิต มหาวิทยาลัยศิริราช",
    languages: ["ไทย", "อังกฤษ"],
    specialties: "แพทย์เชี่ยวชาญด้านนรีเวชกรรม การดูแลสุขภาพสตรี",
    availableTimes: ["11:00-12:00", "15:00-16:00"],
    nextAvailableTime: "11:00-12:00",
    availableDates: ["2025-09-24", "2025-09-26", "2025-09-28"]
  }
];

// Generate schedule
const generateScheduleForDoctor = (doctorId: number) => {
  const doctor = mockDoctors.find(d => d.id === doctorId);
  if (!doctor) return [];

  const schedule: any[] = [];
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    const slots = doctor.availableDates.includes(dateString)
      ? doctor.availableTimes.map((time, index) => ({
        id: `${doctorId}-${i}-${index}`,
        time,
        available: Math.random() > 0.3,
      }))
      : [];

    schedule.push({
      day: days[dayOfWeek],
      date: dateString,
      slots
    });
  }

  return schedule;
};

// Navbar
const Navbar = ({ onBack, title = "Doctora" }) => (
  <nav className="w-full bg-gradient-to-r from-teal-600 to-blue-600 shadow-lg px-6 py-4">
    <div className="flex items-center gap-4">
      {onBack && (
        <button onClick={onBack} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
      <span className="text-xl font-bold text-white">{title}</span>
    </div>
  </nav>
);

// Doctor Card
const DoctorCard = ({ doctor, onViewDetails, onBooking }) => (
  <div className="bg-white border rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
    <div className="flex justify-center mb-4">
      <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
        <User className="w-12 h-12 text-white" />
      </div>
    </div>
    <div className="text-center mb-4">
      <h3 className="font-semibold text-gray-900 mb-1 text-lg">{doctor.name}</h3>
      <p className="text-sm text-gray-600">{doctor.department}</p>
      {doctor.nextAvailableTime && (
        <div className="mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs inline-block">
          ว่าง {doctor.nextAvailableTime}
        </div>
      )}
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => onBooking(doctor)}
        className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-teal-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-1"
      >
        <Calendar className="w-4 h-4" /> นัดหมาย
      </button>
      <button
        onClick={() => onViewDetails(doctor)}
        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
      >
        <User className="w-4 h-4" /> รายละเอียด
      </button>
    </div>
  </div>
);

// Main App
const DoctorBookingApp = () => {
  const [currentPage, setCurrentPage] = useState<'search' | 'detail'>('search');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);

  const departments = ["กระดูกและข้อ", "หัวใจและทรวงอก", "นรีเวชกรรม", "กุมารเวชกรรม"];

  // init date
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // filter doctors
  const filteredDoctors = mockDoctors.filter(doctor => {
    const matchesSearch =
      searchTerm === '' ||
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGender = selectedGender === '' || doctor.gender === selectedGender;
    const matchesDepartment = selectedDepartment === '' || doctor.department === selectedDepartment;
    const matchesTime = !selectedTimeSlot || doctor.availableTimes.includes(selectedTimeSlot);
    const matchesDate = !selectedDate || doctor.availableDates.includes(selectedDate);
    const matchesAvailable = !onlyAvailable || doctor.nextAvailableTime !== null;

    return matchesSearch && matchesGender && matchesDepartment && matchesTime && matchesDate && matchesAvailable;
  });

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setWeeklySchedule(generateScheduleForDoctor(doctor.id));
    setCurrentPage('detail');
  };

  const handleBooking = (doctor) => {
    setSelectedDoctor(doctor);
    setWeeklySchedule(generateScheduleForDoctor(doctor.id));
    setCurrentPage('detail');
  };

  const handleBackToSearch = () => {
    setCurrentPage('search');
    setSelectedDoctor(null);
    setSelectedTimeSlot(null);
  };

  const resetFilters = () => {
    setSelectedGender('');
    setSelectedDepartment('');
    setSelectedTimeSlot(null);
    setOnlyAvailable(false);
    setSearchTerm('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  };

  // Search Page
  if (currentPage === 'search') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="ค้นหาแพทย์" />
        <div className="container mx-auto px-6 py-6">
          {/* Search Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="ค้นหาแพทย์ ชื่อ, ความชำนาญ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Filter className="w-5 h-5" /> ตัวกรอง
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เพศ</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">ทั้งหมด</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เวลา</label>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-600 mb-2">ช่วงเช้า</p>
                      <div className="flex flex-wrap gap-2">
                        {["9:00-10:00", "10:00-11:00", "11:00-12:00"].map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() =>
                              setSelectedTimeSlot(selectedTimeSlot === time ? null : time)
                            }
                            className={`px-4 py-2 rounded-lg border text-sm ${
                              selectedTimeSlot === time
                                ? "bg-teal-500 text-white border-teal-500"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-2">ช่วงบ่าย</p>
                      <div className="flex flex-wrap gap-2">
                        {["12:00-13:00", "13:00-14:00", "14:00-15:00"].map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() =>
                              setSelectedTimeSlot(selectedTimeSlot === time ? null : time)
                            }
                            className={`px-4 py-2 rounded-lg border text-sm ${
                              selectedTimeSlot === time
                                ? "bg-teal-500 text-white border-teal-500"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ready"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                  />
                  <label htmlFor="ready" className="text-sm text-gray-700">แพทย์พร้อมนัด</label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    ใช้ตัวกรอง
                  </button>
                  <button
                    onClick={resetFilters}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    รีเซ็ต
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                พบแพทย์ {filteredDoctors.length} คน
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onViewDetails={handleViewDetails}
                  onBooking={handleBooking}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detail Page
  if (currentPage === 'detail' && selectedDoctor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar onBack={handleBackToSearch} title="ข้อมูลแพทย์" />
        <div className="container mx-auto px-6 py-6 space-y-6">
          {/* Doctor Profile */}
          <div className="bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{selectedDoctor.name}</h1>
                <p className="text-xl opacity-90 mb-2">{selectedDoctor.department}</p>
                <p className="opacity-80">{selectedDoctor.specialties}</p>
              </div>
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">แผนก</h3>
              </div>
              <p className="font-medium text-gray-900">{selectedDoctor.department}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">การศึกษา</h3>
              </div>
              <p className="text-sm text-gray-600">{selectedDoctor.education}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <Languages className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">ภาษา</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedDoctor.languages.map((lang, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">{lang}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Booking */}
          <div className="bg-white rounded-xl shadow-md">
            <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-4 rounded-t-xl">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-6 h-6" /> การนัดเข้ารักษา - {selectedDoctor.name}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">เลือกวันที่ต้องการนัดหมาย</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> ตารางเวลาตรวจ (7 วันข้างหน้า)
                </h3>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-7 gap-2 min-w-full">
                    {weeklySchedule.map((dayData, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-teal-50 p-3 text-center border-b border-gray-200">
                          <div className="font-semibold text-gray-800 text-sm">{dayData.day}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {new Date(dayData.date).toLocaleDateString('th-TH', {
                              day: 'numeric', month: 'short'
                            })}
                          </div>
                        </div>
                        <div className="p-3 space-y-2 min-h-[200px]">
                          {dayData.slots && dayData.slots.length > 0 ? (
                            dayData.slots.map((slot, slotIndex) => (
                              <button
                                key={slotIndex}
                                disabled={!slot.available}
                                className={`w-full p-2 text-xs rounded-md border transition-all duration-200 ${
                                  !slot.available
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-teal-50 hover:border-teal-300'
                                }`}
                              >
                                {!slot.available ? 'เต็มแล้ว' : slot.time}
                              </button>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-xs text-gray-400 text-center">ไม่มีตารางตรวจ<br />ในวันนี้</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DoctorBookingApp;
