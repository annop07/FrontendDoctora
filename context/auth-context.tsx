'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService } from '@/lib/auth-service';
import type { User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const refreshUser = async () => {
    try {
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      AuthService.removeToken();
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    const response = await AuthService.login({ email, password });
    AuthService.setToken(response.token);
    
    // Create user object from login response
    const userData: User = {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      fullName: `${response.firstName} ${response.lastName}`,
      role: response.role,
      createdAt: new Date().toISOString(), // You might want to get this from the backend
    };
    
    setUser(userData);
    
    // Also store in localStorage for navbar compatibility
    localStorage.setItem('user', JSON.stringify({
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    }));
    
    return userData;
  };

  const logout = () => {
    AuthService.removeToken();
    localStorage.removeItem('user'); // Clear user data from localStorage
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (AuthService.isAuthenticated()) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}