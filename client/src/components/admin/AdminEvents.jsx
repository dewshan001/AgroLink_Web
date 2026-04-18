import React, { useState, useEffect, useContext } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Loader, Eye, X as XIcon } from 'lucide-react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';
import { useToast } from './Toast';
import { Context } from '../../context/Context';

const STATUSES = ['All', 'Upcoming', 'Past'];
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
        Upcoming: { bg: 'var(--status-green-bg)', color: 'var(--status-green-txt)', border: 'var(--status-green-border)' },
        Past: { bg: 'var(--status-gray-bg)', color: 'var(--status-gray-txt)', border: 'var(--status-gray-border)' },
    };
    const s = map[status] || map.Past;
    return {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20,
        fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    };
};

const getEventBadge = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today ? "Upcoming" : "Past";
};

const AdminEvents = () => {
    const { user } = useContext(Context);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [attendeesModal, setAttendeesModal] = useState(null);
    const { toast, ToastContainer } = useToast();

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/events");
            setEvents(res.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch events:", err);
            setError("Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const mappedEvents = events.map((e) => ({
        _id: e._id,
        title: e.title || 'Untitled',
        location: e.location || '—',
        date: e.date,
        status: getEventBadge(e.date) || 'Past',
        attendees: e.attendees || [],
        description: e.description || '',
    }));

    const filtered = activeFilter === 'All'
        ? mappedEvents
        : mappedEvents.filter(e => e.status === activeFilter);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleFilter = (f) => { setActiveFilter(f); setPage(1); };

    const openDeleteConfirm = (ev) => setDeleteTarget(ev);
    const closeDeleteConfirm = () => { if (!deleting) setDeleteTarget(null); };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await axios.delete(`/events/${deleteTarget._id}`, { data: { userId: user ? user._id : null } });
            setEvents(prev => prev.filter(e => e._id !== deleteTarget._id));
            toast.success(`Event "${deleteTarget.title}" has been deleted`);
        } catch (err) {
            console.error("Failed to delete event:", err);
            toast.error(err?.response?.data?.message || "Failed to delete event. Please try again.");
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    if (loading) {
        return (
            <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
                <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--emerald-600)' }} />
                <span style={{ marginLeft: 12, fontFamily: 'var(--font-body)', color: 'var(--slate-500)' }}>Loading events...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ ...card, padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--status-red-txt)', fontFamily: 'var(--font-body)', fontSize: 14 }}>{error}</p>
                <button onClick={fetchEvents} style={{
                    marginTop: 12, padding: '8px 20px', borderRadius: 10, border: 'none',
                    background: 'var(--emerald-600)', color: '#fff', cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                }}>Retry</button>
            </div>
        );
    }

    return (
        <div style={card}>
            <div style={{
                padding: '18px 24px', borderBottom: '1px solid var(--glass-border)',
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                background: 'var(--bg-surface)',
            }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                        Events Management
                    </h2>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>
                        {filtered.length} events found
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: 'var(--slate-200)', padding: 4, borderRadius: 12 }}>
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
                        >{s}</button>
                    ))}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '15%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th style={th}>Event</th>
                            <th style={th}>Location</th>
                            <th style={{ ...th, textAlign: 'center' }}>Date</th>
                            <th style={{ ...th, textAlign: 'center' }}>Registrations</th>
                            <th style={{ ...th, textAlign: 'center' }}>Status</th>
                            <th style={{ ...th, textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ ...td, textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>
                                    No events found
                                </td>
                            </tr>
                        ) : paginated.map((ev) => (
                            <tr key={ev._id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--mint-100)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={td}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--slate-900)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {ev.title}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ ...td, color: 'var(--slate-500)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {ev.location}
                                </td>
                                <td style={{ ...td, color: 'var(--slate-500)', fontSize: 12, textAlign: 'center' }}>
                                    {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                </td>
                                <td style={{ ...td, textAlign: 'center' }}>
                                    <span style={{
                                        padding: '3px 10px', borderRadius: 8,
                                        background: ev.attendees.length > 0 ? 'rgba(59,130,246,0.12)' : 'var(--status-gray-bg)',
                                        color: ev.attendees.length > 0 ? '#3b82f6' : 'var(--status-gray-txt)',
                                        border: `1px solid ${ev.attendees.length > 0 ? 'rgba(59,130,246,0.3)' : 'var(--status-gray-border)'}`,
                                        fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-display)',
                                    }}>
                                        {ev.attendees.length} Users
                                    </span>
                                </td>
                                <td style={{ ...td, textAlign: 'center' }}>
                                    <span style={statusBadge(ev.status)}>
                                        {ev.status}
                                    </span>
                                </td>
                                <td style={{ ...td, textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        {ev.attendees.length > 0 && (
                                            <button
                                                onClick={() => setAttendeesModal(ev)}
                                                title="View Attendees"
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
                                            onClick={() => openDeleteConfirm(ev)}
                                            title="Delete Event"
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
                    ><ChevronLeft size={16} /></button>
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
                    ><ChevronRight size={16} /></button>
                </div>
            </div>

            <ConfirmModal
                open={!!deleteTarget}
                title="Delete Event"
                message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"?` : ''}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                loading={deleting}
                onConfirm={handleDeleteConfirm}
                onCancel={closeDeleteConfirm}
            />
            <ToastContainer />

            {attendeesModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999,
                }} onClick={() => setAttendeesModal(null)}>
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: 20, padding: '28px 32px',
                        maxWidth: 500, width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                                {attendeesModal.title} - Registrations
                            </h3>
                            <button onClick={() => setAttendeesModal(null)} style={{
                                padding: 6, borderRadius: 8, border: 'none', background: 'transparent',
                                color: 'var(--slate-400)', cursor: 'pointer',
                            }}>
                                <XIcon size={18} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                            {attendeesModal.attendees?.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {attendeesModal.attendees.map((att, i) => (
                                        <li key={i} style={{
                                            padding: 12, background: 'var(--bg-surface)', borderRadius: 12,
                                            border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 4
                                        }}>
                                            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--slate-900)', fontSize: 14 }}>{att.name}</span>
                                            <span style={{ fontFamily: 'var(--font-body)', color: 'var(--slate-500)', fontSize: 13 }}>Phone: {att.phone}</span>
                                            {att.email && <span style={{ fontFamily: 'var(--font-body)', color: 'var(--slate-500)', fontSize: 13 }}>Email: {att.email}</span>}
                                            <span style={{ fontFamily: 'var(--font-body)', color: 'var(--slate-400)', fontSize: 11, marginTop: 4 }}>
                                                Registered: {att.registeredAt ? new Date(att.registeredAt).toLocaleString() : 'N/A'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--slate-500)', textAlign: 'center', marginTop: 20 }}>No attendees registered yet.</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                            <button
                                onClick={() => setAttendeesModal(null)}
                                style={{
                                    padding: '8px 20px', borderRadius: 10, border: 'none',
                                    background: 'var(--slate-200)', color: 'var(--slate-700)', cursor: 'pointer',
                                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEvents;
