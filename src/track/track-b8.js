/* =========================================================
   Interfaccia da videogioco: tema scuro del garage, schede e pulsanti angolari, pannello delle prestazioni con il pulsante
   per scendere in pista, contagiri circolare con le luci di cambiata, tasti accanto ai comandi, schermata di caricamento
   ========================================================= */
document.documentElement.classList.add('gm');document.documentElement.dataset.theme='dark';
/* contagiri: arco riempito fino ai giri attuali, luci di cambiata da verde a rosso, lampeggio azzurro al limitatore */
function trkDial(P,rpm){
  const E=P.el;if(!E.fill)return;const f=clamp(rpm/8000,0,1);
  if(Math.abs((E._f||0)-f)>0.002){E._f=f;E.fill.style.strokeDasharray=`${(f*100).toFixed(1)} 100`;}
  const lit=Math.round(clamp((rpm-5400)/(7650-5400),0,1)*10),lim=rpm>7650&&P.thr>0.5,blink=lim&&(TRK.clock*12)%2<1,key=lit+(blink?'b':'');
  if(E.tyres&&P.ws){for(let k=0;k<4;k++){const s=P.ws[k],c=s<0.7?'#3ee07f':s<1?'#ffd23a':s<1.6?'#ff7a2b':'#ff3b2f',kk=c+(P.wsf&&P.wsf[k]!=='asfalto'?'o':'');if(E.tyres[k]._c!==kk){E.tyres[k]._c=kk;E.tyres[k].style.background=c;E.tyres[k].classList.toggle('off',kk.endsWith('o'));}}}
  if(E._led!==key){E._led=key;E.leds.forEach((l,k)=>{l.className=k<lit?(blink?'on b':k<4?'on g':k<7?'on y':'on r'):'';});}
}
/* tasti mostrati sui pulsanti della pista */
{const K={thPanel:'Tab',thBox:'B',thReplayBtn:'P',thCamBtn:'C',thReset:'R',thExit:'Esc'};for(const id in K){const b=document.getElementById(id);if(b)b.dataset.k=K[id];}}
document.addEventListener('keydown',e=>{if(e.code==='Tab'&&TRK.on&&!e.target.closest('input,select,textarea')){e.preventDefault();document.documentElement.classList.toggle('panel-open');}});

/* ---------- garage: prestazioni dell'auto e grande pulsante per partire ---------- */
const GM={dock:null,bars:null,car:null,lastKey:''};
{const d=document.createElement('div');d.className='gm-dock';d.id='gmDock';
  d.innerHTML=`<div class="gm-stats"><div class="gm-car"><small>Auto in garage</small><b id="gmCar">Vespera GT</b><span id="gmTrack"></span></div><div class="gm-bars" id="gmBars"></div></div>
    <button class="gm-go" id="gmGo"><span>In pista</span><small>Invio · <b>≡</b> sul controller</small></button>`;
  document.body.appendChild(d);GM.dock=d;GM.bars=d.querySelector('#gmBars');GM.car=d.querySelector('#gmCar');GM.trk=d.querySelector('#gmTrack');
  d.querySelector('#gmGo').onclick=()=>{if(!TRK.on&&busy.hidden)document.getElementById('trkGo').click();};}
document.addEventListener('keydown',e=>{if(e.code==='Enter'&&!TRK.on&&busy.hidden&&!e.target.closest('input,select,textarea,button')){e.preventDefault();document.getElementById('trkGo').click();}});
function trkGarageStats(){
  const H=document.documentElement,show=!TRK.on&&!H.classList.contains('tunnel')&&document.getElementById('legend').hidden;GM.dock.hidden=!show;if(!show)return;
  let V;try{V=trkVehicle();}catch(e){return;}if(!V)return;
  const vtop=(()=>{const P=V.kw*1000*0.92;let lo=5,hi=160;for(let it=0;it<40;it++){const v=(lo+hi)/2;if(P-(V.aero(v).D+0.012*V.m*9.81)*v>0)lo=v;else hi=v;}return lo*3.6;})();
  const A=V.aero(200/3.6),down=(A.Ff+A.Fr)/9.81,cx=A.D/(0.5*1.225*(200/3.6)**2);
  const rows=[['Potenza',`${Math.round(V.kw)} kW`,V.kw/700],['Peso',`${Math.round(V.m)} kg`,1-(V.m-900)/1400],['Rapporto peso/potenza',`${(V.m/V.kw).toFixed(2)} kg/kW`,1-(V.m/V.kw-1.5)/5],
    ['Deportanza a 200 km/h',`${Math.round(down)} kg`,(down+100)/700],['Velocità massima',`${Math.round(vtop)} km/h`,(vtop-150)/250],['Resistenza (CdA)',`${cx.toFixed(2)} m²`,1-(cx-0.3)/1.2]];
  const key=rows.map(r=>r[1]).join('|')+(state.lab?'L':'V');if(key===GM.lastKey)return;GM.lastKey=key;
  GM.car.textContent=state.lab?'Prototipo del laboratorio':'Vespera GT';
  GM.bars.innerHTML=rows.map(([n,v,k])=>`<div class="gm-bar"><div><span>${n}</span><b>${v}</b></div><i><s style="width:${(clamp(k,0.04,1)*100).toFixed(0)}%"></s></i></div>`).join('');
}
setInterval(trkGarageStats,700);setTimeout(trkGarageStats,400);

