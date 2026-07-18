'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

const isPasswordValid = (pw: string): boolean => {
  if (pw.length < 10 || pw.length > 14) return false;
  const hasCapital = /[A-Z]/.test(pw);
  const hasSmall = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  return hasCapital && hasSmall && hasNumber && hasSpecial;
};

export default function ChangePasswordPage() {
  const { user, apiBaseUrl, showToast, checkSession, loading } = useApp();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      showToast('Please log in before attempting to change your password.', 'warning');
      router.push('/login');
    }
  }, [user, loading, router, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      showToast('All fields are required', 'warning');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match', 'warning');
      return;
    }

    if (oldPassword === newPassword) {
      showToast('New password cannot be the same as your old password', 'warning');
      return;
    }

    if (!isPasswordValid(newPassword)) {
      showToast('New password does not meet the complexity requirements', 'warning');
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('accessToken');

      const res = await fetch(`${apiBaseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword }),
        //@ts-ignore
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Password updated successfully', 'success');
        // Refresh session to clear passwordExpired flag
        await checkSession();
        
        // Redirect based on role
        if (user?.isAdmin) {
          router.push('/admin');
        } else {
          router.push('/search');
        }
      } else {
        showToast(data.message || 'Error updating password', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection to authentication server failed', 'danger');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Loading profile parameters...
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '40px' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="hero-subtitle">Security Controls</span>
          <h1 style={{ fontSize: '28px', marginTop: '10px', marginBottom: '8px' }}>Update Password</h1>
          
          {user.passwordExpired ? (
            <div className="card" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              padding: '12px',
              fontSize: '13px',
              color: 'var(--danger)',
              borderRadius: '6px',
              marginTop: '16px'
            }}>
              ⚠️ <strong>Password Expired</strong>: Security policy requires passwords to be refreshed every 3 months (90 days). Please update your password to proceed.
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Confirm your identity by entering your older password.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Old Password */}
          <div className="form-group">
            <label htmlFor="old-password" className="form-label">Current Password</label>
            <input
              id="old-password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              required
            />
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="new-password" className="form-label">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              required
            />
            {newPassword && !isPasswordValid(newPassword) && (
              <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '8px', lineHeight: '1.4' }}>
                ⚠️ Password must be 10-14 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              required
            />
          </div>

          {/* Actions */}
          <button
            type="submit"
            disabled={updating || (newPassword ? !isPasswordValid(newPassword) : true)}
            className="btn btn-primary"
            style={{ height: '48px', width: '100%', marginTop: '8px' }}
          >
            {updating ? 'Saving Password Changes...' : 'Update Password'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (user?.isAdmin) {
                router.push('/admin');
              } else {
                router.push('/search');
              }
            }}
            disabled={user.passwordExpired}
            className="btn btn-outline"
            style={{ height: '48px', width: '100%' }}
          >
            Cancel
          </button>
        </form>

      </div>
    </div>
  );
}
