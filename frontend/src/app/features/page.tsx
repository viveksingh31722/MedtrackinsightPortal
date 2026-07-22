'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function FeaturesPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const featureModules = [
    {
      title: 'Advanced Drug Search',
      icon: '🔍',
      description: 'Quickly search pipeline candidates using multiple granular search parameters:',
      parameters: [
        'Drug Name', 'Company', 'Therapeutic Area', 'Indication', 
        'Development Phase', 'Mechanism of Action', 'Drug Class', 
        'Route of Administration', 'Molecule Type', 'Biomarker', 
        'Target', 'Country', 'Regulatory Status'
      ]
    },
    {
      title: 'Comprehensive Drug Profiles',
      icon: '🧪',
      description: 'Exhaustive data dimensions provided in every drug dossier profile:',
      parameters: [
        'Drug Overview', 'Generic and Code Name', 'Sponsor and Collaborators', 
        'Mechanism of Action', 'Target Protein', 'Biomarker Information', 
        'Therapeutic Area', 'Indications', 'Molecule Type', 
        'Route of Administration', 'Dosage Form', 'Clinical Development Phase', 
        'Regulatory Designations', 'Development Timeline', 'Line Of Therapy'
      ]
    },
    {
      title: 'Clinical Trial Intelligence',
      icon: '📊',
      description: 'Monitor ongoing, recruiting, and completed clinical studies worldwide:',
      parameters: [
        'Trial Phase', 'Study Design', 'Trial Status', 'Enrollment', 
        'Primary Endpoints', 'Study Locations', 'Estimated Completion Dates', 
        'Trial Identifiers', 'Clinical Results', 'Publications'
      ]
    },
    {
      title: 'Regulatory Intelligence',
      icon: '📜',
      description: 'Stay informed about critical global regulatory developments and designations:',
      parameters: [
        'FDA Updates', 'EMA Updates', 'PMDA Updates', 'MHRA Updates', 
        'CDSCO Updates', 'Fast Track Designation', 'Breakthrough Therapy', 
        'Orphan Drug Status', 'Priority Review', 'Marketing Approval Status'
      ]
    },
    {
      title: 'Licensing & Business Deals',
      icon: '🤝',
      description: 'Track corporate transactions, partnership structures, and commercial terms:',
      parameters: [
        'Licensing Agreements', 'Mergers & Acquisitions', 'Co-development Partnerships', 
        'Research Collaborations', 'Asset Acquisitions', 'Regional Licensing', 
        'Financial Terms', 'Milestone Payments'
      ]
    },
    {
      title: 'Competitive Landscape',
      icon: '📈',
      description: 'Benchmark drugs and portfolios across key competitive vectors:',
      parameters: [
        'Development Stage', 'Company Portfolio', 'Mechanism of Action', 
        'Therapeutic Area', 'Clinical Progress', 'Market Competition', 'Innovation Trends'
      ]
    },
    {
      title: 'Company Intelligence',
      icon: '🏢',
      description: 'Access comprehensive company profiles and research focus areas:',
      parameters: [
        'Pipeline Portfolio', 'Active Clinical Programs', 'Approved Products', 
        'Research Focus', 'Partnerships', 'Recent News', 'Strategic Activities'
      ]
    }
  ];

  return (
    <div className="container" style={{ padding: '36px 24px 60px', maxWidth: '1240px' }}>
      
      {/* Hero Header Card */}
      <div 
        className="card hero-card"
        style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '40px 28px',
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
          ⚡ Platform Capabilities
        </span>
        <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '4px', marginBottom: '12px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          7 Comprehensive Bio-Pharma Intelligence Modules
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '780px', margin: '0 auto', fontSize: '15px', fontWeight: 500, lineHeight: '1.6' }}>
          Explore the full suite of pipeline intelligence tools, covering 70+ searchable parameters from early discovery through clinical trial results and regulatory approvals.
        </p>
      </div>

      {/* Feature Modules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: '24px', marginBottom: '40px' }}>
        {featureModules.map((module, idx) => (
          <div 
            key={idx} 
            className="card"
            style={{ 
              padding: '28px', 
              backgroundColor: '#ffffff', 
              border: '1.5px solid var(--border)', 
              borderRadius: '20px', 
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '32px', lineHeight: 1 }}>{module.icon}</div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{module.title}</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>{module.description}</p>
            
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Key Data Parameters ({module.parameters.length}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {module.parameters.map((param, pIdx) => (
                  <span 
                    key={pIdx}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'var(--bg-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-main)'
                    }}
                  >
                    • {param}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Box matching portal design system */}
      <div 
        className="card" 
        style={{ 
          padding: '40px 32px', 
          textAlign: 'center', 
          backgroundColor: '#ffffff', 
          border: '1.5px solid var(--border)', 
          borderRadius: '24px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '8px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Ready to Search Global Pipeline Intelligence?
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 24px', fontWeight: 500, lineHeight: '1.6' }}>
          Access real-time database queries, clinical trial updates, and company portfolios across 21 therapeutic areas.
        </p>
        <Link href="/search">
          <button className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '12px', fontWeight: 800, fontSize: '14px' }}>
            Launch Search Console →
          </button>
        </Link>
      </div>

    </div>
  );
}
