'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { apiBaseUrl, user, showToast } = useApp();

  // Search parameters from URL
  const queryParam = searchParams.get('query') || '';
  const fieldParam = searchParams.get('field') || 'all';
  const datasetParam = searchParams.get('dataset') || 'Approved Drugs';

  // Search inputs
  const [query, setQuery] = useState(queryParam);
  const [field, setField] = useState(fieldParam);
  const [dataset, setDataset] = useState(datasetParam);

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

  // Track page parameters when URL changes
  useEffect(() => {
    setQuery(queryParam);
    setField(fieldParam);
    setDataset(datasetParam);
    fetchSearchResults(1);
  }, [queryParam, fieldParam, datasetParam]);

  // Fetch search results from backend
  const fetchSearchResults = async (pageNum: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        query: queryParam,
        field: fieldParam,
        dataset: datasetParam,
        page: pageNum.toString(),
        limit: '15',
      });

      const res = await fetch(`${apiBaseUrl}/medicine/search?${params.toString()}`, {
        //@ts-ignore
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines);
        setMeta(data.meta);
        setPage(pageNum);
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
    const params = new URLSearchParams();
    if (query.trim() !== '') params.append('query', query.trim());
    if (field !== 'all') params.append('field', field);
    if (dataset !== '') params.append('dataset', dataset);
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
    
    // 1. Phase Filter
    if (selectedPhases.length > 0) {
      const medPhase = med.phase || additional.phase || 'N/A';
      if (!selectedPhases.some(p => medPhase.toLowerCase().includes(p.toLowerCase()))) {
        return false;
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
      const params = new URLSearchParams({
        query: queryParam,
        field: fieldParam,
        dataset: datasetParam,
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
      <div className="card" style={{ marginBottom: '32px', padding: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '200px' }}>
            <label className="form-label">Active Keyword</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="form-input"
              style={{ height: '42px' }}
            />
          </div>
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
              <option value="Approved Drugs">Approved Drugs (FDA)</option>
              <option value="Clinical Pipeline">Clinical Pipeline</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 24px' }}>
            Update Query
          </button>
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
            <h4 className="filter-title">Leading Sponsors</h4>
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
            <div className="card" style={{ padding: '60px 0', textAlign: 'center' }}>
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
                  {filteredMedicines.map((med) => {
                    const additional = med.additionalData || {};
                    return (
                      <tr key={med.id} onClick={() => handleRowClick(med)} className="clickable-row">
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{med.drugName}</td>
                        <td>{med.indication}</td>
                        <td>
                          <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>
                            {med.moa}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            med.phase.includes('Approved') ? 'badge-success' : 'badge-warning'
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
                      </tr>
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

      {/* Right Details Drawer Layout */}
      {selectedDrug && (
        <>
          <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)}></div>
          <div className={`detail-drawer ${drawerOpen ? 'open' : ''}`}>
            
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

          </div>
        </>
      )}

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
