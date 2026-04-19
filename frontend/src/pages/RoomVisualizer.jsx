import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import api from '../services/api';

const PAINT_COLORS = [
  { name:'Ivory White',  hex:'#FFFFF0', compatible:['Beige','Cream','White','Grey'] },
  { name:'Warm Beige',   hex:'#F5F0DC', compatible:['Beige','Cream','Brown','White'] },
  { name:'Sage Green',   hex:'#8FBC8F', compatible:['Green','Beige','Cream','White'] },
  { name:'Sky Blue',     hex:'#87CEEB', compatible:['Blue','White','Grey','Cream'] },
  { name:'Slate Grey',   hex:'#708090', compatible:['Grey','White','Black','Blue'] },
  { name:'Terracotta',   hex:'#E2725B', compatible:['Brown','Beige','Cream','Red'] },
  { name:'Olive Green',  hex:'#808000', compatible:['Green','Brown','Beige','Yellow'] },
  { name:'Charcoal',     hex:'#36454F', compatible:['Grey','Black','White','Blue'] },
  { name:'Peach',        hex:'#FFCBA4', compatible:['Beige','Cream','White','Red'] },
  { name:'Dusty Rose',   hex:'#DCAE96', compatible:['Beige','Cream','White','Brown'] },
  { name:'Navy Blue',    hex:'#1B3A6B', compatible:['Blue','White','Grey','Black'] },
  { name:'Forest Green', hex:'#228B22', compatible:['Green','Brown','Beige','White'] },
];

const TILE_HEX = {
  Beige:'#e8dcc8', White:'#f0f0f0', Black:'#303030', Grey:'#a0a0a0',
  Brown:'#8B6914', Cream:'#f5ecd0', Blue:'#4a90d9', Green:'#4a8c4a',
  Red:'#c0392b', Yellow:'#d4ac0d', Multi:'#9b59b6',
  Marble:'#f5f5f0', Ceramic:'#e8e4dc', Vitrified:'#d8d0c8',
  Porcelain:'#ece8e0', Granite:'#9a9090', Slate:'#708090',
  Terracotta:'#c1440e', Metal:'#b8b8b8', Glass:'#a8d4f5',
};

// Safe color lookup — never returns null
const getTileColor = (tile) => {
  if (!tile) return '#c8bfb0';
  return TILE_HEX[tile.color] || TILE_HEX[tile.material] || '#c8bfb0';
};

// Safe product name — never returns null
const getTileName = (tile, maxLen = 16) => {
  if (!tile) return 'None';
  const name = tile.product_name || tile.name || 'Tile';
  return name.slice(0, maxLen);
};

const ROOMS = [
  { id:'living',   label:'Living Room', icon:'🛋️', w:8, h:3, d:6 },
  { id:'bedroom',  label:'Bedroom',     icon:'🛏️', w:6, h:3, d:5 },
  { id:'bathroom', label:'Bathroom',    icon:'🚿', w:4, h:3, d:4 },
  { id:'kitchen',  label:'Kitchen',     icon:'🍳', w:5, h:3, d:4 },
];

function makeTex(hex, grout='#b0a898', n=8) {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    if (!ctx) return c;
    const tp = 512 / n;
    for (let r = 0; r <= n; r++) {
      for (let col = 0; col <= n; col++) {
        const x = col*tp+1.5, y = r*tp+1.5, w = tp-3, h = tp-3;
        ctx.fillStyle = hex || '#c8bfb0';
        ctx.fillRect(x, y, w, h);
        if ((r+col)%3===0) { ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,y,w,h); }
        else if ((r+col)%3===1) { ctx.fillStyle='rgba(0,0,0,0.05)'; ctx.fillRect(x,y,w,h); }
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(x,y,w*0.5,h*0.25);
      }
    }
    ctx.fillStyle = grout || '#b0a898';
    for (let i = 0; i <= n+1; i++) {
      ctx.fillRect(i*tp-1.5, 0, 3, 512);
      ctx.fillRect(0, i*tp-1.5, 512, 3);
    }
    return c;
  } catch(e) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    if (ctx) { ctx.fillStyle = hex || '#c8bfb0'; ctx.fillRect(0,0,64,64); }
    return c;
  }
}

