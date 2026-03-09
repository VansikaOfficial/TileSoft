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
  Red:'#c0392b',   Yellow:'#d4ac0d', Multi:'#9b59b6',
};

const ROOMS = [
  { id:'living',   label:'Living Room', icon:'🛋️', w:8, h:3, d:6 },
  { id:'bedroom',  label:'Bedroom',     icon:'🛏️', w:6, h:3, d:5 },
  { id:'bathroom', label:'Bathroom',    icon:'🚿', w:4, h:3, d:4 },
  { id:'kitchen',  label:'Kitchen',     icon:'🍳', w:5, h:3, d:4 },
];

function makeTex(hex, grout='#b0a898', n=8) {
  const c=document.createElement('canvas'); c.width=c.height=512;
  const ctx=c.getContext('2d'), tp=512/n;
  for(let r=0;r<=n;r++) for(let col=0;col<=n;col++){
    const x=col*tp+1.5,y=r*tp+1.5,w=tp-3,h=tp-3;
    ctx.fillStyle=hex; ctx.fillRect(x,y,w,h);
    if((r+col)%3===0){ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(x,y,w,h);}
    else if((r+col)%3===1){ctx.fillStyle='rgba(0,0,0,0.05)';ctx.fillRect(x,y,w,h);}
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(x,y,w*0.5,h*0.25);
  }
  ctx.fillStyle=grout;
  for(let i=0;i<=n+1;i++){ctx.fillRect(i*tp-1.5,0,3,512);ctx.fillRect(0,i*tp-1.5,512,3);}
  return c;
}

function checkCompat(paintName,tileColor){
  if(!paintName||!tileColor) return null;
  const p=PAINT_COLORS.find(p=>p.name===paintName); if(!p) return null;
  return p.compatible.some(c=>tileColor.toLowerCase().includes(c.toLowerCase())||c.toLowerCase().includes(tileColor.toLowerCase()));
}

