'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../context/AppContext';

type TabType = 
  | 'personal-info'
  | 'subscription'
  | 'stats'
  | 'saved-items'
  | 'activity'
  | 'downloads'
  | 'notifications'
  | 'security'
  | 'preferences'
  | 'support';

function ProfileDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, apiBaseUrl, showToast, checkSession, logoutUser } = useApp();

  const tabParam = searchParams.get('tab') as TabType;
  const initialTab = tabParam || 'personal-info';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Form states for Personal Info
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [country, setCountry] = useState(user?.country || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Form states for Preferences & Notifications
  const [prefNewTrials, setPrefNewTrials] = useState(user?.prefNewTrials ?? true);
  const [prefAlerts, setPrefAlerts] = useState(user?.prefAlerts ?? true);
  const [prefDeals, setPrefDeals] = useState(user?.prefDeals ?? true);
  const [prefNewsletter, setPrefNewsletter] = useState(user?.prefNewsletter ?? true);
  const [prefMarketing, setPrefMarketing] = useState(user?.prefMarketing ?? false);
  const [prefTheme, setPrefTheme] = useState(user?.prefTheme ?? 'dark');
  const [prefDefaultCountry, setPrefDefaultCountry] = useState(user?.prefDefaultCountry ?? 'India');
  const [prefDefaultTherapeuticArea, setPrefDefaultTherapeuticArea] = useState(user?.prefDefaultTherapeuticArea ?? 'Oncology');
  const [updatingPrefs, setUpdatingPrefs] = useState(false);

  // Sub-tabs for Saved Items
  const [savedItemsTab, setSavedItemsTab] = useState<'drugs' | 'trials' | 'companies' | 'deals'>('drugs');

  // Synchronize component state with loaded user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCompany(user.company || '');
      setDesignation(user.designation || '');
      setCountry(user.country || '');
      setDepartment(user.department || '');
      setPrefNewTrials(user.prefNewTrials ?? true);
      setPrefAlerts(user.prefAlerts ?? true);
      setPrefDeals(user.prefDeals ?? true);
      setPrefNewsletter(user.prefNewsletter ?? true);
      setPrefMarketing(user.prefMarketing ?? false);
      setPrefTheme(user.prefTheme ?? 'dark');
      setPrefDefaultCountry(user.prefDefaultCountry ?? 'India');
      setPrefDefaultTherapeuticArea(user.prefDefaultTherapeuticArea ?? 'Oncology');
    }
  }, [user]);

  // Handle tab updates in URL
  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    router.replace(`/profile?tab=${tab}`);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      showToast('You must be logged in to view your profile dashboard.', 'warning');
      router.push('/login');
    }
  }, [user, router]);

  // Sync tab state with search parameter changes
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${apiBaseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, company, designation, country, department }),
        //@ts-ignore
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Profile information updated successfully!', 'success');
        await checkSession();
      } else {
        showToast(data.message || 'Error updating profile', 'danger');
      }
    } catch (err) {
      showToast('Server connection failed', 'danger');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePrefs = async () => {
    try {
      setUpdatingPrefs(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${apiBaseUrl}/auth/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prefNewTrials,
          prefAlerts,
          prefDeals,
          prefNewsletter,
          prefMarketing,
          prefTheme,
          prefDefaultCountry,
          prefDefaultTherapeuticArea
        }),
        //@ts-ignore
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Preferences and notifications updated successfully!', 'success');
        await checkSession();
      } else {
        showToast(data.message || 'Error updating preferences', 'danger');
      }
    } catch (err) {
      showToast('Server connection failed', 'danger');
    } finally {
      setUpdatingPrefs(false);
    }
  };

  const getAvatarInitials = () => {
    if (user?.name) {
      return user.name.slice(0, 2).toUpperCase();
    }
    return user?.email ? user.email.slice(0, 2).toUpperCase() : 'US';
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Verifying account parameters...
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      
      {/* Profile Header Summary */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', padding: '24px 32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '22px',
            color: '#ffffff',
            border: '2px solid var(--border)'
          }}>
            {getAvatarInitials()}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 800 }}>{user.name || 'User Profile'}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0' }}>{user.email}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span className={`badge ${user.isSubscribed ? 'badge-success' : 'badge-info'}`}>
                {user.isSubscribed ? '★ Pro Research Plan' : 'Free Sandbox Plan'}
              </span>
              {user.isAdmin && (
                <span className="badge badge-warning">System Administrator</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => changeTab('personal-info')} className="btn btn-outline btn-sm">
          Edit Profile
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Tab menu */}
        <div className="card" style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button 
            onClick={() => changeTab('personal-info')}
            className={`auth-tab ${activeTab === 'personal-info' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', borderRadius: '6px', fontSize: '13px' }}
          >
            👤 Personal Info
          </button>
          <button 
            onClick={() => changeTab('subscription')}
            className={`auth-tab ${activeTab === 'subscription' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', borderRadius: '6px', fontSize: '13px' }}
          >
            💳 Subscription
          </button>
          <button 
            onClick={() => changeTab('stats')}
            className={`auth-tab ${activeTab === 'stats' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', borderRadius: '6px', fontSize: '13px' }}
          >
            📊 Usage Statistics
          </button>
          <button 
            onClick={() => changeTab('saved-items')}
            className={`auth-tab ${activeTab === 'saved-items' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', borderRadius: '6px', fontSize: '13px' }}
          >
            ⭐ Saved Items
          </button>
          <button 
            onClick={() => changeTab('activity')}
            className={`auth-tab ${activeTab === 'activity' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', borderRadius: '6px', fontSize: '13px' }}
          >
            🔄 Recent Activity
          </button>
          <button 
            onClick={() => changeTab('downloads')}
            className={`auth-tab ${activeTab === 'downloads' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', borderRadius: '6px', fontSize: '13px' }}
          >
            📥 Downloads
          </button>
          <button 
            onClick={() => changeTab('notifications')}
            className={`auth-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', borderRadius: '6px', fontSize: '13px' }}
          >
            🔔 Notifications
          </button>
          <button 
            onClick={() => changeTab('security')}
            className={`auth-tab ${activeTab === 'security' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', borderRadius: '6px', fontSize: '13px' }}
          >
            🛡️ Security
          </button>
          <button 
            onClick={() => changeTab('preferences')}
            className={`auth-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', borderRadius: '6px', fontSize: '13px' }}
          >
            ⚙️ Preferences
          </button>
          <button 
            onClick={() => changeTab('support')}
            className={`auth-tab ${activeTab === 'support' ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', borderRadius: '6px', fontSize: '13px' }}
          >
            ❓ Support
          </button>
        </div>

        {/* Right Active Content card */}
        <div className="card" style={{ padding: '32px' }}>
          
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal-info' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Personal Information</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                Manage your credentials and institutional attributes.
              </p>
              
              <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label htmlFor="p-name" className="form-label">Full Name</label>
                  <input id="p-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="e.g. Vivek Singh" />
                </div>
                <div className="form-group">
                  <label htmlFor="p-email" className="form-label">Email Address (Read-only)</label>
                  <input id="p-email" type="email" value={user.email} className="form-input" disabled style={{ opacity: 0.6 }} />
                </div>
                <div className="form-group">
                  <label htmlFor="p-phone" className="form-label">Phone Number</label>
                  <input id="p-phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" placeholder="e.g. +91 98765 43210" />
                </div>
                <div className="form-group">
                  <label htmlFor="p-company" className="form-label">Company/Institution</label>
                  <input id="p-company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="form-input" placeholder="e.g. MedTrack Intelligence Corp" />
                </div>
                <div className="form-group">
                  <label htmlFor="p-designation" className="form-label">Designation</label>
                  <input id="p-designation" type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="form-input" placeholder="e.g. Lead Researcher" />
                </div>
                <div className="form-group">
                  <label htmlFor="p-country" className="form-label">Country</label>
                  <input id="p-country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="form-input" placeholder="e.g. India" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="p-dept" className="form-label">Department / Therapeutic Focus</label>
                  <input id="p-dept" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="form-input" placeholder="e.g. Oncology R&D Pipelines" />
                </div>
                <button type="submit" disabled={updatingProfile} className="btn btn-primary" style={{ width: 'fit-content', padding: '12px 28px', gridColumn: 'span 2' }}>
                  {updatingProfile ? 'Saving Changes...' : 'Save Personal Details'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Billing & Subscription</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                Review and update your current computational subscription tiers.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                {user.isSubscribed ? (
                  /* Pro Plan Details */
                  <div className="card" style={{ border: '2px solid var(--primary)', padding: '24px', backgroundColor: 'var(--bg-alt)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <strong style={{ fontSize: '18px', color: 'var(--primary)' }}>⭐ Pro Research Plan</strong>
                      <span className="badge badge-success">Active</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '13px' }}>
                      <div>✓ Unlimited Clinical Trial Search</div>
                      <div>✓ Drug Pipeline Access (All 45 Columns)</div>
                      <div>✓ Licensing & Corporate Deal Tracking</div>
                      <div>✓ Local Spreadsheet Exports (2,000 rows/mo)</div>
                      <div>✓ API Key Access enabled</div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '13px' }}>
                      <span>Renewal Date: </span>
                      <strong>{user.subscriptionEnd ? new Date(user.subscriptionEnd).toLocaleDateString() : '31 Dec 2026'}</strong>
                    </div>
                  </div>
                ) : (
                  /* Free Sandbox Tier */
                  <div className="card" style={{ border: '1px solid var(--border)', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <strong style={{ fontSize: '18px', color: 'var(--text-muted)' }}>⚪ Free Sandbox Plan</strong>
                      <span className="badge badge-info">Sandbox</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <div>✓ Standard Clinical Trial Search</div>
                      <div>✗ Full 45-Column Drug Pipeline Access</div>
                      <div>✗ Licensing Deals Analytics</div>
                      <div>✗ Excel/CSV Local Exports</div>
                      <div>✗ REST API Key Access</div>
                    </div>
                    <button onClick={() => router.push('/subscription')} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                      Upgrade Account
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="card" style={{ padding: '16px', fontSize: '13px' }}>
                    <strong>Billing Invoices</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: 'var(--text-muted)' }}>
                      <span>02 Jul 2026 - Pro Tier</span>
                      <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Download PDF</a>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => router.push('/subscription')} className="btn btn-outline" style={{ flexGrow: 1, height: '46px', fontSize: '13px' }}>
                      Upgrade Plan
                    </button>
                    <button onClick={() => showToast('Redirecting to secure Razorpay portal...', 'info')} className="btn btn-outline" style={{ flexGrow: 1, height: '46px', fontSize: '13px' }}>
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USAGE STATISTICS */}
          {activeTab === 'stats' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Usage Statistics</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                High-level dashboard monitoring your local query metrics.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>542</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Searches This Month</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>{user.downloadCount || 38}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Spreadsheet Exports</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>94</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Saved Trials</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>21</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Saved Companies</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>18</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '4px' }}>Saved Drugs</div>
                </div>
              </div>

              {/* Mini dashboard summary card */}
              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-alt)' }}>
                <strong style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}>Total Usage Summary</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Account Created</div>
                    <strong>{user.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Saved Items</div>
                    <strong>137 total</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Searches All-Time</div>
                    <strong>3,482 queries</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Exports All-Time</div>
                    <strong>124 files</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SAVED ITEMS */}
          {activeTab === 'saved-items' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Saved Items</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                Retrieve your bookmarked molecular details and corporate deals.
              </p>

              {/* Sub-tabs */}
              <div className="auth-tabs auth-tabs-four" style={{ maxWidth: '480px', marginBottom: '20px' }}>
                <button onClick={() => setSavedItemsTab('drugs')} className={`auth-tab ${savedItemsTab === 'drugs' ? 'active' : ''}`}>⭐ Drugs</button>
                <button onClick={() => setSavedItemsTab('trials')} className={`auth-tab ${savedItemsTab === 'trials' ? 'active' : ''}`}>⭐ Trials</button>
                <button onClick={() => setSavedItemsTab('companies')} className={`auth-tab ${savedItemsTab === 'companies' ? 'active' : ''}`}>⭐ Companies</button>
                <button onClick={() => setSavedItemsTab('deals')} className={`auth-tab ${savedItemsTab === 'deals' ? 'active' : ''}`}>⭐ Deals</button>
              </div>

              <div className="card" style={{ padding: '16px 0', border: 'none' }}>
                {savedItemsTab === 'drugs' && (
                  <table className="data-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr><th>Drug Name</th><th>Therapeutic Target</th><th>Focus Area</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>Pembrolizumab</strong></td><td>PD-1 Receptor Inhibitor</td><td>Oncology</td></tr>
                      <tr><td><strong>Semaglutide</strong></td><td>GLP-1 Receptor Agonist</td><td>Endocrinology / Obesity</td></tr>
                      <tr><td><strong>Adalimumab</strong></td><td>TNF-Alpha Inhibitor</td><td>Immunology</td></tr>
                    </tbody>
                  </table>
                )}

                {savedItemsTab === 'trials' && (
                  <table className="data-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr><th>Trial NCT ID</th><th>Title</th><th>Phase</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>NCT05219420</strong></td><td>Semaglutide Obesity Clinical Outcome Study</td><td>Phase III</td></tr>
                      <tr><td><strong>NCT04829311</strong></td><td>Pembrolizumab Non-Small Cell Lung Study</td><td>Phase II</td></tr>
                    </tbody>
                  </table>
                )}

                {savedItemsTab === 'companies' && (
                  <table className="data-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr><th>Company Name</th><th>Headquarters</th><th>Principal Pipeline Focus</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>Pfizer Inc</strong></td><td>New York, USA</td><td>Vaccines, Oncology & Immunology</td></tr>
                      <tr><td><strong>Merck & Co.</strong></td><td>New Jersey, USA</td><td>Immunotherapy & Oncology</td></tr>
                      <tr><td><strong>Novo Nordisk</strong></td><td>Bagsvaerd, Denmark</td><td>Diabetes & Metabolic Disorders</td></tr>
                    </tbody>
                  </table>
                )}

                {savedItemsTab === 'deals' && (
                  <table className="data-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr><th>Ref Deal ID</th><th>Licensor / Licensee</th><th>Deal Size</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>DEAL_2026_09A</strong></td><td>Pfizer / BioNTech Licensing Deal</td><td>$450 Million</td></tr>
                      <tr><td><strong>DEAL_2026_11F</strong></td><td>Merck / Moderna Oncology Deal</td><td>$1.2 Billion</td></tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: RECENT ACTIVITY */}
          {activeTab === 'activity' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Recent Activity</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                A chronology of your recent searches and bookmarks.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Yesterday</span>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--primary)', marginTop: '2px' }}>Viewed: Pembrolizumab</strong>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>14:22 PM</span>
                </div>
                
                <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Yesterday</span>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--primary)', marginTop: '2px' }}>Exported: Phase III Oncology Trials</strong>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>09:15 AM</span>
                </div>

                <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>3 days ago</span>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--primary)', marginTop: '2px' }}>Saved: Pfizer Licensing Deal</strong>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>18:40 PM</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOWNLOADS */}
          {activeTab === 'downloads' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Download History</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                Access previously compiled spreadsheet exports.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Clinical_Trials_June.xlsx</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Spreadsheet Export • 4.2 MB</span>
                  </div>
                  <button onClick={() => showToast('Downloading spreadsheet...', 'success')} className="btn btn-outline btn-sm">
                    📥 Download
                  </button>
                </div>

                <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Drug_Pipeline.pdf</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pipeline Summary • 1.8 MB</span>
                  </div>
                  <button onClick={() => showToast('Downloading PDF file...', 'success')} className="btn btn-outline btn-sm">
                    📥 Download
                  </button>
                </div>

                <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Licensing_Deals.csv</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CSV Deals Dump • 850 KB</span>
                  </div>
                  <button onClick={() => showToast('Downloading CSV table...', 'success')} className="btn btn-outline btn-sm">
                    📥 Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Notification Preferences</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                Decide which system notifications are dispatched to your inbox.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={prefNewTrials} onChange={(e) => setPrefNewTrials(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span>New Clinical Trials (Alert me when new oncology/metabolic trials index)</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={prefAlerts} onChange={(e) => setPrefAlerts(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span>Drug Launch Alerts (Notifications on FDA approvals & molecule launch dates)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={prefDeals} onChange={(e) => setPrefDeals(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span>Licensing Deals (Updates on corporate R&D agreements and upfront deal sizes)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={prefNewsletter} onChange={(e) => setPrefNewsletter(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span>Weekly Newsletter (Clinical intelligence summary)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={prefMarketing} onChange={(e) => setPrefMarketing(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span>Marketing Emails (Information on plan upgrades, pricing matrix, and enterprise demos)</span>
                </label>
              </div>

              <button onClick={handleUpdatePrefs} disabled={updatingPrefs} className="btn btn-primary" style={{ width: 'fit-content', padding: '12px 24px' }}>
                {updatingPrefs ? 'Saving Preferences...' : 'Save Notification Preferences'}
              </button>
            </div>
          )}

          {/* TAB 8: SECURITY */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Security Settings</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                Configure multi-factor authentication, change password, and audit active sessions.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                
                {/* Credentials & MFA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="card" style={{ padding: '20px' }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>Password Controls</strong>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Update your account security keys periodically.
                    </p>
                    <button onClick={() => router.push('/change-password')} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                      Change Password
                    </button>
                  </div>

                  <div className="card" style={{ padding: '20px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Two Factor Authentication</strong>
                    <span className="badge badge-info" style={{ marginBottom: '12px' }}>Recommend Disabled</span>
                    <button onClick={() => showToast('MFA module setup initiated...', 'info')} className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                      Setup Authenticator App
                    </button>
                  </div>
                </div>

                {/* Session logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="card" style={{ padding: '16px', fontSize: '13px' }}>
                    <strong>Active Login Session</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <div>
                        <strong>Chrome Browser • Windows OS</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Current active connection • India</div>
                      </div>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Active Now</span>
                    </div>
                    <button onClick={() => showToast('Logged out of other devices successfully.', 'success')} className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: '16px' }}>
                      Logout Other Devices
                    </button>
                  </div>

                  <div className="card" style={{ padding: '16px', fontSize: '13px' }}>
                    <strong>API Access Key (Internal)</strong>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-alt)', marginTop: '12px' }}>
                      <code style={{ fontFamily: 'monospace' }}>mt_key_••••••••••••</code>
                      <button onClick={() => showToast('New REST API token generated.', 'info')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 9: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Application Preferences</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                Customize default filters, search locations, and display metrics.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                <div className="form-group">
                  <label htmlFor="p-theme" className="form-label">Theme Choice</label>
                  <select id="p-theme" value={prefTheme} onChange={(e) => setPrefTheme(e.target.value)} className="form-input">
                    <option value="dark">Dark Theme (Default UI)</option>
                    <option value="light">Light Theme</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="p-def-country" className="form-label">Default Search Country</label>
                  <input id="p-def-country" type="text" value={prefDefaultCountry} onChange={(e) => setPrefDefaultCountry(e.target.value)} className="form-input" placeholder="e.g. India" />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="p-def-ta" className="form-label">Default Therapeutic Area Focus</label>
                  <select id="p-def-ta" value={prefDefaultTherapeuticArea} onChange={(e) => setPrefDefaultTherapeuticArea(e.target.value)} className="form-input">
                    <option value="Oncology">Oncology (Cancer R&D)</option>
                    <option value="Cardiology">Cardiology (Cardiovascular Systems)</option>
                    <option value="Endocrinology">Endocrinology (Metabolic & Diabetes)</option>
                    <option value="Immunology">Immunology (Inflammatory Response)</option>
                  </select>
                </div>
              </div>

              <button onClick={handleUpdatePrefs} disabled={updatingPrefs} className="btn btn-primary" style={{ width: 'fit-content', padding: '12px 24px' }}>
                {updatingPrefs ? 'Saving Preferences...' : 'Save Settings Preferences'}
              </button>
            </div>
          )}

          {/* TAB 10: SUPPORT */}
          {activeTab === 'support' && (
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Help & Support</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                Troubleshoot errors and connect with clinical systems support agents.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <strong style={{ display: 'block', fontSize: '16px', marginBottom: '8px' }}>Contact Support Desk</strong>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Need urgent operational assistance? Open a ticket directly with developers.
                  </p>
                  <button onClick={() => router.push('/contact')} className="btn btn-primary btn-sm">
                    ✉️ Open Ticket
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="card" style={{ padding: '16px', fontSize: '13px' }}>
                    <strong>Documentation Hub</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                      <span>REST API Integration Docs</span>
                      <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>View Docs</a>
                    </div>
                  </div>
                  
                  <div className="card" style={{ padding: '16px', fontSize: '13px' }}>
                    <strong>Platform Health</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                      <span>All Services Online</span>
                      <span style={{ color: 'var(--badge-success)', fontWeight: 600 }}>100% Uptime</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Loading profile viewport...
        </div>
      </div>
    }>
      <ProfileDashboard />
    </Suspense>
  );
}
