import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const ROOM_TYPES = [
  { type:'living', label:'Living Room', icon:'🛋️', defaultW:18, defaultH:15 },
  { type:'bedroom', label:'Bedroom', icon:'🛏️', defaultW:14, defaultH:12 },
  { type:'bathroom', label:'Bathroom', icon:'🚿', defaultW:8, defaultH:6 },
  { type:'kitchen', label:'Kitchen', icon:'🍳', defaultW:10, defaultH:8 },
  { type:'balcony', label:'Balcony', icon:'🌿', defaultW:8, defaultH:4 },
  { type:'dining', label:'Dining', icon:'🪑', defaultW:12, defaultH:10 },
  { type:'corridor', label:'Corridor', icon:'🚪', defaultW:12, defaultH:4 },
  { type:'puja', label:'Puja Room', icon:'🪔', defaultW:8, defaultH:6 },
];
const WASTAGE = [5,10,15];
const TILE_COLORS = { Beige:'#f5f0e8',White:'#f8f8f8',Black:'#2d2d2d',Grey:'#9e9e9e',Brown:'#795548',Cream:'#fff8e1',Blue:'#1976d2',Green:'#388e3c',Red:'#d32f2f',Yellow:'#f9a825' };

let roomCounter = 1;
const newRoom = (type) => {
  const rt = ROOM_TYPES.find(r=>r.type===type) || ROOM_TYPES[0];
  return { id: roomCounter++, type:rt.type, label:rt.label, icon:rt.icon, length:rt.defaultW, width:rt.defaultH, wastage:10, tile_id:'', floor_tile:null, wall_tile:null, includeWall: ['bathroom','kitchen'].includes(rt.type) };
};

