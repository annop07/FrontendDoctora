'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth-service';
import { DoctorService, DoctorAppointment } from '@/lib/doctor-service';
import { AppointmentService, PatientBookingInfoResponse } from '@/lib/appointment-service';
import Navbar from '@/components/Navbar';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  X as CloseIcon,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function DoctorCalendarPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null);
  const [selectedPatientInfo, setSelectedPatientInfo] = useState<PatientBookingInfoResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingPatientInfo, setLoadingPatientInfo] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        if (!user || user.role !== 'DOCTOR') {
          router.push('/login');
          return;
        }
        await fetchAppointments();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { appointments: data } = await DoctorService.getMyAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPatientInfo = async (appointment: DoctorAppointment) => {
    try {
      setLoadingPatientInfo(true);
      const patientInfo = await AppointmentService.getPatientBookingInfo(appointment.id);
      setSelectedPatientInfo(patientInfo);
      setSelectedAppointment(appointment);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error loading patient info:', err);
      alert('ไม่สามารถโหลดข้อมูลผู้ป่วยได้');
    } finally {
      setLoadingPatientInfo(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
    setSelectedPatientInfo(null);
  };

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    // Convert Sunday (0) to 7 for Thai calendar (Mon-Sun)
    return firstDay === 0 ? 7 : firstDay;
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day (Mon = 1, Sun = 7)
    for (let i = 1; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getAppointmentsForDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDatetime);
      return (
        aptDate.getFullYear() === year &&
        aptDate.getMonth() === month &&
        aptDate.getDate() === day
      );
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const dayNames = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดปฏิทิน...</p>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/doctor-dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">กลับ</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              ปฏิทินนัดหมาย
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <CloseIcon className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      )}

      {/* Calendar Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Calendar Header */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
              </h2>
              <button
                onClick={goToToday}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                วันนี้
              </button>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {dayNames.map((day, index) => (
              <div
                key={day}
                className={`text-center font-semibold text-sm py-1.5 ${
                  index === 6 ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-24" />;
              }

              const dayAppointments = getAppointmentsForDate(day);
              const isCurrentDay = isToday(day);
              const hasAppointments = dayAppointments.length > 0;

              return (
                <div
                  key={day}
                  className={`h-24 border rounded-md p-2 transition-all ${
                    isCurrentDay
                      ? 'border-blue-500 bg-blue-50'
                      : hasAppointments
                      ? 'border-gray-300 bg-white hover:border-gray-400'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="h-full flex flex-col">
                    <div className={`text-sm font-semibold mb-1 ${
                      isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      {dayAppointments.length > 0 ? (
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((apt) => (
                            <button
                              key={apt.id}
                              onClick={() => handleViewPatientInfo(apt)}
                              disabled={loadingPatientInfo}
                              className={`w-full text-left px-2 py-1 rounded text-xs truncate transition-colors ${
                                apt.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : apt.status === 'CONFIRMED'
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : apt.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              }`}
                            >
                              {new Date(apt.appointmentDatetime).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </button>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-[10px] text-gray-500 text-center font-medium">
                              +{dayAppointments.length - 2}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-3">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">สถานะนัดหมาย</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-xs text-gray-700">รอการยืนยัน</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-xs text-gray-700">ยืนยันแล้ว</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-xs text-gray-700">เสร็จสิ้น</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-xs text-gray-700">ยกเลิก</span>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info Modal */}
      {isModalOpen && selectedAppointment && selectedPatientInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">ข้อมูลผู้ป่วย</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Queue Number */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-600 mb-1">หมายเลขคิว</p>
                <p className="text-3xl font-bold text-blue-900">{selectedPatientInfo.queueNumber}</p>
              </div>

              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">
                  ข้อมูลส่วนตัว
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">คำนำหน้า</p>
                    <p className="font-medium text-gray-900">{selectedPatientInfo.patientPrefix || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">ชื่อ-นามสกุล</p>
                    <p className="font-medium text-gray-900">{selectedPatientInfo.patientFullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">เพศ</p>
                    <p className="font-medium text-gray-900">
                      {selectedPatientInfo.patientGender === 'MALE' ? 'ชาย' :
                       selectedPatientInfo.patientGender === 'FEMALE' ? 'หญิง' : 'อื่นๆ'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">วันเกิด</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedPatientInfo.patientDateOfBirth).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">สัญชาติ</p>
                    <p className="font-medium text-gray-900">{selectedPatientInfo.patientNationality}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">เลขบัตรประชาชน</p>
                    <p className="font-medium text-gray-900">{selectedPatientInfo.patientCitizenId || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">
                  ข้อมูลติดต่อ
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">เบอร์โทรศัพท์</p>
                    <p className="font-medium text-gray-900">{selectedPatientInfo.patientPhone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">อีเมล</p>
                    <p className="font-medium text-gray-900">{selectedPatientInfo.patientEmail}</p>
                  </div>
                </div>
              </div>

              {/* Symptoms */}
              {selectedPatientInfo.symptoms && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">
                    อาการ
                  </h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedPatientInfo.symptoms}
                  </p>
                </div>
              )}

              {/* Booking Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">
                  ข้อมูลการจอง
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">ประเภทการจอง</p>
                    <p className="font-medium text-gray-900">
                      {selectedPatientInfo.bookingType === 'auto' ? 'จองอัตโนมัติ' : 'เลือกหมอเอง'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">เวลาที่จอง</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedPatientInfo.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}