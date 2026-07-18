'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

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

export default function AboutPage() {
  // Ensure the page always starts at the very top (Y = 0) on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="container" style={{ padding: '36px 24px 60px', maxWidth: '1200px' }}>
      
      {/* Prominent High-Contrast Hero Header Card */}
      <div 
        className="card hero-card"
        style={HERO_CARD_STYLE}
      >
        <span 
          className="hero-subtitle" 
          style={HERO_SUBTITLE_STYLE}
        >
          ⚡ Who We Are
        </span>
        <h1 style={{ fontSize: '36px', fontWeight: 900, marginTop: '4px', marginBottom: '16px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Empowering Biopharmaceutical R&amp;D Decisions
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto', fontSize: '15px', fontWeight: 500, lineHeight: '1.6' }}>
          MedTrackInsight provides critical researchers, investors, and clinical sponsors with high-resolution benchmarking data, consolidating global pharmaceutical pipelines into a single high-performance query console.
        </p>
      </div>

      {/* Corporate Capabilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        <div 
          className="card"
          style={{ padding: '32px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>🔬</div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>Drug Intelligence</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            Access detailed chemical formulas, CAS registry indices, administration routes, and biological targets for approved molecules and early pipeline candidate profiles.
          </p>
        </div>

        <div 
          className="card"
          style={{ padding: '32px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>Trial Tracking</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            Monitor trial completion timelines, recruitment volumes, registry credentials, and primary endpoint variables across 40+ key analytical data dimensions.
          </p>
        </div>

        <div 
          className="card"
          style={{ padding: '32px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>📈</div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>Pipeline Analytics</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            Compare competitor pipeline phases from Phase I early clinical research to full FDA/EMA marketing approvals and track patent expiration roadmaps.
          </p>
        </div>

      </div>

      {/* Informational stats summary card */}
      <div 
        className="card" 
        style={{ padding: '36px', textAlign: 'center', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
          Ready to Explore Global Drug Pipeline Matrices?
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto 24px', fontSize: '14px', lineHeight: '1.5' }}>
          Instantly filter over 14,000+ candidate molecules across global markets with 45 analytical detail columns.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/search" className="btn btn-primary">
            🔍 Launch Query Console
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Contact Research Desk
          </Link>
        </div>
      </div>

    </div>
  );
}
