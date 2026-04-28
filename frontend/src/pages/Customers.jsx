import { useState, useEffect } from 'react';
import api from '../services/api';

const EMPTY_FORM = { company_name: '', contact_person: '', email: '', phone: '', address: '', gst_number: '' };

export default function Customers() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = ['admin', 'manager'].includes(user.role);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const res = await api.customers.getAll(); setCustomers(res.data?.customers || res.data || []); }
    catch { setCustomers([]); }
    setLoading(false);
  };

  const showAlert = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3000); };
  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ company_name: c.company_name, contact_person: c.contact_person, email: c.email || '', phone: c.phone, address: c.address || '', gst_number: c.gst_number || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.company_name || !form.phone) { showAlert('Company name and phone required', 'error'); return; }
    setSaving(true);
    try {
      if (editItem) { await api.customers.update(editItem.id, form); showAlert('Customer updated!'); }
      else { await api.customers.create(form); showAlert('Customer added!'); }
      setShowModal(false); load();
    } catch (e) { showAlert(e.response?.data?.message || 'Error', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try { await api.customers.delete(id); showAlert('Deleted!'); load(); }
    catch { showAlert('Cannot delete — has invoices', 'error'); }
  };

  const filtered = customers.filter(c =>
    !search || c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Customers</div><div className="page-subtitle">Manage your customer base</div></div>
        <div className="page-date">Current Date<strong>{today}</strong></div>
      </div>
      <div className="page-body">
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
        <div className="card">
          <div className="toolbar">
            <div className="search-box"><span>🔍</span><input placeholder="Search by company, contact or phone..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            {canEdit && <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>}
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-container">
              <table>
                <thead><tr><th>#</th><th>Company Name</th><th>Contact Person</th><th>Phone</th><th>Email</th><th>GST Number</th>{canEdit && <th>Actions</th>}</tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon">👥</div><p>No customers found</p></div></td></tr>
                  ) : paginated.map((c, i) => (
                    <tr key={c.id}>
                      <td style={{ color: '#94a3b8', fontSize: 13 }}>{(page-1)*PAGE_SIZE+i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {c.company_name?.[0]?.toUpperCase()}
                          </div>
                          <strong>{c.company_name}</strong>
                        </div>
                      </td>
                      <td>{c.contact_person}</td>
                      <td>{c.phone}</td>
                      <td style={{ color: '#64748b' }}>{c.email || '—'}</td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{c.gst_number || '—'}</span></td>
                      {canEdit && (
                        <td><div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon btn-icon-edit" onClick={() => openEdit(c)}>✏️</button>
                          <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(c.id)}>🗑️</button>
                        </div></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, padding:'14px 16px', borderTop:'1px solid #f1f5f9' }}>
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #e2e8f0', background:page===1?'#f8fafc':'white', cursor:page===1?'default':'pointer', fontWeight:600, color:page===1?'#cbd5e1':'#374151' }}>← Prev</button>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                    <button key={n} onClick={()=>setPage(n)} style={{ width:34, height:34, borderRadius:8, border:'none', background:page===n?'#6366f1':'#f1f5f9', color:page===n?'white':'#374151', fontWeight:700, cursor:'pointer', fontSize:13 }}>{n}</button>
                  ))}
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #e2e8f0', background:page===totalPages?'#f8fafc':'white', cursor:page===totalPages?'default':'pointer', fontWeight:600, color:page===totalPages?'#cbd5e1':'#374151' }}>Next →</button>
                  <span style={{ fontSize:12, color:'#94a3b8', marginLeft:4 }}>{filtered.length} total</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editItem ? 'Edit Customer' : 'Add Customer'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full"><label className="form-label">Company Name *</label><input className="form-input" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="e.g. Arjun Constructions" /></div>
                <div className="form-group"><label className="form-label">Contact Person *</label><input className="form-input" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} placeholder="Full name" /></div>
                <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="10-digit number" /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">GST Number</label><input className="form-input" value={form.gst_number} onChange={e => setForm({...form, gst_number: e.target.value})} placeholder="e.g. 29AABCA1234A1Z5" /></div>
                <div className="form-group full"><label className="form-label">Address</label><textarea className="form-input" rows="2" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update' : 'Add Customer'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}