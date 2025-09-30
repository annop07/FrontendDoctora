import { AuthService } from "./auth-service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export interface CreateAppointmentWithPatientInfoRequest {
  // Appointment basic info
  doctorId: number;
  appointmentDateTime: string; // ISO string
  durationMinutes?: number;
  notes?: string;

  // Patient detailed info
  patientPrefix?: string;
  patientFirstName: string;
  patientLastName: string;
  patientGender: string;
  patientDateOfBirth: string; // YYYY-MM-DD format
  patientNationality: string;
  patientCitizenId?: string;
  patientPhone: string;
  patientEmail: string;

  // Additional booking info
  symptoms?: string;
  bookingType?: string; // 'auto' or 'manual'
  queueNumber?: string;
}

export interface AppointmentResponse {
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

export interface PatientBookingInfoResponse {
  id: number;
  queueNumber: string;
  patientPrefix?: string;
  patientFirstName: string;
  patientLastName: string;
  patientFullName: string;
  patientGender: string;
  patientDateOfBirth: string; // YYYY-MM-DD
  patientNationality: string;
  patientCitizenId?: string;
  patientPhone: string;
  patientEmail: string;
  symptoms?: string;
  bookingType: string;
  createdAt: string;
}

export interface CreateAppointmentResponse {
  message: string;
  appointment: AppointmentResponse;
  patientInfo: PatientBookingInfoResponse;
}

export class AppointmentService {
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
   * Create appointment with complete patient information
   */
  static async createAppointmentWithPatientInfo(
    data: CreateAppointmentWithPatientInfoRequest
  ): Promise<CreateAppointmentResponse> {
    console.log('Creating appointment with patient info:', data);

    const response = await fetch(`${API_BASE_URL}/api/appointments/with-patient-info`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('Appointment creation failed:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use the HTTP status
        console.error('Non-JSON error response:', response.status, response.statusText);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Appointment created successfully:', result);
    return result;
  }

  /**
   * Get my appointments
   */
  static async getMyAppointments(): Promise<{appointments: AppointmentResponse[]}> {
    const response = await fetch(`${API_BASE_URL}/api/appointments/my`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch appointments');
    }

    return response.json();
  }

  /**
   * Confirm appointment (Doctor only)
   */
  static async confirmAppointment(appointmentId: number): Promise<AppointmentResponse> {
    console.log('🔵 [confirmAppointment] Starting with ID:', appointmentId);
    console.log('🔵 [confirmAppointment] Token:', this.getToken());
    console.log('🔵 [confirmAppointment] URL:', `${API_BASE_URL}/api/appointments/${appointmentId}/confirm`);

    const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/confirm`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    });

    console.log('🔵 [confirmAppointment] Response status:', response.status);
    console.log('🔵 [confirmAppointment] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ [confirmAppointment] Response not OK');
      const responseText = await response.text();
      console.error('❌ [confirmAppointment] Response text:', responseText);

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
      }
      throw new Error(errorData.message || 'Failed to confirm appointment');
    }

    const result = await response.json();
    console.log('✅ [confirmAppointment] Success:', result);
    return result.appointment;
  }

  static getToken(): string | null {
    return AuthService.getToken();
  }

  /**
   * Get patient booking info for an appointment (Doctor only)
   */
  static async getPatientBookingInfo(appointmentId: number): Promise<PatientBookingInfoResponse> {
    console.log('🔵 [getPatientBookingInfo] Fetching for appointment ID:', appointmentId);

    const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/patient-info`, {
      headers: this.getAuthHeaders(),
    });

    console.log('🔵 [getPatientBookingInfo] Response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('❌ [getPatientBookingInfo] Error:', responseText);

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`);
      }
      throw new Error(errorData.message || 'Failed to fetch patient booking info');
    }

    const result = await response.json();
    console.log('✅ [getPatientBookingInfo] Success:', result);
    return result;
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
   * Get doctor's appointments (Doctor only)
   */
  static async getDoctorAppointments(): Promise<{appointments: AppointmentResponse[]}> {
    const response = await fetch(`${API_BASE_URL}/api/appointments/doctor/my`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch appointments');
    }

    return response.json();
  }

  /**
   * Get doctors by specialty
   */
  static async getDoctorsBySpecialty(specialtyName: string) {
    const response = await fetch(
      `${API_BASE_URL}/api/doctors/by-specialty?specialty=${encodeURIComponent(specialtyName)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch doctors');
    }

    return response.json();
  }

  /**
   * Get all doctors
   */
  static async getAllDoctors() {
    const response = await fetch(`${API_BASE_URL}/api/doctors`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch doctors');
    }

    return response.json();
  }

  /**
   * Convert booking draft data to API request format
   */
  static convertBookingDataToRequest(
    bookingData: any,
    patientData: any,
    doctorId: number
  ): CreateAppointmentWithPatientInfoRequest {
    // Parse date and time (fix timezone issue)
    const appointmentDate = new Date(bookingData.selectedDate);
    const timeRange = bookingData.selectedTime || "9:00-10:00";
    const startTime = timeRange.split('-')[0].trim();
    const [hour, minute] = startTime.split(':').map(Number);

    // Create date-time string in local timezone format: YYYY-MM-DDTHH:mm:ss
    const year = appointmentDate.getFullYear();
    const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
    const day = String(appointmentDate.getDate()).padStart(2, '0');
    const hourStr = String(hour).padStart(2, '0');
    const minuteStr = String(minute).padStart(2, '0');

    const localDateTimeString = `${year}-${month}-${day}T${hourStr}:${minuteStr}:00`;

    return {
      doctorId: doctorId,
      appointmentDateTime: localDateTimeString,
      durationMinutes: 30,
      notes: bookingData.symptoms || bookingData.illness || "",

      // Patient info
      patientPrefix: patientData.prefix || "",
      patientFirstName: patientData.firstName || "",
      patientLastName: patientData.lastName || "",
      patientGender: patientData.gender || "",
      patientDateOfBirth: patientData.dob || "",
      patientNationality: patientData.nationality || "",
      patientCitizenId: patientData.citizenId || "",
      patientPhone: patientData.phone || "",
      patientEmail: patientData.email || "",

      // Additional info
      symptoms: bookingData.symptoms || bookingData.illness || "",
      bookingType: bookingData.illness === 'auto' ? 'auto' : 'manual',
    };
  }

  /**
   * Helper: Format appointment datetime for display
   */
  static formatAppointmentDateTime(datetime: string): { date: string; time: string } {
    // Handle local datetime string (YYYY-MM-DDTHH:mm:ss) without timezone
    let dt: Date;

    if (!datetime.endsWith('Z') && !datetime.includes('+') && !datetime.includes('-', 10)) {
      // It's a local datetime string - parse manually to avoid timezone conversion
      const parts = datetime.split('T');
      const dateParts = parts[0].split('-');
      const timeParts = parts[1]?.split(':') || ['0', '0', '0'];

      dt = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1]),
        parseInt(timeParts[2] || '0')
      );
    } else {
      // Has timezone info - parse normally
      dt = new Date(datetime);
    }

    const date = dt.toLocaleDateString('th-TH');
    const time = dt.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return { date, time };
  }

  /**
   * Helper: Get status color
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': 'text-yellow-600 bg-yellow-50',
      'CONFIRMED': 'text-green-600 bg-green-50',
      'CANCELLED': 'text-red-600 bg-red-50',
      'COMPLETED': 'text-blue-600 bg-blue-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
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
   * Get booked time slots for a specific doctor and date
   */
  static async getBookedTimeSlots(doctorId: number, date: string): Promise<BookedSlot[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/appointments/doctor/${doctorId}/booked-slots?date=${date}`
    );

    if (!response.ok) {
      console.error('Failed to fetch booked slots:', response.status);
      return [];
    }

    const data = await response.json();
    return data.bookedSlots || [];
  }
}

export interface BookedSlot {
  appointmentId: number;
  startTime: string;
  durationMinutes: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}