"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth-service';
import { DoctorService, DoctorProfile, DoctorAppointment, DoctorStats, DoctorAvailability } from '@/lib/doctor-service';
import { AppointmentService, PatientBookingInfoResponse } from '@/lib/appointment-service';
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
  Check,
  Info,
  X as CloseIcon,
  FileText
} from 'lucide-react';

export default function DoctorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [selectedPatientInfo, setSelectedPatientInfo] = useState<(PatientBookingInfoResponse & { appointmentDatetime?: string }) | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingPatientInfo, setLoadingPatientInfo] = useState(false);
  const [appointmentFilter, setAppointmentFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('ALL');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

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

  // Redirect to dashboard when doctor logs in
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user && user.role === 'DOCTOR') {
      // Already on dashboard, no need to redirect
      console.log('✅ Doctor is on dashboard');
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel, but handle availability separately to not break dashboard
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

      // Fetch availability separately with error handling
      try {
        const availabilityData = await DoctorService.getMyAvailability();
        console.log('Availability:', availabilityData);
        setAvailability(availabilityData || []);
      } catch (availErr) {
        console.error('Error fetching availability (non-critical):', availErr);
        setAvailability([]); // Set empty array if availability fetch fails
      }
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

  const handleCancelAppointment = async (appointmentId: number) => {
    console.log('🔴 Cancelling appointment:', appointmentId);

    // Confirm with user
    if (!confirm('คุณต้องการยกเลิกนัดหมายนี้หรือไม่?')) {
      return;
    }

    try {
      setCancellingId(appointmentId);
      setError(null);

      console.log('🔴 Calling cancelAppointment API...');
      await AppointmentService.cancelAppointment(appointmentId);
      console.log('✅ Appointment cancelled');

      // Refresh dashboard data
      console.log('🔴 Refreshing dashboard data...');
      await fetchDashboardData();
      console.log('✅ Dashboard refreshed');

      alert('ยกเลิกนัดหมายเรียบร้อยแล้ว');
    } catch (err) {
      console.error('❌ Error cancelling appointment:', err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการยกเลิกนัดหมาย';
      setError(errorMessage);
      alert('เกิดข้อผิดพลาด: ' + errorMessage);
    } finally {
      setCancellingId(null);
      console.log('🔴 Cancel process finished');
    }
  };

  const handleViewPatientInfo = async (appointmentId: number) => {
    console.log('🔵 Viewing patient info for appointment:', appointmentId);

    try {
      setLoadingPatientInfo(true);
      setError(null);

      // Find the appointment from the list
      const appointment = appointments.find(apt => apt.id === appointmentId);

      const patientInfo = await AppointmentService.getPatientBookingInfo(appointmentId);
      console.log('✅ Patient info retrieved:', patientInfo);

      // Store both patient info and appointment data
      setSelectedPatientInfo({
        ...patientInfo,
        appointmentDatetime: appointment?.appointmentDatetime
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error('❌ Error fetching patient info:', err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ป่วย';
      alert('เกิดข้อผิดพลาด: ' + errorMessage);
    } finally {
      setLoadingPatientInfo(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPatientInfo(null);
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
  const allUpcomingAppointments = appointments ? DoctorService.getUpcomingAppointments(appointments) : [];

  // Filter and sort upcoming appointments based on selected filter
  let upcomingAppointments = appointmentFilter === 'ALL'
    ? allUpcomingAppointments
    : allUpcomingAppointments.filter(apt => apt.status === appointmentFilter);

  // For 'ALL' filter: sort by status (PENDING first, then CONFIRMED, then others) and by date
  if (appointmentFilter === 'ALL') {
    upcomingAppointments = [...upcomingAppointments].sort((a, b) => {
      // Priority: PENDING = 1, CONFIRMED = 2, others = 3
      const getPriority = (status: string) => {
        if (status === 'PENDING') return 1;
        if (status === 'CONFIRMED') return 2;
        return 3;
      };

      const priorityDiff = getPriority(a.status) - getPriority(b.status);

      // If same priority, sort by date (nearest first)
      if (priorityDiff === 0) {
        return new Date(a.appointmentDatetime).getTime() - new Date(b.appointmentDatetime).getTime();
      }

      return priorityDiff;
    });
  } else {
    // For other filters, just sort by date (nearest first)
    upcomingAppointments = [...upcomingAppointments].sort((a, b) =>
      new Date(a.appointmentDatetime).getTime() - new Date(b.appointmentDatetime).getTime()
    );
  }

  const pendingAppointments = appointments?.filter(apt => apt.status === 'PENDING') || [];
  const confirmedCount = allUpcomingAppointments.filter(apt => apt.status === 'CONFIRMED').length;
  const cancelledCount = allUpcomingAppointments.filter(apt => apt.status === 'CANCELLED').length;

  // Generate time slots based on today's availability
  const generateTimeSlots = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert to backend format: 1=Monday, 7=Sunday
    const backendDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    // Get today's availability
    const todayAvailability = availability.filter(
      av => av.dayOfWeek === backendDayOfWeek && av.isActive
    );

    if (todayAvailability.length === 0) {
      return []; // No availability today
    }

    const slots: { time: string; hour: number; isAvailable: boolean }[] = [];

    // For each availability period
    todayAvailability.forEach(av => {
      const startHour = parseInt(av.startTime.split(':')[0]);
      const endHour = parseInt(av.endTime.split(':')[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        // Check if slot already exists (in case of overlapping availability)
        if (!slots.find(s => s.hour === hour)) {
          slots.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            hour: hour,
            isAvailable: true
          });
        }
      }
    });

    // Sort by hour
    return slots.sort((a, b) => a.hour - b.hour);
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
                <p className="text-gray-600 text-sm">
                  ยินดีต้อนรับ, {profile?.fullName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || profile?.doctorName || 'แพทย์'}
                </p>
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
                    <p className="font-medium text-gray-800">
                      {profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.doctorName || '-'}
                    </p>
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
                  <div className="pt-4 border-t border-gray-100 space-y-2">
                    <button
                      onClick={() => router.push('/doctor-profile')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      แก้ไขโปรไฟล์
                    </button>
                    <button
                      onClick={() => router.push('/doctor-schedule')}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      จัดการเวลาทำงาน
                    </button>
                    <button
                      onClick={() => router.push('/doctor-calendar')}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <CalendarClock className="w-4 h-4" />
                      ปฏิทิน
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

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-200">
                <button
                  onClick={() => setAppointmentFilter('ALL')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    appointmentFilter === 'ALL'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ทั้งหมด ({allUpcomingAppointments.length})
                </button>
                <button
                  onClick={() => setAppointmentFilter('PENDING')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    appointmentFilter === 'PENDING'
                      ? 'border-yellow-600 text-yellow-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  รอการยืนยัน ({pendingAppointments.length})
                </button>
                <button
                  onClick={() => setAppointmentFilter('CONFIRMED')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    appointmentFilter === 'CONFIRMED'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ยืนยันแล้ว ({confirmedCount})
                </button>
                <button
                  onClick={() => setAppointmentFilter('CANCELLED')}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    appointmentFilter === 'CANCELLED'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ยกเลิก ({cancelledCount})
                </button>
              </div>

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
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">
                                  {appointment.patient.firstName} {appointment.patient.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{appointment.patient.email}</p>
                              </div>
                              <button
                                onClick={() => handleViewPatientInfo(appointment.id)}
                                disabled={loadingPatientInfo}
                                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                title="ดูข้อมูลผู้ป่วย"
                              >
                                <Info className="w-3.5 h-3.5" />
                                ข้อมูลผู้ป่วย
                              </button>
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
                                <button
                                  onClick={() => handleCancelAppointment(appointment.id)}
                                  disabled={cancellingId === appointment.id}
                                  className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="ยกเลิกนัดหมาย"
                                >
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

            {timeSlots.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">ไม่มีเวลาทำงานวันนี้</p>
                <button
                  onClick={() => router.push('/doctor-schedule')}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                >
                  ตั้งค่าเวลาทำงาน
                </button>
              </div>
            ) : (
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
                          : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50'
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

                            {appointment.status === 'PENDING' && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleConfirmAppointment(appointment.id);
                                }}
                                disabled={confirmingId === appointment.id}
                                className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 text-xs font-medium"
                                title="ยืนยันนัดหมาย"
                              >
                                {confirmingId === appointment.id ? 'กำลังยืนยัน...' : 'ยืนยัน'}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-emerald-600 font-medium">ว่าง</div>
                          <span className="text-xs text-emerald-500">พร้อมรับนัดหมาย</span>
                        </div>
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
            )}
          </div>
        </div>
      </div>

      {/* Patient Info Modal */}
      {isModalOpen && selectedPatientInfo && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                ข้อมูลผู้ป่วย
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="ปิด"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Queue Number */}
              <div className="border-2 border-blue-500 rounded-lg p-5 text-center bg-blue-50/50">
                <p className="text-xs text-gray-600 mb-1">หมายเลขคิว</p>
                <p className="text-4xl font-bold text-blue-600">{selectedPatientInfo.queueNumber}</p>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">ข้อมูลส่วนตัว</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className="text-xs text-gray-500">คำนำหน้า</label>
                    <p className="text-sm font-medium text-gray-900">{selectedPatientInfo.patientPrefix || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">ชื่อ-นามสกุล</label>
                    <p className="text-sm font-medium text-gray-900">{selectedPatientInfo.patientFullName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">เพศ</label>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPatientInfo.patientGender === 'male' ? 'ชาย' :
                       selectedPatientInfo.patientGender === 'female' ? 'หญิง' :
                       selectedPatientInfo.patientGender}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">วันเกิด</label>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedPatientInfo.patientDateOfBirth).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">สัญชาติ</label>
                    <p className="text-sm font-medium text-gray-900">{selectedPatientInfo.patientNationality}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">เลขบัตรประชาชน</label>
                    <p className="text-sm font-medium text-gray-900">{selectedPatientInfo.patientCitizenId || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200"></div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">ข้อมูลติดต่อ</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className="text-xs text-gray-500">เบอร์โทรศัพท์</label>
                    <p className="text-sm font-medium text-gray-900">{selectedPatientInfo.patientPhone}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">อีเมล</label>
                    <p className="text-sm font-medium text-gray-900 break-all">{selectedPatientInfo.patientEmail}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200"></div>

              {/* Symptoms */}
              {selectedPatientInfo.symptoms && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">อาการ</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedPatientInfo.symptoms}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200"></div>
                </>
              )}

              {/* Booking Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">ข้อมูลการจอง</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-4">
                    <div>
                      <label className="text-xs text-gray-500">ประเภทการจอง</label>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPatientInfo.bookingType === 'auto' ? 'จองอัตโนมัติ' : 'เลือกหมอเอง'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">หมายเลขคิว</label>
                      <p className="text-sm font-medium text-emerald-600">
                        {selectedPatientInfo.queueNumber}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div>
                      <label className="text-xs text-gray-500">วันเวลานัดหมาย</label>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPatientInfo.appointmentDatetime ? (() => {
                          const { date, time } = DoctorService.formatAppointmentDateTime(selectedPatientInfo.appointmentDatetime);
                          return `${date} ${time}`;
                        })() : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">จองเมื่อ</label>
                      <p className="text-sm font-medium text-gray-600">
                        {(() => {
                          const dt = new Date(selectedPatientInfo.createdAt);
                          return dt.toLocaleString('th-TH', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          });
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                ปิด
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}