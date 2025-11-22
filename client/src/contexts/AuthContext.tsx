import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/api';

interface User {
  uuid: string;
  email: string;
  fullName: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (updates: any) => Promise<{ success: boolean; message?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('user_authenticated') === 'true';
    if (isAuthenticated) {
      const storedUser = {
        uuid: sessionStorage.getItem('user_uuid') || '',
        email: sessionStorage.getItem('username') || '',
        fullName: sessionStorage.getItem('user_fullname') || '',
        role: sessionStorage.getItem('user_role') || '',
      };
      setUser(storedUser as User);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || 'Login failed',
        };
      }

      const data = await response.json();
      const userData = data.user;

      // Store user data in sessionStorage
      sessionStorage.setItem('user_authenticated', 'true');
      sessionStorage.setItem('username', userData.email || userData.username);
      sessionStorage.setItem('user_role', userData.role);
      sessionStorage.setItem('user_fullname', userData.fullName || '');
      sessionStorage.setItem('user_uuid', userData.uuid);

      setUser(userData);
      queryClient.setQueryData(['auth', 'user'], userData);
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || 'Registration failed',
        };
      }

      const data = await response.json();
      const newUser = data.user;

      // Store user data in sessionStorage
      sessionStorage.setItem('user_authenticated', 'true');
      sessionStorage.setItem('username', newUser.email || newUser.username);
      sessionStorage.setItem('user_role', newUser.role);
      sessionStorage.setItem('user_fullname', newUser.fullName || '');
      sessionStorage.setItem('user_uuid', newUser.uuid);

      setUser(newUser);
      queryClient.setQueryData(['auth', 'user'], newUser);
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    
    // Clear sessionStorage auth data
    sessionStorage.removeItem('user_authenticated');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('user_fullname');
    sessionStorage.removeItem('user_uuid');
    
    queryClient.setQueryData(['auth', 'user'], null);
    queryClient.clear();
  };

  const updateProfile = async (updates: any) => {
    try {
      setLoading(true);
      const role = sessionStorage.getItem('user_role');
      
      const response = await fetch(getApiUrl('/api/auth/me'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role || '',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || 'Update failed',
        };
      }

      const data = await response.json();
      
      // Update sessionStorage with new data
      if (data.email) sessionStorage.setItem('username', data.email);
      if (data.fullName) sessionStorage.setItem('user_fullname', data.fullName);
      
      setUser(data);
      queryClient.setQueryData(['auth', 'user'], data);
      
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Update failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 