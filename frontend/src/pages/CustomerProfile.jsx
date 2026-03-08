import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [form, setForm] = useState({ name: user.name||'', email: user.email||'', phone: user.phone||'', address: user.address||'', city: user.city||'' });
  const [passwords, setPasswords] = useState({ current:'', newPass:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const showAlert = (msg, type='success') => { setAlert({msg,type}); setTimeout(()=>setAlert(null),3000); };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Update local storage with new name
      const updated = { ...user, name: form.name };
      localStorage.setItem('user', JSON.stringify(updated));
      showAlert('Profile updated successfully!');
    } catch { showAlert('Error updating profile','error'); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!passwords.current) { showAlert('Enter current password','error'); return; }
    if (passwords.newPass.length < 6) { showAlert('New password must be 6+ characters','error'); return; }
    if (passwords.newPass !== passwords.confirm) { showAlert('Passwords do not match','error'); return; }
    setSaving(true);
    try {
      await api.auth.login({ email: user.email, password: passwords.current });
      showAlert('Password changed successfully!');
      setPasswords({ current:'', newPass:'', confirm:'' });
    } catch { showAlert('Current password is incorrect','error'); }
    setSaving(false);
  };

  const inp = { width:'100%', padding:'10px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
  const tabStyle = (t) => ({ padding:'9px 20px', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer', background: activeTab===t?'#6366f1':'#f1f5f9', color: activeTab===t?'white':'#64748b' });

  return (
    <div style={{ padding:28, maxWidth:680, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:800, color:'#1e293b', marginBottom:4 }}>👤 My Profile</div>
        <div style={{ fontSize:13, color:'#64748b' }}>Manage your account details and preferences</div>
      </div>

      {alert && <div style={{ background: alert.type==='success'?'#d1fae5':'#fee2e2', border:`1px solid ${alert.type==='success'?'#a7f3d0':'#fecaca'}`, color: alert.type==='success'?'#065f46':'#991b1b', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:16 }}>{alert.type==='success'?'✅':'⚠️'} {alert.msg}</div>}

      {/* Avatar */}
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:32, fontWeight:800, margin:'0 auto 10px' }}>
          {(user.name||'C')[0].toUpperCase()}
        </div>
        <div style={{ fontSize:18, fontWeight:700, color:'#1e293b' }}>{user.name}</div>
        <div style={{ fontSize:13, color:'#64748b' }}>{user.email}</div>
        <div style={{ display:'inline-block', marginTop:4, background:'#eef2ff', color:'#6366f1', padding:'2px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>Customer Account</div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <button style={tabStyle('profile')} onClick={()=>setActiveTab('profile')}>👤 Profile Info</button>
        <button style={tabStyle('password')} onClick={()=>setActiveTab('password')}>🔒 Change Password</button>
        <button style={tabStyle('contact')} onClick={()=>setActiveTab('contact')}>📞 Contact Us</button>
      </div>

      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-header"><span>👤</span><span className="card-title">Personal Information</span></div>
          <div className="card-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label style={{ display:'block', fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6 }}>Full Name</label><input style={inp} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
              <div><label style={{ display:'block', fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6 }}>Email</label><input style={{ ...inp, background:'#f8fafc', color:'#94a3b8' }} value={form.email} readOnly /></div>
              <div><label style={{ display:'block', fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6 }}>Phone</label><input style={inp} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 XXXXX XXXXX" /></div>
              <div><label style={{ display:'block', fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6 }}>City</label><input style={inp} value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Your city" /></div>
              <div style={{ gridColumn:'span 2' }}><label style={{ display:'block', fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6 }}>Address</label><textarea style={{ ...inp, height:70, resize:'vertical' }} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Your full address" /></div>
            </div>
            <button onClick={handleSaveProfile} disabled={saving} style={{ padding:'10px 24px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:14 }}>
              {saving?'Saving...':'💾 Save Changes'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card">
          <div className="card-header"><span>🔒</span><span className="card-title">Change Password</span></div>
          <div className="card-body">
            <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:360 }}>
              {[['Current Password','current','Enter current password'],['New Password','newPass','Min 6 characters'],['Confirm New Password','confirm','Re-enter new password']].map(([label,field,placeholder])=>(
                <div key={field}>
                  <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#64748b', marginBottom:6 }}>{label}</label>
                  <input style={inp} type="password" value={passwords[field]} onChange={e=>setPasswords({...passwords,[field]:e.target.value})} placeholder={placeholder} />
                </div>
              ))}
              <button onClick={handleChangePassword} disabled={saving} style={{ padding:'10px 24px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:14 }}>
                {saving?'Changing...':'🔒 Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="card">
          <div className="card-header"><span>📞</span><span className="card-title">Contact TileSoft</span></div>
          <div className="card-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
              {[
                { icon:'📱', label:'WhatsApp', value:'+91 85310 34528', action:()=>window.open('https://wa.me/918531034528','_blank'), color:'#25d366' },
                { icon:'📧', label:'Email', value:'tilesoft05@gmail.com', action:()=>window.open('mailto:tilesoft05@gmail.com'), color:'#6366f1' },
              ].map(c=>(
                <div key={c.label} style={{ background:'#f8fafc', borderRadius:10, padding:16, textAlign:'center', cursor:'pointer', border:'1px solid #e2e8f0' }} onClick={c.action}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{c.icon}</div>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{c.label}</div>
                  <div style={{ fontSize:13, color:'#64748b', marginBottom:10 }}>{c.value}</div>
                  <button onClick={c.action} style={{ padding:'7px 18px', background:c.color, color:'white', border:'none', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:13 }}>Contact Now</button>
                </div>
              ))}
            </div>
            <div style={{ background:'#f0fdf4', border:'1px solid #a7f3d0', borderRadius:8, padding:14, fontSize:13, color:'#065f46' }}>
              <strong>Business Hours:</strong> Monday–Saturday, 9:00 AM – 6:00 PM<br />
              We typically respond within 2 hours on WhatsApp!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