function ThreeRoom({floorTile,wallTile,paintColor,room,tileSize}){
  const ref=useRef(),rdr=useRef(),scn=useRef(),cam=useRef(),raf=useRef();
  const drag=useRef(false),right=useRef(false),last=useRef({x:0,y:0});
  const sph=useRef({theta:Math.PI/4,phi:Math.PI/3.2,r:12}),tgt=useRef({x:0,y:0.5,z:0});
  const upd=()=>{const{theta,phi,r}=sph.current,c=cam.current;if(!c)return;c.position.set(tgt.current.x+r*Math.sin(phi)*Math.sin(theta),tgt.current.y+r*Math.cos(phi),tgt.current.z+r*Math.sin(phi)*Math.cos(theta));c.lookAt(tgt.current.x,tgt.current.y,tgt.current.z);};
  useEffect(()=>{
    const m=ref.current;if(!m)return;
    const W=m.clientWidth||700,H=m.clientHeight||500;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#dde4ee');scn.current=scene;
    const camera=new THREE.PerspectiveCamera(50,W/H,0.1,100);cam.current=camera;upd();
    const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(W,H);renderer.shadowMap.enabled=true;renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    m.appendChild(renderer.domElement);rdr.current=renderer;
    scene.add(new THREE.AmbientLight(0xffffff,0.7));
    const d=new THREE.DirectionalLight(0xfff8f0,0.9);d.position.set(6,12,8);d.castShadow=true;d.shadow.mapSize.set(2048,2048);d.shadow.camera.left=-10;d.shadow.camera.right=10;d.shadow.camera.top=10;d.shadow.camera.bottom=-10;scene.add(d);
    const go=()=>{raf.current=requestAnimationFrame(go);renderer.render(scene,cam.current);};go();
    const rs=()=>{const W2=m.clientWidth,H2=m.clientHeight;camera.aspect=W2/H2;camera.updateProjectionMatrix();renderer.setSize(W2,H2);};
    window.addEventListener('resize',rs);
    return()=>{window.removeEventListener('resize',rs);cancelAnimationFrame(raf.current);renderer.dispose();if(m.contains(renderer.domElement))m.removeChild(renderer.domElement);};
  },[]);
  useEffect(()=>{
    const scene=scn.current;if(!scene)return;
    const rem=[];scene.traverse(o=>{if(o.userData.rm)rem.push(o);});rem.forEach(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose();}scene.remove(o);});
    const W=room.w,H=room.h,D=room.d,mk=o=>{o.userData.rm=true;return o;};
    const ts=Math.max(20,Math.min(80,tileSize||40)),n=Math.round(80/ts*6);
    const fhex=floorTile?(TILE_HEX[floorTile.color]||'#c8bfb0'):'#c8bfb0';
    const loader=new THREE.TextureLoader();
    loader.crossOrigin='anonymous';

    // Floor texture — use product image if available, else canvas color
    const floorTex = floorTile?.image_url
      ? loader.load(floorTile.image_url, t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(W*1.5,D*1.5);})
      : (() => { const t=new THREE.CanvasTexture(makeTex(fhex,'#9a9080',n));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(W*0.8,D*0.8);return t; })();
    if(!floorTile?.image_url){floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(W*0.8,D*0.8);}

    const fl=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshLambertMaterial({map:floorTex}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;scene.add(mk(fl));
    const whex=wallTile?(TILE_HEX[wallTile.color]||'#d0ccc4'):null,phex=paintColor?paintColor.hex:'#f0ede8';

    // Wall texture — use product image if available, else canvas color or paint
    const wmat=(isBack)=>{
      if(wallTile?.image_url){
        const wTex=loader.load(wallTile.image_url, t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(isBack?W*0.8:D*0.8,H*0.8);});
        return new THREE.MeshLambertMaterial({map:wTex});
      }
      if(wallTile&&whex){
        const wt=Math.round(80/ts*4),wTex=new THREE.CanvasTexture(makeTex(whex,'#b0aba0',wt));
        wTex.wrapS=wTex.wrapT=THREE.RepeatWrapping;wTex.repeat.set(isBack?W*0.6:D*0.6,H*0.6);
        return new THREE.MeshLambertMaterial({map:wTex});
      }
      return new THREE.MeshLambertMaterial({color:phex});
    };
    const bw=new THREE.Mesh(new THREE.PlaneGeometry(W,H),wmat(true));bw.position.set(0,H/2,-D/2);scene.add(mk(bw));
    const lw=new THREE.Mesh(new THREE.PlaneGeometry(D,H),wmat(false));lw.rotation.y=Math.PI/2;lw.position.set(-W/2,H/2,0);scene.add(mk(lw));
    const rw=new THREE.Mesh(new THREE.PlaneGeometry(D,H),wmat(false));rw.rotation.y=-Math.PI/2;rw.position.set(W/2,H/2,0);scene.add(mk(rw));
    const cl=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshLambertMaterial({color:'#f8f8f6'}));cl.rotation.x=Math.PI/2;cl.position.y=H;scene.add(mk(cl));
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.25,8),new THREE.MeshLambertMaterial({color:'#aaa'}));rod.position.set(0,H-0.12,0);scene.add(mk(rod));
    const shd=new THREE.Mesh(new THREE.ConeGeometry(0.35,0.25,8,1,true),new THREE.MeshLambertMaterial({color:'#f5ecd0',side:THREE.DoubleSide}));shd.rotation.x=Math.PI;shd.position.set(0,H-0.4,0);scene.add(mk(shd));
    const wf=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.2,0.06),new THREE.MeshLambertMaterial({color:'#7a5c2a'}));wf.position.set(W*0.25,H*0.65,-D/2+0.05);scene.add(mk(wf));
    const wg=new THREE.Mesh(new THREE.PlaneGeometry(1.3,0.95),new THREE.MeshLambertMaterial({color:'#a8d4f5',transparent:true,opacity:0.55}));wg.position.set(W*0.25,H*0.65,-D/2+0.09);scene.add(mk(wg));
    const sm=new THREE.MeshLambertMaterial({color:fhex});
    const s1=new THREE.Mesh(new THREE.BoxGeometry(W,0.12,0.04),sm);s1.position.set(0,0.06,-D/2+0.02);scene.add(mk(s1));
    const s2=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.12,D),sm);s2.position.set(-W/2+0.02,0.06,0);scene.add(mk(s2));
    const s3=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.12,D),sm);s3.position.set(W/2-0.02,0.06,0);scene.add(mk(s3));
    if(room.id==='living'){
      const sofa=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.5,0.95),new THREE.MeshLambertMaterial({color:'#5f7d8e'}));sofa.position.set(0,0.25,1.8);sofa.castShadow=true;scene.add(mk(sofa));
      const sb=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.65,0.18),new THREE.MeshLambertMaterial({color:'#4f6d7e'}));sb.position.set(0,0.7,2.22);scene.add(mk(sb));
      [-1.2,1.2].forEach(x=>{const a=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.58,0.95),new THREE.MeshLambertMaterial({color:'#4f6d7e'}));a.position.set(x,0.49,1.8);scene.add(mk(a));});
      [-0.6,0,0.6].forEach(x=>{const cu=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.18,0.4),new THREE.MeshLambertMaterial({color:'#e8d5b7'}));cu.position.set(x,0.59,1.6);scene.add(mk(cu));});
      const ct=new THREE.Mesh(new THREE.BoxGeometry(1.3,0.06,0.75),new THREE.MeshLambertMaterial({color:'#8b6914'}));ct.position.set(0,0.46,0.5);scene.add(mk(ct));
      const tv=new THREE.Mesh(new THREE.BoxGeometry(2.1,1.1,0.08),new THREE.MeshLambertMaterial({color:'#111'}));tv.position.set(0,1.25,-D/2+0.1);scene.add(mk(tv));
      const sc=new THREE.Mesh(new THREE.PlaneGeometry(1.9,0.95),new THREE.MeshLambertMaterial({color:'#1a3a6e'}));sc.position.set(0,1.25,-D/2+0.15);scene.add(mk(sc));
      const rug=new THREE.Mesh(new THREE.PlaneGeometry(3.2,2.2),new THREE.MeshLambertMaterial({color:'#8B4513'}));rug.rotation.x=-Math.PI/2;rug.position.set(0,0.005,1);scene.add(mk(rug));
    }else if(room.id==='bedroom'){
      const bed=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.28,3.1),new THREE.MeshLambertMaterial({color:'#7d5a3c'}));bed.position.set(0,0.14,0.5);scene.add(mk(bed));
      const mat=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.2,2.9),new THREE.MeshLambertMaterial({color:'#f5f5f0'}));mat.position.set(0,0.38,0.5);scene.add(mk(mat));
      const hb=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.85,0.12),new THREE.MeshLambertMaterial({color:'#5d3a1a'}));hb.position.set(0,0.7,-1.0);scene.add(mk(hb));
      [-0.5,0.5].forEach(x=>{const p=new THREE.Mesh(new THREE.BoxGeometry(0.65,0.14,0.48),new THREE.MeshLambertMaterial({color:'#dbe9f8'}));p.position.set(x,0.55,-0.65);scene.add(mk(p));});
      const wa=new THREE.Mesh(new THREE.BoxGeometry(1.8,2.2,0.55),new THREE.MeshLambertMaterial({color:'#6d4c2a'}));wa.position.set(-W/2+1.1,1.1,-D/2+0.4);scene.add(mk(wa));
    }else if(room.id==='bathroom'){
      const bm=new THREE.MeshLambertMaterial({color:'#f0ece8'});
      const tb=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.55,0.8),bm);tb.position.set(-W/2+1.05,0.27,-D/2+0.55);scene.add(mk(tb));
      const to=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,0.42,10),bm);to.position.set(W/2-0.4,0.21,-D/2+0.4);scene.add(mk(to));
      const si=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.12,0.42),bm);si.position.set(0,0.88,-D/2+0.28);scene.add(mk(si));
    }else if(room.id==='kitchen'){
      const co=new THREE.Mesh(new THREE.BoxGeometry(W-0.5,0.88,0.62),new THREE.MeshLambertMaterial({color:'#7a5c3a'}));co.position.set(0,0.44,-D/2+0.38);scene.add(mk(co));
      const tp=new THREE.Mesh(new THREE.BoxGeometry(W-0.5,0.05,0.65),new THREE.MeshLambertMaterial({color:'#909090'}));tp.position.set(0,0.9,-D/2+0.38);scene.add(mk(tp));
      const ca=new THREE.Mesh(new THREE.BoxGeometry(W-0.5,0.72,0.36),new THREE.MeshLambertMaterial({color:'#8a6c4a'}));ca.position.set(0,2.2,-D/2+0.24);scene.add(mk(ca));
    }
  },[floorTile,wallTile,paintColor,room,tileSize]);

  const od=e=>{drag.current=true;right.current=e.button===2;last.current={x:e.clientX,y:e.clientY};};
  const om=e=>{if(!drag.current)return;const dx=e.clientX-last.current.x,dy=e.clientY-last.current.y;last.current={x:e.clientX,y:e.clientY};if(right.current){tgt.current.x-=dx*0.01;tgt.current.y+=dy*0.01;}else{sph.current.theta-=dx*0.008;sph.current.phi=Math.max(0.15,Math.min(Math.PI/2.05,sph.current.phi+dy*0.008));}upd();};
  const ou=()=>{drag.current=false;};
  const ow=e=>{sph.current.r=Math.max(4,Math.min(22,sph.current.r+e.deltaY*0.012));upd();e.preventDefault();};
  const rst=()=>{sph.current={theta:Math.PI/4,phi:Math.PI/3.2,r:12};tgt.current={x:0,y:0.5,z:0};upd();};
  return(
    <div style={{position:'relative',width:'100%',height:'100%',overflow:'hidden',borderRadius:8}}>
      <div ref={ref} style={{width:'100%',height:'100%',cursor:'grab'}} onMouseDown={od} onMouseMove={om} onMouseUp={ou} onMouseLeave={ou} onWheel={ow} onContextMenu={e=>e.preventDefault()}/>
      <div style={{position:'absolute',bottom:10,left:10,background:'rgba(15,23,42,0.85)',color:'white',borderRadius:8,padding:'8px 12px',fontSize:11,lineHeight:1.7,pointerEvents:'none'}}>
        🖱️ Drag to rotate | Scroll to zoom | Right-click to pan
        <div style={{color:'#93c5fd',fontWeight:600}}>{room.w}m × {room.d}m × {room.h}m | {(room.w*room.d*10.764).toFixed(1)} sq.ft</div>
      </div>
      <button onClick={rst} style={{position:'absolute',top:10,right:10,padding:'5px 12px',background:'rgba(255,255,255,0.92)',border:'none',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer'}}>↺ Reset</button>
    </div>
  );
}

// ── SCROLLABLE SIDE PANEL ──────────────────────────────────────
// Uses position:relative + explicit px height + overflow-y:scroll
// This bypasses ALL parent CSS conflicts
function Panel({children}){
  return(
    <div style={{
      position:'relative',
      width:'100%',
      height:'570px',        /* fixed px — not vh, not % */
      overflowY:'scroll',    /* scroll not auto — always shows bar */
      overflowX:'hidden',
      display:'flex',
      flexDirection:'column',
      gap:10,
      paddingRight:4,
      paddingBottom:12,
      boxSizing:'border-box',
    }}>
      {children}
    </div>
  );
}

// Simple white card box
function Box({children}){
  return(
    <div style={{background:'white',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.08)',overflow:'visible',flexShrink:0,width:'100%',boxSizing:'border-box'}}>
      {children}
    </div>
  );
}

function BoxHead({icon,title}){
  return(
    <div style={{padding:'11px 14px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:8}}>
      <span style={{fontSize:16}}>{icon}</span>
      <span style={{fontSize:13,fontWeight:700,color:'#1a1d23'}}>{title}</span>
    </div>
  );
}

export default function RoomVisualizer(){
  const [products,setProducts]=useState([]);
  const [floorTile,setFloorTile]=useState(null);
  const [wallTile,setWallTile]=useState(null);
  const [paint,setPaint]=useState(PAINT_COLORS[0]);
  const [room,setRoom]=useState(ROOMS[0]);
  const [tileSize,setTileSize]=useState(40);
  const [tab,setTab]=useState('floor');
  const [loading,setLoading]=useState(true);
  const today=new Date().toLocaleDateString('en-US',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});

  useEffect(()=>{
    api.products.getAll().then(res=>{
      const p=(res.data?.products||res.data||[]).map(x=>({...x,unit_price:parseFloat(x.rate||0)}));
      setProducts(p);
      if(p.length>0)setFloorTile(p[0]);
      if(p.length>1)setWallTile(p.find(x=>(x.category||'').toLowerCase().includes('wall'))||p[1]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  const compat=checkCompat(paint?.name,(tab==='floor'?floorTile:wallTile)?.color);
  const fa=room.w*room.d, wa=2*(room.w+room.d)*room.h;
  const fq=Math.ceil(fa*1.1), wq=Math.ceil(wa*1.1);
  const fc=floorTile?fq*floorTile.unit_price:0, wc=wallTile?wq*wallTile.unit_price:0;

  return(
    /* OUTERMOST: position fixed covers full screen, no parent interference */
    <div style={{position:'fixed',top:0,right:0,bottom:0,left:'240px',background:'#f4f6fa',zIndex:10,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* HEADER */}
      <div style={{background:'white',padding:'16px 28px',borderBottom:'1px solid #e8ecf0',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0,zIndex:20}}>
        <div>
          <div style={{fontSize:22,fontWeight:700,color:'#1a1d23'}}>3D Room Visualizer</div>
          <div style={{fontSize:12,color:'#64748b',marginTop:2}}>See tiles on floor & walls — drag, zoom & rotate</div>
        </div>
        <div style={{textAlign:'right',fontSize:12,color:'#64748b'}}>Current Date<strong style={{display:'block',fontSize:14,color:'#1a1d23',fontWeight:600}}>{today}</strong></div>
      </div>

      {/* BODY */}
      <div style={{flex:1,overflow:'hidden',padding:'14px 20px',display:'grid',gridTemplateColumns:'240px 1fr 262px',gap:14,minHeight:0}}>

        {/* LEFT PANEL */}
        <Panel>
          <Box>
            <BoxHead icon="🏠" title="Room Type"/>
            <div style={{padding:'10px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {ROOMS.map(r=>(
                <button key={r.id} onClick={()=>setRoom(r)} style={{padding:'8px 4px',borderRadius:8,border:room.id===r.id?'2px solid #6366f1':'1px solid #e2e8f0',background:room.id===r.id?'#eef2ff':'white',cursor:'pointer',fontSize:12,fontWeight:room.id===r.id?700:400,color:room.id===r.id?'#6366f1':'#374151',textAlign:'center'}}>
                  <div style={{fontSize:18,marginBottom:2}}>{r.icon}</div>
                  <div>{r.label}</div>
                  <div style={{fontSize:10,color:'#94a3b8'}}>{r.w}×{r.d}m</div>
                </button>
              ))}
            </div>
          </Box>

          <Box>
            <BoxHead icon="🧱" title="Select Tile"/>
            <div style={{padding:'10px'}}>
              <div style={{display:'flex',gap:6,marginBottom:8}}>
                {[['floor','🔲 Floor'],['wall','🧱 Wall']].map(([v,l])=>(
                  <button key={v} onClick={()=>setTab(v)} style={{flex:1,padding:'6px',borderRadius:6,border:tab===v?'2px solid #6366f1':'1px solid #e2e8f0',background:tab===v?'#eef2ff':'white',fontSize:12,fontWeight:600,cursor:'pointer',color:tab===v?'#6366f1':'#64748b'}}>{l}</button>
                ))}
              </div>
              {(tab==='floor'?floorTile:wallTile)&&(
                <div style={{background:'#eef2ff',borderRadius:8,padding:'7px 10px',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:22,height:22,borderRadius:4,flexShrink:0,background:TILE_HEX[(tab==='floor'?floorTile:wallTile)?.color]||'#e2e8f0'}}/>
                  <div style={{fontSize:11,fontWeight:700,color:'#4f46e5',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(tab==='floor'?floorTile:wallTile)?.product_name}</div>
                </div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:3}}>
                <div onClick={()=>tab==='floor'?setFloorTile(null):setWallTile(null)} style={{padding:'7px 8px',borderRadius:7,cursor:'pointer',border:'1px solid #e2e8f0',background:'#fafafa',display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                  <div style={{width:20,height:20,borderRadius:4,background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0}}>✕</div>None / Original
                </div>
                {loading?<div style={{fontSize:12,color:'#94a3b8',padding:8,textAlign:'center'}}>Loading...</div>:
                  products.map(p=>{
                    const sel=tab==='floor'?floorTile:wallTile;
                    return(
                      <div key={p.id} onClick={()=>tab==='floor'?setFloorTile(p):setWallTile(p)} style={{padding:'7px 8px',borderRadius:7,cursor:'pointer',border:sel?.id===p.id?'2px solid #6366f1':'1px solid transparent',background:sel?.id===p.id?'#eef2ff':'white',display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:20,height:20,borderRadius:4,flexShrink:0,background:TILE_HEX[p.color]||'#e2e8f0',backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(0,0,0,0.1) 4px,rgba(0,0,0,0.1) 5px),repeating-linear-gradient(90deg,transparent,transparent 4px,rgba(0,0,0,0.1) 4px,rgba(0,0,0,0.1) 5px)'}}/>
                        <div style={{overflow:'hidden'}}>
                          <div style={{fontSize:11,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.product_name}</div>
                          <div style={{fontSize:10,color:'#6366f1'}}>₹{p.unit_price}/{p.unit}</div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </Box>

          <Box>
            <BoxHead icon="⚙️" title={`Tile Scale: ${tileSize}`}/>
            <div style={{padding:'10px 14px 14px'}}>
              <input type="range" min={20} max={70} step={5} value={tileSize} onChange={e=>setTileSize(+e.target.value)} style={{width:'100%'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#94a3b8',marginTop:3}}><span>Small tiles</span><span>Large tiles</span></div>
            </div>
          </Box>
        </Panel>

        {/* 3D CANVAS */}
        <div style={{background:'white',borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,0.08)',overflow:'hidden',display:'flex',flexDirection:'column',minHeight:0}}>
          <div style={{padding:'12px 16px',background:'linear-gradient(135deg,#1e293b,#334155)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',flexShrink:0}}>
            <span style={{fontSize:16}}>🎮</span>
            <span style={{fontSize:14,fontWeight:700,color:'white',flex:1}}>3D Preview — {room.label}</span>
            {floorTile&&<span style={{background:'rgba(99,102,241,0.85)',color:'white',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600}}>Floor: {floorTile.product_name.slice(0,16)}</span>}
            {wallTile&&<span style={{background:'rgba(16,185,129,0.85)',color:'white',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:600}}>Wall: {wallTile.product_name.slice(0,16)}</span>}
          </div>
          <div style={{flex:1,minHeight:0}}>
            {!loading&&<ThreeRoom floorTile={floorTile} wallTile={wallTile} paintColor={paint} room={room} tileSize={tileSize}/>}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <Panel>
          <Box>
            <BoxHead icon="🎨" title="Wall Paint"/>
            <div style={{padding:'10px 12px'}}>
              <div style={{fontSize:11,color:'#64748b',marginBottom:8}}>Applied when no wall tile is selected</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:8}}>
                {PAINT_COLORS.map(p=>(
                  <div key={p.name} onClick={()=>setPaint(paint?.name===p.name?null:p)} title={p.name} style={{aspectRatio:'1',borderRadius:8,background:p.hex,border:paint?.name===p.name?'3px solid #6366f1':'2px solid rgba(0,0,0,0.12)',cursor:'pointer',boxShadow:paint?.name===p.name?'0 0 0 2px white,0 0 0 4px #6366f1':'none',transition:'all 0.15s'}}/>
                ))}
              </div>
              {paint&&<div style={{background:'#f8fafc',borderRadius:8,padding:'6px 10px',display:'flex',alignItems:'center',gap:8,fontSize:12}}><div style={{width:14,height:14,borderRadius:3,background:paint.hex,border:'1px solid rgba(0,0,0,0.1)',flexShrink:0}}/><strong>{paint.name}</strong></div>}
            </div>
          </Box>

          <Box>
            <BoxHead icon="🔍" title="Paint & Tile Match"/>
            <div style={{padding:'10px 12px'}}>
              {!paint||!(tab==='floor'?floorTile:wallTile)?(
                <div style={{fontSize:12,color:'#94a3b8',textAlign:'center',padding:'10px 0'}}>Select a tile &amp; paint to check match</div>
              ):(
                <>
                  <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center'}}>
                    <div style={{flex:1,height:32,borderRadius:6,background:TILE_HEX[(tab==='floor'?floorTile:wallTile)?.color]||'#e2e8f0',backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(0,0,0,0.06) 6px,rgba(0,0,0,0.06) 7px)'}}/>
                    <span style={{color:'#94a3b8',fontSize:16,fontWeight:700}}>+</span>
                    <div style={{flex:1,height:32,borderRadius:6,background:paint.hex,border:'1px solid rgba(0,0,0,0.08)'}}/>
                  </div>
                  <div style={{background:compat?'#f0fdf4':'#fef2f2',border:`1px solid ${compat?'#a7f3d0':'#fecaca'}`,borderRadius:8,padding:'10px 12px'}}>
                    <div style={{fontWeight:700,fontSize:13,color:compat?'#065f46':'#991b1b',marginBottom:3}}>{compat?'✅ Great Match!':'⚠️ May Not Match'}</div>
                    <div style={{fontSize:11,color:compat?'#064e3b':'#7f1d1d',lineHeight:1.6}}>{compat?`${paint.name} pairs beautifully with ${(tab==='floor'?floorTile:wallTile)?.color} tiles!`:'Try Ivory White or Warm Beige for better harmony.'}</div>
                  </div>
                </>
              )}
            </div>
          </Box>

          <Box>
            <BoxHead icon="💰" title="Cost Estimate"/>
            <div style={{padding:'10px 12px'}}>
              <div style={{fontSize:11,color:'#64748b',marginBottom:8,background:'#f8fafc',borderRadius:6,padding:'6px 10px'}}>Room: <strong>{room.w}×{room.d}×{room.h}m</strong> · Floor area: <strong>{(fa*10.764).toFixed(0)} sqft</strong></div>
              {floorTile&&(
                <div style={{background:'#eef2ff',borderRadius:8,padding:'10px',marginBottom:8}}>
                  <div style={{fontSize:10,color:'#6366f1',fontWeight:700,marginBottom:2}}>🔲 FLOOR TILES</div>
                  <div style={{fontSize:12,fontWeight:600}}>{floorTile.product_name}</div>
                  <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{fq} sqft × ₹{floorTile.unit_price}</div>
                  <div style={{fontSize:20,fontWeight:800,color:'#4338ca'}}>₹{fc.toLocaleString('en-IN')}</div>
                </div>
              )}
              {wallTile&&(
                <div style={{background:'#f0fdf4',borderRadius:8,padding:'10px',marginBottom:8}}>
                  <div style={{fontSize:10,color:'#10b981',fontWeight:700,marginBottom:2}}>🧱 WALL TILES</div>
                  <div style={{fontSize:12,fontWeight:600}}>{wallTile.product_name}</div>
                  <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{wq} sqft × ₹{wallTile.unit_price}</div>
                  <div style={{fontSize:20,fontWeight:800,color:'#047857'}}>₹{wc.toLocaleString('en-IN')}</div>
                </div>
              )}
              {(fc+wc)>0&&(
                <div style={{background:'linear-gradient(135deg,#1e293b,#334155)',borderRadius:8,padding:'12px',color:'white',textAlign:'center',marginBottom:10}}>
                  <div style={{fontSize:11,opacity:0.7}}>Total (incl. 10% wastage)</div>
                  <div style={{fontSize:26,fontWeight:900}}>₹{(fc+wc).toLocaleString('en-IN')}</div>
                  <div style={{fontSize:10,opacity:0.6}}>+GST 28% = ₹{((fc+wc)*1.28).toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
                </div>
              )}
              <button onClick={()=>window.open(`https://wa.me/918531034528?text=${encodeURIComponent(`Hi TileSoft!\nRoom: ${room.label} (${room.w}×${room.d}m)\n${floorTile?`Floor: ${floorTile.product_name} ₹${fc.toLocaleString('en-IN')}\n`:''}${wallTile?`Walls: ${wallTile.product_name} ₹${wc.toLocaleString('en-IN')}\n`:''}${paint?`Paint: ${paint.name}\n`:''}\nTotal: ₹${(fc+wc).toLocaleString('en-IN')}\nPlease send a quotation!`)}`,'_blank')} style={{width:'100%',padding:'10px',background:'#25d366',color:'white',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:13}}>
                📱 WhatsApp Estimate
              </button>
            </div>
          </Box>
        </Panel>

      </div>
    </div>
  );
}