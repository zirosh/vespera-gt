/* =========================================================
   Campionato «Coppa Vespera»: sei gare sui tre circuiti con condizioni diverse, sette piloti fissi con nome e carattere,
   punti e giro veloce, crediti per migliorare l'auto (motore, aerodinamica, gomme, alleggerimento), avversari che crescono
   gara dopo gara. Il salvataggio è personale: nel database dell'artifact (cartella privata di chi gioca) e nel browser
   ========================================================= */
const CH_ROUNDS=[{t:0,tod:'day',wx:0,laps:3},{t:1,tod:'sunset',wx:0,laps:3},{t:2,tod:'day',wx:0,laps:3},{t:0,tod:'night',wx:1,laps:3},{t:1,tod:'day',wx:3,laps:4},{t:2,tod:'sunset',wx:2,laps:3}];
const CH_DRIVERS=[{id:'d0',n:'Marco Benetti',c:'#d19a0e',k:'supercar',ch:0,sk:0.012},{id:'d1',n:'Sofia Conti',c:'#2a6fb0',k:'vespera',ch:2,sk:0.008},{id:'d2',n:'Luca Moretti',c:'#123f30',k:'supercar',ch:3,sk:0.004},
  {id:'d3',n:'Giulia Rinaldi',c:'#e6e3da',k:'vespera',ch:4,sk:0.0},{id:'d4',n:'Paolo Zanetti',c:'#7a1f5c',k:'sedan',ch:5,sk:-0.002},{id:'d5',n:'Nico Bassi',c:'#9a4a22',k:'vespera',ch:1,sk:-0.006},{id:'d6',n:'Andrea Galli',c:'#3b3e43',k:'supercar',ch:0,sk:-0.01}];
const CH_PTS=[10,8,6,5,4,3,2,1],CH_PRIZE=[1500,1100,850,650,500,380,280,200],CH_LVL=[0.9,0.935,0.965];
const CH_UP=[{k:'eng',n:'Motore',d:l=>`+${l*5} % di potenza`},{k:'aero',n:'Aerodinamica',d:l=>`+${l*10} % di deportanza, +${l*2} % di resistenza`},{k:'tire',n:'Gomme',d:l=>`+${(l*2.2).toFixed(1).replace('.',',')} % di aderenza`},{k:'wt',n:'Alleggerimento',d:l=>`−${l*35} kg`}];
const CH_COST=[800,1600,2800];
function chNew(lvl,keep){const o=keep||{};return {v:1,season:(o.season||0)+1,lvl:lvl==null?(o.lvl??1):lvl,round:0,pts:{},res:[],credits:o.credits||0,up:o.up||{eng:0,aero:0,tire:0,wt:0},history:o.history||[]};}
let CH=null;
function chLoadLocal(){try{const s=localStorage.getItem('vespera-champ-v1');if(s)return JSON.parse(s);}catch(e){}return null;}
function chSave(){if(!CH)return;try{localStorage.setItem('vespera-champ-v1',JSON.stringify(CH));}catch(e){}
  if(BOARD.db&&BOARD.uid){try{BOARD.db.doc(`data/users/${BOARD.uid}/champ`).set(JSON.parse(JSON.stringify(CH))).catch(()=>{});}catch(e){}}}
