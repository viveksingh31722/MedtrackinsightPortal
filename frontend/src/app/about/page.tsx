'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="container" style={{ padding: '60px 24px' }}>
      
      {/* Introduction Banner */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <span className="hero-subtitle">Who We Are</span>
        <h1 style={{ fontSize: '38px', marginTop: '10px', marginBottom: '20px' }}>
          Empowering Biopharmaceutical R&amp;D Decisions
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto', fontSize: '16px' }}>
          MedTrackInsight provides critical researchers, investors, and clinical sponsors with high-resolution benchmarking data, consolidating global pharmaceutical pipelines into a single high-performance query console.
        </p>
      </div>

      {/* Corporate Capabilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '60px' }}>
        
        <div className="card">
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>🔬</div>
          <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Drug Intelligence</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Access detailed chemical formulas, CAS registry indices, administration routes, and biological targets for approved molecules and early pipeline candidate profiles.
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Trial Tracking</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Monitor trial completion timelines, recruitment volumes, registry credentials, and primary endpoint variables across 40+ key analytical data dimensions.
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>📈</div>
          <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Pipeline Analytics</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Compare competitor pipeline phases from Phase I early clinical research to full FDA/EMA marketing approvals and track patent expiration roadmaps.
          </p>
        </div>

      </div>

      {/* Informational stats summary card */}
      <div className="card" style={{ backgroundColor: 'var(--bg-alt)', border: 'none', display: 'flex', flexDirection: 'column', gap: '24px', padding: '40px', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '28px' }}>Standardized Excel/CSV Catalog Imports</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          Unlike enterprise suites that require complex database migrations and custom tables for new columns, MedTrackInsight features a flexible database layout. Admin files uploaded as Excel or CSV sheets automatically map core fields (Drug Name, Indication, MOA) and dump the remaining columns as schema-agnostic JSON. This keeps database maintenance costs low and supports changes instantly.
        </p>
        <div>
          <Link href="/demo" className="btn btn-primary">
            Request an Enterprise Trial
          </Link>
        </div>
      </div>

      {/* Section team summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>Accurate Clinical Benchmarks</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '14px' }}>
            MedTrackInsight sources its data profiles directly from international registers, including ClinicalTrials.gov, EMA Registry, PMDA lists, and verified corporate press briefings.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Our curators standardize mechanism categories, indication definitions, and chemical formulas to ensure search queries filter correctly. Subscribe to our Pro Plan to query the entire database or request a demo to evaluate custom pipelines.
          </p>
        </div>
        <div className="card" style={{ padding: '32px' }}>
          <h4 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--primary)' }}>Empirical Stats Summary</h4>
          <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', fontWeight: 600 }}>
            <li style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>FDA Databases Synced</span>
              <span style={{ color: 'var(--primary)' }}>Bi-weekly</span>
            </li>
            <li style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Fields Extracted</span>
              <span style={{ color: 'var(--primary)' }}>45 Attributes</span>
            </li>
            <li style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Average Query Speed</span>
              <span style={{ color: 'var(--primary)' }}>&lt; 35ms</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Download Limits Enforced</span>
              <span style={{ color: 'var(--primary)' }}>2,000 rows/mo</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
