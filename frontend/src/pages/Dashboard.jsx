import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
const daysSince = (d) => d ? Math.floor((new Date() - new Date(d)) / 86400000) : 0;

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState({ monthlyTrend: [], topProducts: [] });
  const [invoices, setInvoices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  useEffect(() => {
    Promise.all([
      api.dashboard.stats().catch(() => ({ data: {} })),
      api.dashboard.analytics().catch(() => ({ data: {} })),
      api.invoices.getAll().catch(() => ({ data: [] })),
      api.employees.getAll().catch(() => ({ data: [] })),
      api.products.getAll().catch(() => ({ data: [] })),
    ]).then(([statsRes, analyticsRes, invRes, empRes, prodRes]) => {
      setStats(statsRes.data || {});
      setAnalytics(analyticsRes.data || {});
      const allInv = invRes.data?.invoices || invRes.data || [];
      setInvoices(allInv);
      const allEmp = empRes.data?.employees || empRes.data || [];
      setEmployees(allEmp);
      const allProd = prodRes.data?.products || prodRes.data || [];
      setProducts(allProd);
      setLoading(false);
    });
  }, []);

  // Payment reminders — overdue + pending > 7 days
  const reminders = invoices.filter(inv => {
    if (dismissedAlerts.includes(inv.id)) return false;
    if (inv.status === 'overdue') return true;
    if (inv.status === 'pending' && inv.due_date && new Date(inv.due_date) < new Date()) return true;
    if (inv.status === 'pending' && daysSince(inv.invoice_date) > 7) return true;
    return false;
  }).slice(0, 5);

  const recentInvoices = invoices.filter(i => i.status !== 'quotation').slice(0, 5);

  const lowStockCount = products.filter(p => parseInt(p.stock_quantity) > 0 && parseInt(p.stock_quantity) <= (parseInt(p.reorder_level) || 10)).length;
  const outOfStockCount = products.filter(p => parseInt(p.stock_quantity) === 0).length;

  const STAT_CARDS = [
    { label: 'Total Products', value: products.length || stats.totalProducts || 0, icon: '🧱', color: 'blue' },
    { label: 'Total Revenue', value: `₹${(stats.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: '💰', color: 'green' },
    { label: 'Pending Invoices', value: invoices.filter(i => i.status === 'pending').length, icon: '🧾', color: 'orange' },
    { label: 'Total Employees', value: employees.length, icon: '👥', color: 'purple' },
  ];

  const monthlyData = analytics.monthlyTrend?.length
    ? analytics.monthlyTrend
    : [{ month: 'Sep', revenue: 0 }, { month: 'Oct', revenue: 0 }, { month: 'Nov', revenue: 0 }, { month: 'Dec', revenue: 0 }, { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 }];

  const topProducts = analytics.topProducts?.length ? analytics.topProducts : [{ name: 'No data', sales: 0 }];

  const statusColor = { paid: '#10b981', pending: '#f97316', overdue: '#ef4444', partial: '#6366f1', quotation: '#1d4ed8' };
  const statusBg = { paid: '#d1fae5', pending: '#fef3c7', overdue: '#fee2e2', partial: '#eef2ff', quotation: '#dbeafe' };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Welcome back, {user.name || user.email}!</div>
        </div>
        <div className="page-date">Current Date<strong>{today}</strong></div>
      </div>

      <div className="page-body">
        {/* ── PAYMENT REMINDERS ── */}
        {reminders.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🔔</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#ef4444' }}>Payment Reminders</span>
              <span style={{ background: '#fee2e2', color: '#ef4444', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{reminders.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reminders.map(inv => {
                const days = daysSince(inv.invoice_date);
                const isOverdue = inv.status === 'overdue';
                return (
                  <div key={inv.id} style={{ background: isOverdue ? '#fff5f5' : '#fffbeb', border: `1px solid ${isOverdue ? '#fecaca' : '#fcd34d'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 22 }}>{isOverdue ? '🚨' : '⚠️'}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {inv.customer_name || 'Walk-in Customer'}
                          <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 12, color: '#6366f1' }}>{inv.invoice_number}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {isOverdue ? `🔴 Overdue by ${days} days` : `🟡 Pending for ${days} days`}
                          {inv.due_date && ` • Due: ${new Date(inv.due_date).toLocaleDateString('en-IN')}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: isOverdue ? '#ef4444' : '#f97316' }}>
                          ₹{parseFloat(inv.total_amount || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 11, background: isOverdue ? '#fee2e2' : '#fef3c7', color: isOverdue ? '#991b1b' : '#92400e', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                          {inv.status?.toUpperCase()}
                        </div>
                      </div>
                      <button onClick={() => setDismissedAlerts(p => [...p, inv.id])} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', padding: '6px 10px', fontSize: 13 }} title="Dismiss">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          {STAT_CARDS.map((card) => (
            <div key={card.label} className={`stat-card ${card.color}`}>
              <div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-value">{card.value}</div>
              </div>
              <div className="stat-icon">{card.icon}</div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ── */}
        <div className="charts-grid" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header"><span>📈</span><span className="card-title">Revenue Trend (Last 6 Months)</span></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={v => `₹${parseFloat(v).toLocaleString('en-IN')}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span>🧱</span><span className="card-title">Top Selling Products</span></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#10b981" radius={[4,4,0,0]} name="Sales Qty" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── RECENT INVOICES ── */}
        <div className="card">
          <div className="card-header"><span>🧾</span><span className="card-title">Recent Invoices</span></div>
          <div className="table-container">
            {loading ? <div className="loading">Loading...</div> : (
              <table>
                <thead><tr><th>Invoice #</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {recentInvoices.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No invoices yet</td></tr>
                  ) : recentInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td><strong style={{ color: '#6366f1' }}>{inv.invoice_number}</strong></td>
                      <td>{inv.customer_name || inv.notes?.match(/Walk-in: ([^|]+)/)?.[1]?.trim() || 'Walk-in Customer'}</td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td><strong>₹{parseFloat(inv.total_amount || 0).toLocaleString('en-IN')}</strong></td>
                      <td>
                        <span style={{ background: statusBg[inv.status] || '#f1f5f9', color: statusColor[inv.status] || '#64748b', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {inv.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}