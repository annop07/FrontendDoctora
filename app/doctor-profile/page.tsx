'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DoctorService, DoctorProfile } from '@/lib/doctor-service';
import { AuthService } from '@/lib/auth-service';
import Navbar from '@/components/Navbar';
import { User, Stethoscope, Briefcase, DollarSign, MapPin, FileText, ArrowLeft, Save, X } from 'lucide-react';

export default function DoctorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    experienceYears: 0,
    consultationFee: 0,
    roomNumber: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        console.log('🔵 [Doctor Profile] Current user:', user);
        console.log('🔵 [Doctor Profile] User role:', user?.role);
        console.log('🔵 [Doctor Profile] Token exists:', !!AuthService.getToken());

        if (!user || user.role !== 'DOCTOR') {
          console.log('❌ [Doctor Profile] Not authorized, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('✅ [Doctor Profile] User authorized, loading profile...');
        loadProfile();
      } catch (error) {
        console.error('❌ [Doctor Profile] Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔵 [Doctor Profile] Fetching profile data...');

      const data = await DoctorService.getMyProfile();
      console.log('✅ [Doctor Profile] Profile data received:', data);

      setProfile(data);

      // Initialize form data
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        bio: data.bio || '',
        experienceYears: data.experienceYears || 0,
        consultationFee: data.consultationFee || 0,
        roomNumber: data.roomNumber || '',
      });
    } catch (err: any) {
      console.error('❌ [Doctor Profile] Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSaveMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveMessage(null);
    // Reset form data to original profile
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        experienceYears: profile.experienceYears || 0,
        consultationFee: profile.consultationFee || 0,
        roomNumber: profile.roomNumber || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);

      const result = await DoctorService.updateMyProfile(formData);

      // Update local profile with new data
      setProfile(result.doctor);
      setIsEditing(false);
      setSaveMessage('บันทึกข้อมูลสำเร็จ');

      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setSaveMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-6">{error || 'ไม่พบข้อมูลโปรไฟล์'}</p>
          <button
            onClick={() => router.push('/doctor-dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับไปหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/doctor-dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">กลับ</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">โปรไฟล์แพทย์</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4`}>
          <div className={`p-4 rounded-lg ${
            saveMessage.includes('สำเร็จ')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveMessage}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{profile.doctorName}</h2>
                <p className="text-gray-600">{profile.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    {profile.specialty.name}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile.isActive
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    {profile.isActive ? 'ใช้งานอยู่' : 'ไม่ได้ใช้งาน'}
                  </span>
                </div>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                แก้ไขข้อมูล
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Stethoscope className="w-4 h-4" />
              <span>เลขใบอนุญาต: {profile.licenseNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>เบอร์โทร: {profile.phone || 'ไม่ระบุ'}</span>
            </div>
          </div>
        </div>

        {/* Editable Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">รายละเอียดโปรไฟล์</h3>

          <div className="space-y-6">
            {/* First Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                ชื่อ
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="กรอกชื่อ"
                />
              ) : (
                <p className="text-gray-600">{profile.firstName || 'ไม่ระบุ'}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                นามสกุล
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="กรอกนามสกุล"
                />
              ) : (
                <p className="text-gray-600">{profile.lastName || 'ไม่ระบุ'}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                เบอร์โทรศัพท์
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="กรอกเบอร์โทรศัพท์"
                />
              ) : (
                <p className="text-gray-600">{profile.phone || 'ไม่ระบุ'}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                ประวัติและความเชี่ยวชาญ
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="กรอกประวัติและความเชี่ยวชาญของคุณ..."
                />
              ) : (
                <p className="text-gray-600 whitespace-pre-wrap">
                  {profile.bio || 'ไม่มีข้อมูล'}
                </p>
              )}
            </div>

            {/* Experience Years */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4" />
                ประสบการณ์ (ปี)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-600">{profile.experienceYears} ปี</p>
              )}
            </div>

            {/* Consultation Fee */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4" />
                ค่าตรวจ (บาท)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.consultationFee}
                  onChange={(e) => handleInputChange('consultationFee', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-600">{profile.consultationFee.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</p>
              )}
            </div>

            {/* Room Number */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                ห้องตรวจ
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น A-101"
                />
              ) : (
                <p className="text-gray-600">{profile.roomNumber || 'ไม่ระบุ'}</p>
              )}
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลเพิ่มเติม</h3>
          <div className="text-sm text-gray-600">
            <span className="font-medium">สร้างเมื่อ:</span>{' '}
            {new Date(profile.createdAt).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}