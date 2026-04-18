import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Eye, Flag, XCircle, CheckCircle,
  List, Grid, Trash2, RefreshCw, AlertTriangle, Loader
} from 'lucide-react';
import axios from 'axios';

const PF = "http://localhost:5000/images/";
const getPhotoSrc = (src) => {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) return src;
  return PF + src;
};

const card = {
  background: 'var(--bg-card)',
  borderRadius: 20,
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-zen)',
  display: 'flex', flexDirection: 'column',
  minHeight: 600, overflow: 'hidden',
};

const statusPill = (status) => {
  const map = {
    Approved: { bg: 'var(--status-green-bg)', color: 'var(--status-green-txt)', border: 'var(--status-green-border)' },
    Rejected: { bg: 'var(--status-red-bg)', color: 'var(--status-red-txt)', border: 'var(--status-red-border)' },
    Pending: { bg: 'var(--status-yellow-bg)', color: 'var(--status-yellow-txt)', border: 'var(--status-yellow-border)' },
  };
  const s = map[status] || map.Pending;
  return {
    padding: '3px 10px', borderRadius: 20, flexShrink: 0,
    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
    background: s.bg, color: s.color, border: `1px solid ${s.border}`,
  };
};

/* ── Simple file-text icon (inline SVG) ──────────────────────────────── */
const FileTextIcon = ({ size = 24, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

/* ── Toast notification ───────────────────────────────────────────────── */
const ToastMessage = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgMap = { success: 'var(--emerald-600)', error: 'var(--status-red-txt)', info: '#2563eb' };

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      padding: '12px 20px', borderRadius: 12,
      background: bgMap[type] || bgMap.info,
      color: '#fff', fontFamily: 'var(--font-display)',
      fontSize: 13, fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      animation: 'blogToastSlideIn 0.3s ease',
    }}>
      {message}
    </div>
  );
};

/* ── Confirm Modal ────────────────────────────────────────────────────── */
const ConfirmDialog = ({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false, showInput = false, inputLabel = '', inputValue = '', onInputChange }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
    <div style={{
      background: 'var(--bg-card)', borderRadius: 20, padding: 28, width: 400, maxWidth: '90vw',
      border: '1px solid var(--glass-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate-600)', margin: '0 0 16px', lineHeight: 1.5 }}>{message}</p>
      {showInput && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, color: 'var(--slate-600)', display: 'block', marginBottom: 6 }}>{inputLabel}</label>
          <textarea
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            rows={3}
            style={{
              width: '100%', padding: 10, borderRadius: 10,
              border: '1px solid var(--glass-border)',
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--slate-900)', background: 'var(--bg-surface)',
              outline: 'none', resize: 'vertical', boxSizing: 'border-box',
            }}
            placeholder="Enter reason..."
          />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel} style={{
          padding: '8px 18px', borderRadius: 10, border: '1px solid var(--glass-border)',
          background: 'var(--bg-card)', color: 'var(--slate-600)',
          fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={onConfirm} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none',
          background: danger ? '#dc2626' : 'var(--emerald-600)',
          color: '#fff', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);

/* ── Post Detail Modal ────────────────────────────────────────────────── */
const PostDetailModal = ({ post, onClose }) => {
  if (!post) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9997, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', borderRadius: 20, padding: 0, width: 600, maxWidth: '92vw', maxHeight: '85vh',
        border: '1px solid var(--glass-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        {post.photo && (
          <div style={{ width: '100%', height: 220, overflow: 'hidden', flexShrink: 0 }}>
            <img src={getPhotoSrc(post.photo)} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={statusPill(post.status)}>{post.status}</span>
            {post.flagged && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#d97706', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}><AlertTriangle size={12} /> Flagged</span>}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 8px' }}>{post.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--emerald-600), var(--forest-900))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
            }}>
              {post.authorPic ? <img src={getPhotoSrc(post.authorPic)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (post.authorName || post.username || '?').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--slate-600)' }}>{post.authorName || post.username}</span>
            <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--slate-400)' }}>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          {post.categories && post.categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {post.categories.map((cat, i) => (
                <span key={i} style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                  fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: 'var(--bg-surface)', color: 'var(--slate-600)', border: '1px solid var(--glass-border)',
                }}>{cat}</span>
              ))}
            </div>
          )}
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate-700)', lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: post.desc }}
          />
          {post.rejectionReason && (
            <div style={{
              marginTop: 16, padding: 12, borderRadius: 10,
              background: 'var(--status-red-bg)', border: '1px solid var(--status-red-border)',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--status-red-txt)' }}>Rejection Reason:</span>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--status-red-txt)', margin: '4px 0 0' }}>{post.rejectionReason}</p>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: 10, border: '1px solid var(--glass-border)',
            background: 'var(--bg-card)', color: 'var(--slate-600)',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Close</button>
        </div>
      </div>
    </div>
  );
};

