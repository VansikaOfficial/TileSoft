import { useState, useEffect } from 'react';
import api from '../services/api';

const CATEGORIES = ['All','Floor Tiles','Wall Tiles','Outdoor Tiles','Bathroom Tiles','Kitchen Tiles','Designer Tiles'];
const COLORS = ['All','Beige','White','Black','Grey','Brown','Cream','Blue','Green'];
const PRICE_RANGES = [{ label:'All Prices', min:0, max:99999 },{ label:'Under ₹50', min:0, max:50 },{ label:'₹50–₹100', min:50, max:100 },{ label:'₹100–₹200', min:100, max:200 },{ label:'Above ₹200', min:200, max:99999 }];
const TILE_COLORS = { Beige:'#f5f0e8',White:'#f8f8f8',Black:'#2d2d2d',Grey:'#9e9e9e',Brown:'#795548',Cream:'#fff8e1',Blue:'#1976d2',Green:'#388e3c',Red:'#d32f2f',Yellow:'#f9a825',Multi:'#9c27b0' };

function TileCard({ product, onView, onEstimate }) {
  const [hovered, setHovered] = useState(false);
  const hasImage = !!product.image_url;
  const tileColor = TILE_COLORS[product.color] || '#e2e8f0';

  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{ border:'1px solid #e2e8f0', borderRadius:14, overflow:'hidden', background:'white', boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)', transition:'all 0.2s', transform: hovered ? 'translateY(-3px)' : 'none' }}>
      {/* Tile visual */}
      <div style={{ height:170, background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
        {hasImage ? (
          <img src={product.image_url} alt={product.product_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div style={{ width:'100%', height:'100%', background:tileColor, display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, padding:20 }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{ background:tileColor, border:'1px solid rgba(0,0,0,0.08)', borderRadius:3, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 9px,rgba(0,0,0,0.04) 9px,rgba(0,0,0,0.04) 10px),repeating-linear-gradient(90deg,transparent,transparent 9px,rgba(0,0,0,0.04) 9px,rgba(0,0,0,0.04) 10px)' }} />
            ))}
          </div>
        )}
        <div style={{ position:'absolute', top:10, left:10 }}>
          <span style={{ background:'rgba(0,0,0,0.65)', color:'white', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{product.category||'Floor Tiles'}</span>
        </div>
        {product.color && (
          <div style={{ position:'absolute', top:10, right:10, width:20, height:20, borderRadius:'50%', background:tileColor, border:'2px solid white', boxShadow:'0 2px 4px rgba(0,0,0,0.2)' }} title={product.color} />
        )}
        {hovered && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', gap:10, alignItems:'center', justifyContent:'center' }}>
            <button onClick={()=>onView(product)} style={{ padding:'8px 14px', background:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>👁️ View</button>
            <button onClick={()=>onEstimate(product)} style={{ padding:'8px 14px', background:'#6366f1', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>🧮 Estimate</button>
          </div>
        )}
      </div>
      <div style={{ padding:14 }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:3, color:'#1e293b' }}>{product.product_name}</div>
        <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
          {product.size && <span style={{ background:'#f1f5f9', color:'#64748b', padding:'1px 7px', borderRadius:4, fontSize:11, fontWeight:600 }}>{product.size}</span>}
          {product.color && <span style={{ background:'#f1f5f9', color:'#64748b', padding:'1px 7px', borderRadius:4, fontSize:11 }}>{product.color}</span>}
          <span style={{ background:'#f1f5f9', color:'#64748b', padding:'1px 7px', borderRadius:4, fontSize:11, fontFamily:'monospace' }}>{product.hsn_code}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div><span style={{ fontSize:20, fontWeight:900, color:'#6366f1' }}>₹{product.rate}</span><span style={{ fontSize:12, color:'#94a3b8' }}>/{product.unit}</span></div>
          <button onClick={()=>onEstimate(product)} style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:8, padding:'7px 14px', fontWeight:600, fontSize:13, cursor:'pointer' }}>Get Quote</button>
        </div>
      </div>
    </div>
  );
}

function QuickQuote({ product, onClose }) {
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(10);
  const [wastage, setWastage] = useState(10);
  const area = length * width;
  const qty = Math.ceil(area * (1 + wastage/100));
  const total = qty * parseFloat(product.rate);

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:400 }}>
        <div className="modal-header">
          <div className="modal-title">🧮 Quick Estimate</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display:'flex', gap:12, alignItems:'center', background:'#f8fafc', borderRadius:10, padding:12, marginBottom:16 }}>
            <div style={{ width:60, height:60, borderRadius:8, background: TILE_COLORS[product.color]||'#e2e8f0', backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 14px,rgba(0,0,0,0.06) 14px,rgba(0,0,0,0.06) 15px),repeating-linear-gradient(90deg,transparent,transparent 14px,rgba(0,0,0,0.06) 14px,rgba(0,0,0,0.06) 15px)', flexShrink:0 }} />
            <div><div style={{ fontWeight:700, fontSize:15 }}>{product.product_name}</div><div style={{ fontSize:13, color:'#6366f1', fontWeight:700 }}>₹{product.rate}/{product.unit}</div></div>
          </div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Room Length (ft)</label><input className="form-input" type="number" value={length} onChange={e=>setLength(+e.target.value)} min="1" /></div>
            <div className="form-group"><label className="form-label">Room Width (ft)</label><input className="form-input" type="number" value={width} onChange={e=>setWidth(+e.target.value)} min="1" /></div>
            <div className="form-group full"><label className="form-label">Wastage %</label>
              <div style={{ display:'flex', gap:8 }}>
                {[5,10,15].map(w=><button key={w} onClick={()=>setWastage(w)} style={{ flex:1, padding:'7px', borderRadius:6, border: wastage===w?'2px solid #6366f1':'1px solid #e2e8f0', background: wastage===w?'#eef2ff':'white', fontWeight:600, fontSize:13, cursor:'pointer', color: wastage===w?'#6366f1':'#374151' }}>{w}%</button>)}
              </div>
            </div>
          </div>
          <div style={{ background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', borderRadius:10, padding:16, marginTop:8 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['Area',`${area} sqft`],['With Wastage',`${qty} sqft`],['Rate',`₹${product.rate}/${product.unit}`],['Total Cost',`₹${total.toLocaleString('en-IN')}`]].map(([l,v])=>(
                <div key={l}><div style={{ fontSize:11, color:'#6366f1', fontWeight:600 }}>{l}</div><div style={{ fontWeight:800, fontSize: l==='Total Cost'?18:14, color:'#1e293b' }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ marginTop:12, fontSize:13, color:'#64748b', textAlign:'center' }}>
            📱 Contact us: <strong>+91 98765 43210</strong> | WhatsApp for bulk pricing
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={()=>{ window.open(`https://wa.me/918531034528?text=${encodeURIComponent(`Hi TileSoft! I'm interested in ${product.product_name} (₹${product.rate}/${product.unit}). I need ${qty} sqft for my ${area} sqft room. Please send me a formal quotation.`)}`, '_blank'); }}>📱 WhatsApp Quote</button>
        </div>
      </div>
    </div>
  );
}

export default function TileGallery() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [color, setColor] = useState('All');
  const [priceRange, setPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [quickQuote, setQuickQuote] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  useEffect(() => {
    api.products.getAll().then(res => {
      setProducts(res.data?.products || res.data || []);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  const pr = PRICE_RANGES[priceRange];
  const filtered = products.filter(p => {
    const ms = !search || p.product_name?.toLowerCase().includes(search.toLowerCase());
    const mc = category==='All' || (p.category||'Floor Tiles')===category;
    const mcl = color==='All' || (p.color||'Beige')===color;
    const mp = parseFloat(p.rate||0) >= pr.min && parseFloat(p.rate||0) <= pr.max;
    return ms && mc && mcl && mp;
  }).sort((a,b) => {
    if (sortBy==='price_asc') return parseFloat(a.rate)-parseFloat(b.rate);
    if (sortBy==='price_desc') return parseFloat(b.rate)-parseFloat(a.rate);
    return a.product_name?.localeCompare(b.product_name);
  });

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc' }}>
      {/* Hero Banner */}
      <div style={{ background:'linear-gradient(135deg,#1e293b,#334155,#1e3a5f)', padding:'40px 40px 30px', color:'white' }}>
        <div style={{ fontSize:32, fontWeight:900, letterSpacing:1, marginBottom:4 }}>🧱 TileSoft Gallery</div>
        <div style={{ opacity:0.8, fontSize:15, marginBottom:24 }}>Discover premium tiles for every space — {products.length} products available</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:240, background:'rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
            <span>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tiles..." style={{ background:'none', border:'none', color:'white', outline:'none', fontSize:14, flex:1 }} />
          </div>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:'10px 14px', borderRadius:10, border:'none', background:'rgba(255,255,255,0.15)', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <option value="name" style={{ color:'black' }}>Sort: Name</option>
            <option value="price_asc" style={{ color:'black' }}>Price: Low to High</option>
            <option value="price_desc" style={{ color:'black' }}>Price: High to Low</option>
          </select>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:0, minHeight:'calc(100vh - 200px)' }}>
        {/* Filters sidebar */}
        <div style={{ background:'white', padding:20, borderRight:'1px solid #e2e8f0' }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:'#1e293b' }}>🎛️ Filters</div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Category</div>
            {CATEGORIES.map(c=>(
              <div key={c} onClick={()=>setCategory(c)} style={{ padding:'7px 10px', borderRadius:8, cursor:'pointer', fontWeight: category===c?700:400, background: category===c?'#eef2ff':'transparent', color: category===c?'#6366f1':'#374151', fontSize:14, marginBottom:2 }}>
                {category===c?'▶ ':''}{c}
              </div>
            ))}
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Color</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {COLORS.map(c=>(
                <div key={c} onClick={()=>setColor(c)} title={c} style={{ width:26, height:26, borderRadius:6, background: c==='All'?'linear-gradient(135deg,#f44336,#2196f3,#4caf50)':(TILE_COLORS[c]||'#e2e8f0'), border: color===c?'3px solid #6366f1':'2px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>
                  {c==='All'?'✦':''}
                </div>
              ))}
            </div>
            {color!=='All' && <div style={{ fontSize:12, color:'#6366f1', marginTop:4, fontWeight:600 }}>Selected: {color}</div>}
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Price Range</div>
            {PRICE_RANGES.map((r,i)=>(
              <div key={r.label} onClick={()=>setPriceRange(i)} style={{ padding:'7px 10px', borderRadius:8, cursor:'pointer', fontWeight: priceRange===i?700:400, background: priceRange===i?'#eef2ff':'transparent', color: priceRange===i?'#6366f1':'#374151', fontSize:13, marginBottom:2 }}>
                {priceRange===i?'▶ ':''}{r.label}
              </div>
            ))}
          </div>
          <button onClick={()=>{setCategory('All');setColor('All');setPriceRange(0);setSearch('');}} style={{ width:'100%', padding:'8px', background:'#f1f5f9', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13, color:'#64748b' }}>
            ✕ Clear Filters
          </button>
        </div>

        {/* Products grid */}
        <div style={{ padding:24 }}>
          <div style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:14, color:'#64748b' }}><strong style={{ color:'#1e293b' }}>{filtered.length}</strong> tiles found</span>
          </div>
          {loading ? <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>Loading tiles...</div> : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:60 }}>
              <div style={{ fontSize:48 }}>🧱</div>
              <div style={{ fontWeight:700, color:'#1e293b', marginTop:12 }}>No tiles found</div>
              <div style={{ color:'#94a3b8', marginTop:4 }}>Try adjusting your filters</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:18 }}>
              {filtered.map(p => <TileCard key={p.id} product={p} onView={setViewProduct} onEstimate={setQuickQuote} />)}
            </div>
          )}
        </div>
      </div>

      {/* Quick Quote Modal */}
      {quickQuote && <QuickQuote product={quickQuote} onClose={()=>setQuickQuote(null)} />}

      {/* View Product Detail Modal */}
      {viewProduct && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setViewProduct(null)}>
          <div className="modal" style={{ maxWidth:520 }}>
            <div className="modal-header">
              <div className="modal-title">🧱 {viewProduct.product_name}</div>
              <button className="modal-close" onClick={()=>setViewProduct(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ height:220, borderRadius:12, overflow:'hidden', marginBottom:16, background:TILE_COLORS[viewProduct.color]||'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {viewProduct.image_url ? (
                  <img src={viewProduct.image_url} alt={viewProduct.product_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  <div style={{ width:'100%', height:'100%', background:TILE_COLORS[viewProduct.color]||'#e2e8f0', backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(0,0,0,0.06) 27px,rgba(0,0,0,0.06) 28px),repeating-linear-gradient(90deg,transparent,transparent 27px,rgba(0,0,0,0.06) 27px,rgba(0,0,0,0.06) 28px)' }} />
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {[['Category',viewProduct.category||'Floor Tiles'],['Color',viewProduct.color||'—'],['Size',viewProduct.size||'Standard'],['HSN Code',viewProduct.hsn_code],['Rate',`₹${viewProduct.rate}/${viewProduct.unit}`],['Unit',viewProduct.unit]].map(([l,v])=>(
                  <div key={l} style={{ background:'#f8fafc', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:2 }}>{l}</div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setViewProduct(null)}>Close</button>
              <button className="btn btn-primary" onClick={()=>{setQuickQuote(viewProduct);setViewProduct(null);}}>🧮 Get Estimate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
