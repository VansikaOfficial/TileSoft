import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#fef2f2,#fff1f2)', padding:20 }}>
      <div style={{ textAlign:'center', maxWidth:420 }}>
        <div style={{ fontSize:80, marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:28, fontWeight:900, color:'#991b1b', marginBottom:8 }}>Access Denied</div>
        <div style={{ fontSize:15, color:'#64748b', marginBottom:8 }}>
          Sorry <strong>{user.name || 'User'}</strong>, your role <span style={{ background:'#fee2e2', color:'#991b1b', padding:'2px 10px', borderRadius:20, fontWeight:700, fontSize:13 }}>{user.role?.toUpperCase()}</span> doesn't have permission to view this page.
        </div>
        <div style={{ fontSize:13, color:'#94a3b8', marginBottom:28 }}>Contact your administrator to request access.</div>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <button onClick={() => navigate(-1)} style={{ padding:'10px 24px', background:'white', border:'1.5px solid #e2e8f0', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:14 }}>← Go Back</button>
          <button onClick={() => navigate('/dashboard')} style={{ padding:'10px 24px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:14 }}>🏠 Dashboard</button>
        </div>
      </div>
    </div>
  );
}
