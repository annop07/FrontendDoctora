const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

// Types
export interface Availability {
  id: number;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  timeRange: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AddAvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface MessageResponse {
  message: string;
}

export class AvailabilityService {
  private static getAuthHeaders(): HeadersInit {
    // Use 'authToken' to match AuthService
    const token = localStorage.getItem('authToken');
    console.log('Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    if (!token) {
      console.warn('⚠️ No authentication token found in localStorage');
    }

    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  /**
   * Get doctor's own availability schedule
   */
  static async getMyAvailability(): Promise<Availability[]> {
    try {
      const url = `${API_BASE_URL}/api/availability/my`;
      const headers = this.getAuthHeaders();

      console.log('=== Fetching My Availability ===');
      console.log('URL:', url);
      console.log('Headers:', JSON.stringify(headers, null, 2));

      // Double check token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      console.log('Token length:', token.length);
      console.log('Token starts with:', token.substring(0, 20));

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response type:', response.type);

      // Get raw response text first
      const responseText = await response.text();
      console.log('Raw response text length:', responseText.length);
      console.log('Raw response text:', responseText);

      if (!response.ok) {
        let errorMessage = `Failed to fetch availability (Status: ${response.status})`;

        if (responseText) {
          try {
            const error = JSON.parse(responseText);
            errorMessage = error.message || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
            errorMessage = responseText || errorMessage;
          }
        }

        throw new Error(errorMessage);
      }

      // Parse JSON
      if (!responseText || responseText.trim() === '') {
        console.warn('Empty response from server');
        return [];
      }

      try {
        const data = JSON.parse(responseText);
        console.log('Parsed data:', data);
        return data;
      } catch (e) {
        console.error('Error parsing JSON:', e);
        console.error('Response text that failed to parse:', responseText);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching my availability:', error);
      throw error;
    }
  }

  /**
   * Get availability for a specific doctor (public)
   */
  static async getDoctorAvailability(doctorId: number, dayOfWeek?: number): Promise<Availability[]> {
    try {
      const url = dayOfWeek
        ? `${API_BASE_URL}/api/availability/doctor/${doctorId}?dayOfWeek=${dayOfWeek}`
        : `${API_BASE_URL}/api/availability/doctor/${doctorId}`;

      console.log('🔵 Fetching doctor availability from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        // Try to get error text first
        const responseText = await response.text();
        console.error('❌ Error response text:', responseText);

        let errorMessage = `Failed to fetch doctor availability (Status: ${response.status})`;

        if (responseText) {
          try {
            const error = JSON.parse(responseText);
            errorMessage = error.message || errorMessage;
          } catch (e) {
            // Response is not JSON, use text as error
            errorMessage = responseText || errorMessage;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Availability data:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching doctor availability:', error);
      throw error;
    }
  }

  /**
   * Add new availability slot
   */
  static async addAvailability(data: AddAvailabilityRequest): Promise<Availability> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/availability`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add availability');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding availability:', error);
      throw error;
    }
  }

  /**
   * Update existing availability slot
   */
  static async updateAvailability(id: number, data: AddAvailabilityRequest): Promise<MessageResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/availability/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update availability');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  /**
   * Delete availability slot
   */
  static async deleteAvailability(id: number): Promise<MessageResponse> {
    try {
      const url = `${API_BASE_URL}/api/availability/${id}`;
      console.log('🗑️ Deleting availability:', id);
      console.log('🗑️ URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      console.log('🗑️ Response status:', response.status);

      if (!response.ok) {
        const responseText = await response.text();
        console.log('🗑️ Error response:', responseText);

        let errorMessage = 'Failed to delete availability';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('🗑️ Delete success:', result);
      return result;
    } catch (error) {
      console.error('Error deleting availability:', error);
      throw error;
    }
  }

  /**
   * Helper: Get day name in Thai
   */
  static getDayNameThai(dayOfWeek: number): string {
    const days = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    return days[dayOfWeek] || 'Unknown';
  }

  /**
   * Helper: Format time display (HH:mm)
   */
  static formatTime(time: string): string {
    if (!time) return '';

    // If it's already in HH:mm format
    if (time.length === 5 && time.includes(':')) {
      return time;
    }

    // If it's in HH:mm:ss format
    if (time.length >= 8) {
      return time.substring(0, 5);
    }

    // If it's an array format like [HH, mm, ss]
    if (time.startsWith('[')) {
      try {
        const parsed = JSON.parse(time);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          const hours = String(parsed[0]).padStart(2, '0');
          const minutes = String(parsed[1]).padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      } catch (e) {
        console.error('Error parsing time array:', e);
      }
    }

    return time;
  }

  /**
   * Helper: Convert time to HH:mm format for API
   */
  static timeToString(hours: number, minutes: number): string {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  }
}