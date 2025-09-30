"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth-service';
import { AvailabilityService, Availability } from '@/lib/availability-service';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar, Clock, AlertCircle, Plus, X, Edit2, Trash2 } from 'lucide-react';

export default function DoctorSchedulePage() {
  const router = useRouter();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
  });

  useEffect(() => {
    // Debug: Check token in localStorage
    const token = localStorage.getItem('authToken');
    console.log('🔑 Token exists:', !!token);
    if (token) {
      console.log('🔑 Token preview:', token.substring(0, 30) + '...');
    }

    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const user = await AuthService.getCurrentUser();

      if (!user || user.role !== 'DOCTOR') {
        router.push('/login');
        return;
      }

      await fetchAvailabilities();
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchAvailabilities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await AvailabilityService.getMyAvailability();

      console.log('📊 Raw availabilities data:', data);
      console.log('📊 Data length:', data.length);
      console.log('📊 Sample availability:', data[0]);

      if (data && data.length > 0 && data[0]) {
        console.log('⏰ Start time type:', typeof data[0].startTime);
        console.log('⏰ Start time value:', data[0].startTime);
        console.log('⏰ Start time raw:', JSON.stringify(data[0].startTime));
        console.log('⏰ End time type:', typeof data[0].endTime);
        console.log('⏰ End time value:', data[0].endTime);
        console.log('⏰ End time raw:', JSON.stringify(data[0].endTime));
      }

      console.log('✅ Setting availabilities with', data.length, 'items');
      setAvailabilities(data);
    } catch (err) {
      console.error('Error fetching availabilities:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingId) {
        // Update existing
        await AvailabilityService.updateAvailability(editingId, {
          dayOfWeek: formData.dayOfWeek,
          startTime: `${formData.startTime}:00`,
          endTime: `${formData.endTime}:00`,
        });
      } else {
        // Create new
        await AvailabilityService.addAvailability({
          dayOfWeek: formData.dayOfWeek,
          startTime: `${formData.startTime}:00`,
          endTime: `${formData.endTime}:00`,
        });
      }

      // Refresh list
      await fetchAvailabilities();

      // Reset form
      setShowAddForm(false);
      setEditingId(null);
      setFormData({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
      });
    } catch (err) {
      console.error('Error saving availability:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกเวลาทำงาน');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAvailability = (availability: Availability) => {
    setEditingId(availability.id);
    setFormData({
      dayOfWeek: availability.dayOfWeek,
      startTime: AvailabilityService.formatTime(availability.startTime),
      endTime: AvailabilityService.formatTime(availability.endTime),
    });
    setShowAddForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
    });
  };

  const handleDeleteAvailability = async (id: number) => {
    if (!confirm('คุณต้องการลบเวลาทำงานนี้หรือไม่?')) {
      return;
    }

    try {
      setError(null);
      setDeletingId(id);
      await AvailabilityService.deleteAvailability(id);
      await fetchAvailabilities();
    } catch (err) {
      console.error('Error deleting availability:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบเวลาทำงาน');
    } finally {
      setDeletingId(null);
    }
  };

  // Group availabilities by day
  const groupedAvailabilities = availabilities.reduce((acc, availability) => {
    const day = availability.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(availability);
    return acc;
  }, {} as Record<number, Availability[]>);

  // Filter by selected day
  const filteredAvailabilities = selectedDay
    ? availabilities.filter(a => a.dayOfWeek === selectedDay)
    : availabilities;

  const daysOfWeek = [
    { value: 1, label: 'จันทร์', short: 'จ' },
    { value: 2, label: 'อังคาร', short: 'อ' },
    { value: 3, label: 'พุธ', short: 'พ' },
    { value: 4, label: 'พฤหัสบดี', short: 'พฤ' },
    { value: 5, label: 'ศุกร์', short: 'ศ' },
    { value: 6, label: 'เสาร์', short: 'ส' },
    { value: 7, label: 'อาทิตย์', short: 'อา' },
  ];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">จัดการเวลาทำงาน</h1>
                <p className="text-gray-600 text-sm">ตั้งค่าเวลาทำงานของคุณ</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/doctor-dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              ← กลับ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">เกิดข้อผิดพลาด</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2.5 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">ทั้งหมด</p>
                <p className="text-xl font-semibold text-gray-800">{availabilities.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2.5 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">เปิดใช้งาน</p>
                <p className="text-xl font-semibold text-gray-800">
                  {availabilities.filter(a => a.isActive).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2.5 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">จำนวนวัน</p>
                <p className="text-xl font-semibold text-gray-800">
                  {Object.keys(groupedAvailabilities).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full h-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">เพิ่มเวลา</span>
            </button>
          </div>
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingId ? 'bg-orange-50' : 'bg-blue-50'}`}>
                  {editingId ? (
                    <Edit2 className="w-5 h-5 text-orange-600" />
                  ) : (
                    <Plus className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingId ? 'แก้ไขเวลาทำงาน' : 'เพิ่มเวลาทำงานใหม่'}
                </h3>
              </div>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddAvailability} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วัน
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {daysOfWeek.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เวลาเริ่ม
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เวลาสิ้นสุด
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                    editingId
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังบันทึก...
                    </span>
                  ) : editingId ? 'อัปเดต' : 'บันทึก'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Day Filter Pills */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedDay(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors font-medium text-sm ${
              selectedDay === null
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            ทั้งหมด
          </button>
          {daysOfWeek.map(day => {
            const count = groupedAvailabilities[day.value]?.length || 0;
            return (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
                disabled={count === 0}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors font-medium text-sm ${
                  selectedDay === day.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : count > 0
                    ? 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed'
                }`}
              >
                {day.label}
                {count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                    selectedDay === day.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>


        {/* Availabilities List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">เวลาทำงานของคุณ</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {selectedDay ? filteredAvailabilities.length : availabilities.length} รายการ
                </span>
              </div>
            </div>
          </div>

          {filteredAvailabilities.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium mb-1">
                {selectedDay ? 'ไม่มีเวลาทำงานในวันนี้' : 'ยังไม่มีเวลาทำงาน'}
              </p>
              <p className="text-gray-400 text-sm">
                {selectedDay ? 'กรุณาเลือกวันอื่น หรือเพิ่มเวลาทำงานใหม่' : 'คลิกปุ่ม "เพิ่มเวลา" เพื่อเริ่มต้น'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAvailabilities
                .sort((a, b) => {
                  if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                  return a.startTime.localeCompare(b.startTime);
                })
                .map((availability) => {
                  const dayInfo = daysOfWeek.find(d => d.value === availability.dayOfWeek);
                  return (
                    <div
                      key={availability.id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 w-14 h-14 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-blue-700 font-bold text-base">
                              {dayInfo?.short}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-800">
                                {AvailabilityService.getDayNameThai(availability.dayOfWeek)}
                              </p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                availability.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {availability.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">
                                {AvailabilityService.formatTime(availability.startTime)}
                              </span>
                              <span className="text-gray-400">-</span>
                              <span className="font-medium">
                                {AvailabilityService.formatTime(availability.endTime)}
                              </span>
                              <span className="text-gray-400 ml-1">
                                ({(() => {
                                  const start = availability.startTime.split(':');
                                  const end = availability.endTime.split(':');
                                  const hours = parseInt(end[0]) - parseInt(start[0]);
                                  const minutes = parseInt(end[1]) - parseInt(start[1]);
                                  const totalHours = hours + minutes / 60;
                                  return `${totalHours.toFixed(1)} ชม.`;
                                })()})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditAvailability(availability)}
                            disabled={deletingId === availability.id || editingId === availability.id}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAvailability(availability.id)}
                            disabled={deletingId === availability.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="ลบ"
                          >
                            {deletingId === availability.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}