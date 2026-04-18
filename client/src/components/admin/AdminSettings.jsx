import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Database, CheckCircle, XCircle, RefreshCw, Lock, Eye, EyeOff,
  Camera, Save, Loader, Shield, Server, HardDrive, UserPlus, Mail, User as UserIcon,
} from 'lucide-react';
import axios from 'axios';
import { Context } from '../../context/Context';
import { useToast } from './Toast';

/* ═══════════════════════════════════════════════════════════════════════════
   Shared styles
   ═══════════════════════════════════════════════════════════════════════════ */
const sectionCard = {
  background: 'var(--bg-card)',
  borderRadius: 20,
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-zen)',
  overflow: 'hidden',
  animation: 'adminSettingsFadeUp 0.45s cubic-bezier(0.4,0,0.2,1) both',
};

const sectionHeader = {
  padding: '20px 24px',
  borderBottom: '1px solid var(--glass-border)',
  background: 'var(--bg-surface)',
  display: 'flex', alignItems: 'center', gap: 12,
};

const sectionBody = { padding: '24px' };

const label = {
  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
  color: 'var(--slate-600)', marginBottom: 6, display: 'block',
};

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 12,
  border: '1px solid var(--glass-border)', background: 'var(--bg-surface)',
  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate-800)',
  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

