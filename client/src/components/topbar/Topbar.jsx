import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./topbar.css";
import { Context } from "../../context/Context";
import Logo from "../logo/Logo";
import MobileSidebar from "../mobileSidebar/MobileSidebar";
import { Settings, LogOut, Leaf } from "lucide-react";

export default function Topbar({ adminMode }) {
  const navigate = useNavigate();
  const { user, isVerified, theme, dispatch } = useContext(Context);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const profileRef = useRef(null);
  const PF = "http://localhost:5000/images/";
  const getAvatarSrc = (src) =>
    !src ? null :
      src.startsWith("http://") || src.startsWith("https://") ? src : PF + src;

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
  }

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!showAdminDropdown || !adminMode) return;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowAdminDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAdminDropdown, adminMode]);

  const handleProfileClick = () => {
    if (adminMode) {
      setShowAdminDropdown(!showAdminDropdown);
    } else {
      dispatch({ type: "SHOW_VMODAL" });
    }
  }

  const handleHamburger = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <div className="top glass-panel">
        <div className="topLeft">
          <button className="topHamburger" onClick={handleHamburger}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="topLogoTrigger">
            <Logo />
          </div>
        </div>
        <div className="topCenter">
          <ul className="topList">
            <li className="topListItem">
              <Link className="link" to="/">
                HOME
              </Link>
            </li>
            <li className="topListItem">
              <Link className="link" to="/about">
                ABOUT
              </Link>
            </li>
            <li className="topListItem">
              <Link className="link" to="/contact">
                CONTACT
              </Link>
            </li>
            <li className="topListItem">
              <Link className="link" to="/write">
                WRITE
              </Link>
            </li>

            {user && (user.isAdmin || user.role === "expert") && (
              <li className="topListItem">
                <Link className="link" to="/events">
                  EVENTS
                </Link>
              </li>
            )}

            {user && user.role === 'expert' && !user.isAdmin && (
              <li className="topListItem">
                <Link className="link" to="/answer-questions">
                  ANSWER Q&A
                </Link>
              </li>
            )}
            {user && user.isAdmin && (
              <li className="topListItem">
                <Link className="link" to="/admin">
                  ADMIN
                </Link>
              </li>
            )}
            {user && (
              <li className="topListItem" onClick={handleLogout}>
                LOGOUT
              </li>
            )}
          </ul>
        </div>
        <div className="topRight">
          {user ? (
            <div style={{ position: "relative" }} ref={profileRef}>
              {adminMode ? (
                <>
                  <div 
                    onClick={handleProfileClick} 
                    style={{
                      cursor: "pointer",
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '5px 12px 5px 5px', borderRadius: 14,
                      background: showAdminDropdown ? 'var(--mint-100)' : 'var(--bg-surface)',
                      border: '1px solid var(--glass-border)',
                      transition: 'all 0.2s',
                    }}
                    className="topProfileBtn"
                  >
                    {user?.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={user?.username}
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
                  {showAdminDropdown && (
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
                        onClick={() => { setShowAdminDropdown(false); navigate('/admin?tab=settings'); }}
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
                        onClick={() => { setShowAdminDropdown(false); navigate('/'); }}
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
                        onClick={() => { setShowAdminDropdown(false); handleLogout(); }}
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
                </>
              ) : (
                <div onClick={handleProfileClick} style={{ cursor: "pointer" }} className="topProfileBtn">
                  {user?.profilePic ? (
                    <img
                      className="topImg"
                      src={getAvatarSrc(user.profilePic)}
                      alt="Profile"
                      onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                    />
                  ) : null}
                  <div className="topImgDefault" style={{ display: user?.profilePic ? "none" : "flex" }}>
                    <i className="fas fa-user"></i>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ul className="topList">
              <li className="topListItem">
                <Link className="link" to="/login">
                  LOGIN
                </Link>
              </li>
              <li className="topListItem">
                <Link className="link" to="/register">
                  REGISTER
                </Link>
              </li>
            </ul>
          )}
          <div className="themeToggle" onClick={() => dispatch({ type: "TOGGLE_THEME" })}>
            {theme === "light" ? (
              <i className="fas fa-moon"></i>
            ) : (
              <i className="fas fa-sun"></i>
            )}
          </div>
        </div>
      </div>
      <MobileSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
    </>
  );
}