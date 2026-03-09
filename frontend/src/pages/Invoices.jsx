import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const todayISO = new Date().toISOString().split('T')[0];
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatCurrency = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const daysSince = (date) => date ? Math.floor((new Date() - new Date(date)) / 86400000) : 0;

const COMPANY = { name: 'TileSoft', tagline: 'Smart ERP for Tile Industry', gstin: '29AABCT1234A1Z5', address: '123 Tile Market, Industrial Area, Bangalore - 560001', phone: '+91 98765 43210', email: 'tilesoft05@gmail.com', upi: 'tilesoft@upi' };

const TERMS = `1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.\n3. Payment due within 30 days of invoice date.\n4. Late payment attracts 2% interest per month.\n5. Goods remain property of TileSoft until full payment received.`;

// ── STANDALONE HELPER (accessible by all components) ──
function getCustomerName(inv, customers = []) {
  if (inv.customer_name) return inv.customer_name;
  if (inv.walkin_name) return inv.walkin_name;
  const fromNotes = inv.notes?.match(/Walk-in: ([^|]+)/)?.[1]?.trim();
  if (fromNotes) return fromNotes;
  if (inv.customer_id) {
    const found = customers.find(c => c.id == inv.customer_id);
    if (found) return found.name || found.company_name || found.customer_name || found.email || '—';
  }
  return 'Walk-in Customer';
}

