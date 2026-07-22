'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

const HERO_CARD_STYLE: React.CSSProperties = {
  textAlign: 'center', 
  marginBottom: '32px',
  padding: '40px 28px',
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
          ⚡ About The Platform
        </span>
        <h1 style={{ fontSize: '36px', fontWeight: 900, marginTop: '4px', marginBottom: '16px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Transform Pipeline Data into Strategic Intelligence
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '840px', margin: '0 auto 20px', fontSize: '15px', fontWeight: 500, lineHeight: '1.7' }}>
          The <strong>Pipeline Intelligence Platform</strong> is a comprehensive pharmaceutical database designed to help researchers, business development teams, investors, regulatory professionals, and commercial teams monitor the global drug development landscape.
        </p>
        <p style={{ color: 'var(--text-muted)', maxWidth: '840px', margin: '0 auto 24px', fontSize: '14px', lineHeight: '1.7' }}>
          Our platform consolidates publicly available information from multiple trusted global sources into a structured, searchable database—enabling users to identify emerging therapies, evaluate competitors, monitor clinical progress, and uncover high-value market opportunities.
        </p>

        {/* Action Mantra Pill Badge */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px 16px',
          padding: '10px 24px',
          backgroundColor: '#5B21B6',
          color: '#ffffff',
          borderRadius: '24px',
          fontSize: '14px',
          fontWeight: 900,
          letterSpacing: '0.06em',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <span>🔍 SEARCH</span>
          <span>•</span>
          <span>📊 ANALYZE</span>
          <span>•</span>
          <span>📡 MONITOR</span>
          <span>•</span>
          <span>🎯 DECIDE</span>
        </div>
      </div>

      {/* Value Proposition Callout Card */}
      <div className="card" style={{ padding: '32px', marginBottom: '36px', backgroundColor: '#FAF5FF', border: '1.5px solid #DDD6FE', borderRadius: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '12px', color: '#4C1D95' }}>
          Comprehensive Drug Pipeline Database for Smarter Pharmaceutical Decisions
        </h2>
        <p style={{ color: '#5B21B6', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
          Track global drug development from <strong>Discovery to Approval</strong> with continuously updated pipeline intelligence covering clinical trials, regulatory milestones, licensing deals, company profiles, mechanisms of action, indications, biomarkers, and competitive landscape.
        </p>
      </div>

      {/* Target Audience User Breakdown */}
      <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '20px', textAlign: 'center', color: 'var(--text-main)' }}>
        Empowering Key Bio-Pharma Stakeholders
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔬</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Researchers</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
            Analyze mechanisms of action, biological targets, biomarker profiles, and novel drug candidates across preclinical and clinical development stages.
          </p>
        </div>

        <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤝</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Business Development</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
            Identify high-value licensing opportunities, asset acquisitions, strategic partnerships, and co-development deals across global markets.
          </p>
        </div>

        <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>💼</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Investors</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
            Evaluate corporate pipelines, clinical trial endpoints, trial completion timelines, and regulatory designations to make data-driven investment decisions.
          </p>
        </div>

        <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📜</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Regulatory Professionals</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
            Monitor regulatory milestones, FDA, EMA, PMDA, MHRA updates, Fast Track, Breakthrough, and Orphan Drug designations worldwide.
          </p>
        </div>

        <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📈</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Commercial Teams</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
            Benchmark therapeutic area competition, forecast generic entry and patent expiries, and analyze commercial launch timelines.
          </p>
        </div>

      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '20px' }}>
        <Link href="/features" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '16px', height: '100%' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>⚡ Explore Platform Features →</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>View detailed specs for all 7 intelligence modules and 70+ search parameters.</p>
          </div>
        </Link>

        <Link href="/search" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1.5px solid var(--border)', borderRadius: '16px', height: '100%' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>🔍 Launch Search Console →</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Query global pipeline databases across 21 therapeutic areas.</p>
          </div>
        </Link>
      </div>

    </div>
  );
}