function checkCompat(paintName, tileColor) {
  if (!paintName || !tileColor) return null;
  const p = PAINT_COLORS.find(p => p.name === paintName);
  if (!p) return null;
  return p.compatible.some(c =>
    tileColor.toLowerCase().includes(c.toLowerCase()) ||
    c.toLowerCase().includes(tileColor.toLowerCase())
  );
}

// Load texture safely — falls back to canvas texture on error
function loadTextureSafe(loader, url, onLoaded, fallbackHex, n) {
  if (!url) {
    const t = new THREE.CanvasTexture(makeTex(fallbackHex, '#9a9080', n));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    onLoaded(t);
    return t;
  }
  return loader.load(
    url,
    (t) => { onLoaded(t); },
    undefined,
    () => {
      // On error — use canvas texture instead
      const t = new THREE.CanvasTexture(makeTex(fallbackHex, '#9a9080', n));
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      onLoaded(t);
    }
  );
}

function ThreeRoom({ floorTile, wallTile, paintColor, room, tileSize }) {
  const ref = useRef();
  const rdr = useRef(), scn = useRef(), cam = useRef(), raf = useRef();
  const drag = useRef(false), right = useRef(false), last = useRef({x:0,y:0});
  const sph = useRef({theta:Math.PI/4, phi:Math.PI/3.2, r:12});
  const tgt = useRef({x:0, y:0.5, z:0});

  const upd = () => {
    const { theta, phi, r } = sph.current;
    const c = cam.current;
    if (!c) return;
    c.position.set(
      tgt.current.x + r * Math.sin(phi) * Math.sin(theta),
      tgt.current.y + r * Math.cos(phi),
      tgt.current.z + r * Math.sin(phi) * Math.cos(theta)
    );
    c.lookAt(tgt.current.x, tgt.current.y, tgt.current.z);
  };

  // Init Three.js scene once
  useEffect(() => {
    const m = ref.current;
    if (!m) return;

    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    const W = m.clientWidth || 700;
    const H = m.clientHeight || 500;

    let renderer;
    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#dde4ee');
      scn.current = scene;

      const camera = new THREE.PerspectiveCamera(50, W/H, 0.1, 100);
      cam.current = camera;
      upd();

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(W, H);
      renderer.shadowMap.enabled = true;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      m.appendChild(renderer.domElement);
      rdr.current = renderer;

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const d = new THREE.DirectionalLight(0xfff8f0, 0.9);
      d.position.set(6, 12, 8);
      d.castShadow = true;
      d.shadow.mapSize.set(1024, 1024);
      scene.add(d);

      const go = () => {
        raf.current = requestAnimationFrame(go);
        if (renderer && cam.current) renderer.render(scene, cam.current);
      };
      go();

      const rs = () => {
        if (!m) return;
        const W2 = m.clientWidth, H2 = m.clientHeight;
        if (W2 && H2) {
          camera.aspect = W2/H2;
          camera.updateProjectionMatrix();
          renderer.setSize(W2, H2);
        }
      };
      window.addEventListener('resize', rs);

      return () => {
        window.removeEventListener('resize', rs);
        cancelAnimationFrame(raf.current);
        try { renderer.dispose(); } catch(e) {}
        try { if (m.contains(renderer.domElement)) m.removeChild(renderer.domElement); } catch(e) {}
      };
    } catch(e) {
      console.error('Three.js init error:', e);
    }
  }, []);

  // Rebuild room geometry when tiles/room changes
  useEffect(() => {
    const scene = scn.current;
    if (!scene) return;

    // Remove old room objects
    const rem = [];
    scene.traverse(o => { if (o.userData.rm) rem.push(o); });
    rem.forEach(o => {
      try { if (o.geometry) o.geometry.dispose(); } catch(e) {}
      try {
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      } catch(e) {}
      scene.remove(o);
    });

    const W = room.w, H = room.h, D = room.d;
    const mk = o => { o.userData.rm = true; return o; };
    const ts = Math.max(20, Math.min(80, tileSize || 40));
    const n = Math.round(80/ts*6);

    const fhex = getTileColor(floorTile);
    const whex = getTileColor(wallTile);
    const phex = paintColor ? paintColor.hex : '#f0ede8';

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    // ── FLOOR ──
    const floorMat = new THREE.MeshLambertMaterial({ color: fhex });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
    fl.rotation.x = -Math.PI/2;
    fl.receiveShadow = true;
    scene.add(mk(fl));

    if (floorTile?.image_url) {
      loadTextureSafe(loader, floorTile.image_url, (t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(W*1.5, D*1.5);
        t.needsUpdate = true;
        floorMat.map = t;
        floorMat.color.set('#ffffff');
        floorMat.needsUpdate = true;
      }, fhex, n);
    } else {
      const t = new THREE.CanvasTexture(makeTex(fhex, '#9a9080', n));
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(W*0.8, D*0.8);
      floorMat.map = t;
      floorMat.needsUpdate = true;
    }

    // ── WALL MATERIAL FACTORY ──
    const makeWallMat = (isBack) => {
      const mat = new THREE.MeshLambertMaterial({ color: whex || phex });
      if (wallTile?.image_url) {
        loadTextureSafe(loader, wallTile.image_url, (t) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(isBack ? W*0.8 : D*0.8, H*0.8);
          t.needsUpdate = true;
          mat.map = t;
          mat.color.set('#ffffff');
          mat.needsUpdate = true;
        }, whex, Math.round(80/ts*4));
      } else if (wallTile) {
        const wt = Math.round(80/ts*4);
        const wTex = new THREE.CanvasTexture(makeTex(whex, '#b0aba0', wt));
        wTex.wrapS = wTex.wrapT = THREE.RepeatWrapping;
        wTex.repeat.set(isBack ? W*0.6 : D*0.6, H*0.6);
        mat.map = wTex;
        mat.needsUpdate = true;
      }
      return mat;
    };

    // Back wall, Left wall, Right wall
    const bw = new THREE.Mesh(new THREE.PlaneGeometry(W, H), makeWallMat(true));
    bw.position.set(0, H/2, -D/2); scene.add(mk(bw));

    const lw = new THREE.Mesh(new THREE.PlaneGeometry(D, H), makeWallMat(false));
    lw.rotation.y = Math.PI/2; lw.position.set(-W/2, H/2, 0); scene.add(mk(lw));

    const rw = new THREE.Mesh(new THREE.PlaneGeometry(D, H), makeWallMat(false));
    rw.rotation.y = -Math.PI/2; rw.position.set(W/2, H/2, 0); scene.add(mk(rw));

    // Ceiling
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshLambertMaterial({color:'#f8f8f6'}));
    cl.rotation.x = Math.PI/2; cl.position.y = H; scene.add(mk(cl));

    // Light fixture
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.25,8), new THREE.MeshLambertMaterial({color:'#aaa'}));
    rod.position.set(0, H-0.12, 0); scene.add(mk(rod));
    const shd = new THREE.Mesh(new THREE.ConeGeometry(0.35,0.25,8,1,true), new THREE.MeshLambertMaterial({color:'#f5ecd0',side:THREE.DoubleSide}));
    shd.rotation.x = Math.PI; shd.position.set(0, H-0.4, 0); scene.add(mk(shd));

    // Window frame
    const wf = new THREE.Mesh(new THREE.BoxGeometry(1.6,1.2,0.06), new THREE.MeshLambertMaterial({color:'#7a5c2a'}));
    wf.position.set(W*0.25, H*0.65, -D/2+0.05); scene.add(mk(wf));
    const wg = new THREE.Mesh(new THREE.PlaneGeometry(1.3,0.95), new THREE.MeshLambertMaterial({color:'#a8d4f5',transparent:true,opacity:0.55}));
    wg.position.set(W*0.25, H*0.65, -D/2+0.09); scene.add(mk(wg));

    // Floor material for rug/skirting
    const sm = new THREE.MeshLambertMaterial({color: fhex});

    // ── FURNITURE BY ROOM TYPE ──
    if (room.id === 'living') {
      const sofa = new THREE.Mesh(new THREE.BoxGeometry(2.6,0.5,0.95), new THREE.MeshLambertMaterial({color:'#5f7d8e'}));
      sofa.position.set(0,0.25,1.8); sofa.castShadow = true; scene.add(mk(sofa));
      const sb = new THREE.Mesh(new THREE.BoxGeometry(2.6,0.65,0.18), new THREE.MeshLambertMaterial({color:'#4f6d7e'}));
      sb.position.set(0,0.7,2.22); scene.add(mk(sb));
      [-1.2,1.2].forEach(x => {
        const a = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.58,0.95), new THREE.MeshLambertMaterial({color:'#4f6d7e'}));
        a.position.set(x,0.49,1.8); scene.add(mk(a));
      });
      [-0.6,0,0.6].forEach(x => {
        const cu = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.18,0.4), new THREE.MeshLambertMaterial({color:'#e8d5b7'}));
        cu.position.set(x,0.59,1.6); scene.add(mk(cu));
      });
      const ct = new THREE.Mesh(new THREE.BoxGeometry(1.3,0.06,0.75), new THREE.MeshLambertMaterial({color:'#8b6914'}));
      ct.position.set(0,0.46,0.5); scene.add(mk(ct));
      const tv = new THREE.Mesh(new THREE.BoxGeometry(2.1,1.1,0.08), new THREE.MeshLambertMaterial({color:'#111'}));
      tv.position.set(0,1.25,-D/2+0.1); scene.add(mk(tv));
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.9,0.95), new THREE.MeshLambertMaterial({color:'#1a3a6e'}));
      sc.position.set(0,1.25,-D/2+0.15); scene.add(mk(sc));
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2,2.2), new THREE.MeshLambertMaterial({color:'#8B4513'}));
      rug.rotation.x = -Math.PI/2; rug.position.set(0,0.005,1); scene.add(mk(rug));

    } else if (room.id === 'bedroom') {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.28,3.1), new THREE.MeshLambertMaterial({color:'#7d5a3c'}));
      bed.position.set(0,0.14,0.5); scene.add(mk(bed));
      const mat = new THREE.Mesh(new THREE.BoxGeometry(2.0,0.2,2.9), new THREE.MeshLambertMaterial({color:'#f5f5f0'}));
      mat.position.set(0,0.38,0.5); scene.add(mk(mat));
      const hb = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.85,0.12), new THREE.MeshLambertMaterial({color:'#5d3a1a'}));
      hb.position.set(0,0.7,-1.0); scene.add(mk(hb));
      [-0.5,0.5].forEach(x => {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.65,0.14,0.48), new THREE.MeshLambertMaterial({color:'#dbe9f8'}));
        p.position.set(x,0.55,-0.65); scene.add(mk(p));
      });
      const wa = new THREE.Mesh(new THREE.BoxGeometry(1.8,2.2,0.55), new THREE.MeshLambertMaterial({color:'#6d4c2a'}));
      wa.position.set(-W/2+1.1,1.1,-D/2+0.4); scene.add(mk(wa));

    } else if (room.id === 'bathroom') {
      const bm = new THREE.MeshLambertMaterial({color:'#f0ece8'});
      const bt = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.55,0.8), bm);
      bt.position.set(W/2-1.1, 0.275, -D/2+0.5); scene.add(mk(bt));
      const bi = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.42,0.7), new THREE.MeshLambertMaterial({color:'#e0dcd8'}));
      bi.position.set(W/2-1.1, 0.56, -D/2+0.5); scene.add(mk(bi));
      const wc = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.4,0.6), bm);
      wc.position.set(-W/2+0.5, 0.2, D/2-0.5); scene.add(mk(wc));
      const ws = new THREE.Mesh(new THREE.BoxGeometry(0.85,0.12,0.52), bm);
      ws.position.set(0, 0.88, -D/2+0.32); scene.add(mk(ws));

    } else if (room.id === 'kitchen') {
      const co = new THREE.Mesh(new THREE.BoxGeometry(W-0.5,0.88,0.62), new THREE.MeshLambertMaterial({color:'#7a5c3a'}));
      co.position.set(0,0.44,-D/2+0.38); scene.add(mk(co));
      const tp = new THREE.Mesh(new THREE.BoxGeometry(W-0.5,0.05,0.65), new THREE.MeshLambertMaterial({color:'#909090'}));
      tp.position.set(0,0.9,-D/2+0.38); scene.add(mk(tp));
      const ca = new THREE.Mesh(new THREE.BoxGeometry(W-0.5,0.72,0.36), new THREE.MeshLambertMaterial({color:'#8a6c4a'}));
      ca.position.set(0,2.2,-D/2+0.24); scene.add(mk(ca));
    }

  }, [floorTile, wallTile, paintColor, room, tileSize]);

  // Mouse controls
  const onMouseDown = (e) => {
    drag.current = true;
    right.current = e.button === 2;
    last.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    if (right.current) {
      tgt.current.x -= dx * 0.008;
      tgt.current.z -= dy * 0.008;
    } else {
      sph.current.theta -= dx * 0.008;
      sph.current.phi = Math.max(0.15, Math.min(Math.PI/2.05, sph.current.phi + dy * 0.008));
    }
    upd();
  };
  const onMouseUp = () => { drag.current = false; };
  const onWheel = (e) => {
    sph.current.r = Math.max(4, Math.min(22, sph.current.r + e.deltaY * 0.01));
    upd();
  };
  const onContextMenu = (e) => e.preventDefault();
  const resetCam = () => {
    sph.current = { theta: Math.PI/4, phi: Math.PI/3.2, r: 12 };
    tgt.current = { x: 0, y: 0.5, z: 0 };
    upd();
  };

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', minHeight:460 }}>
      <div
        ref={ref}
        style={{ width:'100%', height:'100%', cursor:'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onContextMenu={onContextMenu}
      />
      <div style={{ position:'absolute', bottom:10, right:10, display:'flex', flexDirection:'column', gap:6 }}>
        <button onClick={resetCam} style={{ background:'rgba(15,23,42,0.85)', color:'white', border:'none', borderRadius:8, padding:'6px 12px', fontSize:11, cursor:'pointer', fontWeight:600 }}>⟳ Reset</button>
      </div>
      <div style={{ position:'absolute', bottom:10, left:10, background:'rgba(15,23,42,0.85)', color:'white', borderRadius:8, padding:'8px 12px', fontSize:11, lineHeight:1.7, pointerEvents:'none' }}>
        <div style={{ color:'#94a3b8', marginBottom:2 }}>🖱 Drag: Rotate | Scroll: Zoom | Right-drag: Pan</div>
        <div style={{ color:'#93c5fd', fontWeight:600 }}>{room.w}m × {room.d}m × {room.h}m | {(room.w*room.d*10.764).toFixed(1)} sq.ft</div>
      </div>
    </div>
  );
}

