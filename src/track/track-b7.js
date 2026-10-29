/* =========================================================
   Grafica e luce in pista: cielo con sole e nuvole, ombre del paesaggio e delle altre auto, luce per pixel delle torri e dei fari,
   ombre di contatto sotto le auto, grana dell'asfalto, alberi a palchi
   ========================================================= */
/* sfumatura verticale nei colori dei vertici: più scuro in basso, come se la luce arrivasse meno sotto le chiome */
function trkShade(g,y0,y1,dark){
  const p=g.attributes.position,c=new Float32Array(p.count*3);
  for(let k=0;k<p.count;k++){const t=clamp((p.getY(k)-y0)/(y1-y0),0,1),v=dark+(1-dark)*Math.pow(t,0.8);c[k*3]=c[k*3+1]=c[k*3+2]=v;}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;
}
/* conifera a tre palchi (stesso ingombro del cono di prima): ogni palco ha l'orlo inferiore più scuro */
function trkConiferGeo(){
  const tiers=[[2.9,4.4,-1.8],[2.25,3.8,0.6],[1.45,3.2,2.4]],list=[];
  for(const [r,h,y] of tiers){const g=new THREE.ConeGeometry(r,h,8,1,true);const p=g.attributes.position,c=new Float32Array(p.count*3);
    for(let k=0;k<p.count;k++){const t=(p.getY(k)+h/2)/h,v=(0.5+0.5*t)*(0.62+0.38*((y+4)/8));c[k*3]=c[k*3+1]=c[k*3+2]=v;}
    g.setAttribute('color',new THREE.BufferAttribute(c,3));list.push([g,new THREE.Matrix4().makeTranslation(0,y,0)]);}
  /* fondo chiuso del palco più basso */
  const cap=new THREE.CircleGeometry(2.9,8);cap.rotateX(Math.PI/2);const cc=new Float32Array(cap.attributes.position.count*3).fill(0.32);cap.setAttribute('color',new THREE.BufferAttribute(cc,3));
  list.push([cap,new THREE.Matrix4().makeTranslation(0,-4,0)]);
  const out=trkMergeGeos(list);list.forEach(([g])=>g.dispose());return out;
}
/* grana dell'asfalto: piccoli rilievi in una mappa delle normali (si vedono nei riflessi del sole e sul bagnato) */
function trkGrainNormal(){
  const S=256,h=new Float32Array(S*S),cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d'),id=g.createImageData(S,S),d=id.data;
  for(let k=0;k<S*S;k++)h[k]=Math.random()*0.6;
  for(let n=0;n<900;n++){const x=Math.random()*S,y=Math.random()*S,r=1+Math.random()*3.5,a=0.4+Math.random()*0.8;
    for(let yy=Math.floor(y-r);yy<=y+r;yy++)for(let xx=Math.floor(x-r);xx<=x+r;xx++){const dd=((xx-x)*(xx-x)+(yy-y)*(yy-y))/(r*r);if(dd<1)h[((yy+S)%S)*S+((xx+S)%S)]+=a*(1-dd);}}
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const H=(xx,yy)=>h[((yy+S)%S)*S+((xx+S)%S)],dx=H(x+1,y)-H(x-1,y),dy=H(x,y+1)-H(x,y-1),l=Math.hypot(dx,dy,1),k=(y*S+x)*4;
    d[k]=128-dx/l*127;d[k+1]=128+dy/l*127;d[k+2]=128+127/l;d[k+3]=255;}
  g.putImageData(id,0,0);const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
}

/* ---------- cielo: cupola con sfumatura, alone e disco del sole, nuvole procedurali che coprono il sole quando è nuvoloso ---------- */
const SKY={mesh:null,U:{uTop:{value:new THREE.Color()},uMid:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uSun:{value:new THREE.Vector3(0,1,0)},uSunC:{value:new THREE.Color()},
  uSunK:{value:0},uCloud:{value:0.3},uCloudC:{value:new THREE.Color(1,1,1)},uTime:{value:0},uHdr:{value:0}}};
