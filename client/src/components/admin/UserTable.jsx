import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Loader, Check, X as XIcon, Eye, Ban, RotateCcw } from 'lucide-react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';
import { useToast } from './Toast';

const STATUSES = ['All', 'Active', 'Inactive', 'Pending', 'Deactivated'];
const PAGE_SIZE = 6;

// ── Shared card/table styles via CSS vars ───────────────────────────────────
const card = {
  background: 'var(--bg-card)',
  borderRadius: 20,
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-zen)',
  overflow: 'hidden',
};

const th = {
  padding: '10px 20px',
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--slate-400)',
  background: 'var(--bg-surface)',
  borderBottom: '1px solid var(--glass-border)',
  whiteSpace: 'nowrap',
};

const td = {
  padding: '14px 20px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--slate-700)',
  verticalAlign: 'middle',
};

const statusBadge = (status) => {
  const map = {
    Active: { bg: 'var(--status-green-bg)', color: 'var(--status-green-txt)', border: 'var(--status-green-border)' },
    Inactive: { bg: 'var(--status-gray-bg)', color: 'var(--status-gray-txt)', border: 'var(--status-gray-border)' },
    Pending: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    Deactivated: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  };
  const s = map[status] || map.Inactive;
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
    background: s.bg, color: s.color, border: `1px solid ${s.border}`,
  };
};

