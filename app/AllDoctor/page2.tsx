"use client"

import Navbar from "@/components/Navbar";
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

// Navbar component
// Calendar component (simplified version based on your Schedule.tsx)
function Calendar({ onChange }: { onChange?: (d: Date | undefined) => void }) {
  // ตั้งค่าเริ่มต้นเป็นวันถัดไป
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const [date, setDate] = useState<Date | undefined>(tomorrow)

  const handleSelect = (d: Date | undefined) => {
    setDate(d)
    onChange?.(d)
  }

  // สร้างวันที่ขั้นต่ำ (วันถัดไป) ในรูปแบบ YYYY-MM-DD
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateString = minDate.toISOString().split('T')[0]

  return (
    <div className="p-4 border rounded-lg bg-white">
      <input
        type="date"
        value={date?.toISOString().split('T')[0] || ''}
        min={minDateString}
        onChange={(e) => handleSelect(new Date(e.target.value))}
        className="w-full p-2 border rounded"
      />
    </div>
  )
}

// Mock data
interface Doctor {
  id: number
  name: string
  department: string
  image?: string
  gender: 'ชาย' | 'หญิง'
  availableTimes: string[]
  nextAvailableTime?: string
  availableDates: string[] // เพิ่มวันที่ที่ว่าง
}

