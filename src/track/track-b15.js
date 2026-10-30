/* =========================================================
   Interfaccia da console: schermata iniziale a tutto schermo e schermate dedicate (Gara veloce, Campionato, Garage,
   Officina, Impostazioni). I comandi sono quelli di sempre, con gli stessi id e la stessa logica: qui vengono solo
   spostati nelle schermate nuove. Esc o B tornano indietro, LB e RB cambiano scheda, Invio o Menu scendono in pista.
   In gara, Tab o «Impostazioni» nella pausa aprono la schermata delle impostazioni sopra la pista
   ========================================================= */
const CS={screen:'home',tabs:{},el:null,keysT:null};
const CS_HOME=[
  {s:'race',n:'Gara veloce',d:'Circuito, avversari, meteo e via'},
  {s:'champ',n:'Campionato',d:'Coppa Vespera'},
  {s:'garage',n:'Garage',d:'Vernice, assetto, ali, massa e potenza'},
  {s:'lab',n:'Officina',d:'Laboratorio di forma, galleria del vento, dati del giro'},
  {s:'opt',n:'Impostazioni',d:'Aiuti alla guida, grafica, controller, classifica'}];
const CS_TABS={garage:[['auto','Auto'],['setup','Assetto'],['ali','Ali']],lab:[['forma','Forma'],['aria','Galleria del vento'],['vista','Vista'],['dati','Dati pista']],
  opt:[['guida','Guida'],['grafica','Grafica'],['pad','Controller'],['rete','Classifica']]};
const CS_TITLE={home:'',race:'Gara veloce',garage:'Garage',lab:'Officina',opt:'Impostazioni'};
/* un blocco nuovo con titolo, in cui spostare comandi presi da altri blocchi */
function csGroup(title,...els){const g=document.createElement('div');g.className='group';if(title){const h=document.createElement('h2');h.textContent=title;g.appendChild(h);}
  for(const e of els)if(e)g.appendChild(e);return g;}
