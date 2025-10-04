'use client';

import React, { useState, useEffect } from 'react';
import { getAuthHeaders, handleApiError } from '@/lib/auth-utils';
import { X } from 'lucide-react';

interface Doctor {
  id: number;
  doctorName: string;
  email: string;
  specialty: { id: number; name: string };
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  roomNumber: string;
  isActive: boolean;
  bio?: string;
}

interface Specialty {
  id: number;
  name: string;
  description: string;
  doctorCount: number;
}

interface DoctorEditFormProps {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onDoctorUpdated: () => void;
  specialties: Specialty[];
  apiBaseUrl: string;
}

const DoctorEditForm: React.FC<DoctorEditFormProps> = ({
  isOpen,
  doctor,
  onClose,
  onDoctorUpdated,
  specialties,
  apiBaseUrl
}) => {
  const [formData, setFormData] = useState({
    specialtyId: '',
    licenseNumber: '',
    bio: '',
    experienceYears: 0,
    consultationFee: 500,
    roomNumber: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when doctor changes
  useEffect(() => {
    if (doctor) {
      setFormData({
        specialtyId: doctor.specialty.id.toString(),
        licenseNumber: doctor.licenseNumber || '',
        bio: doctor.bio || '',
        experienceYears: doctor.experienceYears || 0,
        consultationFee: doctor.consultationFee || 500,
        roomNumber: doctor.roomNumber || ''
      });
    }
  }, [doctor]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.specialtyId) {
      errors.specialtyId = 'Please select a specialty';
    }
    if (!formData.licenseNumber.trim()) {
      errors.licenseNumber = 'License number is required';
    }
    if (formData.experienceYears < 0) {
      errors.experienceYears = 'Experience years cannot be negative';
    }
    if (formData.consultationFee < 0) {
      errors.consultationFee = 'Consultation fee cannot be negative';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setValidationErrors({});

    if (!validateForm() || !doctor) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        specialtyId: parseInt(formData.specialtyId),
        licenseNumber: formData.licenseNumber.trim(),
        bio: formData.bio.trim() || null,
        experienceYears: formData.experienceYears || 0,
        consultationFee: formData.consultationFee || 500.00,
        roomNumber: formData.roomNumber.trim() || null
      };

      console.log('Sending doctor update payload:', payload);

      const response = await fetch(`${apiBaseUrl}/api/admin/doctors/${doctor.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        alert('Doctor updated successfully!');
        onClose();
        onDoctorUpdated();
      } else {
        // Get detailed error message
        const errorText = await response.text();
        console.error('Update failed - Status:', response.status);
        console.error('Update failed - Response:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          setSubmitError(errorData.message || `Update failed with status ${response.status}`);
        } catch {
          setSubmitError(`Update failed: ${errorText.substring(0, 300)}`);
        }
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
      const errorMessage = (error as Error).message;

      if (errorMessage.toLowerCase().includes('fetch')) {
        setSubmitError('Network error: Unable to connect to server. Please check your connection and try again.');
      } else {
        setSubmitError(`Error updating doctor: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Doctor: {doctor.doctorName}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Email: <span className="font-medium text-gray-900">{doctor.email}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Specialty *</label>
            <select
              value={formData.specialtyId}
              onChange={(e) => setFormData({...formData, specialtyId: e.target.value})}
              className={`w-full border rounded-lg px-3 py-2 ${
                validationErrors.specialtyId ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select specialty</option>
              {specialties.map(specialty => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </option>
              ))}
            </select>
            {validationErrors.specialtyId && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.specialtyId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">License Number *</label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
              className={`w-full border rounded-lg px-3 py-2 ${
                validationErrors.licenseNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., MD001, LIC123456"
              required
            />
            {validationErrors.licenseNumber && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.licenseNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
              placeholder="Doctor's biography and qualifications (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Experience Years</label>
              <input
                type="number"
                min="0"
                max="60"
                value={formData.experienceYears}
                onChange={(e) => setFormData({...formData, experienceYears: parseInt(e.target.value) || 0})}
                className={`w-full border rounded-lg px-3 py-2 ${
                  validationErrors.experienceYears ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.experienceYears && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.experienceYears}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Consultation Fee (฿)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.consultationFee}
                onChange={(e) => setFormData({...formData, consultationFee: parseFloat(e.target.value) || 0})}
                className={`w-full border rounded-lg px-3 py-2 ${
                  validationErrors.consultationFee ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.consultationFee && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.consultationFee}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Room Number</label>
            <input
              type="text"
              value={formData.roomNumber}
              onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., A101, B205 (optional)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Doctor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorEditForm;