/* ── Time-ago helper ──────────────────────────────────────────────────── */
const timeAgo = (dateStr) => {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return then.toLocaleDateString();
};

/* ═══════════════════════════════════════════════════════════════════════ */
const BlogModeration = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewPost, setViewPost] = useState(null);
  const [modStats, setModStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, flagged: 0 });
  const [actionLoading, setActionLoading] = useState(null);

  /* debounce search */
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* fetch posts */
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter !== 'All') params.status = activeFilter;
      if (searchDebounce) params.search = searchDebounce;

      const [postsRes, statsRes] = await Promise.all([
        axios.get('/posts/admin/all', { params }),
        axios.get('/posts/admin/mod-stats'),
      ]);
      setPosts(postsRes.data);
      setModStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchDebounce]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  /* ── Actions ─────────────────────────────────────────────────────── */
  const handleApprove = (post) => {
    setConfirm({
      title: 'Approve Post',
      message: `Are you sure you want to approve "${post.title}"?`,
      confirmLabel: 'Approve',
      danger: false,
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(post._id);
        try {
          await axios.put(`/posts/admin/approve/${post._id}`);
          showToast('Post approved successfully');
          fetchPosts();
        } catch { showToast('Failed to approve post', 'error'); }
        finally { setActionLoading(null); }
      },
    });
  };

  const handleReject = (post) => {
    setRejectReason('');
    setConfirm({
      title: 'Reject Post',
      message: `Are you sure you want to reject "${post.title}"? Optionally provide a reason.`,
      confirmLabel: 'Reject',
      danger: true,
      showInput: true,
      inputLabel: 'Rejection Reason',
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(post._id);
        try {
          await axios.put(`/posts/admin/reject/${post._id}`, { reason: rejectReason });
          showToast('Post rejected');
          fetchPosts();
        } catch { showToast('Failed to reject post', 'error'); }
        finally { setActionLoading(null); }
      },
    });
  };

  const handleFlag = async (post) => {
    setActionLoading(post._id);
    try {
      await axios.put(`/posts/admin/flag/${post._id}`);
      showToast(post.flagged ? 'Post unflagged' : 'Post flagged');
      fetchPosts();
    } catch { showToast('Failed to flag post', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = (post) => {
    setConfirm({
      title: 'Delete Post',
      message: `This will permanently delete "${post.title}". This action cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        setActionLoading(post._id);
        try {
          await axios.delete(`/posts/admin/${post._id}`);
          showToast('Post deleted');
          fetchPosts();
        } catch { showToast('Failed to delete post', 'error'); }
        finally { setActionLoading(null); }
      },
    });
  };

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div style={card}>
      {/* Toast */}
      {toast && <ToastMessage message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          showInput={confirm.showInput}
          inputLabel={confirm.inputLabel}
          inputValue={rejectReason}
          onInputChange={setRejectReason}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Post detail modal */}
      {viewPost && <PostDetailModal post={viewPost} onClose={() => setViewPost(null)} />}

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
              Content Moderation
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>
              {modStats.total} total posts · {modStats.pending} pending · {modStats.flagged} flagged
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {/* Refresh */}
            <button
              onClick={fetchPosts}
              title="Refresh"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 10, border: '1px solid var(--glass-border)',
                background: 'var(--bg-card)', color: 'var(--slate-500)', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--emerald-600)'; e.currentTarget.style.color = 'var(--emerald-600)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--slate-500)'; }}
            >
              <RefreshCw size={14} />
            </button>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search posts…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                  background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                  borderRadius: 10, fontSize: 13, color: 'var(--slate-900)',
                  fontFamily: 'var(--font-body)', outline: 'none', width: 220,
                }}
              />
            </div>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--slate-200)', padding: 3, borderRadius: 10, gap: 2 }}>
              {[{ mode: 'list', Icon: List }, { mode: 'grid', Icon: Grid }].map(({ mode, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '5px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: viewMode === mode ? 'var(--bg-card)' : 'transparent',
                    color: viewMode === mode ? 'var(--emerald-600)' : 'var(--slate-400)',
                    boxShadow: viewMode === mode ? 'var(--shadow-subtle)' : 'none',
                  }}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { label: 'All', count: modStats.total },
            { label: 'Pending', count: modStats.pending },
            { label: 'Approved', count: modStats.approved },
            { label: 'Rejected', count: modStats.rejected },
          ].map(({ label, count }) => (
            <button
              key={label}
              onClick={() => setActiveFilter(label)}
              style={{
                padding: '5px 14px', borderRadius: 9, border: '1px solid',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: activeFilter === label ? 'var(--emerald-600)' : 'var(--bg-card)',
                color: activeFilter === label ? '#fff' : 'var(--slate-500)',
                borderColor: activeFilter === label ? 'var(--emerald-600)' : 'var(--glass-border)',
              }}
            >
              {label} <span style={{ opacity: 0.7, marginLeft: 4 }}>({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 24,
        display: viewMode === 'grid' ? 'grid' : 'flex',
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : undefined,
        flexDirection: viewMode === 'list' ? 'column' : undefined,
        gap: 16, background: 'var(--bg-snow)',
      }}>
        {/* Loading */}
        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 60, color: 'var(--slate-400)', gap: 10,
            fontFamily: 'var(--font-display)', fontSize: 14,
            gridColumn: viewMode === 'grid' ? '1 / -1' : undefined,
          }}>
            <Loader size={18} style={{ animation: 'blogSpin 1s linear infinite' }} />
            Loading posts…
          </div>
        )}

        {/* Empty */}
        {!loading && posts.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 60, color: 'var(--slate-400)',
            fontFamily: 'var(--font-display)', fontSize: 14,
            gridColumn: viewMode === 'grid' ? '1 / -1' : undefined,
          }}>
            <FileTextIcon size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            No posts found
            {searchDebounce && <span style={{ fontSize: 12, marginTop: 4 }}>Try a different search term</span>}
          </div>
        )}

        {/* Post cards */}
        {!loading && posts.map(post => {
          const isActing = actionLoading === post._id;
          const category = post.categories && post.categories.length > 0 ? post.categories[0] : 'General';

          return (
            <div
              key={post._id}
              style={{
                background: 'var(--bg-card)', borderRadius: 16,
                border: `1px solid ${post.flagged ? '#d97706' : 'var(--glass-border)'}`,
                overflow: 'hidden', transition: 'all 0.25s var(--ease-zen)',
                display: 'flex', flexDirection: viewMode === 'list' ? 'row' : 'column',
                opacity: isActing ? 0.6 : 1,
                pointerEvents: isActing ? 'none' : 'auto',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(6,78,59,0.1)'; e.currentTarget.style.borderColor = post.flagged ? '#d97706' : 'var(--emerald-600)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = post.flagged ? '#d97706' : 'var(--glass-border)'; }}
            >
              {/* Thumbnail */}
              <div style={{
                flexShrink: 0, overflow: 'hidden', position: 'relative',
                width: viewMode === 'list' ? 200 : '100%',
                height: viewMode === 'list' ? 'auto' : 180,
                minHeight: viewMode === 'list' ? 120 : undefined,
                background: 'var(--bg-surface)',
              }}>
                {post.photo ? (
                  <img src={getPhotoSrc(post.photo)} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-300)' }}>
                    <FileTextIcon size={40} />
                  </div>
                )}
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  padding: '3px 9px', borderRadius: 6,
                  background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{category}</span>
                {post.flagged && (
                  <span style={{
                    position: 'absolute', top: 10, left: 10,
                    padding: '3px 8px', borderRadius: 6,
                    background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 700,
                    fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 3,
                  }}><AlertTriangle size={10} /> Flagged</span>
                )}
              </div>

              {/* Body */}
              <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                      color: 'var(--slate-900)', margin: 0, lineHeight: 1.35,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{post.title}</h3>
                    <span style={statusPill(post.status)}>{post.status}</span>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)',
                    lineHeight: 1.6, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{post.desc ? post.desc.replace(/<[^>]+>/g, '').substring(0, 150) + '…' : ''}</p>

                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--emerald-600), var(--forest-900))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
                    }}>
                      {post.authorPic ? <img src={getPhotoSrc(post.authorPic)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (post.authorName || post.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--slate-600)' }}>{post.authorName || post.username}</span>
                    <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>·</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--slate-400)' }}>{timeAgo(post.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { Icon: Eye, label: 'View', action: () => setViewPost(post) },
                      { Icon: Flag, label: post.flagged ? 'Unflag' : 'Flag', action: () => handleFlag(post) },
                      { Icon: Trash2, label: 'Delete', action: () => handleDelete(post) },
                    ].map(({ Icon, label, action }) => (
                      <button key={label}
                        title={label}
                        onClick={action}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 9px', borderRadius: 8, border: '1px solid var(--glass-border)',
                          background: 'var(--bg-card)', color: 'var(--slate-500)',
                          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--emerald-600)'; e.currentTarget.style.color = 'var(--emerald-600)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--slate-500)'; }}
                      >
                        <Icon size={12} /> {label}
                      </button>
                    ))}
                  </div>
                  {post.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleReject(post)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--status-red-bg)', color: 'var(--status-red-txt)', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        <XCircle size={12} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(post)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--emerald-600)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                    </div>
                  )}
                  {post.status === 'Rejected' && (
                    <button
                      onClick={() => handleApprove(post)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--emerald-600)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <CheckCircle size={12} /> Approve
                    </button>
                  )}
                  {post.status === 'Approved' && (
                    <button
                      onClick={() => handleReject(post)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--status-red-bg)', color: 'var(--status-red-txt)', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes blogSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blogToastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default BlogModeration;