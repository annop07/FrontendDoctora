'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthService } from '@/lib/auth-service';

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
  createdAt?: string;
  updatedAt?: string;
}

interface Specialty {
  id: number;
  name: string;
  description: string;
  doctorCount: number;
  createdAt?: string;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: string;
}

interface DoctorStats {
  totalDoctors: number;
  totalSpecialties: number;
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
  getAuthHeaders: () => Record<string, string>;
  handleApiError: (response: Response, context: string) => Promise<void>;
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
        const activeDoctorsCount = doctors.filter(doctor => 
          doctor.specialty.id === specialty.id && doctor.isActive
        ).length;
        currentCounts.set(specialty.id, activeDoctorsCount);
        
        // Check if count changed for this specialty
        const previousCount = previousDoctorCountsRef.current.get(specialty.id);
        if (previousCount !== activeDoctorsCount) {
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

  const getAuthHeaders = () => {
    try {
      return AuthService.getAuthHeaders();
    } catch (error) {
      console.error('Failed to get auth headers:', error);
      throw new Error('No authentication token found. Please login again.');
    }
  };

  const handleApiError = async (response: Response, context: string) => {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        const errorMessage = errorData.message || `${context} failed`;
        throw new Error(errorMessage);
      } catch (jsonError) {
        throw new Error(`${context} failed with status ${response.status}`);
      }
    } else {
      // HTML response means we probably hit a Next.js route instead of backend
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 500));
      
      if (text.includes('<!DOCTYPE html>')) {
        throw new Error(`API request was handled by Next.js instead of backend. Please check:\n1. Backend is running on ${apiBaseUrl}\n2. CORS is configured properly\n3. API endpoints exist`);
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

  const checkBackendConnection = async () => {
    try {
      console.log('Checking backend connection to:', apiBaseUrl);
      setBackendStatus('checking');
      setError('');
      
      const response = await fetch(`${apiBaseUrl}/api/specialties`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setBackendStatus('connected');
        console.log('Backend connection successful');
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
      
      // For admin dashboard, include inactive doctors by adding the parameter
      const response = await fetch(`${apiBaseUrl}/api/doctors?includeInactive=true`, {
        headers: getAuthHeaders()
      });
      
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
          console.warn('Authentication issue with doctors endpoint, trying public endpoint');
          
          // Try public endpoint as fallback
          const publicResponse = await fetch(`${apiBaseUrl}/api/doctors`);
          if (publicResponse.ok) {
            const publicData = await publicResponse.json();
            setDoctors(publicData.doctors || []);
          } else {
            setDoctors([]);
          }
        } else {
          setDoctors([]);
        }
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
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
        },
        { 
          id: 5, 
          email: 'thai.doctor@example.com', 
          firstName: 'นพ.สมชาย', 
          lastName: 'ใจดี', 
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
        { id: 1, name: 'กระดูกและข้อ', description: 'ผู้เชี่ยวชาญด้านกระดูกและข้อ', doctorCount: 0 },
        { id: 2, name: 'กุมารเวชกรรม', description: 'แพทย์เด็ก', doctorCount: 0 },
        { id: 3, name: 'นรีเวชกรรม', description: 'แพทย์หญิง', doctorCount: 0 },
        { id: 4, name: 'หัวใจและทรวงอก', description: 'ผู้เชี่ยวชาญด้านหัวใจ', doctorCount: 0 },
        { id: 5, name: 'ศัลยกรรมทั่วไป', description: 'ศัลยแพทย์ทั่วไป', doctorCount: 0 },
        { id: 6, name: 'ผิวหนัง', description: 'ผู้เชี่ยวชาญด้านผิวหนัง', doctorCount: 0 }
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
        
        console.log(`Doctor status updated to ${!currentStatus ? 'Active' : 'Inactive'} successfully!`);
      } else {
        await handleApiError(response, 'Updating doctor status');
      }
    } catch (error) {
      console.error('Error updating doctor status:', error);
      throw new Error('Error updating status: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSpecialty = async (specialtyId: number) => {    
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/specialties/${specialtyId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setSpecialties(specialties.filter(s => s.id !== specialtyId));
        console.log('Specialty deleted successfully!');
      } else {
        await handleApiError(response, 'Deleting specialty');
      }
    } catch (error) {
      console.error('Error deleting specialty:', error);
      throw new Error('Error deleting specialty: ' + (error as Error).message);
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
    getAuthHeaders,
    handleApiError
  };
};