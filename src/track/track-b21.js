/* =========================================================
   Grafica: occlusione ambientale nello spazio dello schermo (SSAO) e antialiasing FXAA, dentro la post-produzione HDR.
   La profondità arriva gratis: il render target multicampione della scena ha una DepthTexture (24 bit con stencil,
   come il suo buffer) e three.js la copia con il resto quando risolve i campioni. L'occlusione si calcola a metà
   risoluzione (stile SAO: campioni a spirale, normali ricostruite dalla profondità), si sfoca tenendo conto della
   profondità e scurisce solo la luce della scena, prima del bagliore. FXAA lavora sull'immagine finale in sRGB e
   ammorbidisce i bordi che il multicampionamento non tocca (riflessi, guard rail sottili, texture lontane).
   Con lo schermo diviso in due l'occlusione resta spenta.
   ========================================================= */
const PPX={ao:true,aa:true,ok:false,w:0,h:0,a:null,b:null,ldr:null,inv:new THREE.Matrix4()};
try{const s=JSON.parse(localStorage.getItem('vespera-gfx')||'null');if(s){PPX.ao=s.ao!==false;PPX.aa=s.aa!==false;}
  else if(window.matchMedia&&matchMedia('(pointer:coarse)').matches)PPX.ao=false;}catch(e){}
function ppxSave(){try{localStorage.setItem('vespera-gfx',JSON.stringify({ao:PPX.ao,aa:PPX.aa}));}catch(e){}}
const PPX_RT={type:THREE.UnsignedByteType,format:THREE.RGBAFormat,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:false,depthBuffer:false};
/* render target della scena con la profondità leggibile, e quelli dell'occlusione e dell'immagine finale */
{const f=ppEnsure;ppEnsure=function(w,h){const was=PP.rt;f(w,h);if(PP.rt===was&&PPX.a)return;
  if(PP.rt!==was){const dt=new THREE.DepthTexture(w,h);dt.format=THREE.DepthStencilFormat;dt.type=THREE.UnsignedInt248Type;PP.rt.depthTexture=dt;}
  [PPX.a,PPX.b,PPX.ldr].forEach(t=>t&&t.dispose());PPX.w=Math.max(1,w>>1);PPX.h=Math.max(1,h>>1);
  PPX.a=new THREE.WebGLRenderTarget(PPX.w,PPX.h,PPX_RT);PPX.b=new THREE.WebGLRenderTarget(PPX.w,PPX.h,PPX_RT);PPX.ldr=new THREE.WebGLRenderTarget(w,h,PPX_RT);};}
const PPX_DEPTH=`uniform sampler2D tDepth;uniform mat4 uInv;
  vec3 vpos(vec2 uv){float d=texture2D(tDepth,uv).x;vec4 p=uInv*vec4(uv*2.0-1.0,d*2.0-1.0,1.0);return p.xyz/p.w;}`;
/* occlusione: 14 campioni su una spirale ruotata a caso per pixel, raggio di 1,4 m proiettato sullo schermo; si spegne oltre ~120 m */
const ppAO=ppMat({tDepth:{value:null},uInv:{value:new THREE.Matrix4()},uRes:{value:new THREE.Vector2()},uPy:{value:1},uRad:{value:1.4}},
  `${PPX_DEPTH}uniform vec2 uRes;uniform float uPy,uRad;varying vec2 vUv;
  float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){float d=texture2D(tDepth,vUv).x;if(d>=0.99999){gl_FragColor=vec4(1.0);return;}
    vec3 P=vpos(vUv);vec2 px=1.0/uRes;
    vec3 a=vpos(vUv+vec2(px.x,0.0)),b=vpos(vUv-vec2(px.x,0.0)),c=vpos(vUv+vec2(0.0,px.y)),e=vpos(vUv-vec2(0.0,px.y));
    vec3 dx=abs(a.z-P.z)<abs(b.z-P.z)?a-P:P-b,dy=abs(c.z-P.z)<abs(e.z-P.z)?c-P:P-e;vec3 N=normalize(cross(dx,dy));
    float z=-P.z,ss=min(uRad*uPy*0.5/z,0.09),r2=uRad*uRad,a0=hash(gl_FragCoord.xy)*6.2831853,occ=0.0;
    for(int i=0;i<14;i++){float t=(float(i)+0.5)/14.0,an=a0+float(i)*2.3999632;vec2 o=vec2(cos(an),sin(an))*ss*t;
      vec3 v=vpos(vUv+o)-P;float vv=dot(v,v),vn=dot(v,N);occ+=max(0.0,vn/sqrt(vv+1e-4)-0.05)*max(0.0,1.0-vv/r2);}
    float ao=1.0-occ/14.0*3.6*(1.0-smoothstep(60.0,120.0,z));gl_FragColor=vec4(vec3(clamp(ao,0.0,1.0)),1.0);}`);
/* sfocatura separabile che non attraversa i salti di profondità (il bordo di un'auto non sporca la strada dietro) */
const ppAOBlur=ppMat({tSrc:{value:null},tDepth:{value:null},uInv:{value:new THREE.Matrix4()},uDir:{value:new THREE.Vector2()}},
  `${PPX_DEPTH}uniform sampler2D tSrc;uniform vec2 uDir;varying vec2 vUv;
  void main(){float z0=-vpos(vUv).z,s=0.0,w=0.0;
    for(int i=-3;i<=3;i++){vec2 uv=vUv+uDir*float(i);float zi=-vpos(uv).z,k=exp(-abs(zi-z0)/(0.04*z0+0.05))*(1.0-abs(float(i))/4.0);s+=texture2D(tSrc,uv).r*k;w+=k;}
    gl_FragColor=vec4(vec3(s/max(w,1e-4)),1.0);}`);
