import { useNavigate, useLocation } from 'react-router-dom';

const CUSTOMER_LINKS = [
  { path: '/customer/dashboard', label: 'My Dashboard', icon: '🏠' },
  { path: '/tile-gallery', label: 'Tile Gallery', icon: '🖼️' },
  { path: '/customer/invoices', label: 'My Orders', icon: '🧾' },
  { path: '/room-visualizer', label: 'Room Visualizer', icon: '🏠' },
  { path: '/project-estimator', label: 'Project Estimator', icon: '🧮' },
  { path: '/customer/profile', label: 'My Profile', icon: '👤' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ background:'#0f172a', borderBottom:'1px solid rgba(255,255,255,0.08)', position:'sticky', top:0, zIndex:100 }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', padding:'0 24px', height:56 }}>
        <div style={{ fontSize:20, fontWeight:900, color:'#60a5fa', letterSpacing:1, marginRight:32 }}>TileSoft</div>
        <div style={{ fontSize:12, color:'#64748b', flex:1 }}>Premium Tile Solutions</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:13 }}>
            {(user.name||'C')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{user.name||user.email}</div>
            <div style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:0.5 }}>Customer</div>
          </div>
          <button onClick={handleLogout} style={{ padding:'6px 14px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#f87171', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            🚪 Logout
          </button>
        </div>
      </div>
      {/* Nav links */}
      <div style={{ display:'flex', padding:'0 24px', gap:2, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        {CUSTOMER_LINKS.map(link => (
          <button key={link.path} onClick={()=>navigate(link.path)} style={{ padding:'10px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, fontWeight: location.pathname===link.path?700:500, color: location.pathname===link.path?'#60a5fa':'#94a3b8', borderBottom: location.pathname===link.path?'2px solid #60a5fa':'2px solid transparent', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}>
            {link.icon} {link.label}
          </button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <a href={`https://wa.me/918531034528`} target="_blank" rel="noreferrer" style={{ padding:'6px 14px', background:'#25d366', border:'none', borderRadius:8, color:'white', fontSize:12, fontWeight:600, cursor:'pointer', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
            📱 WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  );
}
