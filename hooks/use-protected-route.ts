import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export function useProtectedRoute(requiredRole?: 'ADMIN' | 'DOCTOR' | 'PATIENT') {
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // User not authenticated, redirect to login
        router.push('/login');
      } else if (requiredRole && user.role !== requiredRole) {
        // User doesn't have required role, redirect based on their role
        switch (user.role) {
          case 'ADMIN':
            router.push('/admin');
            break;
          case 'DOCTOR':
            router.push('/dashboard');
            break;
          default:
            router.push('/');
        }
      } else {
        // User is authenticated and has correct role
        setIsLoading(false);
      }
    }
  }, [user, authLoading, router, requiredRole]);

  return { 
    isLoading: authLoading || isLoading,
    user,
    isAuthenticated: !!user,
    hasRequiredRole: !requiredRole || user?.role === requiredRole
  };
}