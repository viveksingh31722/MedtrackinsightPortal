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
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

        <div className="nav-buttons" style={{ position: 'relative' }}>
          {loading ? (
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading...</span>
          ) : user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  transition: 'background 0.2s',
                }}
                className="profile-dropdown-trigger"
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {user.name || user.email.split('@')[0]}
                  </span>
                  <span className={`badge ${user.isSubscribed ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '10px', padding: '1px 6px', marginTop: '2px' }}>
                    {user.isSubscribed ? 'PRO Account' : 'Free Sandbox'}
                  </span>
                </div>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#ffffff',
                  border: '1px solid var(--border)'
                }}>
                  {(user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase())}
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 99 }} 
                      onClick={() => setDropdownOpen(false)}
                    />
                     <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        width: '260px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 100,
                        overflow: 'hidden',
                        padding: '8px 0',
                      }}
                    >
                      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '15px',
                          color: '#ffffff',
                          border: '1px solid var(--border)'
                        }}>
                          {(user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase())}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.name || 'User Profile'}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.email}
                          </span>
                          <span className={`badge ${user.isSubscribed ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '9px', padding: '1px 6px', marginTop: '4px', width: 'fit-content' }}>
                            {user.isSubscribed ? '★ Pro Plan' : 'Free Plan'}
                          </span>
                        </div>
                      </div>

                      <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

                      <Link 
                        href="/profile?tab=personal-info" 
                        onClick={() => setDropdownOpen(false)}
                        className="dropdown-link"
                        style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', fontSize: '13px', color: 'var(--text-main)', textDecoration: 'none' }}
                      >
                        <span style={{ marginRight: '8px' }}>👤</span> My Profile
                      </Link>

                      <Link 
                        href="/profile?tab=saved-items" 
                        onClick={() => setDropdownOpen(false)}
                        className="dropdown-link"
                        style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', fontSize: '13px', color: 'var(--text-main)', textDecoration: 'none' }}
                      >
                        <span style={{ marginRight: '8px' }}>⭐</span> Saved Items
                      </Link>

                      <Link 
                        href="/profile?tab=downloads" 
                        onClick={() => setDropdownOpen(false)}
                        className="dropdown-link"
                        style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', fontSize: '13px', color: 'var(--text-main)', textDecoration: 'none' }}
                      >
                        <span style={{ marginRight: '8px' }}>📥</span> Downloads
                      </Link>

                      <Link 
                        href="/profile?tab=subscription" 
                        onClick={() => setDropdownOpen(false)}
                        className="dropdown-link"
                        style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', fontSize: '13px', color: 'var(--text-main)', textDecoration: 'none' }}
                      >
                        <span style={{ marginRight: '8px' }}>💳</span> Billing & Subscription
                      </Link>

                      <Link 
                        href="/profile?tab=preferences" 
                        onClick={() => setDropdownOpen(false)}
                        className="dropdown-link"
                        style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', fontSize: '13px', color: 'var(--text-main)', textDecoration: 'none' }}
                      >
                        <span style={{ marginRight: '8px' }}>⚙️</span> Settings & Preferences
                      </Link>

                      <Link 
                        href="/contact" 
                        onClick={() => setDropdownOpen(false)}
                        className="dropdown-link"
                        style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', fontSize: '13px', color: 'var(--text-main)', textDecoration: 'none' }}
                      >
                        <span style={{ marginRight: '8px' }}>❓</span> Help & Support
                      </Link>

                      <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

                      <button
                        onClick={() => { setDropdownOpen(false); logoutUser(); }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          width: '100%', 
                          background: 'none', 
                          border: 'none', 
                          padding: '10px 16px', 
                          fontSize: '13px', 
                          color: '#EF4444', 
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        className="dropdown-link logout"
                      >
                        <span style={{ marginRight: '8px' }}>🚪</span> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )prefTheme=([^;]*)/);
      const theme = match ? match[1] : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, []);

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
