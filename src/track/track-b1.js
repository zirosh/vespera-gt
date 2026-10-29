/* =========================================================
   Dettagli dell'auto in pista: numeri di gara, pilota, fiammate, tergicristalli, fari
   ========================================================= */
const TRK_DETAIL=[];
function trkNumberMat(n,ring){
  const t=canvasTex(256,(g,s)=>{g.clearRect(0,0,s,s);g.fillStyle='#f4f4f0';g.beginPath();g.arc(s/2,s/2,s/2-6,0,7);g.fill();g.lineWidth=12;g.strokeStyle=ring;g.stroke();
    g.fillStyle='#14171a';g.font=`800 176px ${TRK_FONT}`;g.textAlign='center';g.textBaseline='middle';g.fillText(n,s/2,s/2+12);});
  return new THREE.MeshStandardMaterial(Object.assign({map:t,transparent:true,roughness:0.45,metalness:0,envMapIntensity:0.5},trkOff));
}
const trkNum1=trkNumberMat('1','#c4261d');
const trkStripe1=new THREE.MeshStandardMaterial({color:0xc4261d,roughness:0.4});
const trkFlameMat=new THREE.SpriteMaterial({map:glowTex,color:0xff8a3a,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false});
/* decalcomania appoggiata alla superficie colpita da un raggio, orientata con il «su» indicato */
function trkDecal(target,origin,dir,parent,size,mat,upHint){
  ray.set(origin,dir.clone().normalize());target.updateMatrixWorld(true);const hits=ray.intersectObject(target,false);if(!hits.length)return null;const r=hits[0];
  const n=r.face.normal.clone().transformDirection(target.matrixWorld).normalize();if(n.dot(dir)>0)n.negate();
  const up=(upHint||new THREE.Vector3(0,1,0)).clone();up.addScaledVector(n,-up.dot(n));if(up.lengthSq()<1e-6)up.set(1,0,0);up.normalize();
  const xa=new THREE.Vector3().crossVectors(up,n).normalize();
  const qW=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xa,up,n));
  const o=new THREE.Mesh(new THREE.CircleGeometry(size,40),mat);parent.updateMatrixWorld(true);
  const pq=new THREE.Quaternion();parent.getWorldQuaternion(pq);o.quaternion.copy(pq.invert().multiply(qW));
  o.position.copy(parent.worldToLocal(r.point.clone().addScaledVector(n,0.008)));parent.add(o);return o;
}
function trkLimb(parent,A,B,r,mat){const d=new THREE.Vector3().subVectors(B,A),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r*0.92,d.length(),10),mat);
  o.position.copy(A).add(B).multiplyScalar(0.5);o.quaternion.setFromUnitVectors(UP,d.normalize());parent.add(o);return o;}
/* fari che illuminano davvero la strada (di notte, al tramonto e con la pioggia) */
function trkHeadlight(parent){const sp=new THREE.SpotLight(0xfff1dc,0,150,0.46,0.55,1.2);sp.position.set(2.1,0.62,0);sp.target.position.set(30,-1.2,0);parent.add(sp);parent.add(sp.target);return sp;}
const trkSpot1=trkHeadlight(rig),trkSpot2=trkHeadlight(rig2);
function trkCarDetails(){
  if(TRK.details)return;TRK.details=true;
  rig.position.set(0,0,0);rig.rotation.set(0,0,0);car.updateMatrixWorld(true);
  /* numeri sui parafanghi anteriori e sul tetto */
  for(const s of [1,-1]){const d=trkDecal(bodyMesh,V(1.55,0.62,6*s),V(0,0,-s),chassis,0.17,trkNum1);if(d)TRK_DETAIL.push(d);}
  {const d=trkDecal(roofMesh,V(-0.38,6,0),V(0,-1,0),cabinG,0.25,trkNum1,V(1,0,0));if(d)TRK_DETAIL.push(d);}
  /* pilota con casco, tuta e guanti, seduto al posto di guida */
  {const g=new THREE.Group(),suit=new THREE.MeshStandardMaterial({color:0x1d2f4f,roughness:0.85}),glove=new THREE.MeshStandardMaterial({color:0x111214,roughness:0.7}),
     helm=new THREE.MeshPhysicalMaterial({color:0xf2f2ee,roughness:0.25,clearcoat:1}),visor=new THREE.MeshStandardMaterial({color:0x0e1013,metalness:0.7,roughness:0.08});
   const z=DZ;
   const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.19,0.52,14),suit);torso.position.set(-0.66,0.72,z);torso.rotation.z=0.28;g.add(torso);
   const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.1,10),suit);neck.position.set(-0.62,0.97,z);g.add(neck);
   const head=new THREE.Mesh(new THREE.SphereGeometry(0.13,24,16),helm);head.position.set(-0.6,1.05,z);g.add(head);
   const vis=new THREE.Mesh(new THREE.SphereGeometry(0.133,24,8,Math.PI-0.95,1.9,1.2,0.55),visor);vis.position.copy(head.position);g.add(vis);
   const stripe=new THREE.Mesh(new THREE.TorusGeometry(0.132,0.013,6,32),trkStripe1);stripe.position.copy(head.position);g.add(stripe);
   for(const s of [1,-1]){const sh=V(-0.6,0.9,z+s*0.19),el=V(-0.3,0.72,z+s*0.25),ha=V(0.1,0.86,z+s*0.16);
     trkLimb(g,sh,el,0.05,suit);trkLimb(g,el,ha,0.045,suit);const gl=new THREE.Mesh(new THREE.SphereGeometry(0.048,12,8),glove);gl.position.copy(ha);g.add(gl);
     const hip=V(-0.55,0.47,z+s*0.1),kn=V(-0.05,0.56,z+s*0.12),ft=V(0.42,0.3,z+s*0.12);trkLimb(g,hip,kn,0.07,suit);trkLimb(g,kn,ft,0.055,suit);}
   g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
   interiorG.add(g);TRK.driver=g;TRK_DETAIL.push(g);}
  /* fiammate dai quattro terminali di scarico */
  TRK.flames=[];
  for(const z of [-0.47,-0.36,0.36,0.47]){const h=rear(0.285,z);if(!h)continue;const sp=new THREE.Sprite(trkFlameMat);sp.position.copy(chassis.worldToLocal(V(h.p.x-0.16,0.285,z)));sp.scale.set(0.22,0.16,1);sp.visible=false;chassis.add(sp);TRK.flames.push(sp);}
  /* tergicristalli: ognuno su un perno all'estremità, ruota attorno alla normale del parabrezza */
  TRK.wipers=[];
  chassis.children.filter(o=>o.isMesh&&Math.abs(o.position.x-0.80)<1e-6&&(Math.abs(o.position.z+0.26)<1e-6||Math.abs(o.position.z-0.22)<1e-6)).forEach(m=>{
    const pv=new THREE.Group();pv.position.copy(m.position).add(V(0,0,-0.24));chassis.add(pv);pv.add(m);m.position.set(0,0,0.24);TRK.wipers.push(pv);});
  TRK_DETAIL.forEach(o=>o.visible=false);
}
const TRK_WIPE_AXIS=new THREE.Vector3(0.53,0.85,0).normalize();
function trkWipe(list,t){const a=0.85-0.85*Math.cos(t*Math.PI*2*0.85);list.forEach(w=>{w.quaternion.setFromAxisAngle(TRK_WIPE_AXIS,a);});}
/* numeri anche sulla forma del laboratorio (rifatti quando la forma cambia) */
function trkLabDecals(group,body,S,mat){
  const P=S.P,x=(S.xa[0]+S.xa[1])/2+0.35,y=P.ride+0.42*(S.H-P.ride),out=[];group.updateMatrixWorld(true);
  for(const s of [1,-1]){const d=trkDecal(body,V(x,y,6*s),V(0,0,-s),group,0.16,mat);if(d)out.push(d);}
  const d=trkDecal(body,V((S.xr0+S.xr1)/2,6,0),V(0,-1,0),group,0.24,mat,V(1,0,0));if(d)out.push(d);
  return out;
}
function trkLabDecalsP1(){
  if(TRK.labDecals)TRK.labDecals.forEach(o=>{if(o.parent)o.parent.remove(o);o.geometry.dispose();});TRK.labDecals=null;
  if(!state.lab||!labBodyMesh||!LAB)return;
  const sp=rig.position.clone(),sr=rig.rotation.clone();rig.position.set(0,0,0);rig.rotation.set(0,0,0);labG.rotation.set(0,0,0);
  TRK.labDecals=trkLabDecals(labG,labBodyMesh,LAB,trkNum1);TRK.labDecalsVer=labVer;
  rig.position.copy(sp);rig.rotation.copy(sr);
}
function trkSpotPlace(sp,lab){if(lab){sp.position.set(lab.xf,lab.noseH-0.05,0);sp.target.position.set(lab.xf+28,-1.2,0);}else{sp.position.set(2.1,0.62,0);sp.target.position.set(30,-1.2,0);}}

