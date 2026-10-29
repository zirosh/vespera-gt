/* =========================================================
   Ventola aspirante (come la Brabham BT46B o la McMurtry Spéirling): una ventola in coda, mossa dal motore, aspira l'aria
   da sotto il fondo; le minigonne laterali sigillano i lati. La depressione sotto l'auto la schiaccia a terra anche da ferma.
   Modello: la ventola deve smaltire l'aria che entra dalle fessure sui bordi del fondo. Con potenza P e rendimento η:
   P·η = Q·Δp,  Q = Cd·A_fessura·√(2Δp/ρ)  ⇒  Δp = (P·η / (Cd·A_fessura·√(2/ρ)))^(2/3),  carico = Δp · area del fondo.
   Con le minigonne la fessura è di un centimetro; senza, è l'altezza da terra. Su cordoli, erba e dossi la tenuta si perde
   ========================================================= */
const FAN={on:false,kw:40,skirts:true,g:null,rotor:null,cl:null};
try{const s=JSON.parse(localStorage.getItem('vespera-fan')||'null');if(s){FAN.on=!!s.on;FAN.kw=clamp(+s.kw||40,10,80);FAN.skirts=s.skirts!==false;}}catch(e){}
function fanSave(){try{localStorage.setItem('vespera-fan',JSON.stringify({on:FAN.on,kw:FAN.kw,skirts:FAN.skirts}));}catch(e){}}
const FAN_AREA=4.2,FAN_PERIM=11.5,FAN_ETA=0.45,FAN_CD=0.62;
/* carico della ventola (N) con tenuta 0..1 (1 = fondo sigillato come previsto) */
function fanForce(kw,skirts,ride,seal){
  if(kw<=0||seal<=0)return 0;const gap=skirts?0.012:Math.max(0.04,ride),A=FAN_PERIM*gap/Math.max(0.15,seal);
  const dp=Math.pow(kw*1000*FAN_ETA/(FAN_CD*A*Math.sqrt(2/1.225)),2/3);return Math.min(dp,9000)*FAN_AREA;
}
/* l'auto del giocatore con la ventola: carico costante in più (45 % davanti), potenza tolta al motore, 28 kg di ventola e minigonne */
function fanVeh(V){
  if(!FAN.on||!V)return V;const A0=V.aero,F0=fanForce(FAN.kw,FAN.skirts,SETUP.ride,1);V.fan={F0,kw:FAN.kw};V.fanK=1;
  V.kw=Math.max(40,V.kw-FAN.kw);V.m+=28;V.aero=v=>{const a=A0(v),F=F0*(V.fanK==null?1:V.fanK);return {D:a.D,Ff:a.Ff+F*0.45,Fr:a.Fr+F*0.55};};V._gear=null;V.name=(V.name||'')+' · ventola';return V;
}
{const f=trkVehicle;trkVehicle=function(){return fanVeh(f());};}
/* in pista la tenuta dipende da cosa c'è sotto le ruote, dai salti e dalle compressioni; la ventola impiega mezzo secondo a riprendere */
{const f=trkPhysics;trkPhysics=function(P,h){const V=P.veh;if(V&&V.fan){let s=1;
    if(P.air)s=0;else{if(P.wsf)for(const w of P.wsf)s-=w==='cordolo'?0.12:w==='asfalto'?0:0.22;if(P.gm<0.7)s*=smooth01(P.gm,0.2,0.7);}
    P.fanS=(P.fanS==null?1:P.fanS)+(Math.max(0,s)-(P.fanS==null?1:P.fanS))*Math.min(1,h*(s<(P.fanS||1)?14:2.2));
    V.fanK=fanForce(V.fan.kw,FAN.skirts,SETUP.ride,P.fanS)/Math.max(1,V.fan.F0);}
  f(P,h);};}

