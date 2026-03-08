import { useState, useEffect } from 'react';
import api from '../services/api';

export default function CustomerInvoices() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

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

  const statusColor = { paid:'#10b981', pending:'#f97316', partial:'#6366f1', overdue:'#ef4444', quotation:'#3b82f6' };
  const statusBg = { paid:'#d1fae5', pending:'#fff7ed', partial:'#eef2ff', overdue:'#fee2e2', quotation:'#dbeafe' };

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  const handlePrint = (inv) => {
    const win = window.open('', '_blank');
    const subtotal = parseFloat(inv.subtotal || 0);
    const cgst = subtotal * 0.14;
    const sgst = subtotal * 0.14;
    win.document.write(`<html><head><title>${inv.invoice_number}</title><style>
      *{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;padding:24px;font-size:12px;}
      .header{background:#1e293b;color:white;padding:16px 20px;border-radius:8px;margin-bottom:14px;display:flex;justify-content:space-between;}
      table{width:100%;border-collapse:collapse;margin-bottom:12px;}
      th{background:#f8fafc;padding:8px;text-align:left;font-size:11px;border-bottom:2px solid #e2e8f0;}
      td{padding:8px;border-bottom:1px solid #f1f5f9;}
      .total{text-align:right;font-size:13px;}
      .grand{font-size:16px;font-weight:800;color:#6366f1;}
    </style></head><body>
      <div class="header">
        <div><div style="font-size:20px;font-weight:900;">TileSoft</div><div style="opacity:0.7;font-size:11px;">tilesoft05@gmail.com | +91 85310 34528</div></div>
        <div style="text-align:right"><div style="font-size:16px;font-weight:700;">${inv.invoice_number}</div><div style="opacity:0.7">${new Date(inv.invoice_date).toLocaleDateString('en-IN')}</div></div>
      </div>
      <div style="margin-bottom:12px;padding:12px;background:#f8fafc;border-radius:8px;">
        <strong>Bill To:</strong> ${inv.customer_name || user.name}
      </div>
      <table>
        <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>
          ${(inv.items||[]).map((item,i)=>`<tr><td>${i+1}</td><td>${item.product_name}</td><td>${item.quantity} ${item.unit}</td><td>₹${item.rate}</td><td>₹${item.amount}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="total">
        <div>Subtotal: ₹${subtotal.toFixed(2)}</div>
        <div>CGST (14%): ₹${cgst.toFixed(2)}</div>
        <div>SGST (14%): ₹${sgst.toFixed(2)}</div>
        <div class="grand">Total: ₹${parseFloat(inv.total_amount).toLocaleString('en-IN')}</div>
      </div>
      <div style="margin-top:16px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px;">
        Thank you for your business! | TileSoft | tilesoft05@gmail.com | +91 85310 34528
      </div>
    </body></html>`);
    win.document.close(); win.print();
  };

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:'#1e293b', marginBottom:4 }}>🧾 My Orders & Invoices</div>
        <div style={{ fontSize:13, color:'#64748b' }}>View and download all your orders from TileSoft</div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[
          { value:'all', label:'All Orders' },
          { value:'paid', label:'✅ Paid' },
          { value:'pending', label:'⏳ Pending' },
          { value:'quotation', label:'📋 Quotations' },
          { value:'partial', label:'💰 Partial' },
        ].map(f => (
          <button key={f.value} onClick={()=>setFilter(f.value)} style={{ padding:'7px 16px', borderRadius:20, border: filter===f.value?'2px solid #6366f1':'1px solid #e2e8f0', background: filter===f.value?'#eef2ff':'white', color: filter===f.value?'#6366f1':'#64748b', fontWeight: filter===f.value?700:500, fontSize:13, cursor:'pointer' }}>
            {f.label} {f.value==='all'?`(${invoices.length})`:f.value==='paid'?`(${invoices.filter(i=>i.status==='paid').length})`:f.value==='pending'?`(${invoices.filter(i=>i.status==='pending').length})`:f.value==='quotation'?`(${invoices.filter(i=>i.status==='quotation').length})`:`(${invoices.filter(i=>i.status===f.value).length})`}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? <div className="loading">Loading your orders...</div> : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🧾</div><p>No {filter === 'all' ? '' : filter} orders found</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>#</th><th>Invoice No.</th><th>Date</th><th>Items</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((inv, i) => {
                  const total = parseFloat(inv.total_amount || 0);
                  const paid = parseFloat(inv.amount_paid || 0);
                  const balance = total - paid;
                  return (
                    <tr key={inv.id}>
                      <td style={{ color:'#94a3b8', fontSize:12 }}>{i+1}</td>
                      <td><strong style={{ color:'#6366f1' }}>{inv.invoice_number}</strong></td>
                      <td style={{ fontSize:13, color:'#64748b' }}>{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontSize:13 }}>{inv.items?.length || '—'} items</td>
                      <td><strong>₹{total.toLocaleString('en-IN')}</strong></td>
                      <td style={{ color:'#10b981', fontWeight:600 }}>₹{paid.toLocaleString('en-IN')}</td>
                      <td style={{ color: balance > 0 ? '#ef4444' : '#10b981', fontWeight:600 }}>₹{balance.toLocaleString('en-IN')}</td>
                      <td><span style={{ background:statusBg[inv.status]||'#f1f5f9', color:statusColor[inv.status]||'#64748b', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, textTransform:'uppercase' }}>{inv.status}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={()=>setSelected(inv)} style={{ background:'#eef2ff', border:'none', borderRadius:6, color:'#6366f1', padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:600 }}>👁️ View</button>
                          <button onClick={()=>handlePrint(inv)} style={{ background:'#f0fdf4', border:'none', borderRadius:6, color:'#10b981', padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:600 }}>🖨️</button>
                          {['pending','partial','overdue'].includes(inv.status) && (
                            <button onClick={()=>window.open(`https://wa.me/918531034528?text=${encodeURIComponent(`Hi TileSoft! I'd like to make payment for invoice ${inv.invoice_number}. Amount: ₹${balance.toLocaleString('en-IN')}. Customer: ${user.name}`)}`, '_blank')} style={{ background:'#dcfce7', border:'none', borderRadius:6, color:'#16a34a', padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:600 }}>💳 Pay</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div className="modal" style={{ maxWidth:580 }}>
            <div className="modal-header">
              <div className="modal-title">🧾 {selected.invoice_number}</div>
              <button className="modal-close" onClick={()=>setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                {[
                  ['Date', new Date(selected.invoice_date).toLocaleDateString('en-IN')],
                  ['Status', selected.status.toUpperCase()],
                  ['Total Amount', `₹${parseFloat(selected.total_amount).toLocaleString('en-IN')}`],
                  ['Amount Paid', `₹${parseFloat(selected.amount_paid||0).toLocaleString('en-IN')}`],
                ].map(([l,v])=>(
                  <div key={l} style={{ background:'#f8fafc', padding:'10px 12px', borderRadius:8 }}>
                    <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:2 }}>{l}</div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{v}</div>
                  </div>
                ))}
              </div>
              {selected.items && selected.items.length > 0 && (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead><tr style={{ background:'#f8fafc' }}><th style={{ padding:'8px', textAlign:'left', fontSize:11, color:'#94a3b8' }}>Product</th><th style={{ padding:'8px', fontSize:11, color:'#94a3b8' }}>Qty</th><th style={{ padding:'8px', fontSize:11, color:'#94a3b8' }}>Rate</th><th style={{ padding:'8px', fontSize:11, color:'#94a3b8' }}>Amount</th></tr></thead>
                  <tbody>
                    {selected.items.map((item,i)=>(
                      <tr key={i}><td style={{ padding:'8px', borderBottom:'1px solid #f1f5f9' }}>{item.product_name}</td><td style={{ padding:'8px', borderBottom:'1px solid #f1f5f9', textAlign:'center' }}>{item.quantity} {item.unit}</td><td style={{ padding:'8px', borderBottom:'1px solid #f1f5f9', textAlign:'center' }}>₹{item.rate}</td><td style={{ padding:'8px', borderBottom:'1px solid #f1f5f9', textAlign:'right', fontWeight:600, color:'#6366f1' }}>₹{item.amount}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ marginTop:12, padding:'10px 14px', background:'#eef2ff', borderRadius:8, textAlign:'right' }}>
                <div style={{ fontSize:12, color:'#64748b' }}>Total Amount</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#6366f1' }}>₹{parseFloat(selected.total_amount).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setSelected(null)}>Close</button>
              <button className="btn btn-primary" onClick={()=>handlePrint(selected)}>🖨️ Print Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
