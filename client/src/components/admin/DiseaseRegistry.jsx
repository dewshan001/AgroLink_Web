import React from 'react';
import { Leaf, AlertCircle } from 'lucide-react';
import { MOCK_DISEASES } from './data/mockData';

const severityStyle = (severity) => {
  if (severity === 'High') return { bg: 'var(--status-red-bg)', color: 'var(--status-red-txt)', border: 'var(--status-red-border)' };
  if (severity === 'Medium') return { bg: 'var(--status-yellow-bg)', color: 'var(--status-yellow-txt)', border: 'var(--status-yellow-border)' };
  return { bg: 'var(--status-green-bg)', color: 'var(--status-green-txt)', border: 'var(--status-green-border)' };
};

const DiseaseRegistry = () => (
  <div style={{
    background: 'var(--bg-card)',
    borderRadius: 20,
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-zen)',
    overflow: 'hidden',
  }}>
    {/* Header */}
    <div style={{
      padding: '18px 24px',
      borderBottom: '1px solid var(--glass-border)',
      background: 'var(--bg-surface)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
          color: 'var(--slate-900)', margin: 0,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Leaf size={17} style={{ color: 'var(--emerald-600)' }} />
          Disease Knowledge Base
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>
          {MOCK_DISEASES.length} entries indexed
        </p>
      </div>
      <button style={{
        padding: '7px 16px', borderRadius: 10, border: 'none',
        background: 'var(--emerald-600)', color: '#fff',
        fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--emerald-700)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--emerald-600)'}
      >
        + Add New
      </button>
    </div>

    {/* Entries */}
    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {MOCK_DISEASES.map(disease => {
        const sev = severityStyle(disease.severity);
        return (
          <div
            key={disease.id}
            style={{
              padding: '14px 18px',
              borderRadius: 14,
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.2s var(--ease-zen)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--emerald-600)'; e.currentTarget.style.background = 'var(--mint-100)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
          >
            {/* Left: icon + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: sev.bg, border: `1px solid ${sev.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertCircle size={18} style={{ color: sev.color }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                  {disease.name}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 1 }}>
                  Affects: <strong style={{ color: 'var(--slate-600)' }}>{disease.crop}</strong>
                </p>
              </div>
            </div>

            {/* Right: severity + reports */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--slate-400)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Severity</p>
                <span style={{
                  padding: '2px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
                  background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`,
                }}>
                  {disease.severity}
                </span>
              </div>
              <div style={{ textAlign: 'right', minWidth: 48 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--slate-400)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reports</p>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--slate-900)' }}>
                  {disease.reports}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default DiseaseRegistry;