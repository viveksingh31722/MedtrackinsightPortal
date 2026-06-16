'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserSession {
  id: string;
  email: string;
  isSubscribed: boolean;
  downloadCount: number;
  subscriptionEnd?: string;
}

interface AppContextType {
  user: UserSession | null;
  loading: boolean;
  toast: { message: string; show: boolean; type: 'info' | 'success' | 'warning' | 'danger' } | null;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'danger') => void;
  loginUser: (email: string, accessToken: string, userDetails: any) => void;
  logoutUser: () => Promise<void>;
  checkSession: () => Promise<void>;
  apiBaseUrl: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; show: boolean; type: 'info' | 'success' | 'warning' | 'danger' } | null>(null);
  const router = useRouter();

  // Express API Base Endpoint URL
  const apiBaseUrl = 'http://localhost:5000/api';

  // Session verification on mount
  useEffect(() => {
    checkSession();
  }, []);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    setToast({ message, show: true, type });
    setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, show: false } : null));
    }, 4000);
  };

  const checkSession = async () => {
    try {
      setLoading(true);
      // Fetch current profile from backend. Since we set credentials: true, the browser
      // automatically sends the HTTP-only cookies to the backend.
      const res = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
        },
        // Force sending cookies
        //@ts-ignore
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session validation error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = (email: string, accessToken: string, userDetails: any) => {
    // Save token in local storage as a fallback, though cookies are main
    localStorage.setItem('accessToken', accessToken);
    setUser({
      id: userDetails.id,
      email: userDetails.email,
      isSubscribed: userDetails.isSubscribed,
      downloadCount: userDetails.downloadCount || 0,
      subscriptionEnd: userDetails.subscriptionEnd,
    });
    showToast(`Welcome back, ${email}!`, 'success');
  };

  const logoutUser = async () => {
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        //@ts-ignore
        credentials: 'include',
      });
      localStorage.removeItem('accessToken');
      setUser(null);
      showToast('Logged out successfully', 'info');
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Error signing out', 'danger');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        toast,
        showToast,
        loginUser,
        logoutUser,
        checkSession,
        apiBaseUrl,
      }}
    >
      {children}
      
      {/* Toast Notification HUD */}
      {toast && (
        <div className={`toast ${toast.show ? 'show' : ''}`} style={{
          borderLeft: `5px solid var(--${toast.type === 'info' ? 'secondary' : toast.type})`,
          backgroundColor: '#111827',
          color: '#ffffff'
        }}>
          <span>{toast.message}</span>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider wrapper');
  }
  return context;
};
