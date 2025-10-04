"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Calendar as CalendarIcon, Clock, User, Stethoscope, Building, CheckCircle, Sun, Settings, RotateCcw, ArrowLeft, ArrowRight, Sunset } from "lucide-react";

// Types for backend integration
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
  doctorCount?: number;
}

interface DoctorSearchParams {
  page?: number;
  size?: number;
  name?: string;
  specialty?: number;
  minFee?: number;
  maxFee?: number;
}

// Types for API responses
interface DoctorSearchResponse {
  doctors: Doctor[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface SpecialtyResponse {
  specialties: Specialty[];
}

interface DoctorSearchByNameResponse {
  doctors: Doctor[];
}

// API Service Class
class ApiService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('Making API request to:', url);
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            console.log('Error response text:', errorText.substring(0, 500));
            if (errorText.includes('<!DOCTYPE html>')) {
              errorMessage = `Backend endpoint not found. Please ensure your Spring Boot application is running and the endpoint ${endpoint} exists.`;
            }
          } catch (textError) {
            console.error('Could not parse error response:', textError);
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Success response data:', data);
      return data;
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend at ${this.baseUrl}. Please ensure your Spring Boot application is running on port 8082.`);
      }
      throw fetchError;
    }
  }

  async getDoctors(params: DoctorSearchParams = {}): Promise<DoctorSearchResponse> {
    // Try different endpoint strategies based on what parameters are provided
    try {
      // Strategy 1: Try the full search endpoint first
      if (params.name || params.specialty || params.minFee || params.maxFee) {
        return await this.tryAdvancedSearch(params);
      }
      
      // Strategy 2: Simple pagination only
      return await this.trySimpleList(params);
      
    } catch (error) {
      console.error('Advanced search failed, trying fallbacks:', error);
      
      // Fallback strategy: Use individual endpoints
      try {
        if (params.name && !params.specialty) {
          // Name search only
          const searchResponse = await this.searchDoctorsByName(params.name);
          return this.transformSearchResponse(searchResponse);
        } else if (params.specialty && !params.name) {
          // Specialty filter only
          return await this.getDoctorsBySpecialty(params.specialty, params.page || 0, params.size || 10);
        } else {
          // Get all doctors
          return await this.trySimpleList(params);
        }
      } catch (fallbackError) {
        console.error('All search strategies failed:', fallbackError);
        // Return empty result instead of throwing
        return {
          doctors: [],
          currentPage: params.page || 0,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false
        };
      }
    }
  }

  private async tryAdvancedSearch(params: DoctorSearchParams): Promise<DoctorSearchResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.size !== undefined) searchParams.append('size', params.size.toString());
    if (params.name) searchParams.append('name', params.name);
    if (params.specialty) searchParams.append('specialty', params.specialty.toString());
    if (params.minFee !== undefined) searchParams.append('minFee', params.minFee.toString());
    if (params.maxFee !== undefined) searchParams.append('maxFee', params.maxFee.toString());
    
    const endpoint = `/api/doctors?${searchParams.toString()}`;
    return await this.makeRequest<DoctorSearchResponse>(endpoint);
  }

  private async trySimpleList(params: DoctorSearchParams): Promise<DoctorSearchResponse> {
    const searchParams = new URLSearchParams();
    
    // Only send basic pagination parameters
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.size !== undefined) searchParams.append('size', params.size.toString());
    searchParams.append('sort', 'id'); // Add default sort
    
    const endpoint = `/api/doctors?${searchParams.toString()}`;
    return await this.makeRequest<DoctorSearchResponse>(endpoint);
  }

  private async getDoctorsBySpecialty(specialtyId: number, page: number, size: number): Promise<DoctorSearchResponse> {
    const endpoint = `/api/doctors/specialty/${specialtyId}?page=${page}&size=${size}`;
    return await this.makeRequest<DoctorSearchResponse>(endpoint);
  }

  private transformSearchResponse(searchResponse: DoctorSearchByNameResponse): DoctorSearchResponse {
    return {
      doctors: searchResponse.doctors,
      currentPage: 0,
      totalItems: searchResponse.doctors.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false
    };
  }

  async getSpecialtiesWithCount(): Promise<SpecialtyResponse> {
    return this.makeRequest<SpecialtyResponse>('/api/specialties/with-count');
  }

  async searchDoctorsByName(name: string): Promise<DoctorSearchByNameResponse> {
    return this.makeRequest<DoctorSearchByNameResponse>(`/api/doctors/search?name=${encodeURIComponent(name)}`);
  }
}

const apiService = new ApiService();

/** ==================== Calendar Component ==================== */
function Calendar({ onChange }: { onChange?: (d: Date | undefined) => void }) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [minDateString, setMinDateString] = useState<string>("");

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow);
    const min = new Date();
    min.setDate(min.getDate() + 1);
    setMinDateString(min.toISOString().split("T")[0]);
  }, []);

  const handleSelect = (d: Date | undefined) => {
    setDate(d);
    onChange?.(d);
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <input
        type="date"
        value={date ? date.toISOString().split("T")[0] : ""}
        min={minDateString || undefined}
        onChange={(e) => handleSelect(e.target.value ? new Date(e.target.value) : undefined)}
        className="w-full p-2 border rounded"
      />
    </div>
  );
}

/** ==================== Main Component ==================== */
export default function DoctorSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for real data
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Search & filters (UI state)
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const doctorsPerPage = 12;

  // Time slots for filtering (UI only - not connected to backend yet)
  const timeSlots = {
    morning: ["9:00-10:00", "10:00-11:00", "11:00-12:00"],
    afternoon: ["12:00-13:00", "13:00-14:00", "14:00-15:00"]
  };

  // Load specialties on mount
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const response = await apiService.getSpecialtiesWithCount();
        setSpecialties(response.specialties);
      } catch (error) {
        console.error('Failed to load specialties:', error);
        setError('Failed to load specialties');
      }
    };
    
    loadSpecialties();
  }, []);

  // Read department from URL
  useEffect(() => {
    const department = searchParams.get("depart");
    if (department) {
      setSelectedDepartment(department);
    }
  }, [searchParams]);

  // Load doctors when filters change
  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Build search params for backend
        const params: DoctorSearchParams = {
          page: currentPage - 1, // Backend uses 0-based pagination
          size: doctorsPerPage,
        };

        // Add search term
        if (searchTerm.trim()) {
          params.name = searchTerm.trim();
        }

        // Add specialty filter
        if (selectedDepartment) {
          const specialty = specialties.find(s => s.name === selectedDepartment);
          if (specialty) {
            params.specialty = specialty.id;
          }
        }

        console.log('Loading doctors with params:', params);

        const response = await apiService.getDoctors(params);
        
        setDoctors(response.doctors);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalItems);
        
      } catch (error) {
        console.error('Failed to load doctors:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load doctors';
        
        // Provide helpful error messages for common issues
        if (errorMessage.includes('JDBC') || errorMessage.includes('PostgreSQL') || errorMessage.includes('function lower')) {
          setError('Database query error in backend. Please check the backend logs and update the DoctorRepository queries.');
        } else if (errorMessage.includes('400')) {
          setError('Backend returned 400 error. Check if all query parameters are supported by your DoctorController.');
        } else if (errorMessage.includes('404')) {
          setError('API endpoint not found. Please ensure your Spring Boot application has the correct controller mappings.');
        } else if (errorMessage.includes('Cannot connect')) {
          setError('Cannot connect to backend. Please ensure your Spring Boot application is running on port 8082.');
        } else {
          setError(`Failed to load doctors: ${errorMessage}`);
        }
        
        // Don't completely break the UI - show empty state
        setDoctors([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    // Only load when specialties are available (to ensure department filtering works)
    if (specialties.length > 0 || !selectedDepartment) {
      loadDoctors();
    }
  }, [currentPage, searchTerm, selectedDepartment, specialties]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
  };

  // Apply filters (for now, just trigger search)
  const applyFilters = () => {
    setCurrentPage(1);
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedTime("");
    setSelectedDate(tomorrow);
    setCurrentPage(1);
    setSearchTerm("");
  };

  // Navigation to doctor detail/booking
  const goDoc = (doctor: Doctor, mode: "detail" | "booking") => {
    const q = new URLSearchParams({
      name: doctor.doctorName,
      department: doctor.specialty.name,
    }).toString();

    const hash = mode === "booking" ? "#booking" : "";
    router.push(`/DocInfoAndBooking/${doctor.id}?${q}${hash}`);
  };

  // Handle time slot selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time === selectedTime ? "" : time);
  };

  // Loading state
  if (loading && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <Stethoscope className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              เลือกแพทย์ผู้เชี่ยวชาญ
            </h1>
          </div>
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
              <p className="text-emerald-700 font-medium">กำลังโหลดข้อมูลแพทย์...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error && doctors.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <Stethoscope className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              เลือกแพทย์ผู้เชี่ยวชาญ
            </h1>
          </div>
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-red-800 font-medium mb-2">เกิดข้อผิดพลาด</h3>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Stethoscope className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            เลือกแพทย์ผู้เชี่ยวชาญ
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            ค้นหาและเลือกแพทย์ที่เหมาะสมกับความต้องการของคุณ พร้อมระบบจองนัดหมายที่สะดวกรวดเร็ว
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="ค้นหาแพทย์ ชื่อ, ความชำนาญ, แผนก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/80"
              />
            </div>

            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-emerald-200"
            >
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">ค้นหา</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`${
                showFilters 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              } px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">ตัวกรอง</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-8 pt-6 border-t border-emerald-200 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">ตัวกรองการค้นหา</h3>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Department - Connected to backend */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-600" />
                    ความชำนาญ
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full rounded-xl border-2 border-emerald-200 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-white/80"
                  >
                    <option value="">เลือกแผนกทั้งหมด</option>
                    {specialties.map((specialty) => (
                      <option key={specialty.id} value={specialty.name}>
                        {specialty.name} {specialty.doctorCount !== undefined && `(${specialty.doctorCount} หมอ)`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Selection - Not connected to backend yet */}
              <div className="space-y-4 opacity-60">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  เวลา <span className="text-xs text-gray-500">(ยังไม่ใช้งาน)</span>
                </label>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-emerald-700 mb-3 flex items-center gap-1">
                      <Sun className="h-4 w-4" />
                      ช่วงเช้า
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {timeSlots.morning.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          disabled
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-not-allowed ${
                            selectedTime === time
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-emerald-700 mb-3 flex items-center gap-1">
                      <Sunset className="h-4 w-4" />
                      ช่วงบ่าย
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {timeSlots.afternoon.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          disabled
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-not-allowed ${
                            selectedTime === time
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date - Not connected to backend yet */}
              <div className="space-y-2 opacity-60">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-600" />
                  วันที่ <span className="text-xs text-gray-500">(ยังไม่ใช้งาน)</span>
                </label>
                <div className="bg-white/50 p-4 rounded-lg border border-emerald-200">
                  <Calendar onChange={setSelectedDate} />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-emerald-200">
                <button
                  onClick={applyFilters}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  ใช้ตัวกรอง
                </button>
                <button
                  onClick={resetFilters}
                  className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  รีเซ็ต
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Department badge */}
        {selectedDepartment && (
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md">
              <span>•</span>
              <span>แผนก{selectedDepartment}</span>
            </div>
          </div>
        )}

        {/* Search results info */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {searchTerm && (
                <>ผลการค้นหา "<span className="font-semibold">{searchTerm}</span>" - </>
              )}
              พบ <span className="font-semibold text-emerald-600">{totalItems}</span> แพทย์
            </p>
            {loading && (
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-200 border-t-emerald-600"></div>
                <span className="text-sm">กำลังค้นหา...</span>
              </div>
            )}
          </div>
        </div>

        {/* Doctors grid */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 mb-8">
          <div className="max-h-[800px] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {doctors.map((doctor) => (
                <div 
                  key={doctor.id} 
                  className="group bg-white border border-emerald-200 rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {doctor.doctorName.charAt(0)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Stethoscope className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-emerald-800 transition-colors">
                      {doctor.doctorName}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <Building className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm text-gray-600 font-medium">{doctor.specialty.name}</p>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <p>ประสบการณ์: {doctor.experienceYears} ปี</p>
                      <p className="text-emerald-600 font-medium">ค่าตรวจ: ฿{doctor.consultationFee}</p>
                      {doctor.roomNumber && <p>ห้อง: {doctor.roomNumber}</p>}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => goDoc(doctor, "booking")}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-200"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">นัดหมาย</span>
                    </button>

                    <button
                      onClick={() => goDoc(doctor, "detail")}
                      className="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 hover:border-emerald-400 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">รายละเอียด</span>
                    </button>
                  </div>
                </div>
              ))}
              
              {doctors.length === 0 && !loading && (
                <div className="col-span-full text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-gray-600">
                      <h3 className="text-lg font-semibold mb-1">ไม่พบแพทย์ที่ตรงกับการค้นหา</h3>
                      <p className="text-sm">กรุณาลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 font-medium">
              แสดง {((currentPage - 1) * doctorsPerPage) + 1}-{Math.min(currentPage * doctorsPerPage, totalItems)} จาก {totalItems} แพทย์
              <span className="text-emerald-600 ml-1">(หน้า {currentPage} จาก {totalPages})</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                ก่อนหน้า
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                        currentPage === pageNum 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200" 
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-emerald-200"
              >
                หน้าต่อไป
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Backend Integration Status Info */}
        
      </div>
      
      <Footer />
    </div>
  );
}