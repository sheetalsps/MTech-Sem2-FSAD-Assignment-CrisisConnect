import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setMenuOpen((open) => !open);

  const navLinkClass = ({ isActive }) =>
    `nav-link${isActive ? ' nav-link-active' : ''}`;

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-header-top">
            <Link to="/" className="site-brand" onClick={() => setMenuOpen(false)}>
              CrisisConnect
            </Link>
            <button
              type="button"
              className={`nav-toggle${menuOpen ? ' nav-toggle-open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={toggleMenu}
            >
              <span className="nav-toggle-bar" aria-hidden />
              <span className="nav-toggle-bar" aria-hidden />
              <span className="nav-toggle-bar" aria-hidden />
            </button>
          </div>

          <nav
            id="primary-navigation"
            className={`main-nav${menuOpen ? ' main-nav-open' : ''}`}
            aria-label="Primary"
          >
            <div className="nav-section nav-section-primary">
              <span className="nav-section-label">Navigate</span>
              <NavLink to="/" className={navLinkClass} end>
                Home
              </NavLink>
              <NavLink to="/request" className={navLinkClass}>
                SOS request
              </NavLink>
              {user && (
                <NavLink to="/my-requests" className={navLinkClass}>
                  My requests
                </NavLink>
              )}
              {hasRole('volunteer') && (
                <NavLink to="/volunteer" className={navLinkClass}>
                  Volunteer hub
                </NavLink>
              )}
            </div>

            {(hasRole('staff', 'admin')) && (
              <div className="nav-section nav-section-ops">
                <span className="nav-section-label">Operations</span>
                <NavLink to="/incidents" className={navLinkClass}>
                  Incidents
                </NavLink>
                <NavLink to="/resources" className={navLinkClass}>
                  Resources
                </NavLink>
                <NavLink to="/volunteers" className={navLinkClass}>
                  Volunteers
                </NavLink>
                <NavLink to="/analytics" className={navLinkClass}>
                  Analytics
                </NavLink>
              </div>
            )}

            {hasRole('admin') && (
              <div className="nav-section nav-section-admin">
                <span className="nav-section-label">Administration</span>
                <NavLink to="/admin" className={navLinkClass}>
                  Users
                </NavLink>
              </div>
            )}

            <div className="nav-section nav-section-account">
              <span className="nav-section-label">Account</span>
              {user ? (
                <div className="nav-account-logged-in">
                  <span className="nav-user-name">{user.username}</span>
                  <span className="nav-user-role">{user.role}</span>
                  <button type="button" className="nav-logout" onClick={logout}>
                    Log out
                  </button>
                </div>
              ) : (
                <div className="nav-account-auth">
                  <NavLink to="/login" className={navLinkClass}>
                    Log in
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className={({ isActive }) =>
                      `nav-link nav-link-cta${isActive ? ' nav-link-active' : ''}`
                    }
                  >
                    Sign up
                  </NavLink>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main id="main-content" className="page-main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>CrisisConnect · Emergency coordination</p>
      </footer>
    </div>
  );
}