/* ---------- schermata di caricamento con il nome del circuito e un consiglio ---------- */
const TRK_TIPS=['Con il controllo di trazione spento, in prima e seconda dosa il gas: 460 kW fanno pattinare le gomme posteriori.',
  'Una ruota sull\'erba o sul cordolo ha meno aderenza delle altre: in curva tira l\'auto da quella parte.',
  'Frenando senza ABS, se le ruote si bloccano l\'auto non sterza: rilascia un poco il freno.',
  'Sul bagnato la traiettoria si asciuga per prima: restaci sopra finché non monti le gomme da pioggia.',
  'In scia l\'auto davanti ti toglie aria: meno resistenza sul dritto, ma anche meno deportanza in curva.',
  'Le gomme rendono al meglio in temperatura: il primo giro tienile calde senza esagerare.',
  'Premi B (o X sul controller) per chiedere la sosta ai box e scegliere la mescola.',
  'Tab apre le impostazioni senza uscire dalla pista; Esc mette in pausa.'];
function trkLoadScreen(on){
  if(on){busy.classList.add('gm-load');busy.innerHTML=`<div class="gl-in"><small>${TRK.champRace&&typeof CH!=='undefined'&&CH?`Coppa Vespera · gara ${CH.round+1} di ${CH_ROUNDS.length}`:TRK.duo?'Gara':'Prove libere'}</small><h2>${TRKDEF.banner||'Circuito'}</h2><div class="gl-bar"><i></i></div><p>${TRK_TIPS[Math.floor(Math.random()*TRK_TIPS.length)]}</p></div>`;}
  else{busy.classList.remove('gm-load');}
}

/* ---------- scelta del circuito: schede con il disegno del tracciato, lunghezza e dislivello ---------- */
function trkDefInfo(d){
  if(d._info)return d._info;const pts=trkSpline(d.pts,10);let L=0,hmin=1e9,hmax=-1e9;
  const hh=(X,Y)=>{let h=0;for(const [x,y,a,s] of d.hills){h+=a*Math.exp(-((X-x)**2+(Y-y)**2)/(2*s*s));}return h;};
  pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];L+=Math.hypot(q[0]-p[0],q[1]-p[1]);const h=hh(p[0],p[1]);hmin=Math.min(hmin,h);hmax=Math.max(hmax,h);});
  return d._info={pts,L,dh:hmax-hmin,hh};
}
function trkDrawPreview(cv,d,acc){
  const I=trkDefInfo(d),g=cv.getContext('2d'),W=cv.width,H=cv.height;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(const [x,y] of I.pts){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  const s=Math.min((W-16)/(x1-x0),(H-16)/(y1-y0)),ox=(W-(x1-x0)*s)/2,oy=(H-(y1-y0)*s)/2,tf=(x,y)=>[ox+(x-x0)*s,H-(oy+(y-y0)*s)];
  g.clearRect(0,0,W,H);g.lineJoin='round';g.lineCap='round';
  g.beginPath();I.pts.forEach(([x,y],i)=>{const [a,b]=tf(x,y);i?g.lineTo(a,b):g.moveTo(a,b);});g.closePath();g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=7;g.stroke();
  /* colore lungo il tracciato secondo la quota */
  const hm=Math.max(1,I.dh);for(let i=0;i<I.pts.length;i++){const p=I.pts[i],q=I.pts[(i+1)%I.pts.length],k=clamp(I.hh(p[0],p[1])/hm,0,1);
    const [a,b]=tf(p[0],p[1]),[c,e]=tf(q[0],q[1]);g.strokeStyle=`hsl(${195-185*k},90%,${60+8*k}%)`;g.lineWidth=3.2;g.beginPath();g.moveTo(a,b);g.lineTo(c,e);g.stroke();}
  const [sx,sy]=tf(-60,0);g.fillStyle='#fff';g.fillRect(sx-1.5,sy-5,3,10);
}
function trkTrackCards(){
  const box=document.getElementById('trkTrack');if(!box)return;box.classList.add('trk-cards');
  box.querySelectorAll('button').forEach((b,i)=>{const d=TRK_DEFS[i],I=trkDefInfo(d);if(b._card)return;b._card=true;
    b.innerHTML=`<canvas width="180" height="120"></canvas><b>${d.short}</b><small>${(I.L/1000).toFixed(2).replace('.',',')} km · ${Math.round(I.dh)} m</small>`;
    trkDrawPreview(b.querySelector('canvas'),d);b.title=d.name;});
}
trkTrackCards();
/* nel garage: circuito scelto con le frecce per cambiarlo */
{const st=GM.dock.querySelector('.gm-stats'),w=document.createElement('div');w.className='gm-track';
  w.innerHTML=`<button class="gm-arr" data-d="-1" aria-label="Circuito precedente">◀</button><canvas width="132" height="88"></canvas><div><small>Circuito</small><b></b><span></span></div><button class="gm-arr" data-d="1" aria-label="Circuito successivo">▶</button>`;
  st.insertBefore(w,st.querySelector('.gm-bars'));GM.tcv=w.querySelector('canvas');GM.tname=w.querySelector('b');GM.tinfo=w.querySelector('span');
  w.querySelectorAll('.gm-arr').forEach(b=>b.onclick=()=>{const n=TRK_DEFS.length,k=((TRK.trackId+ +b.dataset.d)%n+n)%n,btn=document.querySelectorAll('#trkTrack button')[k];if(btn)btn.click();trkGarageTrack();});}
function trkGarageTrack(){const d=TRK_DEFS[TRK.trackId]||TRK_DEFS[0],I=trkDefInfo(d);if(GM.tId===TRK.trackId)return;GM.tId=TRK.trackId;
  trkDrawPreview(GM.tcv,d);GM.tname.textContent=d.short;GM.tinfo.textContent=`${(I.L/1000).toFixed(2).replace('.',',')} km · ${Math.round(I.dh)} m di dislivello`;GM.trk.textContent='';}
setInterval(trkGarageTrack,500);setTimeout(trkGarageTrack,300);