export default function ProjectEstimator() {
  const [products, setProducts] = useState([]);
  const [rooms, setRooms] = useState([newRoom('living'), newRoom('bedroom'), newRoom('bathroom')]);
  const [projectName, setProjectName] = useState('My Home Project');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const printRef = useRef();
  const today = new Date().toLocaleDateString('en-US', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
  const printDate = new Date().toLocaleDateString('en-IN');

  useEffect(() => {
    api.products.getAll().then(res => setProducts(res.data?.products || res.data || [])).catch(()=>{});
  }, []);

  const showAlert = (msg,type='success') => { setAlert({msg,type}); setTimeout(()=>setAlert(null),3000); };

  const updateRoom = (id, field, value) => {
    setRooms(rooms.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'tile_id') updated.floor_tile = products.find(p => p.id == value) || null;
      if (field === 'wall_tile_id') updated.wall_tile = products.find(p => p.id == value) || null;
      return updated;
    }));
  };

  const addRoom = (type) => setRooms([...rooms, newRoom(type)]);
  const removeRoom = (id) => setRooms(rooms.filter(r=>r.id!==id));

  const getRoomCalc = (room) => {
    const floorArea = room.length * room.width;
    const wallArea = room.includeWall ? 2 * (room.length + room.width) * 9 : 0; // 9ft height
    const floorQty = Math.ceil(floorArea * (1 + room.wastage/100));
    const wallQty = Math.ceil(wallArea * (1 + room.wastage/100));
    const floorCost = room.floor_tile ? floorQty * parseFloat(room.floor_tile.rate||0) : 0;
    const wallCost = room.wall_tile && room.includeWall ? wallQty * parseFloat(room.wall_tile.rate||0) : 0;
    return { floorArea, wallArea, floorQty, wallQty, floorCost, wallCost, total: floorCost+wallCost };
  };

  const totalFloorArea = rooms.reduce((s,r)=>s+r.length*r.width,0);
  const grandTotal = rooms.reduce((s,r)=>s+getRoomCalc(r).total,0);
  const cgst = grandTotal * 0.14;
  const sgst = grandTotal * 0.14;
  const invoiceTotal = grandTotal + cgst + sgst;

  const handleGenerateQuotation = () => {
    if (!customerName) { showAlert('Please enter customer name above','error'); return; }
    setGenerated(true);
  };

  const handleSaveAsInvoice = async () => {
    setSaving(true);
    try {
      const items = rooms.flatMap(r => {
        const c = getRoomCalc(r);
        const arr = [];
        if (r.floor_tile) arr.push({ product_id: r.floor_tile.id, product_name: r.floor_tile.product_name, quantity: c.floorQty, rate: parseFloat(r.floor_tile.rate), unit: r.floor_tile.unit, amount: c.floorCost });
        if (r.wall_tile && r.includeWall) arr.push({ product_id: r.wall_tile.id, product_name: r.wall_tile.product_name, quantity: c.wallQty, rate: parseFloat(r.wall_tile.rate), unit: r.wall_tile.unit, amount: c.wallCost });
        return arr;
      });
      await api.invoices.create({
        walkin_name: customerName, walkin_phone: customerPhone,
        invoice_date: new Date().toISOString().split('T')[0],
        status: 'quotation',
        notes: `Project: ${projectName} | Walk-in: ${customerName} ${customerPhone}`,
        items,
      });
      showAlert('Quotation saved to Invoices!');
    } catch(e) { showAlert(e.response?.data?.message||'Error saving','error'); }
    setSaving(false);
  };

  const handlePrint = () => {
    const win = window.open('','_blank');
    win.document.write(`<html><head><title>Project Estimate — ${projectName}</title><style>
      *{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;padding:24px;font-size:12px;color:#1a1d23;}
      h1{font-size:22px;font-weight:900;letter-spacing:1px;margin-bottom:2px;}
      .header{background:linear-gradient(135deg,#1e293b,#334155);color:white;padding:18px 20px;border-radius:8px;margin-bottom:16px;}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
      .meta-box{background:#f8fafc;padding:12px;border-radius:8px;border-left:4px solid #6366f1;}
      .meta-box.green{border-left-color:#10b981;}
      table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;}
      thead{background:#1e293b;color:white;}
      th{padding:7px 10px;text-align:left;}
      td{padding:7px 10px;border-bottom:1px solid #f1f5f9;}
      .total-row{background:#eef2ff;font-weight:800;font-size:13px;}
      .grand{background:#1e293b;color:white;font-size:15px;font-weight:900;}
      .footer{text-align:center;margin-top:20px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px;}
    </style></head><body>${printRef.current?.innerHTML||''}</body></html>`);
    win.document.close(); win.print();
  };

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Project Estimator</div><div className="page-subtitle">Full house tile calculator — generate instant quotation</div></div>
        <div className="page-date">Current Date<strong>{today}</strong></div>
      </div>
      <div className="page-body">
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        {!generated ? (
          <>
            {/* Customer Info */}
            <div className="card" style={{ marginBottom:16 }}>
              <div className="card-header"><span>👤</span><span className="card-title">Project & Customer Details</span></div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="e.g. My 3BHK Home" /></div>
                  <div className="form-group"><label className="form-label">Customer Name *</label><input className="form-input" value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="e.g. Ramesh Kumar" /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} placeholder="10-digit mobile" /></div>
                </div>
              </div>
            </div>

            {/* Add Room Buttons */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#64748b', marginBottom:8 }}>Add Rooms:</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {ROOM_TYPES.map(rt => (
                  <button key={rt.type} onClick={()=>addRoom(rt.type)} style={{ padding:'7px 14px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:4 }}>
                    {rt.icon} {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Cards */}
            {rooms.map(room => {
              const calc = getRoomCalc(room);
              return (
                <div key={room.id} className="card" style={{ marginBottom:14, borderLeft:'4px solid #6366f1' }}>
                  <div className="card-header" style={{ background:'#f8fafc' }}>
                    <span>{room.icon}</span>
                    <span className="card-title">{room.label}</span>
                    <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
                      {calc.total > 0 && <span style={{ background:'#eef2ff', color:'#6366f1', padding:'3px 12px', borderRadius:20, fontWeight:700, fontSize:13 }}>₹{calc.total.toLocaleString('en-IN')}</span>}
                      {rooms.length > 1 && <button onClick={()=>removeRoom(room.id)} style={{ background:'#fef2f2', border:'none', borderRadius:6, color:'#ef4444', cursor:'pointer', padding:'4px 8px', fontSize:12 }}>✕ Remove</button>}
                    </div>
                  </div>
                  <div className="card-body">
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:12 }}>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">Length (ft)</label>
                        <input className="form-input" type="number" min="1" value={room.length} onChange={e=>updateRoom(room.id,'length',+e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">Width (ft)</label>
                        <input className="form-input" type="number" min="1" value={room.width} onChange={e=>updateRoom(room.id,'width',+e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">Wastage %</label>
                        <select className="form-select" value={room.wastage} onChange={e=>updateRoom(room.id,'wastage',+e.target.value)}>
                          {WASTAGE.map(w=><option key={w} value={w}>{w}%</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">Area</label>
                        <div className="form-input" style={{ background:'#f8fafc', fontWeight:700, color:'#6366f1' }}>{room.length*room.width} sqft</div>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">Floor Tile *</label>
                        <select className="form-select" value={room.tile_id||''} onChange={e=>updateRoom(room.id,'tile_id',e.target.value)}>
                          <option value="">Select floor tile...</option>
                          {products.map(p=><option key={p.id} value={p.id}>{p.product_name} — ₹{p.rate}/{p.unit}</option>)}
                        </select>
                        {room.floor_tile && (
                          <div style={{ marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:16, height:16, borderRadius:3, background:TILE_COLORS[room.floor_tile.color]||'#e2e8f0', flexShrink:0 }} />
                            <span style={{ fontSize:11, color:'#6366f1', fontWeight:600 }}>{calc.floorQty} sqft = ₹{calc.floorCost.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                          Wall Tile
                          <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:400, color:'#64748b', cursor:'pointer' }}>
                            <input type="checkbox" checked={room.includeWall} onChange={e=>updateRoom(room.id,'includeWall',e.target.checked)} />
                            Include walls
                          </label>
                        </label>
                        <select className="form-select" value={room.wall_tile_id||''} onChange={e=>updateRoom(room.id,'wall_tile_id',e.target.value)} disabled={!room.includeWall}>
                          <option value="">Select wall tile...</option>
                          {products.map(p=><option key={p.id} value={p.id}>{p.product_name} — ₹{p.rate}/{p.unit}</option>)}
                        </select>
                        {room.wall_tile && room.includeWall && (
                          <div style={{ marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:16, height:16, borderRadius:3, background:TILE_COLORS[room.wall_tile.color]||'#e2e8f0', flexShrink:0 }} />
                            <span style={{ fontSize:11, color:'#10b981', fontWeight:600 }}>{calc.wallQty} sqft = ₹{calc.wallCost.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Grand Total Preview */}
            <div style={{ background:'linear-gradient(135deg,#1e293b,#334155)', borderRadius:14, padding:20, color:'white', marginBottom:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                {[
                  { label:'Total Rooms', value:rooms.length },
                  { label:'Total Floor Area', value:`${totalFloorArea} sqft` },
                  { label:'Subtotal', value:`₹${grandTotal.toLocaleString('en-IN',{maximumFractionDigits:0})}` },
                  { label:'Total with GST', value:`₹${invoiceTotal.toLocaleString('en-IN',{maximumFractionDigits:0})}` },
                ].map(c=>(
                  <div key={c.label} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:11, opacity:0.7, marginBottom:2 }}>{c.label}</div>
                    <div style={{ fontSize:18, fontWeight:800 }}>{c.value}</div>
                  </div>
                ))}
              </div>
              <button onClick={handleGenerateQuotation} style={{ width:'100%', padding:14, background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:10, fontSize:16, fontWeight:800, cursor:'pointer', letterSpacing:0.5 }}>
                🧾 Generate Full Quotation
              </button>
            </div>
          </>
        ) : (
          /* Generated Quotation View */
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#10b981' }}>✅ Quotation Generated!</div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setGenerated(false)} style={{ padding:'8px 16px', background:'#f1f5f9', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>✏️ Edit</button>
                <button onClick={handlePrint} style={{ padding:'8px 16px', background:'#1e293b', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>🖨️ Print</button>
                <button onClick={handleSaveAsInvoice} disabled={saving} style={{ padding:'8px 16px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>
                  {saving?'Saving...':'💾 Save as Quotation'}
                </button>
                <button onClick={()=>{ const msg = `Project Estimate — ${projectName}\nCustomer: ${customerName}\n\n${rooms.map(r=>{const c=getRoomCalc(r);return `${r.icon} ${r.label}: ₹${c.total.toLocaleString('en-IN')}`;}).join('\n')}\n\nSubtotal: ₹${grandTotal.toLocaleString('en-IN',{maximumFractionDigits:0})}\nGST (28%): ₹${(cgst+sgst).toLocaleString('en-IN',{maximumFractionDigits:0})}\nTotal: ₹${invoiceTotal.toLocaleString('en-IN',{maximumFractionDigits:0})}\n\nPlease confirm to proceed!`; window.open(`https://wa.me/${customerPhone.replace(/\D/g,'')||'9185310345280'}?text=${encodeURIComponent(msg)}`,'_blank'); }} style={{ padding:'8px 16px', background:'#25d366', color:'white', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 }}>
                  📱 WhatsApp
                </button>
              </div>
            </div>

            <div ref={printRef}>
              {/* Quotation Header */}
              <div style={{ background:'linear-gradient(135deg,#1e293b,#334155)', color:'white', padding:20, borderRadius:8, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:24, fontWeight:900, letterSpacing:1 }}>TileSoft</div>
                    <div style={{ opacity:0.7, fontSize:12 }}>Smart ERP for Tile Industry</div>
                    <div style={{ opacity:0.7, fontSize:11 }}>GSTIN: 29AABCT1234A1Z5 | +91 98765 43210</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ background:'#10b981', padding:'3px 14px', borderRadius:20, fontSize:12, fontWeight:700, marginBottom:4, display:'inline-block' }}>PROJECT QUOTATION</div>
                    <div style={{ fontWeight:800, fontSize:18 }}>{projectName}</div>
                    <div style={{ opacity:0.8, fontSize:12 }}>Date: {printDate}</div>
                    <div style={{ opacity:0.8, fontSize:12 }}>Valid for 15 days</div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                <div style={{ background:'#f8fafc', padding:14, borderRadius:8, borderLeft:'4px solid #6366f1' }}>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, marginBottom:6 }}>PREPARED FOR</div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{customerName}</div>
                  {customerPhone && <div style={{ fontSize:13, color:'#64748b' }}>📱 {customerPhone}</div>}
                </div>
                <div style={{ background:'#f8fafc', padding:14, borderRadius:8, borderLeft:'4px solid #10b981' }}>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, marginBottom:6 }}>PROJECT SUMMARY</div>
                  <div style={{ fontSize:13 }}>Rooms: <strong>{rooms.length}</strong></div>
                  <div style={{ fontSize:13 }}>Total Floor Area: <strong>{totalFloorArea} sqft</strong></div>
                </div>
              </div>

              {/* Room-wise Table */}
              <div className="card" style={{ marginBottom:14 }}>
                <div className="card-header"><span>📋</span><span className="card-title">Room-wise Tile Estimate</span></div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Room</th><th>Dimensions</th><th>Floor Tile</th><th>Floor Qty</th><th>Wall Tile</th><th>Wall Qty</th><th>Amount</th></tr></thead>
                    <tbody>
                      {rooms.map(room => {
                        const c = getRoomCalc(room);
                        return (
                          <tr key={room.id}>
                            <td><strong>{room.icon} {room.label}</strong></td>
                            <td style={{ fontSize:13, color:'#64748b' }}>{room.length}×{room.width} ft ({room.length*room.width} sqft)</td>
                            <td><div style={{ display:'flex', alignItems:'center', gap:6 }}>{room.floor_tile&&<div style={{ width:14,height:14,borderRadius:3,background:TILE_COLORS[room.floor_tile?.color]||'#e2e8f0',flexShrink:0 }} />}<span style={{ fontSize:13 }}>{room.floor_tile?.product_name||'—'}</span></div></td>
                            <td style={{ fontSize:13 }}>{c.floorQty} sqft</td>
                            <td style={{ fontSize:13 }}>{room.wall_tile&&room.includeWall?room.wall_tile.product_name:'—'}</td>
                            <td style={{ fontSize:13 }}>{room.wall_tile&&room.includeWall?`${c.wallQty} sqft`:'—'}</td>
                            <td><strong style={{ color:'#6366f1' }}>₹{c.total.toLocaleString('en-IN',{maximumFractionDigits:0})}</strong></td>
                          </tr>
                        );
                      })}
                      <tr style={{ background:'#f8fafc', fontWeight:700 }}>
                        <td colSpan="6" style={{ textAlign:'right', padding:'10px' }}>Subtotal</td>
                        <td style={{ padding:'10px' }}>₹{grandTotal.toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
                      </tr>
                      <tr style={{ background:'#f8fafc' }}>
                        <td colSpan="6" style={{ textAlign:'right', padding:'6px 10px', color:'#f97316' }}>CGST (14%)</td>
                        <td style={{ padding:'6px 10px', color:'#f97316' }}>₹{cgst.toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
                      </tr>
                      <tr style={{ background:'#f8fafc' }}>
                        <td colSpan="6" style={{ textAlign:'right', padding:'6px 10px', color:'#10b981' }}>SGST (14%)</td>
                        <td style={{ padding:'6px 10px', color:'#10b981' }}>₹{sgst.toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
                      </tr>
                      <tr style={{ background:'#eef2ff' }}>
                        <td colSpan="6" style={{ textAlign:'right', padding:'12px 10px', fontWeight:800, fontSize:16, color:'#6366f1' }}>TOTAL AMOUNT</td>
                        <td style={{ padding:'12px 10px', fontWeight:900, fontSize:18, color:'#6366f1' }}>₹{invoiceTotal.toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms */}
              <div style={{ background:'#f8fafc', borderRadius:8, padding:12, fontSize:12, color:'#64748b' }}>
                <strong style={{ color:'#374151' }}>Terms & Conditions: </strong>
                Prices inclusive of standard wastage. GST @28% applicable. Quotation valid for 15 days. Prices subject to change. Delivery charges extra if applicable.
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
