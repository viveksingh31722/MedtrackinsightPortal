'use client';

import React, { useEffect } from 'react';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="container" style={{ padding: '36px 24px 60px', maxWidth: '1000px' }}>
      
      <div 
        className="card hero-card"
        style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '36px 28px',
          backgroundColor: '#ffffff',
          border: '1.5px solid var(--border)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <span 
          style={{
            color: 'var(--primary)', 
            background: 'var(--primary-light)', 
            border: '1px solid var(--primary)', 
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'inline-block',
            marginBottom: '14px'
          }}
        >
          🔒 Legal & Governance
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: 900, marginTop: '4px', marginBottom: '8px', color: 'var(--text-main)' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Last Updated: July 2026 • MedTrackInsight Data Protection Standards
        </p>
      </div>

      <div className="card" style={{ padding: '36px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', lineHeight: '1.7', fontSize: '14px', color: 'var(--text-main)' }}>
        
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>1. Overview & Information Collection</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
          MedTrackInsight (&quot;the Platform&quot;) is committed to respecting user privacy and protecting personal data. This Privacy Policy details how we collect, use, store, and safeguard information when you access our pharmaceutical pipeline database, search console, or institutional subscription services.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>2. Types of Data We Process</h2>
        <ul style={{ paddingLeft: '20px', marginBottom: '20px', color: 'var(--text-muted)' }}>
          <li style={{ marginBottom: '8px' }}><strong>Account Information</strong>: Name, corporate email address, organization name, job designation, and country.</li>
          <li style={{ marginBottom: '8px' }}><strong>Usage &amp; Analytics</strong>: Search query logs, export statistics, category filter preferences, and session timestamps.</li>
          <li style={{ marginBottom: '8px' }}><strong>Technical Data</strong>: IP address, browser type, device identifiers, and security access tokens.</li>
        </ul>

        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>3. How We Use Your Information</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
          We process collected data solely to deliver, optimize, and secure our bio-pharma intelligence portal. This includes validating active subscriptions, enforcing download quotas, delivering alert updates, and improving database query speeds. We do not sell, rent, or trade subscriber personal data to third parties.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>4. Security &amp; Encryption Standards</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
          All data transmissions between client browsers and MedTrackInsight servers are protected using industry-standard 256-Bit SSL/TLS encryption. User passwords are stored using salted cryptographic bcrypt hashes.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>5. Contact Research &amp; Privacy Desk</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          If you have questions regarding our data privacy practices or wish to exercise data access/deletion rights, please contact our Research Desk at <strong>privacy@medtrackinsight.com</strong>.
        </p>

      </div>

    </div>
  );
}
