'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function DemoPage() {
  const { apiBaseUrl, showToast } = useApp();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset scroll position to top (Y = 0) on page mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !company || !jobTitle) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    try {
      setLoading(true);
      const startTime = Date.now();
      const res = await fetch(`${apiBaseUrl}/admin/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, company, jobTitle, requirements }),
      });

      const elapsed = Date.now() - startTime;
      const minDelay = 1500;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      if (res.ok) {
        showToast('Demo request registered! Our sales desk will call you.', 'success');
        setName('');
        setEmail('');
        setCompany('');
        setJobTitle('');
        setRequirements('');
      } else {
        showToast('Error registering demo details', 'danger');
      }
    } catch (err) {
      showToast('Could not reach application server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px 24px 60px', maxWidth: '800px' }}>
      
      {/* Prominent High-Contrast Hero Header Card */}
      <div 
        className="card hero-card"
        style={{ 
          textAlign: 'center', 
          marginBottom: '24px',
          padding: '32px 28px',
          backgroundColor: '#ffffff',
          border: '1.5px solid var(--border)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          zIndex: 2
        }}
      >
        <span className="hero-subtitle">⚡ Enterprise Consultation</span>
        <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', marginBottom: '12px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Request a Live Platform Walkthrough
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500, lineHeight: '1.5', margin: '0 auto', maxWidth: '620px' }}>
          Evaluate custom spreadsheet uploads, dedicated server pipelines, and unlimited downloads for your team.
        </p>
      </div>

      <div className="card" style={{ padding: '32px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', cursor: loading ? 'wait' : 'default' }}>
          
          <div className="form-split-row">
            <div className="form-group">
              <label htmlFor="demo-name" className="form-label">Full Name *</label>
              <input
                id="demo-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Sarah Jenkins"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="demo-email" className="form-label">Work Email *</label>
              <input
                id="demo-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="s.jenkins@biotech.com"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-split-row">
            <div className="form-group">
              <label htmlFor="demo-company" className="form-label">Company/Institution *</label>
              <input
                id="demo-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Genentech"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="demo-title" className="form-label">Job Title *</label>
              <input
                id="demo-title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Principal Investigator"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="demo-requirements" className="form-label">Data Coverage Requirements &amp; Notes</label>
            <textarea
              id="demo-requirements"
              rows={4}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="E.g., We are tracking Phase II oncology inhibitors targeting VEGFR..."
              className="form-input"
              style={{ height: 'auto', padding: '12px 16px' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '46px', cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Submitting request...' : 'Book Walkthrough Demo'}
          </button>

        </form>
      </div>

    </div>
  );
}
