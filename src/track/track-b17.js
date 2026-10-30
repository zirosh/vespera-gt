/* =========================================================
   Circuito cittadino (Porto Vespera): muri di cemento con la rete di protezione al posto dei guard rail, palazzi lungo le
   strade (facciate con finestre che di notte si accendono), palazzi più alti in lontananza, il mare oltre il lungomare,
   lampioni. Tutto istanziato: pochi draw call anche con centinaia di edifici
   ========================================================= */
/* facciata: intonaco con file di finestre (un piano ogni 3 m), e la stessa griglia per le finestre accese di notte */
function trkFacadeTex(){
  if(TXL.fac)return TXL.fac;const S=512,R=trkRng(71),fin=trkFbm(S,S,64,3,73,0.5),col=new Float32Array(S*S*3),lit=new Float32Array(S*S*3);
  /* 12 m per ripetizione: 4 piani e 5 finestre per piano */
  const fy=S/4,fx=S/5,on=[];for(let k=0;k<20;k++)on.push(R()<0.45?0.6+0.4*R():0);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const k=y*S+x,u=x%fx/fx,v=y%fy/fy,win=u>0.22&&u<0.78&&v>0.28&&v<0.78,sill=u>0.18&&u<0.82&&v>0.78&&v<0.83;
    let c=0.86+0.08*(fin[k]-0.5);if(win)c=0.16+0.06*v;else if(sill)c=0.95;else if(v<0.06)c*=0.9;
    col[k*3]=c;col[k*3+1]=c;col[k*3+2]=c*(win?1.25:1);
    const L=win?on[Math.floor(x/fx)+5*Math.floor(y/fy)]:0;lit[k*3]=L;lit[k*3+1]=L*0.78;lit[k*3+2]=L*0.45;}
  return TXL.fac={map:trkColTex(S,S,col),lit:trkColTex(S,S,lit)};
}
/* rete metallica a maglie (trasparente) sopra i muri */
function trkMeshFenceTex(){
  if(TXL.mfen)return TXL.mfen;const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');
  g.strokeStyle='rgba(205,210,214,0.95)';g.lineWidth=1.4;for(let k=-128;k<256;k+=12){g.beginPath();g.moveTo(k,0);g.lineTo(k+128,128);g.stroke();g.beginPath();g.moveTo(k,128);g.lineTo(k+128,0);g.stroke();}
  g.fillStyle='rgba(120,124,128,1)';g.fillRect(0,0,128,3);
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return TXL.mfen=t;
}
const TRK_FACADE=[0xf1e3c4,0xe8c690,0xd9a273,0xefd9b0,0xe3b98f,0xd8d2c4,0xf3eadb,0xcf8f6a,0xe9d7a8,0xbfc4c6];
function trkCityBuild(){
  const T=TRK.T,N=T.N,hw=T.w/2,D=TRKDEF,tw=TRK.tw;
  /* muri: cemento alto un metro all'esterno della carreggiata, con la rete sopra (lungo il rettilineo dei box il muretto c'è già) */
  const wall=trkNightPatch(trkWorldMap(new THREE.MeshStandardMaterial({color:0xc8cacc,map:trkConcreteTex().map,roughness:0.9,side:THREE.DoubleSide,envMapIntensity:0.3}),3,0.1));
  const fen=new THREE.MeshStandardMaterial({map:trkMeshFenceTex(),transparent:true,alphaTest:0.35,side:THREE.DoubleSide,metalness:0.5,roughness:0.5});fen.map.repeat.set(1,1);
  {const Pd=TRK.pit;
   trkRibbon(Pd.qB+32-N,Pd.qIn+28,i=>TRK.bar[0][i],0,0,4,wall,1.05);trkRibbon(0,N,i=>-TRK.bar[1][i],0,0,4,wall,1.05);
   trkRibbon(Pd.qB+32-N,Pd.qIn+28,i=>TRK.bar[0][i]+0.05,0,1.05,3,fen,3.6);trkRibbon(0,N,i=>-TRK.bar[1][i]-0.05,0,1.05,3,fen,3.6);}
  /* palazzi: lungo le strade, oltre il marciapiede, senza invadere la pista, il mare o i palazzi già messi */
  const blds=[],near=(X,Y,r)=>{for(const b of blds)if(Math.hypot(b.X-X,b.Y-Y)<b.r+r)return true;return false;};
  const sea=(X,Y)=>Y>(D.sea||1e9);
  const clear=(X,Y,r)=>{if(sea(X,Y))return false;const d=trkDistTrack(X,Y,3);if(d<hw+r+7)return false;
    const n=trkNearest(X,Y);if(n.i>=0){const s=((X-T.X[n.i])*T.nx[n.i]+(Y-T.Y[n.i])*T.ny[n.i])>0?0:1;if(d<TRK.bar[s][n.i]+r*0.75+5)return false;}
    if(TRK.pitZone&&n.i>=0&&TRK.pitZone[n.i]&&d<70)return false;return !near(X,Y,r);};
  const R=trkRng(91);
  for(const sg of [1,-1])for(let i=0;i<N;){const s=sg>0?0:1,W=14+R()*16,Dp=12+R()*12,r=Math.hypot(W,Dp)/2*0.8,off=TRK.bar[s][i]+6+Dp/2,
      X=T.X[i]+T.nx[i]*sg*off,Y=T.Y[i]+T.ny[i]*sg*off;
    if(clear(X,Y,r))blds.push({X,Y,W,D:Dp,H:11+R()*R()*28,a:Math.atan2(T.ty[i],T.tx[i]),r});
    i+=Math.max(2,Math.round((W+1.5)/T.ds));}
  /* seconda fila e quartieri: più alti man mano che ci si allontana */
  for(let k=0,tries=0;k<520&&tries<9000;tries++){const X=-1000+R()*2300,Y=-500+R()*1700,W=16+R()*22,Dp=16+R()*22,r=Math.hypot(W,Dp)/2*0.8;
    if(!clear(X,Y,r))continue;const d=trkDistTrack(X,Y,6);blds.push({X,Y,W,D:Dp,H:14+R()*(18+Math.min(60,d*0.08)),a:R()<0.7?Math.round(R()*2)*Math.PI/2:R()*Math.PI,r});k++;}
  const F=trkFacadeTex();
  const facade=trkNightPatch(trkWorldMap(new THREE.MeshStandardMaterial({color:0xffffff,map:F.map,emissiveMap:F.lit,emissive:0xffc77a,emissiveIntensity:0,roughness:0.85,envMapIntensity:0.35}),12,0.08));
  const roof=new THREE.MeshLambertMaterial({color:0x8a8178});
  const g=new THREE.BoxGeometry(1,1,1);g.translate(0,0.5,0);
  const M=new THREE.InstancedMesh(g,[facade,facade,roof,roof,facade,facade],blds.length),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),ps=new THREE.Vector3(),sc=new THREE.Vector3(),c=new THREE.Color(),up=new THREE.Vector3(0,1,0);
  blds.forEach((b,k)=>{ps.set(b.X,trkGroundH(b.X,b.Y)-0.3,-b.Y);q.setFromAxisAngle(up,b.a);sc.set(b.W,b.H,b.D);m4.compose(ps,q,sc);M.setMatrixAt(k,m4);M.setColorAt(k,c.setHex(TRK_FACADE[k%TRK_FACADE.length]));});
  M.instanceColor.needsUpdate=true;M.castShadow=M.receiveShadow=true;M.frustumCulled=false;tw.add(M);TRK.cityFacade=facade;
  /* il mare oltre il lungomare */
  if(D.sea){const y0=D.sea,sh=new THREE.Shape([new THREE.Vector2(-2400,y0),new THREE.Vector2(2400,y0),new THREE.Vector2(2400,3200),new THREE.Vector2(-2400,3200)]);
   const w=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshStandardMaterial({color:0x1d4f6b,roughness:0.12,metalness:0.1,envMapIntensity:1.2}));
   w.rotation.x=-Math.PI/2;w.position.y=0.25;w.receiveShadow=true;tw.add(w);}
  /* galleria sul lungomare: soffitto di cemento a 6,5 m che fa ombra, tubi di luce lungo il soffitto; il buio dentro viene dall'ombra */
  if(D.tunnel){const [x0,x1,y0]=D.tunnel;let i0=-1,i1=-1;for(let i=0;i<N;i++){const in_=T.X[i]>x0&&T.X[i]<x1&&T.Y[i]>y0;if(in_&&i0<0)i0=i;if(in_)i1=i;}
    if(i0>0&&i1>i0){/* soffitto e pareti scuri e senza luce propria: dentro la galleria si passa nella penombra, con i tubi di luce sopra */
      const roofM=trkWorldMap(new THREE.MeshBasicMaterial({color:0x34373a,map:trkConcreteTex().map,side:THREE.DoubleSide}),3,0.1);
      const r=trkRibbon(i0,i1,i=>TRK.bar[0][i]+0.8,i=>-TRK.bar[1][i]-0.8,6.5,6,roofM);r.castShadow=true;
      for(const s of [0,1])trkRibbon(i0,i1,i=>(s?-1:1)*(TRK.bar[s][i]+0.8),0,1.05,4,roofM,6.5).castShadow=true;
      const lt=new THREE.MeshBasicMaterial({color:new THREE.Color(0xffe6b8).multiplyScalar(2.2),side:THREE.DoubleSide});
      for(const o of [-2.2,2.2])trkRibbon(i0,i1,o-0.12,o+0.12,6.45,4,lt);
      TRK.tunnel=[i0,i1];}}
  /* lampioni lungo i muri, ogni 40 metri */
  {const pole=new THREE.CylinderGeometry(0.09,0.13,8,6);pole.translate(0,4,0);const arm=new THREE.BoxGeometry(1.6,0.12,0.25);arm.translate(-0.8,7.9,0);
   const lamp=new THREE.BoxGeometry(0.7,0.18,0.35);lamp.translate(-1.5,7.8,0);
   const pts=[];for(let i=0;i<N;i+=20)for(const sg of [1,-1]){const s=sg>0?0:1;if(TRK.pitZone&&TRK.pitZone[i]&&sg>0)continue;pts.push([i,sg,TRK.bar[s][i]+1.2]);}
   const mat=new THREE.MeshStandardMaterial({color:0x3c4146,metalness:0.6,roughness:0.5}),lm=new THREE.MeshStandardMaterial({color:0xfff3d6,emissive:0xffe2a8,emissiveIntensity:0});
   const P=new THREE.InstancedMesh(pole,mat,pts.length),A=new THREE.InstancedMesh(arm,mat,pts.length),L=new THREE.InstancedMesh(lamp,lm,pts.length);
   pts.forEach(([i,sg,o],k)=>{ps.set(T.X[i]+T.nx[i]*sg*o,T.h[i],-(T.Y[i]+T.ny[i]*sg*o));q.setFromAxisAngle(up,Math.atan2(T.ty[i],T.tx[i])+(sg>0?Math.PI/2:-Math.PI/2));sc.set(1,1,1);m4.compose(ps,q,sc);P.setMatrixAt(k,m4);A.setMatrixAt(k,m4);L.setMatrixAt(k,m4);});
   for(const o of [P,A,L]){o.frustumCulled=false;o.castShadow=true;tw.add(o);}TRK.cityLamp=lm;}
}
{const f=trkBuildWorld;trkBuildWorld=function(){const was=TRK.built;f();if(!was&&TRKDEF.urban)trkCityBuild();};}
/* di notte si accendono finestre e lampioni */
{const f=trkAtmo;trkAtmo=function(){f();if(!TRK.built||!TRKDEF.urban)return;const n=TRK.tod==='night',s=TRK.tod==='sunset';
  if(TRK.cityFacade)TRK.cityFacade.emissiveIntensity=n?1.1:s?0.35:0;if(TRK.cityLamp)TRK.cityLamp.emissiveIntensity=n?3:s?1:0;};}
