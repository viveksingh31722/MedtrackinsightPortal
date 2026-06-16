'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../context/AppContext';

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { apiBaseUrl, loginUser, showToast, user } = useApp();

  // Determine active tab: 'login', 'signup', or 'admin'
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'signup' ? 'signup' : tabParam === 'admin' ? 'admin' : 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'admin'>(initialTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync active tab when URL query changes
  useEffect(() => {
    setActiveTab(initialTab);
    
    // Auto-fill default email for convenience in sandbox mode
    if (initialTab === 'admin') {
      setEmail('admin@medtrack.com');
    } else {
      setEmail('');
    }
  }, [tabParam, initialTab]);

  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      if (user.email === 'admin@medtrack.com') {
        router.push('/admin');
      } else {
        router.push('/search');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    // Verify admin constraints
    if (activeTab === 'admin' && email !== 'admin@medtrack.com') {
      showToast('This portal is restricted to authorized administrators. Standard users please use the Log In tab.', 'danger');
      return;
    }

    if (activeTab === 'signup' && password !== confirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }

    try {
      setLoading(true);
      const url = activeTab === 'signup' ? `${apiBaseUrl}/auth/register` : `${apiBaseUrl}/auth/login`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        //@ts-ignore
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        loginUser(email, data.accessToken, data.user);
        
        // Dynamic redirection: Admin goes to admin panel, users go to search workspace
        if (email === 'admin@medtrack.com') {
          router.push('/admin');
        } else {
          router.push('/search');
        }
      } else {
        showToast(data.message || 'Authentication failed', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not establish connection to authentication server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left branding panel */}
      <div className="auth-sidebar-hero">
        <div style={{ zIndex: 2 }}>
          <span className="hero-subtitle" style={{ color: '#ffffff', opacity: 0.8 }}>MedTrackInsight R&amp;D</span>
          <h2 className="auth-sidebar-title">Clinical Molecular Intelligence</h2>
          <p className="auth-sidebar-text">
            Search active biopharmaceutical molecular candidates, benchmark development phases, compile trial endpoint criteria, and export standardized lists immediately.
          </p>
        </div>
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '-50px',
          width: '240px',
          height: '240px',
          borderRadius: '9999px',
          background: 'rgba(255,255,255,0.06)',
          zIndex: 1
        }}></div>
      </div>

      {/* Right Login form console */}
      <div className="auth-form-container">
        <div className="auth-box">
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
              {activeTab === 'login' && 'Access Account'}
              {activeTab === 'signup' && 'Setup New User'}
              {activeTab === 'admin' && 'Administrator Portal'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {activeTab === 'login' && 'Please log in to manage your clinical dashboard.'}
              {activeTab === 'signup' && 'Register to bookmark drugs and manage downloads.'}
              {activeTab === 'admin' && 'Authorized database administrators only.'}
            </p>
          </div>

          {/* Login/Signup/Admin Tabs */}
          <div className="auth-tabs" style={{ gridTemplateColumns: '1fr 1fr 1.2fr' }}>
            <button
              onClick={() => {
                setActiveTab('login');
                router.replace('/login?tab=login');
              }}
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                router.replace('/login?tab=signup');
              }}
              className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            >
              Register
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                router.replace('/login?tab=admin');
              }}
              className={`auth-tab ${activeTab === 'admin' ? 'active' : ''}`}
            >
              Admin Access
            </button>
          </div>

          {/* Admin secured alert indicator */}
          {activeTab === 'admin' && (
            <div className="alert alert-warning" style={{ fontSize: '13px', padding: '10px 14px' }}>
              ⚠️ Securing channel. Database actions are audited.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="auth-email" className="form-label">Email Address</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@biotech.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password" className="form-label">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                required
              />
            </div>

            {activeTab === 'signup' && (
              <div className="form-group">
                <label htmlFor="auth-confirm" className="form-label">Confirm Password</label>
                <input
                  id="auth-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  required
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '46px', marginTop: '8px' }}>
              {loading ? 'Processing...' : activeTab === 'signup' ? 'Create Account' : 'Authenticate Access'}
            </button>
          </form>

          {/* Helper notes for sandbox */}
          <div className="card" style={{ padding: '16px', fontSize: '13px', backgroundColor: 'var(--bg-main)' }}>
            <strong>💡 Sandbox Credentials:</strong><br />
            - <strong>Pro Viewer:</strong> pro@medtrack.com / password123<br />
            - <strong>Guest Viewer:</strong> user@medtrack.com / password123<br />
            - <strong>Admin:</strong> admin@medtrack.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Preparing Security Portal...
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
