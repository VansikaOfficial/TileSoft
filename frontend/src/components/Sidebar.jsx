import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/products', label: 'Products', icon: '🧱' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/invoices', label: 'Invoices', icon: '🧾' },
  { path: '/employees', label: 'Employees', icon: '👤' },
  { path: '/suppliers', label: 'Suppliers', icon: '🏭' },
  { path: '/attendance', label: 'Attendance', icon: '📅' },
  { path: '/reports', label: 'Reports', icon: '📈' },
  { path: '/gst-report', label: 'GST Report', icon: '📋', roles: ['admin','manager'] },
  { divider: true },
  { path: '/wastage-calculator', label: 'Wastage Calc', icon: '🧮' },
  { path: '/dynamic-pricing', label: 'Dynamic Pricing', icon: '💲' },
  { path: '/tile-gallery', label: 'Tile Gallery', icon: '🖼️' },
  { path: '/room-visualizer', label: 'Room Visualizer', icon: '🏠' },
  { path: '/project-estimator', label: 'Project Estimator', icon: '🧮' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isMobile = window.innerWidth < 768;

  return (
    <>
      {/* ── Hamburger button — always visible when sidebar is closed ── */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            position: 'fixed',
            top: 14,
            left: 14,
            zIndex: 200,
            background: '#1e293b',
            border: 'none',
            borderRadius: 8,
            color: 'white',
            fontSize: 20,
            width: 40,
            height: 40,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
          title="Open menu"
        >
          ☰
        </button>
      )}

      {/* ── Sidebar panel ── */}
      <div
        className="sidebar"
        style={{
          position: isMobile ? 'fixed' : 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 100,
          transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Header with close button */}
        <div className="sidebar-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div className="sidebar-logo">TileSoft</div>
            <div className="sidebar-subtitle">Smart ERP System</div>
          </div>
          {/* Close / collapse button */}
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 18,
              width: 34,
              height: 34,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Nav items */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            if (item.divider) return (
              <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
            );
            return (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="user-email">{user.email || 'user@tilesoft.com'}</div>
              <div className="user-role">{user.role || 'Admin'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>➜ Logout</button>
        </div>
      </div>

    </>
  );
}