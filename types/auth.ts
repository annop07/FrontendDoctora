export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;  // Make optional
  lastName?: string;   // Make optional
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstName: string | null;    // Can be null
  lastName: string | null;     // Can be null
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export interface MessageResponse {
  message: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string | null;    // Can be null
  lastName: string | null;     // Can be null
  fullName: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  phone?: string;
  createdAt: string;
}