// สร้างวันที่สำหรับจำลอง (7 วันข้างหน้า)
const generateAvailableDates = () => {
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

// สุ่มวันที่ว่างสำหรับแต่ละหมอ
const getRandomDates = () => {
  const allDates = generateAvailableDates()
  const numDates = Math.floor(Math.random() * 4) + 2 // 2-5 วัน
  return allDates.sort(() => 0.5 - Math.random()).slice(0, numDates).sort()
}

const mockDoctors: Doctor[] = [
  { 
    id: 1, 
    name: "นพ. กฤต อินทรจินดา", 
    department: "กระดูกและข้อ",
    gender: "ชาย",
    availableTimes: ["9:00-10:00", "10:00-11:00", "13:00-14:00"],
    nextAvailableTime: "9:00-10:00",
    availableDates: getRandomDates()
  },
  { 
    id: 2, 
    name: "นพ.รีโม", 
    department: "หัวใจและทรวงอก",
    gender: "ชาย", 
    availableTimes: ["10:00-11:00", "14:00-15:00"],
    nextAvailableTime: "10:00-11:00",
    availableDates: getRandomDates()
  },
  { 
    id: 3, 
    name: "นพ.อิง", 
    department: "นรีเวชกรรม",
    gender: "หญิง",
    availableTimes: ["11:00-12:00", "15:00-16:00"],
    nextAvailableTime: "11:00-12:00",
    availableDates: getRandomDates()
  },
  { 
    id: 4, 
    name: "นพ.ก้อง", 
    department: "กุมารเวชกรรม",
    gender: "ชาย",
    availableTimes: ["9:00-10:00", "12:00-13:00"],
    nextAvailableTime: "12:00-13:00",
    availableDates: getRandomDates()
  },
  { 
    id: 5, 
    name: "นพ.ฟิล์ม", 
    department: "กุมารเวชกรรม",
    gender: "ชาย",
    availableTimes: ["9:00-10:00", "12:00-13:00"],
    nextAvailableTime: "12:00-13:00",
    availableDates: getRandomDates()
  },

  ...Array.from({length: 20}, (_, i) => ({
    id: i + 6,
    name: `นพ. ทดสอบ ${i + 1}`,
    department: "ศัลยกรรมทั่วไป",
    gender: Math.random() > 0.5 ? "ชาย" as const : "หญิง" as const,
    availableTimes: ["9:00-10:00", "10:00-11:00"],
    nextAvailableTime: "9:00-10:00",
    availableDates: getRandomDates()
  }))
]

const departments = [
  "กระดูกและข้อ","กุมารเวชกรรม","นรีเวชกรรม","ผิวหนัง",
  "ศัลยกรรมตกแต่ง","ศัลยกรรมทั่วไป","สุขภาพเพศชาย","สมองและไขสันหลัง",
  "หลอดเลือด","หัวใจและทรวงอก","ศัลยกรรมเด็ก","มะเร็งเต้านม","สุขภาพจิต","บุคคลข้ามเพศ","หู คอ จมูก","เวชศาสตร์นิวเคลียร์","โรคหัวใจ"
]

const timeSlots = {
  morning: ["9:00-10:00", "10:00-11:00", "11:00-12:00"],
  afternoon: ["12:00-13:00", "13:00-14:00", "14:00-15:00"]
}

export default function DoctorSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [selectedGender, setSelectedGender] = useState<'ชาย' | 'หญิง' | ''>('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow
  })
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [doctorAvailable, setDoctorAvailable] = useState(false)
  
  // Applied filter states (จะใช้ในการกรองข้อมูลจริง)
  const [appliedFilters, setAppliedFilters] = useState({
    gender: '',
    time: '',
    date: (() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    })(),
    department: '',
    available: false
  })
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const doctorsPerPage = 12 // 4*3
  
  // Get department from URL parameter (from /depart page)
  useEffect(() => {
    const department = searchParams.get('depart')
    if (department) {
      setSelectedDepartment(department)
      setAppliedFilters(prev => ({ ...prev, department }))
    }
  }, [searchParams])

  // Filter doctors based on applied filters
  const filteredDoctors = mockDoctors.filter(doctor => {
    const matchesSearch = searchTerm === '' || 
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGender = appliedFilters.gender === '' || doctor.gender === appliedFilters.gender
    const matchesDepartment = appliedFilters.department === '' || doctor.department === appliedFilters.department
    const matchesTime = appliedFilters.time === '' || doctor.availableTimes.includes(appliedFilters.time)
    const matchesDate = appliedFilters.date === '' || doctor.availableDates.includes(appliedFilters.date)
    const matchesAvailable = !appliedFilters.available || doctor.nextAvailableTime !== undefined

    return matchesSearch && matchesGender && matchesDepartment && matchesTime && matchesDate && matchesAvailable
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage)
  const currentDoctors = filteredDoctors.slice(
    (currentPage - 1) * doctorsPerPage,
    currentPage * doctorsPerPage
  )

  // Time slot styles (from /booking page)
  const base = "w-full h-12 rounded-md shadow p-2 text-left transition-colors duration-150 cursor-pointer"
  const active = "bg-sky-100 border border-sky-400 ring-1 ring-sky-400"
  const normal = "hover:bg-sky-200"

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time === selectedTime ? '' : time)
  }

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page when searching
  }

  // ฟังก์ชันสำหรับใช้ตัวกรอง
  const applyFilters = () => {
    setAppliedFilters({
      gender: selectedGender,
      time: selectedTime,
      date: selectedDate?.toISOString().split('T')[0] || '',
      department: selectedDepartment,
      available: doctorAvailable
    })
    setCurrentPage(1) // Reset to first page when applying filters
  }

  // ฟังก์ชันสำหรับรีเซ็ตตัวกรอง
  const resetFilters = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    setSelectedGender('')
    setSelectedTime('')
    setSelectedDate(tomorrow)
    // ไม่รีเซ็ต selectedDepartment เพราะอาจมาจาก URL
    setDoctorAvailable(false)
    setAppliedFilters({
      gender: '',
      time: '',
      date: tomorrow.toISOString().split('T')[0],
      department: selectedDepartment, // เก็บแผนกที่เลือกจาก URL
      available: false
    })
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Logo Section */}
      <div className="bg-white px-6 py-4 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Logo</h1>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="ค้นหาแพทย์ ชื่อ, ความชำนาญ, ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Search Button */}
            <button 
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Filter Toggle Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-3 rounded-md transition-colors"
            >
              ตัวกรอง
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
              {/* Gender Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เพศ</label>
                <select 
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value as 'ชาย' | 'หญิง' | '')}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">แผนก</label>
                <select 
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ทั้งหมด</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Time Slots Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">เวลา</label>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">ช่วงเช้า</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.morning.map(time => (
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
                      {timeSlots.afternoon.map(time => (
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

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
                <Calendar onChange={setSelectedDate} />
              </div>

              {/* Doctor Available Checkbox */}
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

              {/* Filter Action Buttons */}
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

        {/* Department Selection Display */}
        <div className="mb-6">
          <button className="bg-blue-400 text-white px-4 py-2 rounded-md text-sm transition-colors">
            {appliedFilters.department ? appliedFilters.department : 'ทั้งหมด'}
          </button>
        </div>

        {/* Applied Filters Display */}
        {(appliedFilters.gender || appliedFilters.time || appliedFilters.available) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">ตัวกรองที่ใช้:</h3>
            <div className="flex flex-wrap gap-2">
              {appliedFilters.gender && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  เพศ: {appliedFilters.gender}
                </span>
              )}
              {appliedFilters.time && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  เวลา: {appliedFilters.time}
                </span>
              )}
              {appliedFilters.date && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  วันที่: {new Date(appliedFilters.date).toLocaleDateString('th-TH')}
                </span>
              )}
              {appliedFilters.available && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  แพทย์พร้อมนัด
                </span>
              )}
            </div>
          </div>
        )}

        {/* Doctor Cards Grid */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="max-h-[800px] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentDoctors.map(doctor => (
                <div key={doctor.id} className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                  {/* Doctor Avatar */}
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Doctor Info */}
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{doctor.name}</h3>
                    <p className="text-sm text-gray-600">{doctor.department}</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => router.push(`/DocInfoAndBooking/${doctor.id}`)}
                      className="flex-1 bg-teal-100 text-teal-700 px-3 py-2 rounded text-sm font-medium hover:bg-teal-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      นัดหมาย
                    </button>

                    <button 
                      onClick={() => router.push(`/DocInfoAndBooking/${doctor.id}`)}
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
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            หน้า {currentPage} จาก {totalPages}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Page Numbers */}
            <div className="flex space-x-1">
              {Array.from({length: Math.min(4, totalPages)}, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded ${
                    currentPage === pageNum 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            
            {/* Navigation Buttons */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &lt; ก่อนหน้า
            </button>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              หน้าต่อไป &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}