async function chLoad(){
  CH=chLoadLocal();
  for(let k=0;k<40&&BOARD.state!=='live'&&BOARD.state!=='off'&&BOARD.state!=='error';k++)await new Promise(r=>setTimeout(r,250));
  if(BOARD.db&&BOARD.uid){try{const d=await BOARD.db.doc(`data/users/${BOARD.uid}/champ`).get();if(d&&d.exists){const r=d.data();if(r&&r.v===1&&(!CH||(r.season>CH.season||(r.season===CH.season&&r.round>=CH.round))))CH=r;}}catch(e){}}
  chRender();
}
setTimeout(chLoad,600);
const chName=id=>id==='me'?'Tu':(CH_DRIVERS.find(d=>d.id===id)||{}).n||id;
const chColor=id=>id==='me'?(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#a3121a'):(CH_DRIVERS.find(d=>d.id===id)||{}).c;
function chStand(){const ids=['me',...CH_DRIVERS.map(d=>d.id)];return ids.map(id=>({id,p:CH.pts[id]||0,w:CH.res.filter(r=>r.ord[0]===id).length})).sort((a,b)=>b.p-a.p||b.w-a.w);}

/* ---------- in gara: l'auto con le migliorie, i piloti del campionato, la griglia ---------- */
function trkChampVeh(V){
  if(!CH)return V;const u=CH.up,A0=V.aero;V.kw*=1+0.05*u.eng;V.m-=35*u.wt;V.mu*=1+0.022*u.tire;
  if(u.aero){const fd=1+0.1*u.aero,fdr=1+0.02*u.aero;V.aero=v=>{const a=A0(v);return {D:a.D*fdr,Ff:a.Ff*fd,Fr:a.Fr*fd};};}
  V._gear=null;return V;
}
function trkChampField(){
  const R=CH.round,ai=TRK.cars.filter(P=>P.isAI);
  ai.forEach((P,j)=>{const D=CH_DRIVERS[j%CH_DRIVERS.length];P.dname=D.n;P.drv=D.id;P.color=D.c;P.label=D.n;P.key=D.k;
    P.M=trkCarMats(P.M||{},P.color,P.num,TRK_RING[P.id]);trkCarVisual(P,D.k);
    P.veh=trkVehicleFor(D.k);P.veh.kw*=1+0.015*R+0.02*(CH.season-1);P.veh.mu=TRK_TIRES[P.tire].mu;P.simG=trkWxGrip(P.tire,TRK.wet);P.sim=lapSim(P.veh,TRK.RL,P.simG);P.cornerV=trkCornerSpeeds(P.sim);
    P.ch=TRK_CHARS[D.ch%TRK_CHARS.length];P.pace=Math.min(1.01,CH_LVL[CH.lvl]+D.sk+0.004*R+0.006*(CH.season-1)+(P.ch.pace||0));});
  TRK.p[0].label='Tu';TRK.p[0].drv='me';
}
function trkChampGrid(){const pts=id=>CH.pts[id]||0;return TRK.cars.slice().sort((a,b)=>pts(a.drv)-pts(b.drv)||a.pace-b.pace);}
/* fine gara: punti, crediti, giro veloce; la riga in più nella tabella d'arrivo */
function trkChampResult(ord,fl){
  const r=CH.round,ids=ord.map(P=>P.drv||'me'),me=ids.indexOf('me'),flId=fl?(fl.drv||'me'):null;
  ids.forEach((id,k)=>{CH.pts[id]=(CH.pts[id]||0)+(CH_PTS[k]||0)+(id===flId?1:0);});
  const prize=(CH_PRIZE[me]||100)+(flId==='me'?200:0);CH.credits+=prize;
  CH.res[r]={ord:ids,fl:flId};CH.round=r+1;
  const st=chStand(),myP=st.findIndex(s=>s.id==='me')+1,done=CH.round>=CH_ROUNDS.length;
  if(done)CH.history.push({season:CH.season,pos:myP,pts:CH.pts.me||0});
  chSave();chRender();
  return `<div class="ch-res"><div><small>Punti</small><b>+${(CH_PTS[me]||0)+(flId==='me'?1:0)}</b></div><div><small>Crediti</small><b>+${prize.toLocaleString('it-IT')}</b></div><div><small>${done?'Classifica finale':'In campionato'}</small><b>${myP}°</b></div></div>
    ${done?`<p class="ch-final">${myP===1?'Campione della Coppa Vespera!':`Stagione chiusa al ${myP}° posto`}</p>`:''}`;
}
/* impostazioni libere salvate prima di una gara di campionato e rimesse dopo */
function trkChampStart(){
  if(!CH)CH=chNew(1);if(CH.round>=CH_ROUNDS.length)return;
  const G=CH_ROUNDS[CH.round];
  TRK.chSaved={trackId:TRK.trackId,tod:TRK.tod,weather:TRK.weather,players:TRK.players,oppAI:TRK.oppAI,laps:TRK.race.laps,aiChar:TRK.aiChar,p2key:TRK.p2key};
  if(TRK.trackId!==G.t){trkSetTrack(G.t);document.querySelectorAll('#trkTrack button').forEach((b,i)=>b.setAttribute('aria-pressed',i===G.t));}
  TRK.tod=G.tod;TRK.weather=G.wx;trkSetPlayers('ai');TRK.oppAI=7;TRK.race.laps=G.laps;TRK.aiChar=true;TRK.champRace=true;
  chHub(false);trkStart();
}
function trkChampRestore(){
  if(!TRK.champRace)return;TRK.champRace=false;const S=TRK.chSaved;if(!S)return;
  if(TRK.trackId!==S.trackId){trkSetTrack(S.trackId);document.querySelectorAll('#trkTrack button').forEach((b,i)=>b.setAttribute('aria-pressed',i===S.trackId));}
  Object.assign(TRK,{tod:S.tod,weather:S.weather,oppAI:S.oppAI,aiChar:S.aiChar,p2key:S.p2key});TRK.race.laps=S.laps;trkSetPlayers(S.players);trkPlayersUI();trkDirty();
}

/* ---------- la sede del campionato: gare, classifica, crediti e officina ---------- */
const chEl=document.createElement('div');chEl.id='gmChamp';chEl.className='gm-champ';chEl.hidden=true;chEl.setAttribute('role','dialog');chEl.setAttribute('aria-label','Campionato');document.body.appendChild(chEl);
function chHub(on){chEl.hidden=!on;document.documentElement.classList.toggle('champ-open',!!on);if(on){chRender();const b=chEl.querySelector('.ch-go');if(b)b.focus({preventScroll:true});}}
const CH_WXN=['Asciutto','Umido','Pioggia','Variabile'],CH_TODN={day:'Giorno',sunset:'Tramonto',night:'Notte'};
function chRender(){
  if(!CH)return;
  const st=chStand(),done=CH.round>=CH_ROUNDS.length,G=CH_ROUNDS[Math.min(CH.round,CH_ROUNDS.length-1)];
  const rounds=CH_ROUNDS.map((g,i)=>{const d=TRK_DEFS[g.t],r=CH.res[i],pos=r?r.ord.indexOf('me')+1:0;
    return `<div class="ch-round ${i===CH.round?'next':''} ${r?'done':''}"><canvas width="120" height="80" data-t="${g.t}"></canvas><div><small>Gara ${i+1}</small><b>${d.short}</b><span>${CH_TODN[g.tod]} · ${CH_WXN[g.wx]} · ${g.laps} giri</span></div><em>${r?`${pos}°${r.fl==='me'?' <i title="Giro più veloce">GV</i>':''}`:i===CH.round?'Prossima':''}</em></div>`;}).join('');
  const table=st.map((s,k)=>`<tr class="${s.id==='me'?'me':''}"><td>${k+1}</td><td><i style="background:${chColor(s.id)}"></i>${chName(s.id)}</td><td>${s.w?`${s.w} ${s.w===1?'vittoria':'vittorie'}`:''}</td><td><b>${s.p}</b></td></tr>`).join('');
  const shop=CH_UP.map(u=>{const l=CH.up[u.k]||0,cost=CH_COST[l],can=l<3&&CH.credits>=cost;
    return `<div class="ch-up"><div><b>${u.n}</b><span>${l?u.d(l):'di serie'}</span></div><div class="ch-pips">${[0,1,2].map(j=>`<i class="${j<l?'on':''}"></i>`).join('')}</div>${l<3?`<button data-up="${u.k}" ${can?'':'disabled'}>${cost.toLocaleString('it-IT')} cr</button>`:'<em>Massimo</em>'}</div>`;}).join('');
  const myP=st.findIndex(s=>s.id==='me')+1;
  chEl.innerHTML=`<div class="ch-in"><header><div><small>Campionato · stagione ${CH.season} · livello ${['Facile','Medio','Difficile'][CH.lvl]}</small><h2>Coppa Vespera</h2></div><button class="ch-x" aria-label="Chiudi">✕</button></header>
    <div class="ch-grid"><section class="ch-rounds"><h3>Calendario</h3>${rounds}</section>
      <section class="ch-table"><h3>Classifica piloti</h3><table>${table}</table>
        <h3 class="ch-shop-h">Officina <span>${CH.credits.toLocaleString('it-IT')} crediti</span></h3><div class="ch-shop">${shop}</div>
        <p class="ch-note">Le migliorie valgono solo nelle gare del campionato. Punti 10-8-6-5-4-3-2-1 e uno in più per il giro più veloce; gli avversari migliorano gara dopo gara.</p></section></div>
    <footer>${done?`<div class="ch-end">${myP===1?'Hai vinto la Coppa Vespera':`Stagione chiusa al ${myP}° posto`}</div><div class="ch-lvl">${['Facile','Medio','Difficile'].map((n,i)=>`<button data-lvl="${i}" class="${i===CH.lvl?'on':''}">${n}</button>`).join('')}</div><button class="ch-go" data-new="1"><span>Nuova stagione</span><small>crediti e migliorie restano, avversari più forti</small></button>`
      :`<button class="ch-reset">Ricomincia la stagione</button><button class="ch-go"><span>Corri la gara ${CH.round+1}</span><small>${TRK_DEFS[G.t].short} · ${CH_TODN[G.tod]} · ${CH_WXN[G.wx]}</small></button>`}</footer></div>`;
  chEl.querySelectorAll('canvas[data-t]').forEach(c=>trkDrawPreview(c,TRK_DEFS[+c.dataset.t]));
  chEl.querySelector('.ch-x').onclick=()=>chHub(false);
  chEl.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const k=b.dataset.up,l=CH.up[k]||0,c=CH_COST[l];if(l<3&&CH.credits>=c){CH.credits-=c;CH.up[k]=l+1;chSave();chRender();}});
  chEl.querySelectorAll('[data-lvl]').forEach(b=>b.onclick=()=>{CH.lvl=+b.dataset.lvl;chRender();});
  const go=chEl.querySelector('.ch-go');go.onclick=()=>{if(go.dataset.new){CH=chNew(CH.lvl,CH);chSave();chRender();}else trkChampStart();};
  const rs=chEl.querySelector('.ch-reset');if(rs)rs.onclick=()=>{if(rs.dataset.sure){CH=Object.assign(chNew(CH.lvl,CH),{season:CH.season});chSave();chRender();}else{rs.dataset.sure=1;rs.textContent='Sicuro? Si perdono i punti di questa stagione';}};
}
/* prima volta: scelta del livello */
function chIntro(){
  chEl.innerHTML=`<div class="ch-in ch-intro"><header><div><small>Campionato</small><h2>Coppa Vespera</h2></div><button class="ch-x" aria-label="Chiudi">✕</button></header>
    <p>Sei gare sulle Prealpi, sul Montello e sul Grappa, di giorno, al tramonto, di notte e sotto la pioggia, contro sette piloti con il loro carattere. Ogni arrivo vale punti e crediti: spendili in officina per migliorare l'auto. Gli avversari, intanto, crescono.</p>
    <div class="ch-lvl">${['Facile','Medio','Difficile'].map((n,i)=>`<button data-lvl="${i}" class="${i===1?'on':''}">${n}</button>`).join('')}</div>
    <footer><button class="ch-go"><span>Inizia la stagione</span><small>sei gare · otto auto</small></button></footer></div>`;
  let lvl=1;chEl.querySelectorAll('[data-lvl]').forEach(b=>b.onclick=()=>{lvl=+b.dataset.lvl;chEl.querySelectorAll('[data-lvl]').forEach(c=>c.classList.toggle('on',c===b));});
  chEl.querySelector('.ch-x').onclick=()=>chHub(false);chEl.querySelector('.ch-go').onclick=()=>{CH=chNew(lvl);chSave();chRender();chEl.querySelector('.ch-go').focus({preventScroll:true});};
  chEl.hidden=false;document.documentElement.classList.add('champ-open');chEl.querySelector('.ch-go').focus({preventScroll:true});
}
function chOpen(){if(TRK.on)return;if(!CH)chIntro();else chHub(true);}
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&!chEl.hidden&&!TRK.on){chHub(false);}});
/* pulsante nel garage */
{const b=document.createElement('button');b.className='gm-champ-btn';b.id='gmChampBtn';b.innerHTML='<span>Campionato</span><small id="gmChampSub">Coppa Vespera</small>';b.onclick=chOpen;
  GM.dock.appendChild(b);setInterval(()=>{const s=document.getElementById('gmChampSub');if(!s)return;s.textContent=CH?(CH.round>=CH_ROUNDS.length?`Stagione ${CH.season} conclusa`:`Stagione ${CH.season} · gara ${CH.round+1} di ${CH_ROUNDS.length}`):'Coppa Vespera · 6 gare';},800);}
/* agganci al resto del gioco */
{const f=trkStop;trkStop=function(){const was=TRK.on;f();if(was)trkChampRestore();};}
{const f=trkSetupField;trkSetupField=function(){TRK.p.forEach(P=>{P.dname=null;P.drv=null;});f();if(TRK.champRace&&CH)trkChampField();};}
{const f=trkGridOrder;trkGridOrder=function(){return TRK.champRace&&CH?trkChampGrid():f();};}
{const f=trkVehicle;trkVehicle=function(){const V=f();return TRK.champRace&&CH&&TRK.on?trkChampVeh(V):V;};}
{const f=trkPadIdle;trkPadIdle=function(){if(!chEl.hidden){const p=trkPadList()[0];if(!p)return;trkMenuPad(0,p,chEl);if(padHit(0,p,PAD_B.B))chHub(false);padStore(0,p);return;}f();};}
