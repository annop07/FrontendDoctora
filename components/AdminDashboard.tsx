// Updated AdminDashboard with proper API URL handling
// components/AdminDashboard.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Stethoscope, Building, Plus, Edit, Trash2, Search } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

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

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [showCreateSpecialty, setShowCreateSpecialty] = useState(false);
  const [showEditSpecialty, setShowEditSpecialty] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Use environment variable or fallback to localhost
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      console.log('Checking backend connection to:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/specialties`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setBackendStatus('connected');
        loadData();
      } else {
        throw new Error(`Backend responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendStatus('disconnected');
      setError(`Cannot connect to backend at ${API_BASE_URL}. Please ensure your Spring Boot application is running on port 8082.`);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleApiError = async (response: Response, context: string) => {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `${context} failed`);
      } catch (jsonError) {
        throw new Error(`${context} failed with status ${response.status}`);
      }
    } else {
      // HTML response means we probably hit a Next.js route instead of backend
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 500));
      
      if (text.includes('<!DOCTYPE html>')) {
        throw new Error(`API request was handled by Next.js instead of backend. Please check:\n1. Backend is running on ${API_BASE_URL}\n2. CORS is configured properly\n3. API endpoints exist`);
      }
      
      if (response.status === 404) {
        throw new Error(`API endpoint not found. Please check if backend is running and endpoint exists.`);
      } else if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed. Please login again or check admin permissions.`);
      } else {
        throw new Error(`${context} failed: Server returned HTML instead of JSON (Status: ${response.status})`);
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load specialties first
      await loadSpecialties();
      
      // Load doctors
      await loadDoctors();
      
      // Load users with DOCTOR role
      await loadUsers();
    } catch (error) {
      console.error('Error loading data:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
  try {
    console.log('Loading doctors from:', `${API_BASE_URL}/api/doctors`);
    
    // Use public endpoint - no authentication required
    const response = await fetch(`${API_BASE_URL}/api/doctors`);
    
    console.log('Doctors response status:', response.status);
    console.log('Doctors response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Doctors loaded:', data);
      setDoctors(data.doctors || []);
    } else {
      // Log the actual response for debugging
      const responseText = await response.text();
      console.error('Doctors endpoint failed:', response.status, responseText);
      
      if (response.status === 401 || response.status === 403) {
        console.warn('Authentication issue with doctors endpoint, using fallback data');
      }
      
      // Use fallback data instead of throwing error
      setDoctors([]);
    }
  } catch (error) {
    console.error('Error loading doctors:', error);
    // Use fallback data
    setDoctors([]);
  }
};

