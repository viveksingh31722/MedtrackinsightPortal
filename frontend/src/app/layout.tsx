'use client';

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

function NavigationHeader() {
  const { user, logoutUser, loading } = useApp();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <div className="logo-icon"></div>
          MedTrackInsight
        </Link>

        <nav className="nav">
          <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link href="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>
            About Us
          </Link>
          <Link href="/subscription" className={`nav-link ${isActive('/subscription') ? 'active' : ''}`}>
            Subscription
          </Link>
          <Link href="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>
            Contact Us
          </Link>
          <Link href="/demo" className={`nav-link ${isActive('/demo') ? 'active' : ''}`}>
            Request Demo
          </Link>
          {user && user.email === 'admin@medtrack.com' && (
            <Link href="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              Admin Portal
            </Link>
          )}
        </nav>

        <div className="nav-buttons">
          {loading ? (
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading...</span>
          ) : user ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {user.email}
                </span>
                <span className={`badge ${user.isSubscribed ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '10px', padding: '1px 6px', marginTop: '2px' }}>
                  {user.isSubscribed ? 'PRO Account' : 'Free Sandbox'}
                </span>
              </div>
              <button onClick={logoutUser} className="btn btn-outline btn-sm">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link href="/login?tab=signup" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavigationHeader />
      <main style={{ flexGrow: 1 }}>{children}</main>
      <footer className="footer">
        <div className="container footer-inner">
          <div className="logo">
            <div className="logo-icon"></div>
            MedTrackInsight
          </div>
          <div className="footer-links">
            <Link href="/" className="nav-link">Search Dashboard</Link>
            <Link href="/about" className="nav-link">Corporate R&D</Link>
            <Link href="/subscription" className="nav-link">Plan Matrix</Link>
            <Link href="/contact" className="nav-link">Contact Support</Link>
            <Link href="/demo" className="nav-link">Enterprise Demo</Link>
          </div>
          <p className="footer-copyright">
            © {new Date().getFullYear()} MedTrackInsight Portal. Built for high-frequency clinical research and pipeline optimization.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>MedTrackInsight Portal - Molecular and Clinical Trial Intelligence</title>
        <meta name="description" content="Search drug pipelines, clinical moa databases, and extract FDA/EMA approved medical intelligence with 45 analytical columns." />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AppProvider>
          <MainLayout>{children}</MainLayout>
        </AppProvider>
      </body>
    </html>
  );
}
