import "./mobileSidebar.css";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { Context } from "../../context/Context";
import Logo from "../logo/Logo";

export default function MobileSidebar({ isOpen, setIsOpen }) {
  const { user, dispatch } = useContext(Context);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    setIsOpen(false);
  };

  return (
    <div className={`navSidebarContainer ${isOpen ? "open" : ""}`}>
      <div className="navSidebarBackdrop" onClick={() => setIsOpen(false)}></div>
      <div className="navSidebarWrapper">
        <div className="navSidebarHeader">
          <Logo />
          <p className="navSidebarSubtitle">Community Management</p>
        </div>

        <div className="navSidebarContent">
          <div className="navSidebarSection">
            <h4 className="navSidebarSectionTitle">MAIN NAVIGATION</h4>
            <ul className="navSidebarList">
              <li className="navSidebarListItem">
                <Link className="link" to="/" onClick={() => setIsOpen(false)}>
                  <i className="fas fa-th-large"></i> Overview
                </Link>
              </li>
              <li className="navSidebarListItem">
                <Link className="link" to="/write" onClick={() => setIsOpen(false)}>
                  <i className="fas fa-plus-circle"></i> Create Post
                </Link>
              </li>
            </ul>
          </div>

          <div className="navSidebarSection">
            <h4 className="navSidebarSectionTitle">GROUP PARTS</h4>
            <ul className="navSidebarList">
              <li className="navSidebarListItem">
                <Link className="link" to="/marketplace" onClick={() => setIsOpen(false)}>
                  <i className="fas fa-shopping-bag"></i> Marketplace
                </Link>
              </li>
              <li className="navSidebarListItem">
                <Link className="link" to="/ask-expert" onClick={() => setIsOpen(false)}>
                  <i className="fas fa-comments"></i> Ask an Expert
                </Link>
              </li>
              <li className="navSidebarListItem">
                <Link className="link" to="/events" onClick={() => setIsOpen(false)}>
                  <i className="fas fa-calendar-alt"></i> Events
                </Link>
              </li>
            </ul>
          </div>

          <div className="navSidebarSection">
            <h4 className="navSidebarSectionTitle">ACCOUNT</h4>
            <ul className="navSidebarList">
              {user ? (
                <>
                  <li className="navSidebarListItem">
                    <Link className="link" to="/settings" onClick={() => setIsOpen(false)}>
                      <i className="fas fa-user-cog"></i> Settings
                    </Link>
                  </li>
                  {user && user.role === 'expert' && !user.isAdmin && (
                    <li className="navSidebarListItem">
                      <Link className="link" to="/answer-questions" onClick={() => setIsOpen(false)}>
                        <i className="fas fa-comment-dots"></i> Answer Q&A
                      </Link>
                    </li>
                  )}
                  {user && user.isAdmin && (
                    <li className="navSidebarListItem">
                      <Link className="link" to="/admin" onClick={() => setIsOpen(false)}>
                        <i className="fas fa-shield-alt"></i> Admin Panel
                      </Link>
                    </li>
                  )}
                  <li className="navSidebarListItem" onClick={handleLogout}>
                    <div className="link logoutBtn">
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </div>
                  </li>
                </>
              ) : (
                <>
                  <li className="navSidebarListItem">
                    <Link className="link" to="/login" onClick={() => setIsOpen(false)}>
                      <i className="fas fa-sign-in-alt"></i> Sign In
                    </Link>
                  </li>
                  <li className="navSidebarListItem">
                    <Link className="link" to="/register" onClick={() => setIsOpen(false)}>
                      <i className="fas fa-user-plus"></i> Join Now
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="navSidebarFooter">
          <div className="navSidebarStatus">
            <span className="statusIcon pulse"></span>
            <span>System Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
