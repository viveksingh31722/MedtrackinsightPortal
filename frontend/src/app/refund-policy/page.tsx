'use client';

import React from 'react';

export default function RefundPolicyPage() {
  return (
    <div className="container" style={{ padding: '60px 24px', maxWidth: '800px' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span className="hero-subtitle">Terms & Conditions</span>
        <h1 style={{ fontSize: '38px', marginTop: '10px' }}>Data Licensing & Refund Policy</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
          Please read this policy carefully before purchasing a subscription.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Section 1 */}
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>1.</span> Digital Nature of Assets
          </h2>
          <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: '1.6' }}>
            All data products, proprietary market research data, pharmaceutical pipeline tracking logs, and subscription matrix access sold by <strong>MedTrackInsight</strong> are digital, downloadable assets. Due to the immediate accessibility and copyable nature of our intellectual property upon purchase, all sales are final, and no refunds or cancellations will be issued.
          </p>
        </div>

        {/* Section 2 */}
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>2.</span> Technical Integrity & Data Delivery
          </h2>
          <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: '1.6' }}>
            In the rare event that a downloaded dataset is corrupted, incomplete, or fails to match the structural specifications outlined in the product summary, <strong>MedTrackInsight</strong> will replace or repair the file within 3 business days of notice. Clients must report technical anomalies to our Data Operations team (<strong>dataops@medtrackinsight.com</strong>) within 48 hours of initial delivery.
          </p>
        </div>

        {/* Section 3 */}
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>3.</span> Usage and Liability Limitations
          </h2>
          <p style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: '1.6' }}>
            Our medicine data is compiled using verified healthcare registries, pharmaceutical supply chain audits, and custom market indicators. However, market research is subject to variance. <strong>MedTrackInsight</strong> does not guarantee specific commercial outcomes based on this data, and refunds will not be issued based on external changes in market dynamics.
          </p>
        </div>

        {/* Note Box */}
        <div className="card" style={{ backgroundColor: 'var(--bg-alt)', border: 'none', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            For billing queries or custom licensing requirements, please reach out to <a href="mailto:compliance@medtrackinsight.com" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>compliance@medtrackinsight.com</a>.
          </p>
        </div>

      </div>

    </div>
  );
}
