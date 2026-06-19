'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import './globals.css';

function NavigationHeader() {
  const { user, logoutUser, loading } = useApp();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.img
            src="/logo.jpg"
            alt="MedTrackInsight Logo"
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
            whileHover={{ scale: 1.1, rotate: 8 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '22px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            MedTrackInsight
          </span>
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

        {/* Mobile menu hamburger toggle */}
        <button className="mobile-nav-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Navigation Menu">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Slide-out Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Overlay background */}
              <motion.div
                className="mobile-drawer-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
              />
              {/* Drawer Container */}
              <motion.div
                className="mobile-drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <img
                    src="/logo.jpg"
                    alt="MedTrackInsight Logo"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--primary)' }}>
                    MedTrackInsight
                  </span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                    Home
                  </Link>
                  <Link href="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                    About Us
                  </Link>
                  <Link href="/subscription" className={`nav-link ${isActive('/subscription') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                    Subscription
                  </Link>
                  <Link href="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                    Contact Us
                  </Link>
                  <Link href="/demo" className={`nav-link ${isActive('/demo') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                    Request Demo
                  </Link>
                  {user && user.email === 'admin@medtrack.com' && (
                    <Link href="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                      Admin Portal
                    </Link>
                  )}
                </nav>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {loading ? (
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading...</span>
                  ) : user ? (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {user.email}
                        </span>
                        <span className={`badge ${user.isSubscribed ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '10px', padding: '1px 6px', marginTop: '2px', width: 'fit-content' }}>
                          {user.isSubscribed ? 'PRO Account' : 'Free Sandbox'}
                        </span>
                      </div>
                      <button onClick={() => { logoutUser(); setMobileMenuOpen(false); }} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="btn btn-outline btn-sm" style={{ width: '100%', textAlign: 'center' }} onClick={() => setMobileMenuOpen(false)}>
                        Log In
                      </Link>
                      <Link href="/login?tab=signup" className="btn btn-primary btn-sm" style={{ width: '100%', textAlign: 'center' }} onClick={() => setMobileMenuOpen(false)}>
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.img
              src="/logo.jpg"
              alt="MedTrackInsight Logo"
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
              whileHover={{ scale: 1.1, rotate: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '22px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              MedTrackInsight
            </span>
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
