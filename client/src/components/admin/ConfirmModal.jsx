import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Modern glass-morphism confirm dialog for the admin panel.
 *
 * Props
 * ─────
 * open        : boolean
 * title       : string          (e.g. "Delete User")
 * message     : string | node
 * confirmText : string          (default "Confirm")
 * cancelText  : string          (default "Cancel")
 * variant     : 'danger' | 'warning' | 'info'   (default 'danger')
 * onConfirm   : () => void
 * onCancel    : () => void
 * loading     : boolean         (disables buttons while async work runs)
 */
const ConfirmModal = ({
  open,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const overlayRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape' && !loading) onCancel?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const colors = {
    danger:  { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)', icon: '#ef4444', btn: '#ef4444', btnHover: '#dc2626' },
    warning: { bg: 'rgba(234,179,8,0.10)',   border: 'rgba(234,179,8,0.25)',  icon: '#ca8a04', btn: '#ca8a04', btnHover: '#a16207' },
    info:    { bg: 'rgba(59,130,246,0.10)',   border: 'rgba(59,130,246,0.25)', icon: '#3b82f6', btn: '#3b82f6', btnHover: '#2563eb' },
  };
  const c = colors[variant] || colors.danger;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current && !loading) onCancel?.(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        animation: 'adminModalFadeIn 0.2s ease',
      }}
    >
      <div style={{
        width: '90%', maxWidth: 420,
        background: 'var(--bg-card)',
        border: '1px solid var(--glass-border)',
        borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        animation: 'adminModalSlideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header strip */}
        <div style={{
          padding: '20px 24px 0',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: c.bg,
            border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={20} style={{ color: c.icon }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: 0,
              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
              color: 'var(--slate-900)', lineHeight: 1.3,
            }}>{title}</h3>
            <p style={{
              margin: '6px 0 0',
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--slate-500)', lineHeight: 1.5,
            }}>{message}</p>
          </div>

          {/* Close X */}
          <button
            onClick={() => !loading && onCancel?.()}
            style={{
              padding: 4, border: 'none', background: 'transparent',
              color: 'var(--slate-400)', cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: 8, transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--slate-700)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--slate-400)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div style={{
          padding: '20px 24px',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={() => !loading && onCancel?.()}
            disabled={loading}
            style={{
              padding: '9px 22px', borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-surface)',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
              color: 'var(--slate-600)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--slate-200)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
          >
            {cancelText}
          </button>
          <button
            onClick={() => !loading && onConfirm?.()}
            disabled={loading}
            style={{
              padding: '9px 22px', borderRadius: 12,
              border: 'none',
              background: c.btn,
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = c.btnHover; }}
            onMouseLeave={e => e.currentTarget.style.background = c.btn}
          >
            {loading && (
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff', borderRadius: '50%',
                animation: 'spin 0.6s linear infinite', display: 'inline-block',
              }} />
            )}
            {confirmText}
          </button>
        </div>
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes adminModalFadeIn {
          from { opacity: 0 } to { opacity: 1 }
        }
        @keyframes adminModalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
