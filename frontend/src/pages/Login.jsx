import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.auth.login(form);
      const { token, user } = res.data;
      if (rememberMe) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
    setLoading(false);
  };

  const quickLogin = (role) => {
    const creds = {
      admin: { email: 'admin@tilesoft.com', password: 'password' },
      manager: { email: 'sales@tilesoft.com', password: 'password' },
      staff: { email: 'warehouse@tilesoft.com', password: 'password' },
      customer: { email: 'customer@tilesoft.com', password: 'password' },
    };
    setForm(creds[role]);
  };

  const inp = { width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border 0.2s' };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'linear-gradient(135deg,#1e293b 0%,#334155 50%,#1e3a5f 100%)' }}>
      {/* Left branding panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px', color:'white' }} className="hide-mobile">
        <div style={{ fontSize:42, fontWeight:900, letterSpacing:2, marginBottom:8 }}>TileSoft</div>
        <div style={{ fontSize:18, opacity:0.8, marginBottom:40 }}>Smart ERP for Tile Industry</div>
        {[
          { icon:'🧾', title:'Smart Billing', desc:'GST-compliant invoices with CGST/SGST split' },
          { icon:'🏠', title:'Room Visualizer', desc:'Let customers see tiles in their space' },
          { icon:'📊', title:'Live Analytics', desc:'Revenue trends, forecasting & reports' },
          { icon:'👥', title:'Full Team Management', desc:'Employees, attendance & payroll' },
        ].map(f => (
          <div key={f.title} style={{ display:'flex', gap:14, marginBottom:20, alignItems:'flex-start' }}>
            <div style={{ fontSize:24, width:40, flexShrink:0 }}>{f.icon}</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{f.title}</div>
              <div style={{ opacity:0.7, fontSize:13 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Right login form */}
      <div style={{ width:460, display:'flex', alignItems:'center', justifyContent:'center', padding:32, background:'white', borderRadius:'24px 0 0 24px' }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:32, fontWeight:900, color:'#1e293b', letterSpacing:1 }}>TileSoft</div>
            <div style={{ color:'#94a3b8', fontSize:13, marginTop:4 }}>Smart ERP for Tile Industry</div>
          </div>

          <div style={{ fontSize:22, fontWeight:800, color:'#1e293b', marginBottom:4 }}>Welcome back 👋</div>
          <div style={{ color:'#94a3b8', fontSize:14, marginBottom:24 }}>Sign in to your account to continue</div>

          {error && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:6 }}>Email Address</label>
              <input style={inp} type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="you@company.com" required autoFocus />
            </div>

            <div style={{ marginBottom:8 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#374151', marginBottom:6 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input style={{ ...inp, paddingRight:42 }} type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#94a3b8' }}>{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#374151', cursor:'pointer' }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ width:14, height:14 }} />
                Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize:13, color:'#6366f1', fontWeight:600, textDecoration:'none' }}>Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} style={{ width:'100%', padding:13, background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing:0.5, transition:'all 0.2s' }}>
              {loading ? '⏳ Signing in...' : '🚀 Sign In'}
            </button>
          </form>

          <div style={{ margin:'20px 0', borderTop:'1px solid #f1f5f9', paddingTop:20 }}>
            <div style={{ fontSize:12, color:'#94a3b8', textAlign:'center', marginBottom:10, fontWeight:600 }}>QUICK LOGIN (TESTING)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { role:'admin', label:'👑 Admin', color:'#eef2ff', border:'#c7d2fe', text:'#4338ca' },
                { role:'manager', label:'📊 Manager', color:'#f0fdf4', border:'#a7f3d0', text:'#065f46' },
                { role:'staff', label:'🏭 Staff', color:'#fff7ed', border:'#fed7aa', text:'#c2410c' },
                { role:'customer', label:'👤 Customer', color:'#fdf4ff', border:'#e9d5ff', text:'#7c3aed' },
              ].map(q => (
                <button key={q.role} type="button" onClick={() => quickLogin(q.role)} style={{ padding:'8px', background:q.color, border:`1px solid ${q.border}`, borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', color:q.text }}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign:'center', fontSize:13, color:'#94a3b8' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color:'#6366f1', fontWeight:700, textDecoration:'none' }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
