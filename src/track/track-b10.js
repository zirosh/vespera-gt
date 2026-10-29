/* =========================================================
   Vita a bordo pista e dettagli delle auto: freni che si scaldano davvero e si arroventano, carrozzerie che si sporcano,
   commissari con la bandiera gialla, pubblico che salta al passaggio delle auto, elicottero della televisione
   ========================================================= */
/* freni: la potenza frenante scalda i dischi (massa termica di ~13 kJ/K per un'auto da 1500 kg), l'aria li raffredda di più in velocità.
   Il bagliore compare verso i 450 °C e passa dal rosso scuro all'arancio-giallo sopra i 750 °C */
const _bc1=new THREE.Color(0xff1e00),_bc2=new THREE.Color(0xffa63a);
function trkBrakeHeat(P,dt,rp){
  const c=P.car,v=Math.abs(c.vx),amb=24-11*TRK.wet-(TRK.tod==='night'?5:0);if(P.bT==null)P.bT=amb;
  if(!rp){const F=P.brk*(P.lastG||P.veh.m*9.81)*1.05,Cb=13000*(P.veh.m/1500),k=0.0065*(1+v/30)*(1+1.4*TRK.wet);
    P.bT+=dt*(F*v/Cb-k*(P.bT-amb));P.bT=clamp(P.bT,amb,1150);}
  if(!P.bCol)P.bCol=new THREE.Color();P.bCol.copy(_bc1).lerp(_bc2,smooth01(P.bT,720,1000));
  return smooth01(P.bT,430,900)*3.4;
}
/* sporco: polvere con la strada, molto di più su erba e ghiaia, spruzzi d'acqua dalle auto davanti sul bagnato */
function trkDirtStep(P,dt,rp){
  if(!rp){const v=Math.abs(P.car.vx),off=P.wsf?P.wsf.filter(s=>s==='erba'||s==='ghiaia').length/4:0;
    P.dirt=Math.min(1,(P.dirt||0)+dt*(v*0.00004+off*v*0.0022+TRK.wet*v*0.00012*(0.4+1.5*(P.wk||0))));}
  const mats=P.id===0?(state.lab?[]:[paintBody,paint,paintDouble,roofPaint]):(P.M?[P.M.paintBody,P.M.paint,P.M.paintDouble,P.M.roof,P.M.lab,P.M.stripe]:[]);
  if(P.id===0&&P.M&&!state.lab)mats.push(P.M.paintBody,P.M.paint,P.M.paintDouble,P.M.roof);
  trkDirtSet(mats,P.dirt||0,Math.min(1,TRK.wet*1.3),P.rig?P.rig.position.y:0);
}
/* pubblico: ogni spettatore salta per conto suo, di più quando passano le auto e ai sorpassi */
const TRK_CROWD={uCrowdT:{value:0},uCrowdEx:{value:0}};
function trkCrowdPatch(mat){
  mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,TRK_CROWD);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uCrowdT,uCrowdEx;').replace('#include <map_fragment>',`#ifdef USE_MAP
      float cxi=floor(vUv.x*64.0),cph=fract(sin(cxi*12.9898+floor(vUv.y*9.0)*7.13)*43758.5);
      float jmp=max(0.0,sin(uCrowdT*(5.0+cph*5.0)+cph*6.283))*(0.15+0.85*step(0.45,cph))*uCrowdEx*0.07;
      vec4 texelColor=mapTexelToLinear(texture2D(map,vUv-vec2(0.0,jmp)));diffuseColor*=texelColor;
      #endif`);};
  mat.customProgramCacheKey=()=>'trkcrowd';return mat;
}
/* elicottero della TV: segue il primo in classifica girandogli attorno, con le luci anticollisione */
let HELI=null;
function trkHeliBuild(){
  const g=new THREE.Group(),body=new THREE.MeshStandardMaterial({color:0x1d3f73,metalness:0.4,roughness:0.35}),white=new THREE.MeshStandardMaterial({color:0xf1f2f0,metalness:0.2,roughness:0.4}),
    glass=new THREE.MeshStandardMaterial({color:0x101820,metalness:0.6,roughness:0.08}),dark=new THREE.MeshStandardMaterial({color:0x22262b,roughness:0.6});
  const cab=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),body);cab.scale.set(2.1,1.15,1.15);g.add(cab);
  const win=new THREE.Mesh(new THREE.SphereGeometry(1,20,14,0,Math.PI*2,0,Math.PI*0.45),glass);win.scale.set(1.5,1.05,1.08);win.rotation.z=-1.25;win.position.set(0.9,0.12,0);g.add(win);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(3.2,0.18,2.36),white);stripe.position.y=-0.25;g.add(stripe);
  const boom=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.32,5.2,10),body);boom.rotation.z=Math.PI/2;boom.position.set(-4.2,0.35,0);g.add(boom);
  const fin=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.4,0.1),body);fin.position.set(-6.6,0.9,0);fin.rotation.z=-0.35;g.add(fin);
  const tail=new THREE.Mesh(new THREE.BoxGeometry(0.12,1.5,0.06),dark);tail.position.set(-6.6,0.9,0.18);g.add(tail);
  for(const z of [-0.85,0.85]){const sk=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,3.6,6),dark);sk.rotation.z=Math.PI/2;sk.position.set(0.1,-1.45,z);g.add(sk);
    for(const x of [-0.8,0.9]){const st=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.55,5),dark);st.position.set(x,-1.15,z*0.85);st.rotation.x=z*0.35;g.add(st);}}
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.12,0.45,8),dark);mast.position.y=1.3;g.add(mast);
  const rotor=new THREE.Group();rotor.position.y=1.52;g.add(rotor);
  for(let k=0;k<4;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(5.2,0.04,0.28),dark);b.position.x=2.6;const a=new THREE.Group();a.rotation.y=k*Math.PI/2;a.add(b);rotor.add(a);}
  const disc=new THREE.Mesh(new THREE.CircleGeometry(5.3,40),new THREE.MeshBasicMaterial({color:0x111418,transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide}));disc.rotation.x=-Math.PI/2;rotor.add(disc);
  const tr=new THREE.Group();tr.position.set(-6.7,1.0,0.22);g.add(tr);for(let k=0;k<2;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(0.08,1.1,0.03),dark);b.rotation.z=k*Math.PI/2;tr.add(b);}
  const cam=new THREE.Mesh(new THREE.SphereGeometry(0.28,10,8),white);cam.position.set(1.7,-0.75,0);g.add(cam);
  const blink=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff2a1a,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0}));blink.scale.set(2.4,2.4,1);blink.position.set(-1,1.2,0);g.add(blink);
  g.traverse(o=>{if(o.isMesh)o.castShadow=o!==disc;});g.scale.setScalar(1.15);
  HELI={g,rotor,tr,blink,ang:Math.random()*6,pos:new THREE.Vector3(0,80,0),yaw:0,bank:0,ok:false};TRK.tw.add(g);
}
const _hv2=new THREE.Vector3();
function trkHeliStep(dt){
  if(!HELI||HELI.g.parent!==TRK.tw)trkHeliBuild();if(!TRK.cars.length)return;
  const R=TRK.race,lead=TRK.duo&&R.state==='run'?TRK.cars.slice().sort((a,b)=>trkProg(b)-trkProg(a))[0]:TRK.p[0],c=lead.car;
  HELI.ang+=dt*0.11;const rr=75,gx=c.X+Math.cos(HELI.ang)*rr+c.vx*Math.cos(c.psi)*1.2,gy=c.Y+Math.sin(HELI.ang)*rr+c.vx*Math.sin(c.psi)*1.2;
  const gz=Math.max(trkGroundH(gx,gy),lead.zc)+58;_hv2.set(gx,gz,-gy);
  if(!HELI.ok){HELI.pos.copy(_hv2);HELI.ok=true;}
  const dx=_hv2.x-HELI.pos.x,dz=_hv2.z-HELI.pos.z,k=1-Math.exp(-dt*0.8);HELI.pos.lerp(_hv2,k);
  const vx=dx*k/Math.max(dt,1e-3),vz=dz*k/Math.max(dt,1e-3),sp=Math.hypot(vx,vz);
  if(sp>2){let ty=Math.atan2(-vz,vx),d=ty-HELI.yaw;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;HELI.yaw+=d*Math.min(1,dt*1.2);HELI.bank+=(clamp(d*0.8,-0.35,0.35)-HELI.bank)*Math.min(1,dt*2);}
  const g=HELI.g;g.position.copy(HELI.pos);g.rotation.order='YXZ';g.rotation.set(HELI.bank,HELI.yaw,-Math.min(0.22,sp*0.006));
  HELI.rotor.rotation.y+=dt*38;HELI.tr.rotation.z+=dt*60;
  HELI.blink.material.opacity=(TRK.clock%1.2)<0.12?(TRK.tod==='night'?1:0.6):0;
}
/* bandiere gialle: un'auto ferma, lentissima o fuori pista fa sventolare la bandiera alla postazione prima di lei;
   chi passa in quel tratto vede l'avviso */