/* FXAA nella versione semplice di NVIDIA: cerca la direzione del bordo dalla luminanza e media lungo quella */
const ppFXAA=ppMat({tSrc:{value:null},uTexel:{value:new THREE.Vector2()}},
  `uniform sampler2D tSrc;uniform vec2 uTexel;varying vec2 vUv;
  float lum(vec3 c){return dot(c,vec3(0.299,0.587,0.114));}
  void main(){vec3 cNW=texture2D(tSrc,vUv+vec2(-1.0,-1.0)*uTexel).rgb,cNE=texture2D(tSrc,vUv+vec2(1.0,-1.0)*uTexel).rgb,
      cSW=texture2D(tSrc,vUv+vec2(-1.0,1.0)*uTexel).rgb,cSE=texture2D(tSrc,vUv+vec2(1.0,1.0)*uTexel).rgb,cM=texture2D(tSrc,vUv).rgb;
    float lNW=lum(cNW),lNE=lum(cNE),lSW=lum(cSW),lSE=lum(cSE),lM=lum(cM);
    float lMin=min(lM,min(min(lNW,lNE),min(lSW,lSE))),lMax=max(lM,max(max(lNW,lNE),max(lSW,lSE)));
    if(lMax-lMin<max(0.0312,lMax*0.125)){gl_FragColor=vec4(cM,1.0);return;}
    vec2 dir=vec2(-((lNW+lNE)-(lSW+lSE)),(lNW+lSW)-(lNE+lSE));
    float red=max((lNW+lNE+lSW+lSE)*0.03125,0.0078125),rcp=1.0/(min(abs(dir.x),abs(dir.y))+red);
    dir=clamp(dir*rcp,vec2(-8.0),vec2(8.0))*uTexel;
    vec3 A=0.5*(texture2D(tSrc,vUv+dir*(1.0/3.0-0.5)).rgb+texture2D(tSrc,vUv+dir*(2.0/3.0-0.5)).rgb);
    vec3 B=A*0.5+0.25*(texture2D(tSrc,vUv-dir*0.5).rgb+texture2D(tSrc,vUv+dir*0.5).rgb);
    float lB=lum(B);gl_FragColor=vec4((lB<lMin||lB>lMax)?A:B,1.0);}`);
/* la composizione finale moltiplica la luce della scena per l'occlusione, prima del bagliore */
ppComp.uniforms.tAO={value:null};ppComp.uniforms.uAO={value:0};
ppComp.fragmentShader=ppComp.fragmentShader.replace('uniform float uExp,','uniform sampler2D tAO;uniform float uAO;uniform float uExp,')
  .replace('vec3 c=texture2D(tScene,uv).rgb;','vec3 c=texture2D(tScene,uv).rgb;if(uAO>0.0)c*=mix(1.0,texture2D(tAO,vUv).r,uAO);');
ppComp.needsUpdate=true;
{const f=ppFinal;ppFinal=function(views,W,H){
  const ao=PPX.ao&&views.length===1&&PP.rt&&PP.rt.depthTexture&&PPX.a,cam=views[0].cam;ppComp.uniforms.uAO.value=0;
  if(ao){PPX.inv.copy(cam.projectionMatrix).invert();const dt=PP.rt.depthTexture;
    const U=ppAO.uniforms;U.tDepth.value=dt;U.uInv.value.copy(PPX.inv);U.uRes.value.set(PPX.w,PPX.h);U.uPy.value=cam.projectionMatrix.elements[5];ppPass(ppAO,PPX.a);
    const Bu=ppAOBlur.uniforms;Bu.tDepth.value=dt;Bu.uInv.value.copy(PPX.inv);
    Bu.tSrc.value=PPX.a.texture;Bu.uDir.value.set(1/PPX.w,0);ppPass(ppAOBlur,PPX.b);Bu.tSrc.value=PPX.b.texture;Bu.uDir.value.set(0,1/PPX.h);ppPass(ppAOBlur,PPX.a);
    ppComp.uniforms.tAO.value=PPX.a.texture;ppComp.uniforms.uAO.value=TRK.tod==='night'?0.7:0.9;}
  if(!PPX.aa||!PPX.ldr)return f(views,W,H);
  renderer.setScissorTest(false);PP.quad.material=ppComp;renderer.setRenderTarget(PPX.ldr);renderer.render(PP.scene,PP.cam);
  ppFXAA.uniforms.tSrc.value=PPX.ldr.texture;ppFXAA.uniforms.uTexel.value.set(1/PPX.ldr.width,1/PPX.ldr.height);
  renderer.setRenderTarget(null);renderer.setViewport(0,0,W,H);PP.quad.material=ppFXAA;renderer.render(PP.scene,PP.cam);};}
/* comandi in Impostazioni → Grafica */
{const box=document.getElementById('trkFxShadow');if(box&&box.parentNode){
  for(const [id,txt,k] of [['trkFxAO','Occlusione ambientale (SSAO): angoli e contatti più scuri','ao'],['trkFxAA','Bordi più morbidi (FXAA)','aa']]){
    const b=document.createElement('button');b.className='tog';b.id=id;b.textContent=txt;box.parentNode.appendChild(b);
    toggle(id,v=>{PPX[k]=v;ppxSave();});setPressed(id,PPX[k]);}}}
