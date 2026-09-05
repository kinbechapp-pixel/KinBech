import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const location = useLocation();

  const navSections = [
    {
      title: 'Overview',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
      ],
    },
    {
      title: 'Marketplace',
      items: [
        { path: '/users', label: 'Users', icon: '👥' },
        { path: '/shops', label: 'Shops', icon: '🏪', badge: 3 },
        { path: '/listings', label: 'Listings', icon: '📦' },
      ],
    },
    {
      title: 'Trust & Safety',
      items: [
        { path: '/reports', label: 'Reports', icon: '🚩', badge: 7 },
        { path: '/reviews', label: 'Reviews', icon: '⭐' },
      ],
    },
    {
      title: 'System',
      items: [
        { path: '/notifications', label: 'Notifications', icon: '🔔' },
        { path: '/settings', label: 'Settings & Roles', icon: '⚙️' },
      ],
    },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🛒</span>
            <div>
              <h1>KinBech</h1>
              <p className="logo-subtitle">Admin Console</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.title} className="nav-section">
              <div className="nav-section-title">{section.title}</div>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Admin'}</div>
              <div className="user-role">Super Admin</div>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="page-info">
            <h1>{getPageTitle(location.pathname)}</h1>
            <p className="page-description">{getPageDescription(location.pathname)}</p>
          </div>
          <div className="top-bar-actions">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search users, shops, listings..."
                className="search-input"
              />
            </div>
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button className="notification-btn">
              <span className="notification-icon">🔔</span>
              <span className="notification-badge">3</span>
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

const pageTitleMap = {
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/shops': 'Shops',
  '/listings': 'Listings',
  '/reports': 'Reports',
  '/reviews': 'Reviews',
  '/notifications': 'Notifications',
  '/settings': 'Settings & Roles',
};

const pageDescriptionMap = {
  '/dashboard': 'Overview of platform health and key metrics',
  '/users': 'Manage user accounts and permissions',
  '/shops': 'Manage shop verification and business profiles',
  '/listings': 'Moderate product listings and content',
  '/reports': 'Review and resolve user reports',
  '/reviews': 'Moderate ratings and written reviews',
  '/notifications': 'Send platform-wide announcements',
  '/settings': 'Configure system settings and admin roles',
};

function getPageTitle(path) {
  return pageTitleMap[path] || 'Dashboard';
}

function getPageDescription(path) {
  return pageDescriptionMap[path] || '';
}

export default Layout;