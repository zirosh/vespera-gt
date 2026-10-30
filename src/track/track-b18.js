/* =========================================================
   Materiali e oggetti CC0 di Poly Haven (tools/fetch_assets.py, licenze in src/assets/LEGGIMI.md):
   asfalto da pista fotografico (colore e rilievo) su tutti i circuiti; panchine e fioriere lungo i marciapiedi del cittadino,
   barili dietro i box. I modelli glTF arrivano dopo la costruzione del mondo e vengono istanziati (un draw call per pezzo)
   ========================================================= */
{const f=trkAsphaltTex;trkAsphaltTex=function(){if(TXL.asphPH)return TXL.asphPH;
  const m=trkPhotoTex('ph-asphalt-color',true),n=trkPhotoTex('ph-asphalt-normal',false);return TXL.asphPH=m&&n?{map:m,normal:n,ph:true}:f();};}
/* scala: un quadro di asfalto ogni 3 m, rilievo un po' più marcato degli inerti generati */
{const f=trkBuildWorld;trkBuildWorld=function(){const was=TRK.built;f();if(was)return;
  if(TXL.asphPH&&TXL.asphPH.ph&&TRK.asphalt){TRK.asphalt.userData.wuv=3;TRK.asphalt.normalScale.set(0.7,0.7);}
  trkPropsPlace();};}
const PROPS={cache:{},loader:null};
/* un modello glTF diventa una lista di pezzi {geometria, materiale, matrice nel modello}, caricato una volta sola */
function trkPropLoad(name,cb){
  if(!THREE.GLTFLoader)return;const C=PROPS.cache[name];if(C){if(C.parts)cb(C.parts);else C.wait.push(cb);return;}
  const E=PROPS.cache[name]={parts:null,wait:[cb]};PROPS.loader=PROPS.loader||new THREE.GLTFLoader();
  PROPS.loader.load('assets/models/'+name+'.gltf',g=>{const parts=[];g.scene.updateMatrixWorld(true);
    g.scene.traverse(o=>{if(o.isMesh)parts.push({geo:o.geometry,mat:o.material,m:o.matrixWorld.clone()});});
    E.parts=parts;E.wait.forEach(f=>f(parts));E.wait=[];},undefined,()=>{});
}
/* posa: lista di [X, Y (piano della pista), quota, rotazione, scala] → istanze di ogni pezzo nel gruppo del circuito */
function trkPropInstances(name,list,tw){
  if(!list.length)return;trkPropLoad(name,parts=>{if(TRK.tw!==tw)return;
    const M=new THREE.Matrix4(),q=new THREE.Quaternion(),ps=new THREE.Vector3(),sc=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
    for(const p of parts){const I=new THREE.InstancedMesh(p.geo,p.mat,list.length);
      list.forEach(([X,Y,h,a,s],k)=>{ps.set(X,h,-Y);q.setFromAxisAngle(up,a);sc.set(s,s,s);M.compose(ps,q,sc).multiply(p.m);I.setMatrixAt(k,M);});
      I.castShadow=I.receiveShadow=true;I.frustumCulled=false;tw.add(I);}});
}
function trkPropsPlace(){
  const T=TRK.T,N=T.N,tw=TRK.tw,R=trkRng(131);
  /* cittadino: panchine rivolte alla strada e fioriere lungo i marciapiedi, dietro i muri */
  if(TRKDEF.urban){const bench=[],plant=[];
    for(let i=10;i<N;i+=26)for(const sg of [1,-1]){const s=sg>0?0:1;if(TRK.pitZone&&TRK.pitZone[i])continue;if(TRK.tunnel&&i>=TRK.tunnel[0]&&i<=TRK.tunnel[1])continue;
      const o=TRK.bar[s][i]+3.2,X=T.X[i]+T.nx[i]*sg*o,Y=T.Y[i]+T.ny[i]*sg*o,a=Math.atan2(T.ty[i],T.tx[i]);
      if(TRKDEF.sea&&Y>TRKDEF.sea)continue;
      if(R()<0.5)bench.push([X,Y,T.h[i],a+(sg>0?Math.PI:0),1]);else plant.push([X,Y,T.h[i],a,1]);}
    trkPropInstances('painted_wooden_bench',bench,tw);trkPropInstances('planter_box_01',plant,tw);}
  /* box: barili e pneumatici di scorta dietro le piazzole */
  if(TRK.pit){const Pd=TRK.pit,barrel=[],tyre=[];
    for(const q of Pd.box){const i=((Math.round(q)%N)+N)%N,o=trkBarQ(q)+Pd.boxOff+6.5,X=T.X[i]+T.nx[i]*o,Y=T.Y[i]+T.ny[i]*o;
      barrel.push([X+2,Y,T.h[i],R()*6.28,1]);barrel.push([X+2.7,Y+0.4,T.h[i],R()*6.28,1]);
      for(let k=0;k<4;k++)tyre.push([X-2,Y-1+k*0.01,T.h[i]+k*0.24,R()*6.28,1]);}
    trkPropInstances('barrel_03',barrel,tw);trkPropInstances('old_tyre',tyre,tw);}
}