const Panel = ({ children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:12, overflowY:'auto', height:'100%', minHeight:0 }}>
    {children}
  </div>
);
const Box = ({ children }) => (
  <div style={{ background:'white', borderRadius:10, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', overflow:'hidden' }}>
    {children}
  </div>
);
const BoxHead = ({ icon, title }) => (
  <div style={{ padding:'10px 14px', background:'linear-gradient(135deg,#f8fafc,#f1f5f9)', borderBottom:'1px solid #e8ecf0', display:'flex', alignItems:'center', gap:8 }}>
    <span style={{ fontSize:16 }}>{icon}</span>
    <span style={{ fontSize:13, fontWeight:700, color:'#1a1d23' }}>{title}</span>
  </div>
);

export default function RoomVisualizer() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(ROOMS[0]);
  const [tab, setTab] = useState('floor');
  const [floorTile, setFloorTile] = useState(null);
  const [wallTile, setWallTile] = useState(null);
  const [paint, setPaint] = useState(null);
  const [tileSize, setTileSize] = useState(40);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.products.getAll().then(r => {
      setProducts(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const compat = checkCompat(paint?.name, (tab==='floor'?floorTile:wallTile)?.color);

  const fa = room.w * room.d;
  const wa = 2 * (room.w + room.d) * room.h;
  const fq = Math.ceil(fa * 10.764 * 1.1);
  const wq = Math.ceil(wa * 10.764 * 1.1);
  const fc = floorTile ? Math.round(fq * parseFloat(floorTile.unit_price || floorTile.rate || 0)) : 0;
  const wc = wallTile  ? Math.round(wq * parseFloat(wallTile.unit_price  || wallTile.rate  || 0)) : 0;

  const filtered = products.filter(p =>
    !search || (p.product_name||p.name||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#f4f6fa', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:'white', padding:'12px 20px', borderBottom:'1px solid #e8ecf0', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#1a1d23' }}>🏠 3D Room Visualizer</div>
          <div style={{ fontSize:12, color:'#64748b' }}>Preview tiles in your room before buying</div>
        </div>
        {/* Room selector */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {ROOMS.map(r => (
            <button key={r.id} onClick={() => setRoom(r)} style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:room.id===r.id?'#6366f1':'#f1f5f9', color:room.id===r.id?'white':'#374151', transition:'all 0.2s' }}>
              {r.icon} {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'220px 1fr 220px', gap:12, padding:12, minHeight:0, overflow:'hidden' }}>

        {/* LEFT PANEL */}
        <div style={{ overflowY:'auto', height:'100%', display:'flex', flexDirection:'column', gap:12, minHeight:0, paddingRight:2 }}>
          {/* Floor/Wall tabs */}
          <Box>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
              {['floor','wall'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding:'10px', border:'none', cursor:'pointer', fontSize:13, fontWeight:700, background:tab===t?'#6366f1':'#f8fafc', color:tab===t?'white':'#94a3b8', borderBottom:tab===t?'none':'1px solid #e8ecf0', transition:'all 0.2s' }}>
                  {t==='floor'?'🔲 Floor':'🧱 Wall'}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ padding:'8px 10px', borderBottom:'1px solid #f1f5f9' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tiles..."
                style={{ width:'100%', padding:'6px 10px', borderRadius:6, border:'1px solid #e2e8f0', fontSize:12, outline:'none' }}
              />
            </div>
            {/* Clear selection */}
            {(tab==='floor'?floorTile:wallTile) && (
              <button onClick={() => tab==='floor'?setFloorTile(null):setWallTile(null)}
                style={{ width:'100%', padding:'6px', background:'#fef2f2', color:'#ef4444', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, borderBottom:'1px solid #f1f5f9' }}>
                ✕ Clear {tab} tile
              </button>
            )}
            {/* Tile list */}
            <div style={{ maxHeight:280, overflowY:'auto', padding:'6px' }}>
              {loading ? (
                <div style={{ textAlign:'center', padding:20, color:'#94a3b8', fontSize:12 }}>Loading tiles...</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:20, color:'#94a3b8', fontSize:12 }}>No tiles found</div>
              ) : filtered.map(p => {
                const selected = tab==='floor' ? floorTile?.id===p.id : wallTile?.id===p.id;
                const pname = p.product_name || p.name || 'Tile';
                const pcolor = getTileColor(p);
                return (
                  <div key={p.id} onClick={() => tab==='floor'?setFloorTile(selected?null:p):setWallTile(selected?null:p)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'pointer', marginBottom:2, background:selected?'#eef2ff':'transparent', border:selected?'1.5px solid #6366f1':'1.5px solid transparent', transition:'all 0.15s' }}>
                    <div style={{ width:36, height:36, borderRadius:6, flexShrink:0, overflow:'hidden', border:'1px solid #e2e8f0' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={pname} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; e.target.parentNode.style.background=pcolor; }} />
                      ) : (
                        <div style={{ width:'100%', height:'100%', background:pcolor, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(0,0,0,0.08) 4px,rgba(0,0,0,0.08) 5px),repeating-linear-gradient(90deg,transparent,transparent 4px,rgba(0,0,0,0.08) 4px,rgba(0,0,0,0.08) 5px)' }} />
                      )}
                    </div>
                    <div style={{ overflow:'hidden', flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'#1a1d23' }}>{pname}</div>
                      <div style={{ fontSize:10, color:'#6366f1', fontWeight:600 }}>₹{p.unit_price || p.rate || 0}/{p.unit || 'sqft'}</div>
                    </div>
                    {selected && <span style={{ fontSize:14, color:'#6366f1', flexShrink:0 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </Box>

          {/* Tile scale */}
          <Box>
            <BoxHead icon="⚙️" title={`Tile Scale: ${tileSize}`}/>
            <div style={{ padding:'10px 14px 14px' }}>
              <input type="range" min={20} max={70} step={5} value={tileSize} onChange={e => setTileSize(+e.target.value)} style={{ width:'100%' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#94a3b8', marginTop:3 }}>
                <span>Small</span><span>Large</span>
              </div>
            </div>
          </Box>
        </div>

        {/* 3D CANVAS */}
        <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
          <div style={{ padding:'10px 16px', background:'linear-gradient(135deg,#1e293b,#334155)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', flexShrink:0 }}>
            <span style={{ fontSize:16 }}>🎮</span>
            <span style={{ fontSize:14, fontWeight:700, color:'white', flex:1 }}>3D Preview — {room.label}</span>
            {floorTile && (
              <span style={{ background:'rgba(99,102,241,0.85)', color:'white', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                Floor: {getTileName(floorTile)}
              </span>
            )}
            {wallTile && (
              <span style={{ background:'rgba(16,185,129,0.85)', color:'white', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                Wall: {getTileName(wallTile)}
              </span>
            )}
          </div>
          <div style={{ flex:1, minHeight:0 }}>
            {!loading && (
              <ThreeRoom
                floorTile={floorTile}
                wallTile={wallTile}
                paintColor={paint}
                room={room}
                tileSize={tileSize}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ overflowY:'auto', height:'100%', display:'flex', flexDirection:'column', gap:12, minHeight:0, paddingRight:2 }}>
          {/* Paint */}
          <Box>
            <BoxHead icon="🎨" title="Wall Paint"/>
            <div style={{ padding:'10px 12px' }}>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>Applied when no wall tile is selected</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7, marginBottom:8 }}>
                {PAINT_COLORS.map(p => (
                  <div key={p.name} onClick={() => setPaint(paint?.name===p.name?null:p)} title={p.name}
                    style={{ aspectRatio:'1', borderRadius:8, background:p.hex, border:paint?.name===p.name?'3px solid #6366f1':'2px solid rgba(0,0,0,0.12)', cursor:'pointer', transition:'all 0.15s', boxShadow:paint?.name===p.name?'0 0 0 2px white,0 0 0 4px #6366f1':'none' }}/>
                ))}
              </div>
              {paint && (
                <div style={{ background:'#f8fafc', borderRadius:8, padding:'6px 10px', display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                  <div style={{ width:14, height:14, borderRadius:3, background:paint.hex, border:'1px solid rgba(0,0,0,0.1)', flexShrink:0 }}/>
                  <strong>{paint.name}</strong>
                </div>
              )}
            </div>
          </Box>

          {/* Paint Match */}
          <Box>
            <BoxHead icon="🔍" title="Paint & Tile Match"/>
            <div style={{ padding:'10px 12px' }}>
              {!paint || !(tab==='floor'?floorTile:wallTile) ? (
                <div style={{ fontSize:12, color:'#94a3b8', textAlign:'center', padding:'10px 0' }}>Select a tile &amp; paint to check match</div>
              ) : (
                <>
                  <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
                    <div style={{ flex:1, height:32, borderRadius:6, background:getTileColor(tab==='floor'?floorTile:wallTile), backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(0,0,0,0.06) 6px,rgba(0,0,0,0.06) 7px)' }}/>
                    <span style={{ color:'#94a3b8', fontSize:16, fontWeight:700 }}>+</span>
                    <div style={{ flex:1, height:32, borderRadius:6, background:paint.hex, border:'1px solid rgba(0,0,0,0.08)' }}/>
                  </div>
                  <div style={{ background:compat?'#f0fdf4':'#fef2f2', border:`1px solid ${compat?'#a7f3d0':'#fecaca'}`, borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontWeight:700, fontSize:13, color:compat?'#065f46':'#991b1b', marginBottom:3 }}>{compat?'✅ Great Match!':'⚠️ May Not Match'}</div>
                    <div style={{ fontSize:11, color:compat?'#064e3b':'#7f1d1d', lineHeight:1.6 }}>
                      {compat
                        ? `${paint.name} pairs beautifully with ${(tab==='floor'?floorTile:wallTile)?.color||'this'} tile!`
                        : 'Try Ivory White or Warm Beige for better harmony.'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Box>

          {/* Cost Estimate */}
          <Box>
            <BoxHead icon="💰" title="Cost Estimate"/>
            <div style={{ padding:'10px 12px' }}>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:8, background:'#f8fafc', borderRadius:6, padding:'6px 10px' }}>
                Room: <strong>{room.w}×{room.d}×{room.h}m</strong> · Floor: <strong>{(fa*10.764).toFixed(0)} sqft</strong>
              </div>
              {floorTile && (
                <div style={{ background:'#eef2ff', borderRadius:8, padding:'10px', marginBottom:8 }}>
                  <div style={{ fontSize:10, color:'#6366f1', fontWeight:700, marginBottom:2 }}>🔲 FLOOR TILES</div>
                  <div style={{ fontSize:12, fontWeight:600 }}>{getTileName(floorTile, 22)}</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{fq} sqft × ₹{floorTile.unit_price||floorTile.rate||0}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'#4338ca' }}>₹{fc.toLocaleString('en-IN')}</div>
                </div>
              )}
              {wallTile && (
                <div style={{ background:'#f0fdf4', borderRadius:8, padding:'10px', marginBottom:8 }}>
                  <div style={{ fontSize:10, color:'#10b981', fontWeight:700, marginBottom:2 }}>🧱 WALL TILES</div>
                  <div style={{ fontSize:12, fontWeight:600 }}>{getTileName(wallTile, 22)}</div>
                  <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{wq} sqft × ₹{wallTile.unit_price||wallTile.rate||0}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'#047857' }}>₹{wc.toLocaleString('en-IN')}</div>
                </div>
              )}
              {(fc+wc) > 0 && (
                <div style={{ background:'linear-gradient(135deg,#1e293b,#334155)', borderRadius:8, padding:'12px', color:'white', textAlign:'center', marginBottom:10 }}>
                  <div style={{ fontSize:11, opacity:0.7 }}>Total (incl. 10% wastage)</div>
                  <div style={{ fontSize:26, fontWeight:900 }}>₹{(fc+wc).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize:10, opacity:0.6 }}>+GST 28% = ₹{((fc+wc)*1.28).toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
                </div>
              )}
              <button
                onClick={() => window.open(`https://wa.me/918531034528?text=${encodeURIComponent(`Hi TileSoft!\nRoom: ${room.label} (${room.w}×${room.d}m)\n${floorTile?`Floor: ${getTileName(floorTile,30)} ₹${fc.toLocaleString('en-IN')}\n`:''}${wallTile?`Walls: ${getTileName(wallTile,30)} ₹${wc.toLocaleString('en-IN')}\n`:''}${paint?`Paint: ${paint.name}\n`:''}\nTotal: ₹${(fc+wc).toLocaleString('en-IN')}\nPlease send a quotation!`)}`,'_blank')}
                style={{ width:'100%', padding:'10px', background:'#25d366', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>
                📱 WhatsApp Estimate
              </button>
            </div>
          </Box>
        </div>
      </div>
    </div>
  );
}