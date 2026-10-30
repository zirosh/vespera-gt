/* =========================================================
   Danni: gli urti contro le barriere, contro le altre auto e gli atterraggi duri piegano l'ala anteriore, quella posteriore
   e le sospensioni. Quanto si rompe dipende dalla variazione di velocità nell'urto e da dove arriva il colpo.
   Effetti: meno deportanza sull'asse con l'ala piegata e più resistenza; la sospensione piegata cambia la convergenza
   (l'auto tira dal lato colpito, di più se è l'anteriore) e il camber (quella gomma tiene meno); un'ala storta spinge
   di lato in proporzione al quadrato della velocità. Ai box si ripara tutto, ma la sosta si allunga in base ai danni.
   ========================================================= */
const TRK_DMG={on:true};
try{const s=localStorage.getItem('vespera-dmg');if(s!=null)TRK_DMG.on=s==='1';}catch(e){}
const TRK_WHEEL_N=['anteriore sinistra','anteriore destra','posteriore sinistra','posteriore destra'];
function trkDmgNew(){return {fw:0,rw:0,fwS:0,s:[0,0,0,0],toe:0,toeR:0};}
function trkDmgSev(D){return D?Math.max(D.fw,D.rw,D.s[0],D.s[1],D.s[2],D.s[3]):0;}
/* da stato dei pezzi a effetti sulla fisica: convergenza davanti e dietro (rad, positiva = tira a sinistra), aderenza di ogni ruota */
function trkDmgApply(P){
  const D=P.dmg;if(!D){P.toe=P.toeR=0;P.wgk=null;return;}
  D.toe=0.024*(D.s[0]-D.s[1]);D.toeR=-0.016*(D.s[2]-D.s[3]);
  P.wgk=D.s.map(x=>1-0.22*x);P.toe=D.toe;P.toeR=D.toeR;
}
function trkDmgClear(P){P.dmg=null;P.dmgSim=null;trkDmgApply(P);}
/* aerodinamica danneggiata: la funzione dell'auto viene avvolta una volta sola (anche quando l'auto viene ricalcolata) */
function trkDmgAero(P){
  const V=P.veh;if(!V||V._dmgP===P)return;const A0=V.aero;V._dmgP=P;
  V.aero=v=>{const a=A0(v),D=P.dmg;if(!D||!TRK_DMG.on)return a;return {D:a.D*(1+0.12*Math.max(D.fw,D.rw)),Ff:a.Ff*(1-0.6*D.fw),Fr:a.Fr*(1-0.6*D.rw)};};
}
/* profilo di velocità dell'auto danneggiata: lo seguono i piloti del computer e la traiettoria consigliata */
function trkDmgResim(P){if(!P.veh||!TRK.RL)return;trkDmgAero(P);const S=lapSim(P.veh,TRK.RL,P.simG||1);if(P.isAI)P.sim=S;else P.dmgSim=S;}
/* un colpo: dv = variazione di velocità (m/s); (bx, by) = da dove arriva nel telaio dell'auto (x avanti, y a sinistra), di modulo 1 */
function trkDmgHit(P,dv,bx,by){
  if(!TRK_DMG.on||dv<3.2||P.pit)return;
  const a=Math.min(1,Math.pow((dv-3.2)/15,1.15)),D=P.dmg||(P.dmg=trkDmgNew()),old=D.s.slice(),fw0=D.fw,rw0=D.rw;
  const fr=Math.max(0,bx),re=Math.max(0,-bx),side=Math.abs(by),left=by>0;
  D.fw=Math.min(1,D.fw+a*(1.25*fr+0.18*side));D.rw=Math.min(1,D.rw+a*(1.1*re+0.15*side));
  if(fr+side>0.2)D.fwS=clamp(D.fwS+(left?1:-1)*a*(0.4+side),-1,1);
  for(let k=0;k<4;k++){const ax=k<2?0.3+fr:0.3+re,sd=(k%2===0)===left?0.35+side:0.35*(1-side);D.s[k]=Math.min(1,D.s[k]+a*0.75*ax*sd);}
  trkDmgApply(P);trkDmgResim(P);
  /* messaggio solo per la parte che si è rotta di più in questo urto */
  const dS=D.s.map((x,k)=>x-old[k]),km=dS.indexOf(Math.max(...dS)),dF=D.fw-fw0,dRw=D.rw-rw0,big=Math.max(dS[km],dF,dRw);
  if(big<0.06)return;
  if(P.isAI){if(big>0.3)trkRadio(P,`#${P.num} danneggiata${trkCornerAhead(P.car.i)}`);return;}
  const pull=D.toe+D.toeR*0.6,side2=pull>0.004?'sinistra':pull<-0.004?'destra':'';
  const msg=dS[km]>=Math.max(dF,dRw)?`Sospensione ${TRK_WHEEL_N[km]} piegata${side2?`: l'auto tira a ${side2}`:''}`:dF>=dRw?'Ala anteriore danneggiata: meno carico davanti':'Ala posteriore danneggiata: meno carico dietro';
  trkToast(P,msg+(trkDmgSev(D)>0.35?' · fermati ai box per ripararla':''),3);
}
/* atterraggio duro: tutte e quattro le sospensioni, di più quelle che toccano per prime */
function trkDmgLand(P,vz){
  if(!TRK_DMG.on||vz<7)return;const a=Math.min(1,(vz-7)/12),D=P.dmg||(P.dmg=trkDmgNew());
  for(let k=0;k<4;k++)D.s[k]=Math.min(1,D.s[k]+a*(0.35+0.2*Math.random()));D.fw=Math.min(1,D.fw+a*0.3);
  trkDmgApply(P);trkDmgResim(P);if(!P.isAI&&a>0.08)trkToast(P,'Atterraggio troppo duro: sospensioni danneggiate',2.4);
}
const _dmgV=c=>{const cp=Math.cos(c.psi),sp=Math.sin(c.psi);return [c.vx*cp-c.vy*sp,c.vx*sp+c.vy*cp];};
/* direzione (dx, dy) nel mondo → telaio dell'auto */
const _dmgB=(c,dx,dy)=>{const l=Math.hypot(dx,dy)||1,cp=Math.cos(c.psi),sp=Math.sin(c.psi);return [(dx*cp+dy*sp)/l,(-dx*sp+dy*cp)/l];};
{const f=trkCollide;trkCollide=function(P){const c=P.car,v0=_dmgV(c),d0=c.d;f(P);
  const v1=_dmgV(c),dv=Math.hypot(v1[0]-v0[0],v1[1]-v0[1]);
  if(dv>3.2){const T=TRK.T,i=c.i,sg=Math.sign(d0)||1,b=_dmgB(c,T.nx[i]*sg,T.ny[i]*sg);trkDmgHit(P,dv,b[0],b[1]);}};}
{const f=trkCarsCollide;trkCarsCollide=function(A,B){const a0=_dmgV(A.car),b0=_dmgV(B.car);f(A,B);
  const a1=_dmgV(A.car),b1=_dmgV(B.car),dA=Math.hypot(a1[0]-a0[0],a1[1]-a0[1]),dB=Math.hypot(b1[0]-b0[0],b1[1]-b0[1]);
  if(dA>3.2||dB>3.2){const dx=B.car.X-A.car.X,dy=B.car.Y-A.car.Y,ba=_dmgB(A.car,dx,dy),bb=_dmgB(B.car,-dx,-dy);trkDmgHit(A,dA,ba[0],ba[1]);trkDmgHit(B,dB,bb[0],bb[1]);}};}
{const f=trkVertical;trkVertical=function(P,h){const was=P.air;f(P,h);if(was&&!P.air)trkDmgLand(P,-(P.landV||0));};}
/* in fisica: carico aerodinamico ridotto e spinta laterale dell'ala storta (cresce col quadrato della velocità, fino a 220 km/h) */
{const f=trkPhysics;trkPhysics=function(P,h){const D=P.dmg;
  if(D&&TRK_DMG.on){trkDmgAero(P);const v=Math.abs(P.car.vx);P.toe=D.toe+0.012*D.fwS*D.fw*Math.min(1,v*v/3700);P.toeR=D.toeR;}
  else if(P.toe||P.toeR||P.wgk){P.toe=P.toeR=0;P.wgk=null;}
  f(P,h);};}
