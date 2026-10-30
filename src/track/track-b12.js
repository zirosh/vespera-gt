/* =========================================================
   Traiettoria consigliata: una striscia sulla linea ideale, davanti alla tua auto, colorata in base alla tua velocità.
   Verde: puoi dare gas. Giallo: alza il piede. Rosso: frena adesso. Il profilo di velocità è quello calcolato da lapSim
   per la tua auto (ali, massa, potenza, gomme, danni), corretto per l'acqua e lo stato delle gomme come fanno i piloti del computer
   ========================================================= */
const TRK_LINE={on:true,mesh:null,n:230};
try{const s=localStorage.getItem('vespera-line');if(s!=null)TRK_LINE.on=s==='1';}catch(e){}
function trkLineBuild(){
  const n=TRK_LINE.n,g=new THREE.BufferGeometry(),pos=new Float32Array(n*2*3),col=new Float32Array(n*2*4),idx=[];
  for(let j=0;j<n-1;j++){const a=j*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  g.setIndex(idx);g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('lcol',new THREE.BufferAttribute(col,4));
  g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),1e5);
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,
    vertexShader:'attribute vec4 lcol;varying vec4 vC;void main(){vC=lcol;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec4 vC;void main(){gl_FragColor=vec4(vC.rgb*1.6,vC.a);}'});
  const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=2;mesh.visible=false;return mesh;
}
/* colori: rapporto tra la decelerazione che servirebbe da qui per arrivare a quel punto alla velocità giusta e quella che le gomme danno */
const TRK_LCOL={go:[0.18,0.85,0.35],lift:[1.0,0.78,0.12],brake:[1.0,0.16,0.12]};
function trkLineUpdate(P){
  const M=TRK_LINE.mesh,T=TRK.T,RL=TRK.RL,N=T.N,S=P.dmgSim||P.sim,c=P.car;if(!M||!S||!S.v)return false;
  const g=M.geometry,pos=g.attributes.position.array,col=g.attributes.lcol.array,n=TRK_LINE.n,hw=0.5;
  const gNow=trkWxGrip(P.tire,trkWetAt(c.i,RL.e[c.i])),gf=Math.sqrt(Math.min(trkTireF(P.Tf,P.Wf,P.tire),trkTireF(P.Tr,P.Wr,P.tire))),
    pk=0.985*gf*Math.sqrt(gNow/Math.max(0.3,P.simG||1)),v=Math.max(0,c.vx),aB=Math.max(5,(P.lastG||P.veh.m*9.81)/P.veh.m*0.92);
  const i0=(c.i+3)%N;
  for(let j=0;j<n;j++){const k=(i0+j)%N,s=Math.max(1,(j+3)*T.ds),vt=S.v[k]*pk,need=(v*v-vt*vt)/(2*s),q=need/aB;
    const X=RL.X[k],Y=RL.Y[k],y=T.h[k]+0.05,nx=T.nx[k],ny=T.ny[k];
    pos.set([X-nx*hw,y,-(Y-ny*hw),X+nx*hw,y,-(Y+ny*hw)],j*6);
    let C;if(q>0.8)C=TRK_LCOL.brake;else if(q>0.3){const t=smooth01(q,0.3,0.8);C=TRK_LCOL.lift.map((a,u)=>a+(TRK_LCOL.brake[u]-a)*t*t);}
    else{const t=smooth01(q,0.05,0.3);C=TRK_LCOL.go.map((a,u)=>a+(TRK_LCOL.lift[u]-a)*t);}
    const al=0.8*smooth01(j,0,10)*(1-smooth01(j,n-50,n-1));
    for(const o of [0,4])col.set([C[0],C[1],C[2],al],j*8+o);}
  g.attributes.position.needsUpdate=true;g.attributes.lcol.needsUpdate=true;return true;
}
{const f=trkBuildWorld;trkBuildWorld=function(){const was=TRK.built;f();if(!was||!TRK_LINE.mesh||TRK_LINE.mesh.parent!==TRK.tw){TRK_LINE.mesh=trkLineBuild();TRK.tw.add(TRK_LINE.mesh);}};}
/* ogni vista mostra la striscia del suo giocatore; niente striscia per il computer, nei replay e nel giro ideale automatico */
{const f=trkPrepView;trkPrepView=function(v){f(v);const M=TRK_LINE.mesh;if(!M)return;const P=v.P;
  M.visible=TRK_LINE.on&&!TRK.replay.on&&!!P&&!P.isAI&&!P.pit&&!(P.id===0&&!TRK.duo&&TRK.mode==='auto')&&trkLineUpdate(P);};}
toggle('trkLine',v=>{TRK_LINE.on=v;try{localStorage.setItem('vespera-line',v?'1':'0');}catch(e){}});setPressed('trkLine',TRK_LINE.on);
