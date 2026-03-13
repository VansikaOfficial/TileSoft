import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const location = useLocation();
  const isCustomer = user.role === 'customer';

  // Sidebar collapsed state — default open on desktop, closed on mobile
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);

  // Close sidebar automatically when navigating on mobile
  useEffect(() => {
    if (window.innerWidth < 768) setCollapsed(true);
  }, [location.pathname]);

  // Redirect customers to customer dashboard if they land on /dashboard
  useEffect(() => {
    if (isCustomer && location.pathname === '/dashboard') {
      navigate('/customer/dashboard');
    }
  }, [isCustomer, location.pathname]);

  if (isCustomer) {
    return (
      <div className="customer-layout">
        <Navbar />
        <div style={{ minHeight:'calc(100vh - 96px)', background:'#f8fafc' }}>{children}</div>
        <div style={{ background:'#0f172a', color:'#64748b', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
          <span>© 2026 TileSoft — Premium Tile Solutions</span>
          <div style={{ display:'flex', gap:16 }}>
            <a href="mailto:tilesoft05@gmail.com" style={{ color:'#64748b', textDecoration:'none' }}>📧 tilesoft05@gmail.com</a>
            <a href="https://wa.me/918531034528" target="_blank" rel="noreferrer" style={{ color:'#64748b', textDecoration:'none' }}>📱 +91 85310 34528</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay — tap outside to close sidebar */}
      {!collapsed && window.innerWidth < 768 && (
        <div
          onClick={() => setCollapsed(true)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99 }}
        />
      )}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className="main-content"
        style={{ marginLeft: collapsed ? 0 : undefined, transition:'margin 0.25s' }}
      >
        {children}
      </div>
    </div>
  );
}