/* box: il computer si ferma se l'auto è messa male; la sosta dura di più per ogni pezzo da sistemare */
function trkDmgFixTime(P){const D=P.dmg;if(!D||!TRK_DMG.on)return 0;let t=0;
  if(D.fw>0.04)t+=3+5*D.fw;if(D.rw>0.04)t+=3+6*D.rw;for(const s of D.s)if(s>0.04)t+=3.5+7*s;return Math.min(32,t);}
function trkDmgParts(D){const o=[];if(D.fw>0.04)o.push('ala anteriore');if(D.rw>0.04)o.push('ala posteriore');const ns=D.s.filter(s=>s>0.04).length;if(ns)o.push(ns===1?'una sospensione':`${ns} sospensioni`);return o;}
{const f=trkPitWanted;trkPitWanted=function(P){const t=f(P);if(t>=0)return t;const R=TRK.race,left=TRK.duo&&R.state==='run'?R.laps-P.lapsDone:99;
  return trkDmgSev(P.dmg)>0.4&&left>1?P.tire:-1;};}
{const f=trkPitTime;trkPitTime=function(P){return f(P)+trkDmgFixTime(P);};}
{const f=trkPitStep;trkPitStep=function(P,dt){const was=P.pit&&P.pit.ph;f(P,dt);
  if(P.pit&&was!=='stop'&&P.pit.ph==='stop'&&trkDmgFixTime(P)>0)trkToast(P,`Sosta: gomme ${TRK_TIRES[P.pit.tire].n.toLowerCase()} e riparazione (${trkDmgParts(P.dmg).join(', ')}) · ${P.pit.t.toFixed(0)} s`,P.pit.t+0.4);};}
{const f=trkPitService;trkPitService=function(P){const fix=trkDmgFixTime(P)>0;f(P);if(fix){trkDmgClear(P);if(P.isAI)P.sim=lapSim(P.veh,TRK.RL,P.simG);else trkToast(P,`Auto riparata e gomme ${TRK_TIRES[P.tire].n.toLowerCase()} montate: via!`,1.8);}};}
/* partenza dal via: auto nuova */
{const f=trkReset;trkReset=function(P,grid,slot){f(P,grid,slot);if(grid&&P.dmg){trkDmgClear(P);if(P.isAI&&P.veh&&TRK.RL)P.sim=lapSim(P.veh,TRK.RL,P.simG||1);}};}

