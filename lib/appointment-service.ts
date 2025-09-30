// lib/appointment-service.ts
import { AuthService } from './auth-service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export interface CreateAppointmentRequest {
  doctorId: number;
  appointmentDateTime: string; // ISO format
  durationMinutes?: number;
  notes?: string;
}

export interface Appointment {
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
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes: string;
  doctorNotes: string;
  createdAt: string;
  updatedAt: string;
}

export class AppointmentService {
  private static getAuthHeaders(): Record<string, string> {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  static async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    console.log('Creating appointment:', data);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      console.log('Appointment response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to create appointment';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const appointment = await response.json();
      console.log('Appointment created:', appointment);
      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if backend is running.');
      }
      throw error;
    }
  }

  static async getMyAppointments(): Promise<Appointment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/my`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      return data.appointments || [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  static async cancelAppointment(appointmentId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      throw error;
    }
  }
}