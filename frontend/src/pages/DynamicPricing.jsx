import { useState, useEffect } from 'react';
import api from '../services/api';

const TIERS = [
  { value: 'new', label: 'New', discount: 0 },
  { value: 'returning', label: 'Returning', discount: 0.03 },
  { value: 'vip', label: 'VIP', discount: 0.07 },
];

function calculatePrice(basePrice, stock, reorderLevel, tier, qty) {
  if (!basePrice) return null;
  const discounts = [];
  let multiplier = 1;

  // Stock-based
  const stockRatio = stock / (reorderLevel || 100);
  if (stockRatio >= 3) { discounts.push({ type: 'Stock Clearance', pct: 12, reason: 'Excess inventory (3x reorder)' }); multiplier *= 0.88; }
  else if (stockRatio < 0.5) { discounts.push({ type: 'Scarcity Premium', pct: -5, reason: 'Low stock (<50%)' }); multiplier *= 1.05; }

  // Tier
  const t = TIERS.find(x => x.value === tier);
  if (t?.discount > 0) { discounts.push({ type: `${t.label} Loyalty`, pct: t.discount * 100, reason: 'Customer tier discount' }); multiplier *= (1 - t.discount); }

  // Bulk
  if (qty >= 100) { discounts.push({ type: 'Bulk Order (100+)', pct: 15, reason: 'Volume discount' }); multiplier *= 0.85; }
  else if (qty >= 50) { discounts.push({ type: 'Bulk Order (50+)', pct: 10, reason: 'Volume discount' }); multiplier *= 0.90; }
  else if (qty >= 20) { discounts.push({ type: 'Bulk Order (20+)', pct: 5, reason: 'Volume discount' }); multiplier *= 0.95; }

  const finalPrice = Math.max(basePrice * multiplier, basePrice * 0.70);
  const totalSavings = (basePrice - finalPrice) * qty;
  const savingsPct = (((basePrice - finalPrice) / basePrice) * 100).toFixed(1);

  const recommendations = [];
  if (qty < 20) recommendations.push('Order 20+ units to get 5% bulk discount');
  if (qty < 50) recommendations.push('Order 50+ units to get 10% bulk discount');
  if (qty < 100) recommendations.push('Order 100+ units to get 15% bulk discount');
  if (tier === 'new') recommendations.push('Become a returning customer to get 3% loyalty discount');
  if (tier === 'returning') recommendations.push('Upgrade to VIP tier to get 7% loyalty discount');

  return { finalPrice: finalPrice.toFixed(2), totalCost: (finalPrice * qty).toFixed(2), basePrice, discounts, totalSavings: totalSavings.toFixed(2), savingsPct, recommendations };
}

export default function DynamicPricing() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tier, setTier] = useState('new');
  const [qty, setQty] = useState(1);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.products.getAll().then(res => {
      const raw = res.data?.products || res.data || [];
      const prods = raw.map(p => ({ ...p, name: p.product_name || p.name, unit_price: parseFloat(p.rate || p.unit_price || 0) }));
      setProducts(prods);
      if (prods.length > 0) setSelectedProduct(prods[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const r = calculatePrice(selectedProduct.unit_price, selectedProduct.stock_quantity, selectedProduct.reorder_level || 100, tier, qty);
      setResult(r);
    }
  }, [selectedProduct, tier, qty]);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dynamic Pricing Demo</div>
          <div className="page-subtitle">Innovation #3: Real-time price optimization using 5-factor model</div>
        </div>
      </div>
      <div className="page-body">
        <div className="pricing-layout">
          <div className="card">
            <div className="card-header"><span>⚙️</span><span className="card-title">Configuration</span></div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Select Product</label>
                <select className="form-select" style={{ width: '100%' }} value={selectedProduct?.id || ''} onChange={e => setSelectedProduct(products.find(p => p.id == e.target.value))}>
                  {products.length === 0 && <option>No products loaded</option>}
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — Rs.{p.unit_price}/{p.unit}</option>)}
                </select>
              </div>
              {selectedProduct && (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Base Price: <strong style={{ color: '#1a1d23' }}>₹{selectedProduct.unit_price}/sqft</strong></div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Stock Level: <strong style={{ color: '#1a1d23' }}>{selectedProduct.stock_quantity} units</strong></div>
                </div>
              )}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Customer Tier</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {TIERS.map(t => (
                    <button key={t.value} onClick={() => setTier(t.value)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: tier === t.value ? '2px solid #6366f1' : '1px solid #e2e8f0', background: tier === t.value ? '#eef2ff' : 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: tier === t.value ? '#6366f1' : '#374151' }}>
                      {t.label}{t.discount > 0 && <span style={{ display: 'block', fontSize: 11, color: '#10b981' }}>-{(t.discount * 100).toFixed(0)}%</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity (sqft or units)</label>
                <input className="form-input" type="number" min="1" value={qty} onChange={e => setQty(Math.max(1, +e.target.value))} />
              </div>
            </div>
          </div>

          <div>
            {result ? (
              <>
                <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #d1fae5)', border: '1px solid #a7f3d0', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#065f46', marginBottom: 8, fontWeight: 600 }}>Final Price</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: '#065f46' }}>₹{result.finalPrice}<span style={{ fontSize: 16, fontWeight: 500 }}>/sqft</span></div>
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div><div style={{ fontSize: 12, color: '#065f46' }}>Base Price</div><div style={{ fontWeight: 700 }}>₹{result.basePrice}</div></div>
                    <div><div style={{ fontSize: 12, color: '#065f46' }}>Your Savings</div><div style={{ fontWeight: 700, color: '#10b981' }}>{result.savingsPct}%</div></div>
                    <div><div style={{ fontSize: 12, color: '#065f46' }}>Total Cost</div><div style={{ fontWeight: 700 }}>₹{result.totalCost}</div></div>
                  </div>
                </div>

                {result.discounts.length > 0 && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header"><span>💰</span><span className="card-title">Discounts Applied</span></div>
                    <div className="card-body">
                      {result.discounts.map((d, i) => (
                        <div key={i} className="discount-item">
                          <div><div className="discount-type">{d.type}</div><div style={{ fontSize: 12, color: '#64748b' }}>{d.reason}</div></div>
                          <div className="discount-amount">{d.pct > 0 ? `-${d.pct}%` : `+${Math.abs(d.pct)}%`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.recommendations.length > 0 && (
                  <div className="card">
                    <div className="card-header"><span>💡</span><span className="card-title">Smart Recommendations</span></div>
                    <div className="card-body">
                      {result.recommendations.map((r, i) => (
                        <div key={i} style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: 8, marginBottom: 8, fontSize: 13, color: '#1d4ed8', fontWeight: 500 }}>💡 {r}</div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state" style={{ paddingTop: 80 }}>
                <div className="empty-state-icon">💲</div>
                <p>Select a product to see dynamic pricing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
