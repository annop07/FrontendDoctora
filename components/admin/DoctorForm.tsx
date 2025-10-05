'use client';

import React, { useState } from 'react';
import { getAuthHeaders, handleApiError } from '@/lib/auth-utils';

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
}

interface Specialty {
  id: number;
  name: string;
  description: string;
  doctorCount: number;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface DoctorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onDoctorCreated: () => void;
  users: User[];
  specialties: Specialty[];
  doctors: Doctor[];
  apiBaseUrl: string;
}

const DoctorForm: React.FC<DoctorFormProps> = ({
  isOpen,
  onClose,
  onDoctorCreated,
  users,
  specialties,
  doctors,
  apiBaseUrl
}) => {
  const [formData, setFormData] = useState({
    userId: '',
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

  // Helper function to check if user is already a doctor
  const checkExistingDoctorAssignment = (userId: string) => {
    const selectedUser = users.find(user => user.id.toString() === userId);
    return doctors.find(doctor => doctor.email === selectedUser?.email);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.userId) {
      errors.userId = 'Please select a user';
    }
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Check if user is already assigned as a doctor
      const selectedUser = users.find(user => user.id.toString() === formData.userId);
      const existingDoctorAssignment = checkExistingDoctorAssignment(formData.userId);

      if (existingDoctorAssignment) {
        const assignedSpecialty = specialties.find(s => s.id === existingDoctorAssignment.specialty.id);
        
        // Check if trying to assign to the same specialty
        if (existingDoctorAssignment.specialty.id.toString() === formData.specialtyId) {
          setSubmitError(`Doctor ${selectedUser?.firstName} ${selectedUser?.lastName} is already assigned to this specialty: ${assignedSpecialty?.name || existingDoctorAssignment.specialty.name}.`);
        } else {
          // Trying to assign to a different specialty
          setSubmitError(`Doctor ${selectedUser?.firstName} ${selectedUser?.lastName} is already assigned to another specialty: ${assignedSpecialty?.name || existingDoctorAssignment.specialty.name}. A doctor can only be assigned to one specialty at a time. Please choose a different user.`);
        }
        setLoading(false);
        return;
      }

      // Ensure numeric values are properly formatted
      const payload = {
        userId: parseInt(formData.userId),
        specialtyId: parseInt(formData.specialtyId),
        licenseNumber: formData.licenseNumber.trim(),
        bio: formData.bio.trim() || null,
        experienceYears: formData.experienceYears || 0,
        consultationFee: formData.consultationFee || 500.00,
        roomNumber: formData.roomNumber.trim() || null
      };

      console.log('Sending doctor creation payload:', payload);

      const response = await fetch(`${apiBaseUrl}/api/admin/doctors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        alert('Doctor created successfully!');
        onClose();
        onDoctorCreated();
      } else {
        // Log the error response body for debugging
        const errorText = await response.text();
        console.error('Error response body:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          setSubmitError(errorData.message || `Failed with status ${response.status}`);
        } catch {
          setSubmitError(errorText || `Failed with status ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error creating doctor:', error);
      const errorMessage = (error as Error).message;
      
      // Handle network errors and other exceptions
      if (errorMessage.toLowerCase().includes('fetch')) {
        setSubmitError('Network error: Unable to connect to server. Please check your connection and try again.');
      } else if (errorMessage.toLowerCase().includes('duplicate') || 
                 errorMessage.toLowerCase().includes('already exists') ||
                 errorMessage.toLowerCase().includes('another specialty') ||
                 errorMessage.toLowerCase().includes('already assigned')) {
        setSubmitError('This doctor already exists in the system or is assigned to another specialty. Please check existing assignments and try with different details.');
      } else {
        setSubmitError(`Error creating doctor: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter users who are not already doctors and have PATIENT role
  const availableUsers = users.filter(user => {
    const isAlreadyDoctor = doctors.some(doc => doc.email === user.email);
    const isPatientRole = user.role === 'PATIENT';
    return !isAlreadyDoctor && isPatientRole;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create New Doctor</h3>
        
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select User *</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
              className={`w-full border rounded-lg px-3 py-2 ${
                validationErrors.userId ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a user to promote to Doctor</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
            {validationErrors.userId && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.userId}</p>
            )}
            {availableUsers.length === 0 && (
              <p className="text-sm text-yellow-600 mt-1">
                No PATIENT users available. All PATIENT users are already assigned as doctors or no PATIENT users exist. Please create a new PATIENT user first.
              </p>
            )}
            {formData.userId && (() => {
              const selectedUser = users.find(user => user.id.toString() === formData.userId);
              const existingAssignment = checkExistingDoctorAssignment(formData.userId);
              if (existingAssignment) {
                const assignedSpecialty = specialties.find(s => s.id === existingAssignment.specialty.id);
                return (
                  <p className="text-sm text-orange-600 mt-1 bg-orange-50 p-2 rounded border border-orange-200">
                    ⚠️ Warning: {selectedUser?.firstName} {selectedUser?.lastName} is already assigned to {assignedSpecialty?.name || existingAssignment.specialty.name} specialty.
                  </p>
                );
              }
              return null;
            })()}
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
              {loading ? 'Creating...' : 'Create Doctor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorForm;