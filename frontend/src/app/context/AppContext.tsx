'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserSession {
  id: string;
  email: string;
  isSubscribed: boolean;
  downloadCount: number;
  subscriptionEnd?: string;
  isAdmin?: boolean;
  passwordExpired?: boolean;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  designation?: string | null;
  country?: string | null;
  department?: string | null;
  prefNewTrials?: boolean;
  prefAlerts?: boolean;
  prefDeals?: boolean;
  prefNewsletter?: boolean;
  prefMarketing?: boolean;
  prefTheme?: string;
  prefDefaultCountry?: string;
  prefDefaultTherapeuticArea?: string;
  createdAt?: string;
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
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<Response>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; show: boolean; type: 'info' | 'success' | 'warning' | 'danger' } | null>(null);
  const router = useRouter();

  // Express API Base Endpoint URL
  const apiBaseUrl = 'http://localhost:5000/api';

  // Helper to sync theme to cookie (helps prevent visual flashes on SSR layouts)
  const syncThemeCookie = (theme: string) => {
    if (typeof window !== 'undefined') {
      document.cookie = `prefTheme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  // Custom Fetch Wrapper: Automatically appends JWT, intercepts expired token (401/403),
  // silently refreshes token via /api/auth/refresh, and retries the original request.
  const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const fetchOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Needed to send refresh cookies
    };

    let res = await fetch(endpoint, fetchOptions);

    // Auto-refresh logic on token expiry (401/403)
    if (
      (res.status === 401 || res.status === 403) && 
      !endpoint.endsWith('/auth/refresh') && 
      !endpoint.endsWith('/auth/login')
    ) {
      try {
        const refreshRes = await fetch(`${apiBaseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.accessToken;
          localStorage.setItem('accessToken', newAccessToken);

          // Update headers and retry the original request
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          res = await fetch(endpoint, {
            ...options,
            headers,
            credentials: 'include',
          });
        } else {
          // Refresh token expired or invalid: teardown session
          localStorage.removeItem('accessToken');
          localStorage.removeItem('cachedUser');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to auto-refresh access token:', err);
      }
    }

    return res;
  };

  // Load cached user session on mount (Stale-While-Revalidate)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cachedUser');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUser(parsed);
          setLoading(false); // UI renders instantly
          if (parsed.prefTheme) {
            syncThemeCookie(parsed.prefTheme);
          }
        } catch (e) {
          console.error('Error parsing cached user:', e);
        }
      }
    }
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
      // If we don't have a cached user, show loading state
      if (!localStorage.getItem('cachedUser')) {
        setLoading(true);
      }
      
      const res = await apiFetch(`${apiBaseUrl}/auth/me`);

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('cachedUser', JSON.stringify(data.user));
        if (data.user?.prefTheme) {
          syncThemeCookie(data.user.prefTheme);
        }
        
        if (data.user?.passwordExpired && typeof window !== 'undefined' && window.location.pathname !== '/change-password') {
          showToast('Your password has expired. Please update it.', 'warning');
          router.push('/change-password');
        }
      } else {
        setUser(null);
        localStorage.removeItem('cachedUser');
      }
    } catch (err) {
      console.error('Session validation error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = (email: string, accessToken: string, userDetails: any) => {
    localStorage.setItem('accessToken', accessToken);
    
    const sessionData = {
      id: userDetails.id,
      email: userDetails.email,
      isSubscribed: userDetails.isSubscribed,
      downloadCount: userDetails.downloadCount || 0,
      subscriptionEnd: userDetails.subscriptionEnd,
      isAdmin: userDetails.isAdmin || false,
      passwordExpired: userDetails.passwordExpired || false,
      name: userDetails.name,
      phone: userDetails.phone,
      company: userDetails.company,
      designation: userDetails.designation,
      country: userDetails.country,
      department: userDetails.department,
      prefNewTrials: userDetails.prefNewTrials,
      prefAlerts: userDetails.prefAlerts,
      prefDeals: userDetails.prefDeals,
      prefNewsletter: userDetails.prefNewsletter,
      prefMarketing: userDetails.prefMarketing,
      prefTheme: userDetails.prefTheme,
      prefDefaultCountry: userDetails.prefDefaultCountry,
      prefDefaultTherapeuticArea: userDetails.prefDefaultTherapeuticArea,
      createdAt: userDetails.createdAt,
    };

    setUser(sessionData);
    localStorage.setItem('cachedUser', JSON.stringify(sessionData));
    
    if (userDetails.prefTheme) {
      syncThemeCookie(userDetails.prefTheme);
    }

    showToast(`Welcome back, ${email}!`, 'success');

    if (userDetails.passwordExpired) {
      setTimeout(() => {
        showToast('Your password has expired. Please update it immediately.', 'warning');
        router.push('/change-password');
      }, 500);
    }
  };

  const logoutUser = async () => {
    try {
      await apiFetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
      });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('cachedUser');
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
        apiFetch,
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
