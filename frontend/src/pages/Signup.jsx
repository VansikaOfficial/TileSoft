import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', role:'customer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [strength, setStrength] = useState(0);

  const calcStrength = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const handlePassword = (val) => {
    setForm(f => ({...f, password: val}));
    setStrength(calcStrength(val));
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#10b981'];

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('All fields are required'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await api.auth.register({ name: form.name, email: form.email, password: form.password, role: form.role });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (user.role === 'customer') navigate('/customer/dashboard');
      else navigate('/dashboard');
    } catch(e) {
      setError(e.response?.data?.message || 'Registration failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1e293b,#334155,#1e3a5f)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:440, background:'white', borderRadius:20, boxShadow:'0 25px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', padding:'28px 32px', textAlign:'center' }}>
          <div style={{ fontSize:28, fontWeight:900, color:'white', letterSpacing:1 }}>🧱 TileSoft</div>
          <div style={{ color:'rgba(255,255,255,0.8)', fontSize:13, marginTop:4 }}>Create your account</div>
        </div>

        <div style={{ padding:'28px 32px' }}>
          {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16, border:'1px solid #fecaca' }}>⚠️ {error}</div>}

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>Full Name *</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Enter your full name" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>Email Address *</label>
            <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="yourname@email.com" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>

          <div style={{ marginBottom:8 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>Password *</label>
            <input type="password" value={form.password} onChange={e=>handlePassword(e.target.value)} placeholder="Min 6 characters" style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>

          {/* Strength bar */}
          {form.password && (
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i<=strength ? strengthColors[strength] : '#e2e8f0', transition:'all 0.3s' }} />)}
              </div>
              <div style={{ fontSize:11, color:strengthColors[strength], fontWeight:600 }}>{strengthLabels[strength]}</div>
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>Confirm Password *</label>
            <input type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} placeholder="Re-enter password" style={{ width:'100%', padding:'10px 14px', border:`1.5px solid ${form.confirm && form.confirm!==form.password?'#ef4444':'#e2e8f0'}`, borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' }} />
            {form.confirm && form.confirm !== form.password && <div style={{ fontSize:11, color:'#ef4444', marginTop:3 }}>❌ Passwords don't match</div>}
            {form.confirm && form.confirm === form.password && <div style={{ fontSize:11, color:'#10b981', marginTop:3 }}>✅ Passwords match</div>}
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>Account Type</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { value:'customer', label:'🛍️ Customer', desc:'Browse & order tiles' },
                { value:'employee', label:'👷 Employee', desc:'Staff member' },
              ].map(r => (
                <div key={r.value} onClick={()=>setForm({...form,role:r.value})} style={{ padding:'10px 12px', borderRadius:8, border: form.role===r.value?'2px solid #6366f1':'1.5px solid #e2e8f0', background: form.role===r.value?'#eef2ff':'white', cursor:'pointer', textAlign:'center' }}>
                  <div style={{ fontSize:16 }}>{r.label.split(' ')[0]}</div>
                  <div style={{ fontSize:12, fontWeight:600, color: form.role===r.value?'#6366f1':'#374151' }}>{r.label.split(' ').slice(1).join(' ')}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:14 }}>
            {loading ? '⏳ Creating Account...' : '🚀 Create Account'}
          </button>

          <div style={{ textAlign:'center', fontSize:13, color:'#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#6366f1', fontWeight:700, textDecoration:'none' }}>Sign In →</Link>
          </div>

          <div style={{ marginTop:16, padding:'10px 14px', background:'#f8fafc', borderRadius:8, fontSize:11, color:'#94a3b8', textAlign:'center' }}>
            📞 +91 85310 34528 | 📧 tilesoft05@gmail.com
          </div>
        </div>
      </div>
    </div>
  );
}
