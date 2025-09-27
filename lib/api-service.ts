import { AuthService } from './auth-service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export interface Doctor {
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
  education?: string;
  languages?: string[];
  availableTimes?: string[];
  nextAvailableTime?: string;
}

export interface Specialty {
  id: number;
  name: string;
  description: string;
  doctorCount?: number;
}

export interface DoctorSearchParams {
  page?: number;
  size?: number;
  name?: string;
  specialty?: number;
  minFee?: number;
  maxFee?: number;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...AuthService.getAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Doctors API
  async getDoctors(params: DoctorSearchParams = {}): Promise<{
    doctors: Doctor[];
    currentPage: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.makeRequest(`/api/doctors?${searchParams.toString()}`);
  }

  async getDoctorById(id: number): Promise<Doctor> {
    return this.makeRequest(`/api/doctors/${id}`);
  }

  async getDoctorsBySpecialty(
    specialtyId: number, 
    page = 0, 
    size = 10
  ): Promise<{
    specialty: Specialty;
    doctors: Doctor[];
    currentPage: number;
    totalItems: number;
    totalPages: number;
  }> {
    return this.makeRequest(
      `/api/doctors/specialty/${specialtyId}?page=${page}&size=${size}`
    );
  }

  async searchDoctorsByName(name: string): Promise<{ doctors: Doctor[] }> {
    return this.makeRequest(`/api/doctors/search?name=${encodeURIComponent(name)}`);
  }

  // Specialties API
  async getSpecialties(): Promise<{ specialties: Specialty[] }> {
    return this.makeRequest('/api/specialties');
  }

  async getSpecialtiesWithCount(): Promise<{ specialties: Specialty[] }> {
    return this.makeRequest('/api/specialties/with-count');
  }

  async getSpecialtyById(id: number): Promise<Specialty> {
    return this.makeRequest(`/api/specialties/${id}`);
  }

  async searchSpecialties(name: string): Promise<{ specialties: Specialty[] }> {
    return this.makeRequest(`/api/specialties/search?name=${encodeURIComponent(name)}`);
  }
}

export const apiService = new ApiService();