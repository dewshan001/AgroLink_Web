import React, { useState, useEffect, useContext } from 'react';
import { Search, Eye, CheckCircle, XCircle, Trash2, ShoppingBag, Filter, Loader } from 'lucide-react';
import axios from 'axios';
import { Context } from '../../context/Context';
import ConfirmModal from './ConfirmModal';
import { useToast } from './Toast';

const card = {
  background: 'var(--bg-card)',
  borderRadius: 20,
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-zen)',
  overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 600,
};

const th = {
  padding: '10px 20px',
  fontFamily: 'var(--font-display)',
  fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  color: 'var(--slate-400)',
  background: 'var(--bg-surface)',
  borderBottom: '1px solid var(--glass-border)',
  whiteSpace: 'nowrap',
};

const td = {
  padding: '14px 20px',
  fontFamily: 'var(--font-body)',
  fontSize: 13, color: 'var(--slate-700)',
  verticalAlign: 'middle',
};

const statusPill = (status) => {
  const map = {
    available: { bg: 'var(--status-green-bg)', color: 'var(--status-green-txt)', border: 'var(--status-green-border)', label: 'Active' },
    Rejected: { bg: 'var(--status-red-bg)', color: 'var(--status-red-txt)', border: 'var(--status-red-border)', label: 'Rejected' },
    Pending: { bg: 'var(--status-yellow-bg)', color: 'var(--status-yellow-txt)', border: 'var(--status-yellow-border)', label: 'Pending' },
  };
  const s = map[status] || map.Pending;
  return {
    style: {
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    },
    label: s.label
  };
};

const MarketplaceManagement = () => {
  const { user } = useContext(Context);
  const { toast, ToastContainer } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/products");
      // Sort by newest first
      setProducts(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setError(null);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load marketplace listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStatusChange = async (id, newStatus, productName) => {
    try {
      setActionLoading(true);
      await axios.put(`/products/${id}`, {
        status: newStatus,
        userId: user._id
      });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, status: newStatus } : p));
      toast.success(`Product "${productName}" marked as ${newStatus === 'available' ? 'Active' : newStatus}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update product status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await axios.delete(`/products/${deleteTarget._id}`, {
        data: { userId: user._id }
      });
      setProducts(prev => prev.filter(p => p._id !== deleteTarget._id));
      toast.success(`Product "${deleteTarget.crop_name}" has been deleted`);
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.error("Failed to delete product.");
    } finally {
      setActionLoading(false);
      setDeleteTarget(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.crop_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.seller_id || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'All' ? true : p.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--emerald-600)' }} />
        <span style={{ marginLeft: 12, fontFamily: 'var(--font-body)', color: 'var(--slate-500)' }}>Loading marketplace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...card, padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--status-red-txt)', fontFamily: 'var(--font-body)', fontSize: 14 }}>{error}</p>
        <button onClick={fetchProducts} style={{
          marginTop: 12, padding: '8px 20px', borderRadius: 10, border: 'none',
          background: 'var(--emerald-600)', color: '#fff', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
        }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={card}>
      <ToastContainer />
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Marketplace Listing"
        message={deleteTarget ? `Are you sure you want to completely delete "${deleteTarget.crop_name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { if (!actionLoading) setDeleteTarget(null); }}
      />

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={18} style={{ color: 'var(--emerald-600)' }} />
              Marketplace Listings
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>
              Manage crops and products sold by farmers
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search products or sellers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                  background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                  borderRadius: 10, fontSize: 13, color: 'var(--slate-900)',
                  fontFamily: 'var(--font-body)', outline: 'none', width: 200,
                }}
              />
            </div>
            <button style={{
              padding: '7px 10px', borderRadius: 10,
              border: '1px solid var(--glass-border)', background: 'var(--bg-card)',
              color: 'var(--slate-500)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--emerald-600)'; e.currentTarget.style.borderColor = 'var(--emerald-600)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--slate-500)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { label: 'All', value: 'All' },
            { label: 'Active', value: 'available' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Rejected', value: 'Rejected' },
          ].map(s => (
            <button
              key={s.value}
              onClick={() => setActiveFilter(s.value)}
              style={{
                padding: '5px 14px', borderRadius: 9, border: '1px solid',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: activeFilter === s.value ? 'var(--emerald-600)' : 'var(--bg-card)',
                color: activeFilter === s.value ? '#fff' : 'var(--slate-500)',
                borderColor: activeFilter === s.value ? 'var(--emerald-600)' : 'var(--glass-border)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Product</th>
              <th style={th}>Price &amp; Stock</th>
              <th style={th}>Seller</th>
              <th style={th}>Status</th>
              <th style={{ ...th, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--slate-400)', fontFamily: 'var(--font-body)' }}>
                  No products found.
                </td>
              </tr>
            ) : filteredProducts.map(product => {
              const pill = statusPill(product.status);
              return (
                <tr
                  key={product._id}
                  style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--mint-100)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={product.image_url ? (product.image_url.startsWith('http') ? product.image_url : "http://localhost:5000/images/" + product.image_url) : "https://via.placeholder.com/44"}
                        alt={product.crop_name}
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--glass-border)', flexShrink: 0 }}
                      />
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--slate-900)', display: 'block', fontSize: 13 }}>{product.crop_name}</span>
                        <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{product.category_id}</span>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{ fontWeight: 700, color: 'var(--slate-900)', display: 'block' }}>LKR {product.price}</span>
                    <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>Qty: {product.quantity}</span>
                  </td>
                  <td style={td}>
                    <span style={{ fontWeight: 600, color: 'var(--slate-600)', display: 'block' }}>{product.seller_id}</span>
                    <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{new Date(product.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td style={td}>
                    <span style={pill.style}>{pill.label}</span>
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                      {product.status === 'Pending' && (
                        <>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusChange(product._id, 'available', product.crop_name)}
                            title="Approve"
                            style={{ padding: 6, borderRadius: 8, border: 'none', background: 'var(--status-green-bg)', color: 'var(--status-green-txt)', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                            <CheckCircle size={15} />
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusChange(product._id, 'Rejected', product.crop_name)}
                            title="Reject"
                            style={{ padding: 6, borderRadius: 8, border: 'none', background: 'var(--status-red-bg)', color: 'var(--status-red-txt)', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      {product.status !== 'Pending' && product.status !== 'Rejected' && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleStatusChange(product._id, 'Rejected', product.crop_name)}
                          title="Revoke Approval (Reject)"
                          style={{ padding: 6, borderRadius: 8, border: 'none', background: 'var(--status-red-bg)', color: 'var(--status-red-txt)', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                          <XCircle size={15} />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget(product)}
                        title="Delete"
                        style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--slate-400)'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketplaceManagement;