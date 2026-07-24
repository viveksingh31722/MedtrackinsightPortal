'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
import ScrollGradientBackground from './components/ScrollGradientBackground';
import ThreeScrollCanvas from './components/ThreeScrollCanvas';
import './globals.css';

const DROPDOWN_TRIGGER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: '8px',
  transition: 'background 0.2s',
};

const AVATAR_BOX_STYLE: React.CSSProperties = {
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
  border: '1px solid var(--border)',
};

const LOGOUT_BTN_STYLE: React.CSSProperties = {
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
};

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
          <Link href="/search" className={`nav-link ${isActive('/search') ? 'active' : ''}`}>
            Search Console
          </Link>
          <Link href="/features" className={`nav-link ${isActive('/features') ? 'active' : ''}`}>
            Features
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
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={DROPDOWN_TRIGGER_STYLE}
                className="profile-dropdown-trigger"
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {user.name || user.email.split('@')[0]}
                  </span>
                  <span className={`badge ${user.isSubscribed ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '12px', padding: '1px 6px', marginTop: '2px' }}>
                    {user.isSubscribed ? 'PRO Account' : 'Free Sandbox'}
                  </span>
                </div>
                <div style={AVATAR_BOX_STYLE}>
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
                        type="button"
                        onClick={() => { setDropdownOpen(false); logoutUser(); }}
                        style={LOGOUT_BTN_STYLE}
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
        <button type="button" className="mobile-nav-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Navigation Menu">
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
                  <Link href="/search" className={`nav-link ${isActive('/search') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                    Search Console
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
                        <span className={`badge ${user.isSubscribed ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '12px', padding: '1px 6px', marginTop: '2px', width: 'fit-content' }}>
                          {user.isSubscribed ? 'PRO Account' : 'Free Sandbox'}
                        </span>
                      </div>
                      <button type="button" onClick={() => { logoutUser(); setMobileMenuOpen(false); }} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
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
      <footer className="footer" style={{ backgroundColor: '#ffffff', position: 'relative', zIndex: 10, borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '1200px', padding: '36px 24px 20px' }}>
          
          {/* 4-Column Enterprise Footer Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--border)'
          }}>
            
            {/* Column 1: Brand & Tagline */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <motion.img
                  src="/logo.jpg"
                  alt="MedTrackInsight Logo"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                  whileHover={{ scale: 1.1, rotate: 8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: '18px',
                  color: 'var(--text-main)',
                }}>
                  MedTrackInsight
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', fontWeight: 500 }}>
                Empowering global bio-pharma decision makers with longitudinal clinical trial data, drug pipeline tracking, and MOA intelligence.
              </p>
            </div>

            {/* Column 2: Platform Navigation */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Platform Solutions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Link href="/" className="nav-link" style={{ fontSize: '13px' }}>🏠 Home</Link>
                <Link href="/search" className="nav-link" style={{ fontSize: '13px' }}>🔍 Search Console</Link>
                <Link href="/features" className="nav-link" style={{ fontSize: '13px' }}>⚡ Platform Features</Link>
                <Link href="/subscription" className="nav-link" style={{ fontSize: '13px' }}>💳 Enterprise Plans</Link>
                <Link href="/demo" className="nav-link" style={{ fontSize: '13px' }}>⚡ Request Live Demo</Link>
              </div>
            </div>

            {/* Column 3: Corporate & Governance */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                Governance & Policies
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Link href="/about" className="nav-link" style={{ fontSize: '13px' }}>ℹ️ About Platform</Link>
                <Link href="/contact" className="nav-link" style={{ fontSize: '13px' }}>✉️ Corporate Contact</Link>
                <Link href="/privacy-policy" className="nav-link" style={{ fontSize: '13px' }}>🔒 Privacy Policy</Link>
                <Link href="/refund-policy" className="nav-link" style={{ fontSize: '13px' }}>🛡️ Refund Policy</Link>
                <Link href="/cancellation-policy" className="nav-link" style={{ fontSize: '13px' }}>📜 Cancellation Policy</Link>
              </div>
            </div>

            {/* Column 4: Contact & System Health */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                System Status
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>FDA & EMA Data Sync: Active</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', lineHeight: '1.5' }}>
                Questions or API inquiries? Contact us at <strong style={{ color: 'var(--primary)' }}>support@medtrackinsight.com</strong>
              </p>
            </div>

          </div>

          {/* Bottom Bar: Copyright */}
          <div style={{ paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 500 }}>
              © {new Date().getFullYear()} MedTrackInsight Portal. All clinical trial data verified for high-frequency pharmaceutical research.
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-light)' }}>
              <span>Privacy Compliant</span>
              <span>•</span>
              <span>ISO 27001 Certified</span>
            </div>
          </div>

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
  const shouldReduceMotion = useReducedMotion();

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
        {/* Uncomment and replace with your actual verification code from Google Search Console: */}
        {/* <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" /> */}
        <link rel="icon" href="/logo.jpg" />
      </head>
      <body>
        <AppProvider>
          <MotionConfig reducedMotion={shouldReduceMotion ? "always" : "user"}>
            <ScrollGradientBackground />
            <MainLayout>{children}</MainLayout>
          </MotionConfig>
        </AppProvider>
      </body>
    </html>
  );
}
