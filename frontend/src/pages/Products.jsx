import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const today = new Date().toLocaleDateString('en-US', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
const EMPTY_FORM = { product_name:'', hsn_code:'', rate:'', unit:'sqft', image_url:'', category:'Floor Tiles', color:'Beige', size:'600x600mm', stock_quantity:0, reorder_level:50 };
const UNITS = ['sqft','piece','box','meter','kg','set'];
const CATEGORIES = ['Floor Tiles','Wall Tiles','Outdoor Tiles','Bathroom Tiles','Kitchen Tiles','Designer Tiles'];
const COLORS = ['Beige','White','Black','Grey','Brown','Cream','Blue','Green','Red','Yellow','Multi'];
const SIZES = ['300x300mm','400x400mm','600x600mm','800x800mm','300x600mm','600x1200mm','Custom'];
const TILE_COLORS = { Beige:'#f5f0e8',White:'#f8f8f8',Black:'#2d2d2d',Grey:'#9e9e9e',Brown:'#795548',Cream:'#fff8e1',Blue:'#1976d2',Green:'#388e3c',Red:'#d32f2f',Yellow:'#f9a825',Multi:'#9c27b0' };

function StockBadge({ qty, reorder }) {
  if (qty <= 0) return <span style={{ background:'#fee2e2', color:'#991b1b', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>🔴 Out of Stock</span>;
  if (qty <= reorder) return <span style={{ background:'#fef3c7', color:'#92400e', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>🟡 Low Stock ({qty})</span>;
  return <span style={{ background:'#d1fae5', color:'#065f46', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>🟢 In Stock ({qty})</span>;
}

function TilePreview({ product, size=40 }) {
  if (product.image_url) return <img src={product.image_url} alt={product.product_name} style={{ width:size, height:size, objectFit:'cover', borderRadius:8, border:'1px solid #e2e8f0' }} onError={e=>e.target.style.display='none'} />;
  const color = TILE_COLORS[product.color] || '#e2e8f0';
  return <div style={{ width:size, height:size, borderRadius:8, background:color, border:'2px solid rgba(0,0,0,0.1)', backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 9px,rgba(0,0,0,0.06) 9px,rgba(0,0,0,0.06) 10px),repeating-linear-gradient(90deg,transparent,transparent 9px,rgba(0,0,0,0.06) 9px,rgba(0,0,0,0.06) 10px)' }} />;
}

export default function Products() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = ['admin','manager'].includes(user.role);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const fileRef = useRef();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const res = await api.products.getAll(); setProducts(res.data?.products || res.data || []); }
    catch { setProducts([]); }
    setLoading(false);
  };

  const showAlert = (msg, type='success') => { setAlert({msg,type}); setTimeout(()=>setAlert(null),3000); };
  const openAdd = () => { setEditProduct(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ product_name:p.product_name, hsn_code:p.hsn_code, rate:p.rate, unit:p.unit, image_url:p.image_url||'', category:p.category||'Floor Tiles', color:p.color||'Beige', size:p.size||'600x600mm', stock_quantity:p.stock_quantity||0, reorder_level:p.reorder_level||50 }); setShowModal(true); };

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2*1024*1024) { showAlert('Image must be under 2MB','error'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => { setForm(f=>({...f,image_url:ev.target.result})); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.product_name||!form.hsn_code||!form.rate||!form.unit) { showAlert('Fill all required fields','error'); return; }
    setSaving(true);
    try {
      if (editProduct) { await api.products.update(editProduct.id, form); showAlert('Product updated!'); }
      else { await api.products.create(form); showAlert('Product added!'); }
      setShowModal(false); load();
    } catch(e) { showAlert(e.response?.data?.message||'Error','error'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.products.delete(id); showAlert('Deleted!'); load(); }
    catch { showAlert('Cannot delete — used in invoices','error'); }
  };

  const filtered = products.filter(p => {
    const ms = !search || p.product_name?.toLowerCase().includes(search.toLowerCase()) || p.hsn_code?.toLowerCase().includes(search.toLowerCase());
    const mc = !catFilter || (p.category||'Floor Tiles')===catFilter;
    const mst = !stockFilter || (stockFilter==='out' && (p.stock_quantity||0)<=0) || (stockFilter==='low' && (p.stock_quantity||0)>0 && (p.stock_quantity||0)<=(p.reorder_level||50)) || (stockFilter==='ok' && (p.stock_quantity||0)>(p.reorder_level||50));
    return ms && mc && mst;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, catFilter, stockFilter]);

  const outOfStock = products.filter(p=>parseInt(p.stock_quantity||0)<=0).length;
  const lowStock = products.filter(p=>parseInt(p.stock_quantity||0)>0&&parseInt(p.stock_quantity||0)<=parseInt(p.reorder_level||10)).length;
  const totalStock = products.reduce((s,p)=>s+parseInt(p.stock_quantity||0),0);

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Products</div><div className="page-subtitle">Manage your tile catalog & stock</div></div>
        <div className="page-date">Current Date<strong>{today}</strong></div>
      </div>
      <div className="page-body">
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:18 }}>
          {[
            { label:'Total Products', value:products.length, color:'#6366f1', bg:'#eef2ff', icon:'🧱' },
            { label:'Total Stock', value:totalStock.toLocaleString('en-IN'), color:'#10b981', bg:'#f0fdf4', icon:'📦' },
            { label:'Low Stock', value:lowStock, color:'#f97316', bg:'#fff7ed', icon:'🟡', click:()=>setStockFilter(stockFilter==='low'?'':'low') },
            { label:'Out of Stock', value:outOfStock, color:'#ef4444', bg:'#fef2f2', icon:'🔴', click:()=>setStockFilter(stockFilter==='out'?'':'out') },
            { label:'Avg Rate', value:`₹${products.length?Math.round(products.reduce((s,p)=>s+parseFloat(p.rate||0),0)/products.length):0}`, color:'#8b5cf6', bg:'#f5f3ff', icon:'💰' },
          ].map(c=>(
            <div key={c.label} onClick={c.click} style={{ background:c.bg, borderRadius:12, padding:14, borderLeft:`4px solid ${c.color}`, cursor:c.click?'pointer':'default', transition:'all 0.2s' }}>
              <div style={{ fontSize:11, fontWeight:600, color:c.color, marginBottom:3 }}>{c.icon} {c.label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Low stock alert */}
        {lowStock > 0 && (
          <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:10, padding:'10px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
            <span style={{ fontSize:18 }}>⚠️</span>
            <span><strong>{lowStock} products</strong> are running low on stock!</span>
            <button onClick={()=>setStockFilter('low')} style={{ marginLeft:8, padding:'4px 12px', background:'#f97316', color:'white', border:'none', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:12 }}>View Low Stock</button>
          </div>
        )}

        <div className="card">
          <div className="toolbar">
            <div className="search-box"><span>🔍</span><input placeholder="Search by name or HSN..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
            <select className="filter-select" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={stockFilter} onChange={e=>setStockFilter(e.target.value)}>
              <option value="">All Stock</option>
              <option value="ok">🟢 In Stock</option>
              <option value="low">🟡 Low Stock</option>
              <option value="out">🔴 Out of Stock</option>
            </select>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={()=>setViewMode('table')} style={{ padding:'7px 12px', borderRadius:6, border:'none', background:viewMode==='table'?'#6366f1':'#f1f5f9', color:viewMode==='table'?'white':'#64748b', cursor:'pointer', fontWeight:600, fontSize:13 }}>☰ Table</button>
              <button onClick={()=>setViewMode('grid')} style={{ padding:'7px 12px', borderRadius:6, border:'none', background:viewMode==='grid'?'#6366f1':'#f1f5f9', color:viewMode==='grid'?'white':'#64748b', cursor:'pointer', fontWeight:600, fontSize:13 }}>⊞ Grid</button>
            </div>
            {canEdit && <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>}
          </div>

          {loading ? <div className="loading">Loading...</div> : filtered.length===0 ? (
            <div className="empty-state"><div className="empty-state-icon">🧱</div><p>No products found</p></div>
          ) : viewMode==='table' ? (
            <div className="table-container">
              <table>
                <thead><tr><th>#</th><th>Product</th><th>Category</th><th>HSN</th><th>Rate</th><th>Stock</th><th>Size</th><th>Unit</th>{canEdit&&<th>Actions</th>}</tr></thead>
                <tbody>
                  {paginated.map((p,i)=>(
                    <tr key={p.id}>
                      <td style={{ color:'#94a3b8', fontSize:13 }}>{(page-1)*PAGE_SIZE+i+1}</td>
                      <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><TilePreview product={p} size={40} /><div><strong>{p.product_name}</strong><div style={{ fontSize:11, color:'#94a3b8' }}>{p.color}</div></div></div></td>
                      <td><span style={{ background:'#f1f5f9', padding:'2px 8px', borderRadius:6, fontSize:12, fontWeight:600 }}>{p.category||'Floor Tiles'}</span></td>
                      <td><span style={{ fontFamily:'monospace', background:'#f1f5f9', padding:'2px 8px', borderRadius:4, fontSize:12 }}>{p.hsn_code}</span></td>
                      <td><strong style={{ color:'#1d4ed8', fontSize:15 }}>₹{p.rate}</strong></td>
                      <td><StockBadge qty={p.stock_quantity||0} reorder={p.reorder_level||50} /></td>
                      <td style={{ fontSize:12, color:'#64748b' }}>{p.size||'—'}</td>
                      <td><span className="badge badge-blue">{p.unit}</span></td>
                      {canEdit&&<td><div style={{ display:'flex', gap:6 }}><button className="btn-icon btn-icon-edit" onClick={()=>openEdit(p)}>✏️</button><button className="btn-icon btn-icon-delete" onClick={()=>handleDelete(p.id)}>🗑️</button></div></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:14, padding:16 }}>
              {paginated.map(p=>(
                <div key={p.id} style={{ border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', background:'white' }}>
                  <div style={{ height:130, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
                    {p.image_url ? <img src={p.image_url} alt={p.product_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:80, height:80, borderRadius:8, background:TILE_COLORS[p.color]||'#e2e8f0', backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 14px,rgba(0,0,0,0.07) 14px,rgba(0,0,0,0.07) 15px),repeating-linear-gradient(90deg,transparent,transparent 14px,rgba(0,0,0,0.07) 14px,rgba(0,0,0,0.07) 15px)' }} />}
                    <div style={{ position:'absolute', top:6, right:6 }}><StockBadge qty={p.stock_quantity||0} reorder={p.reorder_level||50} /></div>
                  </div>
                  <div style={{ padding:10 }}>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{p.product_name}</div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <strong style={{ color:'#6366f1' }}>₹{p.rate}/{p.unit}</strong>
                      {canEdit&&<div style={{ display:'flex', gap:4 }}><button onClick={()=>openEdit(p)} style={{ background:'#eef2ff', border:'none', borderRadius:6, color:'#6366f1', cursor:'pointer', padding:'3px 7px', fontSize:12 }}>✏️</button><button onClick={()=>handleDelete(p.id)} style={{ background:'#fef2f2', border:'none', borderRadius:6, color:'#ef4444', cursor:'pointer', padding:'3px 7px', fontSize:12 }}>🗑️</button></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
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
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal" style={{ maxWidth:600 }}>
            <div className="modal-header">
              <div className="modal-title">{editProduct?'✏️ Edit Product':'🧱 Add Product'}</div>
              <button className="modal-close" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Image upload */}
              <div style={{ marginBottom:14, textAlign:'center' }}>
                <div style={{ width:100, height:100, margin:'0 auto 8px', borderRadius:10, overflow:'hidden', background:'#f8fafc', border:'2px dashed #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }} onClick={()=>fileRef.current?.click()}>
                  {form.image_url ? <img src={form.image_url} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ textAlign:'center' }}><div style={{ fontSize:28 }}>📷</div><div style={{ fontSize:10, color:'#94a3b8' }}>Upload</div></div>}
                  {uploading && <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', justifyContent:'center' }}>⏳</div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageUpload} />
                <button type="button" onClick={()=>fileRef.current?.click()} style={{ padding:'4px 12px', background:'#eef2ff', color:'#6366f1', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>📷 Upload Photo</button>
                {form.image_url && <button type="button" onClick={()=>setForm(f=>({...f,image_url:''}))} style={{ marginLeft:6, padding:'4px 12px', background:'#fef2f2', color:'#ef4444', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}>✕</button>}
              </div>
              <div className="form-grid">
                <div className="form-group full"><label className="form-label">Product Name *</label><input className="form-input" value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">HSN Code *</label><input className="form-input" value={form.hsn_code} onChange={e=>setForm({...form,hsn_code:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Rate (₹) *</label><input className="form-input" type="number" step="0.01" value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Unit *</label><select className="form-select" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}>{UNITS.map(u=><option key={u} value={u}>{u}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Color</label><select className="form-select" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}>{COLORS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Size</label><select className="form-select" value={form.size} onChange={e=>setForm({...form,size:e.target.value})}>{SIZES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Stock Quantity</label><input className="form-input" type="number" min="0" value={form.stock_quantity} onChange={e=>setForm({...form,stock_quantity:+e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Reorder Level</label><input className="form-input" type="number" min="0" value={form.reorder_level} onChange={e=>setForm({...form,reorder_level:+e.target.value})} /></div>
              </div>
              {/* Color swatches */}
              <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                {COLORS.slice(0,9).map(c=>(
                  <div key={c} onClick={()=>setForm(f=>({...f,color:c}))} title={c} style={{ width:24, height:24, borderRadius:5, background:TILE_COLORS[c]||'#e2e8f0', border:form.color===c?'3px solid #6366f1':'2px solid #e2e8f0', cursor:'pointer' }} />
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?'Saving...':editProduct?'Update':'Add Product'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}