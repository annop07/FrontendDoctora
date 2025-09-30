import type { LoginRequest, RegisterRequest, LoginResponse, MessageResponse, User } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  ME: `${API_BASE_URL}/api/users/me`,
} as const;

export class AuthService {
  static async register(data: RegisterRequest): Promise<MessageResponse> {
    console.log('Making request to:', API_ENDPOINTS.REGISTER);
    console.log('Request data:', data);
    
    try {
      // Send empty strings for firstName and lastName if not provided
      const payload = {
        email: data.email,
        password: data.password,
        firstName: data.firstName || '',
        lastName: data.lastName || ''
      };

      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.error('Error parsing error response as JSON:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (!responseText) {
        throw new Error('Empty response from server');
      }
      
      return JSON.parse(responseText);
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Is the backend running on port 8082?');
      }
      throw fetchError;
    }
  }

  static async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    return response.json();
  }

  static async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(API_ENDPOINTS.ME, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user data');
    }

    return response.json();
  }

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user'); // Also remove old user data
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static logout(): void {
    this.removeToken();
  }
}