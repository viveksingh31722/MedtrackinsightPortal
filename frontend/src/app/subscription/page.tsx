'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
  const { user, apiBaseUrl, showToast, checkSession, apiFetch } = useApp();
  const [loading, setLoading] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [activePlanType, setActivePlanType] = useState<'Starter' | 'Professional' | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [activeBillingCycle, setActiveBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const router = useRouter();

  // Razorpay Script loader
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutInit = async (planType: 'Starter' | 'Professional') => {
    if (!user) {
      showToast('Please log in or sign up before purchasing a plan', 'warning');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setActivePlanType(planType);
      setActiveBillingCycle(billingCycle);
      
      // 1. Create order on Express backend
      const res = await apiFetch(`${apiBaseUrl}/payment/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, billingCycle }),
      });

      if (!res.ok) {
        showToast('Error initiating checkout order', 'danger');
        setLoading(false);
        return;
      }

      const orderData = await res.json();
      setActiveOrder(orderData);

      // Check if server is running in Sandbox mode
      if (orderData.isSandbox) {
        showToast('Initiating Sandbox simulated checkout...', 'info');
        setShowSimulateModal(true);
        setLoading(false);
        return;
      }

      // 2. Production: Load script and show Razorpay dialog
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast('Could not load payment checkout script. Falling back to sandbox simulator.', 'warning');
        setShowSimulateModal(true);
        setLoading(false);
        return;
      }

      // Initialize Razorpay Checkout options
      const windowObj = window as any;
      const rzpInstance = new windowObj.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MedTrackInsight',
        description: `${planType} Plan Subscription (${billingCycle === 'monthly' ? 'Monthly' : '1 Year'})`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            setLoading(true);
            const verifyRes = await apiFetch(`${apiBaseUrl}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isSandbox: false,
                planType,
                billingCycle,
                amount: orderData.amount,
              }),
            });

            if (verifyRes.ok) {
              showToast(`Payment successful! ${planType} plan activated.`, 'success');
              await checkSession(); // Reload session cookies
              router.push('/');
            } else {
              showToast('Payment verification failed. Invalid signature.', 'danger');
            }
          } catch (err) {
            showToast('Error validating payment signature', 'danger');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#0284c7', // Sky blue theme matching app primary
        },
      });

      rzpInstance.open();
      setLoading(false);
    } catch (err) {
      console.error(err);
      showToast('Error configuring checkout session', 'danger');
      setLoading(false);
    }
  };

  // Simulated validation for sandbox order test suites
  const handleSimulatedPaymentSuccess = async () => {
    if (!activeOrder) return;
    try {
      setLoading(true);
      setShowSimulateModal(false);

      const verifyRes = await apiFetch(`${apiBaseUrl}/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: activeOrder.id,
          razorpay_payment_id: 'pay_sim_' + Math.random().toString(36).substring(7),
          razorpay_signature: 'sig_sim_ok',
          isSandbox: true,
          planType: activePlanType,
          billingCycle: activeBillingCycle,
          amount: activeOrder.amount,
        }),
      });

      if (verifyRes.ok) {
        showToast(`Payment simulation successful! ${activePlanType} plan active.`, 'success');
        await checkSession();
        router.push('/');
      } else {
        showToast('Simulation verification failed', 'danger');
      }
    } catch (err) {
      showToast('Error connecting simulation verification', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPlan = (plan: 'Starter' | 'Professional') => {
    return user?.isSubscribed && user.planType === plan;
  };

  return (
    <div className="subscription-container">
      
      {/* Dynamic Styled Header */}
      <div className="subscription-header">
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #ff7a00 0%, var(--primary) 100%)'
        }}></div>
        <span className="hero-subtitle" style={{ color: 'var(--primary)', background: 'var(--primary-light)', border: '1px solid var(--primary)', marginBottom: '8px' }}>
          ⚡ MedtrackInsight Subscription Model
        </span>
        <h1 style={{ fontSize: '34px', fontWeight: 900, marginTop: '8px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Flexible Pricing for Bio-Pharma Market & Clinical Intelligence
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px', margin: '8px auto 0', fontSize: '14px', fontWeight: 500, lineHeight: '1.6' }}>
          Choose the right plan to access our drug pipelines, clinical trial trackers, and regulatory intelligence matrix.
        </p>

        {/* Interactive Toggle Switch */}
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'var(--bg-alt)',
          padding: '4px',
          borderRadius: '999px',
          marginTop: '28px',
          border: '1.5px solid var(--border)',
        }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '8px 24px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: billingCycle === 'monthly' ? '#ff7a00' : 'transparent',
              color: billingCycle === 'monthly' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            6 Months Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '8px 24px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: billingCycle === 'annual' ? '#ff7a00' : 'transparent',
              color: billingCycle === 'annual' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            12 Months Billing (Save ~37%)
          </button>
        </div>
      </div>

      {/* Simplified Plan Cards Grid */}
      <div className="subscription-grid">
        
        {/* STARTER PLAN */}
        <div 
          className="card plan-card subscription-card"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = '#ff7a00';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#ff7a00', backgroundColor: 'rgba(255, 122, 0, 0.1)', padding: '4px 10px', borderRadius: '4px' }}>
              Starter Tier
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)', marginTop: '12px', marginBottom: '8px' }}>Starter</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>
              Perfect for individual biopharma analysts and research consultants.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '28px' }}>
            <span style={{ fontSize: '38px', fontWeight: 900, color: 'var(--text-main)' }}>
              ₹{billingCycle === 'monthly' ? '5' : '10'}
            </span>
            <span style={{ color: 'var(--text-light)', marginLeft: '8px', fontSize: '14px', fontWeight: 600 }}>
              / {billingCycle === 'monthly' ? '6 months' : '12 months'}
            </span>
            {billingCycle === 'annual' && (
              <span style={{ marginLeft: '12px', color: '#10B981', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '999px' }}>
                Save ~37%
              </span>
            )}
          </div>

          {/* Features Checklist */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px 0', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: '#ff7a00', fontSize: '16px' }}>👥</span>
              <span><strong>1</strong> User Account</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: '#ff7a00', fontSize: '16px' }}>🔓</span>
              <span>Full Pipeline Database Access</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: '#ff7a00', fontSize: '16px' }}>📅</span>
              <span><strong>12 Months</strong> Clinical Database</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: '#ff7a00', fontSize: '16px' }}>📥</span>
              <span>Export Up to <strong>500 rows</strong> (Total)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: '#ff7a00', fontSize: '16px' }}>✉️</span>
              <span>Standard Email Support</span>
            </li>
          </ul>

          <button
            onClick={() => handleCheckoutInit('Starter')}
            disabled={loading || isCurrentPlan('Starter')}
            className={`btn ${isCurrentPlan('Starter') ? 'btn-outline' : 'btn-primary'}`}
            style={{ 
              width: '100%', 
              padding: '14px', 
              borderRadius: '12px', 
              fontWeight: 800,
              backgroundColor: isCurrentPlan('Starter') ? 'transparent' : '#ff7a00',
              borderColor: '#ff7a00',
              color: isCurrentPlan('Starter') ? '#ff7a00' : '#ffffff'
            }}
          >
            {loading && activePlanType === 'Starter' ? 'Processing...' : isCurrentPlan('Starter') ? 'Active Plan' : 'Subscribe Starter'}
          </button>
        </div>

        {/* PROFESSIONAL PLAN */}
        <div 
          className="card plan-card subscription-card recommended"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.borderColor = '#0369a1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
        >
          {/* Recommended Badge */}
          <div style={{
            position: 'absolute',
            top: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg, #ff7a00 0%, var(--primary) 100%)',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 900,
            padding: '4px 14px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)'
          }}>
            ★ Recommended Tier
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '4px 10px', borderRadius: '4px' }}>
                Professional Tier
              </span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)', marginTop: '12px', marginBottom: '8px' }}>Professional</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>
              For research teams, small biotechs, and drug investment strategists.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '28px' }}>
            <span style={{ fontSize: '38px', fontWeight: 900, color: 'var(--text-main)' }}>
              ₹{billingCycle === 'monthly' ? '5' : '10'}
            </span>
            <span style={{ color: 'var(--text-light)', marginLeft: '8px', fontSize: '14px', fontWeight: 600 }}>
              / {billingCycle === 'monthly' ? '6 months' : '12 months'}
            </span>
          </div>

          {/* Features Checklist */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px 0', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: 'var(--primary)', fontSize: '16px' }}>👥</span>
              <span><strong>3</strong> User Accounts</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: 'var(--primary)', fontSize: '16px' }}>🔓</span>
              <span>Full Pipeline Database Access</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: 'var(--primary)', fontSize: '16px' }}>📅</span>
              <span><strong>12 Months</strong> Clinical Database</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: 'var(--primary)', fontSize: '16px' }}>📥</span>
              <span>Export Up to <strong>1,000 rows</strong> (Total)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600 }}>
              <span style={{ color: 'var(--primary)', fontSize: '16px' }}>🚀</span>
              <span>Priority Customer Support</span>
            </li>
          </ul>

          <button
            onClick={() => handleCheckoutInit('Professional')}
            disabled={loading || isCurrentPlan('Professional')}
            className={`btn ${isCurrentPlan('Professional') ? 'btn-outline' : 'btn-primary'}`}
            style={{ 
              width: '100%', 
              padding: '14px', 
              borderRadius: '12px', 
              fontWeight: 900,
              backgroundColor: isCurrentPlan('Professional') ? 'transparent' : 'var(--primary)',
              borderColor: 'var(--primary)',
              color: isCurrentPlan('Professional') ? 'var(--primary)' : '#ffffff'
            }}
          >
            {loading && activePlanType === 'Professional' ? 'Processing...' : isCurrentPlan('Professional') ? 'Active Plan' : 'Subscribe Professional'}
          </button>
        </div>

      </div>

      {/* Custom Services & Contact Section */}
      <div className="subscription-custom-services">
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2,132,199,0.08) 0%, rgba(0,0,0,0) 70%)',
          zIndex: 1
        }}></div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '4px 12px', borderRadius: '999px' }}>
            Custom Services
          </span>
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-main)', marginTop: '12px', marginBottom: '8px' }}>
            Need Custom Solutions or Enterprise Gating?
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto 28px', fontSize: '14px', lineHeight: '1.6' }}>
            For corporate research teams or pharmaceutical enterprises requiring customized database exports, custom reports, or dedicated API access.
          </p>

          {/* Grid of Custom Services */}
          <div className="subscription-services-grid">
            {[
              'Custom Market Research Report',
              'Competitive Landscape Analysis',
              'Pipeline Assessment',
              'Clinical Trial Landscape',
              'Drug Forecast Model',
              'API Integration',
              'Custom Dashboard'
            ].map((service, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-alt)',
                borderRadius: '8px',
                border: '1px solid var(--border-muted)',
                fontSize: '13px',
                color: 'var(--text-main)',
                fontWeight: 600,
              }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
                <span>{service}</span>
              </div>
            ))}
          </div>

          <a 
            href="mailto:sales@medtrackinsight.com?subject=Inquiry%20about%20Custom%20Services"
            className="btn btn-outline"
            style={{ 
              padding: '12px 36px', 
              borderRadius: '12px', 
              fontWeight: 800, 
              borderColor: 'var(--border)',
              color: 'var(--text-main)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            ✉️ Contact Us For Custom Pricing
          </a>
        </div>
      </div>

      {/* Simulated payment modal layout */}
      {showSimulateModal && activeOrder && (
        <>
          <div className="drawer-overlay open" onClick={() => setShowSimulateModal(false)}></div>
          <div className="card" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            width: '100%',
            maxWidth: '460px',
            padding: '36px',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '20px',
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid var(--border)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>💳</div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Razorpay Sandbox Simulator</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Testing Mode (Simulated Gateway Checkout)
              </p>
            </div>
            
            <div className="card" style={{ backgroundColor: 'var(--bg-alt)', border: 'none', padding: '16px', marginBottom: '24px', fontSize: '14px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
                <span>Selected Tier:</span>
                <strong style={{ color: 'var(--primary)' }}>{activePlanType} Plan ({activeBillingCycle === 'monthly' ? 'Monthly' : '1 Year'})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
                <span>Order Reference:</span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>{activeOrder.id.slice(0, 15)}...</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Amount Chargeable:</span>
                <strong style={{ color: 'var(--accent)', fontSize: '16px' }}>₹{(activeOrder.amount / 100).toLocaleString('en-IN')}.00 INR</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="btn btn-outline"
                style={{ flexGrow: 1, padding: '12px', borderRadius: '10px', color: 'var(--text-main)' }}
              >
                Decline
              </button>
              <button
                onClick={handleSimulatedPaymentSuccess}
                disabled={loading}
                className="btn btn-primary"
                style={{ flexGrow: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'var(--primary)', color: '#ffffff' }}
              >
                {loading ? 'Verifying...' : 'Approve Payment'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