function trkFlagsStep(dt){
  const posts=TRK.posts;if(!posts||!posts.length)return;const T=TRK.T,N=T.N,hw=T.w/2,R=TRK.race,live=!TRK.duo||R.state==='run';
  for(const p of posts){p.want=0;p.src=null;}
  if(live)for(const Q of TRK.cars){if(Q.pit)continue;const c=Q.car,slow=Math.abs(c.vx)<10&&TRK.clock>6&&!(TRK.duo&&R.state!=='run'),off=Math.abs(c.d)>hw+2.5;
    if(!(slow||off||(Q.stuckT||0)>0.4))continue;Q.inc=TRK.clock;
    for(const p of posts){let di=c.i-p.i;if(di<0)di+=N;if(di<165){p.want=1;p.src=Q;}}}
  for(const P of TRK.cars){if(P.isAI)continue;P.yellow=false;for(const p of posts){if(!p.on||p.src===P)continue;let di=P.car.i-p.i;if(di<0)di+=N;if(di<200){P.yellow=true;break;}}}
  for(const p of posts){p.on=p.want?1:Math.max(0,p.on-dt*0.5);const on=p.on>0;p.flag.visible=on;
    if(on){p.ph+=dt;p.arm.rotation.z=-0.2+Math.sin(p.ph*5.2)*0.9;p.arm.rotation.x=Math.sin(p.ph*2.6)*0.25;
      const a=p.flag.geometry.attributes.position,b=p.base;for(let k=0;k<a.count;k++){const x=b[k*3];a.array[k*3+2]=Math.sin(p.ph*11-x*7)*0.09*x;}a.needsUpdate=true;}
    else{p.arm.rotation.z+=(-1.2-p.arm.rotation.z)*Math.min(1,dt*3);p.arm.rotation.x=0;}}
}
/* pubblico: più eccitato quando un'auto passa davanti alle tribune */
function trkCrowdStep(dt){
  TRK_CROWD.uCrowdT.value=TRK.clock;let near=0;
  if(TRK.stands)for(const Q of TRK.cars){for(const s of TRK.stands){const d=Math.hypot(Q.car.X-s.X,Q.car.Y-s.Y);if(d<90)near=Math.max(near,1-d/90);}}
  TRK.crowdEx=Math.max(0,(TRK.crowdEx||0)-dt*0.35);TRK_CROWD.uCrowdEx.value+=(Math.max(0.12,near*0.8,TRK.crowdEx)-TRK_CROWD.uCrowdEx.value)*Math.min(1,dt*4);
}
function trkTrackLife(dt){if(!TRK.built||TRK.replay.on)return;trkFlagsStep(dt);trkCrowdStep(dt);trkHeliStep(dt);}
{const f=trkFrame;trkFrame=function(dt){f(dt);if(TRK.on&&!TRK.paused)trkTrackLife(Math.min(dt,0.05));};}
