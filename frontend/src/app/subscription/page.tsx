'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
  const { user, apiBaseUrl, showToast, checkSession, apiFetch } = useApp();
  const [loading, setLoading] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
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

  const handleCheckoutInit = async (planType: 'Basic' | 'Pro') => {
    if (!user) {
      showToast('Please log in or sign up before purchasing a plan', 'warning');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create order on Express backend
      const res = await apiFetch(`${apiBaseUrl}/payment/order`, {
        method: 'POST',
        body: JSON.stringify({ planType }),
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
        description: `${planType} Plan Subscription`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            setLoading(true);
            const verifyRes = await apiFetch(`${apiBaseUrl}/payment/verify`, {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isSandbox: false,
              }),
            });

            if (verifyRes.ok) {
              showToast('Payment successful! Subscription active.', 'success');
              await checkSession(); // Reload session cookies
              router.push('/search');
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
          color: '#6D28D9',
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
        body: JSON.stringify({
          razorpay_order_id: activeOrder.id,
          razorpay_payment_id: 'pay_sim_' + Math.random().toString(36).substring(7),
          razorpay_signature: 'sig_sim_ok',
          isSandbox: true,
        }),
      });

      if (verifyRes.ok) {
        showToast('Payment simulation successful! Pro activated.', 'success');
        await checkSession();
        router.push('/search');
      } else {
        showToast('Simulation verification failed', 'danger');
      }
    } catch (err) {
      showToast('Error connecting simulation verification', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 24px' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span className="hero-subtitle">Pricing Matrix</span>
        <h1 style={{ fontSize: '38px', marginTop: '10px' }}>MedTrackInsight Subscription Plans</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '16px auto 0' }}>
          Select the data granularity your research requires. All paid memberships include high-speed CSV pipeline exports.
        </p>
      </div>

      {/* Pricing Matrix Tables */}
      <div className="pricing-matrix">
        
        {/* Basic Plan */}
        <div className="pricing-card">
          <span className="plan-name">Basic Sandbox</span>
          <div className="plan-price">
            ₹499 <span className="plan-period">/ month</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Ideal for independent consultants researching key molecule names and mechanisms.
          </p>
          <div className="plan-features">
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>Search FDA reference catalog</span>
            </div>
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>4 standard details columns</span>
            </div>
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>Limit Phase/Route filtering</span>
            </div>
            <div className="plan-feature-item" style={{ color: 'var(--text-light)', textDecoration: 'line-through' }}>
              <span>✗ Export lists to local Excel/CSV</span>
            </div>
          </div>
          <button
            onClick={() => handleCheckoutInit('Basic')}
            disabled={loading || (user?.isSubscribed && user.subscriptionEnd ? true : false)}
            className="btn btn-outline"
            style={{ marginTop: 'auto' }}
          >
            {loading ? 'Processing...' : 'Subscribe Basic'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="pricing-card popular">
          <span className="plan-name">Pro Researcher</span>
          <div className="plan-price">
            ₹1,499 <span className="plan-period">/ month</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Exhaustive molecular specs, patent roadmaps, timeline charts, and standard lists exports.
          </p>
          <div className="plan-features">
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>Full search of all files/databases</span>
            </div>
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>Unlock all 45 data columns</span>
            </div>
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>Dynamic column toggle control</span>
            </div>
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>CSV downloads up to 2,000 rows/mo</span>
            </div>
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>Right-side molecular timelines drawer</span>
            </div>
          </div>
          <button
            onClick={() => handleCheckoutInit('Pro')}
            disabled={loading || user?.isSubscribed}
            className="btn btn-primary"
            style={{ marginTop: 'auto' }}
          >
            {loading ? 'Processing...' : user?.isSubscribed ? 'Membership Active' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="pricing-card">
          <span className="plan-name">Enterprise Premium</span>
          <div className="plan-price">
            Custom
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Dedicated database syncs, custom upload templates, API console access, and unlimited downloads.
          </p>
          <div className="plan-features">
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>All Pro candidate features</span>
            </div>
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>Unlimited monthly row downloads</span>
            </div>
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>Dedicated customer databases</span>
            </div>
            <div className="plan-feature-item">
              <span className="plan-feature-icon">✓</span>
              <span>Standard uptime SLA</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/demo')}
            className="btn btn-outline"
            style={{ marginTop: 'auto' }}
          >
            Request Enterprise Demo
          </button>
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
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💳</div>
              <h3 style={{ fontSize: '20px' }}>Razorpay Payment Simulator</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Mode: Sandbox Testing (Placeholder Keys Active)
              </p>
            </div>
            
            <div className="card" style={{ backgroundColor: 'var(--bg-alt)', border: 'none', padding: '16px', marginBottom: '24px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Order Reference:</span>
                <strong style={{ fontFamily: 'monospace' }}>{activeOrder.id.slice(0, 15)}...</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Amount Chargeable:</span>
                <strong>₹{activeOrder.amount / 100}.00 INR</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="btn btn-outline"
                style={{ flexGrow: 1 }}
              >
                Decline
              </button>
              <button
                onClick={handleSimulatedPaymentSuccess}
                disabled={loading}
                className="btn btn-primary"
                style={{ flexGrow: 1 }}
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
