import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const location = useLocation();
  const isCustomer = user.role === 'customer';

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setCollapsed(false);
      else setCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [location.pathname]);

  useEffect(() => {
    if (isCustomer && location.pathname === '/dashboard') {
      navigate('/customer/dashboard');
    }
  }, [isCustomer, location.pathname]);

  if (isCustomer) {
    return (
      <div className="customer-layout">
        <Navbar />
        <div style={{ minHeight: 'calc(100vh - 96px)', background: '#f8fafc' }}>{children}</div>
        <div style={{ background:'#0f172a', color:'#64748b', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, flexWrap:'wrap', gap:8 }}>
          <span>© 2026 TileSoft — Premium Tile Solutions</span>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <a href="mailto:tilesoft05@gmail.com" style={{ color:'#64748b', textDecoration:'none' }}>📧 tilesoft05@gmail.com</a>
            <a href="https://wa.me/918531034528" target="_blank" rel="noreferrer" style={{ color:'#64748b', textDecoration:'none' }}>📱 +91 85310 34528</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {!collapsed && isMobile && (
        <div onClick={() => setCollapsed(true)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99 }} />
      )}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} />
      <div
        className="main-content"
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 0 : 240),
          width: isMobile ? '100%' : (collapsed ? '100%' : 'calc(100% - 240px)'),
          transition: 'margin-left 0.25s ease, width 0.25s ease',
          minHeight: '100vh',
          paddingTop: isMobile ? 60 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}