/* =========================================================
   Auto in gara: copia della Vespera o forma del laboratorio, ciascuna con colore, numero, luci e aloni propri
   ========================================================= */
const TRK_RING=['#c4261d','#2e6fd8','#e3b23c','#1f9a5a','#8a4fd8','#e0742a','#17a2b8','#d63384'];
const TRK_FIELD_COLORS=['#d19a0e','#123f30','#e6e3da','#3b3e43','#9a4a22','#2a6fb0','#7a1f5c','#16305a','#a3121a'];
const TRK_MIX=['supercar','vespera','sedan','drop','seventies'];
/* caratteri dei piloti del computer: distanza laterale nei sorpassi (gap), spinta quando attaccano (boost), propensione all'errore (err),
   voglia di difendere la posizione (defend), bravura sul bagnato (wet, 0.5 = nella media) */
const TRK_CHARS=[{n:'aggressivo',gap:2.8,boost:0.018,err:0.35,defend:0.55,wet:0.45},{n:'prudente',gap:3.9,boost:0,err:0.08,defend:0.3,wet:0.55,pace:-0.006},
  {n:'mago della pioggia',gap:3.3,boost:0.008,err:0.2,defend:0.45,wet:1},{n:'irruento',gap:3.0,boost:0.014,err:1,defend:0.5,wet:0.3},
  {n:'regolare',gap:3.4,boost:0.006,err:0.06,defend:0.35,wet:0.5},{n:'difensore',gap:3.4,boost:0.006,err:0.15,defend:1,wet:0.5}];
const TRK_CHAR_PLAIN={n:'regolare',gap:3.3,boost:0,err:0,defend:0.3,wet:0.5};
function trkCarMats(M,color,num,ring){
  if(!M.paintBody){
    M.paintBody=trkCarLightClone(paintBody);
    M.paint=trkCarLightClone(paint);M.paintDouble=trkCarLightClone(paintDouble);M.roof=trkCarLightClone(roofPaint);M.lab=labPaint.clone();
    M.tail=tailMat.clone();M.disc=discMat.clone();M.flame=trkFlameMat.clone();
    M.stripe=new THREE.MeshStandardMaterial({color:ring,roughness:0.4});
    M.haloF=new THREE.SpriteMaterial({map:glowTex,color:0xfff3df,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0});
    M.lab.vertexColors=false;M.lab.fog=true;[M.lab,M.stripe].forEach(trkCarLightPatch);
    M.haloR=new THREE.SpriteMaterial({map:glowTex,color:0xff2a18,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0});}
  if(M.numV!==num+ring){if(M.num)M.num.map.dispose();M.num=trkNumberMat(num,ring);M.numV=num+ring;M.stripe.color.set(ring);}
  for(const m of [M.paintBody,M.paint,M.paintDouble,M.roof,M.lab])m.color.set(color);
  M.disc.emissive.set(0xff3300);M.disc.emissiveIntensity=0;
  return M;
}
/* Vespera degli avversari, alleggerita: le parti ferme rispetto al loro gruppo (scocca, abitacolo, ruota, pilota…) sono fuse
   in un solo pezzo per materiale. Lo stampo si prepara una volta (e di nuovo se cambiano le ali); ogni avversario lo riusa con i suoi colori */