// Determine "Active" vs "Inactive" based on whether user logged in within the last 30 days
const getUserStatus = (user) => {
  if (!user.updatedAt) return 'Inactive';
  const lastActivity = new Date(user.updatedAt);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return lastActivity >= thirtyDaysAgo ? 'Active' : 'Inactive';
};

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null); // user obj to delete
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState(null); // id of user being approved
  const [descriptionModal, setDescriptionModal] = useState(null); // user obj to show description
  const { toast, ToastContainer } = useToast();

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/users");
      setUsers(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Map DB users to table-friendly shape
  const mappedUsers = users.map((u) => ({
    _id: u._id,
    username: u.name || u.username || 'Unknown',
    email: u.email || '—',
    role: u.isAdmin ? 'Admin' : u.role === 'expert' ? 'Expert' : 'User',
    status: u.active === false ? 'Deactivated' : u.role === 'expert' && !u.approved ? 'Pending' : getUserStatus(u),
    approved: u.approved,
    active: u.active !== false,
    description: u.description || '',
    joinDate: u.createdAt,
    profilePic: u.profilePic,
  }));

  const filtered = activeFilter === 'All'
    ? mappedUsers
    : mappedUsers.filter(u => u.status === activeFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (f) => { setActiveFilter(f); setPage(1); };

  const openDeleteConfirm = (user) => setDeleteTarget(user);
  const closeDeleteConfirm = () => { if (!deleting) setDeleteTarget(null); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete("/users/admin/" + deleteTarget._id);
      setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
      toast.success(`User "${deleteTarget.username}" has been deleted`);
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error("Failed to delete user. Please try again.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleApprove = async (user) => {
    setApproving(user._id);
    try {
      await axios.put("/users/admin/approve/" + user._id);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, approved: true } : u));
      toast.success(`Expert "${user.username}" has been approved`);
    } catch (err) {
      console.error("Failed to approve expert:", err);
      toast.error("Failed to approve expert. Please try again.");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (user) => {
    setApproving(user._id);
    try {
      await axios.put("/users/admin/reject/" + user._id);
      setUsers(prev => prev.filter(u => u._id !== user._id));
      toast.success(`Expert "${user.username}" has been rejected and removed`);
    } catch (err) {
      console.error("Failed to reject expert:", err);
      toast.error("Failed to reject expert. Please try again.");
    } finally {
      setApproving(null);
    }
  };

  const handleDeactivate = async (user) => {
    setApproving(user._id);
    try {
      await axios.put("/users/admin/deactivate/" + user._id);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, active: false } : u));
      toast.success(`Account "${user.username}" has been deactivated`);
    } catch (err) {
      console.error("Failed to deactivate user:", err);
      toast.error("Failed to deactivate user. Please try again.");
    } finally {
      setApproving(null);
    }
  };

  const handleReactivate = async (user) => {
    setApproving(user._id);
    try {
      await axios.put("/users/admin/reactivate/" + user._id);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, active: true } : u));
      toast.success(`Account "${user.username}" has been reactivated`);
    } catch (err) {
      console.error("Failed to reactivate user:", err);
      toast.error("Failed to reactivate user. Please try again.");
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--emerald-600)' }} />
        <span style={{ marginLeft: 12, fontFamily: 'var(--font-body)', color: 'var(--slate-500)' }}>Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...card, padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--status-red-txt)', fontFamily: 'var(--font-body)', fontSize: 14 }}>{error}</p>
        <button onClick={fetchUsers} style={{
          marginTop: 12, padding: '8px 20px', borderRadius: 10, border: 'none',
          background: 'var(--emerald-600)', color: '#fff', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
        }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={card}>
      {/* Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
        background: 'var(--bg-surface)',
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
            Recent Users
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>
            {filtered.length} users found
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'var(--slate-200)', padding: 4, borderRadius: 12,
        }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleFilter(s)}
              style={{
                padding: '5px 14px', borderRadius: 9, border: 'none',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: activeFilter === s ? 'var(--emerald-600)' : 'transparent',
                color: activeFilter === s ? '#fff' : 'var(--slate-500)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={th}>User</th>
              <th style={th}>Email</th>
              <th style={{ ...th, textAlign: 'center' }}>Role</th>
              <th style={{ ...th, textAlign: 'center' }}>Joined</th>
              <th style={{ ...th, textAlign: 'center' }}>Status</th>
              <th style={{ ...th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...td, textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>
                  No users found
                </td>
              </tr>
            ) : paginated.map((user) => (
              <tr
                key={user._id}
                style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--mint-100)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={user.username}
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--emerald-600), var(--forest-900))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontWeight: 600, color: 'var(--slate-900)', fontSize: 13 }}>
                      {user.username}
                    </span>
                  </div>
                </td>
                <td style={{ ...td, color: 'var(--slate-500)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 8,
                    background: user.role === 'Admin' ? 'rgba(59,130,246,0.12)' : user.role === 'Expert' ? 'rgba(168,85,247,0.12)' : 'var(--status-gray-bg)',
                    color: user.role === 'Admin' ? '#3b82f6' : user.role === 'Expert' ? '#a855f7' : 'var(--status-gray-txt)',
                    border: `1px solid ${user.role === 'Admin' ? 'rgba(59,130,246,0.3)' : user.role === 'Expert' ? 'rgba(168,85,247,0.3)' : 'var(--status-gray-border)'}`,
                    fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-display)',
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ ...td, color: 'var(--slate-500)', fontSize: 12, textAlign: 'center' }}>
                  {new Date(user.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={statusBadge(user.status)}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: user.status === 'Active' ? 'var(--status-green-txt)' : user.status === 'Pending' ? '#f59e0b' : user.status === 'Deactivated' ? '#ef4444' : 'var(--status-gray-txt)',
                    }} />
                    {user.status}
                  </span>
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {user.status === 'Pending' && (
                      <>
                        {user.description && (
                          <button
                            onClick={() => setDescriptionModal(user)}
                            title="View description"
                            style={{
                              padding: 6, borderRadius: 8, border: 'none',
                              background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--slate-400)'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleApprove(user)}
                          disabled={approving === user._id}
                          title="Approve expert"
                          style={{
                            padding: 6, borderRadius: 8, border: 'none',
                            background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer',
                            transition: 'all 0.2s', opacity: approving === user._id ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#22c55e'; e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--slate-400)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={() => handleReject(user)}
                          disabled={approving === user._id}
                          title="Reject expert"
                          style={{
                            padding: 6, borderRadius: 8, border: 'none',
                            background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer',
                            transition: 'all 0.2s', opacity: approving === user._id ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--slate-400)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <XIcon size={15} />
                        </button>
                      </>
                    )}
                    {user.role !== 'Admin' && user.status !== 'Pending' && (
                      user.active ? (
                        <button
                          onClick={() => handleDeactivate(user)}
                          disabled={approving === user._id}
                          title="Deactivate account"
                          style={{
                            padding: 6, borderRadius: 8, border: 'none',
                            background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer',
                            transition: 'all 0.2s', opacity: approving === user._id ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--slate-400)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Ban size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(user)}
                          disabled={approving === user._id}
                          title="Reactivate account"
                          style={{
                            padding: 6, borderRadius: 8, border: 'none',
                            background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer',
                            transition: 'all 0.2s', opacity: approving === user._id ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#22c55e'; e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--slate-400)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <RotateCcw size={15} />
                        </button>
                      )
                    )}
                    <button
                      onClick={() => openDeleteConfirm(user)}
                      title="Delete user"
                      style={{
                        padding: 6, borderRadius: 8, border: 'none',
                        background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--slate-400)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        padding: '14px 24px', borderTop: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        background: 'var(--bg-surface)',
      }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-400)' }}>
          Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
        </p>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--slate-400)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.35 : 1 }}
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                background: p === page ? 'var(--emerald-600)' : 'transparent',
                color: p === page ? '#fff' : 'var(--slate-400)',
              }}
            >{p}</button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--slate-400)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.35 : 1 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      {/* Confirm delete modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete User"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.username}"? All their posts will also be permanently removed.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteConfirm}
      />

      {/* Toast notifications */}
      <ToastContainer />

      {/* Expert description modal */}
      {descriptionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }} onClick={() => setDescriptionModal(null)}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: '28px 32px',
            maxWidth: 480, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid var(--glass-border)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                Expert Application
              </h3>
              <button onClick={() => setDescriptionModal(null)} style={{
                padding: 6, borderRadius: 8, border: 'none', background: 'transparent',
                color: 'var(--slate-400)', cursor: 'pointer',
              }}>
                <XIcon size={18} />
              </button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-400)' }}>
                Applicant
              </span>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate-900)', fontWeight: 600, marginTop: 4 }}>
                {descriptionModal.username} ({descriptionModal.email})
              </p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-400)' }}>
                Description
              </span>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate-700)',
                marginTop: 4, lineHeight: 1.6, padding: '12px 16px',
                background: 'var(--bg-surface)', borderRadius: 12,
                border: '1px solid var(--glass-border)',
              }}>
                {descriptionModal.description || 'No description provided.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { handleReject(descriptionModal); setDescriptionModal(null); }}
                style={{
                  padding: '8px 20px', borderRadius: 10, border: 'none',
                  background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                }}
              >
                Reject
              </button>
              <button
                onClick={() => { handleApprove(descriptionModal); setDescriptionModal(null); }}
                style={{
                  padding: '8px 20px', borderRadius: 10, border: 'none',
                  background: 'var(--emerald-600)', color: '#fff', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                }}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;