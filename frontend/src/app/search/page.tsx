'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000; // Count up dynamically in exactly 1 second
    const startValue = 0;
    const endValue = value;

    if (endValue === 0) {
      setCount(0);
      return;
    }

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * (endValue - startValue) + startValue));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value]);

  return <>{count.toLocaleString()}</>;
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { apiBaseUrl, user, showToast, apiFetch } = useApp();

  // Search parameters from URL
  const queryParam = searchParams.get('query') || '';
  const fieldParam = searchParams.get('field') || 'all';
  const datasetParam = searchParams.get('dataset') || 'Pipeline Prospector';

  const ALL_COUNTRIES = ['US', 'EU', 'Japan', 'Canada', 'Korea', 'India', 'Aus/NZ'];
  const ALL_DISEASES = ['Fever', 'Cold/Cough', 'Asthma'];
  
  const getCountriesFromParams = () => {
    const countriesStr = searchParams.get('countries');
    if (countriesStr !== null) {
      return countriesStr.split(',').map(c => c.trim()).filter(Boolean);
    }
    const clivalCountries: string[] = [];
    for (let i = 0; i < 15; i++) {
      const val = searchParams.get(`searchCountry[${i}]`);
      if (val) {
        clivalCountries.push(val);
      }
    }
    if (clivalCountries.length > 0) {
      return clivalCountries;
    }
    return [];
  };

  const getDiseasesFromParams = () => {
    const diseasesStr = searchParams.get('diseases');
    if (diseasesStr !== null) {
      return diseasesStr.split(',').map(d => d.trim()).filter(Boolean);
    }
    return [];
  };

  const countriesParam = getCountriesFromParams();
  const diseasesParam = getDiseasesFromParams();

  // Search inputs
  const [query, setQuery] = useState(queryParam);
  const [field, setField] = useState(fieldParam);
  const [dataset, setDataset] = useState(datasetParam);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(countriesParam);
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>(diseasesParam);

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);

  // Modals for sales and clinical trial result cards
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

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
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [originalQuery, setOriginalQuery] = useState(queryParam);
  // Ref-based debounce and client cache for autocomplete
  const suggestionsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientSuggestionCacheRef = useRef<Map<string, any[]>>(new Map());

  // API data states
  const [medicines, setMedicines] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 10, totalPages: 1, isSubscribed: false });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Selected drug details drawer
  const [selectedDrug, setSelectedDrug] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Column manager states (Available to Pro subscribers)
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    sponsor: true,
    route: true,
    target: true,
    trialId: false,
    moleculeType: false,
    patentExpiry: false,
    molecularWeight: false,
    brandName: false,
  });

  // Sidebar filter states
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);

  // Prevent background scrolling and hide main page scrollbar when details drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.documentElement.classList.add('drawer-open');
      document.body.classList.add('drawer-open');
    } else {
      document.documentElement.classList.remove('drawer-open');
      document.body.classList.remove('drawer-open');
    }
    return () => {
      document.documentElement.classList.remove('drawer-open');
      document.body.classList.remove('drawer-open');
    };
  }, [drawerOpen]);

  const isSuggestionChecked = (suggestion: any) => {
    if (!suggestion || !suggestion.text) return false;
    const text = suggestion.text;
    const keywords = query.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (keywords.some(k => k.toLowerCase() === text.toLowerCase())) {
      return true;
    }
    if (suggestion.type === 'country' && selectedCountries.includes(text)) return true;
    if (suggestion.type === 'disease' && selectedDiseases.includes(text)) return true;
    if (suggestion.type === 'sponsor' && selectedSponsors.includes(text)) return true;
    if ((suggestion.type === 'developmentPhase' || suggestion.type === 'therapyArea') && selectedPhases.includes(text)) return true;
    return false;
  };

  const handleToggleSuggestion = (suggestion: any) => {
    const text = suggestion.text;
    
    const terms = query.split(',').map((s: string) => s.trim());
    const nonTerms = terms.filter(Boolean);
    const lastTerm = (terms[terms.length - 1] || '').trim();

    const existingIndex = nonTerms.findIndex(t => t.toLowerCase() === text.toLowerCase());

    let newTerms: string[];
    let isChecking = false;

    if (existingIndex !== -1) {
      // Uncheck: remove this value from comma separated query
      newTerms = nonTerms.filter((_, idx) => idx !== existingIndex);
    } else {
      isChecking = true;
      // Check: replace partial query term if lastTerm is a partial match, otherwise append
      const isLastTermPartialMatch = 
        lastTerm !== '' && 
        lastTerm.toLowerCase() !== text.toLowerCase() &&
        (
          text.toLowerCase().includes(lastTerm.toLowerCase()) || 
          lastTerm.toLowerCase().includes(text.toLowerCase())
        );

      if (isLastTermPartialMatch) {
        // Replace the partial last term with full suggestion text
        newTerms = [...nonTerms.slice(0, -1), text];
      } else {
        // Append suggestion text
        newTerms = [...nonTerms, text];
      }
    }

    // Format new query string and append trailing comma & space when checking items
    let newQueryStr = newTerms.join(', ');
    if (isChecking && newTerms.length > 0) {
      newQueryStr += ', ';
    }

    setQuery(newQueryStr);
    setOriginalQuery(newQueryStr);

    // Keep suggestions open and re-fetch options for updated query & category context
    setShowSuggestions(true);
    fetchSuggestions(newQueryStr, selectedCategory);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = activeSuggestionIndex < suggestions.length - 1 ? activeSuggestionIndex + 1 : activeSuggestionIndex;
      setActiveSuggestionIndex(next);
      if (next !== -1) {
        const suggestion = suggestions[next];
        const terms = originalQuery.split(',').map(s => s.trim());
        const nextVal = [...terms.slice(0, -1), suggestion.text].join(', ');
        setQuery(nextVal);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = activeSuggestionIndex > -1 ? activeSuggestionIndex - 1 : -1;
      setActiveSuggestionIndex(next);
      if (next === -1) {
        setQuery(originalQuery);
      } else {
        const suggestion = suggestions[next];
        const terms = originalQuery.split(',').map(s => s.trim());
        const nextVal = [...terms.slice(0, -1), suggestion.text].join(', ');
        setQuery(nextVal);
      }
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex !== -1) {
        e.preventDefault();
        handleToggleSuggestion(suggestions[activeSuggestionIndex]);
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      setQuery(originalQuery);
    }
  };

  const fetchAnalysisData = async () => {
    try {
      setAnalysisLoading(true);
      const currentCountries = getCountriesFromParams();
      const currentDiseases = getDiseasesFromParams();
      const params = new URLSearchParams({
        query: queryParam,
        field: fieldParam,
        countries: currentCountries.join(','),
        diseases: currentDiseases.join(','),
      });

      const res = await apiFetch(`${apiBaseUrl}/medicine/analysis?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAnalysisData(data);
        // Cache analysis results
        sessionStorage.setItem('cachedSearchAnalysis', JSON.stringify({
          analysisData: data,
          queryParam,
          fieldParam,
          countries: currentCountries.join(','),
          diseases: currentDiseases.join(',')
        }));
      }
    } catch (err) {
      console.error('Error fetching analysis data:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Autocomplete fetcher — with client-side caching & ref-based debounce
  const fetchSuggestions = (q: string, cat: string) => {
    // Derive the active search term (last comma-segment)
    const parts = q.split(',').map(s => s.trim());
    const activeTerm = parts[parts.length - 1] || '';

    const cacheKey = `${cat.toLowerCase()}:${activeTerm.toLowerCase()}`;

    // Instant client-side cache lookup (0ms network cost)
    if (clientSuggestionCacheRef.current.has(cacheKey)) {
      const cachedList = clientSuggestionCacheRef.current.get(cacheKey)!;
      setSuggestions(cachedList);
      if (cachedList.length > 0) {
        setShowSuggestions(true);
      }
      return;
    }

    if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);

    suggestionsDebounceRef.current = setTimeout(async () => {
      try {
        const url = `${apiBaseUrl}/medicine/suggestions?query=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const list = data.suggestions || [];
          clientSuggestionCacheRef.current.set(cacheKey, list);
          setSuggestions(list);
          if (list.length > 0) {
            setShowSuggestions(true);
          }
        }
      } catch (err) {
        console.error('Suggestions fetch error:', err);
      }
    }, 150);
  };

  // Track page parameters when URL changes
  useEffect(() => {
    let formattedQuery = queryParam;
    if (formattedQuery.trim() !== '' && !formattedQuery.trim().endsWith(',')) {
      formattedQuery = formattedQuery.trim() + ', ';
    }
    setQuery(formattedQuery);
    setOriginalQuery(formattedQuery);
    setField(fieldParam);
    setDataset(datasetParam);
    setSelectedCategory(searchParams.get('category') || '');
    const parsedCountries = getCountriesFromParams();
    setSelectedCountries(parsedCountries);
    const parsedDiseases = getDiseasesFromParams();
    setSelectedDiseases(parsedDiseases);

    // Stale-While-Revalidate search cache restore
    let cacheRestored = false;
    const countriesStr = parsedCountries.join(',');
    const diseasesStr = parsedDiseases.join(',');

    try {
      const cachedResultStr = sessionStorage.getItem('cachedSearchResults');
      if (cachedResultStr) {
        const cached = JSON.parse(cachedResultStr);
        if (
          cached.queryParam === queryParam &&
          cached.fieldParam === fieldParam &&
          cached.datasetParam === datasetParam &&
          cached.countries === countriesStr &&
          cached.diseases === diseasesStr
        ) {
          setMedicines(cached.medicines);
          setMeta(cached.meta);
          setPage(cached.page);
          setLoading(false);
          cacheRestored = true;
        }
      }
      
      const cachedAnalysisStr = sessionStorage.getItem('cachedSearchAnalysis');
      if (cachedAnalysisStr) {
        const cachedAnalysis = JSON.parse(cachedAnalysisStr);
        if (
          cachedAnalysis.queryParam === queryParam &&
          cachedAnalysis.fieldParam === fieldParam &&
          cachedAnalysis.countries === countriesStr &&
          cachedAnalysis.diseases === diseasesStr
        ) {
          setAnalysisData(cachedAnalysis.analysisData);
          setAnalysisLoading(false);
        }
      }
    } catch (e) {
      console.error('Error restoring search page cache:', e);
    }

    if (!cacheRestored) {
      setLoading(true);
      setAnalysisLoading(true);
    }

    fetchSearchResults(1);
    fetchAnalysisData();
  }, [queryParam, fieldParam, datasetParam, searchParams]);

  // Fetch search results from backend
  const fetchSearchResults = async (pageNum: number) => {
    try {
      setLoading(true);
      const currentCountries = getCountriesFromParams();
      const currentDiseases = getDiseasesFromParams();
      const params = new URLSearchParams({
        query: queryParam,
        field: fieldParam,
        dataset: datasetParam,
        page: pageNum.toString(),
        limit: '15',
        countries: currentCountries.join(','),
        diseases: currentDiseases.join(','),
      });

      const res = await apiFetch(`${apiBaseUrl}/medicine/search?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines);
        setMeta(data.meta);
        setPage(pageNum);
        // Update cache
        sessionStorage.setItem('cachedSearchResults', JSON.stringify({
          medicines: data.medicines,
          meta: data.meta,
          page: pageNum,
          queryParam,
          fieldParam,
          datasetParam,
          countries: currentCountries.join(','),
          diseases: currentDiseases.join(',')
        }));
      } else {
        showToast('Error querying clinical records', 'danger');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showToast('Connection to server failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim().replace(/,\s*$/, '');
    const params = new URLSearchParams();
    if (cleanQuery !== '') params.append('query', cleanQuery);
    if (field !== 'all') params.append('field', field);
    if (dataset !== '') params.append('dataset', dataset);
    if (selectedCategory !== '') params.append('category', selectedCategory);
    params.append('countries', selectedCountries.join(','));
    params.append('diseases', selectedDiseases.join(','));
    router.push(`/search?${params.toString()}`);
  };

  const handleCountryToggle = (country: string) => {
    const nextCountries = selectedCountries.includes(country)
      ? selectedCountries.filter(c => c !== country)
      : [...selectedCountries, country];
    
    setSelectedCountries(nextCountries);
    
    const params = new URLSearchParams(window.location.search);
    params.set('countries', nextCountries.join(','));
    router.push(`/search?${params.toString()}`);
  };

  const handleSelectAllCountries = () => {
    setSelectedCountries(ALL_COUNTRIES);
    const params = new URLSearchParams(window.location.search);
    params.set('countries', ALL_COUNTRIES.join(','));
    router.push(`/search?${params.toString()}`);
  };

  const handleClearAllCountries = () => {
    setSelectedCountries([]);
    const params = new URLSearchParams(window.location.search);
    params.set('countries', '');
    router.push(`/search?${params.toString()}`);
  };

  const handleDiseaseToggle = (disease: string) => {
    const nextDiseases = selectedDiseases.includes(disease)
      ? selectedDiseases.filter(d => d !== disease)
      : [...selectedDiseases, disease];
    
    setSelectedDiseases(nextDiseases);
    
    const params = new URLSearchParams(window.location.search);
    params.set('diseases', nextDiseases.join(','));
    router.push(`/search?${params.toString()}`);
  };

  const handleSelectAllDiseases = () => {
    setSelectedDiseases(ALL_DISEASES);
    const params = new URLSearchParams(window.location.search);
    params.set('diseases', ALL_DISEASES.join(','));
    router.push(`/search?${params.toString()}`);
  };

  const handleClearAllDiseases = () => {
    setSelectedDiseases([]);
    const params = new URLSearchParams(window.location.search);
    params.set('diseases', '');
    router.push(`/search?${params.toString()}`);
  };

  // Open details drawer
  const handleRowClick = (med: any) => {
    setSelectedDrug(med);
    setDrawerOpen(true);
  };

  // Checkbox column changes handler
  const handleColumnToggle = (columnKey: string) => {
    setVisibleColumns((prev: any) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  // Filter application helper
  const filteredMedicines = medicines.filter((med) => {
    const additional = med.additionalData || {};
    
    // 1. Phase or Therapeutic Area Filter
    if (selectedPhases.length > 0) {
      if (datasetParam === 'Pipeline Prospector') {
        const medPhase = med.phase || additional.phase || 'N/A';
        if (!selectedPhases.some(p => medPhase.toLowerCase().includes(p.toLowerCase()))) {
          return false;
        }
      } else {
        const medTA = additional.therapeuticArea || 'N/A';
        if (!selectedPhases.some(t => medTA.toLowerCase().includes(t.toLowerCase()))) {
          return false;
        }
      }
    }

    // 2. Route Filter
    if (selectedRoutes.length > 0) {
      const medRoute = additional.route || 'N/A';
      if (!selectedRoutes.some(r => medRoute.toLowerCase().includes(r.toLowerCase()))) {
        return false;
      }
    }

    // 3. Sponsor Filter
    if (selectedSponsors.length > 0) {
      const medSponsor = additional.sponsor || 'N/A';
      if (!selectedSponsors.some(s => medSponsor.toLowerCase().includes(s.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });

  const handlePhaseChange = (phase: string) => {
    setSelectedPhases(prev =>
      prev.includes(phase) ? prev.filter((p) => p !== phase) : [...prev, phase]
    );
  };

  const handleRouteChange = (route: string) => {
    setSelectedRoutes(prev =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]
    );
  };

  const handleSponsorChange = (sponsor: string) => {
    setSelectedSponsors(prev =>
      prev.includes(sponsor) ? prev.filter((s) => s !== sponsor) : [...prev, sponsor]
    );
  };

  // CSV Downloader pipeline with quota warning
  const handleCSVDownload = async () => {
    if (!user) {
      showToast('Please log in to export database reports', 'warning');
      router.push('/login');
      return;
    }

    if (!user.isSubscribed) {
      showToast('CSV exports require a PRO subscription', 'warning');
      router.push('/subscription');
      return;
    }

    if (user.downloadCount >= 2000) {
      showToast('Export quota exceeded. Limit: 2,000 rows', 'danger');
      return;
    }

    // Warn if they are approaching the 2000 quota
    if (user.downloadCount > 1800) {
      showToast(`Warning: You have consumed ${user.downloadCount} of your 2,000 row quota`, 'warning');
    }

    try {
      const currentCountries = getCountriesFromParams();
      const currentDiseases = getDiseasesFromParams();
      const params = new URLSearchParams({
        query: queryParam,
        field: fieldParam,
        dataset: datasetParam,
        countries: currentCountries.join(','),
        diseases: currentDiseases.join(','),
      });

      const downloadUrl = `${apiBaseUrl}/medicine/download?${params.toString()}`;
      
      showToast('Initiating export compile. Please wait...', 'info');

      // Fetch with token authorization
      const token = localStorage.getItem('accessToken');
      const res = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        //@ts-ignore
        credentials: 'include',
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medtrack_export_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('CSV report downloaded successfully', 'success');
        
        // Refresh session to reflect incremented download count
        const profileRes = await fetch(`${apiBaseUrl}/auth/me`, {
          //@ts-ignore
          credentials: 'include',
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          // Update details manually in user cookie state
          loginUser(user.email, token || '', profileData.user);
        }
      } else {
        const errorData = await res.json();
        showToast(errorData.message || 'Export failed', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error sending download query', 'danger');
    }
  };

  const loginUser = (email: string, accessToken: string, userDetails: any) => {
    // Save token state
    localStorage.setItem('accessToken', accessToken);
    window.location.reload(); // Refresh session variables
  };

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      
      {/* Top Search Edit Panel */}
      <div className="card" style={{ marginBottom: '32px', padding: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flexGrow: 1, minWidth: '200px', position: 'relative' }}>
              <label className="form-label">Active Keyword</label>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  setOriginalQuery(val);
                  setActiveSuggestionIndex(-1);
                  fetchSuggestions(val, selectedCategory);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setShowSuggestions(true);
                  fetchSuggestions(query, selectedCategory);
                }}
                onBlur={() => setTimeout(() => {
                  setShowSuggestions(false);
                  setActiveSuggestionIndex(-1);
                }, 200)}
                placeholder="Search..."
                className="form-input"
                style={{ height: '42px', width: '100%' }}
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
                        className={`autocomplete-item ${activeSuggestionIndex === idx ? 'active' : ''}`}
                        onClick={() => handleToggleSuggestion(suggestion)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          padding: '10px 14px', 
                          cursor: 'pointer',
                          backgroundColor: activeSuggestionIndex === idx ? 'var(--bg-alt)' : 'transparent',
                        }}
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

            {/* Category Pills Row */}
            <div style={{ display: 'none' }}></div> {/* dummy spacer */}
            <div className="form-group" style={{ width: '180px' }}>
              <label className="form-label">Search Criteria</label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="form-input"
                style={{ height: '42px' }}
              >
                <option value="all">Search All</option>
                <option value="drugName">Drug Name</option>
                <option value="indication">Indication</option>
                <option value="moa">Mechanism (MOA)</option>
              </select>
            </div>
            <div className="form-group" style={{ width: '200px' }}>
              <label className="form-label">Source Database</label>
              <select
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                className="form-input"
                style={{ height: '42px' }}
              >
                <option value="Pipeline Prospector">Pipeline Prospector</option>
                <option value="Patent & Sales Forecasting">Patent & Sales Forecasting</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px' }}>
              Update Query
            </button>
          </div>
          
          {/* Category Pills Row */}
          <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '16px', paddingBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-light, #64748b)', display: 'block', marginBottom: '8px' }}>
              Filter suggestions by category:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      const nextCat = isActive ? '' : cat;
                      setSelectedCategory(nextCat);
                      fetchSuggestions(query, nextCat);
                      if (nextCat) {
                        setShowSuggestions(true);
                      }
                      const params = new URLSearchParams(window.location.search);
                      if (isActive) {
                        params.delete('category');
                      } else {
                        params.set('category', cat);
                      }
                      router.push(`/search?${params.toString()}`);
                    }}
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
        </form>
      </div>

      <div className="workspace-layout">
        
        {/* Left Filters Sidebar */}
        <aside className="sidebar-filter">
          <div className="filter-section">
            <h4 className="filter-title">Dataset</h4>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
              🎯 {datasetParam}
            </div>
          </div>

          {datasetParam === 'Pipeline Prospector' ? (
            <div className="filter-section">
              <h4 className="filter-title">Development Phase</h4>
              <div className="filter-options">
                {['Approved', 'Phase III', 'Phase II', 'Phase I'].map((phase) => (
                  <label key={phase} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedPhases.includes(phase)}
                      onChange={() => handlePhaseChange(phase)}
                    />
                    <span>{phase}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="filter-section">
              <h4 className="filter-title">Therapeutic Area</h4>
              <div className="filter-options">
                {['Oncology', 'Immunology', 'Neurology', 'Cardiovascular'].map((ta) => (
                  <label key={ta} className="filter-option">
                    <input
                      type="checkbox"
                      checked={selectedPhases.includes(ta)}
                      onChange={() => handlePhaseChange(ta)}
                    />
                    <span>{ta}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="filter-section">
            <h4 className="filter-title">Administration Route</h4>
            <div className="filter-options">
              {['Intravenous Infusion', 'Subcutaneous Injection', 'Oral Tablet', 'Intravitreal'].map((route) => (
                <label key={route} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedRoutes.includes(route)}
                    onChange={() => handleRouteChange(route)}
                  />
                  <span>{route}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">
              {datasetParam === 'Pipeline Prospector' ? 'Leading Sponsors' : 'Applicants'}
            </h4>
            <div className="filter-options">
              {['Merck & Co.', 'Novo Nordisk', 'AbbVie', 'Eli Lilly', 'Boehringer Ingelheim', 'Eisai & Biogen', 'GSK'].map((sponsor) => (
                <label key={sponsor} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedSponsors.includes(sponsor)}
                    onChange={() => handleSponsorChange(sponsor)}
                  />
                  <span>{sponsor}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setSelectedPhases([]); setSelectedRoutes([]); setSelectedSponsors([]); }}
            className="btn btn-outline btn-sm"
            style={{ width: '100%', marginTop: '10px' }}
          >
            Clear Filters
          </button>
        </aside>

        {/* Main Grid View */}
        <section className="grid-container">
          
          {/* Analysis Dashboard Section */}
          <div className="analysis-section">
            <h3 className="analysis-title">
              📊 Basic Summary - {queryParam || 'All Records'}
            </h3>

            {/* Unified Metrics Card - Always displayed, showing loaders when data is loading */}
            <div className="unified-metrics-card">
              {/* Card 1: Product Trial */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                  🔬
                </div>
                <div className="metric-content">
                  <span className="metric-value">
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      <AnimatedCounter value={analysisData?.metrics?.productTrial ?? 0} />
                    )}
                  </span>
                  <span className="metric-label">Product Trial</span>
                </div>
              </motion.div>

              {/* Card 2: Product Type */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                  📦
                </div>
                <div className="metric-content">
                  <span className="metric-value">
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      <AnimatedCounter value={analysisData?.metrics?.productType ?? 0} />
                    )}
                  </span>
                  <span className="metric-label">Product Type</span>
                </div>
              </motion.div>

              {/* Card 3: Biomarker/MOA */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
                  ⏳
                </div>
                <div className="metric-content">
                  <span className="metric-value">
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      <AnimatedCounter value={analysisData?.metrics?.biomarkerMoa ?? 0} />
                    )}
                  </span>
                  <span className="metric-label">Biomarker/MOA</span>
                </div>
              </motion.div>

              {/* Card 4: Therapeutic Area */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: 'rgb(236, 72, 153)' }}>
                  ❤️
                </div>
                <div className="metric-content">
                  <span className="metric-value">
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      <AnimatedCounter value={analysisData?.metrics?.therapeuticArea ?? 0} />
                    )}
                  </span>
                  <span className="metric-label">Therapeutic Area</span>
                </div>
              </motion.div>

              {/* Card 5: Sponsor */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'rgb(59, 130, 246)' }}>
                  🏢
                </div>
                <div className="metric-content">
                  <span className="metric-value">
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      <AnimatedCounter value={analysisData?.metrics?.sponsor ?? 0} />
                    )}
                  </span>
                  <span className="metric-label">Sponsor</span>
                </div>
              </motion.div>

              {/* Card 6: Pipeline Candidates */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'rgb(139, 92, 246)' }}>
                  📈
                </div>
                <div className="metric-content">
                  <span className="metric-value">
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      <AnimatedCounter value={analysisData?.metrics?.pipelineCandidates ?? 0} />
                    )}
                  </span>
                  <span className="metric-label">Pipeline Candidates</span>
                </div>
              </motion.div>

              {/* Card 7: Marketed Drug */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'rgb(6, 182, 212)' }}>
                  🛍️
                </div>
                <div className="metric-content">
                  <span className="metric-value">
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      <AnimatedCounter value={analysisData?.metrics?.marketedDrug ?? 0} />
                    )}
                  </span>
                  <span className="metric-label">Marketed Drug</span>
                </div>
              </motion.div>

              {/* Card 8: Available For Licensing */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'rgb(168, 85, 247)' }}>
                  📄
                </div>
                <div className="metric-content">
                  <span className="metric-value">
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      <AnimatedCounter value={analysisData?.metrics?.availableForLicensing ?? 0} />
                    )}
                  </span>
                  <span className="metric-label">Available For Licensing</span>
                </div>
              </motion.div>

              {/* Card 9: Biological Class */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'rgb(16, 185, 129)' }}>
                  🧬
                </div>
                <div className="metric-content">
                  <span className="metric-value">
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      <AnimatedCounter value={analysisData?.metrics?.biologicalClass ?? 0} />
                    )}
                  </span>
                  <span className="metric-label">Biological Class</span>
                </div>
              </motion.div>

              {/* Card 10: Patent Expiry */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)' }}>
                  📅
                </div>
                <div className="metric-content">
                  <span className="metric-value">
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      <AnimatedCounter value={analysisData?.metrics?.patentExpiry ?? 0} />
                    )}
                  </span>
                  <span className="metric-label">Patent Expiry</span>
                </div>
              </motion.div>

              {/* Card 11: Sales Data */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'rgb(245, 158, 11)' }}>
                  💰
                </div>
                <div className="metric-content">
                  <span className="metric-value" style={{ fontSize: '15px' }}>
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      "Sales Data"
                    )}
                  </span>
                  {!analysisLoading && (
                    <span className="metric-action" onClick={() => setShowSalesModal(true)}>Click to view</span>
                  )}
                </div>
              </motion.div>

              {/* Card 12: Contact */}
              <motion.div 
                className="metric-slot"
                whileHover={{ backgroundColor: 'rgba(243, 208, 123, 0.08)', scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="metric-icon-box" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: 'rgb(236, 72, 153)' }}>
                  📖
                </div>
                <div className="metric-content">
                  <span className="metric-value" style={{ fontSize: '15px' }}>
                    {analysisLoading ? (
                      <span className="skeleton-pulse"></span>
                    ) : (
                      "Contact"
                    )}
                  </span>
                  {!analysisLoading && (
                    <span className="metric-action" onClick={() => setShowContactModal(true)}>Click to view</span>
                  )}
                </div>
              </motion.div>
            </div>

            {analysisLoading ? (
              <div className="card" style={{ padding: '50px 20px', textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner-loader-dark"></div>
                <div style={{ fontSize: '15px', color: 'var(--text-light)', fontWeight: 600 }}>Loading visual analysis chart metrics...</div>
              </div>
            ) : analysisData ? (
              <>
                <div className="charts-grid">
                  {/* Chart 1: Pipeline Candidates */}
                  <div className="chart-container">
                    <h4 className="chart-header">Pipeline Candidates</h4>
                    {analysisData.charts.pipelineByPhase.length === 0 ? (
                      <div style={{ textAlign: 'center', margin: 'auto', padding: '20px', color: 'var(--text-light)' }}>No Phase Data</div>
                    ) : (
                      <svg viewBox="0 0 400 250" width="100%" height="220">
                        {(() => {
                           const data = analysisData.charts.pipelineByPhase;
                           const maxVal = Math.max(...data.map((d: any) => d.count), 1);
                           return data.map((d: any, idx: number) => {
                             const barWidth = (d.count / maxVal) * 190;
                             const y = idx * 24 + 20;
                             return (
                               <motion.g 
                                 key={idx}
                                 whileHover={{ x: 6 }}
                                 transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                 style={{ cursor: 'pointer' }}
                               >
                                 <text x="10" y={y + 11} fill="var(--text-main)" fontSize="12" fontWeight="700">
                                   {d.phase.length > 15 ? d.phase.substring(0, 12) + '...' : d.phase}
                                 </text>
                                 <motion.rect
                                   x="140"
                                   y={y}
                                   height="14"
                                   rx="4"
                                   fill="#3c7cb5"
                                   style={{ originX: 0 }}
                                   initial={{ width: 0 }}
                                   animate={{ width: barWidth }}
                                   whileHover={{ fill: '#ff7a00', filter: 'brightness(1.15)' }}
                                   transition={{ duration: 0.15 }}
                                 />
                                 <text x={145 + barWidth} y={y + 11} fill="var(--text-main)" fontSize="12" fontWeight="700">
                                   {d.count}
                                 </text>
                               </motion.g>
                             );
                           });
                        })()}
                      </svg>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', textAlign: 'center', marginTop: '10px' }}>
                      * Includes only unique trials. Highest Phase based on Product+Indication.
                    </span>
                  </div>

                  {/* Chart 2: Sponsor Analysis */}
                  <div className="chart-container">
                    <h4 className="chart-header">Sponsor Analysis</h4>
                    {analysisData.charts.topSponsors.length === 0 ? (
                      <div style={{ textAlign: 'center', margin: 'auto', padding: '20px', color: 'var(--text-light)' }}>No Sponsor Data</div>
                    ) : (
                      <svg viewBox="0 0 400 250" width="100%" height="220">
                        {(() => {
                           const data = analysisData.charts.topSponsors;
                           const maxVal = Math.max(...data.map((d: any) => d.count), 1);
                           return data.map((d: any, idx: number) => {
                             const barWidth = (d.count / maxVal) * 190;
                             const y = idx * 24 + 20;
                             return (
                               <motion.g 
                                 key={idx}
                                 whileHover={{ x: 6 }}
                                 transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                 style={{ cursor: 'pointer' }}
                               >
                                 <text x="10" y={y + 11} fill="var(--text-main)" fontSize="12" fontWeight="700">
                                   {d.sponsor.length > 18 ? d.sponsor.substring(0, 15) + '...' : d.sponsor}
                                 </text>
                                 <motion.rect
                                   x="140"
                                   y={y}
                                   height="14"
                                   rx="4"
                                   fill="#3c7cb5"
                                   style={{ originX: 0 }}
                                   initial={{ width: 0 }}
                                   animate={{ width: barWidth }}
                                   whileHover={{ fill: '#ff7a00', filter: 'brightness(1.15)' }}
                                   transition={{ duration: 0.15 }}
                                 />
                                 <text x={145 + barWidth} y={y + 11} fill="var(--text-main)" fontSize="12" fontWeight="700">
                                   {d.count}
                                 </text>
                               </motion.g>
                             );
                           });
                        })()}
                      </svg>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', textAlign: 'center', marginTop: '10px' }}>
                      * Top 8 Sponsor Analysis based on Indication.
                    </span>
                  </div>

                  {/* Chart 3: Prediction Of Launch */}
                  <div className="chart-container">
                    <h4 className="chart-header">Prediction Of Launch</h4>
                    {analysisData.charts.predictionOfLaunch.length === 0 ? (
                      <div style={{ textAlign: 'center', margin: 'auto', padding: '20px', color: 'var(--text-light)' }}>No Launch Projection Data</div>
                    ) : (
                      <svg viewBox="0 0 400 220" width="100%" height="200">
                        {(() => {
                           const data = analysisData.charts.predictionOfLaunch;
                           const maxVal = Math.max(...data.map((d: any) => d.count), 1);
                           const width = 340;
                           const height = 140;
                           const points = data.map((d: any, idx: number) => {
                             const x = (idx / Math.max(data.length - 1, 1)) * width + 40;
                             const y = height - (d.count / maxVal) * (height - 30) + 20;
                             return { x, y, year: d.year, count: d.count };
                           });

                           const pathD = points.map((p: any, idx: number) => 
                             `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                           ).join(' ');

                           const areaD = points.length > 0 
                             ? `${pathD} L ${points[points.length - 1].x} ${height + 20} L ${points[0].x} ${height + 20} Z`
                             : '';

                           return (
                             <g>
                               {/* Grid lines */}
                               <line x1="40" y1={height + 20} x2={width + 40} y2={height + 20} stroke="var(--border-muted)" strokeWidth="1" />
                               <line x1="40" y1="20" x2="40" y2={height + 20} stroke="var(--border-muted)" strokeWidth="1" />
                               
                               <defs>
                                 <clipPath id="prediction-clip">
                                   <motion.rect
                                     x="0"
                                     y="0"
                                     width="400"
                                     height="220"
                                     style={{ originX: 0 }}
                                     initial={{ scaleX: 0 }}
                                     animate={{ scaleX: 1 }}
                                     transition={{ duration: 1.2, ease: 'easeOut' }}
                                   />
                                 </clipPath>
                               </defs>
                               <g clipPath="url(#prediction-clip)">
                                 {/* Filled Area */}
                                 {areaD && <path d={areaD} fill="rgba(243, 112, 33, 0.12)" />}

                                 {/* Trend line */}
                                 {pathD && <path d={pathD} fill="none" stroke="#ff7a00" strokeWidth="2.5" />}

                                 {/* Points & Labels */}
                                 {points.map((p: any, idx: number) => (
                                   <motion.g 
                                     key={idx}
                                     whileHover={{ scale: 1.35 }}
                                     transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                     style={{ transformOrigin: `${p.x}px ${p.y}px`, cursor: 'pointer' }}
                                   >
                                     <circle cx={p.x} cy={p.y} r="4.5" fill="var(--bg-surface)" stroke="#ff7a00" strokeWidth="2.5" />
                                     <text x={p.x} y={height + 34} fill="var(--text-light)" fontSize="11" fontWeight="700" textAnchor="middle">
                                       {p.year}
                                     </text>
                                     <text x={p.x} y={p.y - 8} fill="var(--text-main)" fontSize="11" fontWeight="800" textAnchor="middle">
                                       {p.count}
                                     </text>
                                   </motion.g>
                                 ))}
                               </g>
                             </g>
                           );
                        })()}
                      </svg>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', textAlign: 'center', marginTop: '10px' }}>
                      * Products Over Years based on Product, Indication.
                    </span>
                  </div>

                  {/* Chart 4: Product Level Competition */}
                  <div className="chart-container">
                    <h4 className="chart-header">Product Level Competition</h4>
                    {analysisData.charts.productLevelCompetition.length === 0 ? (
                      <div style={{ textAlign: 'center', margin: 'auto', padding: '20px', color: 'var(--text-light)' }}>No Competition Data</div>
                    ) : (
                      <svg viewBox="0 0 400 250" width="100%" height="220">
                        {(() => {
                           const data = analysisData.charts.productLevelCompetition;
                           const maxVal = Math.max(...data.map((d: any) => d.count), 1);
                           return data.map((d: any, idx: number) => {
                             const barWidth = (d.count / maxVal) * 190;
                             const y = idx * 24 + 20;
                             return (
                               <motion.g 
                                 key={idx}
                                 whileHover={{ x: 6 }}
                                 transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                 style={{ cursor: 'pointer' }}
                               >
                                 <text x="10" y={y + 11} fill="var(--text-main)" fontSize="12" fontWeight="700">
                                   {d.phase.length > 15 ? d.phase.substring(0, 12) + '...' : d.phase}
                                 </text>
                                 <motion.rect
                                   x="140"
                                   y={y}
                                   height="14"
                                   rx="4"
                                   fill="#3c7cb5"
                                   style={{ originX: 0 }}
                                   initial={{ width: 0 }}
                                   animate={{ width: barWidth }}
                                   whileHover={{ fill: '#ff7a00', filter: 'brightness(1.15)' }}
                                   transition={{ duration: 0.15 }}
                                 />
                                 <text x={145 + barWidth} y={y + 11} fill="var(--text-main)" fontSize="12" fontWeight="700">
                                   {d.count}
                                 </text>
                               </motion.g>
                             );
                           });
                        })()}
                      </svg>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', textAlign: 'center', marginTop: '10px' }}>
                      * Total of Products listed by Its Phase Wise.
                    </span>
                  </div>

                  {/* Chart 5: Country Wise Analysis */}
                  <div className="chart-container">
                    <h4 className="chart-header">Country Wise Analysis</h4>
                    {analysisData.charts.countryWiseAnalysis.length === 0 ? (
                      <div style={{ textAlign: 'center', margin: 'auto', padding: '20px', color: 'var(--text-light)' }}>No Country Data</div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', height: '100%' }}>
                        <svg viewBox="0 0 160 160" width="130" height="130">
                          <defs>
                            <clipPath id="pie-clip">
                              <motion.circle
                                cx="80"
                                cy="80"
                                r="55"
                                fill="transparent"
                                stroke="#ffffff"
                                strokeWidth="22"
                                initial={{ strokeDashoffset: 346, strokeDasharray: 346 }}
                                animate={{ strokeDashoffset: 0 }}
                                transition={{ duration: 1.2, ease: 'easeInOut' }}
                                transform="rotate(-90 80 80)"
                              />
                            </clipPath>
                          </defs>
                          <g clipPath="url(#pie-clip)">
                            {(() => {
                               const data = analysisData.charts.countryWiseAnalysis;
                               const total = data.reduce((acc: number, d: any) => acc + d.count, 0) || 1;
                               let accumulatedPercent = 0;
                               const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
                               
                               return data.map((d: any, idx: number) => {
                                 const percent = d.count / total;
                                 const radius = 55;
                                 const circumference = 2 * Math.PI * radius;
                                 const strokeDash = circumference * percent;
                                 const strokeGap = circumference - strokeDash;
                                 const strokeOffset = circumference * (1 - accumulatedPercent);
                                 accumulatedPercent += percent;
                                 const color = COLORS[idx % COLORS.length];

                                 return (
                                   <motion.circle
                                     key={idx}
                                     cx="80"
                                     cy="80"
                                     r={radius}
                                     fill="transparent"
                                     stroke={color}
                                     strokeWidth="20"
                                     strokeDasharray={`${strokeDash} ${strokeGap}`}
                                     strokeDashoffset={strokeOffset}
                                     transform="rotate(-90 80 80)"
                                     whileHover={{ strokeWidth: 26, filter: 'brightness(1.15)' }}
                                     transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                     style={{ cursor: 'pointer', transformOrigin: '80px 80px' }}
                                   />
                                 );
                               });
                            })()}
                          </g>
                          <circle cx="80" cy="80" r="45" fill="var(--bg-surface)" />
                        </svg>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
                          {(() => {
                             const data = analysisData.charts.countryWiseAnalysis;
                             const total = data.reduce((acc: number, d: any) => acc + d.count, 0) || 1;
                             const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
                             return data.map((d: any, idx: number) => {
                               const percent = ((d.count / total) * 100).toFixed(1);
                               return (
                                 <motion.div 
                                   key={idx} 
                                   whileHover={{ x: 4, scale: 1.02 }}
                                   transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                   style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                                 >
                                   <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[idx % COLORS.length], display: 'inline-block' }}></span>
                                   <span style={{ color: 'var(--text-main)', width: '60px' }}>{d.country}</span>
                                   <span style={{ color: 'var(--text-light)' }}>{percent}% ({d.count})</span>
                                 </motion.div>
                               );
                             });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chart 6: Therapeutic Area Breakdown */}
                  <div className="chart-container">
                    <h4 className="chart-header">Therapeutic Area</h4>
                    {analysisData.charts.therapeuticAreaBreakdown.length === 0 ? (
                      <div style={{ textAlign: 'center', margin: 'auto', padding: '20px', color: 'var(--text-light)' }}>No Therapeutic Area Data</div>
                    ) : (
                      <svg viewBox="0 0 400 250" width="100%" height="220">
                        {(() => {
                           const data = analysisData.charts.therapeuticAreaBreakdown.slice(0, 8);
                           const maxVal = Math.max(...data.map((d: any) => d.count), 1);
                           return data.map((d: any, idx: number) => {
                             const barWidth = (d.count / maxVal) * 190;
                             const y = idx * 24 + 20;
                             return (
                               <motion.g 
                                 key={idx}
                                 whileHover={{ x: 6 }}
                                 transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                 style={{ cursor: 'pointer' }}
                               >
                                 <text x="10" y={y + 11} fill="var(--text-main)" fontSize="12" fontWeight="700">
                                   {d.therapeuticArea.length > 15 ? d.therapeuticArea.substring(0, 12) + '...' : d.therapeuticArea}
                                 </text>
                                 <motion.rect
                                   x="140"
                                   y={y}
                                   height="14"
                                   rx="4"
                                   fill="#3c7cb5"
                                   style={{ originX: 0 }}
                                   initial={{ width: 0 }}
                                   animate={{ width: barWidth }}
                                   whileHover={{ fill: '#ff7a00', filter: 'brightness(1.15)' }}
                                   transition={{ duration: 0.15 }}
                                 />
                                 <text x={145 + barWidth} y={y + 11} fill="var(--text-main)" fontSize="12" fontWeight="700">
                                   {d.count}
                                 </text>
                               </motion.g>
                             );
                           });
                        })()}
                      </svg>
                    )}
                  </div>

                </div>
              </>
            ) : (
              <div className="card" style={{ padding: '40px', textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  No analysis statistics available for this query.
                </div>
              </div>
            )}
          </div>

          {/* Modal 1: Sales Forecasting Breakdown */}
          {showSalesModal && analysisData && (
            <div className="modal-overlay" onClick={() => setShowSalesModal(false)}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setShowSalesModal(false)}>&times;</button>
                <h4 className="modal-title">💰 Sales Forecasting Analysis</h4>
                <div style={{ color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '16px' }}>
                    Below is the aggregated sales forecasting data for matching molecular drug brand formulations.
                  </p>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-alt)', borderBottom: '1.5px solid var(--border)' }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '800' }}>Metric</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontWeight: '800' }}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                          <td style={{ padding: '10px', fontWeight: '600' }}>Total Cumulative Sales</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: 'var(--success)' }}>
                            ${analysisData.metrics.totalSalesMillions.toLocaleString()} MN
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
                          <td style={{ padding: '10px', fontWeight: '600' }}>Marketed Molecules Count</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800' }}>
                            {analysisData.metrics.marketedDrug}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '10px', fontWeight: '600' }}>Avg Revenue Per Product</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800' }}>
                            ${analysisData.metrics.marketedDrug > 0 ? (analysisData.metrics.totalSalesMillions / analysisData.metrics.marketedDrug).toFixed(2) : '0.00'} MN
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal 2: Clinical Trial Result Status Breakdown */}
          {showResultModal && analysisData && (
            <div className="modal-overlay" onClick={() => setShowResultModal(false)}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setShowResultModal(false)}>&times;</button>
                <h4 className="modal-title">📋 Clinical Trial Status Breakdown</h4>
                <div style={{ color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '16px' }}>
                    Aggregated distribution of matching clinical trial candidates by their active registry execution status.
                  </p>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-alt)', borderBottom: '1.5px solid var(--border)' }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: '800' }}>Trial Status</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontWeight: '800' }}>Total Candidates</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(analysisData.metrics.trialStatusMap).map(([status, count]: any, idx) => (
                          <tr key={idx} style={{ borderBottom: idx < Object.keys(analysisData.metrics.trialStatusMap).length - 1 ? '1px solid var(--border-muted)' : 'none' }}>
                            <td style={{ padding: '10px', fontWeight: '600' }}>{status}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', color: 'var(--primary)' }}>
                              {count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal 3: Contacts List */}
          {showContactModal && analysisData && (
            <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
              <div className="modal-box" style={{ maxWidth: '650px', width: '95%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setShowContactModal(false)}>&times;</button>
                <h4 className="modal-title">📖 Clinical Investigators &amp; Contacts</h4>
                <div style={{ color: 'var(--text-main)', fontSize: '14px', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '16px' }}>
                    Below is the list of primary clinical trial investigators, study directors, and contact personnel found for the matching active pipeline studies.
                  </p>
                  
                  {!analysisData.metrics.contacts || analysisData.metrics.contacts.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)', border: '1px dashed var(--border-muted)', borderRadius: '12px' }}>
                      No contact details available for this search query.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {analysisData.metrics.contacts.map((contact: any, index: number) => (
                        <div 
                          key={index} 
                          style={{ 
                            border: '1.5px solid var(--border)', 
                            borderRadius: '12px', 
                            padding: '14px', 
                            backgroundColor: 'var(--bg-surface)',
                            boxShadow: '2px 2px 0px 0px var(--border)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                            <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>{contact.name}</strong>
                            <span 
                              style={{ 
                                fontSize: '10px', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                backgroundColor: 'var(--accent-light)', 
                                color: 'var(--warning)', 
                                border: '1px solid var(--accent)',
                                fontWeight: 700
                              }}
                            >
                              {contact.role}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', fontStyle: 'italic' }}>
                            Study: {contact.trial}
                          </div>
                          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', flexWrap: 'wrap' }}>
                            {contact.email && contact.email !== 'N/A' && (
                              <span>✉️ <a href={`mailto:${contact.email}`} style={{ textDecoration: 'underline', color: '#ff7a00', fontWeight: 600 }}>{contact.email}</a></span>
                            )}
                            {contact.phone && contact.phone !== 'N/A' && (
                              <span>📞 <span style={{ fontWeight: 600 }}>{contact.phone}</span></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CSS Styles injection */}
          <style>{`
            .analysis-section {
              margin-bottom: 40px;
              background: transparent;
            }
            .analysis-title {
              font-size: 22px;
              font-weight: 800;
              margin-bottom: 20px;
              color: var(--text-main);
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .unified-metrics-card {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              background-color: var(--bg-surface);
              border: 1.5px solid var(--border);
              border-radius: var(--radius-sm, 16px);
              box-shadow: var(--shadow-md, 3px 3px 0px 0px var(--border));
              margin-bottom: 32px;
              overflow: hidden;
            }
            @media (max-width: 1024px) {
              .unified-metrics-card {
                grid-template-columns: repeat(3, 1fr);
              }
            }
            @media (max-width: 768px) {
              .unified-metrics-card {
                grid-template-columns: repeat(2, 1fr);
              }
            }
            @media (max-width: 480px) {
              .unified-metrics-card {
                grid-template-columns: 1fr;
              }
            }
            .metric-slot {
              display: flex;
              align-items: center;
              gap: 16px;
              padding: 20px;
              border-right: 1px dashed var(--border-muted, #e2e2de);
              border-bottom: 1px dashed var(--border-muted, #e2e2de);
              transition: background-color 0.2s;
            }
            .metric-slot:hover {
              background-color: rgba(243, 208, 123, 0.05);
            }
            .skeleton-pulse {
              display: inline-block;
              height: 22px;
              width: 50px;
              background-color: var(--bg-alt, #e9e9e7);
              animation: pulse 1.5s ease-in-out infinite;
              border-radius: 4px;
            }
            @keyframes pulse {
              0% {
                opacity: 0.6;
              }
              50% {
                opacity: 1;
              }
              100% {
                opacity: 0.6;
              }
            }
            .metric-icon-box {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 44px;
              height: 44px;
              border-radius: 12px;
              font-size: 18px;
              flex-shrink: 0;
              border: 1.5px solid var(--border);
            }
            .metric-content {
              display: flex;
              flex-direction: column;
            }
            .metric-value {
              font-size: 18px;
              font-weight: 800;
              color: var(--text-main);
              line-height: 1.2;
            }
            .metric-label {
              font-size: 11px;
              font-weight: 600;
              color: var(--text-light);
              margin-top: 2px;
            }
            .metric-action {
              font-size: 11px;
              font-weight: 700;
              color: #ff7a00;
              cursor: pointer;
              text-decoration: underline;
              margin-top: 2px;
            }
            .charts-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
            }
            @media (max-width: 992px) {
              .charts-grid {
                grid-template-columns: 1fr;
              }
            }
             .chart-container {
              background-color: var(--bg-surface);
              border: 1.5px solid var(--border);
              border-radius: 20px;
              padding: 20px;
              box-shadow: 4px 4px 0px 0px var(--border);
              display: flex;
              flex-direction: column;
              transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
            }
            .chart-container:hover {
              transform: translateY(-5px) scale(1.015);
              box-shadow: 8px 8px 0px 0px var(--border);
            }
            .chart-header {
              font-size: 15px;
              font-weight: 800;
              margin-bottom: 16px;
              text-align: center;
              border-bottom: 1.5px solid var(--border);
              padding-bottom: 8px;
              color: var(--text-main);
            }
            .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(0, 0, 0, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
              backdrop-filter: blur(4px);
            }
            .modal-box {
              background-color: var(--bg-surface);
              border: 2px solid var(--border);
              border-radius: 20px;
              width: 90%;
              max-width: 500px;
              padding: 24px;
              box-shadow: 6px 6px 0px 0px var(--border);
              position: relative;
            }
            .modal-title {
              font-size: 18px;
              font-weight: 800;
              margin-bottom: 16px;
              border-bottom: 1.5px solid var(--border);
              padding-bottom: 8px;
            }
            .modal-close {
              position: absolute;
              top: 16px;
              right: 16px;
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              font-weight: 800;
            }
          `}</style>

          <div className="grid-header-actions">
            <div className="grid-results-count">
              Found <strong>{filteredMedicines.length}</strong> matching records in <strong>{datasetParam}</strong>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Column manager (Only works if user is Pro) */}
              <div className="column-manager-wrapper">
                <button
                  type="button"
                  onClick={() => {
                    if (!meta.isSubscribed) {
                      showToast('Unlock all 45 columns with Pro Subscription', 'warning');
                      router.push('/subscription');
                      return;
                    }
                    setShowColumnManager(!showColumnManager);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  ⚙️ Manage Columns (45)
                </button>

                {showColumnManager && meta.isSubscribed && (
                  <div className="column-manager-dropdown">
                    <h5 className="column-manager-title">Toggle Active Columns</h5>
                    <div className="column-checkbox-list">
                      <label className="filter-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.sponsor}
                          onChange={() => handleColumnToggle('sponsor')}
                        />
                        <span>Sponsor Organization</span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.route}
                          onChange={() => handleColumnToggle('route')}
                        />
                        <span>Administration Route</span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.target}
                          onChange={() => handleColumnToggle('target')}
                        />
                        <span>Biological Target</span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.trialId}
                          onChange={() => handleColumnToggle('trialId')}
                        />
                        <span>Clinical Trial ID</span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.moleculeType}
                          onChange={() => handleColumnToggle('moleculeType')}
                        />
                        <span>Molecule Structure</span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.patentExpiry}
                          onChange={() => handleColumnToggle('patentExpiry')}
                        />
                        <span>Patent Expiry</span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.molecularWeight}
                          onChange={() => handleColumnToggle('molecularWeight')}
                        />
                        <span>Molecular Weight</span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.brandName}
                          onChange={() => handleColumnToggle('brandName')}
                        />
                        <span>Brand Name</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Download CSV */}
              <button onClick={handleCSVDownload} className="btn btn-secondary btn-sm">
                📥 Export CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="card" style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner-loader-dark"></div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Loading database rows...
              </div>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="card" style={{ padding: '60px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                No molecular data matching search parameters.
              </div>
              <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                Try adjusting active keywords or select a different database.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Indication</th>
                    <th>Mechanism of Action (MOA)</th>
                    <th>Phase</th>
                    
                    {/* Pro columns toggled dynamically */}
                    {meta.isSubscribed && visibleColumns.brandName && <th>Brand Name</th>}
                    {meta.isSubscribed && visibleColumns.sponsor && <th>Sponsor</th>}
                    {meta.isSubscribed && visibleColumns.route && <th>Route</th>}
                    {meta.isSubscribed && visibleColumns.target && <th>Target</th>}
                    {meta.isSubscribed && visibleColumns.trialId && <th>Trial ID</th>}
                    {meta.isSubscribed && visibleColumns.moleculeType && <th>Molecule Type</th>}
                    {meta.isSubscribed && visibleColumns.patentExpiry && <th>Patent Expiry</th>}
                    {meta.isSubscribed && visibleColumns.molecularWeight && <th>Mol. Weight</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((med, idx) => {
                    const additional = med.additionalData || {};
                    return (
                      <motion.tr 
                        key={med.id} 
                        onClick={() => handleRowClick(med)} 
                        className="clickable-row"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                      >
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {med.drugName}
                          <span 
                            style={{ 
                              marginLeft: '8px', 
                              fontSize: '10px', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              backgroundColor: 'rgba(59, 130, 246, 0.08)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              display: 'inline-block',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}
                          >
                            {med.country || additional.country || 'US'}
                          </span>
                        </td>
                        <td>{med.indication}</td>
                        <td>
                          <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>
                            {med.moa}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            (med.phase || '').includes('Approved') ? 'badge-success' : 'badge-warning'
                          }`}>
                            {med.phase}
                          </span>
                        </td>

                        {/* Pro dynamic values */}
                        {meta.isSubscribed && visibleColumns.brandName && <td>{additional.brandName || 'N/A'}</td>}
                        {meta.isSubscribed && visibleColumns.sponsor && <td>{additional.sponsor || 'N/A'}</td>}
                        {meta.isSubscribed && visibleColumns.route && <td>{additional.route || 'N/A'}</td>}
                        {meta.isSubscribed && visibleColumns.target && <td>{additional.target || 'N/A'}</td>}
                        {meta.isSubscribed && visibleColumns.trialId && <td>{additional.trialId || 'N/A'}</td>}
                        {meta.isSubscribed && visibleColumns.moleculeType && <td>{additional.moleculeType || 'N/A'}</td>}
                        {meta.isSubscribed && visibleColumns.patentExpiry && <td>{additional.patentExpiry || 'N/A'}</td>}
                        {meta.isSubscribed && visibleColumns.molecularWeight && <td>{additional.molecularWeight || 'N/A'}</td>}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Guest Paywall banner warning */}
          {!meta.isSubscribed && (
            <div className="paywall-banner">
              <div style={{ fontSize: '24px' }}>🔒</div>
              <h4 className="paywall-title">
                Showing 4 Standard Columns. Subscribe to unlock remaining 41 columns.
              </h4>
              <p className="paywall-description">
                Unlock clinical trial identifiers, molecular structure specs, chemical weights, sponsor timeline charts, safety margins, patent limits, and enable batch Excel/CSV exports up to 2,000 rows.
              </p>
              <button onClick={() => router.push('/subscription')} className="btn btn-primary btn-sm">
                Upgrade to Pro Plan ($1499)
              </button>
            </div>
          )}

          {/* Simple Pagination bar */}
          {meta.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => fetchSearchResults(page - 1)}
                className="pagination-btn"
              >
                &larr;
              </button>
              <span className="pagination-info">
                Page <strong>{page}</strong> of <strong>{meta.totalPages}</strong>
              </span>
              <button
                disabled={page === meta.totalPages}
                onClick={() => fetchSearchResults(page + 1)}
                className="pagination-btn"
              >
                &rarr;
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Right Details Drawer Layout wrapped with AnimatePresence */}
      <AnimatePresence>
        {drawerOpen && selectedDrug && (
          <>
            <motion.div 
              className="drawer-overlay open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div 
              className="detail-drawer open"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              
              <div className="drawer-header">
                <div>
                  <span className="badge badge-info" style={{ marginBottom: '8px' }}>
                    {selectedDrug.additionalData?.dataset || 'FDA Register'}
                  </span>
                  <h3 style={{ fontSize: '24px', color: 'var(--primary)' }}>
                    {selectedDrug.drugName}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    🧬 {selectedDrug.moa}
                  </p>
                </div>
                <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
                  &times;
                </button>
              </div>

              {/* Check subscription details masking */}
              {selectedDrug.additionalData?.locked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', marginTop: '40px' }}>
                  <span style={{ fontSize: '40px' }}>🔒</span>
                  <h4 style={{ fontSize: '18px', fontWeight: 700 }}>
                    Detailed Molecule Specifications Locked
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Pro accounts get immediate access to timelines, full roadmap phases, CAS indices, molecular formulas, excretion path specs, and side effect studies.
                  </p>
                  <button
                    onClick={() => { setDrawerOpen(false); router.push('/subscription'); }}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '10px' }}
                  >
                    Subscribe to Upgrade
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  <div className="drawer-section">
                    <h4 className="drawer-section-title">Therapeutic Profile</h4>
                    <div className="meta-grid">
                      <div className="meta-item">
                        <span className="meta-label">Primary Indication</span>
                        <span className="meta-value">{selectedDrug.indication}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Phase Level</span>
                        <span className="meta-value">{selectedDrug.phase}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Sponsor</span>
                        <span className="meta-value">{selectedDrug.additionalData?.sponsor || 'N/A'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Brand Name</span>
                        <span className="meta-value">{selectedDrug.additionalData?.brandName || 'N/A'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Target Market</span>
                        <span className="meta-value" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          🌎 {selectedDrug.country || selectedDrug.additionalData?.country || 'US'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="drawer-section">
                    <h4 className="drawer-section-title">Trial Timelines &amp; Roadmap</h4>
                    <div className="meta-grid">
                      <div className="meta-item">
                        <span className="meta-label">Trial Status</span>
                        <span className="meta-value">
                          <span className="badge badge-success" style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {selectedDrug.additionalData?.status || 'Active'}
                          </span>
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Target Completion</span>
                        <span className="meta-value">{selectedDrug.additionalData?.completionDate || '2025-12-15'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Trial ID Reference</span>
                        <span className="meta-value" style={{ fontFamily: 'monospace', color: 'var(--secondary)' }}>
                          {selectedDrug.additionalData?.trialId || 'NCT03982845'}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Enrollment Target</span>
                        <span className="meta-value">{selectedDrug.additionalData?.estimatedEnrollment || '450'} patients</span>
                      </div>
                    </div>
                  </div>

                  <div className="drawer-section">
                    <h4 className="drawer-section-title">Chemical &amp; Biological Specs</h4>
                    <div className="meta-grid">
                      <div className="meta-item">
                        <span className="meta-label">Biological Target</span>
                        <span className="meta-value">{selectedDrug.additionalData?.target || 'N/A'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Structure / Type</span>
                        <span className="meta-value">{selectedDrug.additionalData?.moleculeType || 'Monoclonal Antibody'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Patent Expiry</span>
                        <span className="meta-value">{selectedDrug.additionalData?.patentExpiry || 'N/A'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Molecular Weight</span>
                        <span className="meta-value">{selectedDrug.additionalData?.molecularWeight || 'N/A'}</span>
                      </div>
                      <div className="meta-item" style={{ gridColumn: 'span 2' }}>
                        <span className="meta-label">Chemical Formula</span>
                        <span className="meta-value" style={{ fontFamily: 'monospace' }}>
                          {selectedDrug.additionalData?.chemicalFormula || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="drawer-section">
                    <h4 className="drawer-section-title">Safety &amp; Compliance</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <span className="meta-label">Known Side Effects</span>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {selectedDrug.additionalData?.sideEffects || 'Fatigue, headaches, rash, mild nausea'}
                        </p>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span className="meta-label">Contraindications</span>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {selectedDrug.additionalData?.contraindications || 'Hypersensitivity to the active substance.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quota details warning if Pro */}
                  {user && (
                    <div className="alert alert-success" style={{ fontSize: '12px', padding: '10px' }}>
                      📊 <strong>Quota Monitor:</strong> You have exported <strong>{user.downloadCount}</strong> rows of your <strong>2,000</strong> row current monthly limit.
                    </div>
                  )}

                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Preparing Clinical Console...
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