let TRK_VTPL=null;
function trkMergeGeos(list){
  const has=n=>list.every(([g])=>!!g.attributes[n]),useUv=has('uv'),useCol=has('color'),cs=useCol?list[0][0].attributes.color.itemSize:0;
  let n=0;for(const [g] of list)n+=g.index?g.index.count:g.attributes.position.count;
  const P=new Float32Array(n*3),Nn=new Float32Array(n*3),U=useUv?new Float32Array(n*2):null,C=useCol?new Float32Array(n*cs):null,v=new THREE.Vector3(),nm=new THREE.Matrix3();let o=0;
  for(const [g0,M] of list){const g=g0.index?g0.toNonIndexed():g0,p=g.attributes.position,nr=g.attributes.normal,uv=g.attributes.uv,col=g.attributes.color,c=p.count,flip=M.determinant()<0;nm.getNormalMatrix(M);
    for(let k=0;k<c;k++){const kk=flip?(k%3===1?k+1:k%3===2?k-1:k):k,d=o+kk;
      v.fromBufferAttribute(p,k).applyMatrix4(M);P[d*3]=v.x;P[d*3+1]=v.y;P[d*3+2]=v.z;
      if(nr){v.fromBufferAttribute(nr,k).applyMatrix3(nm).normalize();Nn[d*3]=v.x;Nn[d*3+1]=v.y;Nn[d*3+2]=v.z;}
      if(U){U[d*2]=uv.getX(k);U[d*2+1]=uv.getY(k);}
      if(C){for(let q=0;q<cs;q++)C[d*cs+q]=col.array[k*cs+q];}}
    o+=c;if(g!==g0)g.dispose();}
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(P,3));out.setAttribute('normal',new THREE.BufferAttribute(Nn,3));
  if(U)out.setAttribute('uv',new THREE.BufferAttribute(U,2));if(C)out.setAttribute('color',new THREE.BufferAttribute(C,cs));out.computeBoundingSphere();return out;
}
function trkVesperaTemplate(){
  const key=wingsVer+'|'+TRK_DETAIL.length;if(TRK_VTPL&&TRK_VTPL.key===key)return TRK_VTPL;
  const keep=new Set([car,chassis,interiorG,swInner,TRK.driver,...wheels.map(w=>w.root),...wheels.map(w=>w.spinner),...(TRK.wipers||[])].filter(Boolean));
  for(const o of [...keep]){let p=o.parent;while(p&&p!==car){keep.add(p);p=p.parent;}}
  const skip=new Set([forceG,...axleLabels,typeof FAN!=='undefined'&&FAN.g?FAN.g.root:null].filter(Boolean)),det=new Set(TRK_DETAIL);
  const sv=[car.position.clone(),car.rotation.clone()];car.position.set(0,0,0);car.rotation.set(0,0,0);car.updateMatrixWorld(true);
  const nodes=new Map(),groups=new Map(),loose=[],inv=new Map();
  const invOf=c=>{if(!inv.has(c))inv.set(c,c.matrixWorld.clone().invert());return inv.get(c);};
  const walk=(o,cont,vis)=>{if(skip.has(o))return;const on=vis&&(o.visible||det.has(o));
    if(keep.has(o)){nodes.set(o,{parent:o===car?null:cont,local:o===car?new THREE.Matrix4():invOf(cont).clone().multiply(o.matrixWorld),visible:o.visible||det.has(o)});cont=o;}
    else if(on&&o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material)&&(!Object.prototype.hasOwnProperty.call(o.material,'onBeforeCompile')||(o.material.userData.trkLit&&!TRK_PREV.has(o.material)))&&o.geometry.attributes.position){
      const g=o.geometry,sig=(g.attributes.uv?'u':'')+(g.attributes.color?'c'+g.attributes.color.itemSize:'')+(g.attributes.normal?'n':''),k=cont.uuid+'|'+o.material.uuid+'|'+sig;
      if(!groups.has(k))groups.set(k,{cont,mat:o.material,list:[],cast:false,recv:false});const G=groups.get(k);G.list.push([g,invOf(cont).clone().multiply(o.matrixWorld)]);G.cast=G.cast||o.castShadow;G.recv=G.recv||o.receiveShadow;}
    else if(on&&(o.isMesh||o.isSprite)){loose.push({o,cont,local:invOf(cont).clone().multiply(o.matrixWorld)});}
    for(const c of o.children)walk(c,cont,on||keep.has(c));};
  walk(car,car,true);
  car.position.copy(sv[0]);car.rotation.copy(sv[1]);car.updateMatrixWorld(true);
  const merged=[];for(const G of groups.values())merged.push({cont:G.cont,mat:G.mat,geo:G.list.length===1&&!G.list[0][0].index&&false?G.list[0][0]:trkMergeGeos(G.list),cast:G.cast,recv:G.recv});
  if(TRK_VTPL)TRK_VTPL.merged.forEach(m=>m.geo.dispose());
  return TRK_VTPL={key,nodes,merged,loose};
}
function trkCloneVespera(M){
  const TP=trkVesperaTemplate(),map=new Map(),dec=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();
  const swap=new Map([[paintBody,M.paintBody],[paint,M.paint],[paintDouble,M.paintDouble],[roofPaint,M.roof],[tailMat,M.tail],[discMat,M.disc],[trkFlameMat,M.flame],[trkNum1,M.num],[trkStripe1,M.stripe]]);
  const place=(obj,m)=>{m.decompose(dec,q,sc);obj.position.copy(dec);obj.quaternion.copy(q);obj.scale.copy(sc);};
  for(const [o,nd] of TP.nodes){const g=new THREE.Group();place(g,nd.local);g.visible=nd.visible;map.set(o,g);}
  for(const [o,nd] of TP.nodes)if(nd.parent)map.get(nd.parent).add(map.get(o));
  const details=[];
  for(const m of TP.merged){const me=new THREE.Mesh(m.geo,swap.get(m.mat)||m.mat);me.castShadow=m.cast;me.receiveShadow=m.recv;map.get(m.cont).add(me);if(m.geo.boundingSphere.radius<0.32)details.push(me);}
  const flames=[];
  for(const L of TP.loose){const c=L.o.clone(false);if(c.material)c.material=swap.get(c.material)||c.material;place(c,L.local);c.visible=true;map.get(L.cont).add(c);if((TRK.flames||[]).includes(L.o))flames.push(c);else if(c.isSprite)details.push(c);}
  const root=map.get(car);root.position.set(0,0,0);root.rotation.set(0,0,0);root.scale.set(1,1,1);
  /* rotazioni di partenza: lo sterzo e il rotolamento le sovrascrivono come sull'auto originale */
  wheels.forEach(w=>{map.get(w.root).rotation.copy(w.root.rotation);map.get(w.spinner).rotation.copy(w.spinner.rotation);});
  if(swInner)map.get(swInner).rotation.copy(swInner.rotation);(TRK.wipers||[]).forEach(p=>map.get(p).quaternion.copy(p.quaternion));
  return {kind:'vespera',root,chassis:map.get(chassis),interior:map.get(interiorG),wheels:wheels.map(w=>({root:map.get(w.root),spinner:map.get(w.spinner),s:w.s,isFront:w.isFront,baseRot:w.baseRot})),
    sw:swInner?map.get(swInner):null,driver:TRK.driver?map.get(TRK.driver):null,flames,details,wipers:(TRK.wipers||[]).map(p=>map.get(p))};
}
function trkBuildLabVisual(params,M){
  const saveP=LABP;LABP=JSON.parse(JSON.stringify(params));labBuild();const S2=LAB;
  const g=new THREE.Group();while(labG.children.length)g.add(labG.children[0]);
  LABP=saveP;labBuild();
  const sw=m=>m===labPaint?M.lab:m===tailMat?M.tail:m===discMat?M.disc:m===paint?M.paint:m;
  g.traverse(o=>{if(o.material)o.material=Array.isArray(o.material)?o.material.map(sw):sw(o.material);});
  const body=g.children.find(o=>o.material===M.lab);
  if(body)trkLabDecals(g,body,S2,M.num);
  return {kind:'lab',root:g,S:S2,wheels:g.children.filter(o=>o.isGroup)};
}
/* aloni di fari e fanali: di notte e con la pioggia fanno brillare le luci (e si specchiano sul bagnato) */
function trkHalos(P,S){
  if(P.halo&&P.halo.parent)P.halo.parent.remove(P.halo);
  const M=P.M,g=new THREE.Group();let f,r;
  if(S){const W=S.P.W/2-0.32;f=[S.xf+0.04,S.P.noseH*0.82,W,0.62];r=[S.xb-0.04,Math.max(0.5,S.P.tailH*0.85),W,0.6];}
  else{f=[2.12,0.6,0.5,0.62];r=[-2.3,0.76,0.56,0.6];}
  for(const [pp,mat] of [[f,M.haloF],[r,M.haloR]])for(const z of [pp[2],-pp[2]]){const sp=new THREE.Sprite(mat);sp.position.set(pp[0],pp[1],z);sp.scale.set(pp[3],pp[3]*0.7,1);g.add(sp);}
  P.rig.add(g);P.halo=g;
}
/* squadra ai box: quattro meccanici attorno alle ruote durante il cambio gomme */
function trkCrew(P){
  if(P.crew)return P.crew;const g=new THREE.Group(),suit=new THREE.MeshStandardMaterial({color:P.color,roughness:0.8}),helm=new THREE.MeshStandardMaterial({color:0xf2f2ee,roughness:0.4}),gun=new THREE.MeshStandardMaterial({color:0x222428,metalness:0.6,roughness:0.4});
  for(const [x,z] of [[1.4,1.25],[1.4,-1.25],[-1.4,1.25],[-1.4,-1.25],[2.9,0]]){const m=new THREE.Group();
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.24,0.9,10),suit);body.position.y=0.62;m.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.15,14,10),helm);head.position.y=1.2;m.add(head);
    if(x!==2.9){const t=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,0.42),gun);t.position.set(0,0.5,-Math.sign(z)*0.3);m.add(t);}
    else{const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1.4,6),gun);pole.position.set(-0.3,1.0,0);pole.rotation.z=0.5;m.add(pole);
      const disc=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.03,16),new THREE.MeshStandardMaterial({color:0xc4261d}));disc.rotation.z=Math.PI/2;disc.position.set(-0.62,1.6,0);m.add(disc);}
    m.position.set(x,0,z*1.0);g.add(m);}
  g.visible=false;trkWorld.add(g);P.crew=g;return g;
}
function trkCarVisual(P,key){
  const vk=key+'|'+P.num+'|'+(key==='lab'?labVer:'')+(key==='vespera'?wingsVer:'');
  if(P.vis&&P.visKey===vk)return;
  if(P.vis){P.rig.remove(P.vis.root);if(P.vis.kind==='lab')P.vis.root.traverse(c=>{if(c.geometry)c.geometry.dispose();});}
  P.vis=key==='vespera'?trkCloneVespera(P.M):trkBuildLabVisual(key==='lab'?LABP:LAB_PRESETS[key].p,P.M);
  P.rig.add(P.vis.root);P.visKey=vk;trkHalos(P,P.vis.kind==='lab'?P.vis.S:null);
  P.rig.traverse(o=>o.layers.enable(2));
  /* i dettagli piccoli e l'abitacolo non fanno ombra e non si specchiano: costano disegni e non si vedono */
  const lite=o=>{o.layers.disable(2);if(o.isMesh)o.castShadow=false;};(P.vis.details||[]).forEach(lite);if(P.vis.interior)P.vis.interior.traverse(lite);
}
function trkP1Restore(){const P1=TRK.p[0];car.visible=!state.lab;if(P1.vis){rig.remove(P1.vis.root);P1.vis=null;P1.visKey='';}}
function trkCarName(key){return !key?'Auto':key==='vespera'?'Vespera GT':key==='lab'?trkLabName():LAB_PRESETS[key].name;}
/* compone lo schieramento: tu, l'eventuale secondo giocatore e le auto del computer */
function trkSetupField(){
  const a0=TRK.split?2:1,nAI=TRK.ai?TRK.oppAI:TRK.split?TRK.oppDuo:0,cars=[TRK.p[0]];
  if(TRK.charSeed==null)TRK.charSeed=Math.floor(Math.random()*TRK_CHARS.length);
  if(TRK.split)cars.push(TRK.p[1]);for(let j=0;j<nAI;j++)cars.push(TRK.p[a0+j]);
  TRK.cars=cars;
  const P1=TRK.p[0];P1.rig=rig;P1.isAI=false;P1.num='1';P1.tire=TRK.tire;P1.pace=1;P1.color=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#a3121a';
  P1.label=TRK.split?'Giocatore 1':'Tu';
  if(!P1.M)P1.M={haloF:new THREE.SpriteMaterial({map:glowTex,color:0xfff3df,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0}),haloR:new THREE.SpriteMaterial({map:glowTex,color:0xff2a18,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0})};
  /* la tua Vespera, vista da fuori, usa la copia alleggerita; l'originale (con il cruscotto animato) torna in vista abitacolo */
  if(!state.lab)trkCarVisual(P1,'vespera');else trkP1Restore();
  trkHalos(P1,state.lab&&LAB?LAB:null);rig.traverse(o=>o.layers.enable(2));
  const used=new Set([P1.color.toLowerCase()]);let ci=0;
  const nextCol=()=>{while(used.has(TRK_FIELD_COLORS[ci%TRK_FIELD_COLORS.length]))ci++;const c=TRK_FIELD_COLORS[ci%TRK_FIELD_COLORS.length];ci++;used.add(c);return c;};
  for(const P of cars){if(P.id===0)continue;
    P.isAI=P.id>=a0;const j=P.id-a0;
    if(!P.rig){P.rig=P.id===1?rig2:new THREE.Group();if(P.id>1)scene.add(P.rig);}
    P.num=String(P.id+1);
    const c0=PAINTS[TRK.p2paint].c;P.color=(P.id===1)?c0:nextCol();used.add(c0.toLowerCase());
    P.M=trkCarMats(P.M||{},P.color,P.num,TRK_RING[P.id]);
    const k=trkP2Key(),key=k==='mix'?(P.isAI?TRK_MIX[j%TRK_MIX.length]:'supercar'):k;P.key=key;
    trkCarVisual(P,key);if(P.id===1)trkSpotPlace(trkSpot2,P.vis.kind==='lab'?P.vis.S:null);
    P.veh=trkVehicleFor(key);
    P.tire=P.isAI?(TRK.wet>0.45?3:(TRK.tire===3?1:TRK.tire)):TRK.tire;P.veh.mu=TRK_TIRES[P.tire].mu;
    P.simG=trkWxGrip(P.tire,TRK.wet);P.sim=lapSim(P.veh,TRK.RL,P.simG);P.cornerV=trkCornerSpeeds(P.sim);
    P.ch=P.isAI?(TRK.aiChar?TRK_CHARS[(j+TRK.charSeed)%TRK_CHARS.length]:TRK_CHAR_PLAIN):null;
    P.pace=P.isAI?TRK.aiPace-0.009*j+(P.ch&&P.ch.pace||0):1;Object.assign(P,{errT:0,errCool:8+Math.random()*20,errs:0,defT:0,defCool:0});
    P.label=P.isAI?`#${P.num} ${trkCarName(key)}`:'Giocatore 2';
  }
  TRK.p.forEach(P=>{if(P.rig&&P.id>0)P.rig.visible=cars.includes(P);if(P.crew)P.crew.visible=false;});
}

