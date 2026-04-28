import { useState, useEffect } from 'react';
import api from '../services/api';
const DEPARTMENTS = [
  { id: 1, name: 'Sales' }, { id: 2, name: 'Operations' }, { id: 3, name: 'Accounts' },
  { id: 4, name: 'HR' }, { id: 5, name: 'IT' }, { id: 6, name: 'Marketing' }
];
const EMPTY_FORM = { name: '', employee_code: '', designation: '', salary: '', date_of_joining: todayISO, department_id: '', address: '', status: 'active' };

export default function Employees() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = ['admin', 'manager'].includes(user.role);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
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
    try {
      const res = await api.employees.getAll();
      setEmployees(res.data?.employees || res.data || []);
    } catch { setEmployees([]); }
    setLoading(false);
  };

  const showAlert = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3000); };

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (e) => {
    setEditItem(e);
    setForm({ name: e.user_name || e.name || '', employee_code: e.employee_code, designation: e.designation || '', salary: e.salary || '', date_of_joining: e.date_of_joining?.split('T')[0] || todayISO, department_id: e.department_id || '', address: e.address || '', status: e.status || 'active' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.employee_code || !form.designation) { showAlert('Name, employee code and designation are required', 'error'); return; }
    setSaving(true);
    try {
      if (editItem) { await api.employees.update(editItem.id, form); showAlert('Employee updated!'); }
      else { await api.employees.create(form); showAlert('Employee added!'); }
      setShowModal(false); load();
    } catch (e) { showAlert(e.response?.data?.message || 'Error saving', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this employee?')) return;
    try { await api.employees.delete(id); showAlert('Employee deactivated!'); load(); }
    catch { showAlert('Error', 'error'); }
  };

  const getDept = (id) => DEPARTMENTS.find(d => d.id === id)?.name || '—';

  const filtered = employees.filter(e => {
    const matchSearch = !search || e.employee_code?.toLowerCase().includes(search.toLowerCase()) || e.designation?.toLowerCase().includes(search.toLowerCase()) || e.user_name?.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || e.department_id == deptFilter;
    return matchSearch && matchDept;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, deptFilter]);

  const statusColor = { active: { bg: '#d1fae5', color: '#065f46' }, on_leave: { bg: '#fef3c7', color: '#92400e' }, terminated: { bg: '#fee2e2', color: '#991b1b' } };
  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Employees</div><div className="page-subtitle">Manage your team</div></div>
        <div className="page-date">Current Date<strong>{today}</strong></div>
      </div>
      <div className="page-body">
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Employees', value: employees.length, color: '#6366f1', bg: '#eef2ff' },
            { label: 'Active', value: employees.filter(e => e.status === 'active').length, color: '#10b981', bg: '#f0fdf4' },
            { label: 'Inactive', value:employees.filter(e => e.status === 'terminated').length, color: '#ef4444', bg: '#fef2f2' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 12, padding: 16, borderLeft: `4px solid ${c.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.color, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="toolbar">
            <div className="search-box"><span>🔍</span><input placeholder="Search by code, name or designation..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {canEdit && <button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button>}
          </div>

          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-container">
              <table>
                <thead><tr><th>#</th><th>Employee</th><th>Code</th><th>Department</th><th>Designation</th><th>Salary</th><th>Joined</th><th>Status</th>{canEdit && <th>Actions</th>}</tr></thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon">👤</div><p>No employees found</p></div></td></tr>
                  ) : paginated.map((emp, i) => {
                    const sc = statusColor[emp.status] || statusColor.active;
                    return (
                      <tr key={emp.id}>
                        <td style={{ color: '#94a3b8', fontSize: 13 }}>{(page-1)*PAGE_SIZE+i + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                              {(emp.user_name || emp.designation || 'E')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.user_name || 'Employee'}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8' }}>{emp.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>{emp.employee_code}</span></td>
                        <td>{getDept(emp.department_id)}</td>
                        <td>{emp.designation || '—'}</td>
                        <td><strong style={{ color: '#1d4ed8' }}>₹{parseFloat(emp.salary || 0).toLocaleString()}</strong></td>
                        <td style={{ fontSize: 13, color: '#64748b' }}>{emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-IN') : '—'}</td>
                        <td><span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{emp.status?.toUpperCase()}</span></td>
                        {canEdit && (
                          <td><div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-icon btn-icon-edit" onClick={() => openEdit(emp)}>✏️</button>
                            <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(emp.id)}>🗑️</button>
                          </div></td>
                        )}
                      </tr>
                    );
                  })}
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
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div className="modal-title">{editItem ? '✏️ Edit Employee' : '👤 Add New Employee'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Employee Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Rajesh Kumar" />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee Code *</label>
                  <input className="form-input" value={form.employee_code} onChange={e => setForm({...form, employee_code: e.target.value})} placeholder="e.g. EMP011" disabled={!!editItem} />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation *</label>
                  <input className="form-input" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="e.g. Sales Executive" />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Salary (₹)</label>
                  <input className="form-input" type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} placeholder="e.g. 35000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Joining</label>
                  <input className="form-input" type="date" value={form.date_of_joining} onChange={e => setForm({...form, date_of_joining: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Address</label>
                  <textarea className="form-input" rows="2" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Employee address..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update Employee' : 'Add Employee'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}