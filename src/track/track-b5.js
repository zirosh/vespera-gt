/* =========================================================
   Post-produzione in pista: la scena si disegna in alta gamma dinamica, poi bagliore delle luci (bloom),
   gocce sull'obiettivo e mappatura dei toni. Le auto si specchiano sull'asfalto bagnato
   ========================================================= */
const PP={on:false,w:0,h:0,rt:null,m:[],scene:new THREE.Scene(),cam:new THREE.OrthographicCamera(-1,1,1,-1,0,1)};
PP.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));PP.quad.frustumCulled=false;PP.scene.add(PP.quad);
const PP_VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
const ppMat=(u,fs)=>new THREE.ShaderMaterial({uniforms:u,vertexShader:PP_VS,fragmentShader:fs,depthTest:false,depthWrite:false});
/* parti luminose: solo ciò che supera la soglia (luci, riflessi del sole, fari), con un ginocchio morbido */
const ppBright=ppMat({tSrc:{value:null},uThr:{value:2},uTexel:{value:new THREE.Vector2()}},
  `uniform sampler2D tSrc;uniform float uThr;uniform vec2 uTexel;varying vec2 vUv;
  vec3 s(vec2 o){return min(texture2D(tSrc,vUv+o*uTexel).rgb,vec3(uThr*2.6));}
  void main(){vec3 c=(s(vec2(-1.0,-1.0))+s(vec2(1.0,-1.0))+s(vec2(-1.0,1.0))+s(vec2(1.0,1.0)))*0.25;float l=max(max(c.r,c.g),c.b);
    float k=clamp(l-uThr*0.8,0.0,uThr*0.4);k=k*k/(uThr*1.6+1e-4);gl_FragColor=vec4(c*max(k,l-uThr)/max(l,1e-4),1.0);}`);
const ppDown=ppMat({tSrc:{value:null},uTexel:{value:new THREE.Vector2()}},
  `uniform sampler2D tSrc;uniform vec2 uTexel;varying vec2 vUv;
  void main(){gl_FragColor=vec4((texture2D(tSrc,vUv+uTexel*vec2(-1.0,-1.0)).rgb+texture2D(tSrc,vUv+uTexel*vec2(1.0,-1.0)).rgb+texture2D(tSrc,vUv+uTexel*vec2(-1.0,1.0)).rgb+texture2D(tSrc,vUv+uTexel*vec2(1.0,1.0)).rgb)*0.25,1.0);}`);
const ppBlur=ppMat({tSrc:{value:null},uDir:{value:new THREE.Vector2()}},
  `uniform sampler2D tSrc;uniform vec2 uDir;varying vec2 vUv;
  void main(){vec3 c=texture2D(tSrc,vUv).rgb*0.227027;c+=(texture2D(tSrc,vUv+uDir*1.3846).rgb+texture2D(tSrc,vUv-uDir*1.3846).rgb)*0.3162162;
    c+=(texture2D(tSrc,vUv+uDir*3.2308).rgb+texture2D(tSrc,vUv-uDir*3.2308).rgb)*0.0702703;gl_FragColor=vec4(c,1.0);}`);