const btnPrimary = {
  padding: '10px 24px', borderRadius: 12, border: 'none',
  background: 'var(--emerald-600)', color: '#fff',
  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.25s',
  display: 'inline-flex', alignItems: 'center', gap: 8,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */
const AdminSettings = () => {
  const { user, dispatch, sessionTimeoutEnabled, setSessionTimeoutEnabled } = useContext(Context);
  const { toast, ToastContainer } = useToast();

  /* ── DB status ─────────────────────────────────────────────────────────── */
  const [dbStatus, setDbStatus] = useState(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbPulse, setDbPulse] = useState(false);

  const fetchDbStatus = async () => {
    setDbLoading(true);
    setDbPulse(true);
    try {
      const res = await axios.get('/admin/db-status');
      setDbStatus(res.data);
    } catch {
      setDbStatus({ status: 'Error', connected: false, host: '—', name: '—' });
    } finally {
      setDbLoading(false);
      setTimeout(() => setDbPulse(false), 600);
    }
  };

  useEffect(() => { fetchDbStatus(); }, []);

  /* ── Chatbot settings ─────────────────────────────────────────────────── */
  const [chatbotProvider, setChatbotProvider] = useState('openrouter');
  const [chatbotModel, setChatbotModel] = useState('google/gemma-3-27b-it:free');
  const [chatbotApiKey, setChatbotApiKey] = useState('');
  const [chatbotHasApiKey, setChatbotHasApiKey] = useState(false);
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [chatbotSaving, setChatbotSaving] = useState(false);
  const [showChatbotKey, setShowChatbotKey] = useState(false);

  const fetchChatbotSettings = async () => {
    if (!user?._id) return;
    setChatbotLoading(true);
    try {
      const res = await axios.get('/admin/chatbot-settings', { params: { userId: user._id } });
      setChatbotProvider(res.data?.provider || 'openrouter');
      setChatbotModel(res.data?.model || 'google/gemma-3-27b-it:free');
      setChatbotHasApiKey(!!res.data?.hasApiKey);
    } catch (err) {
      const msg = err.response?.data?.error;
      toast.error(msg || 'Failed to load chatbot settings');
    } finally {
      setChatbotLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchChatbotSettings();
  }, [user?._id]);

  const handleSaveChatbotSettings = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    if (!chatbotModel.trim()) {
      toast.error('Please enter a model');
      return;
    }

    setChatbotSaving(true);
    try {
      const payload = {
        userId: user._id,
        provider: chatbotProvider,
        model: chatbotModel.trim(),
      };
      if (chatbotApiKey.trim()) payload.apiKey = chatbotApiKey.trim();

      const res = await axios.put('/admin/chatbot-settings', payload);
      setChatbotHasApiKey(!!res.data?.hasApiKey);
      setChatbotApiKey('');
      toast.success('Chatbot settings saved');
    } catch (err) {
      const msg = err.response?.data?.error;
      toast.error(msg || 'Failed to save chatbot settings');
    } finally {
      setChatbotSaving(false);
    }
  };

  /* ── Create Admin Account ───────────────────────────────────────────────── */
  const [adminUsername, setAdminUsername] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [adminConfirmPw, setAdminConfirmPw] = useState('');
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [showAdminConfirmPw, setShowAdminConfirmPw] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminUsername || !adminEmail || !adminPw) { toast.error('Please fill in all required fields'); return; }
    if (adminPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (adminPw !== adminConfirmPw) { toast.error('Passwords do not match'); return; }
    setAdminLoading(true);
    try {
      await axios.post('/users/admin/create-admin', {
        username: adminUsername,
        name: adminName,
        email: adminEmail,
        password: adminPw,
      });
      toast.success('Admin account created successfully!');
      setAdminUsername(''); setAdminName(''); setAdminEmail('');
      setAdminPw(''); setAdminConfirmPw('');
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : 'Failed to create admin account');
    } finally {
      setAdminLoading(false);
    }
  };

  /* ── Password change ───────────────────────────────────────────────────── */
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) { toast.error('Please fill in all password fields'); return; }
    if (newPw.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }

    setPwLoading(true);
    try {
      // Verify current password first
      await axios.post('/auth/verify', { username: user.username, password: currentPw });
      // Update password
      await axios.put('/users/' + user._id, { userId: user._id, password: newPw });
      toast.success('Password updated successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      const msg = err.response?.data;
      if (msg === 'Wrong credentials!') toast.error('Current password is incorrect');
      else toast.error('Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  /* ── Profile picture ───────────────────────────────────────────────────── */
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [picFile, setPicFile] = useState(null);
  const [picLoading, setPicLoading] = useState(false);

  const currentPic = user?.profilePic
    ? user.profilePic
    : null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be smaller than 5 MB'); return; }
    setPicFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePicUpload = async () => {
    if (!picFile) return;
    setPicLoading(true);
    try {
      // Convert file to Base64
      const profilePic = await convertToBase64(picFile);

      // Update user profile with Base64 image
      await axios.put('/users/' + user._id, { userId: user._id, profilePic });
      dispatch({ type: 'UPDATE_SUCCESS', payload: { ...user, profilePic } });
      toast.success('Profile picture updated');
      setPicFile(null);
      setPreview(null);
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      toast.error('Failed to upload profile picture');
    } finally {
      setPicLoading(false);
    }
  };

  /* ── Password strength indicator ────────────────────────────────────── */
  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#f97316' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#eab308' };
    if (score <= 4) return { level: 4, label: 'Strong', color: '#22c55e' };
    return { level: 5, label: 'Very Strong', color: 'var(--emerald-600)' };
  };
  const pwStrength = getPasswordStrength(newPw);

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── 0. Session Timeout ─────────────────────────────────────────── */}
      <div style={{ ...sectionCard, animationDelay: '0s' }}>
        <div style={sectionHeader}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'rgba(16,185,129,0.10)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} style={{ color: 'var(--emerald-600)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)' }}>
              Session Timeout
            </h3>
            <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>
              Enable inactivity warning and auto logout for all users
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSessionTimeoutEnabled(!sessionTimeoutEnabled)}
            style={{
              padding: '7px 14px', borderRadius: 999,
              border: '1px solid',
              borderColor: sessionTimeoutEnabled ? 'var(--emerald-600)' : 'var(--glass-border)',
              background: sessionTimeoutEnabled ? 'rgba(16,185,129,0.12)' : 'var(--bg-surface)',
              color: sessionTimeoutEnabled ? 'var(--emerald-700)' : 'var(--slate-600)',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Toggle session timeout"
          >
            {sessionTimeoutEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
        <div style={sectionBody}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            padding: 14, borderRadius: 14,
            border: '1px solid var(--glass-border)',
            background: 'var(--bg-surface)',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--slate-800)' }}>
                Inactivity-based logout
              </div>
              <div style={{ marginTop: 4, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>
                When enabled, inactive sessions show a warning and then log out automatically.
              </div>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--slate-600)' }}>
                {sessionTimeoutEnabled ? 'On' : 'Off'}
              </span>
              <input
                type="checkbox"
                checked={!!sessionTimeoutEnabled}
                onChange={(e) => setSessionTimeoutEnabled(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--emerald-600)', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* ── 1. Database Status ──────────────────────────────────────────── */}
      <div style={{ ...sectionCard, animationDelay: '0s' }}>
        <div style={sectionHeader}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'rgba(59,130,246,0.10)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Database size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)' }}>
              Database Connection
            </h3>
            <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>
              MongoDB connection status
            </p>
          </div>
          <button
            onClick={fetchDbStatus}
            disabled={dbLoading}
            style={{
              padding: '7px 14px', borderRadius: 10, border: '1px solid var(--glass-border)',
              background: 'var(--bg-surface)', cursor: dbLoading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
              color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!dbLoading) e.currentTarget.style.background = 'var(--slate-200)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
          >
            <RefreshCw size={13} style={{
              transition: 'transform 0.4s',
              transform: dbPulse ? 'rotate(360deg)' : 'none',
            }} />
            Refresh
          </button>
        </div>

        <div style={sectionBody}>
          {dbLoading && !dbStatus ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12 }}>
              <Loader size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--emerald-600)' }} />
              <span style={{ fontFamily: 'var(--font-body)', color: 'var(--slate-500)', fontSize: 13 }}>Checking connection...</span>
            </div>
          ) : dbStatus && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', borderRadius: 14,
                background: dbStatus.connected
                  ? 'var(--status-green-bg, rgba(16,185,129,0.08))'
                  : 'var(--status-red-bg, rgba(239,68,68,0.08))',
                border: `1px solid ${dbStatus.connected
                  ? 'var(--status-green-border, rgba(16,185,129,0.25))'
                  : 'var(--status-red-border, rgba(239,68,68,0.25))'}`,
                animation: 'adminSettingsFadeUp 0.3s ease',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: dbStatus.connected ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {dbStatus.connected
                    ? <CheckCircle size={22} style={{ color: 'var(--status-green-txt, #059669)' }} />
                    : <XCircle size={22} style={{ color: '#ef4444' }} />
                  }
                </div>
                <div>
                  <p style={{
                    margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                    color: dbStatus.connected ? 'var(--status-green-txt, #059669)' : '#ef4444',
                  }}>
                    {dbStatus.status}
                  </p>
                  <p style={{ margin: '3px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>
                    {dbStatus.connected ? 'Your database is online and responsive' : 'Unable to reach the database'}
                  </p>
                </div>

                {/* Pulsing dot */}
                {dbStatus.connected && (
                  <div style={{
                    marginLeft: 'auto', width: 12, height: 12, borderRadius: '50%',
                    background: '#10b981', position: 'relative', flexShrink: 0,
                  }}>
                    <div style={{
                      position: 'absolute', inset: -4, borderRadius: '50%',
                      background: 'rgba(16,185,129,0.35)',
                      animation: 'adminPulse 2s ease-in-out infinite',
                    }} />
                  </div>
                )}
              </div>

              {/* Detail cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { icon: Server, label: 'Host', value: dbStatus.host },
                  { icon: HardDrive, label: 'Database', value: dbStatus.name },
                ].map(({ icon: Icon, label: lbl, value }, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', borderRadius: 12,
                    background: 'var(--bg-surface)', border: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <Icon size={16} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {lbl}
                      </p>
                      <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--slate-800)', wordBreak: 'break-all' }}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Chatbot Settings ───────────────────────────────────────── */}
      <div style={{ ...sectionCard, animationDelay: '0.06s' }}>
        <div style={sectionHeader}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'rgba(99,102,241,0.10)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={18} style={{ color: '#6366f1' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)' }}>
              Chatbot
            </h3>
            <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>
              Add API key and set the chatbot model
            </p>
          </div>
          <button
            onClick={fetchChatbotSettings}
            disabled={chatbotLoading || !user?._id}
            style={{
              padding: '7px 14px', borderRadius: 10, border: '1px solid var(--glass-border)',
              background: 'var(--bg-surface)', cursor: (chatbotLoading || !user?._id) ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600,
              color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s', opacity: (chatbotLoading || !user?._id) ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!chatbotLoading && user?._id) e.currentTarget.style.background = 'var(--slate-200)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
          >
            <RefreshCw size={13} style={{
              transition: 'transform 0.4s',
              transform: chatbotLoading ? 'rotate(360deg)' : 'none',
            }} />
            Refresh
          </button>
        </div>

        <div style={sectionBody}>
          {chatbotLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12 }}>
              <Loader size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--emerald-600)' }} />
              <span style={{ fontFamily: 'var(--font-body)', color: 'var(--slate-500)', fontSize: 13 }}>Loading chatbot settings...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveChatbotSettings} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: 14, borderRadius: 14,
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-surface)',
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--slate-800)' }}>
                    OpenRouter status
                  </div>
                  <div style={{ marginTop: 4, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>
                    API key is {chatbotHasApiKey ? 'configured' : 'not configured'}
                  </div>
                </div>
                <div style={{
                  padding: '6px 12px', borderRadius: 999,
                  border: '1px solid',
                  borderColor: chatbotHasApiKey ? 'var(--emerald-600)' : 'var(--glass-border)',
                  background: chatbotHasApiKey ? 'rgba(16,185,129,0.12)' : 'var(--bg-surface)',
                  color: chatbotHasApiKey ? 'var(--emerald-700)' : 'var(--slate-600)',
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                }}>
                  {chatbotHasApiKey ? 'Ready' : 'Needs Key'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={label}>Chatbot Provider</label>
                  <select
                    value={chatbotProvider}
                    onChange={(e) => setChatbotProvider(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="openrouter">OpenRouter</option>
                  </select>
                </div>
                <div>
                  <label style={label}>Model</label>
                  <input
                    value={chatbotModel}
                    onChange={(e) => setChatbotModel(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. google/gemma-3-27b-it:free"
                  />
                </div>
              </div>

              <div>
                <label style={label}>OpenRouter API Key</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={chatbotApiKey}
                    onChange={(e) => setChatbotApiKey(e.target.value)}
                    type={showChatbotKey ? 'text' : 'password'}
                    style={{ ...inputStyle, paddingRight: 44 }}
                    placeholder={chatbotHasApiKey ? 'Enter new key to replace…' : 'Enter API key…'}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowChatbotKey(!showChatbotKey)}
                    style={{
                      position: 'absolute', top: 0, right: 0, height: '100%',
                      width: 44, border: 'none', background: 'transparent',
                      cursor: 'pointer', color: 'var(--slate-500)'
                    }}
                    title={showChatbotKey ? 'Hide key' : 'Show key'}
                  >
                    {showChatbotKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={chatbotSaving || !user?._id}
                  style={{ ...btnPrimary, opacity: (chatbotSaving || !user?._id) ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!chatbotSaving && user?._id) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  {chatbotSaving ? (
                    <Loader size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                  ) : (
                    <Save size={14} />
                  )}
                  {chatbotSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── 2. Profile Picture ──────────────────────────────────────────── */}
      <div style={{ ...sectionCard, animationDelay: '0.08s' }}>
        <div style={sectionHeader}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'rgba(16,185,129,0.10)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={18} style={{ color: 'var(--emerald-600)' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)' }}>
              Profile Picture
            </h3>
            <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>
              Update your admin avatar
            </p>
          </div>
        </div>

        <div style={{ ...sectionBody, display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          {/* Avatar preview */}
          <div
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{
              width: 100, height: 100, borderRadius: 24,
              overflow: 'hidden', border: '3px solid var(--glass-border)',
              background: 'linear-gradient(135deg, var(--emerald-600), var(--forest-900))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.3s, box-shadow 0.3s',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
            >
              {(preview || currentPic) ? (
                <img
                  src={preview || currentPic}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: '#fff', fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              )}
            </div>

            {/* Camera overlay */}
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--emerald-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--bg-card)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s',
            }}>
              <Camera size={14} style={{ color: '#fff' }} />
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--slate-800)' }}>
              {user?.username || 'Admin'}
            </p>
            <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>
              {user?.email || '—'}
            </p>
            <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--slate-400)' }}>
              JPG, PNG or GIF — max 5 MB
            </p>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  ...btnPrimary,
                  background: 'var(--bg-surface)',
                  color: 'var(--slate-700)',
                  border: '1px solid var(--glass-border)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--slate-200)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
              >
                Choose File
              </button>
              {picFile && (
                <button
                  onClick={handlePicUpload}
                  disabled={picLoading}
                  style={{ ...btnPrimary, opacity: picLoading ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!picLoading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  {picLoading ? (
                    <Loader size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                  ) : (
                    <Save size={14} />
                  )}
                  {picLoading ? 'Uploading...' : 'Save Picture'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Change Password ──────────────────────────────────────────── */}
      <div style={{ ...sectionCard, animationDelay: '0.16s' }}>
        <div style={sectionHeader}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'rgba(234,179,8,0.10)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} style={{ color: '#ca8a04' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)' }}>
              Change Password
            </h3>
            <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>
              Keep your account secure
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} style={sectionBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 460 }}>
            {/* Current password */}
            <div>
              <label style={label}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}>
                  <Lock size={15} />
                </div>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  style={{ ...inputStyle, paddingLeft: 38, paddingRight: 38 }}
                  onFocus={e => { e.target.style.borderColor = 'var(--emerald-600)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 4, border: 'none', background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer', borderRadius: 6 }}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label style={label}>New Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}>
                  <Lock size={15} />
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Enter new password"
                  style={{ ...inputStyle, paddingLeft: 38, paddingRight: 38 }}
                  onFocus={e => { e.target.style.borderColor = 'var(--emerald-600)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 4, border: 'none', background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer', borderRadius: 6 }}
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength meter */}
              {newPw && (
                <div style={{ marginTop: 8, animation: 'adminSettingsFadeUp 0.25s ease' }}>
                  <div style={{
                    display: 'flex', gap: 4, marginBottom: 4,
                  }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= pwStrength.level ? pwStrength.color : 'var(--slate-200)',
                        transition: 'background 0.3s, transform 0.2s',
                        transform: i <= pwStrength.level ? 'scaleY(1.2)' : 'scaleY(1)',
                      }} />
                    ))}
                  </div>
                  <p style={{
                    margin: 0, fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
                    color: pwStrength.color, transition: 'color 0.3s',
                  }}>
                    {pwStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={label}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}>
                  <Lock size={15} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                  style={{
                    ...inputStyle,
                    paddingLeft: 38, paddingRight: 38,
                    borderColor: confirmPw && confirmPw !== newPw ? '#ef4444' : undefined,
                  }}
                  onFocus={e => { e.target.style.borderColor = confirmPw && confirmPw !== newPw ? '#ef4444' : 'var(--emerald-600)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = confirmPw && confirmPw !== newPw ? '#ef4444' : 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 4, border: 'none', background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer', borderRadius: 6 }}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirmPw && confirmPw !== newPw && (
                <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-body)', fontSize: 11, color: '#ef4444', animation: 'adminSettingsFadeUp 0.2s ease' }}>
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit */}
            <div style={{ paddingTop: 4 }}>
              <button
                type="submit"
                disabled={pwLoading}
                style={{ ...btnPrimary, opacity: pwLoading ? 0.7 : 1 }}
                onMouseEnter={e => { if (!pwLoading) e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                {pwLoading ? (
                  <Loader size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <Lock size={14} />
                )}
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── 4. Create Admin Account ─────────────────────────────────────── */}
      <div style={{ ...sectionCard, animationDelay: '0.24s' }}>
        <div style={sectionHeader}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'rgba(99,102,241,0.10)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <UserPlus size={18} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--slate-900)' }}>
              Create Admin Account
            </h3>
            <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)' }}>
              Only admins can create other admin accounts
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateAdmin} style={sectionBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 460 }}>
            {/* Username */}
            <div>
              <label style={label}>Username *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}>
                  <UserIcon size={15} />
                </div>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  placeholder="Enter username"
                  style={{ ...inputStyle, paddingLeft: 38 }}
                  onFocus={e => { e.target.style.borderColor = 'var(--emerald-600)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label style={label}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}>
                  <UserIcon size={15} />
                </div>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="Enter full name"
                  style={{ ...inputStyle, paddingLeft: 38 }}
                  onFocus={e => { e.target.style.borderColor = 'var(--emerald-600)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={label}>Email *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}>
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="Enter email address"
                  style={{ ...inputStyle, paddingLeft: 38 }}
                  onFocus={e => { e.target.style.borderColor = 'var(--emerald-600)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={label}>Password *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}>
                  <Lock size={15} />
                </div>
                <input
                  type={showAdminPw ? 'text' : 'password'}
                  value={adminPw}
                  onChange={e => setAdminPw(e.target.value)}
                  placeholder="Enter password"
                  style={{ ...inputStyle, paddingLeft: 38, paddingRight: 38 }}
                  onFocus={e => { e.target.style.borderColor = 'var(--emerald-600)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPw(!showAdminPw)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 4, border: 'none', background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer', borderRadius: 6 }}
                >
                  {showAdminPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={label}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}>
                  <Lock size={15} />
                </div>
                <input
                  type={showAdminConfirmPw ? 'text' : 'password'}
                  value={adminConfirmPw}
                  onChange={e => setAdminConfirmPw(e.target.value)}
                  placeholder="Re-enter password"
                  style={{
                    ...inputStyle,
                    paddingLeft: 38, paddingRight: 38,
                    borderColor: adminConfirmPw && adminConfirmPw !== adminPw ? '#ef4444' : undefined,
                  }}
                  onFocus={e => { e.target.style.borderColor = adminConfirmPw && adminConfirmPw !== adminPw ? '#ef4444' : 'var(--emerald-600)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = adminConfirmPw && adminConfirmPw !== adminPw ? '#ef4444' : 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminConfirmPw(!showAdminConfirmPw)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 4, border: 'none', background: 'transparent', color: 'var(--slate-400)', cursor: 'pointer', borderRadius: 6 }}
                >
                  {showAdminConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {adminConfirmPw && adminConfirmPw !== adminPw && (
                <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-body)', fontSize: 11, color: '#ef4444', animation: 'adminSettingsFadeUp 0.2s ease' }}>
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit */}
            <div style={{ paddingTop: 4 }}>
              <button
                type="submit"
                disabled={adminLoading}
                style={{ ...btnPrimary, background: '#6366f1', opacity: adminLoading ? 0.7 : 1 }}
                onMouseEnter={e => { if (!adminLoading) e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                {adminLoading ? (
                  <Loader size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <UserPlus size={14} />
                )}
                {adminLoading ? 'Creating...' : 'Create Admin Account'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes adminSettingsFadeUp {
          from { opacity: 0; transform: translateY(12px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes adminPulse {
          0%, 100% { transform: scale(1); opacity: 0.6 }
          50%      { transform: scale(1.8); opacity: 0 }
        }
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>

      <ToastContainer />
    </div>
  );
};

export default AdminSettings;
