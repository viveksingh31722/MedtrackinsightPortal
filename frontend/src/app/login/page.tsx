'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeAuthViewport from '../components/ThreeAuthViewport';

const isPasswordValid = (pw: string): boolean => {
  if (pw.length < 10 || pw.length > 14) return false;
  const hasCapital = /[A-Z]/.test(pw);
  const hasSmall = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  return hasCapital && hasSmall && hasNumber && hasSpecial;
};

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { apiBaseUrl, loginUser, showToast, user } = useApp();

  // Tab: 'login', 'signup', or 'admin'
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'signup' ? 'signup' : tabParam === 'admin' ? 'admin' : 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'admin'>(initialTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);


  // OTP Signup verification overlay state
  const [showSignupOtp, setShowSignupOtp] = useState(false);
  const [signupOtp, setSignupOtp] = useState('');
  const [timer, setTimer] = useState(600); // 10 minutes expiry countdown

  // Forgot password flow states
  // 0: none, 1: enter email, 2: enter otp, 3: enter new password
  const [forgotPassStep, setForgotPassStep] = useState<number>(0);
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Countdown timer effect
  useEffect(() => {
    let intervalId: any = null;
    if ((showSignupOtp || forgotPassStep === 2) && timer > 0) {
      intervalId = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showSignupOtp, forgotPassStep, timer]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Sync active tab when URL query changes
  useEffect(() => {
    setActiveTab(initialTab);
    setForgotPassStep(0);
    setShowSignupOtp(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);

    if (initialTab === 'admin') {
      setEmail('admin@medtrack.com');
    } else {
      setEmail('');
    }
    setPassword('');
    setConfirmPassword('');
  }, [tabParam, initialTab]);

  // Redirect logged-in users
  useEffect(() => {
    if (user) {
      if (user.email === 'admin@medtrack.com') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  // Main login/register submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    if (activeTab === 'admin' && email !== 'admin@medtrack.com') {
      showToast('This portal is restricted to authorized administrators.', 'danger');
      return;
    }

    if (activeTab === 'signup' && password !== confirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }

    if (activeTab === 'signup' && !isPasswordValid(password)) {
      showToast('Password must be 10-14 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.', 'warning');
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
        if (activeTab === 'signup') {
          showToast(data.message || 'OTP verification sent to email.', 'success');
          setShowSignupOtp(true);
          setTimer(600); // 10 minutes
        } else {
          loginUser(email, data.accessToken, data.user);
          showToast('Login successful', 'success');
          if (email === 'admin@medtrack.com') {
            router.push('/admin');
          } else {
            router.push('/');
          }
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

  // Submit OTP registration code
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupOtp) {
      showToast('Please enter the OTP verification code', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/auth/verify-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: signupOtp }),
        //@ts-ignore
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        loginUser(email, data.accessToken, data.user);
        showToast('Email verified and account registered successfully', 'success');
        router.push('/');
      } else {
        showToast(data.message || 'Verification failed', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not complete verification', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Resend signup OTP
  const handleResendSignupOtp = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('A new OTP has been dispatched to your email address.', 'success');
        setSignupOtp(''); // Clear old OTP input
        setTimer(600); // Reset timer to 10 minutes
      } else {
        showToast(data.message || 'Failed to dispatch new OTP', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Server connection failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password flow handlers
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your registered email address', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password reset OTP sent to email.', 'success');
        setForgotPassStep(2);
        setTimer(600);
      } else {
        showToast(data.message || 'Error requesting reset code', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Server connection failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleResendForgotOtp = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('A new password reset OTP has been sent to your email.', 'success');
        setForgotOtp(''); // Clear old OTP input
        setTimer(600); // Reset timer to 10 minutes
      } else {
        showToast(data.message || 'Failed to dispatch new OTP', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Server connection failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp) {
      showToast('Please enter the OTP reset code', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: forgotOtp }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Reset OTP verified. Choose your new password.', 'success');
        setForgotPassStep(3);
      } else {
        showToast(data.message || 'Invalid reset OTP', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Verification request failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      showToast('Please fill out all fields', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match', 'warning');
      return;
    }

    if (!isPasswordValid(newPassword)) {
      showToast('Password must be 10-14 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: forgotOtp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password updated successfully. Please log in.', 'success');
        setForgotPassStep(0);
        setActiveTab('login');
      } else {
        showToast(data.message || 'Error updating password', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Reset execution failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="container" style={{ padding: '48px 24px 72px', maxWidth: '1240px' }}>
      <div 
        className="auth-split-layout" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', 
          gap: '72px', 
          alignItems: 'center' 
        }}
      >
        {/* Left branding panel with seamless 3D DNA helix canvas */}
        <div 
          className="auth-sidebar-hero" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'flex-start',
            padding: '16px 0',
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none',
            position: 'relative'
          }}
        >
          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '34px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: '1.25' }}>
              Global Pharmaceutical R&amp;D Intelligence Console
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500, lineHeight: '1.6', marginTop: '12px' }}>
              Access longitudinal clinical trial registries, drug pipeline tracking, and market reference pricing through a secure, high-performance analytical engine.
            </p>
          </div>

          {/* Seamless Interactive Three.js 3D Helix Canvas */}
          <ThreeAuthViewport />
        </div>

        {/* Right Login form console with static non-resizing card height */}
        <div className="auth-form-container" style={{ width: '100%' }}>
          <div 
            className="card auth-box" 
            style={{ 
              padding: '36px 32px', 
              backgroundColor: '#ffffff', 
              border: '1.5px solid var(--border)', 
              borderRadius: '24px', 
              boxShadow: 'var(--shadow-md)', 
              position: 'relative', 
              zIndex: 2,
              minHeight: '580px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >

          {/* 1. Signup verification overlay view */}
          {showSignupOtp ? (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Verify Email</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
                  Enter the 6-digit OTP code sent to <strong style={{ color: '#000000' }}>{email}</strong>.
                </p>
              </div>

              <form onSubmit={handleVerifySignupOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label htmlFor="signup-otp" className="form-label">OTP Verification Code</label>
                  <input
                    id="signup-otp"
                    type="text"
                    maxLength={6}
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="XXXXXX"
                    className="form-input"
                    style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '0.2em', fontWeight: 800 }}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Code expires in: <span style={{ color: 'var(--danger)' }}>{formatTimer(timer)}</span>
                    </span>
                    <button
                      type="button"
                      disabled={timer > 480} // 2 minutes cooldown limit
                      onClick={handleResendSignupOtp}
                      style={{ background: 'none', border: 'none', color: timer > 480 ? 'var(--text-light)' : 'var(--text-main)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 800 }}
                    >
                      Resend Code
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '48px' }}>
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSignupOtp(false)}
                  className="btn btn-outline"
                  style={{ height: '48px' }}
                >
                  Back to Register
                </button>
              </form>
            </div>
          ) : forgotPassStep > 0 ? (
            /* 2. Forgot password flows views */
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
                  {forgotPassStep === 1 && 'Reset Password'}
                  {forgotPassStep === 2 && 'Verify Code'}
                  {forgotPassStep === 3 && 'Choose Password'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
                  {forgotPassStep === 1 && 'Request an OTP verification code on your email.'}
                  {forgotPassStep === 2 && `Enter the 6-digit OTP code dispatched to ${email}.`}
                  {forgotPassStep === 3 && 'Input your new password parameters below.'}
                </p>
              </div>

              {forgotPassStep === 1 && (
                <form onSubmit={handleRequestResetOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label htmlFor="forgot-email" className="form-label">Email Address</label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="researcher@biotech.com"
                      className="form-input"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '48px' }}>
                    {loading ? 'Requesting...' : 'Dispatch Reset OTP'}
                  </button>
                </form>
              )}

              {forgotPassStep === 2 && (
                <form onSubmit={handleVerifyResetOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label htmlFor="forgot-otp" className="form-label">Reset OTP Code</label>
                    <input
                      id="forgot-otp"
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="XXXXXX"
                      className="form-input"
                      style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '0.2em', fontWeight: 800 }}
                      required
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Code expires in: <span style={{ color: 'var(--danger)' }}>{formatTimer(timer)}</span>
                      </span>
                      <button
                        type="button"
                        disabled={timer > 480} // 2 minutes cooldown limit
                        onClick={handleResendForgotOtp}
                        style={{ background: 'none', border: 'none', color: timer > 480 ? 'var(--text-light)' : 'var(--text-main)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 800 }}
                      >
                        Resend Code
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '48px' }}>
                    {loading ? 'Verifying...' : 'Verify Reset OTP'}
                  </button>
                </form>
              )}

              {forgotPassStep === 3 && (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label htmlFor="new-password" className="form-label">New Password</label>
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input"
                      required
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                        }}
                      >
                        <span>👁️</span>
                        <span>{showNewPassword ? 'Hide Password' : 'Show Password'}</span>
                      </button>
                    </div>
                    {newPassword && !isPasswordValid(newPassword) && (
                      <div style={{ fontSize: '12px', color: '#ff4d4d', marginTop: '6px', lineHeight: '1.4', fontWeight: 600 }}>
                        ⚠️ Password must be 10-14 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm-new" className="form-label">Confirm New Password</label>
                    <input
                      id="confirm-new"
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '48px' }}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => setForgotPassStep(0)}
                className="btn btn-outline"
                style={{ height: '48px', width: '100%', marginTop: '16px' }}
              >
                Back to Login
              </button>
            </div>
          ) : (
            /* 3. Main Login / Signup form views */
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
                  {activeTab === 'login' && 'Access Account'}
                  {activeTab === 'signup' && 'Setup New User'}
                  {activeTab === 'admin' && 'Administrator Portal'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
                  {activeTab === 'login' && 'Please log in to manage your clinical dashboard.'}
                  {activeTab === 'signup' && 'Register to bookmark drugs and manage downloads.'}
                  {activeTab === 'admin' && 'Authorized database administrators only.'}
                </p>
              </div>

              {/* Login/Signup/Admin Tabs */}
              <div className="auth-tabs auth-tabs-three">
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

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Consistent height input fields container to keep form height steady */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '260px', justifyContent: 'flex-start' }}>

                      {activeTab === 'admin' && (
                        <div className="alert alert-warning" style={{ fontSize: '13px', padding: '10px 14px', marginBottom: '0px' }}>
                          ⚠️ Securing channel. Database actions are audited.
                        </div>
                      )}

                      <div className="form-group">
                        <label htmlFor="auth-email" className="form-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)' }}>Email Address</label>
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
                        <label htmlFor="auth-password" className="form-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)' }}>Password</label>
                        <input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="form-input"
                          required
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 6px',
                            }}
                          >
                            <span>👁️</span>
                            <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
                          </button>
                        </div>
                        {activeTab === 'signup' && password && !isPasswordValid(password) && (
                          <div style={{ fontSize: '12px', color: '#ff4d4d', marginTop: '6px', lineHeight: '1.4', fontWeight: 600 }}>
                            ⚠️ Password must be 10-14 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.
                          </div>
                        )}
                      </div>

                      {activeTab === 'login' && (
                        <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setForgotPassStep(1);
                              setEmail('');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}

                      {activeTab === 'signup' && (
                        <div className="form-group">
                          <label htmlFor="auth-confirm" className="form-label" style={{ fontWeight: 800, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)' }}>Confirm Password</label>
                          <input
                            id="auth-confirm"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="form-input"
                            required
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 6px',
                              }}
                            >
                              <span>👁️</span>
                              <span>{showConfirmPassword ? 'Hide Password' : 'Show Password'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: '48px', marginTop: '8px' }}>
                      {loading ? 'Processing...' : activeTab === 'signup' ? 'Create Account' : 'Authenticate Access'}
                    </button>
                  </form>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '80px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-muted)' }}>
          Preparing Security Portal...
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}