/* composizione finale: gocce che rifrangono l'immagine, bagliore, mappatura ACES come quella di three.js, uscita sRGB */
const ppComp=ppMat({tScene:{value:null},tB0:{value:null},tB1:{value:null},tB2:{value:null},tB3:{value:null},tB4:{value:null},tDrops:{value:null},uExp:{value:1},uBloom:{value:0.6},uDrops:{value:0},uTexel:{value:new THREE.Vector2()},uVig:{value:0.3},uBlur:{value:0},uBlurC:{value:new THREE.Vector2(0.5,0.56)}},
  `uniform sampler2D tScene,tB0,tB1,tB2,tB3,tB4,tDrops;uniform float uExp,uBloom,uDrops,uVig,uBlur;uniform vec2 uTexel,uBlurC;varying vec2 vUv;
  vec3 RRTAndODTFit(vec3 v){vec3 a=v*(v+0.0245786)-0.000090537;vec3 b=v*(0.983729*v+0.4329510)+0.238081;return a/b;}
  vec3 aces(vec3 c){const mat3 I=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));
    const mat3 O=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));
    c*=uExp/0.6;c=I*c;c=RRTAndODTFit(c);c=O*c;return clamp(c,0.0,1.0);}
  vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(0.41666))-0.055,step(vec3(0.0031308),c));}
  void main(){vec2 uv=vUv;float m=0.0;vec2 n=vec2(0.0);
    if(uDrops>0.0){vec4 d=texture2D(tDrops,vUv);m=d.b*uDrops;n=(d.rg-0.5)*2.0;uv+=n*m*0.05;}
    vec3 c=texture2D(tScene,uv).rgb;
    /* velocità: i bordi dell'immagine si allungano verso il punto di fuga */
    if(uBlur>0.0){vec2 dv=uv-uBlurC;float k=uBlur*smoothstep(0.12,0.62,length(dv*vec2(1.6,1.0)))*(1.0-smoothstep(0.55,0.8,uv.y));if(k>0.002){vec3 acc=c;for(int j=1;j<7;j++)acc+=texture2D(tScene,uv-dv*k*0.022*float(j)).rgb;c=acc/7.0;}}
    if(m>0.01){vec3 bl=(texture2D(tScene,uv+vec2(uTexel.x*3.0,0.0)).rgb+texture2D(tScene,uv-vec2(uTexel.x*3.0,0.0)).rgb+texture2D(tScene,uv+vec2(0.0,uTexel.y*3.0)).rgb+texture2D(tScene,uv-vec2(0.0,uTexel.y*3.0)).rgb)*0.25;
      c=mix(c,bl,m*0.35);c*=1.0+m*(0.06+0.22*n.y);c+=m*smoothstep(0.75,1.0,length(n))*0.06;}
    vec3 b=texture2D(tB0,vUv).rgb*0.45+texture2D(tB1,vUv).rgb*0.55+texture2D(tB2,vUv).rgb*0.7+texture2D(tB3,vUv).rgb*0.8+texture2D(tB4,vUv).rgb*0.9;
    c+=b*uBloom;
    /* vignettatura leggera: l'occhio va al centro */
    vec2 vq=(vUv-0.5)*vec2(1.0,0.82);c*=1.0-uVig*smoothstep(0.18,0.75,dot(vq,vq)*2.2);
    gl_FragColor=vec4(srgb(aces(c)),1.0);}`);
const PP_RT={type:THREE.HalfFloatType,format:THREE.RGBAFormat,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:false};
function ppEnsure(w,h){
  if(PP.rt&&PP.w===w&&PP.h===h)return;
  if(PP.rt){PP.rt.dispose();PP.m.forEach(l=>{l.a.dispose();l.b.dispose();});}
  PP.w=w;PP.h=h;
  /* profondità a 24 bit (con lo stencil): a 16 bit le superfici vicine, come portiere e decalcomanie, sfarfallano */
  PP.rt=new THREE.WebGLMultisampleRenderTarget(w,h,Object.assign({depthBuffer:true,stencilBuffer:true},PP_RT));PP.rt.samples=4;
  PP.m=[];let lw=w,lh=h;for(let L=0;L<5;L++){lw=Math.max(1,lw>>1);lh=Math.max(1,lh>>1);PP.m.push({w:lw,h:lh,a:new THREE.WebGLRenderTarget(lw,lh,Object.assign({depthBuffer:false},PP_RT)),b:new THREE.WebGLRenderTarget(lw,lh,Object.assign({depthBuffer:false},PP_RT))});}
}
function ppPass(mat,out){PP.quad.material=mat;renderer.setRenderTarget(out);renderer.render(PP.scene,PP.cam);}
function trkPostOn(){
  const ok=renderer.capabilities.isWebGL2&&(TRK.fxPost||TRK.fxRefl);
  if(ok!==PP.on){PP.on=ok;renderer.toneMapping=ok?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;}
  if(TRK.on)trkAtmo();
}
function trkPostOff(){if(PP.on){PP.on=false;renderer.toneMapping=THREE.ACESFilmicToneMapping;}renderer.setRenderTarget(null);DROP.list.length=0;}
/* con la post-produzione la nebbia si mescola prima della mappatura dei toni: il suo colore va «al contrario» perché a schermo resti lo stesso */
const _pa=new THREE.Vector3(),_pb=new THREE.Vector3();
function ppAces(v,exp,out){const x=v.x*exp/0.6,y=v.y*exp/0.6,z=v.z*exp/0.6;
  const a=0.59719*x+0.35458*y+0.04823*z,b=0.07600*x+0.90834*y+0.01566*z,c=0.02840*x+0.13383*y+0.83777*z;
  const f=t=>(t*(t+0.0245786)-0.000090537)/(t*(0.983729*t+0.4329510)+0.238081),A=f(a),B=f(b),C=f(c);
  out.set(1.60475*A-0.53108*B-0.07367*C,-0.10208*A+1.10813*B-0.00605*C,-0.00327*A-0.07276*B+1.07602*C);return out;}
