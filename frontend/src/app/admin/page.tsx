'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, apiBaseUrl, showToast, loading } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'clear' | 'upsert'>('append');
  const [uploading, setUploading] = useState(false);
  
  // Catalog listing
  const [medicines, setMedicines] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalMedicines: 0, totalUsers: 0, totalDemos: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Load stats and records on mount
  useEffect(() => {
    fetchStats();
    fetchMedicines();
  }, [apiBaseUrl]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/admin/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.log('Error loading stats:', err);
    }
  };

  const fetchMedicines = async () => {
    try {
      // Fetch up to 100 records for simple admin grid listing
      const res = await fetch(`${apiBaseUrl}/medicine/search?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines);
      }
    } catch (err) {
      console.log('Error loading medicines list:', err);
    }
  };

  // Guard: Redirect non-admins
  useEffect(() => {
    if (!loading && (!user || user.email !== 'admin@medtrack.com')) {
      showToast('Unauthorized access. Redirecting...', 'danger');
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a spreadsheet file first', 'warning');
      return;
    }

    try {
      setUploading(true);
      showToast('Processing spreadsheet rows...', 'info');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', importMode);

      const res = await fetch(`${apiBaseUrl}/admin/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Import completed successfully!', 'success');
        setFile(null);
        const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchStats(); 
        fetchMedicines();
      } else {
        showToast(data.message || 'File upload parsing failed', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error uploading spreadsheet to backend', 'danger');
    } finally {
      setUploading(false);
    }
  };

  // Delete specific drug record by ID (Selective Deletion)
  const handleDeleteMedicine = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the molecule "${name}" from the database?`)) {
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/admin/medicine/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast(`Record for "${name}" has been deleted.`, 'success');
        fetchStats();
        fetchMedicines();
      } else {
        showToast('Error deleting medicine record', 'danger');
      }
    } catch (err) {
      showToast('Connection to server failed', 'danger');
    }
  };

  // Clear Entire Database catalog
  const handleClearAll = async () => {
    if (!confirm('🚨 WARNING: This will completely WIPE the entire medicine table in the database. This action is irreversible. Are you absolutely sure?')) {
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/admin/clear`, {
        method: 'POST',
      });

      if (res.ok) {
        showToast('Database catalog wiped successfully!', 'success');
        fetchStats();
        fetchMedicines();
      } else {
        showToast('Error purging database table', 'danger');
      }
    } catch (err) {
      showToast('Connection to server failed', 'danger');
    }
  };

  // Filter list by searchQuery
  const filteredMedicines = medicines.filter(med => 
    med.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.indication.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.moa.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !user || user.email !== 'admin@medtrack.com') {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Validating Administrator Session...
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <span className="hero-subtitle">Administrative Tools</span>
        <h1 style={{ fontSize: '38px', marginTop: '10px' }}>MedTrackInsight Admin Portal</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Import spreadsheet files, choose data merge rules, and selectively delete clinical trial entries.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalMedicines}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Medicines in DB</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalUsers}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Registered Users</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalDemos}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Demo Requests</div>
        </div>
      </div>

      {/* Layout grid splits: Left (Upload form), Right (Delete controls & Stats) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '32px' }}>
        
        {/* Left Side: Upload console */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Spreadsheet Data Import</h3>
          
          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group">
              <label htmlFor="excel-file-input" className="form-label">Excel or CSV File</label>
              <input
                id="excel-file-input"
                type="file"
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="form-input"
                style={{ paddingTop: '10px' }}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="import-mode-select" className="form-label">Data Import Mode</label>
              <select
                id="import-mode-select"
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as any)}
                className="form-input"
              >
                <option value="append">Append (Insert all rows as new records)</option>
                <option value="clear">Overwrite (Wipe database and replace catalog)</option>
                <option value="upsert">Upsert (Update matching drug names, insert new)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="btn btn-primary"
              style={{ height: '46px', width: '100%' }}
            >
              {uploading ? 'Processing Import...' : 'Import Spreadsheet'}
            </button>
          </form>
        </div>

        {/* Right Side: Selective Catalog deletion & Wipe */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px' }}>Manage Catalog Records</h3>
            
            {/* Purge Catalog */}
            <button
              onClick={handleClearAll}
              className="btn btn-outline btn-sm"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              ⚠️ Purge Entire Catalog
            </button>
          </div>

          {/* Quick Filter */}
          <div className="form-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records list..."
              className="form-input"
              style={{ height: '38px' }}
            />
          </div>

          {/* Records table listing */}
          <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Drug Name</th>
                  <th>Indication</th>
                  <th>MOA</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((med) => (
                  <tr key={med.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{med.drugName}</td>
                    <td>{med.indication}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                        {med.moa}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteMedicine(med.id, med.drugName)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', color: 'var(--danger)', borderColor: 'var(--border)' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMedicines.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
                      No records matched or database is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
