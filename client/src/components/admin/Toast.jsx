import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

/**
 * Lightweight toast notification system for the admin panel.
 *
 * Usage:
 *   <Toast message="User deleted" type="success" onClose={() => {}} />
 *
 * Or use the helper hook:
 *   const { toast, ToastContainer } = useToast();
 *   toast.success("Done!");
 *   toast.error("Oops!");
 *   toast.info("FYI...");
 *   // render <ToastContainer /> once in your layout
 */

// ── Single Toast ─────────────────────────────────────────────────────────────
const Toast = ({ id, message, type = 'success', duration = 3500, onClose }) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const startExit = useCallback(() => {
    setExiting(true);
    setTimeout(() => onClose?.(id), 300);
  }, [id, onClose]);

  useEffect(() => {
    timerRef.current = setTimeout(startExit, duration);
    return () => clearTimeout(timerRef.current);
  }, [duration, startExit]);

  const theme = {
    success: { bg: 'var(--status-green-bg)',  border: 'var(--status-green-border)',  icon: 'var(--status-green-txt)',  Icon: CheckCircle },
    error:   { bg: 'var(--status-red-bg, rgba(239,68,68,0.08))', border: 'var(--status-red-border, rgba(239,68,68,0.25))', icon: '#ef4444', Icon: XCircle },
    info:    { bg: 'rgba(59,130,246,0.08)',    border: 'rgba(59,130,246,0.25)',    icon: '#3b82f6',    Icon: Info },
  };
  const t = theme[type] || theme.success;
  const IconComp = t.Icon;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        background: 'var(--bg-card)',
        border: `1px solid ${t.border}`,
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        color: 'var(--slate-800)',
        minWidth: 280, maxWidth: 400,
        animation: exiting
          ? 'adminToastOut 0.3s ease forwards'
          : 'adminToastIn 0.3s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: 'auto',
      }}
    >
      <IconComp size={18} style={{ color: t.icon, flexShrink: 0 }} />
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={startExit}
        style={{
          padding: 2, border: 'none', background: 'transparent',
          color: 'var(--slate-400)', cursor: 'pointer', borderRadius: 6,
          transition: 'color 0.15s', flexShrink: 0, display: 'flex',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--slate-700)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--slate-400)'}
      >
        <X size={15} />
      </button>
    </div>
  );
};

// ── Toast Container ──────────────────────────────────────────────────────────
const ToastContainer = ({ toasts = [], removeToast }) => (
  <div style={{
    position: 'fixed', top: 24, right: 24, zIndex: 10000,
    display: 'flex', flexDirection: 'column', gap: 10,
    pointerEvents: 'none',
  }}>
    {toasts.map((t) => (
      <Toast key={t.id} {...t} onClose={removeToast} />
    ))}
    <style>{`
      @keyframes adminToastIn {
        from { opacity: 0; transform: translateX(40px) scale(0.95) }
        to   { opacity: 1; transform: translateX(0) scale(1) }
      }
      @keyframes adminToastOut {
        from { opacity: 1; transform: translateX(0) scale(1) }
        to   { opacity: 0; transform: translateX(40px) scale(0.95) }
      }
    `}</style>
  </div>
);

// ── Hook ─────────────────────────────────────────────────────────────────────
let _idCounter = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++_idCounter;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error:   (msg, dur) => addToast(msg, 'error', dur),
    info:    (msg, dur) => addToast(msg, 'info', dur),
  };

  const Container = () => <ToastContainer toasts={toasts} removeToast={removeToast} />;

  return { toast, ToastContainer: Container };
};

export default Toast;