function ppInverseColor(col){
  const exp=renderer.toneMappingExposure,tgt=new THREE.Vector3(col.r,col.g,col.b);
  const lin=t=>t<0.04045?t/12.92:Math.pow((t+0.055)/1.055,2.4);tgt.set(lin(tgt.x),lin(tgt.y),lin(tgt.z));
  const x=tgt.clone();for(let it=0;it<40;it++){ppAces(x,exp,_pa);_pb.subVectors(tgt,_pa);x.addScaledVector(_pb,0.9);x.max(_pa.set(0,0,0));}
  col.setRGB(x.x,x.y,x.z);return col;
}
function trkPostRender(views){
  const pr=renderer.getPixelRatio(),W=views[0].W,H=views[0].H,w=Math.max(2,Math.round(W*pr)),h=Math.max(2,Math.round(H*pr));
  ppEnsure(w,h);
  for(const v of views){trkPrepView(v);trkReflect(v);
    PP.rt.viewport.set(Math.round(v.x*pr),Math.round(v.y*pr),Math.round(v.w*pr),Math.round(v.h*pr));PP.rt.scissor.copy(PP.rt.viewport);PP.rt.scissorTest=views.length>1;
    renderer.setRenderTarget(PP.rt);renderer.render(scene,v.cam);}
  PP.rt.scissorTest=false;
  const night=TRK.tod==='night',bloom=TRK.fxPost;
  if(bloom){ppBright.uniforms.tSrc.value=PP.rt.texture;ppBright.uniforms.uThr.value=night?0.95:TRK.tod==='sunset'?4.0:5.5;ppBright.uniforms.uTexel.value.set(1/w,1/h);ppPass(ppBright,PP.m[0].a);
    for(let L=1;L<5;L++){ppDown.uniforms.tSrc.value=PP.m[L-1].a.texture;ppDown.uniforms.uTexel.value.set(0.5/PP.m[L-1].w,0.5/PP.m[L-1].h);ppPass(ppDown,PP.m[L].a);}
    for(const l of PP.m){ppBlur.uniforms.tSrc.value=l.a.texture;ppBlur.uniforms.uDir.value.set(1/l.w,0);ppPass(ppBlur,l.b);ppBlur.uniforms.tSrc.value=l.b.texture;ppBlur.uniforms.uDir.value.set(0,1/l.h);ppPass(ppBlur,l.a);}}
  const U=ppComp.uniforms;U.tScene.value=PP.rt.texture;['tB0','tB1','tB2','tB3','tB4'].forEach((k,i)=>U[k].value=PP.m[i].a.texture);
  U.uBloom.value=bloom?(night?0.85:TRK.rain>0.3?0.35:0.2):0;U.uExp.value=renderer.toneMappingExposure;U.uTexel.value.set(1/w,1/h);U.tDrops.value=DROP.tex;U.uDrops.value=bloom&&DROP.list.length?1:0;
  {const P=views[0].P,one=views.length===1&&!TRK.replay.on,ck=P.cam==='cockpit';U.uVig.value=TRK.fxPost?(ck?0.4:0.28):0;U.uBlur.value=one&&TRK.fxPost?smooth01(P.kmh,150,330)*(ck?0.5:0.8):0;U.uBlurC.value.set(0.5,ck?0.6:0.56);}
  ppFinal(views,W,H);
}
/* ultimo passaggio sullo schermo (track-b21 lo avvolge per l'occlusione ambientale e l'antialiasing) */
function ppFinal(views,W,H){renderer.setRenderTarget(null);renderer.setScissorTest(false);renderer.setViewport(0,0,W,H);PP.quad.material=ppComp;renderer.render(PP.scene,PP.cam);}

