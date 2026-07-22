'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function CancellationPolicyPage() {
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
          🛡️ Billing & Terminations
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: 900, marginTop: '4px', marginBottom: '8px', color: 'var(--text-main)' }}>
          Cancellation Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          MedTrackInsight Institutional Subscription Terms & Cancellation Guidelines
        </p>
      </div>

      <div className="card" style={{ padding: '36px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', lineHeight: '1.7', fontSize: '14px', color: 'var(--text-main)' }}>
        
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>1. Annual Subscription Terms</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
          MedTrackInsight offers subscription plans (Starter and Professional) billed on a monthly or annual commitment cycle. Upon payment confirmation, user licenses, data export limits, and module permissions are immediately activated for the duration of the billing cycle.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>2. How to Cancel Subscription Auto-Renewal</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
          Subscribers may cancel their subscription auto-renewal at any time during their active subscription period through the <strong>User Profile Console</strong> or by contacting our Billing Support team at <strong>support@medtrackinsight.com</strong> at least 7 business days prior to the annual renewal date.
        </p>

        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>3. Effect of Cancellation</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
          When an auto-renewal cancellation is processed:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '20px', color: 'var(--text-muted)' }}>
          <li style={{ marginBottom: '8px' }}>Your active subscription features, search console access, and export quotas remain fully operational until the end of your paid billing cycle.</li>
          <li style={{ marginBottom: '8px' }}>No recurring charge will be processed upon expiry of the current billing cycle.</li>
          <li style={{ marginBottom: '8px' }}>After the contract end date, your account transitions to free basic catalog search status.</li>
        </ul>

        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>4. Refund &amp; Chargeback Information</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          For details regarding fee adjustments, error reversals, or refund eligibility, please refer to our dedicated <Link href="/refund-policy" style={{ color: 'var(--primary)', fontWeight: 700 }}>Refund Policy</Link>.
        </p>

      </div>

    </div>
  );
}
