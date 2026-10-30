/* =========================================================
   Interfaccia, seconda passata: anteprima grande del circuito nella schermata Gara veloce
   (tracciato colorato per quota, numero di curve, lunghezza, dislivello, record personale, meteo e ora)
   e riepilogo di fine gara (posizioni guadagnate, giro migliore contro il giro ideale, velocità massima,
   danni, distacco di ogni giro dal migliore)
   ========================================================= */
/* ---------- anteprima del circuito ---------- */
const RP={id:-1,el:null,cv:null};
function trkRacePreview(){
  const left=document.querySelector('#cs .cs-scr[data-s="race"] .cs-left');if(!left||RP.el)return;
  const w=document.createElement('div');w.className='group cs-prev';
  w.innerHTML=`<div class="cs-prev-k">Circuito</div><div class="cs-prev-n"></div><canvas width="640" height="300" role="img"></canvas><dl class="cs-prev-d"></dl>`;
  left.prepend(w);RP.el=w;RP.cv=w.querySelector('canvas');
  setInterval(trkRacePreviewUpd,500);trkRacePreviewUpd();
}
function trkRacePreviewUpd(){
  if(!RP.el||RP.el.offsetParent===null)return;const id=TRK.trackId,d=TRK_DEFS[id]||TRK_DEFS[0],key=id+'|'+TRK.tod+'|'+TRK.weather+'|'+JSON.stringify(TRK.myBest||{}).length;
  if(RP.id===key)return;RP.id=key;const I=trkDefInfo(d),cv=RP.cv;trkDrawPreview(cv,d);
  RP.el.querySelector('.cs-prev-n').textContent=d.name||d.short;cv.setAttribute('aria-label',`Tracciato di ${d.name||d.short}`);
  const pb=Object.entries(TRK.myBest||{}).filter(([k])=>k.startsWith(id+'|')).map(([,v])=>v.t).sort((a,b)=>a-b)[0];
  const tod={day:'giorno',sunset:'tramonto',night:'notte',dawn:'alba'}[TRK.tod]||TRK.tod||'giorno',wx=(TRK_WX[TRK.weather]||{}).n||'';
  RP.el.querySelector('.cs-prev-d').innerHTML=`<div><dt>Lunghezza</dt><dd>${(I.L/1000).toFixed(2).replace('.',',')} km</dd></div><div><dt>Curve</dt><dd>${(d.corners||[]).length}</dd></div>
    <div><dt>Dislivello</dt><dd>${Math.round(I.dh)} m</dd></div><div><dt>Tuo record</dt><dd>${pb?fmtLap(pb):'—'}</dd></div><div class="w"><dt>Condizioni</dt><dd>${wx}${wx?', ':''}${tod}</dd></div>`;
}
if(typeof document!=='undefined'&&document.getElementById('cs'))trkRacePreview();

/* ---------- dati della gara per il riepilogo ---------- */
{const f=trkRaceSetup;trkRaceSetup=function(){f();for(const P of TRK.cars){P.rs={grid:P.pos||1,laps:[],vmax:0,dmg:0};}};}
{const f=trkLap;trkLap=function(P,a,b){const L=P.lap,n0=L.n,last=L.last;f(P,a,b);
  if(P.rs&&TRK.race.state!=='off'&&L.n!==n0&&L.last!=null&&L.last!==last)P.rs.laps.push({t:L.last,ok:L.lastValid!==false});};}
{const f=trkFrame;trkFrame=function(dt){f(dt);if(!TRK.on||TRK.replay.on||TRK.race.state!=='run')return;
  for(const P of TRK.cars){const R=P.rs;if(!R)continue;R.vmax=Math.max(R.vmax,P.kmh||0);const D=P.dmg;if(D)R.dmg=Math.max(R.dmg,D.fw||0,D.rw||0,...(D.s||[0]));}};}

/* ---------- riepilogo di fine gara ---------- */
{const f=trkRaceEnd;trkRaceEnd=function(){f();
  const el=document.getElementById('thRace'),me=TRK.p[0],R=me&&me.rs;if(!el||!R||TRK.split)return;
  const pos=me.pos||1,gain=R.grid-pos,best=me.lap.best,ideal=me.sim&&me.sim.lap;
  const tiles=[['Posizione',`${R.grid}° → ${pos}°`,gain>0?`${gain} ${gain===1?'posizione guadagnata':'posizioni guadagnate'}`:gain<0?`${-gain} ${gain===-1?'posizione persa':'posizioni perse'}`:'stessa posizione'],
    ['Giro migliore',best!=null?fmtLap(best):'—',best!=null&&ideal?`${best>=ideal?'+':'−'}${dec(Math.abs(best-ideal),2)} s dal giro ideale`:''],
    ['Velocità massima',`${Math.round(R.vmax)} km/h`,''],
    ['Danni',R.dmg>0.02?`${Math.round(R.dmg*100)} %`:'nessuno',me.stops?`${me.stops} ${me.stops===1?'sosta':'soste'} ai box`:'']];
  const box=document.createElement('div');box.className='tr-me';
  box.innerHTML=`<div class="tr-tiles">${tiles.map(([k,v,s])=>`<div><small>${k}</small><b>${v}</b>${s?`<span>${s}</span>`:''}</div>`).join('')}</div>`;
  /* distacco di ogni giro dal giro migliore: barre che partono da zero (il giro migliore è il segno a zero) */
  const L=R.laps;if(L.length>1){const b0=Math.min(...L.map(l=>l.t)),mx=Math.max(1,...L.map(l=>l.t-b0));
    box.insertAdjacentHTML('beforeend',`<div class="tr-laps"><small>Distacco dal tuo giro migliore, giro per giro${L.some(l=>!l.ok)?' · a righe i giri non validi':''}</small><div class="tr-bars" role="list">${L.map((l,k)=>{const d=l.t-b0,h=d<0.005?0:Math.max(4,d/mx*80);
      return `<div role="listitem" class="${d<0.005?'best':''}${l.ok?'':' inv'}" title="Giro ${k+1}: ${fmtLap(l.t)}${d<0.005?' (migliore)':` (+${dec(d,2)} s)`}${l.ok?'':', non valido'}"><i style="height:${h}%"></i><em>${d<0.005?'migliore':'+'+dec(d,1)}</em><u>${k+1}</u></div>`;}).join('')}</div></div>`);}
  const tab=el.querySelector('.tr-tab');(tab||el.querySelector('dl')).after(box);};}
