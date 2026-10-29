/* =========================================================
   Scheda Pista
   ========================================================= */
const trkMassEl=document.getElementById('trkMass'),trkKwEl=document.getElementById('trkKw');
function trkSyncSliders(){trkMassEl.value=TRK.mass;trkKwEl.value=TRK.kw;document.getElementById('trkMassOut').textContent=`${fmt(TRK.mass)} kg`;document.getElementById('trkKwOut').textContent=`${fmt(TRK.kw)} kW · ${fmt(TRK.kw*1.36)} CV`;}
trkMassEl.oninput=()=>{TRK.mass=+trkMassEl.value;trkSyncSliders();trkDirty();};
trkKwEl.oninput=()=>{TRK.kw=+trkKwEl.value;trkSyncSliders();trkDirty();};
seg('trkMode',[{n:'Guidi tu',v:'drive'},{n:'Giro ideale',v:'auto'}],it=>{TRK.mode=it.v;if(TRK.on&&!TRK.duo){if(TRK.dirty)trkCompute();trkReset(TRK.p[0],true);}});
seg('trkCam',TRK_CAMS,it=>trkSetCam(TRK.p[0],it.v));trkSetCam(TRK.p[0],TRK.p[0].cam);
seg('trkTires',TRK_TIRES,it=>{TRK.tire=TRK_TIRES.indexOf(it);TRK.mu=it.mu;trkSavePrefs();trkDirty();});
document.querySelectorAll('#trkTires button').forEach((b,i)=>b.setAttribute('aria-pressed',i===TRK.tire));
toggle('trkAssist',v=>{TRK.assist=v;trkSavePrefs();});setPressed('trkAssist',TRK.assist);
toggle('trkSame',v=>{TRK.same=v;});
/* due giocatori */
function trkRestartIfOn(){if(TRK.on){trkStop();setTimeout(trkStart,60);}}
function trkOppUI(){
  const el=document.getElementById('trkOpp');el.innerHTML='';
  const opts=TRK.ai?[1,3,5,7]:[0,2,4,6],cur=TRK.ai?TRK.oppAI:TRK.oppDuo;
  seg('trkOpp',opts.map(v=>({n:v===0?'Nessuna':v===1?'1 auto':`${v} auto`,v})),it=>{if(TRK.ai)TRK.oppAI=it.v;else TRK.oppDuo=it.v;trkSavePrefs();trkRestartIfOn();});
  el.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',opts[i]===cur));
}
function trkPlayersUI(){document.getElementById('trkDuo').hidden=!TRK.duo;document.getElementById('trkModeG').hidden=TRK.duo;document.getElementById('trkAiG').hidden=!(TRK.ai||(TRK.split&&TRK.oppDuo>0));
  if(TRK.duo)trkOppUI();
  document.getElementById('trkDuoNote').textContent=TRK.ai?'Le auto del computer seguono la traiettoria ideale al livello scelto (ognuna con un passo leggermente diverso), sorpassano di lato, fanno scia e si fermano ai box quando cambia il meteo. Tu guidi con WASD o con le frecce; B per il box.':'Schermo diviso: il giocatore 1 guida con W A S D (C telecamera, R per tornare in pista, B box), il giocatore 2 con le frecce (Shift destro telecamera, Invio per tornare in pista, punto per il box). Vanno anche due gamepad. Si possono aggiungere auto del computer.';
  document.getElementById('trkP2Lbl').textContent=TRK.ai?'Auto del computer':'Auto del giocatore 2 (e del computer)';document.getElementById('trkP2PLbl').textContent=TRK.ai?'Colore del computer':'Colore del giocatore 2';
  if(!TRK.on)document.getElementById('trkGo').textContent=trkGoLabel();}