/* =========================================================
   Fantasma del giro migliore: sagoma trasparente che ripete il tuo giro più veloce
   ========================================================= */
const ghostMat=new THREE.MeshBasicMaterial({color:0x8fd3ff,transparent:true,opacity:0.3,depthWrite:false,fog:false});
let ghostG=null,ghostKind='';
function trkGhostBuild(){
  const kind=state.lab?'lab'+labVer:'vespera';if(ghostG&&ghostKind===kind)return;
  if(ghostG)trkWorld.remove(ghostG);ghostG=new THREE.Group();ghostKind=kind;
  if(state.lab&&labBodyMesh){ghostG.add(new THREE.Mesh(labBodyMesh.geometry,ghostMat));}
  else{ghostG.add(new THREE.Mesh(bodyMesh.geometry,ghostMat));for(const m of [cabinMesh,roofMesh]){const o=new THREE.Mesh(m.geometry,ghostMat);ghostG.add(o);}
    for(const [x,z] of [[WX,WZ],[WX,-WZ],[-WX,WZ],[-WX,-WZ]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(WR,WR,0.24,20),ghostMat);w.rotation.x=Math.PI/2;w.position.set(x,WR,z);ghostG.add(w);}}
  ghostG.visible=false;ghostG.rotation.order='YZX';trkWorld.add(ghostG);
}
function trkGhostShow(){
  const P=TRK.p[0],L=P.lap,G=TRK.ghost;
  if(!ghostG)return;
  const show=TRK.ghostOn&&!TRK.duo&&G&&G.track===TRK.trackId&&(G.foreign||G.key===trkCfgKey(P))&&L.run&&!TRK.replay.on&&TRK.mode==='drive';
  ghostG.visible=!!show;if(!show)return;ghostMat.color.setHex(G.foreign?0xffb36b:0x8fd3ff);
  const tt=TRK.clock-L.t0,pts=G.pts;if(tt>pts[pts.length-1][0]){ghostG.visible=false;return;}
  let lo=0,hi=pts.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(pts[m][0]<=tt)lo=m;else hi=m;}
  const a=pts[lo],b=pts[hi],f=b[0]>a[0]?clamp((tt-a[0])/(b[0]-a[0]),0,1):0;
  let dp=b[3]-a[3];while(dp>Math.PI)dp-=2*Math.PI;while(dp<-Math.PI)dp+=2*Math.PI;
  ghostG.position.set(a[1]+(b[1]-a[1])*f,a[4]+(b[4]-a[4])*f,-(a[2]+(b[2]-a[2])*f));ghostG.rotation.set(0,a[3]+dp*f,a[5]+(b[5]-a[5])*f);
}