/* ---------- aspetto e indicatori (solo con la grafica) ---------- */
/* la carrozzeria si abbassa e s'inclina verso le sospensioni piegate */
if(typeof trkVisual==='function'){const f=trkVisual;trkVisual=function(P,dt){f(P,dt);const D=P.dmg;if(!D||!P.rig||TRK.replay.on)return;
  const s=D.s.map(x=>x*0.045),V=P.veh,vis=P.rig;vis.position.y-=(s[0]+s[1]+s[2]+s[3])/4;
  vis.rotation.x+=((s[1]+s[3])-(s[0]+s[2]))/2/V.track;vis.rotation.z+=((s[2]+s[3])-(s[0]+s[1]))/2/V.lwb;};}
/* nel cruscotto: barrette per le ali sopra e sotto la sagoma delle gomme, alone colorato sulle ruote con la sospensione piegata */
const trkDmgCol=x=>x<0.04?'':x<0.35?'#ffd23e':x<0.7?'#ff8a2a':'#ff3b30';
if(typeof trkHudUpdate==='function'){
  for(const P of [TRK.p[0],TRK.p[1]]){const E=P.el;if(!E)continue;const ty=E.root.querySelector('.g-tyres');
    ty.insertAdjacentHTML('beforeend','<b class="dw f"></b><b class="dw r"></b>');E.dwF=ty.querySelector('.dw.f');E.dwR=ty.querySelector('.dw.r');
    E.root.querySelector('.g-info').insertAdjacentHTML('beforeend','<div class="v-dmg" hidden></div>');E.dmg=E.root.querySelector('.v-dmg');}
  const f=trkHudUpdate;trkHudUpdate=function(P){f(P);const E=P.el,D=TRK_DMG.on?P.dmg:null;if(!E||!E.dwF)return;
    const key=D?[D.fw,D.rw,...D.s].map(x=>Math.round(x*20)).join():'';if(E.dmgKey===key)return;E.dmgKey=key;
    E.dwF.style.background=D?trkDmgCol(D.fw):'';E.dwR.style.background=D?trkDmgCol(D.rw):'';
    E.tyres.forEach((t,k)=>{const c=D?trkDmgCol(D.s[k]):'';t.style.boxShadow=c?`0 0 0 2px ${c}`:'';});
    const sev=trkDmgSev(D);E.dmg.hidden=sev<0.04;if(sev>=0.04)E.dmg.textContent=`Danni ${Math.round(sev*100)} % · box +${Math.round(trkDmgFixTime(P))} s`;};}
if(typeof toggle==='function'&&document.getElementById('trkDmg')){toggle('trkDmg',v=>{TRK_DMG.on=v;try{localStorage.setItem('vespera-dmg',v?'1':'0');}catch(e){}});setPressed('trkDmg',TRK_DMG.on);}
