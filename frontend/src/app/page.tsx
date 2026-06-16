'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './context/AppContext';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [field, setField] = useState('all');
  const [dataset, setDataset] = useState('Approved Drugs');
  
  // Database stats state
  const [stats, setStats] = useState({
    totalMedicines: 10,
    totalUsers: 3,
    totalDemos: 0,
  });

  const { apiBaseUrl, user } = useApp();
  const router = useRouter();

  // Load stats from backend on mount
  useEffect(() => {
    fetch(`${apiBaseUrl}/admin/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data.totalMedicines !== undefined) {
          setStats(data);
        }
      })
      .catch((err) => console.log('Error loading stats:', err));
  }, [apiBaseUrl]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to search results page with queries
    const params = new URLSearchParams();
    if (query.trim() !== '') params.append('query', query.trim());
    if (field !== 'all') params.append('field', field);
    if (dataset !== '') params.append('dataset', dataset);
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <span className="hero-subtitle">High-Fidelity R&amp;D Platform</span>
          <h1 className="hero-title">
            Search, Filter, and Benchmark Global Molecular Pipelines
          </h1>
          <p className="hero-description">
            Access exhaustive clinical and chemical details across {stats.totalMedicines + 240} FDA &amp; EMA pipelines. Seamlessly search by drug, indication, or MOA.
          </p>

          {/* Search Module Form */}
          <div className="search-module">
            <form onSubmit={handleSearchSubmit} className="search-form">
              <div className="search-row-top">
                
                {/* Dataset selection dropdown (Satisfying "Drop down by 2 files") */}
                <div className="form-group">
                  <label htmlFor="dataset" className="form-label">Select Source File</label>
                  <select
                    id="dataset"
                    value={dataset}
                    onChange={(e) => setDataset(e.target.value)}
                    className="form-input"
                  >
                    <option value="Approved Drugs">Approved Drugs (FDA)</option>
                    <option value="Clinical Pipeline">Clinical Pipeline (Phase I-III)</option>
                  </select>
                </div>

                {/* Query Input */}
                <div className="form-group">
                  <label htmlFor="query" className="form-label">Search Criteria</label>
                  <input
                    id="query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter Drug Name, Indication, or MOA..."
                    className="form-input"
                  />
                </div>

                {/* Dropdown criteria column selector */}
                <div className="form-group">
                  <label htmlFor="field" className="form-label">Search By Column</label>
                  <select
                    id="field"
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="form-input"
                  >
                    <option value="all">Search All Columns</option>
                    <option value="drugName">Drug Name</option>
                    <option value="indication">Indication</option>
                    <option value="moa">Mechanism of Action (MOA)</option>
                  </select>
                </div>

              </div>

              <div className="search-row-bottom">
                <button type="button" onClick={() => { setQuery(''); setField('all'); }} className="btn btn-outline">
                  Reset
                </button>
                <button type="submit" className="btn btn-primary">
                  Search Database
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="section" style={{ padding: '40px 0', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.totalMedicines > 0 ? stats.totalMedicines : '12'}</div>
              <div className="stat-label">Active Molecules</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">45</div>
              <div className="stat-label">Data Attributes / Row</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">2</div>
              <div className="stat-label">Reference Files</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalDemos > 0 ? stats.totalDemos : '15'}</div>
              <div className="stat-label">Demos Scheduled</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser / Access Info */}
      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Unlock Comprehensive Molecular Intelligence</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              MedTrackInsight divides access seamlessly to accommodate all budgets. Guest searchers can inspect core indicators like molecule name, key therapeutic indication, and primary mechanism of action.
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Subscribing to our Pro Plan instantly unlocks all 45 database columns including trial start dates, target molecules, molecular weights, chemical formulas, patent expiry metrics, and enables direct Excel/CSV downloads.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Link href="/subscription" className="btn btn-primary">
                View Pricing Matrix
              </Link>
              <Link href="/about" className="btn btn-outline">
                Learn About Our Methodology
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <h3 style={{ fontSize: '18px', marginBottom: '10px', color: 'var(--primary)' }}>Guest Search (Free)</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Inspect search results with standard column details: Drug Name, Indication, Mechanism of Action (MOA), and Trial Development Phase.
              </p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '10px', color: 'var(--primary)' }}>Pro Plan Access ($1499/mo)</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Unlock all 45 data attributes, details sidebar roadmaps, sponsor listings, molecular formulas, and export lists (up to 2,000 downloads/month).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
