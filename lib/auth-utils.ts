import { AuthService } from './auth-service';

export const getAuthHeaders = (): Record<string, string> => {
  const token = AuthService.getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const handleApiError = async (response: Response, context: string): Promise<void> => {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `${context} failed`);
    } catch (jsonError) {
      throw new Error(`${context} failed with status ${response.status}`);
    }
  } else {
    // HTML response means we probably hit a Next.js route instead of backend
    const text = await response.text();
    console.error('Non-JSON response:', text.substring(0, 500));
    
    if (text.includes('<!DOCTYPE html>')) {
      throw new Error(`API request was handled by Next.js instead of backend. Please check:\n1. Backend is running\n2. CORS is configured properly\n3. API endpoints exist`);
    }
    
    if (response.status === 404) {
      throw new Error(`API endpoint not found. Please check if backend is running and endpoint exists.`);
    } else if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication failed. Please login again or check permissions.`);
    } else {
      throw new Error(`${context} failed: Server returned HTML instead of JSON (Status: ${response.status})`);
    }
  }
};