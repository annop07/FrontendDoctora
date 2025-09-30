"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth-service';
import { DoctorService, DoctorProfile, DoctorAppointment, DoctorStats } from '@/lib/doctor-service';
import { AppointmentService } from '@/lib/appointment-service';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Calendar,
  Clock,
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Stethoscope,
  DollarSign,
  Award,
  CalendarClock,
  Check
} from 'lucide-react';

export default function DoctorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  useEffect(() => {
    // Check if user is logged in and is a doctor
    const checkAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        console.log('✅ Current user:', user);
        console.log('✅ User role:', user?.role);
        console.log('✅ Auth token:', AuthService.getToken()?.substring(0, 50) + '...');

        if (!user || user.role !== 'DOCTOR') {
          console.log('❌ Not a doctor or not logged in, redirecting...');
          console.log('❌ User:', user);
          router.push('/login');
          return;
        }

        console.log('✅ Doctor authenticated, fetching dashboard data...');
        fetchDashboardData();
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [profileData, appointmentsData, statsData] = await Promise.all([
        DoctorService.getMyProfile(),
        DoctorService.getMyAppointments(),
        DoctorService.getDoctorStats()
      ]);

      console.log('Dashboard Data Debug:');
      console.log('Profile:', profileData);
      console.log('Appointments:', appointmentsData);
      console.log('Stats:', statsData);

      setProfile(profileData);
      setAppointments(appointmentsData.appointments);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    router.push('/login');
  };

  const handleConfirmAppointment = async (appointmentId: number) => {
    console.log('🔵 Confirming appointment:', appointmentId);

    try {
      setConfirmingId(appointmentId);
      setError(null);

      console.log('🔵 Calling confirmAppointment API...');
      const result = await AppointmentService.confirmAppointment(appointmentId);
      console.log('✅ Appointment confirmed:', result);

      // Refresh dashboard data
      console.log('🔵 Refreshing dashboard data...');
      await fetchDashboardData();
      console.log('✅ Dashboard refreshed');

      alert('ยืนยันนัดหมายเรียบร้อยแล้ว');
    } catch (err) {
      console.error('❌ Error confirming appointment:', err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการยืนยันนัดหมาย';
      setError(errorMessage);
      alert('เกิดข้อผิดพลาด: ' + errorMessage);
    } finally {
      setConfirmingId(null);
      console.log('🔵 Confirm process finished');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const todayAppointments = appointments ? DoctorService.getTodayAppointments(appointments) : [];
  const upcomingAppointments = appointments ? DoctorService.getUpcomingAppointments(appointments) : [];
  const pendingAppointments = appointments?.filter(apt => apt.status === 'PENDING') || [];

  // Generate time slots for today's schedule (8:00 AM - 5:00 PM)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour: hour
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Helper function to check if appointment is in this time slot
  const getAppointmentForSlot = (hour: number) => {
    return todayAppointments.find(apt => {
      const aptDate = new Date(apt.appointmentDatetime);
      return aptDate.getHours() === hour;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Stethoscope className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">แดชบอร์ดแพทย์</h1>
                <p className="text-gray-600 text-sm">ยินดีต้อนรับ, {profile?.fullName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Today's Appointments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">นัดหมายวันนี้</p>
            <p className="text-3xl font-semibold text-gray-800">{todayAppointments.length}</p>
          </div>

          {/* Pending Appointments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-amber-50 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">รอการยืนยัน</p>
            <p className="text-3xl font-semibold text-gray-800">{pendingAppointments.length}</p>
          </div>

          {/* Total Appointments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">นัดหมายทั้งหมด</p>
            <p className="text-3xl font-semibold text-gray-800">{appointments.length}</p>
          </div>

          {/* Consultation Fee */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-50 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">ค่าตรวจ</p>
            <p className="text-3xl font-semibold text-gray-800">{profile?.consultationFee}฿</p>
          </div>
        </div>

        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                ข้อมูลส่วนตัว
              </h2>
              {profile && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ชื่อ-นามสกุล</p>
                    <p className="font-medium text-gray-800">{profile.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">อีเมล</p>
                    <p className="text-sm text-gray-700 break-all">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">เบอร์โทร</p>
                    <p className="text-sm text-gray-700">{profile.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">แผนก</p>
                    <p className="font-medium text-gray-800">{profile.specialty.name}</p>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">ห้องตรวจ</p>
                      <p className="font-medium text-gray-800">{profile.roomNumber}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">ประสบการณ์</p>
                      <p className="font-medium text-gray-800 flex items-center">
                        <Award className="w-4 h-4 mr-1 text-amber-500" />
                        {profile.experienceYears} ปี
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => router.push('/doctor-profile')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      แก้ไขโปรไฟล์
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Appointments List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                นัดหมายที่จะมาถึง
              </h2>

              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">ไม่มีนัดหมายในช่วงนี้</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {upcomingAppointments.slice(0, 10).map((appointment) => {
                    const { date, time } = DoctorService.formatAppointmentDateTime(appointment.appointmentDatetime);
                    const statusColor = DoctorService.getStatusColor(appointment.status);
                    const statusText = DoctorService.getStatusText(appointment.status);

                    return (
                      <div
                        key={appointment.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-blue-100 w-9 h-9 rounded-full flex items-center justify-center text-blue-700 font-medium text-sm">
                                {appointment.patient.firstName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {appointment.patient.firstName} {appointment.patient.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{appointment.patient.email}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                <Calendar className="w-3.5 h-3.5" />
                                {date}
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                <Clock className="w-3.5 h-3.5" />
                                {time}
                              </span>
                              <span className={`px-2.5 py-1 rounded text-xs font-medium ${statusColor}`}>
                                {statusText}
                              </span>
                            </div>
                            {appointment.notes && (
                              <div className="bg-amber-50 rounded p-2 mt-2">
                                <p className="text-xs text-gray-700">{appointment.notes}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {appointment.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleConfirmAppointment(appointment.id)}
                                  disabled={confirmingId === appointment.id}
                                  className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="ยืนยันนัดหมาย"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors" title="ยกเลิกนัดหมาย">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {upcomingAppointments.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => router.push('/doctor-appointments')}
                    className="w-full px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    ดูนัดหมายทั้งหมด →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Schedule Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <CalendarClock className="w-5 h-5 mr-2 text-blue-600" />
              ตารางเวลาวันนี้
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {timeSlots.map((slot) => {
                const appointment = getAppointmentForSlot(slot.hour);
                const isCurrentHour = new Date().getHours() === slot.hour;

                return (
                  <div
                    key={slot.time}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                      isCurrentHour
                        ? 'border-blue-300 bg-blue-50'
                        : appointment
                        ? 'border-green-200 bg-green-50 hover:bg-green-100'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-16 text-center ${
                      isCurrentHour ? 'text-blue-700 font-semibold' : 'text-gray-600'
                    }`}>
                      <div className="text-sm">{slot.time}</div>
                    </div>

                    <div className="flex-1">
                      {appointment ? (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {appointment.patient.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                              appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              appointment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {appointment.status === 'CONFIRMED' ? 'ยืนยันแล้ว' :
                               appointment.status === 'PENDING' ? 'รอยืนยัน' :
                               appointment.status === 'COMPLETED' ? 'เสร็จสิ้น' :
                               appointment.status}
                            </span>

                            {/* DEBUG: Show raw status */}
                            <span className="text-xs text-red-600 font-mono">[{appointment.status}]</span>

                            {/* Always show button for testing */}
                            <button
                              onClick={(e) => {
                                console.log('🟢🟢🟢 BUTTON CLICKED! Appointment ID:', appointment.id);
                                alert('Button clicked! ID: ' + appointment.id + ' Status: ' + appointment.status);
                                e.preventDefault();
                                e.stopPropagation();
                                handleConfirmAppointment(appointment.id);
                              }}
                              disabled={confirmingId === appointment.id}
                              className="relative z-50 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-md text-xs font-medium"
                              title="ยืนยันนัดหมาย"
                              type="button"
                              style={{ pointerEvents: 'auto' }}
                            >
                              {confirmingId === appointment.id ? 'กำลังยืนยัน...' : 'ยืนยัน'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">ว่าง</div>
                      )}
                    </div>

                    {isCurrentHour && !appointment && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                          ตอนนี้
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      

      <Footer />
    </div>
  );
}