'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const HERO_CARD_STYLE: React.CSSProperties = {
  textAlign: 'center', 
  marginBottom: '32px',
  padding: '36px 28px',
  backgroundColor: '#ffffff',
  border: '1.5px solid var(--border)',
  borderRadius: '24px',
  boxShadow: 'var(--shadow-md)',
  position: 'relative',
  zIndex: 2
};

const HERO_SUBTITLE_STYLE: React.CSSProperties = {
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
};

export default function ContactPage() {
  const { apiBaseUrl, showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ensure page always starts at top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      showToast('Please fill out all required fields.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const finalMessage = organization ? `[Organization: ${organization}]\n\n${message}` : message;
      
      const res = await fetch(`${apiBaseUrl}/admin/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message: finalMessage }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Thank you! Your inquiry has been sent to our Research Desk.', 'success');
        setName('');
        setEmail('');
        setOrganization('');
        setMessage('');
      } else {
        showToast(data.message || 'Error sending contact inquiry.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not reach application server', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px 24px 60px', maxWidth: '1000px' }}>
      
      {/* Prominent High-Contrast Hero Header Card */}
      <div 
        className="card hero-card"
        style={HERO_CARD_STYLE}
      >
        <span 
          className="hero-subtitle" 
          style={HERO_SUBTITLE_STYLE}
        >
          ⚡ Contact Research Desk
        </span>
        <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '4px', marginBottom: '12px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Get in Touch with Institutional Analysts
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '15px', fontWeight: 500, lineHeight: '1.6' }}>
          Have questions about our data sourcing methodology, enterprise API integrations, or custom trial dataset extractions?
        </p>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '32px' }}>
        
        {/* Inquiry Form */}
        <div className="card" style={{ padding: '32px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)' }}>
            Send an Inquiry
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Dr. Sarah Jenkins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', height: '42px', padding: '0 16px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>Corporate Email *</label>
              <input
                type="email"
                className="form-input"
                placeholder="s.jenkins@biopharma.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', height: '42px', padding: '0 16px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>Organization / Institution</label>
              <input
                type="text"
                className="form-input"
                placeholder="Global Bio-Pharma R&D Group"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                style={{ width: '100%', height: '42px', padding: '0 16px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)', marginBottom: '6px', display: 'block' }}>Message Details *</label>
              <textarea
                className="form-input"
                style={{ width: '100%', height: '120px', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px', resize: 'vertical' }}
                placeholder="Specify target dataset, therapeutic area, or custom API requirements..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px', height: '44px', fontWeight: 800 }}
            >
              {submitting ? 'Transmitting Inquiry...' : 'Submit Inquiry'}
            </button>
          </form>
        </div>

        {/* Contact Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>✉️</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>Direct Analyst Email</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.5' }}>
              Our dedicated bio-pharma analysts respond within 4 business hours.
            </p>
            <a href="mailto:support@medtrackinsight.com" style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '14px' }}>
              support@medtrackinsight.com
            </a>
          </div>

          <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🏢</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>Institutional Support</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              MedTrackInsight Intelligence Platform<br />
              Enterprise Data Sourcing &amp; Compliance Division
            </p>
          </div>

          <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>⏱️</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>Desk Availability</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Monday – Friday: 08:00 – 20:00 EST<br />
              Weekend Desk: Critical P0 Ticket Coverage
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