/* =========================================================
   Effetti: segni di gomma, fumo, polvere, spruzzi e pioggia
   ========================================================= */
const SKID_MAX=4000,skidPos=new Float32Array(SKID_MAX*12),skidGeo=new THREE.BufferGeometry();
skidGeo.setAttribute('position',new THREE.BufferAttribute(skidPos,3).setUsage(THREE.DynamicDrawUsage));
{const idx=new Uint32Array(SKID_MAX*6);for(let q=0;q<SKID_MAX;q++){const b=q*4;idx.set([b,b+1,b+2,b+1,b+3,b+2],q*6);}skidGeo.setIndex(new THREE.BufferAttribute(idx,1));}
skidGeo.setDrawRange(0,0);
const skidMesh=new THREE.Mesh(skidGeo,new THREE.MeshBasicMaterial(Object.assign({color:0x0b0b0c,transparent:true,opacity:0.42,depthWrite:false,side:THREE.DoubleSide},trkOff)));
skidMesh.frustumCulled=false;trkWorld.add(skidMesh);
let skidN=0,skidHead=0;
function trkSkid(P,w,x,y,z,hx,hz,on){
  const last=P.skid[w];if(!on){P.skid[w]=null;return;}
  if(last&&(x-last[0])**2+(z-last[1])**2<0.36)return;
  if(last){skidPos.set([last[0]+last[2],last[4],last[1]+last[3],last[0]-last[2],last[4],last[1]-last[3],x+hx,y,z+hz,x-hx,y,z-hz],skidHead*12);
    skidHead=(skidHead+1)%SKID_MAX;skidN=Math.min(SKID_MAX,skidN+1);skidGeo.setDrawRange(0,skidN*6);skidGeo.attributes.position.needsUpdate=true;}
  P.skid[w]=[x,z,hx,hz,y];
}
const SMK_N=1600,smkPos=new Float32Array(SMK_N*3),smkVel=new Float32Array(SMK_N*3),smkA=new Float32Array(SMK_N),smkA0=new Float32Array(SMK_N),smkS=new Float32Array(SMK_N),smkAge=new Float32Array(SMK_N),smkLife=new Float32Array(SMK_N),smkC=new Float32Array(SMK_N*3);
const smkGeo=new THREE.BufferGeometry();
smkGeo.setAttribute('position',new THREE.BufferAttribute(smkPos,3).setUsage(THREE.DynamicDrawUsage));smkGeo.setAttribute('alpha',new THREE.BufferAttribute(smkA,1).setUsage(THREE.DynamicDrawUsage));
smkGeo.setAttribute('size',new THREE.BufferAttribute(smkS,1).setUsage(THREE.DynamicDrawUsage));smkGeo.setAttribute('color',new THREE.BufferAttribute(smkC,3).setUsage(THREE.DynamicDrawUsage));
const smkMat=new THREE.ShaderMaterial({uniforms:{uScale:{value:600},uLight:{value:1}},transparent:true,depthWrite:false,
  vertexShader:'attribute float alpha;attribute float size;attribute vec3 color;varying float vA;varying vec3 vC;uniform float uScale;void main(){vA=alpha;vC=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*uScale/max(-mv.z,0.1);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying float vA;varying vec3 vC;uniform float uLight;void main(){vec2 d=gl_PointCoord-0.5;float r=dot(d,d)*4.0;if(r>1.0)discard;float f=1.0-r;gl_FragColor=vec4(vC*uLight,vA*f*f);}'});