/* ---------- riflessi: una seconda telecamera, specchiata sotto la strada, vede solo le auto e le luci ---------- */
const RF={rt:null,w:0,h:0,cam:new THREE.PerspectiveCamera(),U:{uRefl:{value:null},uReflMat:{value:new THREE.Matrix4()},uReflK:{value:0},uRTime:{value:0}},lights:false};
RF.cam.layers.set(2);
const _rm=new THREE.Matrix4(),_rd=new THREE.Vector3(),_ru=new THREE.Vector3(),_rt=new THREE.Vector3(),_cc=new THREE.Color();
function trkReflPatch(mat){
  const prev=mat.onBeforeCompile;
  mat.onBeforeCompile=(sh,r)=>{if(prev)prev(sh,r);Object.assign(sh.uniforms,RF.U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform mat4 uReflMat;\nvarying vec4 vRefl;\nvarying vec3 vRw;')
      .replace('#include <fog_vertex>','#include <fog_vertex>\n{vec4 rw=modelMatrix*vec4(transformed,1.0);vRefl=uReflMat*rw;vRw=rw.xyz;}');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uRefl;uniform float uReflK;uniform float uRTime;varying vec4 vRefl;varying vec3 vRw;')
      .replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );',`if(uReflK>0.0&&vRefl.w>0.0){vec2 ruv=vRefl.xy/vRefl.w;
        float k=uReflK*(0.3+0.7*smoothstep(0.42,0.85,1.0-roughnessFactor));
        ruv.x+=sin(vRw.x*3.1+uRTime*7.0)*sin(vRw.z*2.7-uRTime*5.0)*0.0022;
        vec4 acc=vec4(0.0);float ws=0.0;for(int j=-4;j<=4;j++){float w=1.0-abs(float(j))/5.0;acc+=texture2D(uRefl,ruv+vec2(0.0,float(j)*0.0065))*w;ws+=w;}acc/=ws;
        float fr=0.3+0.7*pow(1.0-clamp(dot(normalize(vViewPosition),normal),0.0,1.0),2.0);
        outgoingLight=outgoingLight*(1.0-acc.a*k*fr*0.5)+acc.rgb*k*fr;}
      gl_FragColor = vec4( outgoingLight, diffuseColor.a );`);};
  const key0=mat.customProgramCacheKey?mat.customProgramCacheKey():'';mat.customProgramCacheKey=()=>key0+'|trkrefl';mat.needsUpdate=true;
}
function trkReflect(v){
  const on=PP.on&&TRK.fxRefl&&TRK.wet>0.06;RF.U.uReflK.value=on?Math.min(1,TRK.wet*1.1):0;if(!on)return;
  if(!RF.patched){RF.patched=true;trkReflPatch(TRK.asphalt);}
  if(!RF.lights){RF.lights=true;scene.traverse(o=>{if(o.isLight)o.layers.enable(2);});}
  const pr=renderer.getPixelRatio(),w=Math.max(2,Math.round(v.w*pr*0.5)),h=Math.max(2,Math.round(v.h*pr*0.5));
  if(!RF.rt||RF.w!==w||RF.h!==h){if(RF.rt)RF.rt.dispose();RF.rt=new THREE.WebGLRenderTarget(w,h,Object.assign({depthBuffer:true,stencilBuffer:true},PP_RT));RF.w=w;RF.h=h;RF.U.uRefl.value=RF.rt.texture;}
  const cam=v.cam,y0=v.P.zc,p=cam.position,rc=RF.cam;cam.updateMatrixWorld();
  _rm.extractRotation(cam.matrixWorld);_rd.set(0,0,-1).applyMatrix4(_rm);_ru.set(0,1,0).applyMatrix4(_rm);_rd.y=-_rd.y;_ru.y=-_ru.y;
  rc.position.set(p.x,2*y0-p.y,p.z);rc.up.copy(_ru);_rt.copy(rc.position).add(_rd);rc.lookAt(_rt);
  rc.fov=cam.fov;rc.aspect=v.w/v.h;rc.near=0.1;rc.far=900;rc.updateProjectionMatrix();rc.updateMatrixWorld();
  const bg=scene.background,au=renderer.shadowMap.autoUpdate,ca=renderer.getClearAlpha();renderer.getClearColor(_cc);
  /* nel riflesso contano solo le auto vicine */
  const hid=[];for(const Q of TRK.cars){if(Q.rig&&Q.rig.visible&&Q.rig.position.distanceToSquared(p)>3025){Q.rig.visible=false;hid.push(Q.rig);}}
  scene.background=null;renderer.shadowMap.autoUpdate=false;renderer.setRenderTarget(RF.rt);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(scene,rc);
  hid.forEach(r=>r.visible=true);
  renderer.setClearColor(_cc,ca);renderer.shadowMap.autoUpdate=au;scene.background=bg;renderer.setRenderTarget(null);
  RF.U.uReflMat.value.set(0.5,0,0,0.5,0,0.5,0,0.5,0,0,0.5,0.5,0,0,0,1).multiply(rc.projectionMatrix).multiply(rc.matrixWorldInverse);
  RF.U.uRTime.value=TRK.clock;
}

/* ---------- gocce sull'obiettivo: con la pioggia si posano sulla telecamera, scivolano e con la velocità volano via ---------- */
const DROP={cv:document.createElement('canvas'),list:[],tex:null,acc:0};
DROP.cv.width=256;DROP.cv.height=144;
{const s=document.createElement('canvas');s.width=s.height=64;const g=s.getContext('2d'),id=g.createImageData(64,64),d=id.data;
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){const dx=(x-32)/30,dy=(y-32)/30,r2=dx*dx+dy*dy,k=(y*64+x)*4;
   if(r2<1){const e=Math.min(1,(1-r2)*6),sph=Math.sqrt(1-r2);d[k]=128+dx*120*(1.1-sph*0.4);d[k+1]=128-dy*120*(1.1-sph*0.4);d[k+2]=255*Math.min(1,0.55+0.45*(1-sph)+0.0);d[k+3]=255*e;}}
 g.putImageData(id,0,0);DROP.spr=s;}
DROP.tex=new THREE.CanvasTexture(DROP.cv);DROP.tex.minFilter=THREE.LinearFilter;DROP.tex.generateMipmaps=false;
const dropCtx=DROP.cv.getContext('2d');
function trkDrops(dt){
  const cw=DROP.cv.width,ch=DROP.cv.height,L=DROP.list;
  if(!PP.on||!TRK.fxPost||(TRK.rain<0.05&&!L.length)){if(L.length)L.length=0;return;}
  const views=trkViews(),W=views[0].W,H=views[0].H,rp=TRK.replay.on;
  for(const v of views){const P=v.P,cock=rp?TRK.replay.cam==='cockpit':P.cam==='cockpit';
    const x0=v.x/W*cw,x1=(v.x+v.w)/W*cw,y0=(H-v.y-v.h)/H*ch,y1=(H-v.y)/H*ch,sp=Math.abs(P.car.vx);
    /* in abitacolo le gocce sono sul parabrezza: con la velocità salgono spinte dall'aria, i tergicristalli le spazzano */
    if(cock){const wv=x1-x0,hv=y1-y0;DROP.acc+=TRK.rain*(7+sp/5)*dt*(v.w/W);
      while(DROP.acc>1&&L.length<170){DROP.acc-=1;L.push({ck:1,x:x0+Math.random()*wv,y:y0+Math.random()*hv*0.72,r:0.9+Math.random()*2.1,life:1,vy:0,cx:(x0+x1)/2,cy:y1,sp});}
      const wipe=TRK.rain>0.12||TRK.wet>0.6,th=wipe?0.85-0.85*Math.cos(TRK.clock*Math.PI*2*0.85):0,tp=DROP.wPrev==null?th:DROP.wPrev,lo=Math.min(th,tp)-0.03,hi=Math.max(th,tp)+0.03;DROP.wPrev=th;
      for(let k=L.length-1;k>=0;k--){const q=L[k];if(!q.ck||q.x<x0||q.x>=x1)continue;q.sp=sp;
        if(wipe)for(const px of [x0+wv*0.3,x0+wv*0.7]){const dx=q.x-px,dy=y1-q.y,a=Math.atan2(dy,-dx),r=Math.hypot(dx,dy);if(r<wv*0.52&&a>=lo&&a<=hi){L.splice(k,1);break;}}}
      continue;}
    for(let k=L.length-1;k>=0;k--){const q=L[k];if(q.ck&&q.x>=x0&&q.x<x1)L.splice(k,1);}
    DROP.acc+=TRK.rain*(3+sp/9)*dt*(v.w/W);
    while(DROP.acc>1&&L.length<90){DROP.acc-=1;L.push({x:x0+Math.random()*(x1-x0),y:y0+Math.random()*(y1-y0),r:1.3+Math.random()*2.8,life:1,vy:2+Math.random()*5,cx:(x0+x1)/2,cy:(y0+y1)/2,sp:0});}
    for(const q of L)if(q.x>=x0&&q.x<x1)q.sp=sp;}
  if(DROP.acc>1)DROP.acc=1;
  for(let k=L.length-1;k>=0;k--){const q=L[k],blow=Math.max(0,q.sp-18)/40;
    if(q.ck){const up=Math.max(0,q.sp-9)*0.9;q.y+=(q.sp<9?6:-up)*dt;q.x+=(q.x-q.cx)*Math.min(q.sp,60)*0.004*dt;q.life-=dt*0.05;if(q.life<=0||q.y<-4||q.x<0||q.x>cw||q.y>ch)L.splice(k,1);continue;}
    q.y+=q.vy*dt*(1+blow*3);q.x+=(q.x-q.cx)*blow*dt*2.2;q.y+=(q.y-q.cy)*blow*dt*1.2;q.life-=dt*(0.12+blow*0.9);
    if(q.life<=0||q.x<0||q.x>cw||q.y<0||q.y>ch)L.splice(k,1);}
  dropCtx.globalAlpha=1;dropCtx.fillStyle='rgb(128,128,0)';dropCtx.fillRect(0,0,cw,ch);
  for(const q of L){dropCtx.globalAlpha=Math.min(1,q.life*2.2);const st=q.ck?1+Math.min(1.6,Math.max(0,q.sp-9)/25):1+Math.min(1.2,Math.max(0,q.sp-18)/30);dropCtx.drawImage(DROP.spr,q.x-q.r,q.y-q.r*st,q.r*2,q.r*2*st);}
  DROP.tex.needsUpdate=true;
}

/* =========================================================
   Suoni della pista: stridio delle gomme, vento, pioggia e spruzzi, erba e cordoli, pubblico in tribuna, colpi
   ========================================================= */
const SFX={on:false,cheer:0,crowdT:0};
function trkSfxInit(){
  const ac=audio.ctx;if(!ac||SFX.on)return;
  try{
    const nb=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    const master=ac.createGain();master.gain.value=0.9;master.connect(ac.destination);
    const noise=()=>{const s=ac.createBufferSource();s.buffer=nb;s.loop=true;s.loopStart=Math.random();s.start(0,Math.random()*1.9);return s;};
    const filt=(type,f,q)=>{const b=ac.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q||0.7;return b;};
    const gain=()=>{const g=ac.createGain();g.gain.value=0;g.connect(master);return g;};
    const chain=(src,...nodes)=>{let n=src;for(const x of nodes){n.connect(x);n=x;}return n;};
    /* stridio: tono a dente di sega filtrato stretto, con un vibrato veloce e un filo di rumore */
    const sq=gain(),so=ac.createOscillator();so.type='sawtooth';so.frequency.value=820;const sbp=filt('bandpass',900,9);chain(so,sbp,sq);so.start();
    const lfo=ac.createOscillator();lfo.frequency.value=13;const lg=ac.createGain();lg.gain.value=35;lfo.connect(lg);lg.connect(so.frequency);lfo.start();
    const sqn=gain();chain(noise(),filt('bandpass',1500,4),sqn);
    const wind=gain(),wbp=filt('bandpass',400,0.6);chain(noise(),wbp,wind);
    const rain=gain();chain(noise(),filt('highpass',900),filt('lowpass',6500),rain);
    const spray=gain(),spbp=filt('bandpass',2300,0.8);chain(noise(),spbp,spray);
    const rumble=gain();chain(noise(),filt('lowpass',170),rumble);
    const kerb=gain(),ko=ac.createOscillator();ko.type='square';ko.frequency.value=42;chain(ko,filt('lowpass',380),kerb);ko.start();
    const crowd=gain(),cm=ac.createGain();cm.gain.value=1;const cn=noise();cn.connect(filt('bandpass',650,0.7)).connect(cm);cn.connect(filt('bandpass',1700,1.1)).connect(cm);cm.connect(crowd);
    Object.assign(SFX,{on:true,master,sq,so,sbp,sqn,wind,wbp,rain,spray,spbp,rumble,kerb,ko,crowd,cm,nb});
  }catch(e){SFX.on=false;}
}
/* vibrazione continua: cordoli, erba e ghiaia, ruote che pattinano o bloccano, atterraggi */
function trkRumbleTick(P){const sp=Math.abs(P.car.vx);if(P.pit||sp<3)return;
  if(P.landT>0.3){trkRumble(P,0.9,0.7,200);return;}
  if(P.surf==='cordolo')trkRumble(P,0.05,0.4*Math.min(1,sp/30),110);
  else if(P.surf==='erba'||P.surf==='ghiaia')trkRumble(P,0.5*Math.min(1,sp/25),0.15,110);
  else if(P.spin||(P.brk>0.9&&Math.abs(P.ar)>0.1))trkRumble(P,0.1,0.35,110);
  else if(P.air)trkRumble(P,0,0,60);}
function trkSfxStop(){if(!SFX.on)return;const now=audio.ctx.currentTime;for(const k of ['sq','sqn','wind','rain','spray','rumble','kerb','crowd'])SFX[k].gain.setTargetAtTime(0,now,0.15);}
function trkCheer(k){SFX.cheer=Math.max(SFX.cheer,k);TRK.crowdEx=Math.max(TRK.crowdEx||0,Math.min(1,k));}
/* colpo secco per i contatti, se l'auto è quella inquadrata o vicina alla telecamera */
function trkThump(P,k){
  if(!P.isAI)trkRumble(P,0.9*k+0.1,0.6*k,240);
  if(!SFX.on||!engine.on)return;const ac=audio.ctx,d=P.rig?P.rig.position.distanceTo(camera.position):0,g0=k*clamp(1.2/(1+d/12),0,1);if(g0<0.03)return;
  const s=ac.createBufferSource();s.buffer=SFX.nb;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=320;const g=ac.createGain(),now=ac.currentTime;
  g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(0.5*g0,now+0.008);g.gain.exponentialRampToValueAtTime(0.001,now+0.35);
  s.connect(f);f.connect(g);g.connect(SFX.master);s.start(now,Math.random()*1.5,0.4);
}
function trkSfxUpdate(dt){
  if(!SFX.on)return;const ac=audio.ctx,now=ac.currentTime,on=engine.on&&TRK.on,rp=TRK.replay.on;
  const P=rp?(TRK.cars[TRK.replay.focus]||TRK.p[0]):TRK.p[0],c=P.car,sp=Math.abs(c.vx),cock=(rp?TRK.replay.cam:P.cam)==='cockpit',tv=rp&&TRK.replay.cam==='tv';
  const set=(node,v,tc)=>node.gain.setTargetAtTime(on?v:0,now,tc||0.08);
  const wl=trkWetAt(c.i,c.d),asph=P.surf==='asfalto'||P.surf==='cordolo';
  let s=asph&&wl<0.3&&!P.air&&!P.pit?clamp((Math.abs(P.ar)-0.085)*7+(Math.abs(P.af)-0.11)*5+(P.spin?0.5:0)+(P.lock?0.7:0)+(P.brk>0.85&&sp>15?0.1:0),0,1)*clamp(sp/12,0,1):0;
  if(tv)s*=0.4;
  set(SFX.sq,s*0.09,0.05);set(SFX.sqn,s*0.05,0.05);SFX.so.frequency.setTargetAtTime(700+s*260+sp*1.5,now,0.08);
  const amb=tv?0.35:1;
  set(SFX.wind,0.07*Math.pow(Math.min(1,sp/75),2)*(cock?0.45:1)*amb);SFX.wbp.frequency.setTargetAtTime(220+sp*13,now,0.2);
  set(SFX.rain,TRK.rain*0.11*(cock?0.75:1),0.4);
  set(SFX.spray,wl*0.07*clamp(sp/50,0,1)*amb,0.15);
  set(SFX.rumble,(!asph&&!P.air&&sp>3?0.22*Math.min(1,sp/25):0)*amb,0.06);
  set(SFX.kerb,(P.surf==='cordolo'&&sp>5?0.06:0)*amb,0.04);SFX.ko.frequency.setTargetAtTime(30+sp*0.5,now,0.1);
  /* pubblico: più forte vicino alle tribune, ovazioni al via, ai sorpassi e all'arrivo */
  SFX.cheer=Math.max(0,SFX.cheer-dt*0.25);
  let dm=1e9;for(const s2 of TRK.stands||[]){dm=Math.min(dm,Math.hypot(camera.position.x-s2.X,-camera.position.z-s2.Y));}
  const near=clamp(1-(dm-40)/320,0,1);set(SFX.crowd,(0.012+near*(0.045+SFX.cheer*0.2)+SFX.cheer*0.04),0.3);
  SFX.crowdT-=dt;if(SFX.crowdT<=0){SFX.crowdT=0.25+Math.random()*0.4;SFX.cm.gain.setTargetAtTime(0.7+Math.random()*0.6,now,0.2);}
}