seg('trkPlayers',[{n:'Da solo',v:1},{n:'Contro il computer',v:'ai'},{n:'In due',v:2}],it=>{trkSetPlayers(it.v);trkPlayersUI();trkRestartIfOn();});
seg('trkAiLvl',[{n:'Facile',v:0.88},{n:'Medio',v:0.93},{n:'Difficile',v:0.965},{n:'Massimo',v:1}],it=>{TRK.aiPace=it.v;trkSavePrefs();if(TRK.on){const a0=TRK.split?2:1;TRK.cars.forEach(P=>{if(P.isAI)P.pace=TRK.aiPace-0.009*(P.id-a0);});}});
document.querySelectorAll('#trkAiLvl button').forEach(b=>b.setAttribute('aria-pressed',b.textContent===({0.88:'Facile',0.93:'Medio',0.965:'Difficile',1:'Massimo'}[TRK.aiPace]||'Medio')));
/* condizioni: ora del giorno, meteo, usura delle gomme, fantasma */
seg('trkTod',[{n:'Giorno',v:'day'},{n:'Tramonto',v:'sunset'},{n:'Notte',v:'night'}],it=>{TRK.tod=it.v;trkSavePrefs();if(TRK.on)trkAtmo();});
document.querySelectorAll('#trkTod button').forEach((b,i)=>b.setAttribute('aria-pressed',['day','sunset','night'][i]===TRK.tod));
seg('trkWx',TRK_WX.map((w,i)=>({n:w.n,v:i})),it=>{TRK.weather=it.v;trkSavePrefs();trkWxPreset();trkDirty();
  if(TRK.on){trkWxPlan();trkAtmo();trkCompute();TRK.cars.forEach(P=>{if(P.id===0)return;P.simG=trkWxGrip(P.tire,TRK.wet);P.sim=lapSim(P.veh,TRK.RL,P.simG);});}});
document.querySelectorAll('#trkWx button').forEach((b,i)=>b.setAttribute('aria-pressed',i===TRK.weather));
seg('trkWear',[{n:'Senza usura',v:0},{n:'Normale',v:1},{n:'Accelerata',v:2}],it=>{TRK.wearMode=it.v;trkSavePrefs();});
document.querySelectorAll('#trkWear button').forEach((b,i)=>b.setAttribute('aria-pressed',i===TRK.wearMode));
toggle('trkGhost',v=>{TRK.ghostOn=v;trkSavePrefs();});setPressed('trkGhost',TRK.ghostOn);
/* circuito */
seg('trkTrack',TRK_DEFS.map((d,i)=>({n:d.name,v:i})),it=>{if(it.v===TRK.trackId)return;const was=TRK.on;if(was)trkStop();trkSetTrack(it.v);trkBoardRender();
  if(was)setTimeout(trkStart,60);else setTimeout(trkCompute,20);});
document.querySelectorAll('#trkTrack button').forEach((b,i)=>b.setAttribute('aria-pressed',i===TRK.trackId));
/* piloti del computer: caratteri ed errori */
toggle('trkAiChar',v=>{TRK.aiChar=v;trkSavePrefs();if(TRK.on)TRK.cars.forEach((P,k)=>{if(P.isAI)P.ch=v?TRK_CHARS[(P.id+TRK.charSeed)%TRK_CHARS.length]:TRK_CHAR_PLAIN;});});setPressed('trkAiChar',TRK.aiChar);
/* controller */
seg('trkPadCurve',[{n:'Lineare',v:0},{n:'Progressivo',v:1},{n:'Molto progressivo',v:2}],it=>{TRK.padCurve=it.v;trkSavePrefs();});
document.querySelectorAll('#trkPadCurve button').forEach((b,i)=>b.setAttribute('aria-pressed',i===TRK.padCurve));
toggle('trkPadVib',v=>{TRK.padVib=v;trkSavePrefs();if(v&&TRK.on)trkRumble(TRK.p[0],0.4,0.4,150);});setPressed('trkPadVib',TRK.padVib);
/* classifica condivisa */
seg('trkBoardFilter',[{n:'Tutte le auto',v:'all'},{n:'La tua auto',v:'same'}],it=>{BOARD.filter=it.v;trkBoardRender();});
toggle('trkBoardOn',v=>{TRK.boardOn=v;trkSavePrefs();trkBoardRender();});setPressed('trkBoardOn',TRK.boardOn);
toggle('trkFxPost',v=>{TRK.fxPost=v;trkSavePrefs();if(TRK.on)trkPostOn();});setPressed('trkFxPost',TRK.fxPost);
toggle('trkFxRefl',v=>{TRK.fxRefl=v;trkSavePrefs();if(TRK.on)trkPostOn();});setPressed('trkFxRefl',TRK.fxRefl);
toggle('trkFxShadow',v=>{TRK.fxShadow=v;trkSavePrefs();if(TRK.on)trkShadowCfg(true);});setPressed('trkFxShadow',TRK.fxShadow);
document.getElementById('thBox').onclick=()=>trkPitToggle(TRK.p[0]);
document.getElementById('thReplayBtn').onclick=()=>{TRK.replay.on?trkReplayStop():trkReplayStart();};
{const sel=document.getElementById('trkP2Car');
 const opts=[['same','Uguale a quella del giocatore 1'],['mix','Miste: forme diverse'],['vespera','Vespera GT (con le ali attuali)'],...Object.keys(LAB_PRESETS).filter(k=>k!=='vespera').map(k=>[k,LAB_PRESETS[k].name])];
 sel.innerHTML=opts.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');sel.value=TRK.p2key;if(sel.value!==TRK.p2key){TRK.p2key='supercar';sel.value='supercar';}
 sel.onchange=()=>{TRK.p2key=sel.value;trkSavePrefs();trkRestartIfOn();};
 const pc=document.getElementById('trkP2Paint');pc.innerHTML=PAINTS.map((p,i)=>`<option value="${i}">${p.n}</option>`).join('');pc.value=TRK.p2paint;
 pc.onchange=()=>{TRK.p2paint=+pc.value;trkSavePrefs();trkRestartIfOn();};}
