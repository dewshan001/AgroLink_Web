import React from 'react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 14px',
      borderRadius: 14,
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      textAlign: 'left',
      position: 'relative',
      marginBottom: 4,
      background: active
        ? 'linear-gradient(135deg, rgba(5,150,105,0.12) 0%, rgba(6,78,59,0.08) 100%)'
        : 'transparent',
      color: active ? 'var(--emerald-600)' : 'var(--slate-600)',
      boxShadow: active
        ? 'inset 0 0 0 1px rgba(5,150,105,0.2)'
        : 'none',
    }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.background = 'rgba(5,150,105,0.07)';
        e.currentTarget.style.color = 'var(--forest-900)';
        e.currentTarget.style.transform = 'translateX(3px)';
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--slate-600)';
        e.currentTarget.style.transform = 'none';
      }
    }}
  >
    {/* Icon wrapper */}
    <span style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: 10,
      flexShrink: 0,
      background: active
        ? 'linear-gradient(135deg, var(--emerald-600), var(--forest-900))'
        : 'rgba(6,78,59,0.08)',
      color: active ? '#fff' : 'var(--slate-600)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: active ? '0 4px 12px rgba(5,150,105,0.3)' : 'none',
    }}>
      <Icon size={17} />
    </span>

    <span>{label}</span>

    {/* Active indicator bar */}
    {active && (
      <span style={{
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 3,
        height: 24,
        borderRadius: '3px 0 0 3px',
        background: 'linear-gradient(180deg, var(--emerald-600), var(--forest-900))',
      }} />
    )}
  </button>
);

export default SidebarItem;