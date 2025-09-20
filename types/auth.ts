export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
  firstName: string;
  lastName: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export interface MessageResponse {
  message: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  phone?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user?: User;
}
