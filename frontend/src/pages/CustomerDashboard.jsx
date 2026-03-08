import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.invoices.getAll().then(res => {
      const all = res.data?.invoices || res.data || [];
      const mine = all.filter(inv =>
        inv.customer_id === user.id ||
        inv.customer_name === user.name ||
        (inv.notes && inv.notes.includes(user.name))
      );
      setInvoices(mine);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalSpent = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const pending = invoices.filter(i => ['pending', 'partial'].includes(i.status));
  const pendingAmt = pending.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const quotations = invoices.filter(i => i.status === 'quotation');
  const recent = invoices.slice(0, 5);

  const statusColor = { paid:'#10b981', pending:'#f97316', partial:'#6366f1', overdue:'#ef4444', quotation:'#3b82f6' };
  const statusBg = { paid:'#d1fae5', pending:'#fff7ed', partial:'#eef2ff', overdue:'#fee2e2', quotation:'#dbeafe' };

  return (
    <div style={{ padding:28 }}>
      {/* Welcome Banner */}
      <div style={{ background:'linear-gradient(135deg,#1e293b,#1e3a5f)', borderRadius:16, padding:24, marginBottom:24, color:'white', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:24, fontWeight:900, marginBottom:4 }}>Welcome back, {user.name?.split(' ')[0]}! 👋</div>
          <div style={{ opacity:0.7, fontSize:14 }}>Here's your TileSoft account summary</div>
          <div style={{ marginTop:12, display:'flex', gap:8 }}>
            <button onClick={()=>navigate('/tile-gallery')} style={{ padding:'8px 18px', background:'#6366f1', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>🖼️ Browse Tiles</button>
            <button onClick={()=>navigate('/project-estimator')} style={{ padding:'8px 18px', background:'rgba(255,255,255,0.15)', color:'white', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>🧮 Get Estimate</button>
          </div>
        </div>
        <div style={{ fontSize:64, opacity:0.3 }}>🧱</div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Orders', value:invoices.length, icon:'🧾', color:'#6366f1', bg:'#eef2ff' },
          { label:'Total Spent', value:`₹${totalSpent.toLocaleString('en-IN',{maximumFractionDigits:0})}`, icon:'💰', color:'#10b981', bg:'#f0fdf4' },
          { label:'Pending Payment', value:`₹${pendingAmt.toLocaleString('en-IN',{maximumFractionDigits:0})}`, icon:'⏳', color:'#f97316', bg:'#fff7ed' },
          { label:'Active Quotes', value:quotations.length, icon:'📋', color:'#3b82f6', bg:'#dbeafe' },
        ].map(c => (
          <div key={c.label} style={{ background:c.bg, borderRadius:12, padding:16, borderLeft:`4px solid ${c.color}` }}>
            <div style={{ fontSize:11, fontWeight:600, color:c.color, marginBottom:4 }}>{c.icon} {c.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }}>
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header" style={{ justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span>🧾</span><span className="card-title">Recent Orders</span>
            </div>
            <button onClick={()=>navigate('/customer/invoices')} style={{ fontSize:12, color:'#6366f1', fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>View All →</button>
          </div>
          {loading ? <div className="loading">Loading...</div> : recent.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🧾</div><p>No orders yet</p><button onClick={()=>navigate('/tile-gallery')} className="btn btn-primary" style={{ marginTop:12 }}>Browse Tiles</button></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {recent.map(inv => (
                    <tr key={inv.id}>
                      <td><strong style={{ color:'#6366f1' }}>{inv.invoice_number}</strong></td>
                      <td style={{ fontSize:13, color:'#64748b' }}>{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                      <td><strong>₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</strong></td>
                      <td><span style={{ background:statusBg[inv.status]||'#f1f5f9', color:statusColor[inv.status]||'#64748b', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, textTransform:'uppercase' }}>{inv.status}</span></td>
                      <td><button onClick={()=>navigate('/customer/invoices')} style={{ background:'#eef2ff', border:'none', borderRadius:6, color:'#6366f1', padding:'4px 10px', fontSize:12, cursor:'pointer', fontWeight:600 }}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div>
          {/* Pending Payments Alert */}
          {pending.length > 0 && (
            <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:16, marginBottom:14 }}>
              <div style={{ fontWeight:700, color:'#c2410c', marginBottom:8 }}>⚠️ Pending Payments ({pending.length})</div>
              {pending.map(inv => (
                <div key={inv.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                  <span style={{ color:'#64748b' }}>{inv.invoice_number}</span>
                  <strong style={{ color:'#c2410c' }}>₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</strong>
                </div>
              ))}
              <button onClick={()=>{ window.open(`https://wa.me/918531034528?text=${encodeURIComponent(`Hi TileSoft! I'd like to make payment for my pending invoices. Customer: ${user.name}`)}`, '_blank'); }} style={{ width:'100%', marginTop:8, padding:'8px', background:'#f97316', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>
                📱 Pay via WhatsApp
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card" style={{ marginBottom:14 }}>
            <div className="card-header"><span>⚡</span><span className="card-title">Quick Actions</span></div>
            <div className="card-body" style={{ padding:12 }}>
              {[
                { label:'Browse Tile Gallery', icon:'🖼️', path:'/tile-gallery', color:'#6366f1' },
                { label:'Visualize in My Room', icon:'🏠', path:'/room-visualizer', color:'#10b981' },
                { label:'Estimate Full Project', icon:'🧮', path:'/project-estimator', color:'#f97316' },
                { label:'Calculate Wastage', icon:'📐', path:'/wastage-calculator', color:'#8b5cf6' },
              ].map(a => (
                <button key={a.path} onClick={()=>navigate(a.path)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', marginBottom:6, fontSize:13, fontWeight:600, color:'#374151', textAlign:'left' }}>
                  <span style={{ fontSize:18 }}>{a.icon}</span>
                  {a.label}
                  <span style={{ marginLeft:'auto', color:a.color }}>→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="card">
            <div className="card-header"><span>📞</span><span className="card-title">Contact TileSoft</span></div>
            <div className="card-body" style={{ padding:12 }}>
              <div style={{ fontSize:13, color:'#64748b', marginBottom:10 }}>Need help? We're here for you!</div>
              <a href="https://wa.me/918531034528" target="_blank" rel="noreferrer" style={{ display:'block', padding:'9px', background:'#25d366', color:'white', borderRadius:8, fontWeight:600, fontSize:13, textAlign:'center', textDecoration:'none', marginBottom:6 }}>📱 +91 85310 34528</a>
              <a href="mailto:tilesoft05@gmail.com" style={{ display:'block', padding:'9px', background:'#eef2ff', color:'#6366f1', borderRadius:8, fontWeight:600, fontSize:13, textAlign:'center', textDecoration:'none' }}>📧 tilesoft05@gmail.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