const smkPts=new THREE.Points(smkGeo,smkMat);smkPts.frustumCulled=false;trkWorld.add(smkPts);
let smkHead=0;
function trkPuff(x,y,z,vx,vz,col,a0,size,life,vy){
  const k=smkHead;smkHead=(smkHead+1)%SMK_N;
  smkPos[k*3]=x;smkPos[k*3+1]=y;smkPos[k*3+2]=z;smkVel[k*3]=vx+(Math.random()-0.5)*1.2;smkVel[k*3+1]=(vy===undefined?0.4:vy)+Math.random()*0.6;smkVel[k*3+2]=vz+(Math.random()-0.5)*1.2;
  smkC.set(col,k*3);smkA0[k]=a0;smkA[k]=a0;smkS[k]=size;smkAge[k]=0;smkLife[k]=life;
}
function trkSmokeStep(dt){
  for(let k=0;k<SMK_N;k++){if(smkA0[k]<=0)continue;smkAge[k]+=dt;const t=smkAge[k]/smkLife[k];if(t>=1){smkA0[k]=0;smkA[k]=0;continue;}
    const dmp=Math.max(0,1-dt*1.6);smkVel[k*3]*=dmp;smkVel[k*3+2]*=dmp;smkVel[k*3+1]=smkVel[k*3+1]*dmp+0.25*dt;
    smkPos[k*3]+=smkVel[k*3]*dt;smkPos[k*3+1]+=smkVel[k*3+1]*dt;smkPos[k*3+2]+=smkVel[k*3+2]*dt;
    smkA[k]=smkA0[k]*(1-t)*Math.min(1,smkAge[k]*8);smkS[k]+=dt*1.6;}
  for(const n of ['position','alpha','size','color'])smkGeo.attributes[n].needsUpdate=true;
}
/* ruote: fumo se slittano sull'asfalto, polvere su erba e ghiaia, spruzzi d'acqua sul bagnato */
function trkWheelFx(P,dt){
  const c=P.car,V=P.veh,b=V.lwb*V.wf,a=V.lwb-b,cp=Math.cos(c.psi),sp=Math.sin(c.psi),sp2=Math.hypot(c.vx,c.vy),T=TRK.T,hy=P.zc;
  const slide=P.spin||P.lock||Math.abs(P.ar)>0.15||(Math.abs(P.af)>0.22&&sp2>8);
  const asph=P.surf==='asfalto'||P.surf==='cordolo',dirt=!asph&&sp2>4,wl=trkWetAt(c.i,c.d);
  for(let w=0;w<2;w++){const s=w?-1:1,X=c.X-cp*b-sp*s*V.track/2,Y=c.Y-sp*b+cp*s*V.track/2,x=X,z=-Y;
    trkSkid(P,w,x,hy+0.01,z,-sp*0.13,-cp*0.13,slide&&asph&&sp2>2&&!P.air&&wl<0.3);
    if(slide&&asph&&sp2>2&&!P.air&&wl<0.08&&Math.random()<dt*40)trkPuff(x,hy+0.25,z,c.vx*cp*0.15,-c.vx*sp*0.15,[0.86,0.86,0.86],0.33,0.9,2.4);
    if(dirt&&!P.air&&Math.random()<dt*30)trkPuff(x,hy+0.2,z,0,0,P.surf==='ghiaia'?[0.78,0.7,0.55]:[0.5,0.44,0.3],0.32,0.7,1.5);
    if(wl>0.12&&asph&&sp2>8&&!P.air){const k=Math.min(1,sp2/45)*Math.min(1,wl*1.3);
      if(Math.random()<dt*(20+40*wl)*k)trkPuff(x,hy+0.3,z,c.vx*cp*0.3,-c.vx*sp*0.3,[0.8,0.83,0.86],(0.06+0.15*wl)*k,1.1,0.9,1.2);
      const XF=c.X+cp*a-sp*s*V.track/2,YF=c.Y+sp*a+cp*s*V.track/2;
      if(Math.random()<dt*(8+18*wl)*k)trkPuff(XF,hy+0.25,-YF,c.vx*cp*0.3,-c.vx*sp*0.3,[0.8,0.83,0.86],(0.05+0.1*wl)*k,0.8,0.6,0.8);}}
}
/* pioggia: gocce allungate in una scatola attorno alla telecamera, animate nella scheda video */
const RAIN_N=3500;
const rainGeo=new THREE.BufferGeometry();
{const pos=new Float32Array(RAIN_N*6),e=new Float32Array(RAIN_N*2);
 for(let k=0;k<RAIN_N;k++){const x=(Math.random()-0.5)*70,y=Math.random()*30,z=(Math.random()-0.5)*70;pos.set([x,y,z,x,y,z],k*6);e[k*2]=0;e[k*2+1]=1;}
 rainGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));rainGeo.setAttribute('e',new THREE.BufferAttribute(e,1));}
