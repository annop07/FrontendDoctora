import { AuthService } from "./auth-service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export interface DoctorProfile {
  id: number;
  doctorName: string;
  email: string;
  licenseNumber: string;
  bio: string;
  experienceYears: number;
  consultationFee: number;
  roomNumber: string;
  isActive: boolean;
  phone: string;
  specialty: {
    id: number;
    name: string;
  };
  createdAt: string;
}

export interface DoctorAppointment {
  id: number;
  doctor: {
    id: number;
    doctorName: string;
    specialty: {
      id: number;
      name: string;
    };
  };
  patient: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  appointmentDatetime: string;
  durationMinutes: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes: string;
  doctorNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorStats {
  totalDoctors: number;
  activeDoctors: number;
  averageExperience: number;
  averageConsultationFee: number;
}

export class DoctorService {
  private static getAuthHeaders() {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get current doctor's profile
   */
  static async getMyProfile(): Promise<DoctorProfile> {
    const response = await fetch(`${API_BASE_URL}/api/doctors/profile/my`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to fetch doctor profile');
    }

    return response.json();
  }

  /**
   * Update current doctor's profile
   */
  static async updateMyProfile(profileData: {
    bio?: string;
    experienceYears?: number;
    consultationFee?: number;
    roomNumber?: string;
  }): Promise<{ message: string; doctor: DoctorProfile }> {
    const response = await fetch(`${API_BASE_URL}/api/doctors/profile/my`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to update doctor profile');
    }

    return response.json();
  }

  /**
   * Get current doctor's appointments
   */
  static async getMyAppointments(): Promise<{appointments: DoctorAppointment[]}> {
    const response = await fetch(`${API_BASE_URL}/api/appointments/doctor/my`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch doctor appointments');
    }

    return response.json();
  }

  /**
   * Get general doctor statistics (public API)
   */
  static async getDoctorStats(): Promise<DoctorStats> {
    const response = await fetch(`${API_BASE_URL}/api/doctors/stats`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch doctor statistics');
    }

    return response.json();
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(appointmentId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to cancel appointment');
    }
  }

  /**
   * Helper: Format appointment datetime for display
   */
  static formatAppointmentDateTime(datetime: string): { date: string; time: string } {
    const dt = new Date(datetime);
    const date = dt.toLocaleDateString('th-TH');
    const time = dt.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return { date, time };
  }

  /**
   * Helper: Get status color for appointments
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'CONFIRMED': 'text-green-600 bg-green-50 border-green-200',
      'CANCELLED': 'text-red-600 bg-red-50 border-red-200',
      'COMPLETED': 'text-blue-600 bg-blue-50 border-blue-200',
    };
    return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
  }

  /**
   * Helper: Get status text in Thai
   */
  static getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'รอการยืนยัน',
      'CONFIRMED': 'ยืนยันแล้ว',
      'CANCELLED': 'ยกเลิกแล้ว',
      'COMPLETED': 'เสร็จสิ้น',
    };
    return statusMap[status] || status;
  }

  /**
   * Helper: Get appointments for today
   */
  static getTodayAppointments(appointments: DoctorAppointment[]): DoctorAppointment[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDatetime);
      return appointmentDate >= today && appointmentDate < tomorrow;
    });
  }

  /**
   * Helper: Get upcoming appointments (next 7 days)
   */
  static getUpcomingAppointments(appointments: DoctorAppointment[]): DoctorAppointment[] {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDatetime);
      return appointmentDate >= now && appointmentDate <= nextWeek;
    }).sort((a, b) =>
      new Date(a.appointmentDatetime).getTime() - new Date(b.appointmentDatetime).getTime()
    );
  }
}