/* ---------- aspetto: ventola in coda con le pale che girano, minigonne lungo le fiancate ---------- */
function fanBuildVisual(){
  const g=new THREE.Group(),dark=new THREE.MeshStandardMaterial({color:0x17191c,metalness:0.5,roughness:0.45}),alu=new THREE.MeshStandardMaterial({color:0xb9bec4,metalness:0.85,roughness:0.3}),
    rub=new THREE.MeshStandardMaterial({color:0x101113,roughness:0.85});
  const shroud=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.16,40,1,true),dark);shroud.rotation.z=Math.PI/2;shroud.material.side=THREE.DoubleSide;g.add(shroud);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(0.36,0.025,8,40),alu);lip.rotation.y=Math.PI/2;lip.position.x=-0.08;g.add(lip);
  const back=new THREE.Mesh(new THREE.CircleGeometry(0.355,40),new THREE.MeshStandardMaterial({color:0x0b0c0e,roughness:0.9,side:THREE.DoubleSide}));back.rotation.y=-Math.PI/2;back.position.x=0.06;g.add(back);
  const rotor=new THREE.Group();g.add(rotor);const blade=new THREE.MeshStandardMaterial({color:0x5d636a,metalness:0.7,roughness:0.35});
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,0.12,16),alu);hub.rotation.z=Math.PI/2;rotor.add(hub);
  for(let k=0;k<9;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(0.025,0.27,0.12),blade);b.position.y=0.18;b.rotation.y=0.5;const a=new THREE.Group();a.rotation.x=k/9*Math.PI*2;a.add(b);rotor.add(a);}
  const grid=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.008,4,30),dark);grid.rotation.y=Math.PI/2;grid.position.x=-0.085;g.add(grid);
  for(let k=0;k<3;k++){const s=new THREE.Mesh(new THREE.BoxGeometry(0.01,0.72,0.016),dark);s.position.x=-0.085;s.rotation.x=k/3*Math.PI;g.add(s);}
  const housing=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.42,0.34,40),dark);housing.rotation.z=Math.PI/2;housing.position.x=0.24;g.add(housing);
  const out=new THREE.Group();g.position.set(-2.5,0.55,0);out.add(g);
  const skirts=new THREE.Group();for(const z of [-0.88,0.88]){const sk=new THREE.Mesh(new THREE.BoxGeometry(1.95,0.12,0.03),rub);sk.position.set(0,0.085,z);skirts.add(sk);}out.add(skirts);
  return {root:out,rotor,skirts};
}
function fanAttach(){
  if(!FAN.g){FAN.g=fanBuildVisual();chassis.add(FAN.g.root);}
  FAN.g.root.visible=FAN.on;FAN.g.skirts.visible=FAN.on&&FAN.skirts;
}
setTimeout(fanAttach,0);
/* la tua auto in pista (copia alleggerita): stessa ventola, aggiunta a parte */
function fanP1Vis(){const P=TRK.p[0];if(P.fanVis){P.fanVis.root.parent&&P.fanVis.root.parent.remove(P.fanVis.root);P.fanVis=null;}
  if(FAN.on&&P.vis&&P.vis.kind==='vespera'&&P.vis.chassis){P.fanVis=fanBuildVisual();P.vis.chassis.add(P.fanVis.root);P.fanVis.skirts.visible=FAN.skirts;}}
{const f=trkSetupField;trkSetupField=function(){f();fanP1Vis();};}
/* rotazione delle pale: in garage col motore acceso, in pista sempre (più veloci con il gas) */
const fanClock={t:performance.now()};
(function fanSpin(){requestAnimationFrame(fanSpin);const now=performance.now(),dt=Math.min(0.05,(now-fanClock.t)/1000);fanClock.t=now;if(!FAN.on)return;
  const sp=(TRK.on?60+40*(TRK.p[0].thr||0):engine.on?45:0)*dt;if(FAN.g)FAN.g.rotor.rotation.x+=sp;const P=TRK.p[0];if(P.fanVis)P.fanVis.rotor.rotation.x+=sp;})();

/* ---------- scheda nella sezione Ali ---------- */
{const card=document.createElement('div');card.className='wcard';card.id='wc-fan';
  card.innerHTML=`<div class="whead"><span>Ventola aspirante</span><button class="sw" id="w-fan-on" aria-pressed="false" aria-label="Monta la ventola aspirante"></button></div>
    <div class="wbody" id="w-fan-body" hidden>
      <p class="note">Una ventola in coda, mossa dal motore, aspira l'aria da sotto il fondo: l'auto resta incollata a terra anche da ferma e in curva lenta, dove le ali non servono. Toglie potenza al motore e perde tenuta su cordoli, erba e dossi.</p>
      <div><div class="wrow"><label for="w-fan-kw">Potenza della ventola</label><output id="w-fan-kwOut"></output></div><input type="range" id="w-fan-kw" min="10" max="80" step="5"></div>
      <div class="toggles" style="grid-template-columns:1fr"><button class="tog" id="w-fan-sk" aria-pressed="true">Minigonne laterali (sigillano il fondo)</button></div>
      <dl class="readout" id="w-fan-res"></dl></div>`;
  const wc=document.getElementById('wingCards');wc.appendChild(card);
  const on=card.querySelector('#w-fan-on'),body=card.querySelector('#w-fan-body'),kw=card.querySelector('#w-fan-kw'),kwo=card.querySelector('#w-fan-kwOut'),sk=card.querySelector('#w-fan-sk'),res=card.querySelector('#w-fan-res');
  const sync=()=>{on.setAttribute('aria-pressed',FAN.on);card.dataset.on=FAN.on;body.hidden=!FAN.on;kw.value=FAN.kw;kwo.textContent=`${FAN.kw} kW · ${Math.round(FAN.kw*1.36)} CV`;sk.setAttribute('aria-pressed',FAN.skirts);
    const F=fanForce(FAN.kw,FAN.skirts,SETUP.ride,1),dp=F/FAN_AREA,kwLeft=Math.max(40,(TRK.kw||460)-FAN.kw);
    res.innerHTML=`<dt>Depressione sotto il fondo</dt><dd>${fmt(dp)} Pa</dd><dt>Carico, a qualsiasi velocità</dt><dd>${fmt(F/9.81)} kg</dd><dt>Davanti / dietro</dt><dd>45 / 55 %</dd><dt>Potenza alle ruote</dt><dd>${fmt(kwLeft)} kW</dd><dt>Peso in più</dt><dd>28 kg</dd>`;};
  const changed=()=>{fanSave();fanAttach();sync();wingsVer++;try{trkDirty();}catch(e){}try{updateReadout();}catch(e){}if(TRK.on){try{trkCompute();fanP1Vis();}catch(e){}}};
  on.onclick=()=>{FAN.on=!FAN.on;changed();};kw.oninput=()=>{FAN.kw=+kw.value;changed();};sk.onclick=()=>{FAN.skirts=!FAN.skirts;changed();};
  sync();setInterval(()=>{if(!body.hidden)sync();},1500);}
/* nel cruscotto: quanto carico sta dando la ventola in questo momento */
{const f=trkHudUpdate;trkHudUpdate=function(P){f(P);const V=P.veh;if(V&&V.fan&&P.el&&P.el.aero){const F=V.fan.F0*(V.fanK||0)/9.81;P.el.aero.insertAdjacentHTML('beforeend',`<span>Ventola <b>${fmt(F)} kg</b></span>`);}};}
