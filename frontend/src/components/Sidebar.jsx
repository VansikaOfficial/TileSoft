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

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">TileSoft</div>
        <div className="sidebar-subtitle">Smart ERP System</div>
      </div>
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
  );
}