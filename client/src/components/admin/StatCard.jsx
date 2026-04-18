import React from 'react';

const StatCard = ({ title, value, change, icon: Icon, color }) => {
  const isPositive = change.startsWith('+');

  // Map Tailwind color class → CSS custom property colours
  const iconColorMap = {
    'bg-blue-500': { bg: 'rgba(59,130,246,0.12)', icon: '#3b82f6' },
    'bg-green-500': { bg: 'rgba(16,185,129,0.12)', icon: 'var(--emerald-600)' },
    'bg-purple-500': { bg: 'rgba(139,92,246,0.12)', icon: '#8b5cf6' },
    'bg-orange-500': { bg: 'rgba(249,115,22,0.12)', icon: '#f97316' },
    'bg-red-500': { bg: 'rgba(239,68,68,0.12)', icon: '#ef4444' },
    'bg-yellow-500': { bg: 'rgba(234,179,8,0.12)', icon: '#ca8a04' },
    'bg-teal-500': { bg: 'rgba(20,184,166,0.12)', icon: '#14b8a6' },
    'bg-pink-500': { bg: 'rgba(236,72,153,0.12)', icon: '#ec4899' },
  };
  const iconTheme = iconColorMap[color] || { bg: 'rgba(5,150,105,0.12)', icon: 'var(--emerald-600)' };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        padding: 22,
        borderRadius: 18,
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-zen)',
        transition: 'all 0.3s var(--ease-zen)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 10px 32px rgba(6,78,59,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-zen)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-display)', color: 'var(--slate-500)',
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            margin: 0,
          }}>
            {title}
          </p>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700,
            color: 'var(--slate-900)', marginTop: 8, letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {value}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              fontFamily: 'var(--font-display)',
              background: isPositive ? 'var(--status-green-bg)' : 'var(--status-red-bg)',
              color: isPositive ? 'var(--status-green-txt)' : 'var(--status-red-txt)',
              border: `1px solid ${isPositive ? 'var(--status-green-border)' : 'var(--status-red-border)'}`,
            }}>
              {change}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', color: 'var(--slate-400)', fontSize: 11 }}>
              vs last month
            </span>
          </div>
        </div>

        {/* Icon box */}
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: iconTheme.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} style={{ color: iconTheme.icon }} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
