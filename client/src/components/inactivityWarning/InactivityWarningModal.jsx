import { useContext } from "react";
import { Context } from "../../context/Context";
import "./inactivityWarning.css";

export default function InactivityWarningModal() {
  const { showInactivityWarning, handleExtendSession, handleAutoLogout } = useContext(Context);

  if (!showInactivityWarning) {
    return null;
  }

  return (
    <div className="inactivity-warning-overlay">
      <div className="inactivity-warning-modal">
        <div className="inactivity-warning-content">
          <div className="inactivity-warning-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#059669' }}>
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="inactivity-warning-title">Are you still there?</h2>
          
          <p className="inactivity-warning-message">
            Your session has been inactive for a while. To keep your account secure, we'll log you out soon. 
            Would you like to extend your session?
          </p>

          <div className="inactivity-warning-actions">
            <button className="btn-extend" onClick={handleExtendSession}>
              <span className="btn-text">Yes, keep me signed in</span>
            </button>
            <button className="btn-logout" onClick={handleAutoLogout}>
              <span className="btn-text">Logout Now</span>
            </button>
          </div>
          
          <p className="inactivity-warning-hint">Please make a selection to keep your account safe.</p>
        </div>
      </div>
    </div>
  );
}
