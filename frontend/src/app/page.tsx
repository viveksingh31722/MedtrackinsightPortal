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
  
  // Suggestions UI states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Database stats state
  const [stats, setStats] = useState({
    totalMedicines: 10,
    totalPipeline: 0,
    totalForecasting: 0,
    totalUsers: 3,
    totalDemos: 0,
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
        const res = await fetch(`${apiBaseUrl}/medicine/suggestions?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        console.error('Suggestions fetch error:', err);
      }
    }, 200); // 200ms debounce
    
    return () => clearTimeout(delayDebounceFn);
  }, [query, apiBaseUrl]);

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
    const params = new URLSearchParams();
    if (query.trim() !== '') params.append('query', query.trim());
    if (field !== 'all') params.append('field', field);
    if (dataset !== '') params.append('dataset', dataset);
    
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
            High-Fidelity R&amp;D Platform
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
            Access exhaustive clinical and chemical details across {stats.totalMedicines + 240} FDA &amp; EMA pipelines. Seamlessly search by drug, indication, or MOA.
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
                <div className="form-group" style={{ position: 'relative' }}>
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
                    <div className="autocomplete-dropdown">
                      {suggestions.map((suggestion, idx) => {
                        let icon = '💊';
                        if (suggestion.type === 'disease') icon = '🦠';
                        if (suggestion.type === 'country') icon = '🌎';
                        
                        return (
                          <div
                            key={idx}
                            className="autocomplete-item"
                            onClick={() => {
                              if (suggestion.type === 'medicine') {
                                setQuery(suggestion.text);
                                setField('drugName');
                                router.push(`/search?query=${encodeURIComponent(suggestion.text)}&field=drugName&dataset=${encodeURIComponent(dataset)}`);
                              } else if (suggestion.type === 'disease') {
                                setQuery(suggestion.text);
                                setField('indication');
                                router.push(`/search?query=${encodeURIComponent(suggestion.text)}&field=indication&dataset=${encodeURIComponent(dataset)}`);
                              } else if (suggestion.type === 'country') {
                                setQuery('');
                                router.push(`/search?query=&countries=${encodeURIComponent(suggestion.text)}&dataset=${encodeURIComponent(dataset)}`);
                              }
                              setShowSuggestions(false);
                            }}
                          >
                            <span style={{ marginRight: '8px' }}>{icon}</span>
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

              <div className="search-row-bottom">
                <button type="button" onClick={() => { setQuery(''); setField('all'); }} className="btn btn-outline">
                  Reset
                </button>
                <motion.button 
                  type="submit" 
                  className="btn btn-primary"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Search Database
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="section" style={{ padding: '60px 0', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
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
              <div className="stat-number">94</div>
              <div className="stat-label">Searchable Fields</div>
            </motion.div>
            <motion.div 
              className="stat-card"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              <div className="stat-number">2</div>
              <div className="stat-label">Domain Tables</div>
            </motion.div>
            <motion.div 
              className="stat-card"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.4 }}
            >
              <div className="stat-number">{stats.totalDemos > 0 ? stats.totalDemos : '15'}</div>
              <div className="stat-label">Demos Scheduled</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser / Access Info */}
      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Unlock Comprehensive Molecular Intelligence</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              MedTrackInsight divides access seamlessly to accommodate all budgets. Guest searchers can inspect core indicators like molecule name, key therapeutic indication, and primary mechanism of action.
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Subscribing to our Pro Plan instantly unlocks all 94 database columns including trial start dates, target molecules, molecular weights, chemical formulas, patent expiry metrics, and enables direct Excel/CSV downloads.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/subscription" className="btn btn-primary">
                View Pricing Matrix
              </Link>
              <Link href="/about" className="btn btn-outline">
                Learn About Our Methodology
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <motion.div 
              className="card"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <h3 style={{ fontSize: '18px', marginBottom: '10px', color: 'var(--primary)' }}>Guest Search (Free)</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Inspect search results with standard column details: Drug Name, Indication, Mechanism of Action (MOA), and Trial Development Phase.
              </p>
            </motion.div>
            <motion.div 
              className="card" 
              style={{ borderLeft: '4px solid var(--primary)' }}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <h3 style={{ fontSize: '18px', marginBottom: '10px', color: 'var(--primary)' }}>Pro Plan Access ($1499/mo)</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Unlock all 94 data attributes, details sidebar roadmaps, sponsor listings, molecular formulas, and export lists (up to 2,000 downloads/month).
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
