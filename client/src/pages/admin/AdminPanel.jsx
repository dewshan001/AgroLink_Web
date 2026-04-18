import React, { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './AdminPanel.css';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Store,
  LogOut,
  X,
  Leaf,
  MessageSquare,
  Sprout,
  AlertTriangle,
  Menu,
  Moon,
  Sun,
  Calendar,
} from 'lucide-react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import SidebarItem from '../../components/admin/SidebarItem.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import UserTable from '../../components/admin/UserTable.jsx';
import BlogModeration from '../../components/admin/BlogModeration.jsx';
import DiseaseRegistry from '../../components/admin/DiseaseRegistry.jsx';
import MarketplaceManagement from '../../components/admin/MarketplaceManagement.jsx';
import AdminSettings from '../../components/admin/AdminSettings.jsx';
import AnswerQuestions from '../answerQuestions/AnswerQuestions.jsx';
import AdminEvents from '../../components/admin/AdminEvents.jsx';
import PendingExpertVerification from '../../components/admin/PendingExpertVerification.jsx';
import { Context } from '../../context/Context.js';
import Logo from '../../components/logo/Logo.jsx';

const TOPBAR_HEIGHT = 70;
const SIDEBAR_WIDTH = 260;

export default function AdminPanel() {
  const { user, adminSidebarOpen, theme, dispatch } = useContext(Context);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'dashboard');
  const navigate = useNavigate();
  const PF = 'http://localhost:5000/images/';
  const [stats, setStats] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = React.useRef(null);
  const [isMobile, setIsMobile] = useState(() => !window.matchMedia('(min-width: 1024px)').matches);

  // Track mobile vs desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsMobile(!e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfileMenu]);

  // Fetch real dashboard stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/users/admin/stats");
        const data = res.data;
        const realStats = [
          { title: "Total Users", value: data.totalUsers.toLocaleString(), change: data.userChange, icon: Users, color: "bg-blue-500" },
          { title: "Total Posts", value: data.totalPosts.toLocaleString(), change: data.postChange, icon: FileText, color: "bg-green-500" },
        ];
        setStats(realStats);
        setTotalRecords(data.totalUsers + data.totalPosts);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
        // Fallback stats on error
        setStats([
          { title: "Total Users", value: "—", change: "0%", icon: Users, color: "bg-blue-500" },
          { title: "Total Posts", value: "—", change: "0%", icon: FileText, color: "bg-green-500" },
        ]);
      }
    };
    fetchStats();
  }, []);

  // Sync activeTab with URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Auto-open sidebar on large screens (both on mount and on resize)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    if (mq.matches) dispatch({ type: 'SET_ADMIN_SIDEBAR', payload: true });
    const handle = (e) => {
      dispatch({ type: 'SET_ADMIN_SIDEBAR', payload: e.matches });
    };
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, [dispatch]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    dispatch({ type: 'SET_ADMIN_TAB', payload: tab });
    // Close sidebar on mobile after selecting
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      dispatch({ type: 'SET_ADMIN_SIDEBAR', payload: false });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length || 1}, 1fr)`, gap: 20 }}>
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
            <div>
              <UserTable />
            </div>
          </div>
        );
      case 'users':
        return <UserTable />;
      case 'blogs':
        return <BlogModeration />;
      case 'diseases':
        return <DiseaseRegistry />;
      case 'marketplace':
        return <MarketplaceManagement />;
      case 'chatbot_qa':
        return <AnswerQuestions />;
      case 'events':
        return <AdminEvents />;
      case 'expert_verification':
        return <PendingExpertVerification />;
      case 'settings':
        return <AdminSettings />;
      default:
        return (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 20,
            border: '1px solid var(--glass-border)',
            padding: 64,
            textAlign: 'center',
            color: 'var(--slate-600)',
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 500,
          }}>
            Coming Soon
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'users': return 'User Management';
      case 'chatbot_qa': return 'Chatbot Q&A';
      case 'blogs': return 'Blog Moderation';
      case 'diseases': return 'Disease Database';
      case 'marketplace': return 'Marketplace';
      case 'events': return 'Event Management';
      case 'settings': return 'Settings';
      default: return 'AgroLink Admin';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return `${totalRecords} total records`;
      case 'users': return 'Manage registered users';
      case 'chatbot_qa': return 'Answer pending chatbot questions';
      case 'blogs': return 'Review and moderate posts';
      case 'diseases': return 'Browse disease entries';
      case 'marketplace': return 'Monitor listings and orders';
      case 'events': return 'Manage events and registrations';
      case 'settings': return 'Database, profile & security';
      default: return '';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-snow)',
      display: 'flex',
      fontFamily: 'var(--font-body)',
      color: 'var(--slate-900)',
    }}>

      {/* Mobile overlay — closes sidebar when clicking outside (only on mobile) */}
      {adminSidebarOpen && isMobile && (
        <div
          style={{ position: 'fixed', inset: 0, top: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 30 }}
          onClick={() => dispatch({ type: 'SET_ADMIN_SIDEBAR', payload: false })}
        />
      )}

      {/* Sidebar — glass-panel matching the Topbar design */}
      <aside
        className="adminSidebar"
        style={{
          width: SIDEBAR_WIDTH,
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--glass-zen)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid var(--glass-border)',
          boxShadow: '4px 0 32px rgba(6,78,59,0.1)',
          transform: adminSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >

        {/* Logo header — same height as Topbar, same glass styling = one seamless bar */}
        <div style={{
          height: TOPBAR_HEIGHT,
          minHeight: TOPBAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 0 20px',
          borderBottom: '1px solid var(--glass-border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <Logo />
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_ADMIN_SIDEBAR', payload: false })}
            className="themeToggle"
            aria-label="Close sidebar"
          >
            <X size={17} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '20px 12px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="adminSidebarNav">
          {/* Section label */}
          <p style={{
            padding: '0 14px',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--slate-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 6,
            fontFamily: 'var(--font-display)',
          }}>Navigation</p>

          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
          <SidebarItem icon={Users} label="User Management" active={activeTab === 'users'} onClick={() => handleTabChange('users')} />
          <SidebarItem icon={MessageSquare} label="Chatbot Q&A" active={activeTab === 'chatbot_qa'} onClick={() => handleTabChange('chatbot_qa')} />
          <SidebarItem icon={Calendar} label="Events" active={activeTab === 'events'} onClick={() => handleTabChange('events')} />
          <SidebarItem icon={FileText} label="Blog Moderation" active={activeTab === 'blogs'} onClick={() => handleTabChange('blogs')} />
          <SidebarItem icon={Store} label="Marketplace" active={activeTab === 'marketplace'} onClick={() => handleTabChange('marketplace')} />
          <SidebarItem icon={Leaf} label="Disease Data" active={activeTab === 'diseases'} onClick={() => handleTabChange('diseases')} />
          <SidebarItem icon={AlertTriangle} label="Expert Verification" active={activeTab === 'expert_verification'} onClick={() => handleTabChange('expert_verification')} />

          <div style={{ margin: '16px 0 6px', height: 1, background: 'var(--glass-border)' }} />

          <p style={{
            padding: '0 14px',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--slate-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 6,
            fontFamily: 'var(--font-display)',
          }}>System</p>

          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} />
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--glass-border)' }}>
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 14,
              background: 'transparent',
              border: 'none',
              color: 'var(--slate-600)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--slate-600)';
            }}
            onClick={() => dispatch({ type: 'LOGOUT' })}
          >
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.08)', flexShrink: 0,
            }}>
              <LogOut size={17} />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>


      {/* Main content — offset when sidebar is open on desktop */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'padding-left 0.3s var(--ease-zen)',
        paddingLeft: adminSidebarOpen ? SIDEBAR_WIDTH : 0,
      }}>
        {/* ── Admin Top Bar ──────────────────────────────────────────── */}
        <div style={{
          height: TOPBAR_HEIGHT,
          minHeight: TOPBAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'var(--glass-zen)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--glass-border)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}>
          {/* Left: hamburger + page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {!adminSidebarOpen && (
              <button
                onClick={() => dispatch({ type: 'SET_ADMIN_SIDEBAR', payload: true })}
                style={{
                  padding: 8, borderRadius: 10, border: 'none',
                  background: 'transparent', color: 'var(--slate-600)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--mint-100)'; e.currentTarget.style.color = 'var(--emerald-600)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slate-600)'; }}
              >
                <Menu size={20} />
              </button>
            )}
            <div>
              <h1 style={{
                margin: 0, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700,
                color: 'var(--slate-900)', lineHeight: 1.2,
              }}>
                {getPageTitle()}
              </h1>
              <p style={{
                margin: 0, fontFamily: 'var(--font-body)', fontSize: 12,
                color: 'var(--slate-500)',
              }}>
                {getPageSubtitle()}
              </p>
            </div>
          </div>

          {/* Center: navigation links */}
          <ul style={{
            display: 'flex', alignItems: 'center', gap: 0, listStyle: 'none',
            margin: 0, padding: 0, fontFamily: 'var(--font-display)',
          }}>
            {[
              { label: 'HOME', to: '/' },
              { label: 'ABOUT', to: '/about' },
              { label: 'CONTACT', to: '/contact' },
              { label: 'WRITE', to: '/write' },
              { label: 'ASK AN EXPERT', to: '/ask-expert' },
              { label: 'ADMIN', to: '/admin' },
            ].map((item) => (
              <li key={item.to} style={{ padding: '0 14px' }}>
                <Link
                  to={item.to}
                  className="link"
                  style={{
                    fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
                    color: 'var(--slate-600)', textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--emerald-600)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--slate-600)'}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li style={{ padding: '0 14px', cursor: 'pointer' }}
              onClick={() => dispatch({ type: 'LOGOUT' })}
            >
              <span
                style={{
                  fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
                  color: 'var(--slate-600)', transition: 'color 0.2s', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--emerald-600)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--slate-600)'}
              >
                LOGOUT
              </span>
            </li>
          </ul>

          {/* Right: theme toggle + profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
              style={{
                padding: 8, borderRadius: 10, border: 'none',
                background: 'transparent', color: 'var(--slate-500)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--mint-100)'; e.currentTarget.style.color = 'var(--emerald-600)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slate-500)'; }}
              title="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Profile chip with dropdown */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setShowProfileMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '5px 12px 5px 5px', borderRadius: 14,
                  background: showProfileMenu ? 'var(--mint-100)' : 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt=""
                    style={{ width: 30, height: 30, borderRadius: 10, objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 30, height: 30, borderRadius: 10,
                    background: 'linear-gradient(135deg, var(--emerald-600), var(--forest-900))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                  }}>
                    {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                  color: 'var(--slate-800)',
                }}>
                  {user?.username || 'Admin'}
                </span>
              </div>

              {/* Dropdown menu */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  minWidth: 200, padding: 8, borderRadius: 16,
                  background: 'var(--glass-zen)', backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  animation: 'fadeIn 0.2s ease',
                }}>
                  {/* User info */}
                  <div style={{
                    padding: '10px 12px', borderBottom: '1px solid var(--glass-border)',
                    marginBottom: 6,
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--slate-900)' }}>
                      {user?.username || 'Admin'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>
                      {user?.email || 'Administrator'}
                    </div>
                  </div>

                  {/* Settings */}
                  <button
                    onClick={() => { setShowProfileMenu(false); handleTabChange('settings'); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 10, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                      color: 'var(--slate-700)', transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--mint-100)'; e.currentTarget.style.color = 'var(--emerald-600)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slate-700)'; }}
                  >
                    <Settings size={15} /> Settings
                  </button>

                  {/* Back to Site */}
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/'); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 10, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                      color: 'var(--slate-700)', transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--mint-100)'; e.currentTarget.style.color = 'var(--emerald-600)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--slate-700)'; }}
                  >
                    <Leaf size={15} /> Back to Site
                  </button>

                  <div style={{ height: 1, background: 'var(--glass-border)', margin: '6px 0' }} />

                  {/* Logout */}
                  <button
                    onClick={() => { setShowProfileMenu(false); dispatch({ type: 'LOGOUT' }); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 10, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                      color: '#ef4444', transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}