import type { LoginRequest, RegisterRequest, LoginResponse, MessageResponse, User } from "@/types/auth";

// ⚠️ ตรวจสอบให้แน่ใจว่า URL ถูกต้อง
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

// Log เพื่อ debug (ลบออกได้หลัง deploy สำเร็จ)
if (typeof window !== 'undefined') {
  console.log('🔧 API_BASE_URL:', API_BASE_URL);
}

export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  ME: `${API_BASE_URL}/api/users/me`,
} as const;

export class AuthService {
  static async register(data: RegisterRequest): Promise<MessageResponse> {
    const url = API_ENDPOINTS.REGISTER;
    console.log('📡 Making request to:', url);
    console.log('📦 Request data:', data);
    
    try {
      const payload = {
        email: data.email,
        password: data.password,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        role: 'PATIENT' // Default role
      };

      console.log('📤 Sending payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // เพิ่ม mode และ credentials สำหรับ CORS
        mode: 'cors',
        credentials: 'include',
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `Registration failed: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('❌ Error data:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.error('❌ Could not parse error as JSON:', jsonError);
          const errorText = await response.text();
          console.error('❌ Error text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('✅ Success:', responseData);
      return responseData;
      
    } catch (error) {
      console.error('💥 Fetch error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }
      
      throw error;
    }
  }

  static async login(data: LoginRequest): Promise<LoginResponse> {
    const url = API_ENDPOINTS.LOGIN;
    console.log('📡 Login request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      mode: 'cors',
      credentials: 'include',
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
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'include',
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
      localStorage.removeItem('user');
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static logout(): void {
    this.removeToken();
  }
}