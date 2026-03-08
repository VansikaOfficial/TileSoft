import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const formatCurrency = (n) => `₹${parseFloat(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`;

export default function GSTReport() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [activeTab, setActiveTab] = useState('summary');
  const printRef = useRef();
  const today = new Date().toLocaleDateString('en-US', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });

  useEffect(() => {
    api.invoices.getAll().then(res => {
      setInvoices(res.data?.invoices || res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Filter paid invoices only for GST
  const paidInvoices = invoices.filter(inv => ['paid','partial'].includes(inv.status));

  const filtered = paidInvoices.filter(inv => {
    const d = new Date(inv.invoice_date);
    const yearMatch = d.getFullYear() === selectedYear;
    const monthMatch = selectedMonth === 'all' || d.getMonth() === parseInt(selectedMonth);
    return yearMatch && monthMatch;
  });

  // Monthly breakdown
  const monthlyData = MONTHS.map((month, mi) => {
    const monthInvs = paidInvoices.filter(inv => {
      const d = new Date(inv.invoice_date);
      return d.getFullYear() === selectedYear && d.getMonth() === mi;
    });
    const taxable = monthInvs.reduce((s, inv) => s + parseFloat(inv.subtotal || 0), 0);
    const cgst = taxable * 0.14;
    const sgst = taxable * 0.14;
    return { month, invoices: monthInvs.length, taxable, cgst, sgst, total: taxable + cgst + sgst };
  });

  // HSN-wise summary
  const hsnMap = {};
  filtered.forEach(inv => {
    const hsn = 'HSN6908'; // Default tile HSN
    if (!hsnMap[hsn]) hsnMap[hsn] = { hsn, desc:'Ceramic/Porcelain Tiles', taxable:0, cgst:0, sgst:0 };
    hsnMap[hsn].taxable += parseFloat(inv.subtotal || 0);
    hsnMap[hsn].cgst += parseFloat(inv.subtotal || 0) * 0.14;
    hsnMap[hsn].sgst += parseFloat(inv.subtotal || 0) * 0.14;
  });
  const hsnRows = Object.values(hsnMap);

  // Totals
  const totalTaxable = filtered.reduce((s, inv) => s + parseFloat(inv.subtotal || 0), 0);
  const totalCgst = totalTaxable * 0.14;
  const totalSgst = totalTaxable * 0.14;
  const totalGst = totalCgst + totalSgst;
  const grandTotal = totalTaxable + totalGst;

  const yearTotal = monthlyData.reduce((s,m) => ({ taxable: s.taxable+m.taxable, cgst: s.cgst+m.cgst, sgst: s.sgst+m.sgst, total: s.total+m.total }), { taxable:0, cgst:0, sgst:0, total:0 });

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>GST Report ${selectedYear}</title><style>
      *{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;padding:20px;font-size:12px;}
      h1{font-size:20px;font-weight:800;color:#1e293b;margin-bottom:2px;}
      .badge{background:#eef2ff;color:#4338ca;padding:3px 10px;border-radius:20px;font-weight:700;font-size:11px;}
      table{width:100%;border-collapse:collapse;margin-bottom:16px;}
      thead{background:#1e293b;color:white;}
      th{padding:8px 10px;text-align:left;font-size:11px;}
      td{padding:7px 10px;border-bottom:1px solid #f1f5f9;}
      .total-row{background:#f8fafc;font-weight:700;}
      .grand{background:#eef2ff;font-weight:800;font-size:13px;color:#4338ca;}
      @media print{body{padding:10px;}}
    </style></head><body>${printRef.current.innerHTML}</body></html>`);
    win.document.close(); win.print();
  };

  const tabStyle = (t) => ({ padding:'8px 18px', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer', background: activeTab===t ? '#6366f1' : '#f1f5f9', color: activeTab===t ? 'white' : '#64748b' });

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">GST Filing Report</div><div className="page-subtitle">GSTR-1 ready data — CGST & SGST summary</div></div>
        <div className="page-date">Current Date<strong>{today}</strong></div>
      </div>
      <div className="page-body">
        {/* Summary Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            { label:'Taxable Value', value: formatCurrency(totalTaxable), color:'#6366f1', bg:'#eef2ff', icon:'🧾' },
            { label:'CGST (14%)', value: formatCurrency(totalCgst), color:'#f97316', bg:'#fff7ed', icon:'📊' },
            { label:'SGST (14%)', value: formatCurrency(totalSgst), color:'#10b981', bg:'#f0fdf4', icon:'📊' },
            { label:'Total GST', value: formatCurrency(totalGst), color:'#ef4444', bg:'#fef2f2', icon:'💰' },
          ].map(c => (
            <div key={c.label} style={{ background:c.bg, borderRadius:12, padding:16, borderLeft:`4px solid ${c.color}` }}>
              <div style={{ fontSize:12, fontWeight:600, color:c.color, marginBottom:4 }}>{c.icon} {c.label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ display:'flex', gap:12, alignItems:'center', padding:'14px 16px', flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#64748b' }}>Year:</label>
              <select className="form-select" value={selectedYear} onChange={e => setSelectedYear(+e.target.value)} style={{ width:100 }}>
                {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#64748b' }}>Month:</label>
              <select className="form-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ width:130 }}>
                <option value="all">All Months</option>
                {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
              <div style={{ display:'flex', gap:8 }}>
                {['summary','monthly','hsn','gstr1'].map(t => (
                  <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>
                    {t === 'summary' ? '📊 Summary' : t === 'monthly' ? '📅 Monthly' : t === 'hsn' ? '🏷️ HSN-wise' : '📋 GSTR-1'}
                  </button>
                ))}
              </div>
              <button onClick={handlePrint} style={{ padding:'8px 16px', background:'#1e293b', color:'white', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>🖨️ Print</button>
            </div>
          </div>
        </div>

        <div ref={printRef}>
          {/* Print header */}
          <div style={{ display:'none' }} className="print-header">
            <h1>TileSoft — GST Report {selectedYear}</h1>
            <div>GSTIN: 29AABCT1234A1Z5 | Period: {selectedMonth === 'all' ? 'Full Year' : MONTHS[selectedMonth]} {selectedYear}</div>
          </div>

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="card">
              <div className="card-header"><span>📊</span><span className="card-title">GST Summary — {selectedMonth === 'all' ? selectedYear : `${MONTHS[selectedMonth]} ${selectedYear}`}</span></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>#</th><th>Invoice No.</th><th>Date</th><th>Customer</th><th>Taxable Value</th><th>CGST (14%)</th><th>SGST (14%)</th><th>Invoice Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="9" style={{ textAlign:'center', padding:24 }}>Loading...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon">📊</div><p>No paid invoices for this period</p></div></td></tr>
                    ) : (
                      <>
                        {filtered.map((inv, i) => {
                          const taxable = parseFloat(inv.subtotal || 0);
                          const cgst = taxable * 0.14;
                          const sgst = taxable * 0.14;
                          return (
                            <tr key={inv.id}>
                              <td style={{ color:'#94a3b8', fontSize:12 }}>{i+1}</td>
                              <td><strong style={{ color:'#6366f1' }}>{inv.invoice_number}</strong></td>
                              <td style={{ fontSize:13 }}>{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                              <td><strong>{inv.customer_name || 'Walk-in'}</strong></td>
                              <td>{formatCurrency(taxable)}</td>
                              <td style={{ color:'#f97316' }}>{formatCurrency(cgst)}</td>
                              <td style={{ color:'#10b981' }}>{formatCurrency(sgst)}</td>
                              <td><strong style={{ color:'#6366f1' }}>{formatCurrency(parseFloat(inv.total_amount))}</strong></td>
                              <td><span style={{ background:'#d1fae5', color:'#065f46', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>PAID</span></td>
                            </tr>
                          );
                        })}
                        <tr style={{ background:'#eef2ff', fontWeight:800, fontSize:13 }}>
                          <td colSpan="4" style={{ padding:'10px' }}>TOTAL ({filtered.length} invoices)</td>
                          <td style={{ padding:'10px' }}>{formatCurrency(totalTaxable)}</td>
                          <td style={{ padding:'10px', color:'#f97316' }}>{formatCurrency(totalCgst)}</td>
                          <td style={{ padding:'10px', color:'#10b981' }}>{formatCurrency(totalSgst)}</td>
                          <td style={{ padding:'10px', color:'#6366f1' }}>{formatCurrency(grandTotal)}</td>
                          <td></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Monthly Tab */}
          {activeTab === 'monthly' && (
            <div className="card">
              <div className="card-header"><span>📅</span><span className="card-title">Monthly GST Breakdown — {selectedYear}</span></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Month</th><th>Invoices</th><th>Taxable Value</th><th>CGST (14%)</th><th>SGST (14%)</th><th>Total Tax</th><th>Invoice Total</th></tr></thead>
                  <tbody>
                    {monthlyData.map((m, i) => (
                      <tr key={i} style={{ opacity: m.invoices === 0 ? 0.4 : 1 }}>
                        <td><strong>{m.month} {selectedYear}</strong></td>
                        <td><span style={{ background: m.invoices > 0 ? '#eef2ff' : '#f1f5f9', color: m.invoices > 0 ? '#6366f1' : '#94a3b8', padding:'2px 10px', borderRadius:20, fontWeight:700, fontSize:12 }}>{m.invoices}</span></td>
                        <td>{formatCurrency(m.taxable)}</td>
                        <td style={{ color:'#f97316' }}>{formatCurrency(m.cgst)}</td>
                        <td style={{ color:'#10b981' }}>{formatCurrency(m.sgst)}</td>
                        <td style={{ color:'#ef4444', fontWeight:600 }}>{formatCurrency(m.cgst + m.sgst)}</td>
                        <td><strong>{formatCurrency(m.total)}</strong></td>
                      </tr>
                    ))}
                    <tr style={{ background:'#eef2ff', fontWeight:800, fontSize:13 }}>
                      <td style={{ padding:'10px' }}>ANNUAL TOTAL</td>
                      <td style={{ padding:'10px' }}>{paidInvoices.filter(inv => new Date(inv.invoice_date).getFullYear() === selectedYear).length}</td>
                      <td style={{ padding:'10px' }}>{formatCurrency(yearTotal.taxable)}</td>
                      <td style={{ padding:'10px', color:'#f97316' }}>{formatCurrency(yearTotal.cgst)}</td>
                      <td style={{ padding:'10px', color:'#10b981' }}>{formatCurrency(yearTotal.sgst)}</td>
                      <td style={{ padding:'10px', color:'#ef4444' }}>{formatCurrency(yearTotal.cgst + yearTotal.sgst)}</td>
                      <td style={{ padding:'10px', color:'#6366f1' }}>{formatCurrency(yearTotal.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* HSN-wise Tab */}
          {activeTab === 'hsn' && (
            <div className="card">
              <div className="card-header"><span>🏷️</span><span className="card-title">HSN-wise GST Summary</span></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>HSN Code</th><th>Description</th><th>GST Rate</th><th>Taxable Value</th><th>CGST (14%)</th><th>SGST (14%)</th><th>Total GST</th></tr></thead>
                  <tbody>
                    {hsnRows.length === 0 ? (
                      <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon">🏷️</div><p>No data for selected period</p></div></td></tr>
                    ) : (
                      <>
                        {hsnRows.map((r, i) => (
                          <tr key={i}>
                            <td><span style={{ fontFamily:'monospace', fontWeight:700, color:'#6366f1', background:'#eef2ff', padding:'2px 8px', borderRadius:6 }}>{r.hsn}</span></td>
                            <td>{r.desc}</td>
                            <td><span style={{ background:'#fef3c7', color:'#92400e', padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:700 }}>28%</span></td>
                            <td>{formatCurrency(r.taxable)}</td>
                            <td style={{ color:'#f97316' }}>{formatCurrency(r.cgst)}</td>
                            <td style={{ color:'#10b981' }}>{formatCurrency(r.sgst)}</td>
                            <td><strong style={{ color:'#ef4444' }}>{formatCurrency(r.cgst + r.sgst)}</strong></td>
                          </tr>
                        ))}
                        <tr style={{ background:'#eef2ff', fontWeight:800 }}>
                          <td colSpan="3" style={{ padding:'10px' }}>TOTAL</td>
                          <td style={{ padding:'10px' }}>{formatCurrency(hsnRows.reduce((s,r)=>s+r.taxable,0))}</td>
                          <td style={{ padding:'10px', color:'#f97316' }}>{formatCurrency(hsnRows.reduce((s,r)=>s+r.cgst,0))}</td>
                          <td style={{ padding:'10px', color:'#10b981' }}>{formatCurrency(hsnRows.reduce((s,r)=>s+r.sgst,0))}</td>
                          <td style={{ padding:'10px', color:'#ef4444' }}>{formatCurrency(hsnRows.reduce((s,r)=>s+r.cgst+r.sgst,0))}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GSTR-1 Tab */}
          {activeTab === 'gstr1' && (
            <div className="card">
              <div className="card-header"><span>📋</span><span className="card-title">GSTR-1 Format — B2C Summary</span></div>
              <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, padding:'10px 14px', margin:'0 16px 14px', fontSize:13, color:'#92400e' }}>
                ℹ️ This is GSTR-1 B2C (Business to Consumer) format. For B2B invoices with customer GSTIN, use HSN-wise tab.
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr style={{ background:'#1e293b', color:'white' }}>
                      <th>Sr.</th><th>Place of Supply</th><th>Rate</th><th>Taxable Value</th><th>CGST Amt</th><th>SGST Amt</th><th>Total GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>Karnataka (29)</td>
                      <td><span style={{ background:'#fef3c7', color:'#92400e', padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:700 }}>28%</span></td>
                      <td>{formatCurrency(totalTaxable)}</td>
                      <td style={{ color:'#f97316' }}>{formatCurrency(totalCgst)}</td>
                      <td style={{ color:'#10b981' }}>{formatCurrency(totalSgst)}</td>
                      <td><strong style={{ color:'#ef4444' }}>{formatCurrency(totalGst)}</strong></td>
                    </tr>
                    <tr style={{ background:'#eef2ff', fontWeight:800 }}>
                      <td colSpan="3" style={{ padding:'10px' }}>TOTAL</td>
                      <td style={{ padding:'10px' }}>{formatCurrency(totalTaxable)}</td>
                      <td style={{ padding:'10px', color:'#f97316' }}>{formatCurrency(totalCgst)}</td>
                      <td style={{ padding:'10px', color:'#10b981' }}>{formatCurrency(totalSgst)}</td>
                      <td style={{ padding:'10px', color:'#ef4444' }}>{formatCurrency(totalGst)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ padding:'12px 16px', background:'#f0fdf4', borderTop:'1px solid #a7f3d0', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {[
                  { label:'Total Invoices Filed', value: filtered.length },
                  { label:'Total Taxable Turnover', value: formatCurrency(totalTaxable) },
                  { label:'Total Tax Liability', value: formatCurrency(totalGst) },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{s.label}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:'#065f46' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