const csById=id=>document.getElementById(id),csGrp=id=>{const e=csById(id);return e?e.closest('.group'):null;};
function csToggles(...ids){const t=document.createElement('div');t.className='toggles';t.style.gridTemplateColumns='1fr';for(const id of ids){const b=csById(id);if(b)t.appendChild(b);}return t;}
function csBuild(){
  const root=document.createElement('div');root.id='cs';root.className='cs';CS.el=root;
  root.innerHTML=`<header class="cs-top"><div class="cs-brand">Vespera <b>GT</b></div><div class="cs-crumb" aria-live="polite"></div></header>
    <nav class="cs-home" data-s="home" aria-label="Menu principale">${CS_HOME.map((m,i)=>`<button class="cs-item" data-go="${m.s}" style="--i:${i}"><b>${m.n}</b><small${m.s==='champ'?' id="csChampSub"':''}>${m.d}</small></button>`).join('')}</nav>
    <section class="cs-scr" data-s="race"><div class="cs-left"></div><div class="cs-pane"><div class="cs-body"></div><button class="cs-go" id="csGo"><span>Via</span><small>Invio · Menu sul controller</small></button></div></section>
    ${['garage','lab','opt'].map(s=>`<section class="cs-scr" data-s="${s}"><div class="cs-left"></div><div class="cs-pane"><div class="cs-tabs" role="tablist">${CS_TABS[s].map(([k,n])=>`<button role="tab" aria-selected="false" data-tab2="${k}">${n}</button>`).join('')}</div><div class="cs-body"></div></div></section>`).join('')}
    <footer class="cs-keys"><span><kbd>Invio</kbd><kbd>A</kbd> scegli</span><span class="cs-back-k"><kbd>Esc</kbd><kbd>B</kbd> indietro</span><span class="cs-tab-k"><kbd>LB</kbd><kbd>RB</kbd> schede</span><button class="cs-back" type="button">Indietro</button></footer>`;
  document.body.appendChild(root);
  const scr=s=>root.querySelector(`.cs-scr[data-s="${s}"]`),body=s=>scr(s).querySelector('.cs-body'),left=s=>scr(s).querySelector('.cs-left');
  /* gara veloce: la scheda Pista senza le parti che non riguardano la gara, più le gomme di partenza */
  const P=csById('tPista');P.hidden=false;
  const mass=csGrp('trkMass'),tires=csById('trkTires'),assist=csById('trkAssist');
  const pGar=csGroup('Massa e potenza'),pH=[...mass.querySelectorAll('h2')];
  pGar.append(pH[0],csById('trkMass'),pH[1],csById('trkKw'),csToggles('trkSame'),csById('trkTypical'));
  const guida=csGroup('Aiuti alla guida',csToggles('trkAssist','trkLine','trkDmg','trkRb','trkGhost'));
  const grafica=csGroup('Effetti',csToggles('trkFxPost','trkFxRefl','trkFxShadow'));
  const cam=csGrp('trkCam'),pad=csGrp('trkPadState'),board=csGrp('trkBoard'),chart=csGrp('trkChart'),corners=csGrp('trkCorners'),cmp=csGrp('trkSave'),ideal=csGrp('trkLap');
  const gTires=csGroup('Gomme di partenza',tires);mass.remove();
  /* le spiegazioni lunghe restano, ma nascoste finché non le chiedi */
  const notes=csGroup('Interfaccia',csToggles('csNotes'));
  const nb=document.createElement('button');nb.className='tog';nb.id='csNotes';nb.textContent='Mostra le spiegazioni';nb.setAttribute('aria-pressed','false');notes.querySelector('.toggles').appendChild(nb);
  try{if(localStorage.getItem('vespera-notes')==='1'){nb.setAttribute('aria-pressed','true');document.documentElement.classList.add('cs-notes');}}catch(e){}
  nb.onclick=()=>{const on=nb.getAttribute('aria-pressed')!=='true';nb.setAttribute('aria-pressed',on);document.documentElement.classList.toggle('cs-notes',on);try{localStorage.setItem('vespera-notes',on?'1':'0');}catch(e){}};
  P.querySelector('#trkModeG').after(gTires);
  body('race').appendChild(P);left('race').appendChild(ideal);
  /* garage: le schede dell'auto, con massa e potenza in fondo alla scheda Auto; a sinistra le prestazioni */
  const gb=body('garage');gb.append(csById('tAuto'),csById('tSetup'),csById('tAli'));csById('tAuto').appendChild(pGar);
  const stats=GM.dock.querySelector('.gm-stats');if(stats)left('garage').appendChild(stats);
  /* officina: laboratorio, galleria del vento, vista e i dati del giro ideale */
  const dati=document.createElement('section');dati.className='tab';dati.id='tDati';dati.append(chart,corners,cmp);
  body('lab').append(csById('tForma'),csById('tAria'),csById('tVista'),dati);
  /* impostazioni */
  const ob=body('opt'),wrap=(id,...g)=>{const s=document.createElement('section');s.className='tab';s.id=id;s.append(...g.filter(Boolean));ob.appendChild(s);};
  wrap('tGuida',guida,cam,notes);wrap('tGrafica',grafica);wrap('tPad',pad);wrap('tRete',board);
  P.querySelectorAll('.toggles').forEach(t=>{if(!t.children.length)t.remove();});
  CS.sec={garage:{auto:'tAuto',setup:'tSetup',ali:'tAli'},lab:{forma:'tForma',aria:'tAria',vista:'tVista',dati:'tDati'},opt:{guida:'tGuida',grafica:'tGrafica',pad:'tPad',rete:'tRete'}};
  /* comandi */
  root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>csGo(b.dataset.go));
  root.querySelectorAll('[data-tab2]').forEach(b=>b.onclick=()=>csTab(b.closest('.cs-scr').dataset.s,b.dataset.tab2));
  root.querySelector('.cs-back').onclick=()=>csBack();
  csById('csGo').onclick=()=>{if(!TRK.on&&busy.hidden)csById('trkGo').click();};
  const go=csById('trkGo'),sync=()=>{csById('csGo').querySelector('span').textContent=go.textContent||'Via';};new MutationObserver(sync).observe(go,{childList:true,characterData:true,subtree:true});sync();
  for(const s in CS_TABS)csTab(s,CS_TABS[s][0][0],true);
  setInterval(()=>{const a=csById('gmChampSub'),b=csById('csChampSub');if(a&&b&&a.textContent)b.textContent=a.textContent;},1000);
  csGo('home',true);
}
function csTab(s,k,quiet){
  CS.tabs[s]=k;const S=CS.el.querySelector(`.cs-scr[data-s="${s}"]`);
  S.querySelectorAll('[data-tab2]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab2===k));
  for(const t in CS.sec[s])csById(CS.sec[s][t]).hidden=t!==k;
  if(!quiet)S.querySelector('.cs-body').scrollTop=0;
}
/* cambio di schermata; il campionato ha già la sua schermata */
function csGo(s,quiet){
  if(s==='champ'){chOpen();return;}
  CS.screen=s;const root=CS.el;root.dataset.s=s;
  root.querySelector('.cs-crumb').textContent=CS_TITLE[s]||'';
  root.querySelectorAll('.cs-home,.cs-scr').forEach(e=>{e.hidden=e.dataset.s!==s;});
  document.documentElement.classList.toggle('cs-sub',s!=='home');csView();
  if(s==='race'&&TRK.dirty)try{trkCompute();}catch(e){}
  if(!quiet){const f=s==='home'?root.querySelector('.cs-item'):root.querySelector(`.cs-scr[data-s="${s}"] [role="tab"][aria-selected="true"],.cs-scr[data-s="${s}"] .cs-body button`);if(f)f.focus({preventScroll:true});}
}
/* indietro: in gara chiude le impostazioni, nel garage torna al menu; true se ha fatto qualcosa */
function csBack(){
  const H=document.documentElement;
  if(TRK.on){if(H.classList.contains('panel-open')){H.classList.remove('panel-open');return true;}return false;}
  if(!chEl.hidden||!busy.hidden)return false;
  if(CS.screen!=='home'){const from=CS.screen;csGo('home');const b=CS.el.querySelector(`[data-go="${from}"]`);if(b)b.focus({preventScroll:true});return true;}
  return false;
}
/* inquadratura: nel menu l'auto sta a destra delle voci, nelle schermate a sinistra del pannello (resize() di base la mette al centro) */
function csView(){
  if(TRK.on||!camera)return;const w=stage.clientWidth,h=stage.clientHeight;if(w<=720)return;
  const off=CS.screen==='home'?-w*0.16:Math.min(w*0.17,260);camera.setViewOffset(w,h,off,0,w,h);camera.updateProjectionMatrix();
}
/* resize() di base può rimettere l'inquadratura al centro in qualsiasi momento: la si controlla a ogni fotogramma */
(function csViewLoop(){requestAnimationFrame(csViewLoop);if(TRK.on||!camera||!camera.view)return;const w=stage.clientWidth;if(w<=720)return;
  const want=CS.screen==='home'?-w*0.16:Math.min(w*0.17,260);if(Math.abs(camera.view.offsetX-want)>0.5||camera.view.fullWidth!==w)csView();})();
{const f=trkStop;trkStop=function(){f();setTimeout(csView,0);};}
csBuild();
/* in gara le impostazioni si aprono sopra la pista (Tab, pausa → Impostazioni) */
new MutationObserver(()=>{const H=document.documentElement;if(H.classList.contains('racing')&&H.classList.contains('panel-open')&&CS.screen!=='opt'){CS.ret=CS.screen;csGo('opt');}
  if(!H.classList.contains('panel-open')&&CS.ret){const r=CS.ret;CS.ret=null;csGo(r,true);}}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
/* tastiera: Esc indietro; Invio scende in pista solo dalla schermata della gara (dalle altre sceglie la voce) */
window.addEventListener('keydown',e=>{
  if(e.code==='Escape'&&!e.target.closest('input,select,textarea')&&csBack()){e.preventDefault();e.stopImmediatePropagation();return;}
  if(e.code==='Enter'&&!TRK.on&&CS.screen!=='race'&&!e.target.closest('input,select,textarea,button'))e.stopImmediatePropagation();
},true);
/* in pista: i suggerimenti dei tasti spariscono dopo pochi secondi, i pulsanti in alto solo quando muovi il mouse */
{const f=trkStart;trkStart=function(){f();const H=document.documentElement;H.classList.remove('cs-keys-off');clearTimeout(CS.keysT);CS.keysT=setTimeout(()=>H.classList.add('cs-keys-off'),9000);};}
{let t=null;window.addEventListener('mousemove',()=>{const H=document.documentElement;if(!H.classList.contains('racing'))return;H.classList.add('cs-mouse');clearTimeout(t);t=setTimeout(()=>H.classList.remove('cs-mouse'),2500);});}
document.documentElement.classList.add('cs-on');
