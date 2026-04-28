import { useState, useEffect } from 'react';
import api from '../services/api';
const EMPTY_FORM = { name: '', contact_person: '', email: '', phone: '', address: '', city: '', state: '', gst_number: '', payment_terms: 'Net 30', rating: 5 };
const PAYMENT_TERMS = ['Advance', 'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];
const STATES = ['Andhra Pradesh','Karnataka','Kerala','Tamil Nadu','Telangana','Maharashtra','Gujarat','Rajasthan','Delhi','Uttar Pradesh','West Bengal','Other'];

export default function Suppliers() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = ['admin', 'manager'].includes(user.role);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const res = await api.suppliers.getAll(); setSuppliers(res.data?.suppliers || res.data || []); }
    catch { setSuppliers([]); }
    setLoading(false);
  };

  const showAlert = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3000); };
  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (s) => {
    setEditItem(s);
    setForm({ name: s.name, contact_person: s.contact_person || '', email: s.email || '', phone: s.phone || '', address: s.address || '', city: s.city || '', state: s.state || '', gst_number: s.gst_number || '', payment_terms: s.payment_terms || 'Net 30', rating: s.rating || 5 });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) { showAlert('Supplier name and phone required', 'error'); return; }
    setSaving(true);
    try {
      if (editItem) { await api.suppliers.update(editItem.id, form); showAlert('Supplier updated!'); }
      else { await api.suppliers.create(form); showAlert('Supplier added!'); }
      setShowModal(false); load();
    } catch (e) { showAlert(e.response?.data?.message || 'Error', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try { await api.suppliers.delete(id); showAlert('Deleted!'); load(); }
    catch { showAlert('Error deleting', 'error'); }
  };

  const renderStars = (rating) => '⭐'.repeat(Math.min(Math.round(Number(rating) || 0), 5));

  const filtered = suppliers.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Suppliers</div><div className="page-subtitle">Manage your tile suppliers</div></div>
        <div className="page-date">Current Date<strong>{today}</strong></div>
      </div>
      <div className="page-body">
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Suppliers', value: suppliers.length, color: '#6366f1', bg: '#eef2ff' },
            { label: 'Cities Covered', value: [...new Set(suppliers.map(s=>s.city).filter(Boolean))].length, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Top Rated (5★)', value: suppliers.filter(s => parseFloat(s.rating) >= 4.5).length, color: '#f59e0b', bg: '#fffbeb' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: 16, borderLeft: `4px solid ${c.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.color, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="toolbar">
            <div className="search-box"><span>🔍</span><input placeholder="Search by name, contact or city..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            {canEdit && <button className="btn btn-primary" onClick={openAdd}>+ Add Supplier</button>}
          </div>

          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-container">
              <table>
                <thead><tr><th>#</th><th>Supplier</th><th>Contact</th><th>Phone</th><th>Location</th><th>Payment Terms</th><th>Rating</th><th>GST</th>{canEdit && <th>Actions</th>}</tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon">🏭</div><p>No suppliers found</p></div></td></tr>
                  ) : filtered.map((s, i) => (
                    <tr key={s.id}>
                      <td style={{ color: '#94a3b8', fontSize: 13 }}>{i+1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#f97316,#ef4444)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                            {s.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{s.name}</div>
                            {s.email && <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{s.contact_person || '—'}</td>
                      <td>{s.phone || '—'}</td>
                      <td>{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                      <td><span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{s.payment_terms || '—'}</span></td>
                      <td>{renderStars(s.rating)}</td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{s.gst_number || '—'}</span></td>
                      {canEdit && (
                        <td><div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon btn-icon-edit" onClick={() => openEdit(s)}>✏️</button>
                          <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(s.id)}>🗑️</button>
                        </div></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div className="modal-title">{editItem ? '✏️ Edit Supplier' : '🏭 Add Supplier'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full"><label className="form-label">Supplier Name *</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Kajaria Ceramics" /></div>
                <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} placeholder="Full name" /></div>
                <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="10-digit" /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="e.g. Chennai" /></div>
                <div className="form-group"><label className="form-label">State</label>
                  <select className="form-select" value={form.state} onChange={e => setForm({...form, state: e.target.value})}>
                    <option value="">Select state...</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Payment Terms</label>
                  <select className="form-select" value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})}>
                    {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Rating (1-5)</label>
                  <select className="form-select" value={form.rating} onChange={e => setForm({...form, rating: +e.target.value})}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{'⭐'.repeat(n)} ({n})</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">GST Number</label><input className="form-input" value={form.gst_number} onChange={e => setForm({...form, gst_number: e.target.value})} placeholder="29AABCA1234A1Z5" /></div>
                <div className="form-group full"><label className="form-label">Address</label><textarea className="form-input" rows="2" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update Supplier' : 'Add Supplier'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}