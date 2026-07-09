'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './context/AppContext';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [field, setField] = useState('all');
  const [dataset, setDataset] = useState('Pipeline Prospector');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);

  const isSuggestionChecked = (suggestion: any) => {
    const text = suggestion.text;
    const type = suggestion.type;
    if (type === 'country') {
      return selectedCountries.includes(text);
    }
    if (type === 'disease') {
      return selectedDiseases.includes(text);
    }
    if (type === 'sponsor') {
      return selectedSponsors.includes(text);
    }
    if (type === 'developmentPhase' || type === 'therapyArea') {
      return selectedPhases.includes(text);
    }
    const keywords = query.split(',').map((s: string) => s.trim()).filter(Boolean);
    return keywords.includes(text);
  };

  const handleToggleSuggestion = (suggestion: any) => {
    const text = suggestion.text;
    const type = suggestion.type;
    if (type === 'country') {
      setSelectedCountries(prev =>
        prev.includes(text) ? prev.filter(c => c !== text) : [...prev, text]
      );
    } else if (type === 'disease') {
      setSelectedDiseases(prev =>
        prev.includes(text) ? prev.filter(d => d !== text) : [...prev, text]
      );
    } else if (type === 'sponsor') {
      setSelectedSponsors(prev =>
        prev.includes(text) ? prev.filter(s => s !== text) : [...prev, text]
      );
    } else if (type === 'developmentPhase' || type === 'therapyArea') {
      setSelectedPhases(prev =>
        prev.includes(text) ? prev.filter(p => p !== text) : [...prev, text]
      );
    } else {
      const keywords = query.split(',').map((s: string) => s.trim()).filter(Boolean);
      const nextKeywords = keywords.includes(text)
        ? keywords.filter((k: string) => k !== text)
        : [...keywords, text];
      setQuery(nextKeywords.join(', '));
    }
  };

  const CATEGORIES = [
    'Therapy Area',
    'Disease',
    'Current Development Phase',
    'Company/ Sponsor',
    'Biomarker/ MOA',
    'Product/ Candidate',
    'Type Of Molecule',
    'Biological Class',
    'Marketed Drugs',
    'Off Patent Drugs'
  ];
  
  // Suggestions UI states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  // Database stats state with local cache initialization
  const [stats, setStats] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cachedStats');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return {
      totalMedicines: 10,
      totalPipeline: 0,
      totalForecasting: 0,
      totalUsers: 3,
      totalDemos: 0,
    };
  });

  const { apiBaseUrl, user } = useApp();
  const router = useRouter();

  // Autocomplete fetcher
  useEffect(() => {
    if (query.trim() === '') {
      setSuggestions([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/medicine/suggestions?query=${encodeURIComponent(query)}&category=${encodeURIComponent(selectedCategory)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error('Suggestions fetch error:', err);
      }
    }, 200); // 200ms debounce
    
    return () => clearTimeout(delayDebounceFn);
  }, [query, selectedCategory, apiBaseUrl]);

  // Load stats from backend on mount
  useEffect(() => {
    fetch(`${apiBaseUrl}/admin/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data.totalMedicines !== undefined) {
          setStats(data);
          localStorage.setItem('cachedStats', JSON.stringify(data));
        }
      })
      .catch((err) => console.log('Error loading stats:', err));
  }, [apiBaseUrl]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    const params = new URLSearchParams();
    if (query.trim() !== '') params.append('query', query.trim());
    if (field !== 'all') params.append('field', field);
    if (dataset !== '') params.append('dataset', dataset);
    if (selectedCountries.length > 0) params.append('countries', selectedCountries.join(','));
    if (selectedDiseases.length > 0) params.append('diseases', selectedDiseases.join(','));
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section with custom modern gradient background */}
      <section className="hero home-hero" style={{ overflow: 'hidden' }}>
        <div className="container">
          <motion.span 
            className="hero-subtitle"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            INTELLIGENCE DISPATCH ENGINE
          </motion.span>
          
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.2 }}
          >
            Search, Filter, and Benchmark Global Molecular Pipelines
          </motion.h1>
          
          <motion.p 
            className="hero-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Access exhaustive clinical and chemical details across {stats.totalMedicines + 240} FDA &amp; EMA pipelines. Seamlessly query candidates by drug name, indication, or mechanism of action.
          </motion.p>

          {/* Search Module Form */}
          <motion.div 
            className="search-module"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 80, delay: 0.4 }}
          >
            <form onSubmit={handleSearchSubmit} className="search-form">
              <div className="search-row-top">
                
                {/* Dataset selection dropdown */}
                <div className="form-group">
                  <label htmlFor="dataset" className="form-label">Select Source File</label>
                  <select
                    id="dataset"
                    value={dataset}
                    onChange={(e) => setDataset(e.target.value)}
                    className="form-input"
                  >
                    <option value="Pipeline Prospector">Pipeline Prospector</option>
                    <option value="Patent & Sales Forecasting">Patent & Sales Forecasting</option>
                  </select>
                </div>

                {/* Query Input */}
                <div className="form-group" style={{ position: 'relative', flexGrow: 1, minWidth: '300px' }}>
                  <label htmlFor="query" className="form-label">Search Criteria</label>
                  <input
                    id="query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Enter Drug Name, Indication, or MOA..."
                    className="form-input"
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <div className="autocomplete-dropdown" onMouseDown={(e) => e.preventDefault()}>
                      {suggestions.map((suggestion, idx) => {
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
                        
                        const isChecked = isSuggestionChecked(suggestion);
                        
                        return (
                          <div
                            key={idx}
                            className="autocomplete-item"
                            onClick={() => handleToggleSuggestion(suggestion)}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // toggling handled by parent item click handler
                              style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#ff7a00' }}
                            />
                            <span style={{ marginRight: '4px' }}>{icon}</span>
                            <span style={{ fontWeight: 600 }}>{suggestion.text}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {suggestion.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

              {/* Category Pills Row */}
              <div className="category-pills-container" style={{ marginTop: '16px', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)', marginBottom: '8px' }}>
                  Filter suggestions by category:
                </div>
                <div className="category-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(isActive ? '' : cat)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          border: `1.5px solid ${isActive ? '#ff7a00' : 'var(--border)'}`,
                          backgroundColor: isActive ? '#ff7a00' : '#111111',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                        }}
                        className={`category-pill ${isActive ? 'active' : ''}`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="search-row-bottom">
                <button type="button" onClick={() => { setQuery(''); setField('all'); setSelectedCategory(''); }} className="btn btn-outline">
                  Reset
                </button>
                <motion.button 
                  type="submit" 
                  className="btn btn-primary"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={searching}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  {searching ? (
                    <>
                      <div className="spinner-loader"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    "Search Database"
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="section" style={{ padding: '60px 0', backgroundColor: 'transparent', borderBottom: '1.5px solid var(--border)' }}>
        <div className="container">
          <div className="stats-grid">
            <motion.div 
              className="stat-card"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              <div className="stat-number">{stats.totalMedicines > 0 ? stats.totalMedicines : '12'}</div>
              <div className="stat-label">Active Molecules</div>
            </motion.div>
            <motion.div 
              className="stat-card"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <div className="stat-number">45</div>
              <div className="stat-label">Searchable Columns</div>
            </motion.div>
            <motion.div 
              className="stat-card"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              <div className="stat-number">2</div>
              <div className="stat-label">Domain Datasets</div>
            </motion.div>
            <motion.div 
              className="stat-card"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.4 }}
            >
              <div className="stat-number">{stats.totalDemos > 0 ? stats.totalDemos : '18'}</div>
              <div className="stat-label">Demos Scheduled</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* High-Fidelity Features / Flows Section */}
      <section className="section" style={{ borderBottom: '1.5px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="hero-subtitle">FEATURES &amp; UTILITIES</span>
            <h2 style={{ fontSize: '38px', marginTop: '16px' }}>Modular Intelligence for High-Frequency R&amp;D</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            <div className="card">
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Pipeline Prospector</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                Track clinical phase status, molecule classes, licensee locations, trial timelines, and specific licensee upfront deals across primary therapeutic indications.
              </p>
            </div>
            
            <div className="card">
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Patent &amp; Sales Forecasts</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                Evaluate patent expiry schedules, dose forms, active ingredients, competitor counts, and sales history (2018-2022) with advanced predictive sales values up to 2027.
              </p>
            </div>

            <div className="card">
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📑</div>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Standardized Exports</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                Generate instantly structured spreadsheet lists with all 45 data columns. Pro subscribers can run exports for up to 2,000 candidate records monthly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / Workflow Pipeline */}
      <section className="section" style={{ backgroundColor: 'transparent', borderBottom: '1.5px solid var(--border)' }}>
        <div className="container">
          <div className="split-layout" style={{ alignItems: 'center' }}>
            <div>
              <span className="hero-subtitle">DATA EXTRACTION PIPELINE</span>
              <h2 style={{ fontSize: '36px', marginTop: '16px', marginBottom: '24px' }}>How MedTrackInsight Compiles Scientific Assets</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    flexShrink: 0
                  }}>1</div>
                  <div>
                    <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>Global Trial Ingestion</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>We crawl FDA, EMA, and regional registries for updated investigational drug submissions daily.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    flexShrink: 0
                  }}>2</div>
                  <div>
                    <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>Biomarker Target Resolution</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Our automated scripts reconcile mechanism of action profiles and link target biomarkers to molecules.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    flexShrink: 0
                  }}>3</div>
                  <div>
                    <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>Sales Forecasting Models</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Historical revenues are integrated with competitor counts to project financial trajectory tables.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--bg-main)', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#cf2a2a'
              }}></div>
              <div style={{ padding: '20px 10px 10px 10px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', fontFamily: 'monospace' }}>system_status.log</h3>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                  [INFO] Ingesting database updates: 247 pipelines...<br />
                  [INFO] Reconciling mechanism mapping logic...<br />
                  [INFO] Fetching patent expiry status...<br />
                  [SUCCESS] DB compilation matches Prisma schema.<br />
                  [INFO] Access controls validated: Sandbox free limits active.<br />
                  [SUCCESS] Transporter configured for SMTP notification.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser / Access Info */}
      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '48px', alignItems: 'center' }}>
          <div>
            <span className="hero-subtitle">SUBSCRIPTION TIERS</span>
            <h2 style={{ fontSize: '36px', marginTop: '16px', marginBottom: '20px' }}>Unlock Comprehensive Molecular Intelligence</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '15px' }}>
              MedTrackInsight structures database views to fit research needs. Free Sandbox accounts permit core queries including drug name, primary indication, and development phase.
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '15px' }}>
              Pro Plan subscriptions unlock all 45 data columns including trial starts, sponsor organizations, molecular weight metrics, chemical formulas, patent tables, and Excel downloads.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/subscription" className="btn btn-primary">
                View Pricing Matrix
              </Link>
              <Link href="/about" className="btn btn-outline">
                Read Methodology
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <motion.div 
              className="card"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Guest Sandbox (Free)</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Search records with 4 basic column filters: Drug Name, Indication, Mechanism of Action (MOA), and Trial Development Phase.
              </p>
            </motion.div>
            <motion.div 
              className="card" 
              style={{ borderColor: 'var(--border)' }}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <span className="badge badge-info" style={{ marginBottom: '12px', fontSize: '10px' }}>PRO SUBSCRIPTION</span>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Pro Intelligence ($1,499/mo)</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Unlock all 45 data variables, details sidebar dashboard, sponsor details, molecular weights, and spreadsheet exports (up to 2,000 lines).
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

