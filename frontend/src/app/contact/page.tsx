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
    <div className="container" style={{ padding: '60px 24px' }}>
      
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span className="hero-subtitle">Get in Touch</span>
        <h1 style={{ fontSize: '38px', marginTop: '10px' }}>Contact Us</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginTop: '12px' }}>
          Partner with the global leader in medicine intelligence.
        </p>
      </div>

      {/* Corporate Routing Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '60px'
      }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '28px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>💼</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Enterprise Sales</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
            Looking for custom pharmaceutical pipeline tracking, localized medicine datasets, or bulk license access.
          </p>
          <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>• Custom data requests</li>
            <li>• Platform demos</li>
          </ul>
          <a href="mailto:sales@medtrackinsight.com" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px', marginTop: 'auto', textDecoration: 'underline' }}>
            sales@medtrackinsight.com
          </a>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '28px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🛠️</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Technical Data Support</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
            Need assistance with your data delivery formats, custom JSON schema integrations, or API console credentials.
          </p>
          <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>• API access help</li>
            <li>• Delivery issues</li>
          </ul>
          <a href="mailto:support@medtrackinsight.com" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px', marginTop: 'auto', textDecoration: 'underline' }}>
            support@medtrackinsight.com
          </a>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '28px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏢</div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Corporate Headquarters</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
            Our central offices are located in the heart of the business innovation district.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: '0 0 20px 0', lineHeight: '1.5' }}>
            <strong>MedTrackInsight LLC</strong><br />
            100 Innovation Way, Suite 400<br />
            New York, NY 10001
          </p>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 'auto' }}>
            Phone: +1 (555) 019-2831
          </div>
        </div>
      </div>

      {/* Split Details & Contact Form */}
      <div className="split-layout" style={{ gap: '48px', alignItems: 'stretch' }}>
        
        {/* Contact Info & Compliance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Get in Touch with Our Analysts</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              Our dedicated support executives, pharmaceutical research leads, and compliance analysts monitor channels constantly to keep your intelligence streams flowing.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>Enterprise Inquiries</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Email: <a href="mailto:sales@medtrackinsight.com" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>sales@medtrackinsight.com</a><br />
                  Response Time: Within 1 business day
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>Technical &amp; Data Support</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Email: <a href="mailto:dataops@medtrackinsight.com" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>dataops@medtrackinsight.com</a><br />
                  Phone: +1 (555) 019-2831 (Mon-Fri, 9 AM - 5 PM EST)
                </p>
              </div>
            </div>
          </div>

          {/* Compliance & Security Notice Card */}
          <div className="card" style={{ backgroundColor: 'var(--bg-alt)', border: 'none', padding: '24px' }}>
            <h4 style={{ fontSize: '15px', marginBottom: '10px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛡️</span> Data Compliance &amp; Security Notice
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
              All data collected, aggregated, and sold by us complies fully with strict anonymization protocols. We do not store or sell Protected Health Information (PHI) under HIPAA/GDPR frameworks. For compliance evaluations, contact <a href="mailto:compliance@medtrackinsight.com" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>compliance@medtrackinsight.com</a>.
            </p>
          </div>
        </div>

        {/* Message Input Form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

    </div>
  );
}