function trkSkyBuild(){
  const m=new THREE.ShaderMaterial({uniforms:SKY.U,side:THREE.BackSide,depthTest:false,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform vec3 uTop,uMid,uHor,uSun,uSunC,uCloudC;uniform float uSunK,uCloud,uTime,uHdr;varying vec3 vDir;
      float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),f.x),mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),f.x),f.y);}
      float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=0.5;}return s;}
      void main(){vec3 d=normalize(vDir);float y=d.y;
        vec3 c=mix(uMid,uTop,smoothstep(0.0,0.6,y));c=mix(uHor,c,smoothstep(-0.03,0.16,y));
        float sd=max(dot(d,uSun),0.0),sk=uSunK;
        c+=uSunC*(pow(sd,6.0)*0.25+pow(sd,48.0)*0.55)*sk;
        c+=uSunC*smoothstep(0.99962,0.99985,sd)*sk*mix(1.0,22.0,uHdr);
        if(uCloud>0.0&&y>-0.02){vec2 uv=d.xz/(max(y,0.0)+0.1)*0.9+vec2(uTime*0.006,uTime*0.002);float n=fbm(uv)+0.18*fbm(uv*3.1+7.0);
          float cov=smoothstep(1.02-uCloud*0.78,1.18-uCloud*0.5,n+uCloud*0.22)*smoothstep(-0.02,0.12,y);
          float sh=fbm(uv*1.7+vec2(0.31,0.17));vec3 cc=uCloudC*(0.72+0.42*sh)+uSunC*pow(sd,5.0)*0.45*sk;
          c=mix(c,cc,cov*0.96);}
        gl_FragColor=vec4(c,1.0);}`});
  const s=new THREE.Mesh(new THREE.SphereGeometry(1,48,24),m);s.scale.setScalar(4200);s.frustumCulled=false;s.renderOrder=-1000;
  s.onBeforeRender=(r,sc,cam)=>{s.position.copy(cam.position);s.updateMatrixWorld();};
  SKY.mesh=s;TRK.tw.add(s);
}
const SKY_P={day:{t:'#3d76c6',m:'#8cb5e3',s:'#fff1d4',k:1,cl:0.34,cc:'#ffffff'},sunset:{t:'#232f66',m:'#cc7468',s:'#ffaa66',k:1.3,cl:0.4,cc:'#ffb690'},
  night:{t:'#01030a',m:'#0a1226',s:'#000000',k:0,cl:0.2,cc:'#1b2232'},over:{t:'#6c7680',m:'#98a1a9',s:'#e8ecf0',k:0.25,cl:0.9,cc:'#b3bac1'},
  rain:{t:'#4d565f',m:'#7a838c',s:'#c0c6cc',k:0,cl:1,cc:'#8b939b'},nrain:{t:'#04060a',m:'#0d131b',s:'#000000',k:0,cl:0.94,cc:'#121820'}};
const _sk1=new THREE.Color(),_sk2=new THREE.Color();
function trkSkyUpdate(tod,ko,r){
  if(!SKY.mesh)return;const U=SKY.U,B=SKY_P[tod],O=tod==='night'?SKY_P.night:SKY_P.over,R=tod==='night'?SKY_P.nrain:SKY_P.rain;
  const mix=(k,out)=>out.set(B[k]).lerp(_sk2.set(O[k]),ko).lerp(_sk2.set(R[k]),r),cv=c=>PP.on?ppInverseColor(c):c;
  U.uTop.value.copy(cv(mix('t',_sk1)));U.uMid.value.copy(cv(mix('m',_sk1)));U.uHor.value.copy(scene.fog.color);
  U.uCloudC.value.copy(cv(mix('cc',_sk1)));U.uSunC.value.copy(cv(_sk1.set(B.s)));
  U.uCloud.value=B.cl+(O.cl-B.cl)*ko+(R.cl-(B.cl+(O.cl-B.cl)*ko))*r;
  U.uSunK.value=(B.k+(O.k*B.k-B.k)*ko)*(1-r);U.uHdr.value=PP.on?1:0;
  const o=TRK_SUN[tod];U.uSun.value.set(o[0],o[1],o[2]).normalize();
}

/* ---------- ombre: con le ombre estese la mappa copre una quarantina di metri davanti alla telecamera, a passi di un texel (niente tremolio) ---------- */
const SHD={ext:false,R:9,size:2048};
const _sd=new THREE.Vector3(),_sc=new THREE.Vector3(),_sl=new THREE.Vector3(),_sr=new THREE.Vector3(),_su=new THREE.Vector3();
function trkShadowCfg(on){
  const ext=!!(on&&TRK.fxShadow),mob=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),big=ext&&!mob&&renderer.capabilities.maxTextureSize>=8192;
  const size=big?4096:2048;SHD.ext=ext;SHD.R=ext?(big?36:26):9;SHD.size=size;
  if(key.shadow.mapSize.x!==size){key.shadow.mapSize.set(size,size);if(key.shadow.map){key.shadow.map.dispose();key.shadow.map=null;}}
  Object.assign(key.shadow.camera,{left:-SHD.R,right:SHD.R,top:SHD.R,bottom:-SHD.R,near:1,far:ext?280:120});key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias=ext?0.03:0.02;
}
function trkShadowAim(v){
  const P=v.P,c=P.car,o=TRK.sunOff||TRK_SUN.day;let cx=c.X,cy=c.Y;
  if(SHD.ext){v.cam.getWorldDirection(_sd);const l=Math.hypot(_sd.x,_sd.z)||1,ah=SHD.R*0.5;cx+=_sd.x/l*ah;cy-=_sd.z/l*ah;}
  _sc.set(cx,P.zc,-cy);_sl.set(o[0],o[1],o[2]);const dist=SHD.ext?130:_sl.length();_sl.normalize();
  if(SHD.ext){_sr.set(0,1,0).cross(_sl).normalize();_su.copy(_sl).cross(_sr);const tx=2*SHD.R/SHD.size,a=_sc.dot(_sr),b=_sc.dot(_su);
    _sc.addScaledVector(_sr,Math.round(a/tx)*tx-a).addScaledVector(_su,Math.round(b/tx)*tx-b);}
  key.position.copy(_sc).addScaledVector(_sl,dist);key.target.position.copy(_sc);key.target.updateMatrixWorld();
}

/* ---------- luci per pixel: le dieci torri più vicine alla telecamera e i fari degli avversari più vicini ---------- */
function trkLightsUpdate(v){
  if(TRK_NIGHT.value<=0||!TRK.twPos)return;
  const cp=v.cam.position,arr=TRK.twPos,d=arr.map((t,k)=>[t.p.distanceToSquared(cp),k]).sort((a,b)=>a[0]-b[0]),U=TRK_LT;
  for(let k=0;k<10;k++){const e=d[k];if(e){const t=arr[e[1]];U.uTw.value[k].set(t.p.x,t.p.y,t.p.z,1);U.uTwA.value[k].copy(t.a);}else U.uTw.value[k].set(0,-9999,0,0);}
  U.uFarR.value=d.length>10?Math.sqrt(d[10][0]):1e5;
  const hl=[];if(TRK.lamp>0)for(const Q of TRK.cars){if(Q.id<2||!Q.rig||!Q.rig.visible)continue;const c=Q.car,cs=Math.cos(c.psi),sn=Math.sin(c.psi),x=c.X+cs*2.1,y=c.Y+sn*2.1,dx=x-cp.x,dz=-y-cp.z;hl.push([dx*dx+dz*dz,x,Q.zc+0.65,-y,cs,-sn]);}
  hl.sort((a,b)=>a[0]-b[0]);
  for(let k=0;k<8;k++){const h=hl[k];if(h&&h[0]<160000){U.uHl.value[k].set(h[1],h[2],h[3],1);U.uHd.value[k].set(h[4],-0.08,h[5]).normalize();}else U.uHl.value[k].set(0,-9999,0,0);}
}

/* ---------- ombra di contatto: un'ombra morbida sotto ogni auto la «appoggia» all'asfalto anche fuori dalla mappa delle ombre ---------- */
let CS_MAT=null;
function trkContactMat(){
  if(CS_MAT)return CS_MAT;const W=64,H=128,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d'),id=g.createImageData(W,H),d=id.data;
  const sdf=(x,y,hx,hy,r)=>{const qx=Math.abs(x)-hx+r,qy=Math.abs(y)-hy+r;return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r;};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const u=(x+0.5)/W*2-1,v=(y+0.5)/H*2-1,s=sdf(u,v,0.78,0.86,0.35),a=clamp(1-(s+0.2)/0.42,0,1),k=(y*W+x)*4;const aa=a*a*(3-2*a);d[k]=d[k+1]=d[k+2]=Math.round(255*aa);d[k+3]=255;}
  g.putImageData(id,0,0);const t=new THREE.CanvasTexture(cv);
  CS_MAT=new THREE.MeshBasicMaterial({color:0x000000,alphaMap:t,transparent:true,opacity:0.6,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});return CS_MAT;
}
function trkContact(P){
  if(P.cs||!P.rig)return;const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),trkContactMat());m.rotation.x=-Math.PI/2;m.rotation.z=Math.PI/2;m.renderOrder=1;P.rig.add(m);P.cs=m;
}
function trkContactUpdate(P){
  if(!P.cs)trkContact(P);if(!P.cs)return;const V=P.veh||{len:4.6,wid:1.95},T=TRK.T;
  P.cs.scale.set((V.wid||1.95)*1.22,(V.len||4.6)*1.06,1);P.cs.position.y=0.03-(P.hv||0)-(P.air?Math.max(0,P.zc-T.h[P.car.i]):0);
}

/* ---------- a mondo costruito: chi fa ombra, confini giusti dei gruppi di istanze, dati delle torri, cielo ---------- */
function trkWorldFinish(){
  const T=TRK.T;
  TRK.tw.traverse(o=>{
    if(o.isInstancedMesh){const g=o.geometry;g.computeBoundingSphere();const r0=g.boundingSphere.radius,M=new THREE.Matrix4(),p=new THREE.Vector3(),box=new THREE.Box3();
      for(let k=0;k<o.count;k++){o.getMatrixAt(k,M);p.setFromMatrixPosition(M);box.expandByPoint(p);}
      if(o.count){const sph=new THREE.Sphere();box.getBoundingSphere(sph);sph.radius+=r0*2;g.boundingSphere=sph;}}
    if(!o.isMesh||o.userData.flat)return;
    const m=o.material,basic=!Array.isArray(m)&&m.isMeshBasicMaterial;
    if(basic&&(m.fog===false||m.transparent))return;
    if(o.geometry&&o.geometry.type==='PlaneGeometry'&&Math.abs(Math.abs(o.rotation.x)-Math.PI/2)<0.01)return;
    o.castShadow=true;if(!basic)o.receiveShadow=true;});
  TRK.twPos=TRK.towers.map(t=>{const dx=T.X[t.i]-t.X,dy=T.Y[t.i]-t.Y,l=Math.hypot(dx,dy)||1;return {p:new THREE.Vector3(t.X+dx/l*1.2,T.h[t.i]+18,-(t.Y+dy/l*1.2)),a:new THREE.Vector3(dx/l,0,-dy/l)};});
  (TRK.clouds||[]).forEach(c=>c.visible=false);
  trkSkyBuild();
}

/* =========================================================
   Texture procedurali ad alta definizione (generate una volta sola): asfalto con inerti e crepe, prato con fili d'erba,
   ghiaia a ciottoli, cordoli consumati, guard rail zincato, cemento. Rumore frattale ripetibile senza cuciture
   ========================================================= */
const TXL={};
function trkRng(seed){let a=seed>>>0;return ()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/* rumore frattale ripetibile: reticoli periodici interpolati, ottava dopo ottava */
function trkFbm(S,H,f0,oct,seed,gain){
  const out=new Float32Array(S*H),R=trkRng(seed);let amp=1,tot=0,f=f0;
  for(let o=0;o<oct;o++){const fy=Math.max(1,Math.round(f*H/S)),Lt=new Float32Array(f*fy);for(let k=0;k<Lt.length;k++)Lt[k]=R();
    const sx=f/S,sy=fy/H;
    for(let y=0;y<H;y++){const vy=y*sy,iy=Math.floor(vy),ty=vy-iy,wy=ty*ty*(3-2*ty),y0=(iy%fy)*f,y1=((iy+1)%fy)*f;
      for(let x=0;x<S;x++){const vx=x*sx,ix=Math.floor(vx),tx=vx-ix,wx=tx*tx*(3-2*tx),x0=ix%f,x1=(ix+1)%f;
        out[y*S+x]+=amp*((Lt[y0+x0]*(1-wx)+Lt[y0+x1]*wx)*(1-wy)+(Lt[y1+x0]*(1-wx)+Lt[y1+x1]*wx)*wy);}}
    tot+=amp;amp*=gain||0.5;f*=2;if(f>S)break;}
  for(let k=0;k<out.length;k++)out[k]/=tot;return out;
}
function trkImgTex(S,H,fill,srgb){
  const cv=document.createElement('canvas');cv.width=S;cv.height=H;const g=cv.getContext('2d'),id=g.createImageData(S,H);fill(id.data);g.putImageData(id,0,0);
  const t=new THREE.CanvasTexture(cv);if(srgb)t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
const trkColTex=(S,H,col)=>trkImgTex(S,H,d=>{for(let k=0,n=S*H;k<n;k++){d[k*4]=clamp(col[k*3]*255,0,255);d[k*4+1]=clamp(col[k*3+1]*255,0,255);d[k*4+2]=clamp(col[k*3+2]*255,0,255);d[k*4+3]=255;}},true);
function trkNormTex(hg,S,H,str){
  return trkImgTex(S,H,d=>{for(let y=0;y<H;y++)for(let x=0;x<S;x++){const at=(xx,yy)=>hg[((yy+H)%H)*S+((xx+S)%S)],dx=(at(x+1,y)-at(x-1,y))*str,dy=(at(x,y+1)-at(x,y-1))*str,l=Math.hypot(dx,dy,1),k=(y*S+x)*4;
    d[k]=128-dx/l*127;d[k+1]=128+dy/l*127;d[k+2]=128+127/l;d[k+3]=255;}},false);
}
/* timbro circolare con ripetizione ai bordi */
function trkStamp(S,H,x,y,r,fn){const r2=r*r;for(let yy=Math.floor(y-r);yy<=Math.ceil(y+r);yy++)for(let xx=Math.floor(x-r);xx<=Math.ceil(x+r);xx++){const q=((xx-x)*(xx-x)+(yy-y)*(yy-y))/r2;if(q<1)fn(((yy%H)+H)%H*S+((xx%S)+S)%S,q);}}
function trkLine(S,H,x,y,ang,len,fn){const cx=Math.cos(ang),cy=Math.sin(ang);for(let t=0;t<len;t+=0.7){const xx=Math.round(x+cx*t),yy=Math.round(y+cy*t);fn(((yy%H)+H)%H*S+((xx%S)+S)%S,t/len);}}
const trkMix=(col,k,r,g,b,a)=>{col[k*3]+=(r-col[k*3])*a;col[k*3+1]+=(g-col[k*3+1])*a;col[k*3+2]+=(b-col[k*3+2])*a;};

/* asfalto: bitume con tono a chiazze, inerti chiari e scuri, crepe sottili; la mappa delle normali nasce dagli stessi rilievi */
function trkAsphaltTex(){
  if(TXL.asph)return TXL.asph;const S=1024,R=trkRng(11),mac=trkFbm(S,S,4,4,3,0.55),mid=trkFbm(S,S,48,3,5,0.5),hg=new Float32Array(S*S),col=new Float32Array(S*S*3);
  for(let k=0;k<S*S;k++){const v=0.235+0.075*(mac[k]-0.5)+0.04*(mid[k]-0.5);col[k*3]=v;col[k*3+1]=v*1.01;col[k*3+2]=v*1.045;hg[k]=mid[k]*0.25;}
  for(let n=0;n<120000;n++){const x=R()*S,y=R()*S,r=0.6+R()*R()*2.0,light=R()<0.32,t=light?0.4+0.22*R():0.11+0.08*R(),w=light?1.03:1;
    trkStamp(S,S,x,y,r,(k,q)=>{const a=(1-q)*0.9;trkMix(col,k,t*w,t,t*0.97,a);hg[k]+=(1-q)*0.9;});}
  for(let n=0;n<16;n++){let x=R()*S,y=R()*S,a=R()*6.28;for(let s=0;s<260;s++){a+=(R()-0.5)*0.6;x+=Math.cos(a);y+=Math.sin(a);trkStamp(S,S,x,y,0.9,(k,q)=>{col[k*3]*=0.62;col[k*3+1]*=0.62;col[k*3+2]*=0.62;hg[k]-=0.5;});}}
  for(let n=0;n<10;n++){const x=R()*S,y=R()*S,r=20+R()*60;trkStamp(S,S,x,y,r,(k,q)=>{const a=(1-q)*0.18;col[k*3]*=1-a;col[k*3+1]*=1-a;col[k*3+2]*=1-a*0.9;});}
  return TXL.asph={map:trkColTex(S,S,col),normal:trkNormTex(hg,S,S,1.6)};
}
/* prato: tre verdi a chiazze, migliaia di fili d'erba chiari e scuri, terra e trifoglio */
function trkGrassTex(){
  if(TXL.grass)return TXL.grass;const S=1024,R=trkRng(21),mac=trkFbm(S,S,4,4,7,0.55),mid=trkFbm(S,S,24,4,9,0.5),fin=trkFbm(S,S,128,2,13,0.5),col=new Float32Array(S*S*3);
  for(let k=0;k<S*S;k++){const m=mid[k],y=smooth01(mac[k],0.45,0.75),b=0.92+0.16*fin[k];
    let r=0.21+0.15*m,g=0.33+0.13*m,bb=0.11+0.06*m;r+=(0.42-r)*y*0.6;g+=(0.42-g)*y*0.6;bb+=(0.19-bb)*y*0.6;col[k*3]=r*b;col[k*3+1]=g*b;col[k*3+2]=bb*b;}
  for(let n=0;n<320;n++){const x=R()*S,y=R()*S,r=4+R()*10;trkStamp(S,S,x,y,r,(k,q)=>trkMix(col,k,0.18,0.3,0.1,(1-q)*0.45*(0.5+fin[k])));}
  for(let n=0;n<170000;n++){const x=R()*S,y=R()*S,a=R()*6.28,l=2+R()*5,lt=R()<0.55,f=lt?1.18+R()*0.25:0.62+R()*0.2;
    trkLine(S,S,x,y,a,l,(k,t)=>{const q=1-t*0.5;col[k*3]*=1+(f-1)*q;col[k*3+1]*=1+(f-1)*q;col[k*3+2]*=1+(f-1)*q*0.8;});}
  for(let n=0;n<2600;n++){const x=R()*S,y=R()*S,r=0.7+R()*1.2;trkStamp(S,S,x,y,r,(k,q)=>trkMix(col,k,0.34,0.27,0.18,(1-q)*0.8));}
  return TXL.grass={map:trkColTex(S,S,col)};
}
/* ghiaia: ciottoli tondeggianti beige e grigi con l'ombra negli interstizi */
function trkGravelTex(){
  if(TXL.grav)return TXL.grav;const S=512,R=trkRng(31),hg=new Float32Array(S*S),col=new Float32Array(S*S*3),fin=trkFbm(S,S,64,2,33,0.5);
  for(let k=0;k<S*S;k++){const v=0.42+0.08*fin[k];col[k*3]=v*0.85;col[k*3+1]=v*0.76;col[k*3+2]=v*0.6;hg[k]=0;}
  for(let n=0;n<9000;n++){const x=R()*S,y=R()*S,r=2+R()*4.5,t=R(),c=t<0.5?[0.78,0.7,0.55]:t<0.8?[0.66,0.64,0.6]:[0.55,0.47,0.38],br=0.82+0.3*R();
    trkStamp(S,S,x,y,r,(k,q)=>{const hh=Math.sqrt(1-q);if(hh*1.2>hg[k]){hg[k]=hh*1.2;const sh=0.75+0.25*hh;col[k*3]=c[0]*br*sh;col[k*3+1]=c[1]*br*sh;col[k*3+2]=c[2]*br*sh;}});}
  return TXL.grav={map:trkColTex(S,S,col),normal:trkNormTex(hg,S,S,2.2)};
}
/* cordolo: metà rosso e metà bianco per ogni periodo, vernice consumata dove passano le gomme, segni di gomma sul lato pista, bordi dei blocchi */
function trkKerbTex(){
  if(TXL.kerb)return TXL.kerb;const S=128,H=512,R=trkRng(41),wear=trkFbm(S,H,8,4,43,0.55),fin=trkFbm(S,H,32,2,47,0.5),col=new Float32Array(S*H*3),hg=new Float32Array(S*H);
  for(let y=0;y<H;y++)for(let x=0;x<S;x++){const k=y*S+x,red=y>=H/2,u=x/S;let c=red?[0.77,0.15,0.11]:[0.95,0.94,0.91];
    const edge=Math.min(Math.abs(y-H/2),y,H-y);const e=smooth01(edge,0,6);c=c.map(v=>v*(0.55+0.45*e));
    const w=wear[k]+0.3*(1-u)-0.15;if(w>0.7){const a=smooth01(w,0.7,0.86)*0.8;c=c.map((v,j)=>v+([0.45,0.45,0.44][j]-v)*a);}
    const rub=(1-smooth01(u,0.05,0.55))*smooth01(fin[k],0.35,0.8)*0.55;c=c.map(v=>v*(1-rub));
    col[k*3]=c[0]*(0.93+0.1*fin[k]);col[k*3+1]=c[1]*(0.93+0.1*fin[k]);col[k*3+2]=c[2]*(0.93+0.1*fin[k]);hg[k]=u*0.6+e*0.4+fin[k]*0.15;}
  return TXL.kerb={map:trkColTex(S,H,col),normal:trkNormTex(hg,S,H,1.2)};
}
/* guard rail: profilo a doppia onda (lungo l'altezza), zincatura a macchie, sporco in basso, montanti ogni due metri */
function trkRailTex(){
  if(TXL.rail)return TXL.rail;const S=128,H=512,R=trkRng(51),sp=trkFbm(S,H,16,4,53,0.55),fin=trkFbm(S,H,64,2,57,0.5),col=new Float32Array(S*H*3),hg=new Float32Array(S*H);
  for(let y=0;y<H;y++)for(let x=0;x<S;x++){const k=y*S+x,u=x/S,band=u>0.45&&u<0.9,ph=band?(u-0.45)/0.45:0,prof=band?Math.cos(ph*Math.PI*4)*0.5+0.5:0;
    let v=band?0.6+0.16*prof+0.08*(sp[k]-0.5)+0.05*fin[k]:0.34+0.06*fin[k];
    const post=(y%(H/2))<14&&!band;if(post)v=0.22;
    const dirt=(1-smooth01(u,0,0.5))*0.35;v*=1-dirt;col[k*3]=v*0.97;col[k*3+1]=v;col[k*3+2]=v*1.03;hg[k]=band?prof:post?0.6:0;}
  return TXL.rail={map:trkColTex(S,H,col),normal:trkNormTex(hg,S,H,1.5)};
}
/* cemento: chiazze, colature e puntini, per box, tribune, muretti e ponte */
function trkConcreteTex(){
  if(TXL.conc)return TXL.conc;const S=512,R=trkRng(61),mac=trkFbm(S,S,4,4,63,0.6),fin=trkFbm(S,S,96,2,67,0.5),col=new Float32Array(S*S*3);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const k=y*S+x,streak=trkFbm.cache?0:0;const v=0.86+0.12*(mac[k]-0.5)+0.06*(fin[k]-0.5);col[k*3]=v;col[k*3+1]=v;col[k*3+2]=v*0.98;}
  for(let n=0;n<40;n++){const x=R()*S,y0=R()*S,l=30+R()*140,a=0.05+0.08*R();for(let t=0;t<l;t++)trkStamp(S,S,x+Math.sin(t*0.07)*1.5,y0+t,1.6,(k,q)=>{col[k*3]*=1-a*(1-t/l);col[k*3+1]*=1-a*(1-t/l);col[k*3+2]*=1-a*(1-t/l)*0.9;});}
  for(let n=0;n<5000;n++){const x=R()*S,y=R()*S,c=R()<0.5?0.6:1.05;trkStamp(S,S,x,y,0.8,(k,q)=>{col[k*3]*=c;col[k*3+1]*=c;col[k*3+2]*=c;});}
  return TXL.conc={map:trkColTex(S,S,col)};
}
/* coordinate di texture dal mondo (proiezione sul piano più vicino alla normale): niente stiramenti su curve e su facciate lunghe */
const TRK_VN_GLSL=`float trkH2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float trkVN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(trkH2(i),trkH2(i+vec2(1.0,0.0)),f.x),mix(trkH2(i+vec2(0.0,1.0)),trkH2(i+vec2(1.0,1.0)),f.x),f.y);}`;
const TRK_WUV_VS=s=>`#include <uv_vertex>
#ifdef USE_UV
{vec4 wp=vec4(position,1.0);vec3 wn=normal;
#ifdef USE_INSTANCING
wp=instanceMatrix*wp;wn=mat3(instanceMatrix)*wn;
#endif
wp=modelMatrix*wp;wn=abs(normalize(mat3(modelMatrix)*wn));vUv=(wn.y>0.6?wp.xz:(wn.x>wn.z?wp.zy:wp.xy))/${s.toFixed(3)};vWuvW=wp.xyz;}
#endif`;
/* due campioni della stessa texture, ruotati e mescolati con un rumore a grande scala: la ripetizione non si vede più; più una variazione di tono */
const TRK_ANTITILE=(macro)=>`#ifdef USE_MAP
vec4 texelColor=texture2D(map,vUv);vec4 tc2=texture2D(map,mat2(0.8,-0.6,0.6,0.8)*vUv*1.13+vec2(0.37,0.71));
texelColor=mix(texelColor,tc2,smoothstep(0.35,0.65,trkVN(vWuvW.xz*0.045)));texelColor=mapTexelToLinear(texelColor);
diffuseColor*=texelColor;diffuseColor.rgb*=${(1-macro).toFixed(3)}+${(2*macro).toFixed(3)}*trkVN(vWuvW.xz*0.011+3.7);
#endif`;
function trkWorldUV(sh,s,macro){
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWuvW;').replace('#include <uv_vertex>',TRK_WUV_VS(s));
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWuvW;\n'+TRK_VN_GLSL);
  if(macro!=null)sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',TRK_ANTITILE(macro));
}
/* per i materiali che non passano dalla luce notturna (tribune, box, ponte, case) */
function trkWorldMap(mat,s,macro){
  const prev=Object.prototype.hasOwnProperty.call(mat,'onBeforeCompile')?mat.onBeforeCompile:null;
  mat.onBeforeCompile=(sh,r)=>{if(prev)prev(sh,r);trkWorldUV(sh,s,macro);};mat.customProgramCacheKey=()=>'trkwuv'+s+'|'+macro+'|'+mat.type;mat.needsUpdate=true;return mat;
}
