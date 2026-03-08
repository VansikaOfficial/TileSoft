import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const location = useLocation();
  const isCustomer = user.role === 'customer';

  useEffect(() => {
    // Redirect customers to customer dashboard if they land on /dashboard
    if (isCustomer && location.pathname === '/dashboard') {
      navigate('/customer/dashboard');
    }
  }, [isCustomer, location.pathname]);

  if (isCustomer) {
    return (
      <div className="customer-layout">
        <Navbar />
        <div style={{ minHeight:'calc(100vh - 96px)', background:'#f8fafc' }}>{children}</div>
        {/* Footer */}
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
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}
