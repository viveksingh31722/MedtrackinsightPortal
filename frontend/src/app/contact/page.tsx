'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function ContactPage() {
  const { apiBaseUrl, showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      showToast('Please fill in all details', 'warning');
      return;
    }

    try {
      setLoading(true);
      const startTime = Date.now();
      const res = await fetch(`${apiBaseUrl}/admin/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      const elapsed = Date.now() - startTime;
      const minDelay = 1500;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      if (res.ok) {
        showToast('Your message has been recorded. Our team will respond shortly.', 'success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        showToast('Error registering contact log', 'danger');
      }
    } catch (err) {
      showToast('Could not reach application server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container split-layout" style={{ padding: '60px 24px' }}>
      
      {/* Informational left section */}
      <div>
        <span className="hero-subtitle">Support Hub</span>
        <h1 style={{ fontSize: '38px', marginTop: '10px', marginBottom: '20px' }}>Contact MedTrackInsight Support</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Have technical questions about our API sync schedules, custom spreadsheet templates, or billing cycles? Drop our R&amp;D desk a line.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '24px' }}>📧</div>
            <div style={{ minWidth: 0 }}>
              <h4 style={{ fontSize: '15px' }}>Email Inquiries</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>support@medtrackinsight.com</p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '24px' }}>🏢</div>
            <div style={{ minWidth: 0 }}>
              <h4 style={{ fontSize: '15px' }}>HQ Operations</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Biopark Science Complex, Building 4, Boston, MA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form right section */}
      <div className="card">
        <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>Submit a Message</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', cursor: loading ? 'wait' : 'default' }}>
          
          <div className="form-group">
            <label htmlFor="contact-name" className="form-label">Full Name</label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Sarah Jenkins"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-email" className="form-label">Work Email</label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="s.jenkins@biotech.com"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-message" className="form-label">How can our R&amp;D desk help?</label>
            <textarea
              id="contact-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Details regarding your pipeline lookup request..."
              className="form-input"
              style={{ height: 'auto', padding: '12px 16px' }}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Recording...' : 'Send Message'}
          </button>
        </form>
      </div>

    </div>
  );
}
