'use client';

import { useState, useEffect, useRef } from 'react';
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

type BackendStatus = 'checking' | 'connected' | 'disconnected';

interface UseAdminDataReturn {
  doctors: Doctor[];
  specialties: Specialty[];
  users: User[];
  loading: boolean;
  error: string;
  backendStatus: BackendStatus;
  loadData: () => Promise<void>;
  loadDoctors: () => Promise<void>;
  loadSpecialties: () => Promise<void>;
  loadUsers: () => Promise<void>;
  checkBackendConnection: () => Promise<void>;
  toggleDoctorStatus: (doctorId: number, currentStatus: boolean) => Promise<void>;
  deleteSpecialty: (specialtyId: number) => Promise<void>;
  deleteDoctor: (doctorId: number) => Promise<void>;
}

export const useAdminData = (apiBaseUrl: string): UseAdminDataReturn => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  
  // Ref to track doctor counts per specialty to avoid infinite loops
  const previousDoctorCountsRef = useRef<Map<number, number>>(new Map());

  // Update specialty doctor counts whenever doctors array changes
  useEffect(() => {
    if (doctors.length > 0 && specialties.length > 0) {
      let hasChanged = false;
      const currentCounts = new Map<number, number>();
      
      // Calculate current doctor counts for each specialty
      specialties.forEach(specialty => {
        const activeDocotrsCount = doctors.filter(doctor => 
          doctor.specialty.id === specialty.id && doctor.isActive
        ).length;
        currentCounts.set(specialty.id, activeDocotrsCount);
        
        // Check if count changed for this specialty
        const previousCount = previousDoctorCountsRef.current.get(specialty.id);
        if (previousCount !== activeDocotrsCount) {
          hasChanged = true;
        }
      });
      
      // Only update if there's actually a change
      if (hasChanged) {
        const updatedSpecialties = specialties.map(specialty => ({
          ...specialty,
          doctorCount: currentCounts.get(specialty.id) || 0
        }));
        
        setSpecialties(updatedSpecialties);
        previousDoctorCountsRef.current = currentCounts;
      }
    }
  }, [doctors]); // Only depend on doctors array

  const checkBackendConnection = async () => {
    try {
      console.log('Checking backend connection to:', apiBaseUrl);
      const response = await fetch(`${apiBaseUrl}/api/specialties`, {
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
      setError(`Cannot connect to backend at ${apiBaseUrl}. Please ensure your Spring Boot application is running on port 8082.`);
    }
  };

  const loadDoctors = async () => {
    try {
      console.log('Loading doctors from:', `${apiBaseUrl}/api/doctors`);

      // For admin dashboard, include inactive doctors and request all records (size=1000)
      const response = await fetch(`${apiBaseUrl}/api/doctors?includeInactive=true&size=1000`);
      
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
      console.log('Loading users from:', `${apiBaseUrl}/api/users/all`);
      
      // Try to load users from backend admin endpoint
      const response = await fetch(`${apiBaseUrl}/api/users/all`, {
        headers: getAuthHeaders()
      });
      
      console.log('Users response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users loaded from backend:', data);
        // Load all users (no filtering by role - let DoctorForm handle the filtering)
        setUsers(data.users || []);
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
      console.log('Loading specialties from:', `${apiBaseUrl}/api/specialties/with-count`);
      
      // Try the public endpoint first
      let response = await fetch(`${apiBaseUrl}/api/specialties/with-count`);
      
      console.log('Specialties response status:', response.status);
      
      if (!response.ok) {
        // If public endpoint fails, try admin endpoint with auth
        console.log('Public specialties endpoint failed, trying admin endpoint');
        response = await fetch(`${apiBaseUrl}/api/admin/specialties/with-count`, {
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

  const toggleDoctorStatus = async (doctorId: number, currentStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/doctors/${doctorId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !currentStatus })
      });

      if (response.ok) {
        // Find the doctor's specialty to update count immediately
        const doctor = doctors.find(d => d.id === doctorId);
        const specialtyId = doctor?.specialty.id;
        
        // Update the local state to reflect the change immediately
        setDoctors(doctors.map(doc => 
          doc.id === doctorId ? {...doc, isActive: !currentStatus} : doc
        ));
        
        // Immediately update specialty count for better UX
        if (specialtyId) {
          setSpecialties(prev => prev.map(specialty => {
            if (specialty.id === specialtyId) {
              const countChange = !currentStatus ? 1 : -1; // +1 if activating, -1 if deactivating
              return { ...specialty, doctorCount: Math.max(0, specialty.doctorCount + countChange) };
            }
            return specialty;
          }));
        }
        
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
      const response = await fetch(`${apiBaseUrl}/api/admin/specialties/${specialtyId}`, {
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

  const deleteDoctor = async (doctorId: number) => {
    setLoading(true);
    try {
      console.log('Deleting doctor:', doctorId);
      console.log('API URL:', `${apiBaseUrl}/api/admin/doctors/${doctorId}`);

      const response = await fetch(`${apiBaseUrl}/api/admin/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        // Find the doctor's specialty to update count
        const doctor = doctors.find(d => d.id === doctorId);
        const specialtyId = doctor?.specialty.id;

        // Remove doctor from state
        setDoctors(doctors.filter(d => d.id !== doctorId));

        // Update specialty count if doctor was active
        if (specialtyId && doctor?.isActive) {
          setSpecialties(prev => prev.map(specialty => {
            if (specialty.id === specialtyId) {
              return { ...specialty, doctorCount: Math.max(0, specialty.doctorCount - 1) };
            }
            return specialty;
          }));
        }

        alert('Doctor deleted successfully!');
      } else {
        // Get detailed error message
        const errorText = await response.text();
        console.error('Delete failed - Status:', response.status);
        console.error('Delete failed - Response:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          alert(`Delete failed: ${errorData.message || `Status ${response.status}`}`);
        } catch {
          alert(`Delete failed: ${errorText.substring(0, 200)}`);
        }
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Error deleting doctor: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return {
    doctors,
    specialties,
    users,
    loading,
    error,
    backendStatus,
    loadData,
    loadDoctors,
    loadSpecialties,
    loadUsers,
    checkBackendConnection,
    toggleDoctorStatus,
    deleteSpecialty,
    deleteDoctor
  };
};