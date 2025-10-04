'use client';

import { Clock, Calendar, FileText, Stethoscope, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth-service';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Appointment {
  id: number;
  doctor: {
    id: number;
    doctorName: string;
    specialty: {
      id: number;
      name: string;
    };
  };
  patient: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  appointmentDatetime: string;
  durationMinutes: number;
  status: string;
  notes: string;
  doctorNotes: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingRecord {
  id: number;
  queueNumber: string;
  patientName: string;
  doctorName: string;
  department: string;
  appointmentType: string;
  date: string;
  time: string;
  status: string;
  statusColor: string;
  createdAt: string;
  symptoms?: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [bookingHistory, setBookingHistory] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get status color
  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'text-emerald-600 bg-emerald-50';
      case 'PENDING':
        return 'text-amber-600 bg-amber-50';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Helper function to translate status to Thai
  const translateStatus = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return 'ยืนยันแล้ว';
      case 'PENDING':
        return 'รอยืนยัน';
      case 'CANCELLED':
        return 'ยกเลิก';
      case 'COMPLETED':
        return 'เสร็จสิ้น';
      default:
        return status;
    }
  };

  // Convert Appointment to BookingRecord format
  const convertToBookingRecord = (appointment: Appointment): BookingRecord => {
    // Parse appointmentDatetime to separate date and time
    const datetime = new Date(appointment.appointmentDatetime);
    const dateStr = datetime.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = datetime.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Generate queue number (A-XXX format)
    const queueNumber = `A-${String(appointment.id).padStart(3, '0')}`;

    // Get patient name
    const patientName = `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim()
      || appointment.patient.email.split('@')[0];

    return {
      id: appointment.id,
      queueNumber: queueNumber,
      patientName: patientName,
      doctorName: appointment.doctor.doctorName,
      department: appointment.doctor.specialty.name,
      appointmentType: appointment.notes ? 'ตรวจอาการ' : 'ตรวจทั่วไป',
      date: dateStr,
      time: timeStr,
      status: translateStatus(appointment.status),
      statusColor: getStatusColor(appointment.status),
      createdAt: appointment.createdAt,
      symptoms: appointment.notes,
    };
  };

  // ฟังก์ชันโหลดประวัติการจองจาก Backend
  const loadBookingHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check authentication
      const user = await AuthService.getCurrentUser();
      if (!user || user.role !== 'PATIENT') {
        console.log('❌ [History] Not authorized, redirecting to login');
        router.push('/login');
        return;
      }

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
      const token = AuthService.getToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${apiBaseUrl}/api/appointments/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load appointments: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [History] Appointments loaded:', data);

      const appointments: Appointment[] = data.appointments || [];

      // Convert to BookingRecord format and sort by createdAt (newest first)
      const bookingRecords = appointments
        .map(convertToBookingRecord)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setBookingHistory(bookingRecords);

    } catch (error) {
      console.error('❌ [History] Error loading appointments:', error);
      setError(error instanceof Error ? error.message : 'Failed to load appointment history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookingHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
              <p className="text-emerald-700 font-medium">กำลังโหลดประวัติ...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-red-800 font-medium mb-2">เกิดข้อผิดพลาด</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={loadBookingHistory}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />

      <main className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <Clock className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-emerald-900 mb-4">
            ประวัติการจองของฉัน
          </h1>
          <p className="text-xl text-emerald-700 max-w-2xl mx-auto leading-relaxed">
            ดูประวัติการนัดหมายและสถานะการจองทั้งหมดของคุณ
          </p>
          
          {/* Refresh Button */}
          <button
            onClick={loadBookingHistory}
            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรชประวัติ
          </button>
        </div>

        {/* History List */}
        <div className="max-w-4xl mx-auto">
          {bookingHistory.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg border border-emerald-100">
              <FileText className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                ยังไม่มีประวัติการจอง
              </h3>
              <p className="text-emerald-600">
                เมื่อคุณทำการจองนัดหมายแล้ว ประวัติจะแสดงที่นี่
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookingHistory.map((booking) => (
                <div key={booking.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-200">
                  {/* Header with Queue Number and Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-emerald-600">หมายเลขคิว</span>
                          <span className="text-lg font-bold text-emerald-800">{booking.queueNumber}</span>
                        </div>
                        <h3 className="text-lg font-bold text-emerald-900">แพทย์: {booking.doctorName}</h3>
                        <p className="text-emerald-700">{booking.department}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${booking.statusColor}`}>
                      {booking.status}
                    </div>
                  </div>
                  
                  {/* Appointment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">วันที่: </span>
                      <span className="font-medium">{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">เวลา: </span>
                      <span className="font-medium">{booking.time}</span>
                    </div>
                  </div>
                  
                  {/* Additional Details */}
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-emerald-700">ผู้ป่วย: </span>
                        <span className="font-medium text-emerald-900">{booking.patientName}</span>
                      </div>
                      <div>
                        <span className="text-emerald-700">ประเภท: </span>
                        <span className="font-medium text-emerald-900">{booking.appointmentType}</span>
                      </div>
                    </div>
                    {booking.symptoms && (
                      <div className="mt-2 text-sm">
                        <span className="text-emerald-700">อาการ: </span>
                        <span className="text-emerald-900">{booking.symptoms}</span>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-emerald-600">
                      จองเมื่อ: {new Date(booking.createdAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}