seg('trkLaps',[{n:'Prova libera',v:0},{n:'1 giro',v:1},{n:'3 giri',v:3},{n:'5 giri',v:5}],it=>{TRK.race.laps=it.v;trkSavePrefs();trkRestartIfOn();});
document.querySelectorAll('#trkLaps button').forEach(b=>b.setAttribute('aria-pressed',b.textContent===(TRK.race.laps?`${TRK.race.laps} ${TRK.race.laps===1?'giro':'giri'}`:'Prova libera')));
toggle('trkCollide',v=>{TRK.collide=v;trkSavePrefs();});setPressed('trkCollide',TRK.collide);
document.getElementById('trkTypical').onclick=()=>{trkTypical();trkDirty();};
document.getElementById('trkGo').onclick=()=>{TRK.on?trkStop():trkStart();};
document.getElementById('thExit').onclick=()=>trkStop();
document.getElementById('thReset').onclick=()=>{trkReset(TRK.p[0],false);if(TRK.split&&TRK.race.state==='off')trkReset(TRK.p[1],false);};
document.getElementById('thCamBtn').onclick=()=>trkCycleCam(TRK.p[0]);
document.getElementById('thPanel').onclick=()=>document.documentElement.classList.toggle('panel-open');
document.querySelector('[data-tab="tPista"]').addEventListener('click',()=>{if(!TRK.data||TRK.dirty)setTimeout(trkCompute,20);});
trkSyncSliders();trkPlayersUI();

