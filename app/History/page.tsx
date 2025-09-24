'use client';

import { Clock, Calendar, FileText, Stethoscope, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
  userEmail: string;
}

export default function HistoryPage() {
  const [bookingHistory, setBookingHistory] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ฟังก์ชันโหลดประวัติการจอง
  const loadBookingHistory = () => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.email) {
        const historyKey = `bookingHistory_${user.email}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        // เรียงลำดับตามวันที่สร้างใหม่สุดก่อน
        const sortedHistory = history.sort((a: BookingRecord, b: BookingRecord) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setBookingHistory(sortedHistory);
      }
    } catch (error) {
      console.error('Error loading booking history:', error);
      setBookingHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันเปลี่ยนสถานะการจอง (สำหรับ demo)
  const updateBookingStatus = (bookingId: number, newStatus: string) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.email) {
      const historyKey = `bookingHistory_${user.email}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      const updatedHistory = history.map((booking: BookingRecord) => {
        if (booking.id === bookingId) {
          let statusColor = 'text-amber-600 bg-amber-50';
          if (newStatus === 'เสร็จสิ้น') {
            statusColor = 'text-emerald-600 bg-emerald-50';
          } else if (newStatus === 'ยกเลิก') {
            statusColor = 'text-red-600 bg-red-50';
          }
          
          return { ...booking, status: newStatus, statusColor };
        }
        return booking;
      });
      
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      setBookingHistory(updatedHistory);
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
                        <h3 className="text-lg font-bold text-emerald-900">{booking.doctorName}</h3>
                        <p className="text-emerald-700">{booking.department}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${booking.statusColor}`}>
                        {booking.status}
                      </div>
                      {/* Demo buttons to change status */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'เสร็จสิ้น')}
                          className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                        >
                          เสร็จสิ้น
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'ยกเลิก')}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          ยกเลิก
                        </button>
                      </div>
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
                    <div className="mt-2 text-xs text-emerald-600">
                      จองเมื่อ: {new Date(booking.createdAt).toLocaleString('th-TH')}
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