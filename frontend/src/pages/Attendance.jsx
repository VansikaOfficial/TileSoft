import { useState, useEffect } from 'react';
import api from '../services/api';

const nowTime = new Date().toTimeString().slice(0, 5);
const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_COLORS = {
  present: { bg: '#d1fae5', color: '#065f46', icon: '✅' },
  absent:  { bg: '#fee2e2', color: '#991b1b', icon: '❌' },
  leave:   { bg: '#fef3c7', color: '#92400e', icon: '🕐' },
};

export default function Attendance() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = ['admin', 'manager'].includes(user.role);
  const [summary, setSummary] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [markForm, setMarkForm] = useState({
    employee_id: '', date: todayISO, check_in: nowTime, check_out: '', status: 'present', notes: ''
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [sumRes, todayRes, empRes] = await Promise.all([
        api.attendance.getSummary(),
        api.attendance.getAll({ date: todayISO }),
        api.employees.getAll(),
      ]);
      const allEmp = empRes.data?.employees || empRes.data || [];
      setStaffList(allEmp);
      const rawSummary = sumRes.data?.summary || sumRes.data || [];
      const enriched = rawSummary.map(row => {
        const emp = allEmp.find(e => e.id == row.employee_id);
        return {
          ...row,
          name: emp?.user_name || emp?.name || row.name || row.email || `Employee ${row.employee_id}`,
          employee_code: emp?.employee_code || row.employee_code || `EMP00${row.employee_id}`,
          department: emp?.department || row.department || row.role || '—',
        };
      });
      setSummary(enriched);
      setTodayRecords(todayRes.data || []);
    } catch { setSummary([]); }
    setLoading(false);
  };

  const showAlert = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500); };

  const handleMark = async () => {
    if (!markForm.employee_id || !markForm.date || !markForm.check_in) {
      showAlert('Employee, date and check-in time are required', 'error'); return;
    }
    setSaving(true);
    try {
      await api.attendance.mark(markForm);
      showAlert('Attendance marked successfully!');
      setShowMarkModal(false);
      setMarkForm({ employee_id: '', date: todayISO, check_in: nowTime, check_out: '', status: 'present', notes: '' });
      load();
    } catch (e) {
      showAlert(e.response?.data?.message || 'Attendance may already be marked for this date', 'error');
    }
    setSaving(false);
  };

  const handleMarkAllPresent = async () => {
    if (!confirm(`Mark all ${staffList.length} employees present for ${markForm.date}?`)) return;
    setSaving(true);
    let count = 0;
    for (const s of staffList) {
      try {
        await api.attendance.mark({ employee_id: s.id, date: markForm.date, check_in: '09:00', check_out: '18:00', status: 'present' });
        count++;
      } catch {}
    }
    showAlert(`${count} of ${staffList.length} employees marked present!`);
    setShowMarkModal(false);
    load();
    setSaving(false);
  };

  const filtered = summary.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPresent = summary.reduce((s, e) => s + parseInt(e.present || 0), 0);
  const totalAbsent = summary.reduce((s, e) => s + parseInt(e.absent || 0), 0);
  const totalLeave = summary.reduce((s, e) => s + parseInt(e.leave || 0), 0);
  const todayPresent = todayRecords.filter(r => r.status === 'present').length;
  const todayAbsent = todayRecords.filter(r => r.status === 'absent').length;

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Attendance</div><div className="page-subtitle">Track daily employee attendance</div></div>
        <div className="page-date">Current Date<strong>{today}</strong></div>
      </div>

      <div className="page-body">
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Staff', value: staffList.length || summary.length, color: '#6366f1', bg: '#eef2ff', icon: '👥' },
            { label: 'Present Today', value: todayPresent, color: '#10b981', bg: '#f0fdf4', icon: '✅' },
            { label: 'Absent Today', value: todayAbsent, color: '#ef4444', bg: '#fef2f2', icon: '❌' },
            { label: 'On Leave Today', value: todayRecords.filter(r => r.status === 'leave').length, color: '#f59e0b', bg: '#fffbeb', icon: '🕐' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: '18px 20px', borderLeft: `5px solid ${c.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</div>
              </div>
              <div style={{ fontSize: 32, opacity: 0.4 }}>{c.icon}</div>
            </div>
          ))}
        </div>

        {/* TABS + MARK BUTTON */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          {[
            { key: 'today', label: '📅 Today' },
            { key: 'summary', label: '📊 Monthly Summary' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              background: activeTab === t.key ? '#6366f1' : 'white',
              color: activeTab === t.key ? 'white' : '#64748b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>{t.label}</button>
          ))}
          {canEdit && (
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowMarkModal(true)}>
              📝 Mark Attendance
            </button>
          )}
        </div>

        {/* TODAY TAB */}
        {activeTab === 'today' && (
          <div className="card">
            {loading ? <div className="loading">Loading...</div> : todayRecords.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">📅</div>
                <p style={{ marginBottom: 8 }}>No attendance marked for today yet</p>
                {canEdit && (
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowMarkModal(true)}>
                    📝 Mark Attendance Now
                  </button>
                )}
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>#</th><th>Employee</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {todayRecords.map((rec, i) => {
                      const sc = STATUS_COLORS[rec.status] || STATUS_COLORS.present;
                      const emp = staffList.find(s => s.id == rec.employee_id);
                      const empName = rec.employee_name || emp?.user_name || emp?.name || `Employee ${rec.employee_id}`;
                      return (
                        <tr key={i}>
                          <td style={{ color: '#94a3b8', fontSize: 13 }}>{i + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                {empName?.[0]?.toUpperCase()}
                              </div>
                              <strong>{empName}</strong>
                            </div>
                          </td>
                          <td><span style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}>🕘 {rec.check_in || '—'}</span></td>
                          <td><span style={{ color: '#64748b', fontSize: 13 }}>🕔 {rec.check_out || 'Not checked out'}</span></td>
                          <td>
                            <span style={{ background: sc.bg, color: sc.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                              {sc.icon} {rec.status?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontSize: 13, color: '#64748b' }}>{rec.notes || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MONTHLY SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="card">
            <div className="toolbar">
              <div className="search-box">
                <span>🔍</span>
                <input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b', alignItems: 'center' }}>
                <span>✅ Total Present: <strong style={{ color: '#10b981' }}>{totalPresent}</strong></span>
                <span>❌ Total Absent: <strong style={{ color: '#ef4444' }}>{totalAbsent}</strong></span>
                <span>🕐 Total Leave: <strong style={{ color: '#f59e0b' }}>{totalLeave}</strong></span>
              </div>
            </div>
            {loading ? <div className="loading">Loading...</div> : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>#</th><th>Employee</th><th>Code</th><th>Present</th><th>Absent</th><th>Leave</th><th>Attendance %</th></tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon">📅</div><p>No attendance data found</p></div></td></tr>
                    ) : filtered.map((emp, i) => {
                      const total = parseInt(emp.present || 0) + parseInt(emp.absent || 0) + parseInt(emp.leave || 0);
                      const pct = total > 0 ? Math.round((parseInt(emp.present || 0) / total) * 100) : 0;
                      const pctColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                      return (
                        <tr key={i}>
                          <td style={{ color: '#94a3b8', fontSize: 13 }}>{i + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                {emp.name?.[0]?.toUpperCase()}
                              </div>
                              <strong>{emp.name}</strong>
                            </div>
                          </td>
                          <td><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{emp.employee_code}</span></td>
                          <td><span style={{ color: '#10b981', fontWeight: 700 }}>✅ {emp.present || 0}</span></td>
                          <td><span style={{ color: '#ef4444', fontWeight: 700 }}>❌ {emp.absent || 0}</span></td>
                          <td><span style={{ color: '#f59e0b', fontWeight: 700 }}>🕐 {emp.leave || 0}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, minWidth: 80 }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pctColor, borderRadius: 4 }} />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: pctColor, minWidth: 36 }}>{pct}%</span>
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
        )}
      </div>

      {/* MARK ATTENDANCE MODAL */}
      {showMarkModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMarkModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">📝 Mark Attendance</div>
              <button className="modal-close" onClick={() => setShowMarkModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Select Employee *</label>
                  <select className="form-select" style={{ width: '100%' }} value={markForm.employee_id} onChange={e => setMarkForm({ ...markForm, employee_id: e.target.value })}>
                    <option value="">-- Select employee --</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.user_name || s.name || 'Employee'} ({s.employee_code || `ID:${s.id}`})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={markForm.date} onChange={e => setMarkForm({ ...markForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select className="form-select" value={markForm.status} onChange={e => setMarkForm({ ...markForm, status: e.target.value })}>
                    <option value="present">✅ Present</option>
                    <option value="absent">❌ Absent</option>
                    <option value="leave">🕐 Leave</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Check In Time</label>
                  <input className="form-input" type="time" value={markForm.check_in} onChange={e => setMarkForm({ ...markForm, check_in: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Check Out Time</label>
                  <input className="form-input" type="time" value={markForm.check_out} onChange={e => setMarkForm({ ...markForm, check_out: e.target.value })} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Notes (optional)</label>
                  <input className="form-input" value={markForm.notes} onChange={e => setMarkForm({ ...markForm, notes: e.target.value })} placeholder="e.g. Half day, medical leave..." />
                </div>
              </div>

              {canEdit && staffList.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', marginBottom: 8 }}>⚡ Quick Action</div>
                  <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }} disabled={saving} onClick={handleMarkAllPresent}>
                    ✅ Mark All {staffList.length} Employees Present for {markForm.date}
                  </button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowMarkModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleMark} disabled={saving}>
                {saving ? 'Saving...' : '📝 Mark Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}