/* grafico della velocità lungo il giro */
const trkChartEl=document.getElementById('trkChart');
function trkChart(){
  const cv=trkChartEl,dpr=Math.min(window.devicePixelRatio||1,2),W=cv.clientWidth||260,H=cv.clientHeight||170;if(!TRK.sim)return;
  cv.width=W*dpr;cv.height=H*dpr;const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  const cs=getComputedStyle(document.documentElement),ink=cs.getPropertyValue('--ink').trim(),soft=cs.getPropertyValue('--ink-soft').trim(),edge=cs.getPropertyValue('--edge').trim(),acc=cs.getPropertyValue('--accent').trim()||'#c43a2b';
  const N=TRK.T.N,pl=30,pr=6,pt=8,pb=18,vmax=Math.max(320,Math.ceil(TRK.sim.vmax*3.6/40)*40);
  const X=i=>pl+(W-pl-pr)*i/N,Y=kmh=>pt+(H-pt-pb)*(1-kmh/vmax);
  g.font='10px Saira, system-ui, sans-serif';g.fillStyle=soft;g.strokeStyle=edge;g.lineWidth=1;
  for(let k=0;k<=vmax;k+=80){g.beginPath();g.moveTo(pl,Y(k));g.lineTo(W-pr,Y(k));g.stroke();g.fillText(k,2,Y(k)+3);}
  for(let km=0;km<=TRK.T.L/1000;km++){g.fillText(`${km} km`,Math.min(W-30,X(km*1000/TRK.T.ds)),H-4);}
  const line=(arr,step,col,w,dash)=>{g.strokeStyle=col;g.lineWidth=w;g.setLineDash(dash||[]);g.beginPath();let first=true;for(let i=0;i<arr.length;i++){const v=arr[i];if(!v){first=true;continue;}const x=X(i*step),y=Y(v*3.6);first?g.moveTo(x,y):g.lineTo(x,y);first=false;}g.stroke();g.setLineDash([]);};
  const ref=TRK.rows.find(r=>r.track===TRK.T.N&&(r.tid||0)===TRK.trackId);if(ref&&ref.v&&ref.v.length*5>=N-5)line(ref.v,5,soft,1.2,[4,3]);
  if(TRK.p[0].lap.lastSpd)line(TRK.p[0].lap.lastSpd,1,acc,1.4);
  line(TRK.sim.v,1,ink,1.8);
  g.fillStyle=soft;TRK.corners.forEach((c,j)=>{const x=X(c.i),y=Y(TRK.cornerV[j]*3.6);g.beginPath();g.arc(x,y,2.4,0,7);g.fill();});
}
function trkPanel(){
  if(!TRK.sim)return;const S=TRK.sim,V=TRK.veh,A200=V.aero(200/3.6),down=(A200.Ff+A200.Fr)/9.81;
  document.getElementById('trkLap').textContent=fmtLap(S.lap);
  document.getElementById('trkCarNote').textContent=`${TRK.split?'Giocatore 1':'In pista'}: ${V.name}. ${state.lab?'Per cambiarla usa il laboratorio nella scheda Forma.':'Le ali si montano nella scheda Ali, oppure apri il laboratorio nella scheda Forma per provare altre forme.'}`;
  const my=TRK.myBest[trkCfgKey(TRK.p[0])];let avg=TRK.T.L/S.lap*3.6;
  document.getElementById('trkSum').innerHTML=`<dt>Velocità massima in pista</dt><dd>${fmt(S.vmax*3.6)} km/h</dd><dt>Velocità media</dt><dd>${fmt(avg)} km/h</dd>
    <dt>Tempo a gas spalancato</dt><dd>${fmt(S.full*100)} %</dd><dt>S·Cx</dt><dd>${dec(V.CdA,3)} m²</dd>
    <dt>${down>=0?'Deportanza':'Portanza'} a 200 km/h</dt><dd>${fmt(Math.abs(down))} kg</dd><dt>Peso su potenza</dt><dd>${dec(V.m/V.kw,2)} kg/kW</dd>
    <dt>Il tuo miglior giro</dt><dd>${my?fmtLap(my.t):'—'}</dd>`;
  const ref=TRK.rows.find(r=>r.track===TRK.T.N&&(r.tid||0)===TRK.trackId),refOk=ref&&ref.c&&ref.c.length===TRK.corners.length;
  document.getElementById('trkCorners').innerHTML=`<table class="ttable"><thead><tr><th>Curva</th><th>km/h</th>${refOk?`<th>vs rif.</th>`:''}</tr></thead><tbody>${TRK.corners.map((c,j)=>{const v=TRK.cornerV[j]*3.6,r=refOk?ref.c[j]:null;
    return `<tr><td>${c.n}</td><td>${fmt(v)}</td>${r!=null?`<td class="${v-r>0.5?'up':v-r<-0.5?'down':''}">${v-r>=0?'+':'−'}${fmt(Math.abs(v-r))}</td>`:''}</tr>`;}).join('')}
    <tr><td>Rettilineo (punta)</td><td>${fmt(S.vmax*3.6)}</td>${refOk?`<td class="${S.vmax*3.6-ref.vmax>0.5?'up':S.vmax*3.6-ref.vmax<-0.5?'down':''}">${S.vmax*3.6-ref.vmax>=0?'+':'−'}${fmt(Math.abs(S.vmax*3.6-ref.vmax))}</td>`:''}</tr></tbody></table>
    ${refOk?`<p class="note">Rispetto a «${ref.name}» il giro ideale è ${S.lap<=ref.lap?'più veloce':'più lento'} di ${dec(Math.abs(S.lap-ref.lap),2)} s.</p>`:''}`;
  trkChart();trkTable();
}
function trkRowFrom(V,S,cv,name){
  const A200=V.aero(200/3.6),vs=[];for(let i=0;i<S.v.length;i+=5)vs.push(+S.v[i].toFixed(2));
  return {name,m:V.m,kw:V.kw,mu:V.mu,CdA:V.CdA,down:(A200.Ff+A200.Fr)/9.81,lap:S.lap,vmax:S.vmax*3.6,c:cv.map(v=>+(v*3.6).toFixed(1)),v:vs,track:TRK.T.N,tid:TRK.trackId};
}
/* righe salvate con il tracciato precedente (senza chicane) non sono confrontabili */
TRK.rows=TRK.rows.filter(r=>r.track===undefined?false:true);
function trkTable(){
  const t=document.getElementById('trkTable');
  /* righe di questo circuito (le altre restano salvate per quando torni sull'altro) */
  const here=r=>r.track===TRK.T.N&&(r.tid||0)===TRK.trackId,rows=TRK.rows.filter(here);
  if(!rows.length){t.innerHTML='<p class="note">Nessuna auto salvata per questo circuito. La prima riga fa da riferimento per i confronti.</p>';return;}
  const r0=rows[0];
  t.innerHTML=`<table class="ttable"><thead><tr><th>Auto</th><th>Giro</th><th>Punta</th><th>Carico</th><th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr title="${r.name} · ${fmt(r.m)} kg · ${fmt(r.kw)} kW · S·Cx ${dec(r.CdA,3)} m²${r.my?` · tuo giro ${fmtLap(r.my)}`:''}"><td>${r.name}</td><td>${fmtLap(r.lap)}<br><small class="dl">${i?`${r.lap-r0.lap>=0?'+':'−'}${dec(Math.abs(r.lap-r0.lap),2)} s`:'riferimento'}</small></td><td>${fmt(r.vmax)}</td><td>${fmt(r.down)}</td><td><button class="x" data-del="${TRK.rows.indexOf(r)}" aria-label="Rimuovi">×</button></td></tr>`).join('')}</tbody></table>
    <p class="note">Giro: tempo ideale calcolato, sotto il distacco dalla prima riga. Punta: km/h in fondo al rettilineo. Carico: deportanza a 200 km/h in kg (negativo = l'auto si alleggerisce).</p>`;
  t.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{TRK.rows.splice(+b.dataset.del,1);trkSaveRows();trkPanel();});
}
document.getElementById('trkSave').onclick=()=>{
  if(!TRK.sim||TRK.dirty)trkCompute();const V=TRK.veh;let name=V.name.replace('Vespera GT con ','Vespera, ').replace('Vespera GT senza ali','Vespera senza ali'),base=name,n=2;while(TRK.rows.some(r=>r.name===name))name=`${base} ${n++}`;
  const row=trkRowFrom(V,TRK.sim,TRK.cornerV,name);const my=TRK.myBest[trkCfgKey(TRK.p[0])];if(my)row.my=my.t;
  TRK.rows.push(row);if(TRK.rows.length>20){let j=TRK.rows.findIndex(r=>!(r.track===TRK.T.N&&(r.tid||0)===TRK.trackId));if(j<0)j=1;TRK.rows.splice(j,1);}trkSaveRows();trkPanel();
};
document.getElementById('trkAll').onclick=async()=>{
  trkEnsureData();const btn=document.getElementById('trkAll');btn.disabled=true;
  const m=TRK.mass,kw=TRK.kw,mu=TRK.mu,tag=`${fmt(m)} kg, ${fmt(kw)} kW`;
  TRK.rows=TRK.rows.filter(r=>!(r.track===TRK.T.N&&(r.tid||0)===TRK.trackId));const added=[];
  for(const k of Object.keys(LAB_PRESETS)){btn.textContent=`Calcolo: ${LAB_PRESETS[k].name}…`;await new Promise(r=>setTimeout(r,15));
    const S=labShape(LAB_PRESETS[k].p),A=labFrontalArea(S),R=labDrag(S,A),V=labVehicle(S,R,m,kw,mu,LAB_PRESETS[k].name),sim=lapSim(V,TRK.RL,trkWxGrip(TRK.tire,TRK_WX[TRK.weather].wet));
    added.push(trkRowFrom(V,sim,trkCornerSpeeds(sim),LAB_PRESETS[k].name));}
  added.sort((a,b)=>a.lap-b.lap);TRK.rows.push(...added);
  btn.textContent='Confronta tutte le forme a parità di massa e potenza';btn.disabled=false;
  document.getElementById('trkAllNote').textContent=`Tutte con ${tag}, gomme ${TRK_TIRES[TRK.tire].n.toLowerCase()} e fondo ${TRK_WX[TRK.weather].n.toLowerCase()}${TRK.weather===3?' (calcolate sull\'asciutto)':''}: cambiano solo forma, area frontale, portanza stimata, passo e altezza del baricentro. Ordinate dalla più veloce.`;
  trkSaveRows();trkPanel();
};