const loadUsers = async () => {
  try {
    console.log('Loading users from:', `${API_BASE_URL}/api/users/all`);
    
    // Try to load users from backend admin endpoint
    const response = await fetch(`${API_BASE_URL}/api/users/all`, {
      headers: getAuthHeaders()
    });
    
    console.log('Users response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Users loaded from backend:', data);
      // Filter only users with DOCTOR role
      const doctorUsers = data.users?.filter((user: User) => user.role === 'DOCTOR') || [];
      setUsers(doctorUsers);
    } else {
      const responseText = await response.text();
      console.error('Users endpoint failed:', response.status, responseText);
      throw new Error(`Failed to load users: ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading users from backend, using mock data:', error);
    
    // Use enhanced mock data with more realistic users
    setUsers([
      { 
        id: 1, 
        email: 'john.doe@example.com', 
        firstName: 'John', 
        lastName: 'Doe', 
        role: 'DOCTOR' 
      },
      { 
        id: 2, 
        email: 'sarah.wilson@example.com', 
        firstName: 'Sarah', 
        lastName: 'Wilson', 
        role: 'DOCTOR' 
      },
      { 
        id: 3, 
        email: 'michael.brown@example.com', 
        firstName: 'Michael', 
        lastName: 'Brown', 
        role: 'DOCTOR' 
      },
      { 
        id: 4, 
        email: 'emily.davis@example.com', 
        firstName: 'Emily', 
        lastName: 'Davis', 
        role: 'DOCTOR' 
      }
    ]);
  }
};

const loadSpecialties = async () => {
  try {
    console.log('Loading specialties from:', `${API_BASE_URL}/api/specialties/with-count`);
    
    // Try the public endpoint first
    let response = await fetch(`${API_BASE_URL}/api/specialties/with-count`);
    
    console.log('Specialties response status:', response.status);
    
    if (!response.ok) {
      // If public endpoint fails, try admin endpoint with auth
      console.log('Public specialties endpoint failed, trying admin endpoint');
      response = await fetch(`${API_BASE_URL}/api/admin/specialties/with-count`, {
        headers: getAuthHeaders()
      });
      console.log('Admin specialties response status:', response.status);
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('Specialties loaded:', data);
      setSpecialties(data.specialties || []);
    } else {
      const responseText = await response.text();
      console.error('Specialties endpoints failed:', response.status, responseText);
      throw new Error(`Failed to load specialties: ${response.status}`);
    }
  } catch (error) {
    console.error('Error loading specialties, using fallback data:', error);
    // Use fallback data for demonstration
    setSpecialties([
      { id: 1, name: 'Cardiology', description: 'Heart and cardiovascular diseases', doctorCount: 5 },
      { id: 2, name: 'Pediatrics', description: 'Medical care for children', doctorCount: 3 },
      { id: 3, name: 'Internal Medicine', description: 'General internal medicine', doctorCount: 7 },
      { id: 4, name: 'Surgery', description: 'Surgical procedures', doctorCount: 4 },
      { id: 5, name: 'Emergency Medicine', description: 'Emergency care', doctorCount: 6 }
    ]);
  }
};

  const CreateSpecialtyForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: ''
    });
    const [submitError, setSubmitError] = useState('');

    const handleSubmit = async () => {
      if (!formData.name.trim()) {
        alert('Please enter a specialty name');
        return;
      }

      setLoading(true);
      setSubmitError('');
      
      try {
        const headers = getAuthHeaders();
        const url = `${API_BASE_URL}/api/admin/specialties`;
        
        console.log('Sending request to:', url);
        console.log('With data:', formData);
        console.log('With headers:', headers);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(formData)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const result = await response.json();
          console.log('Success response:', result);
          alert('Specialty created successfully!');
          setShowCreateSpecialty(false);
          await loadSpecialties(); // Refresh specialties list
        } else {
          await handleApiError(response, 'Creating specialty');
        }
      } catch (error) {
        console.error('Error creating specialty:', error);
        const errorMessage = (error as Error).message;
        setSubmitError(errorMessage);
        alert('Error creating specialty: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create New Specialty</h3>
          
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Specialty Name</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
                placeholder="e.g., Cardiology, Neurology"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 h-24"
                placeholder="Brief description of the specialty"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button 
                type="button"
                onClick={() => setShowCreateSpecialty(false)}
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
                {loading ? 'Creating...' : 'Create Specialty'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditSpecialtyForm = () => {
    const [formData, setFormData] = useState({
      name: editingSpecialty?.name || '',
      description: editingSpecialty?.description || ''
    });
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
      if (editingSpecialty) {
        setFormData({
          name: editingSpecialty.name,
          description: editingSpecialty.description
        });
      }
    }, [editingSpecialty]);

    const handleSubmit = async () => {
      if (!formData.name.trim()) {
        alert('Please enter a specialty name');
        return;
      }

      if (!editingSpecialty) {
        alert('No specialty selected for editing');
        return;
      }

      setLoading(true);
      setSubmitError('');
      
      try {
        const headers = getAuthHeaders();
        const url = `${API_BASE_URL}/api/admin/specialties/${editingSpecialty.id}`;
        
        console.log('Sending update request to:', url);
        console.log('With data:', formData);
        console.log('With headers:', headers);
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(formData)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const result = await response.json();
          console.log('Success response:', result);
          alert('Specialty updated successfully!');
          setShowEditSpecialty(false);
          setEditingSpecialty(null);
          await loadSpecialties(); // Refresh specialties list
        } else {
          await handleApiError(response, 'Updating specialty');
        }
      } catch (error) {
        console.error('Error updating specialty:', error);
        const errorMessage = (error as Error).message;
        setSubmitError(errorMessage);
        alert('Error updating specialty: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Edit Specialty</h3>
          
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Specialty Name</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                required
                placeholder="e.g., Cardiology, Neurology"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 h-24"
                placeholder="Brief description of the specialty"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button 
                type="button"
                onClick={() => {
                  setShowEditSpecialty(false);
                  setEditingSpecialty(null);
                }}
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
                {loading ? 'Updating...' : 'Update Specialty'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

const CreateDoctorForm = () => {
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
      // Check if doctor already exists in the selected specialty
      const selectedUser = users.find(user => user.id.toString() === formData.userId);
      const existingDoctor = doctors.find(doctor => 
        doctor.email === selectedUser?.email && 
        doctor.specialty.id.toString() === formData.specialtyId
      );

      if (existingDoctor) {
        setSubmitError(`Doctor ${selectedUser?.firstName} ${selectedUser?.lastName} is already assigned to this specialty.`);
        setLoading(false);
        return;
      }

      // Ensure numeric values are properly formatted
      const payload = {
        userId: parseInt(formData.userId),
        specialtyId: parseInt(formData.specialtyId),
        licenseNumber: formData.licenseNumber.trim(),
        bio: formData.bio.trim() || null, // Send null if empty
        experienceYears: formData.experienceYears || 0,
        consultationFee: formData.consultationFee || 500.00,
        roomNumber: formData.roomNumber.trim() || null // Send null if empty
      };

      console.log('Sending doctor creation payload:', payload);

      const response = await fetch(`${API_BASE_URL}/api/admin/doctors`, {
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
        setShowCreateDoctor(false);
        await loadDoctors(); // Refresh doctors list
      } else {
        // Enhanced error handling for 400 status and duplicate doctor scenarios
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            console.error('Server error details:', errorData);
            
            // Check for specific error messages indicating duplicate doctor
            if (errorData.message && 
                (errorData.message.toLowerCase().includes('already exists') || 
                 errorData.message.toLowerCase().includes('duplicate') ||
                 errorData.message.toLowerCase().includes('already assigned'))) {
              setSubmitError(`This user is already registered as a doctor in the selected specialty. Please choose a different user or specialty.`);
            } else if (errorData.message) {
              setSubmitError(errorData.message);
            } else if (errorData.errors) {
              // Handle field-specific validation errors
              setValidationErrors(errorData.errors);
            } else {
              setSubmitError('Server validation failed. Please check your input.');
            }
          } catch (jsonError) {
            setSubmitError(`Request failed with status ${response.status}. Please check your input and try again.`);
          }
        } else {
          setSubmitError(`Request failed with status ${response.status}. Please check if the backend is running.`);
        }
      }
    } catch (error) {
      console.error('Error creating doctor:', error);
      const errorMessage = (error as Error).message;
      
      // Handle network errors and other exceptions
      if (errorMessage.toLowerCase().includes('fetch')) {
        setSubmitError('Network error: Unable to connect to server. Please check your connection and try again.');
      } else if (errorMessage.toLowerCase().includes('duplicate') || 
                 errorMessage.toLowerCase().includes('already exists')) {
        setSubmitError('This doctor already exists in the system. Please check and try with different details.');
      } else {
        setSubmitError(`Error creating doctor: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const doctorUsers = users.filter(user => user.role === 'DOCTOR');

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
              <option value="">Select a user with DOCTOR role</option>
              {doctorUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
            {validationErrors.userId && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.userId}</p>
            )}
            {doctorUsers.length === 0 && (
              <p className="text-sm text-yellow-600 mt-1">
                No users with DOCTOR role found. Please create a user with DOCTOR role first.
              </p>
            )}
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
              onClick={() => setShowCreateDoctor(false)}
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

  const toggleDoctorStatus = async (doctorId: number, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/doctors/${doctorId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !currentStatus })
      });

      if (response.ok) {
        // Update the local state to reflect the change immediately
        // This ensures the doctor remains in the list but with updated status
        setDoctors(doctors.map(doctor => 
          doctor.id === doctorId ? {...doctor, isActive: !currentStatus} : doctor
        ));
        alert(`Doctor status updated to ${!currentStatus ? 'Active' : 'Inactive'} successfully!`);
      } else {
        await handleApiError(response, 'Updating doctor status');
      }
    } catch (error) {
      console.error('Error updating doctor status:', error);
      alert('Error updating status: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSpecialty = async (specialtyId: number) => {
    if (!confirm('Are you sure you want to delete this specialty?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/specialties/${specialtyId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setSpecialties(specialties.filter(s => s.id !== specialtyId));
        alert('Specialty deleted successfully!');
      } else {
        await handleApiError(response, 'Deleting specialty');
      }
    } catch (error) {
      console.error('Error deleting specialty:', error);
      alert('Error deleting specialty: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !filterSpecialty || doctor.specialty.id.toString() === filterSpecialty;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && doctor.isActive) ||
                         (filterStatus === 'inactive' && !doctor.isActive);
    
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const filteredSpecialties = specialties.filter(specialty =>
    specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    specialty.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-600" />
              <span className="ml-2 text-xl font-semibold">Admin Dashboard</span>
              
              {/* Backend Status Indicator */}
              <div className="ml-4 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  backendStatus === 'connected' ? 'bg-green-500' : 
                  backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {backendStatus === 'connected' ? 'Backend Connected' : 
                   backendStatus === 'disconnected' ? 'Backend Disconnected' : 'Checking...'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Administrator</span>
              <button 
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Connection Error */}
      {backendStatus === 'disconnected' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Backend Connection Failed</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <div className="mt-3 text-sm text-red-700">
              <p className="font-medium">To fix this issue:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Start your Spring Boot backend: <code className="bg-red-100 px-1 rounded">mvn spring-boot:run</code></li>
                <li>Verify it's running on port 8082: <code className="bg-red-100 px-1 rounded">curl {API_BASE_URL}/api/specialties</code></li>
                <li>Check CORS configuration in your backend</li>
                <li>Ensure your database is running</li>
              </ol>
            </div>
            <button 
              onClick={checkBackendConnection}
              className="mt-3 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && backendStatus !== 'disconnected' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">System Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button 
              onClick={loadData}
              className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content - only show if backend is connected */}
      {backendStatus === 'connected' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Navigation */}
          <div className="flex space-x-8 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'doctors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Stethoscope className="w-5 h-5 mr-2" />
                Manage Doctors
              </div>
            </button>
            <button
              onClick={() => setActiveTab('specialties')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'specialties'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Manage Specialties
              </div>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {activeTab === 'doctors' && (
              <>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Specialties</option>
                  {specialties.map(specialty => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                <button
                  onClick={() => setShowCreateDoctor(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Doctor
                </button>
              </>
            )}
            
            {activeTab === 'specialties' && (
              <button
                onClick={() => setShowCreateSpecialty(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Specialty
              </button>
            )}
          </div>

          {/* Content Tables */}
          {activeTab === 'doctors' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium">Doctors Management</h2>
                <p className="text-sm text-gray-500">Manage doctor profiles and status</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDoctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{doctor.doctorName}</div>
                            <div className="text-sm text-gray-500">{doctor.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doctor.specialty.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doctor.licenseNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doctor.experienceYears} years</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">฿{doctor.consultationFee}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doctor.roomNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleDoctorStatus(doctor.id, doctor.isActive)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                doctor.isActive ? 'bg-green-600' : 'bg-gray-300'
                              }`}
                              disabled={loading}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  doctor.isActive ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className={`ml-3 text-xs font-medium ${
                              doctor.isActive ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {doctor.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className="text-gray-400">No actions</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'specialties' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium">Specialties Management</h2>
                <p className="text-sm text-gray-500">Manage medical specialties</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctors Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSpecialties.map((specialty) => (
                      <tr key={specialty.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{specialty.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{specialty.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {specialty.doctorCount} doctors
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => {
                              setEditingSpecialty(specialty);
                              setShowEditSpecialty(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3" 
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteSpecialty(specialty.id)}
                            className={`${
                              specialty.doctorCount > 0 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-red-600 hover:text-red-900'
                            }`}
                            disabled={specialty.doctorCount > 0}
                            title={specialty.doctorCount > 0 ? 'Cannot delete - has doctors' : 'Delete'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateDoctor && <CreateDoctorForm />}
      {showCreateSpecialty && <CreateSpecialtyForm />}
      {showEditSpecialty && <EditSpecialtyForm />}
    </div>
  );
};

export default AdminDashboard;