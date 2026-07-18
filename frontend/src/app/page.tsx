'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from './context/AppContext';
import ThreeHeroViewport from './components/ThreeHeroViewport';
import ThreeScrollCanvas from './components/ThreeScrollCanvas';

export default function HomePage() {
  const router = useRouter();
  const { apiBaseUrl } = useApp();

  // Search input query
  const [quickQuery, setQuickQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 1. Pipeline Simulator State
  const [inputVolume, setInputVolume] = useState(250000); // 10k to 1m
  const [anomalyTarget, setAnomalyTarget] = useState(95); // 80% to 99.9%
  const [excludeNull, setExcludeNull] = useState(true);
  const [enableKAnon, setEnableKAnon] = useState(true);
  const [resolveDuplicate, setResolveDuplicate] = useState(true);

  // Derived simulator outputs
  const [derivedMolecules, setDerivedMolecules] = useState(0);
  const [derivedSpeed, setDerivedSpeed] = useState(0);
  const [derivedIntegrity, setDerivedIntegrity] = useState(0);
  const [derivedYield, setDerivedYield] = useState(0);

  useEffect(() => {
    // Math logic for data pipeline simulation
    const volumeMultiplier = inputVolume * 0.056;
    const anomalyFactor = anomalyTarget / 100;
    const nullDeduction = excludeNull ? 0.91 : 1.0;
    const duplicateDeduction = resolveDuplicate ? 0.85 : 1.0;

    const molecules = Math.round(volumeMultiplier * anomalyFactor * nullDeduction * duplicateDeduction);

    const speed = parseFloat(((inputVolume / 10000) * (enableKAnon ? 1.45 : 0.8) * (excludeNull ? 0.9 : 1.0)).toFixed(1));

    let integrity = 82 + (anomalyTarget - 80) * 0.75 + (enableKAnon ? 3.5 : 0) + (excludeNull ? 1.5 : 0);
    if (integrity > 99.9) integrity = 99.9;
    integrity = parseFloat(integrity.toFixed(2));

    const yieldPercent = parseFloat((anomalyTarget * (excludeNull ? 0.94 : 1.0) * (resolveDuplicate ? 0.97 : 1.0)).toFixed(1));

    setDerivedMolecules(molecules);
    setDerivedSpeed(speed);
    setDerivedIntegrity(integrity);
    setDerivedYield(yieldPercent);
  }, [inputVolume, anomalyTarget, excludeNull, enableKAnon, resolveDuplicate]);

  // 2. Sample Report Downloader State
  const [downloadFormat, setDownloadFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'empty' | 'invalid' | 'valid'>('empty');
  const [downloading, setDownloading] = useState(false);

  const validateEmail = (email: string) => {
    if (!email) return 'empty';
    // Match basic email patterns and flag generic domains as invalid for institutional compliance
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return 'invalid';

    const genericDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'mail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (genericDomains.includes(domain)) return 'invalid';

    return 'valid';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCorporateEmail(val);
    setEmailStatus(validateEmail(val));
  };

  const handleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailStatus !== 'valid') return;

    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);

      // Trigger the appropriate file download
      const link = document.createElement('a');
      if (downloadFormat === 'xlsx') {
        link.href = '/sample_pricing_matrix.xlsx';
        link.download = 'medtrack_pricing_matrix_sample.xlsx';
      } else {
        link.href = '/sample_market_report.pdf';
        link.download = 'medtrack_pipeline_report_sample.pdf';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1200);
  };

  useEffect(() => {
    if (quickQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`${apiBaseUrl || 'http://localhost:5000/api'}/medicine/suggestions?query=${encodeURIComponent(quickQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [quickQuery, apiBaseUrl]);

  const handleSelectHomepageSuggestion = (suggestion: any) => {
    const text = suggestion.text;
    const type = suggestion.type;

    if (type === 'country') {
      router.push(`/search?query=${encodeURIComponent(text)}&countries=${encodeURIComponent(text)}`);
    } else if (type === 'disease') {
      router.push(`/search?query=${encodeURIComponent(text)}&diseases=${encodeURIComponent(text)}`);
    } else {
      router.push(`/search?query=${encodeURIComponent(text)}`);
    }
    setShowSuggestions(false);
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    setSearching(true);
    router.push(`/search?query=${encodeURIComponent(quickQuery.trim())}`);
  };

  return (
    <div>
      
      {/* 1. Split Hero Section with Dedicated 3D Three.js Viewport */}
      <section className="hero home-hero" style={{ overflow: 'hidden', padding: '70px 0 60px', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '1240px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(450px, 100%), 1fr))', gap: '40px', alignItems: 'center' }}>
            
            {/* Left Column: Value Proposition & Quick Search */}
            <div style={{ textAlign: 'left' }}>
              <motion.span 
                className="hero-subtitle"
                style={{ 
                  color: 'var(--primary)', 
                  background: 'var(--primary-light)', 
                  border: '1px solid var(--primary)',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-block',
                  marginBottom: '20px'
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Institutional Bio-Pharma Data Console
              </motion.span>
              
              <motion.h1 
                className="hero-title"
                style={{ 
                  fontSize: '44px', 
                  fontWeight: 900, 
                  color: 'var(--text-main)', 
                  lineHeight: '1.15', 
                  margin: '0 0 16px',
                  letterSpacing: '-0.02em'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.15 }}
              >
                Global Medicine Intelligence.<br />Cleaned. Compliant. <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Enterprise-Ready.</span>
              </motion.h1>
              
              <motion.p 
                className="hero-description"
                style={{ 
                  color: 'var(--text-muted)', 
                  margin: '0 0 28px', 
                  fontSize: '16px', 
                  lineHeight: '1.6',
                  fontWeight: 500
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Accelerating market entry, supply chain resilience, and investment due diligence with verified, longitudinal global pharmaceutical data.
              </motion.p>

              <motion.div 
                style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <Link href="/demo" className="btn btn-primary" style={{ padding: '12px 28px' }}>
                  Request Platform Demo
                </Link>
                <Link href="/about" className="btn btn-outline" style={{ padding: '12px 28px' }}>
                  View Sourcing Methodology
                </Link>
              </motion.div>

              {/* Quick Search Entry Pill */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#ffffff', 
                  border: '1.5px solid var(--border)',
                  borderRadius: '16px',
                  padding: '8px 12px 8px 16px',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                  marginTop: '12px'
                }}
              >
                <form onSubmit={handleQuickSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    🔍
                  </span>
                  <input
                    type="text"
                    value={quickQuery}
                    onChange={(e) => setQuickQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Lookup active molecules (e.g. Pembrolizumab, Oncology)..."
                    style={{ 
                      flex: '1 1 200px', 
                      height: '40px', 
                      fontSize: '14px', 
                      border: 'none', 
                      background: 'transparent',
                      outline: 'none',
                      color: 'var(--text-main)',
                      minWidth: '160px'
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={searching} 
                    className="btn btn-primary" 
                    style={{ height: '40px', padding: '0 22px', flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    {searching ? 'Querying...' : 'Quick Search'}
                  </button>
                </form>
                
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    className="autocomplete-dropdown" 
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '10px',
                      right: '10px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid var(--border)',
                      borderRadius: '16px',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 999,
                      marginTop: '8px',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      textAlign: 'left'
                    }}
                  >
                    {suggestions.map((suggestion: any, idx: number) => {
                      let icon = '💊';
                      if (suggestion.type === 'disease') icon = '🦠';
                      else if (suggestion.type === 'country') icon = '🌎';
                      else if (suggestion.type === 'therapyArea') icon = '🩺';
                      else if (suggestion.type === 'developmentPhase') icon = '📊';
                      else if (suggestion.type === 'sponsor') icon = '🏢';
                      else if (suggestion.type === 'biomarker/moa') icon = '🧬';
                      else if (suggestion.type === 'product') icon = '🧪';
                      else if (suggestion.type === 'moleculeType') icon = '🔬';
                      else if (suggestion.type === 'moleculeClass') icon = '🧬';
                      else if (suggestion.type === 'marketed') icon = '🛍️';
                      else if (suggestion.type === 'offPatent') icon = '📅';

                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectHomepageSuggestion(suggestion)}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            padding: '10px 14px', 
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span style={{ marginRight: '4px' }}>{icon}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{suggestion.text}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {suggestion.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column: Dedicated 3D Three.js Interactive Viewport */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              <ThreeHeroViewport />
            </motion.div>

          </div>

          {/* Scale Metrics Counter Grid */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '20px' }}>
            <motion.div 
              className="card"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '20px 24px', 
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--border)',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'left'
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 }}
            >
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="2" fill="#f97316" fillOpacity="0.2"/>
                  <circle cx="5" cy="12" r="2" fill="#f97316" fillOpacity="0.2"/>
                  <circle cx="19" cy="12" r="2" fill="#f97316" fillOpacity="0.2"/>
                  <circle cx="12" cy="19" r="2" fill="#f97316" fillOpacity="0.2"/>
                  <line x1="12" y1="7" x2="12" y2="17"/>
                  <line x1="7" y1="12" x2="17" y2="12"/>
                  <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>
                  <line x1="8.5" y1="15.5" x2="15.5" y2="8.5"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', lineHeight: '1.1' }}>14,000+</div>
                <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '2px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Active Molecules Tracked</div>
              </div>
            </motion.div>

            <motion.div 
              className="card"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '20px 24px', 
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--border)',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'left'
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" fill="#f97316" fillOpacity="0.1"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', lineHeight: '1.1' }}>85+</div>
                <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '2px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Global Markets Audited</div>
              </div>
            </motion.div>

            <motion.div 
              className="card"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '20px 24px', 
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--border)',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'left'
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65 }}
            >
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" fill="#8b5cf6" fillOpacity="0.1"/>
                  <circle cx="18.7" cy="8" r="1.5" fill="#8b5cf6"/>
                  <circle cx="13.6" cy="13.2" r="1.5" fill="#8b5cf6"/>
                  <circle cx="10.8" cy="10.5" r="1.5" fill="#8b5cf6"/>
                  <circle cx="7" cy="14.3" r="1.5" fill="#8b5cf6"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', lineHeight: '1.1' }}>10+ Years</div>
                <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '2px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Historical Trend Depth</div>
              </div>
            </motion.div>

            <motion.div 
              className="card"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '20px 24px', 
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--border)',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'left'
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" fill="#8b5cf6" fillOpacity="0.2"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)', lineHeight: '1.1' }}>2.4 Billion</div>
                <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '2px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Daily Data Points Evaluated</div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Three.js Scroll Animation Layer (Mounted strictly after Hero section) */}
      <ThreeScrollCanvas />

      {/* 2. Interactive Data Pipeline Simulator */}
      <section className="section" style={{ padding: '28px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span className="hero-subtitle">DATA INTEGRITY PROVING CENTER</span>
            <h2 style={{ fontSize: '32px', marginTop: '10px' }}>Interactive Data Pipeline Simulator</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '640px', margin: '12px auto 0', fontSize: '14px' }}>
              Reconcile raw market variables in real-time. Toggle extraction parameters below to see how our cleaning pipeline strips anomalies to deliver normalized schemas.
            </p>
          </div>

          <div className="split-layout" style={{ gap: '48px', alignItems: 'stretch' }}>

            {/* Simulator Controls Card */}
            <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1.2 }}>
              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', color: 'var(--text-main)' }}>
                Pipeline Control Panel
              </h3>

              {/* Slider 1: Input Volume */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  <span>Daily Input Volume (Raw Records)</span>
                  <span style={{ color: '#a1793c' }}>{inputVolume.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={inputVolume}
                  onChange={(e) => setInputVolume(parseInt(e.target.value))}
                  className="slider-custom"
                />
              </div>

              {/* Slider 2: Anomaly Target */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  <span>Anomaly Filtering Target</span>
                  <span style={{ color: '#a1793c' }}>{anomalyTarget}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="99"
                  step="1"
                  value={anomalyTarget}
                  onChange={(e) => setAnomalyTarget(parseInt(e.target.value))}
                  className="slider-custom"
                />
              </div>

              {/* Checkbox Parameters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', color: 'var(--text-main)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={excludeNull}
                    onChange={(e) => setExcludeNull(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>Exclude Missing metrics (Auto-Deduplicate Nulls)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={enableKAnon}
                    onChange={(e) => setEnableKAnon(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>Enable structural k-anonymity (HIPAA Check)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={resolveDuplicate}
                    onChange={(e) => setResolveDuplicate(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>Resolve duplicate CAS chemical Registry IDs</span>
                </label>
              </div>
            </div>

            {/* Pipeline Outputs Display Card */}
            <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
              <div>
                <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', color: 'var(--text-main)' }}>
                  Simulated Ingestion Output
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 700 }}>Molecules Isolated / Mapped</span>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>
                      {derivedMolecules.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 700 }}>Processing Latency</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                        {derivedSpeed} ms
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 700 }}>Pipeline Yield Rate</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                        {derivedYield}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                      <span>Schema Integrity Score</span>
                      <span style={{ color: 'var(--text-main)' }}>{derivedIntegrity}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', width: '100%', backgroundColor: 'var(--accent)', borderRadius: '99px', transformOrigin: 'left' }}
                        initial={false}
                        animate={{ scaleX: derivedIntegrity / 100 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terminal Logs Simulation */}
              <div style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                backgroundColor: '#f0fdf4',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(21, 128, 61, 0.15)',
                color: '#15803d',
                marginTop: '24px',
                lineHeight: '1.5'
              }}>
                [PIPELINE] Ingesting {inputVolume.toLocaleString()} variables...<br />
                [CLEANSE] Applying {anomalyTarget}% anomaly filter filters.<br />
                {excludeNull && <span style={{ color: '#15803d' }}>[CLEANSE] Excluded null records. Mapped values.<br /></span>}
                {enableKAnon && <span style={{ color: '#15803d' }}>[SECURE] Encrypting attributes (k-anonymity checks).<br /></span>}
                [SUCCESS] Pipeline outputs mapped in {derivedSpeed}ms. Integrity: {derivedIntegrity}%.
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 3. Data Taxonomy & Coverage Preview */}
      <section className="section" style={{ padding: '28px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span className="hero-subtitle">DATA VERTICALS</span>
            <h2 style={{ fontSize: '32px', marginTop: '10px' }}>Data Taxonomy &amp; Coverage Preview</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '12px auto 0', fontSize: '14px' }}>
              We compile granular indices across key medicine intelligence segments, giving you absolute coverage.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>

            {/* Column 1 */}
            <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>💰</div>
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Pricing &amp; Reimbursement</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                Gain access to drug pricing vectors, launch values, and regional referencing frameworks to establish optimal licensing matrix parameters.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0, fontSize: '13px', listStyleType: 'none' }}>
                <li style={{ color: 'var(--text-main)' }}>• Launch Price Mapping</li>
                <li style={{ color: 'var(--text-main)' }}>• International Referencing</li>
                <li style={{ color: 'var(--text-main)' }}>• HTA Decision Tracking</li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>⛓️</div>
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Supply Chain &amp; Shortages</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                Identify upstream structural risks, evaluate manufacturer dependency matrix structures, and predict raw material shortages.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0, fontSize: '13px', listStyleType: 'none' }}>
                <li style={{ color: 'var(--text-main)' }}>• Manufacturer Inventory</li>
                <li style={{ color: 'var(--text-main)' }}>• API Dependency Risks</li>
                <li style={{ color: 'var(--text-main)' }}>• Real-time Disruption Alert</li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>📈</div>
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Epidemiology &amp; Volume</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
                Sizing therapeutic markets using longitudinal prescription logs, historical patient cohorts, and target therapy shifts.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0, fontSize: '13px', listStyleType: 'none' }}>
                <li style={{ color: 'var(--text-main)' }}>• Patient Population Sizing</li>
                <li style={{ color: 'var(--text-main)' }}>• Localized Rx Volumes</li>
                <li style={{ color: 'var(--text-main)' }}>• Longitudinal Therapy Shifts</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Target Audience Use Cases */}
      <section className="section" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span className="hero-subtitle">USE CASES &amp; BUYER BENEFITS</span>
            <h2 style={{ fontSize: '32px', marginTop: '10px' }}>Target Audience Use Cases</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '12px auto 0', fontSize: '14px' }}>
              Built specifically to support high-risk decision workflows across three core corporate lines.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Case 1 */}
            <div className="card" style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'center' }}>
              <div>
                <span className="badge-outline">For Pharma Firms</span>
                <h3 style={{ fontSize: '20px', marginTop: '12px' }}>Portfolio Strategy &amp; Launch Price Optimization</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Optimize market entry pricing strategies, evaluate competitive therapeutic clusters, and defend portfolio market share against generic entry windows. Standardize international pricing referencing structures.
              </p>
            </div>

            {/* Case 2 */}
            <div className="card" style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'center' }}>
              <div>
                <span className="badge-outline">For Finance &amp; Hedge Funds</span>
                <h3 style={{ fontSize: '20px', marginTop: '12px' }}>Healthcare Equities &amp; Asset Diligence</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Track real-time active pharmaceutical ingredient (API) supply disruptions and prescription volume shifts to conduct rigorous due diligence on healthcare equities and find early indications of market movement.
              </p>
            </div>

            {/* Case 3 */}
            <div className="card" style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'center' }}>
              <div>
                <span className="badge-outline">For Consulting Networks</span>
                <h3 style={{ fontSize: '20px', marginTop: '12px' }}>Accelerated Client Engagement Delivery</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                Accelerate client engagement delivery with instant access to clean, exportable historic medicine pricing matrices and international reference pricing models, completely skipping manual extraction steps.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Sample Report & Dashboard Teaser */}
      <section className="section" style={{ padding: '28px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>

          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span className="hero-subtitle">DATA PREVIEW LOCKER</span>
            <h2 style={{ fontSize: '32px', marginTop: '10px' }}>Secure Data Previews</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
              Verify our schema integrity by downloading a sample dataset payload.
            </p>
          </div>

          <div className="card" style={{ padding: '36px' }}>
            <form onSubmit={handleDownload} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Step 1: Select Format */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ backgroundColor: 'var(--accent)', color: '#000000', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px' }}>1</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Target Dataset Structure</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div
                    onClick={() => setDownloadFormat('xlsx')}
                    style={{
                      border: `1.5px solid ${downloadFormat === 'xlsx' ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                      background: downloadFormat === 'xlsx' ? 'rgba(243,208,123,0.06)' : 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>Global Pricing Matrix (XLSX)</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Structured spreadsheet bundle</span>
                  </div>

                  <div
                    onClick={() => setDownloadFormat('pdf')}
                    style={{
                      border: `1.5px solid ${downloadFormat === 'pdf' ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                      background: downloadFormat === 'pdf' ? 'rgba(243,208,123,0.06)' : 'rgba(255,255,255,0.02)',
                      padding: '16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>Therapeutic Pipeline Report (PDF)</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Formatted pipeline intelligence</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Input Email */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ backgroundColor: 'var(--accent)', color: '#000000', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px' }}>2</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Credential Verification</span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <input
                    type="email"
                    value={corporateEmail}
                    onChange={handleEmailChange}
                    placeholder="you@yourcompany.com"
                    className="form-input"
                    style={{ height: '48px', borderRadius: '10px' }}
                    required
                  />

                  {/* Verification Status Note */}
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600 }}>
                    {emailStatus === 'empty' && (
                      <span style={{ color: 'var(--text-light)' }}>Please enter your corporate email to unlock the download.</span>
                    )}
                    {emailStatus === 'invalid' && (
                      <span style={{ color: 'var(--danger)' }}>❌ Please enter a valid corporate email address (generic webmail is blocked).</span>
                    )}
                    {emailStatus === 'valid' && (
                      <span style={{ color: '#22C55E' }}>✓ Corporate domain validated. Secure institutional payload unlocked.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Trigger Download */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ backgroundColor: 'var(--accent)', color: '#000000', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px' }}>3</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Download Secure Payload</span>
                </div>

                <button
                  type="submit"
                  disabled={emailStatus !== 'valid' || downloading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '52px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '15px'
                  }}
                >
                  {downloading ? (
                    <>
                      <div className="spinner-loader"></div>
                      <span>Verifying Gateway &amp; Packing Bundle...</span>
                    </>
                  ) : downloadFormat === 'xlsx' ? (
                    'Download Sample Dataset (XLSX)'
                  ) : (
                    'View Sample Market Report (PDF)'
                  )}
                </button>
              </div>

            </form>
          </div>

        </div>
      </section>

      {/* 6. Enterprise Trust & Governance Footer Banner */}
      <section style={{ padding: '48px 24px', backgroundColor: 'rgba(25, 25, 24, 0.4)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
          <h4 style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffffff', marginBottom: '12px' }}>
            Enterprise-Grade Data Governance
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
            Fully compliant with GDPR, HIPAA, and regional cross-border healthcare information frameworks. All source files undergo structural k-anonymization and are entirely stripped of individual Patient Health Information (PHI) prior to system ingestion, guaranteeing total institutional security compliance. For audit credentials, contact <a href="mailto:compliance@medtrackinsight.com" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>compliance@medtrackinsight.com</a>.
          </p>
        </div>
      </section>

    </div>
  );
}