const rainMat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uLight:{value:1},uAmt:{value:1}},transparent:true,depthWrite:false,
  vertexShader:'attribute float e;varying float vE;uniform float uTime;void main(){vE=e;vec3 p=position;p.y=mod(p.y-uTime*24.0,30.0)-8.0;p.x+=p.y*0.06;p.y-=e*0.9;p.x+=e*0.05;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',
  fragmentShader:'varying float vE;uniform float uLight;uniform float uAmt;void main(){gl_FragColor=vec4(vec3(0.78,0.82,0.88)*uLight,0.38*uAmt*(1.0-vE*0.7));}'});
const rainMesh=new THREE.LineSegments(rainGeo,rainMat);rainMesh.frustumCulled=false;rainMesh.visible=false;trkWorld.add(rainMesh);

/* =========================================================
   Seconda voce del motore (secondo concorrente, spostata a destra nello stereo)
   ========================================================= */
let trkVoice2=null,trkVoice3=null;
function trkMakeVoice(pan){
  try{const ac=audio.ctx;if(!ac)return null;
    const master=ac.createGain();master.gain.value=0;const pn=ac.createStereoPanner?ac.createStereoPanner():null;if(pn){pn.pan.value=pan;master.connect(pn);pn.connect(ac.destination);}else master.connect(ac.destination);
    const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=500;lp.Q.value=0.9;
    const sh=ac.createWaveShaper();const cv=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/511.5-1;cv[i]=Math.tanh(2.4*x);}sh.curve=cv;sh.connect(lp);lp.connect(master);
    const osc=(type,g)=>{const o=ac.createOscillator();o.type=type;const gg=ac.createGain();gg.gain.value=g;o.connect(gg);gg.connect(sh);o.start();return o;};
    return {master,lp,pn,o1:osc('sawtooth',0.3),o2:osc('sawtooth',0.38),o3:osc('square',0.05)};}catch(e){return null;}
}
function trkVoiceUpdate(v,rpm,load,on,gain){
  if(!v)return;const now=audio.ctx.currentTime,f=Math.max(rpm,30)/60*4;
  v.o1.frequency.setTargetAtTime(f*1.03,now,0.03);v.o2.frequency.setTargetAtTime(f/2*1.03,now,0.03);v.o3.frequency.setTargetAtTime(f*1.5,now,0.03);
  v.lp.frequency.setTargetAtTime(300+rpm*0.3+load*800,now,0.06);v.master.gain.setTargetAtTime(on&&rpm>100?(0.08+load*0.05)*(gain===undefined?1:gain):0,now,on?0.06:0.25);
}

/* =========================================================
   Ora del giorno e meteo: cielo, nebbia, sole o luna, riflessi, torri faro, fari, asfalto bagnato
   ========================================================= */
