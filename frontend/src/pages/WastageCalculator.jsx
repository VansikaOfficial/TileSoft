import { useState } from 'react';

const PATTERNS = [
  { value: 'straight', label: 'Straight Lay', factor: 0.10 },
  { value: 'diagonal', label: 'Diagonal', factor: 0.15 },
  { value: 'herringbone', label: 'Herringbone', factor: 0.18 },
  { value: 'basket_weave', label: 'Basket Weave', factor: 0.12 },
];

export default function WastageCalculator() {
  const [form, setForm] = useState({ roomLength: 12, roomWidth: 10, tileLength: 24, tileWidth: 24, pattern: 'straight', costPerBox: 500, tilesPerBox: 4 });
  const [result, setResult] = useState(null);

  const calculate = () => {
    const { roomLength, roomWidth, tileLength, tileWidth, pattern, costPerBox, tilesPerBox } = form;
    const pat = PATTERNS.find(p => p.value === pattern) || PATTERNS[0];

    const roomSqIn = roomLength * 12 * roomWidth * 12;
    const tileSqIn = tileLength * tileWidth;
    const baseTiles = Math.ceil(roomSqIn / tileSqIn);

    // Standard method
    const stdWastageFactor = pat.factor;
    const stdTiles = Math.ceil(baseTiles * (1 + stdWastageFactor));
    const stdBoxes = Math.ceil(stdTiles / tilesPerBox);
    const stdCost = stdBoxes * costPerBox;

    // Optimized method
    const tilesAlongLength = Math.ceil((roomLength * 12) / tileLength);
    const tilesAlongWidth = Math.ceil((roomWidth * 12) / tileWidth);
    const exactTiles = tilesAlongLength * tilesAlongWidth;
    const optTiles = Math.ceil(exactTiles * 1.05);
    const optBoxes = Math.ceil(optTiles / tilesPerBox);
    const optCost = optBoxes * costPerBox;

    const savedBoxes = stdBoxes - optBoxes;
    const savedAmount = savedBoxes * costPerBox;
    const savedPct = ((savedAmount / stdCost) * 100).toFixed(1);

    const tips = [];
    if (pattern === 'diagonal') tips.push('Switch to straight lay to save 5% wastage');
    if (pattern === 'herringbone') tips.push('Consider diagonal pattern to save ~3% vs herringbone');
    tips.push(`Order ${optBoxes} boxes instead of ${stdBoxes} boxes`);
    tips.push('Start laying from the center to ensure symmetrical cuts on edges');

    setResult({ stdTiles, stdBoxes, stdCost, optTiles, optBoxes, optCost, savedBoxes, savedAmount, savedPct, tilesAlongLength, tilesAlongWidth, baseTiles, tips });
  };

  const reset = () => { setResult(null); setForm({ roomLength: 12, roomWidth: 10, tileLength: 24, tileWidth: 24, pattern: 'straight', costPerBox: 500, tilesPerBox: 4 }); };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Wastage Optimization Calculator</div>
          <div className="page-subtitle">Innovation #2: Minimize tile wastage and save costs with intelligent layout planning</div>
        </div>
      </div>
      <div className="page-body">
        <div className="calculator-layout">
          <div className="card">
            <div className="card-header"><span>🧮</span><span className="card-title">Room & Tile Specifications</span></div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Room Length (feet)</label><input className="form-input" type="number" value={form.roomLength} onChange={e => setForm({...form, roomLength: +e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Room Width (feet)</label><input className="form-input" type="number" value={form.roomWidth} onChange={e => setForm({...form, roomWidth: +e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Tile Length (inches)</label><input className="form-input" type="number" value={form.tileLength} onChange={e => setForm({...form, tileLength: +e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Tile Width (inches)</label><input className="form-input" type="number" value={form.tileWidth} onChange={e => setForm({...form, tileWidth: +e.target.value})} /></div>
                <div className="form-group full"><label className="form-label">Tile Pattern</label>
                  <select className="form-select" value={form.pattern} onChange={e => setForm({...form, pattern: e.target.value})}>
                    {PATTERNS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Cost per Box (₹)</label><input className="form-input" type="number" value={form.costPerBox} onChange={e => setForm({...form, costPerBox: +e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Tiles per Box</label><input className="form-input" type="number" value={form.tilesPerBox} onChange={e => setForm({...form, tilesPerBox: +e.target.value})} /></div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={calculate}>🧮 Calculate Optimization</button>
                <button className="btn btn-ghost" onClick={reset}>↺ Reset</button>
              </div>
            </div>
          </div>

          <div>
            {result ? (
              <>
                <div className="calc-result-card savings" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', marginBottom: 4 }}>Total Savings</div>
                      <div className="savings-amount">₹{result.savedAmount.toFixed(2)}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', background: '#d1fae5', padding: '4px 12px', borderRadius: 20 }}>{result.savedPct}% saved</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><div style={{ fontSize: 12, color: '#065f46', marginBottom: 2 }}>Boxes Saved</div><div style={{ fontSize: 22, fontWeight: 800, color: '#065f46' }}>{result.savedBoxes}</div></div>
                    <div><div style={{ fontSize: 12, color: '#065f46', marginBottom: 2 }}>Tiles Saved</div><div style={{ fontSize: 22, fontWeight: 800, color: '#065f46' }}>{result.stdTiles - result.optTiles}</div></div>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header"><span className="card-title">Standard vs Optimized</span></div>
                  <div className="card-body" style={{ padding: '0 0 8px' }}>
                    <table>
                      <thead><tr><th>Metric</th><th>Standard</th><th style={{ color: '#10b981' }}>Optimized</th></tr></thead>
                      <tbody>
                        <tr><td>Boxes Needed</td><td>{result.stdBoxes}</td><td style={{ color: '#10b981', fontWeight: 700 }}>{result.optBoxes}</td></tr>
                        <tr><td>Wastage</td><td>{result.stdTiles - Math.ceil(result.baseTiles)} tiles ({((result.stdTiles - result.baseTiles) / result.baseTiles * 100).toFixed(1)}%)</td><td style={{ color: '#10b981', fontWeight: 700 }}>{result.optTiles - result.baseTiles} tiles ({((result.optTiles - result.baseTiles) / result.baseTiles * 100).toFixed(1)}%)</td></tr>
                        <tr><td>Total Cost</td><td>₹{result.stdCost.toFixed(2)}</td><td style={{ color: '#10b981', fontWeight: 700 }}>₹{result.optCost.toFixed(2)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header"><span className="card-title">Layout Plan</span></div>
                  <div className="card-body" style={{ padding: '0 0 8px' }}>
                    <table>
                      <tbody>
                        <tr><td>Tiles Along Length</td><td style={{ fontWeight: 700 }}>{result.tilesAlongLength}</td></tr>
                        <tr><td>Tiles Along Width</td><td style={{ fontWeight: 700 }}>{result.tilesAlongWidth}</td></tr>
                        <tr><td>Full Tiles</td><td style={{ fontWeight: 700 }}>{result.baseTiles}</td></tr>
                        <tr><td>Tiles Requiring Cuts</td><td style={{ fontWeight: 700 }}>{result.optTiles - result.baseTiles}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><span>ℹ️</span><span className="card-title">Optimization Tips</span></div>
                  <div className="card-body">
                    <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
                      {result.tips.map((tip, i) => <li key={i} style={{ fontSize: 13, color: '#3b82f6' }}>{tip}</li>)}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ paddingTop: 80 }}>
                <div className="empty-state-icon">🧮</div>
                <p>Enter specifications and click Calculate to see optimization results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
