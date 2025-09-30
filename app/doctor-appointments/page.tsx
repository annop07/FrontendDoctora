"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth-service';
import { DoctorService, DoctorAppointment } from '@/lib/doctor-service';
import { AppointmentService, PatientBookingInfoResponse } from '@/lib/appointment-service';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  ArrowLeft,
  Filter,
  Search,
  Info,
  FileText,
  X as CloseIcon
} from 'lucide-react';

type FilterStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export default function DoctorAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<DoctorAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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
        fetchAppointments();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    // Filter appointments based on status and search
    let filtered = appointments;

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.patient.firstName.toLowerCase().includes(query) ||
        apt.patient.lastName.toLowerCase().includes(query) ||
        apt.patient.email.toLowerCase().includes(query)
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, filterStatus, searchQuery]);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await DoctorService.getMyAppointments();
      setAppointments(data.appointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: number) => {
    try {
      setConfirmingId(appointmentId);
      await AppointmentService.confirmAppointment(appointmentId);
      await fetchAppointments();
      alert('ยืนยันนัดหมายเรียบร้อยแล้ว');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการยืนยันนัดหมาย';
      alert('เกิดข้อผิดพลาด: ' + errorMessage);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleViewPatientInfo = async (appointmentId: number) => {
    try {
      setLoadingPatientInfo(true);
      const patientInfo = await AppointmentService.getPatientBookingInfo(appointmentId);
      setSelectedPatientInfo(patientInfo);
      setIsModalOpen(true);
    } catch (err) {
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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'CONFIRMED': 'bg-green-100 text-green-700 border-green-200',
      'CANCELLED': 'bg-red-100 text-red-700 border-red-200',
      'COMPLETED': 'bg-blue-100 text-blue-700 border-blue-200',
    };

    const labels: Record<string, string> = {
      'PENDING': 'รอยืนยัน',
      'CONFIRMED': 'ยืนยันแล้ว',
      'CANCELLED': 'ยกเลิก',
      'COMPLETED': 'เสร็จสิ้น',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
        {labels[status] || status}
      </span>
    );
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
              onClick={fetchAppointments}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/doctor-dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">นัดหมายทั้งหมด</h1>
              <p className="text-sm text-gray-600">{filteredAppointments.length} รายการ</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ป่วยหรืออีเมล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                filterStatus === 'ALL'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              ทั้งหมด ({appointments.length})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                filterStatus === 'PENDING'
                  ? 'border-yellow-600 text-yellow-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              รอการยืนยัน ({appointments.filter(a => a.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilterStatus('CONFIRMED')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                filterStatus === 'CONFIRMED'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              ยืนยันแล้ว ({appointments.filter(a => a.status === 'CONFIRMED').length})
            </button>
            <button
              onClick={() => setFilterStatus('CANCELLED')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                filterStatus === 'CANCELLED'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              ยกเลิก ({appointments.filter(a => a.status === 'CANCELLED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ไม่พบนัดหมาย</h3>
            <p className="text-gray-600">
              {searchQuery || filterStatus !== 'ALL'
                ? 'ลองเปลี่ยนตัวกรองหรือคำค้นหา'
                : 'ยังไม่มีนัดหมายในขณะนี้'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const { date, time } = DoctorService.formatAppointmentDateTime(appointment.appointmentDatetime);

              return (
                <div
                  key={appointment.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Patient Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-700 font-semibold text-lg">
                          {appointment.patient.firstName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{appointment.patient.email}</p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{time}</span>
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">{appointment.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleViewPatientInfo(appointment.id)}
                        disabled={loadingPatientInfo}
                        className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Info className="w-4 h-4" />
                        ดูข้อมูล
                      </button>

                      {appointment.status === 'PENDING' && (
                        <button
                          onClick={() => handleConfirmAppointment(appointment.id)}
                          disabled={confirmingId === appointment.id}
                          className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {confirmingId === appointment.id ? 'กำลังยืนยัน...' : 'ยืนยัน'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className="text-xs text-gray-500">ประเภทการจอง</label>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPatientInfo.bookingType === 'auto' ? 'จองอัตโนมัติ' : 'เลือกหมอเอง'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">เวลาที่จอง</label>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedPatientInfo.createdAt).toLocaleString('th-TH')}
                      </p>
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