const TRK_ENV={},TRK_SKYT={};
function trkMakeEnv(top,hor,gnd,lights){
  const es=new THREE.Scene(),sg=new THREE.SphereGeometry(50,32,16),col=[],p=sg.attributes.position;
  for(let i=0;i<p.count;i++){const y=p.getY(i)/50;const c=y>0?new THREE.Color(hor).lerp(new THREE.Color(top),Math.min(1,y*1.6)):new THREE.Color(gnd).lerp(new THREE.Color(gnd).multiplyScalar(0.55),Math.min(1,-y*2));col.push(c.r,c.g,c.b);}
  sg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));es.add(new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  for(const [x,y,z,c,k,r] of lights){const m=new THREE.Mesh(new THREE.SphereGeometry(r||4,16,8),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k)}));m.position.set(x,y,z);es.add(m);}
  return pmrem.fromScene(es,0.02).texture;
}
function trkEnvFor(kind){
  if(TRK_ENV[kind])return TRK_ENV[kind];
  const L={day:[0x3f74c2,0x9cc3ee,0x56603a,[[-22,34,18,0xfff2d8,5]]],sunset:[0x2c3e74,0xff9a5a,0x3a2f25,[[-44,7,12,0xffa060,6,5]]],
    night:[0x05070f,0x1b2540,0x0d0f0b,[[30,10,20,0xfff4e0,4,2],[-30,9,-25,0xfff4e0,4,2],[10,8,-40,0xfff4e0,3,2],[-40,10,30,0xfff4e0,3,2]]],
    overcast:[0x8a939c,0xb9c0c6,0x4a4f44,[]],nightrain:[0x0b0f16,0x1c232c,0x0b0d0b,[[30,10,20,0xfff4e0,3,2],[-30,9,-25,0xfff4e0,3,2]]]}[kind];
  return TRK_ENV[kind]=trkMakeEnv(L[0],L[1],L[2],L[3]);
}
function trkSkyFor(kind){
  if(TRK_SKYT[kind])return TRK_SKYT[kind];
  const S={day:['#4f86d0','#8fb8e6','#d9e6ee'],sunset:['#27346e','#c4677a','#ffb46a'],night:['#02040a','#0b1226','#1a2440'],overcast:['#78818b','#a3abb2','#c1c7cc'],rain:['#5d666f','#87909a','#a2aab1'],nightrain:['#06080c','#10161e','#1b222b']}[kind];
  return TRK_SKYT[kind]=canvasTex(4,(g,s,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,S[0]);gr.addColorStop(0.42,S[1]);gr.addColorStop(0.5,S[2]);gr.addColorStop(1,S[2]);g.fillStyle=gr;g.fillRect(0,0,s,h);},null,512);
}
const TRK_SUN={day:[-24,40,-18],sunset:[-70,12,10],night:[30,48,22]};
const _c1=new THREE.Color(),_c2=new THREE.Color();
/* atmosfera: ora del giorno più pioggia (rain) e acqua sulla pista (wet), anche mentre cambiano durante la gara */
function trkAtmo(){
  if(!TRK.built)return;
  const tod=TRK.tod,r=TRK.rain,w=TRK.wet,night=tod==='night',sunset=tod==='sunset',rainy=r>0.35,wetish=w>0.25||r>0.08;
  const skyK=night?(rainy?'nightrain':'night'):rainy?'rain':wetish?'overcast':tod;
  const bg=SKY.mesh?null:trkSkyFor(skyK);if(scene.background!==bg)scene.background=bg;
  const F={day:[0xd9e6ee,260,2800],sunset:[0xe6a47e,220,2600],night:[0x0b111d,140,1600]}[tod],FO=[0xb7bec4,170,1900],FR=night?[0x0b1017,60,650]:[0x9aa3aa,70,800];
  const ko=night?0:Math.min(1,w*1.6+r);
  _c1.setHex(F[0]).lerp(_c2.setHex(FO[0]),ko).lerp(_c2.setHex(FR[0]),r);
  scene.fog.color.copy(_c1);
  const lerp=(a,b,k)=>a+(b-a)*k;
  scene.fog.near=lerp(lerp(F[1],FO[1],ko),FR[1],r);scene.fog.far=lerp(lerp(F[2],FO[2],ko),FR[2],r);
  const env=trkEnvFor(night?(rainy?'nightrain':'night'):wetish?'overcast':tod);if(scene.environment!==env)scene.environment=env;
  TRK.sunOff=TRK_SUN[tod];
  key.color.setHex(night?0x9fb4ff:sunset?0xffb27a:0xffffff);
  key.intensity=(night?0.22:sunset?1.5:1.9)*(1-0.65*r)*(1-0.3*Math.min(1,w*1.5)*(1-r));
  trkHemi.color.setHex(night?0x2a3550:sunset?0xffc9a0:0xcfe3ff);trkHemi.groundColor.setHex(night?0x0a0c08:sunset?0x4a3a2a:0x5a6a3a);
  trkHemi.intensity=(night?0.28:sunset?0.45:0.55)+0.15*Math.min(1,w+r);
  renderer.toneMappingExposure=night?1.05:sunset?0.9:lerp(0.86,0.95,r);
  const cloudC=night?0x2a3040:sunset?0xffb08a:wetish?0x9aa2aa:0xffffff;(TRK.clouds||[]).forEach(c=>{c.material.color.setHex(cloudC);c.material.opacity=night?0.45:wetish?1:0.85;});
  if(TRK.mnt)TRK.mnt.material.color.setHex(night?0x283044:sunset?0xffc29a:wetish?0xb8c0c8:0xffffff);
  if(TRK.stars)TRK.stars.visible=night&&!rainy;if(TRK.moon)TRK.moon.visible=night&&!rainy;
  TRK_NIGHT.value=night?1:0;if(TRK.floodMat)TRK.floodMat.emissiveIntensity=night?2.6:0;if(TRK.floodHalo)TRK.floodHalo.visible=night;
  smkMat.uniforms.uLight.value=night?0.35:sunset?0.85:1;rainMat.uniforms.uLight.value=night?0.5:1;rainMat.uniforms.uAmt.value=Math.min(1,r*1.2);
  /* fari accesi di notte, al tramonto e con la pioggia */
  const lamp=night?3.4:(r>0.3||sunset)?1.3:0;trkSpot1.intensity=lamp;trkSpot2.intensity=lamp;TRK.lamp=lamp;
  if(state.lights!==lamp>0){state.lights=lamp>0;setPressed('tLights',state.lights);}
  /* asfalto bagnato: più scuro e liscio, con pozzanghere che riflettono; la traiettoria asciutta resta chiara */
  const A=TRK.asphalt;A.color.copy(TRK.asphaltColor).multiplyScalar(1-0.38*w);A.roughness=lerp(0.92,0.55,w);if(A.normalScale)A.normalScale.setScalar(0.5*(1-0.65*w));A.envMapIntensity=lerp(0.4,1.15,w);
  const pm=w>0.06?TRK.puddleTex:null;if(A.roughnessMap!==pm){A.roughnessMap=pm;A.needsUpdate=true;}
  for(const m of [TRK.white,TRK.kerbMat]){m.roughness=lerp(0.6,0.25,w);m.envMapIntensity=lerp(0.4,1.2,w);}
  if(TRK.dryMat){const o=Math.min(1,w*2.5)*TRK.dryLine;TRK.dryMat.opacity=o*0.95;TRK.dryRib.visible=o>0.02;}
  rainMesh.visible=r>0.03;
  if(PP.on)ppInverseColor(scene.fog.color);
  trkSkyUpdate(tod,ko,r);if(CS_MAT)CS_MAT.opacity=night?0.5:0.62*(1-0.35*Math.max(ko,r));
}