// ── HSN GST SUMMARY ──────────────────────────────────────
function HsnGstSummary({ items }) {
  const grouped = {};
  (items || []).forEach(item => {
    const hsn = item.hsn_code || 'HSN6908';
    const gstRate = 28;
    const taxable = parseFloat(item.amount || 0);
    if (!grouped[hsn]) grouped[hsn] = { hsn, gstRate, taxable: 0, cgst: 0, sgst: 0, total: 0 };
    grouped[hsn].taxable += taxable;
    grouped[hsn].cgst += taxable * 0.14;
    grouped[hsn].sgst += taxable * 0.14;
    grouped[hsn].total += taxable * 1.28;
  });
  const rows = Object.values(grouped);
  return (
    <div style={{ marginTop: 16, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ background: '#1e293b', color: 'white', padding: '8px 12px', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>HSN-WISE GST SUMMARY</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>
            {['HSN Code','Taxable Amt','GST Rate','CGST (14%)','SGST (14%)','Total Tax'].map(h => (
              <th key={h} style={{ padding: '6px 10px', textAlign: h === 'HSN Code' ? 'left' : 'right', color: '#64748b', fontWeight: 700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
              <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 700 }}>{r.hsn}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(r.taxable)}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{r.gstRate}%</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(r.cgst)}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(r.sgst)}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#6366f1' }}>{formatCurrency(r.cgst + r.sgst)}</td>
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid #6366f1', background: '#f8fafc', fontWeight: 700 }}>
            <td style={{ padding: '6px 10px' }}>Total</td>
            <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(rows.reduce((s,r)=>s+r.taxable,0))}</td>
            <td></td>
            <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(rows.reduce((s,r)=>s+r.cgst,0))}</td>
            <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(rows.reduce((s,r)=>s+r.sgst,0))}</td>
            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#6366f1' }}>{formatCurrency(rows.reduce((s,r)=>s+r.cgst+r.sgst,0))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── PRINT DOCUMENT ───────────────────────────────────────
function PrintDoc({ inv, mode, onClose, customers = [] }) {
  const printRef = useRef();
  const cgst = parseFloat(inv.subtotal || 0) * 0.14;
  const sgst = parseFloat(inv.subtotal || 0) * 0.14;
  const isDeliveryChallan = mode === 'challan';
  const isQuotation = inv.status === 'quotation';
  const docTitle = isDeliveryChallan ? 'DELIVERY CHALLAN' : isQuotation ? 'QUOTATION' : 'TAX INVOICE';
  const docNumber = isDeliveryChallan ? `DC-${inv.invoice_number}` : inv.invoice_number;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>${docTitle} ${docNumber}</title><style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:Arial,sans-serif;padding:20px;color:#1a1d23;font-size:13px;}
      .header{background:linear-gradient(135deg,#1e293b,#334155);color:white;padding:20px;border-radius:8px;margin-bottom:16px;}
      .header h1{font-size:26px;letter-spacing:2px;margin-bottom:2px;}
      .doc-badge{background:#6366f1;color:white;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;display:inline-block;}
      .doc-number{font-size:20px;font-weight:800;margin-top:4px;}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}
      .meta-box{background:#f8fafc;padding:14px;border-radius:8px;border-left:4px solid #6366f1;}
      .meta-box.green{border-left-color:#10b981;}
      .meta-label{font-size:10px;text-transform:uppercase;color:#94a3b8;letter-spacing:1px;font-weight:700;margin-bottom:6px;}
      table{width:100%;border-collapse:collapse;margin-bottom:14px;}
      thead{background:#1e293b;color:white;}
      thead th{padding:8px 10px;text-align:left;font-size:11px;}
      tbody td{padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;}
      tbody tr:nth-child(even){background:#f8fafc;}
      .totals{margin-left:auto;width:280px;}
      .total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px solid #f1f5f9;}
      .total-final{display:flex;justify-content:space-between;padding:10px 0;font-size:17px;font-weight:800;color:#6366f1;border-top:2px solid #6366f1;margin-top:6px;}
      .hsn-table{margin-top:14px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;}
      .hsn-header{background:#1e293b;color:white;padding:6px 10px;font-size:11px;font-weight:700;letter-spacing:1px;}
      .sig-section{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;}
      .sig-box{border-top:2px dashed #cbd5e1;padding-top:8px;text-align:center;font-size:11px;color:#64748b;}
      .terms{margin-top:14px;background:#f8fafc;border-radius:8px;padding:12px;font-size:11px;color:#64748b;}
      .terms h4{font-size:12px;color:#374151;margin-bottom:6px;}
      .footer{text-align:center;margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;}
      .challan-note{background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:10px;margin-bottom:14px;font-size:12px;color:#92400e;font-weight:600;}
      @media print{body{padding:10px;}}
    </style></head><body>${printRef.current.innerHTML}</body></html>`);
    win.document.close(); win.print();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 780, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <div className="modal-title">
            {isDeliveryChallan ? '🚚 Delivery Challan' : isQuotation ? '📋 Quotation Preview' : '🧾 Invoice Preview'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success" onClick={handlePrint}>🖨️ Print</button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <div ref={printRef} style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', color: 'white', padding: 20, borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 2 }}>{COMPANY.name}</div>
                <div style={{ opacity: 0.7, fontSize: 11, marginTop: 2 }}>{COMPANY.tagline}</div>
                <div style={{ opacity: 0.7, fontSize: 11 }}>GSTIN: {COMPANY.gstin}</div>
                <div style={{ opacity: 0.7, fontSize: 11 }}>{COMPANY.address}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ background: isDeliveryChallan ? '#f97316' : isQuotation ? '#10b981' : '#6366f1', padding: '3px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{docTitle}</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{docNumber}</div>
                <div style={{ opacity: 0.8, fontSize: 11 }}>Date: {formatDate(inv.invoice_date)}</div>
                {inv.due_date && <div style={{ opacity: 0.8, fontSize: 11 }}>Valid/Due: {formatDate(inv.due_date)}</div>}
              </div>
            </div>

            {isDeliveryChallan && (
              <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 6, padding: 10, marginBottom: 14, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
                🚚 DELIVERY CHALLAN — This document is not a tax invoice. For delivery purposes only.
              </div>
            )}

            {/* Customer + Payment Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, borderLeft: '4px solid #6366f1' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>
                  {isDeliveryChallan ? 'Deliver To' : 'Bill To'}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{getCustomerName(inv, customers)}</div>
                {inv.contact_person && <div style={{ fontSize: 12, color: '#64748b' }}>{inv.contact_person}</div>}
                {inv.walkin_phone && <div style={{ fontSize: 12, color: '#64748b' }}>📱 {inv.walkin_phone}</div>}
                {inv.address && <div style={{ fontSize: 12, color: '#64748b' }}>{inv.address}</div>}
                {inv.gst_number && <div style={{ fontSize: 12, color: '#64748b' }}>GSTIN: {inv.gst_number}</div>}
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 1, fontWeight: 700, marginBottom: 6 }}>
                  {isDeliveryChallan ? 'Delivery Info' : 'Payment Info'}
                </div>
                {!isDeliveryChallan && (
                  <div style={{ fontSize: 13, marginBottom: 4 }}>Status: <span style={{ fontWeight: 700, color: inv.status === 'paid' ? '#10b981' : '#f97316' }}>{inv.status?.toUpperCase()}</span></div>
                )}
                {isDeliveryChallan && <div style={{ fontSize: 13, color: '#64748b' }}>Transport: By Road</div>}
                {inv.payment_method && <div style={{ fontSize: 12 }}>Method: {inv.payment_method}</div>}
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>UPI: {COMPANY.upi}</div>
                {inv.notes && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>{inv.notes}</div>}
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
              <thead style={{ background: '#1e293b', color: 'white' }}>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11 }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11 }}>Product / Description</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11 }}>HSN</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11 }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11 }}>Unit</th>
                  {!isDeliveryChallan && <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11 }}>Rate (₹)</th>}
                  {!isDeliveryChallan && <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 11 }}>Amount (₹)</th>}
                  {isDeliveryChallan && <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 11 }}>Condition</th>}
                </tr>
              </thead>
              <tbody>
                {(inv.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '8px 10px', fontSize: 12, color: '#94a3b8' }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12 }}><strong>{item.product_name}</strong></td>
                    <td style={{ padding: '8px 10px', fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{item.hsn_code || 'HSN6908'}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, textAlign: 'right', color: '#64748b' }}>{item.unit}</td>
                    {!isDeliveryChallan && <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>₹{parseFloat(item.rate).toFixed(2)}</td>}
                    {!isDeliveryChallan && <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>₹{parseFloat(item.amount).toFixed(2)}</td>}
                    {isDeliveryChallan && <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12 }}>Good</td>}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals (not on challan) */}
            {!isDeliveryChallan && (
              <div style={{ marginLeft: 'auto', width: 300 }}>
                {[
                  { label: 'Subtotal', value: formatCurrency(inv.subtotal) },
                  { label: 'CGST (14%)', value: formatCurrency(cgst) },
                  { label: 'SGST (14%)', value: formatCurrency(sgst) },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>{r.label}</span><span>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 18, fontWeight: 800, color: '#6366f1', borderTop: '2px solid #6366f1', marginTop: 6 }}>
                  <span>Total Amount</span><span>{formatCurrency(inv.total_amount)}</span>
                </div>
                {isQuotation && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 6, padding: 8, marginTop: 8, fontSize: 12, color: '#065f46', textAlign: 'center' }}>
                    ✅ This quotation is valid for 15 days from {formatDate(inv.invoice_date)}
                  </div>
                )}
              </div>
            )}

            {/* HSN GST Summary (not on challan) */}
            {!isDeliveryChallan && (
              <div style={{ marginTop: 16, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#1e293b', color: 'white', padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>HSN-WISE GST SUMMARY</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      {['HSN Code','Taxable Amt','CGST (14%)','SGST (14%)','Total GST'].map(h => (
                        <th key={h} style={{ padding: '5px 10px', textAlign: h==='HSN Code'?'left':'right', color: '#64748b', fontWeight: 700, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const grouped = {};
                      (inv.items||[]).forEach(item => {
                        const hsn = item.hsn_code || 'HSN6908';
                        if (!grouped[hsn]) grouped[hsn] = { taxable: 0 };
                        grouped[hsn].taxable += parseFloat(item.amount || 0);
                      });
                      return Object.entries(grouped).map(([hsn, d], i) => (
                        <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '5px 10px', fontFamily: 'monospace', fontWeight: 700 }}>{hsn}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right' }}>{formatCurrency(d.taxable)}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right' }}>{formatCurrency(d.taxable*0.14)}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right' }}>{formatCurrency(d.taxable*0.14)}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: '#6366f1' }}>{formatCurrency(d.taxable*0.28)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 24 }}>
              <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: 8, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
                <div style={{ height: 40 }}></div>
                Customer Signature & Stamp
              </div>
              <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: 8, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
                <div style={{ height: 40 }}></div>
                For {COMPANY.name}<br />Authorised Signatory
              </div>
            </div>

            {/* Terms */}
            <div style={{ marginTop: 14, background: '#f8fafc', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Terms & Conditions</div>
              {TERMS.split('\n').map((t, i) => <div key={i} style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{t}</div>)}
            </div>

            <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 11 }}>
              Thank you for your business! | {COMPANY.name} | {COMPANY.email} | {COMPANY.phone}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN INVOICES PAGE ────────────────────────────────────
export default function Invoices() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = ['admin', 'manager'].includes(user.role);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [printDoc, setPrintDoc] = useState(null);
  const [printMode, setPrintMode] = useState('invoice');
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showRoomCalc, setShowRoomCalc] = useState(false);
  const [partialModal, setPartialModal] = useState(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [isQuotation, setIsQuotation] = useState(false);
  const [customerMode, setCustomerMode] = useState('existing'); // 'existing' | 'walkin'

  const [form, setForm] = useState({
    customer_id: '', walkin_name: '', walkin_phone: '', walkin_address: '',
    invoice_date: todayISO, due_date: '', notes: '',
    items: [{ product_id: '', product_name: '', quantity: 1, rate: '', unit: 'sqft', amount: 0 }]
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [invRes, custRes, prodRes] = await Promise.all([
        api.invoices.getAll(), api.customers.getAll(), api.products.getAll()
      ]);
      setInvoices(invRes.data?.invoices || invRes.data || []);
      setCustomers(custRes.data?.customers || custRes.data || []);
      setProducts(prodRes.data?.products || prodRes.data || []);
    } catch {}
    setLoading(false);
  };

  const showAlert = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', product_name: '', quantity: 1, rate: '', unit: 'sqft', amount: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const updateItem = (i, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[i] = { ...items[i], [field]: value };
      if (field === 'product_id') {
        const prod = products.find(p => p.id == value);
        if (prod) { items[i].rate = prod.rate; items[i].unit = prod.unit; items[i].product_name = prod.product_name; }
      }
      items[i].amount = parseFloat(items[i].quantity || 0) * parseFloat(items[i].rate || 0);
      return { ...f, items };
    });
  };

  // Bundle discount
  const getBundleDiscount = () => {
    const n = form.items.filter(it => it.product_id).length;
    if (n >= 3) return { pct: 5, label: 'Bundle Discount (3+ products): 5%' };
    if (n >= 2) return { pct: 3, label: 'Bundle Discount (2+ products): 3%' };
    return null;
  };

  const subtotal = form.items.reduce((s, it) => s + (parseFloat(it.quantity || 0) * parseFloat(it.rate || 0)), 0);
  const bundle = getBundleDiscount();
  const discountAmt = bundle ? subtotal * (bundle.pct / 100) : 0;
  const afterDiscount = subtotal - discountAmt;
  const cgst = afterDiscount * 0.14;
  const sgst = afterDiscount * 0.14;
  const total = afterDiscount + cgst + sgst;

  const resetForm = () => {
    setForm({ customer_id: '', walkin_name: '', walkin_phone: '', walkin_address: '', invoice_date: todayISO, due_date: '', notes: '', items: [{ product_id: '', product_name: '', quantity: 1, rate: '', unit: 'sqft', amount: 0 }] });
    setCustomerMode('existing'); setIsQuotation(false);
  };

  const handleSave = async () => {
    if (customerMode === 'existing' && !form.customer_id) { showAlert('Please select a customer', 'error'); return; }
    if (customerMode === 'walkin' && !form.walkin_name) { showAlert('Please enter customer name', 'error'); return; }
    if (form.items.filter(it => it.product_id).length === 0) { showAlert('Please add at least one product', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        status: isQuotation ? 'quotation' : 'pending',
        discount: discountAmt,
        notes: (form.notes || '') + (customerMode === 'walkin' ? ` | Walk-in: ${form.walkin_name} ${form.walkin_phone}` : ''),
        items: form.items.filter(it => it.product_id).map(it => ({ ...it, quantity: parseFloat(it.quantity), rate: parseFloat(it.rate) }))
      };
      if (customerMode === 'walkin') payload.customer_id = null;
      await api.invoices.create(payload);
      showAlert(isQuotation ? 'Quotation created!' : 'Invoice created!');
      setShowModal(false); resetForm(); load();
    } catch (e) { showAlert(e.response?.data?.message || 'Error', 'error'); }
    setSaving(false);
  };

  const handleConvertToInvoice = async (inv) => {
    if (!confirm(`Convert quotation ${inv.invoice_number} to invoice?`)) return;
    try {
      await api.invoices.update(inv.id, { status: 'pending' });
      showAlert('Converted to invoice!'); load();
    } catch { showAlert('Error converting', 'error'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try { await api.invoices.update(id, { status }); showAlert(`Marked as ${status}!`); load(); }
    catch { showAlert('Error', 'error'); }
  };

  const handlePartialPayment = async () => {
    if (!partialAmount || isNaN(partialAmount)) { showAlert('Enter valid amount', 'error'); return; }
    try {
      const newStatus = parseFloat(partialAmount) >= parseFloat(partialModal.total_amount) ? 'paid' : 'partial';
      await api.invoices.update(partialModal.id, { status: newStatus, amount_paid: partialAmount });
      showAlert('Payment recorded!'); setPartialModal(null); setPartialAmount(''); load();
    } catch { showAlert('Error', 'error'); }
  };

  const handleView = async (inv, mode = 'invoice') => {
    try { const res = await api.invoices.getOne(inv.id); setPrintDoc(res.data); setPrintMode(mode); }
    catch { setPrintDoc(inv); setPrintMode(mode); }
  };

  const handleWhatsApp = (inv) => {
    const customer = customers.find(c => c.id === inv.customer_id);
    const phone = customer?.phone?.replace(/\D/g, '');
    const isQuote = inv.status === 'quotation';
    const msg = encodeURIComponent(
      `Dear ${getCustomerName(inv, customers)},\n\n` +
      (isQuote ? `Your *Quotation ${inv.invoice_number}* from TileSoft is ready.\n\n` : `Your invoice *${inv.invoice_number}* from TileSoft is ready.\n\n`) +
      `Amount: *${formatCurrency(inv.total_amount)}*\n` +
      `Date: ${formatDate(inv.invoice_date)}\n` +
      (inv.due_date ? `Valid/Due: ${formatDate(inv.due_date)}\n` : '') +
      `Status: *${inv.status?.toUpperCase()}*\n\n` +
      (isQuote ? `Please confirm to proceed. ` : `UPI: ${COMPANY.upi}\n`) +
      `Contact: ${COMPANY.phone}\nThank you! 🧱`
    );
    window.open(`https://wa.me/${phone || ''}?text=${msg}`, '_blank');
  };

  const statusBadge = (inv) => {
    if (inv.status === 'quotation') return <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>📋 QUOTATION</span>;
    if (inv.status === 'overdue') return <div><span className="badge badge-red">OVERDUE</span><div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{daysSince(inv.invoice_date)} days</div></div>;
    if (inv.status === 'paid') return <span className="badge badge-green">✅ PAID</span>;
    if (inv.status === 'pending') return <span className="badge badge-yellow">⏳ PENDING</span>;
    if (inv.status === 'partial') return <span className="badge badge-blue">💰 PARTIAL</span>;
    return <span className="badge badge-gray">{inv.status?.toUpperCase()}</span>;
  };

  const filtered = invoices.filter(inv => {
    const walkinName = inv.notes?.match(/Walk-in: ([^|]+)/)?.[1]?.trim() || '';
    const matchSearch = !search || inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) || inv.customer_name?.toLowerCase().includes(search.toLowerCase()) || walkinName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  // Room calculator inline
  const RoomCalc = () => {
    const [rooms, setRooms] = useState([{ name: 'Living Room', length: 12, width: 10, product_id: '', wastage: 10 }]);
    const [result, setResult] = useState(null);
    const calculate = () => {
      const items = rooms.map(room => {
        const prod = products.find(p => p.id == room.product_id);
        if (!prod || !room.length || !room.width) return null;
        const qty = Math.ceil(room.length * room.width * (1 + room.wastage / 100));
        return { room: room.name, product: prod, qty, area: room.length * room.width, amount: qty * parseFloat(prod.rate) };
      }).filter(Boolean);
      setResult(items);
    };
    const addAll = () => {
      if (!result) return;
      result.forEach(r => {
        setForm(f => {
          const existing = f.items.filter(it => it.product_id);
          const newItem = { product_id: r.product.id, product_name: r.product.product_name, quantity: r.qty, rate: r.product.rate, unit: r.product.unit, amount: r.amount };
          return { ...f, items: [...existing, newItem, { product_id: '', product_name: '', quantity: 1, rate: '', unit: 'sqft', amount: 0 }] };
        });
      });
      setShowRoomCalc(false); showAlert('Rooms added to invoice!');
    };
    return (
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 14, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#0369a1', marginBottom: 10 }}>🏠 Room-wise Calculator</div>
        {rooms.map((room, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
            <input className="form-input" placeholder="Room" value={room.name} onChange={e => { const r=[...rooms]; r[i].name=e.target.value; setRooms(r); }} style={{ width: 110 }} />
            <input className="form-input" type="number" placeholder="L(ft)" value={room.length} onChange={e => { const r=[...rooms]; r[i].length=+e.target.value; setRooms(r); }} style={{ width: 70 }} />
            <input className="form-input" type="number" placeholder="W(ft)" value={room.width} onChange={e => { const r=[...rooms]; r[i].width=+e.target.value; setRooms(r); }} style={{ width: 70 }} />
            <select className="form-select" value={room.product_id} onChange={e => { const r=[...rooms]; r[i].product_id=e.target.value; setRooms(r); }} style={{ flex: 1, minWidth: 140 }}>
              <option value="">Select tile...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.product_name} ₹{p.rate}/{p.unit}</option>)}
            </select>
            <select className="form-select" value={room.wastage} onChange={e => { const r=[...rooms]; r[i].wastage=+e.target.value; setRooms(r); }} style={{ width: 100 }}>
              <option value={5}>5% waste</option><option value={10}>10% waste</option><option value={15}>15% waste</option>
            </select>
            {rooms.length > 1 && <button onClick={() => setRooms(rooms.filter((_,j)=>j!==i))} style={{ background: '#fee2e2', border: 'none', borderRadius: 4, color: '#ef4444', padding: '6px 10px', cursor: 'pointer' }}>✕</button>}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginBottom: result ? 10 : 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setRooms([...rooms, { name: `Room ${rooms.length+1}`, length: 10, width: 10, product_id: '', wastage: 10 }])}>+ Room</button>
          <button className="btn btn-primary btn-sm" onClick={calculate}>🧮 Calculate</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowRoomCalc(false)}>✕ Close</button>
        </div>
        {result && result.length > 0 && (
          <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 6, padding: 10 }}>
            {result.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
                <span><strong>{r.room}</strong> — {r.product.product_name}</span>
                <span><strong>{r.qty} sqft</strong> = <strong style={{ color: '#065f46' }}>₹{r.amount.toFixed(0)}</strong></span>
              </div>
            ))}
            <button className="btn btn-success" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }} onClick={addAll}>✅ Add All to Invoice</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Smart Billing</div><div className="page-subtitle">Invoices, Quotations & Payments</div></div>
        <div className="page-date">Current Date<strong>{today}</strong></div>
      </div>
      <div className="page-body">
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total', value: invoices.filter(i=>i.status!=='quotation').length, color: '#6366f1', bg: '#eef2ff' },
            { label: 'Paid', value: invoices.filter(i=>i.status==='paid').length, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Pending', value: invoices.filter(i=>i.status==='pending').length, color: '#f97316', bg: '#fff7ed' },
            { label: 'Overdue', value: invoices.filter(i=>i.status==='overdue').length, color: '#ef4444', bg: '#fef2f2' },
            { label: 'Quotations', value: invoices.filter(i=>i.status==='quotation').length, color: '#1d4ed8', bg: '#dbeafe' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: 14, borderLeft: `4px solid ${c.color}`, cursor: 'pointer' }} onClick={() => setStatusFilter(c.label === 'Total' ? '' : c.label.toLowerCase())}>
              <div style={{ fontSize: 11, fontWeight: 600, color: c.color, marginBottom: 3 }}>{c.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="toolbar">
            <div className="search-box"><span>🔍</span><input placeholder="Search invoice# or customer..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
              <option value="quotation">Quotations</option>
            </select>
            {canEdit && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => { setIsQuotation(true); setShowModal(true); }}>📋 New Quote</button>
                <button className="btn btn-primary" onClick={() => { setIsQuotation(false); setShowModal(true); }}>+ New Invoice</button>
              </div>
            )}
          </div>

          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-container">
              <table>
                <thead><tr><th>Number</th><th>Customer</th><th>Date</th><th>Amount</th><th>GST</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="8"><div className="empty-state"><div className="empty-state-icon">🧾</div><p>No records found</p></div></td></tr>
                  ) : filtered.map(inv => (
                    <tr key={inv.id} style={{ background: inv.status === 'quotation' ? '#f0f9ff' : 'white' }}>
                      <td><strong style={{ color: inv.status === 'quotation' ? '#1d4ed8' : '#6366f1' }}>{inv.invoice_number}</strong></td>
                      <td><strong>{getCustomerName(inv, customers)}</strong></td>
                      <td style={{ fontSize: 13 }}>{formatDate(inv.invoice_date)}</td>
                      <td>{formatCurrency(inv.subtotal)}</td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>{formatCurrency(parseFloat(inv.total_amount||0)-parseFloat(inv.subtotal||0))}</td>
                      <td><strong style={{ color: '#1d4ed8' }}>{formatCurrency(inv.total_amount)}</strong></td>
                      <td>{statusBadge(inv)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          <button title="View" onClick={() => handleView(inv,'invoice')} style={{ background: '#dbeafe', border:'none', borderRadius:6, color:'#1d4ed8', cursor:'pointer', padding:'5px 7px', fontSize:14 }}>👁️</button>
                          <button title="WhatsApp" onClick={() => handleWhatsApp(inv)} style={{ background: '#d1fae5', border:'none', borderRadius:6, color:'#065f46', cursor:'pointer', padding:'5px 7px', fontSize:14 }}>📱</button>
                          {inv.status !== 'quotation' && (
                            <button title="Delivery Challan" onClick={() => handleView(inv,'challan')} style={{ background: '#fef3c7', border:'none', borderRadius:6, color:'#92400e', cursor:'pointer', padding:'5px 7px', fontSize:14 }}>🚚</button>
                          )}
                          {inv.status === 'quotation' && canEdit && (
                            <button title="Convert to Invoice" onClick={() => handleConvertToInvoice(inv)} style={{ background: '#d1fae5', border:'none', borderRadius:6, color:'#065f46', cursor:'pointer', padding:'5px 8px', fontSize:11, fontWeight:700 }}>✅ Convert</button>
                          )}
                          {inv.status !== 'paid' && inv.status !== 'quotation' && canEdit && (
                            <button title="Mark Paid" onClick={() => handleStatusUpdate(inv.id,'paid')} style={{ background: '#d1fae5', border:'none', borderRadius:6, color:'#065f46', cursor:'pointer', padding:'5px 7px', fontSize:11, fontWeight:700 }}>✅ Paid</button>
                          )}
                          {inv.status === 'pending' && canEdit && (
                            <button title="Partial Payment" onClick={() => { setPartialModal(inv); setPartialAmount(''); }} style={{ background: '#ede9fe', border:'none', borderRadius:6, color:'#5b21b6', cursor:'pointer', padding:'5px 7px', fontSize:11, fontWeight:700 }}>💰</button>
                          )}
                          {inv.status === 'pending' && canEdit && (
                            <button title="Mark Overdue" onClick={() => handleStatusUpdate(inv.id,'overdue')} style={{ background: '#fee2e2', border:'none', borderRadius:6, color:'#991b1b', cursor:'pointer', padding:'5px 7px', fontSize:13 }}>⚠️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Print/View Modal */}
      {printDoc && <PrintDoc inv={printDoc} mode={printMode} onClose={() => setPrintDoc(null)} customers={customers} />}

      {/* Partial Payment Modal */}
      {partialModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPartialModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header"><div className="modal-title">💰 Record Payment</div><button className="modal-close" onClick={() => setPartialModal(null)}>✕</button></div>
            <div className="modal-body">
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 13 }}>Invoice: <strong>{partialModal.invoice_number}</strong></div>
                <div style={{ fontSize: 13 }}>Total: <strong style={{ color: '#6366f1' }}>{formatCurrency(partialModal.total_amount)}</strong></div>
              </div>
              <div className="form-group">
                <label className="form-label">Amount Received (₹)</label>
                <input className="form-input" type="number" value={partialAmount} onChange={e => setPartialAmount(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPartialModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePartialPayment}>Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice / Quotation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 780 }}>
            <div className="modal-header">
              <div className="modal-title">{isQuotation ? '📋 Create Quotation' : '🧾 Create Invoice'}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isQuotation} onChange={e => setIsQuotation(e.target.checked)} />
                  Save as Quotation
                </label>
                <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              {/* Customer Mode Toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button onClick={() => setCustomerMode('existing')} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: customerMode === 'existing' ? '#6366f1' : '#f1f5f9', color: customerMode === 'existing' ? 'white' : '#64748b' }}>🏢 Existing Customer</button>
                <button onClick={() => setCustomerMode('walkin')} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: customerMode === 'walkin' ? '#10b981' : '#f1f5f9', color: customerMode === 'walkin' ? 'white' : '#64748b' }}>🚶 Walk-in Customer</button>
              </div>

              <div className="form-grid" style={{ marginBottom: 14 }}>
                {customerMode === 'existing' ? (
                  <div className="form-group full">
                    <label className="form-label">Customer *</label>
                    <select className="form-select" style={{ width: '100%' }} value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}>
                      <option value="">Select customer...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.company_name} — {c.contact_person}</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="form-group"><label className="form-label">Customer Name *</label><input className="form-input" value={form.walkin_name} onChange={e => setForm({...form, walkin_name: e.target.value})} placeholder="e.g. Ramesh Kumar" /></div>
                    <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.walkin_phone} onChange={e => setForm({...form, walkin_phone: e.target.value})} placeholder="10-digit mobile" /></div>
                    <div className="form-group full"><label className="form-label">Address</label><input className="form-input" value={form.walkin_address} onChange={e => setForm({...form, walkin_address: e.target.value})} placeholder="Optional address" /></div>
                  </>
                )}
                <div className="form-group"><label className="form-label">{isQuotation ? 'Quote Date' : 'Invoice Date'}</label><input className="form-input" type="date" value={form.invoice_date} onChange={e => setForm({...form, invoice_date: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">{isQuotation ? 'Valid Until' : 'Due Date'}</label><input className="form-input" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
              </div>

              {/* Room Calculator */}
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRoomCalc(!showRoomCalc)} style={{ marginBottom: 10 }}>🏠 {showRoomCalc ? 'Hide' : 'Use'} Room Calculator</button>
              {showRoomCalc && <RoomCalc />}

              {/* Items */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 14 }}>Items</strong>
                <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Item</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '7px 8px', textAlign: 'left', fontSize: 12, color: '#94a3b8' }}>Product</th>
                  <th style={{ padding: '7px 8px', fontSize: 12, color: '#94a3b8', width: 75 }}>Qty</th>
                  <th style={{ padding: '7px 8px', fontSize: 12, color: '#94a3b8', width: 95 }}>Rate</th>
                  <th style={{ padding: '7px 8px', fontSize: 12, color: '#94a3b8', width: 105 }}>Amount</th>
                  <th style={{ width: 32 }}></th>
                </tr></thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '5px 6px' }}>
                        <select className="form-select" style={{ width: '100%', padding: '6px 8px' }} value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                          <option value="">Select product...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.product_name} — ₹{p.rate}/{p.unit}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '5px 6px' }}><input className="form-input" type="number" min="1" style={{ padding: '6px 8px' }} value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} /></td>
                      <td style={{ padding: '5px 6px' }}><input className="form-input" type="number" style={{ padding: '6px 8px' }} value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)} /></td>
                      <td style={{ padding: '5px 6px', fontWeight: 700, color: '#1d4ed8', fontSize: 13 }}>₹{(parseFloat(item.quantity||0)*parseFloat(item.rate||0)).toFixed(0)}</td>
                      <td>{form.items.length > 1 && <button onClick={() => removeItem(i)} style={{ background: '#fee2e2', border:'none', borderRadius:4, color:'#ef4444', cursor:'pointer', padding:'4px 7px' }}>✕</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                {bundle && <div style={{ background: '#d1fae5', borderRadius: 6, padding: '6px 12px', marginBottom: 8, fontSize: 13, color: '#065f46', fontWeight: 600 }}>🎉 {bundle.label} — Save ₹{discountAmt.toFixed(2)}!</div>}
                {[['Subtotal', subtotal], bundle ? [`Bundle Discount (${bundle.pct}%)`, -discountAmt] : null, ['CGST (14%)', cgst], ['SGST (14%)', sgst]].filter(Boolean).map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: val < 0 ? '#10b981' : '#64748b' }}>{label}</span>
                    <span style={{ color: val < 0 ? '#10b981' : 'inherit' }}>{val < 0 ? `-₹${Math.abs(val).toFixed(2)}` : `₹${val.toFixed(2)}`}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 6 }}>
                  <span>Total</span><span style={{ color: '#6366f1' }}>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Terms</label>
                <textarea className="form-input" rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Payment terms, delivery notes..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : isQuotation ? '📋 Create Quotation' : '🧾 Create Invoice'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}