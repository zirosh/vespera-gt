/* =========================================================
   Pista: tracciato, traiettoria ideale e simulatore del giro
   Coordinate del piano: X verso est, Y verso nord (nel mondo 3D x = X, z = −Y)
   ========================================================= */
/* i circuiti: stesso rettilineo dei box (traguardo a X ≈ −60), tracciato e colline diversi */
const TRK_DEFS=[
 {id:'prealpi',name:'Circuito delle Prealpi',short:'Prealpi',banner:'CIRCUITO DELLE PREALPI',autumn:false,
  pts:null,hills:null,corners:['Tornante','Esse','Curvone','Curva del Bosco','Chicane','Piega Nord','Variante','Parabolica'],
  bridge:[380,400,860],tower:[-760,1150]},
 {id:'montello',name:'Anello del Montello',short:'Montello',banner:'ANELLO DEL MONTELLO',autumn:true,
  pts:[[-400,0],[200,0],[560,0],[650,15],[690,70],[660,130],[580,150],[440,150],[370,190],[365,270],[430,330],[540,390],[600,480],[580,580],[480,690],[360,800],[260,860],[150,860],[90,820],[30,830],[-30,880],[-160,895],[-280,860],[-330,780],[-280,710],[-170,690],[-120,630],[-180,560],[-320,530],[-440,470],[-520,350],[-545,200],[-505,80]],
  /* il Montello: una grande collina a nord su cui sale il rettilineo in diagonale, il tornante dell'abbazia in quota, le esse delle vigne */
  hills:[[180,800,24,230],[-300,790,15,150],[470,260,11,130],[-470,330,9,190],[620,560,7,120],[420,745,6,42]],
  corners:['Tornante del Piave','Esse delle Vigne','Curvone','Variante del Bosco','Tornante dell\'Abbazia','Esse dei Castagni','Curva del Lago','Ultima','Piega','Curva 10'],
  bridge:[470,495,640],tower:[-830,1120]},
 {id:'grappa',name:'Circuito del Grappa',short:'Grappa',banner:'CIRCUITO DEL GRAPPA',autumn:false,mountain:true,
  /* il Grappa: si sale con due tornanti sul fianco della montagna, si scollina a 57 m, poi giù con un curvone veloce e le esse delle malghe */
  pts:[[-400,0],[200,0],[560,0],[690,25],[745,110],[725,230],[640,320],[520,370],[420,360],[365,370],[345,410],[375,445],[480,480],[590,530],[640,575],[625,625],[570,650],[460,665],[350,700],[270,760],[250,830],[200,880],[120,890],[40,850],[-60,800],[-150,790],[-230,760],[-275,700],[-250,640],[-280,575],[-350,530],[-410,470],[-440,390],[-470,320],[-470,255],[-545,210],[-508,82]],
  hills:[[420,950,66,340],[-120,800,22,170],[650,420,8,120]],
  corners:['Curva del Brenta','Tornante Basso','Tornante Alto','Cima','Curvone della Discesa','Esse delle Malghe','Curva del Bosco','Ultima'],
  bridge:[-300,-150,600],tower:[-800,1150]}];
const TRK_PTS=[[-400,0],[200,0],[560,0],[700,10],[765,65],[725,128],[640,132],[470,150],[350,195],[290,290],[300,410],[370,540],[500,625],[625,700],[650,790],[575,862],[330,884],[205,885],[168,884],[146,876],[126,864],[104,860],[82,869],[58,881],[10,884],[-150,882],[-330,846],[-430,750],[-468,632],[-436,556],[-472,484],[-528,372],[-545,220],[-510,85]];
const TRK_W=12;        // larghezza della carreggiata
/* colline: [X, Y, altezza, raggio] — salita dopo il tornante fino al Curvone, dosso sul rettilineo opposto prima della chicane,
   discesa della Parabolica verso il traguardo */
const TRK_HILLS=[[330,380,14,230],[335,893,7,50],[-520,420,11,260],[640,760,8,160]];
TRK_DEFS[0].pts=TRK_PTS;TRK_DEFS[0].hills=TRK_HILLS;
let TRKDEF=TRK_DEFS[0];
function trkTerrain(X,Y){let h=0;for(const [x,y,a,s] of TRKDEF.hills){const d2=(X-x)*(X-x)+(Y-y)*(Y-y);h+=a*Math.exp(-d2/(2*s*s));}return h;}
const TRK_DS=2;        // passo di campionamento
/* Catmull-Rom centripeta chiusa */
function trkSpline(P,per){
  const n=P.length,out=[];
  for(let i=0;i<n;i++){
    const p0=P[(i-1+n)%n],p1=P[i],p2=P[(i+1)%n],p3=P[(i+2)%n];
    const d=(a,b)=>Math.pow(Math.hypot(b[0]-a[0],b[1]-a[1]),0.5)||1e-4;
    const t0=0,t1=t0+d(p0,p1),t2=t1+d(p1,p2),t3=t2+d(p2,p3);
    for(let k=0;k<per;k++){
      const t=t1+(t2-t1)*k/per;
      const L=(a,b,ta,tb)=>[(tb-t)/(tb-ta)*a[0]+(t-ta)/(tb-ta)*b[0],(tb-t)/(tb-ta)*a[1]+(t-ta)/(tb-ta)*b[1]];
      const A1=L(p0,p1,t0,t1),A2=L(p1,p2,t1,t2),A3=L(p2,p3,t2,t3);
      const B1=L(A1,A2,t0,t2),B2=L(A2,A3,t1,t3);
      out.push(L(B1,B2,t1,t2));
    }
  }
  return out;
}
/* ricampiona a passo costante, partenza a metà del rettilineo */
function trkBuild(){
  const raw=trkSpline(TRKDEF.pts,60);
  const cum=[0];for(let i=1;i<=raw.length;i++){const a=raw[i-1],b=raw[i%raw.length];cum.push(cum[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]));}
  const Ltot=cum[raw.length],N=Math.round(Ltot/TRK_DS),ds=Ltot/N;
  let X=new Float64Array(N),Y=new Float64Array(N);let j=0;
  for(let i=0;i<N;i++){const s=i*ds;while(cum[j+1]<s)j++;const f=(s-cum[j])/(cum[j+1]-cum[j]),a=raw[j],b=raw[(j+1)%raw.length];X[i]=a[0]+(b[0]-a[0])*f;Y[i]=a[1]+(b[1]-a[1])*f;}
  /* il traguardo a X ≈ −60 sul rettilineo principale */
  let i0=0,best=1e9;for(let i=0;i<N;i++){const d=Math.hypot(X[i]+60,Y[i]);if(d<best){best=d;i0=i;}}
  const rot=a=>{const o=new Float64Array(N);for(let i=0;i<N;i++)o[i]=a[(i+i0)%N];return o;};X=rot(X);Y=rot(Y);
  const T=trkFrames(X,Y,ds);
  /* quota della strada lungo il giro, lisciata, con pendenza e curvatura verticale (positiva = compressione, negativa = dosso) */
  const h0=new Float64Array(N);for(let i=0;i<N;i++)h0[i]=trkTerrain(X[i],Y[i]);
  const sm=(a,r)=>{const o=new Float64Array(N);for(let i=0;i<N;i++){let s=0,w=0;for(let q=-r;q<=r;q++){const ww=Math.exp(-q*q/(2*(r/2.5)**2));s+=a[(i+q+N)%N]*ww;w+=ww;}o[i]=s/w;}return o;};
  const h=sm(h0,14),sl=new Float64Array(N),kv=new Float64Array(N);
  for(let i=0;i<N;i++){const a=h[(i-1+N)%N],b=h[(i+1)%N];sl[i]=(b-a)/(2*ds);kv[i]=(b-2*h[i]+a)/(ds*ds);}
  return {N,ds,L:Ltot,X,Y,tx:T.tx,ty:T.ty,nx:T.nx,ny:T.ny,k:T.k,w:TRK_W,h,sl:sm(sl,6),kv:sm(kv,10)};
}
/* tangenti, normali a sinistra e curvatura con segno (positiva a sinistra), lisciata */
function trkFrames(X,Y,ds){
  const N=X.length,tx=new Float64Array(N),ty=new Float64Array(N),nx=new Float64Array(N),ny=new Float64Array(N),k=new Float64Array(N),h=new Float64Array(N);
  for(let i=0;i<N;i++){const a=(i-1+N)%N,b=(i+1)%N;const dx=X[b]-X[a],dy=Y[b]-Y[a],l=Math.hypot(dx,dy)||1;tx[i]=dx/l;ty[i]=dy/l;nx[i]=-ty[i];ny[i]=tx[i];h[i]=Math.atan2(ty[i],tx[i]);}
  for(let i=0;i<N;i++){const a=(i-1+N)%N,b=(i+1)%N;let d=h[b]-h[a];while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
    const l=Math.hypot(X[b]-X[a],Y[b]-Y[a])||2*ds;k[i]=d/l;}
  const k2=new Float64Array(N);for(let i=0;i<N;i++){let s=0,w=0;for(let o=-3;o<=3;o++){const ww=4-Math.abs(o);s+=k[(i+o+N)%N]*ww;w+=ww;}k2[i]=s/w;}
  return {tx,ty,nx,ny,k:k2};
}
/* traiettoria a curvatura minima dentro la carreggiata (elastico): restituisce lo spostamento laterale e per ogni campione */
function trkRacingLine(T,margin){
  const N=T.N,lim=T.w/2-margin,e=new Float64Array(N),px=new Float64Array(N),py=new Float64Array(N);
  for(let it=0;it<1400;it++){
    for(let i=0;i<N;i++){px[i]=T.X[i]+e[i]*T.nx[i];py[i]=T.Y[i]+e[i]*T.ny[i];}
    for(let i=0;i<N;i++){
      const a=(i-1+N)%N,b=(i+1)%N;
      const mx=(px[a]+px[b])/2-px[i],my=(py[a]+py[b])/2-py[i];
      const d=mx*T.nx[i]+my*T.ny[i];
      e[i]=Math.max(-lim,Math.min(lim,e[i]+0.9*d));
    }
  }
  /* liscia per togliere il rumore residuo */
  const e2=new Float64Array(N);for(let i=0;i<N;i++){let s=0,w=0;for(let o=-4;o<=4;o++){const ww=5-Math.abs(o);s+=e[(i+o+N)%N]*ww;w+=ww;}e2[i]=Math.max(-lim,Math.min(lim,s/w));}
  for(let i=0;i<N;i++){px[i]=T.X[i]+e2[i]*T.nx[i];py[i]=T.Y[i]+e2[i]*T.ny[i];}
  const F=trkFrames(px,py,T.ds);
  const seg=new Float64Array(N);for(let i=0;i<N;i++){const b=(i+1)%N;seg[i]=Math.hypot(px[b]-px[i],py[b]-py[i]);}
  return {e:e2,X:px,Y:py,k:F.k,tx:F.tx,ty:F.ty,seg,kv:T.kv,sl:T.sl};
}
/* ---------------------------------------------------------
   Auto per il simulatore: tutto ciò che serve è in VEH
   VEH={m,kw,mu,wf,h,lwb,track,aero(v)->{D,Ff,Fr}}  (Ff, Fr deportanza sugli assi in N, negativa = portanza)
   --------------------------------------------------------- */
/* gomme: le posteriori un po' più larghe (più aderenti e più rigide) rendono l'auto sottosterzante al limite, come le auto stradali */
const TIRE={Fz0:4000,ks:0.10,C:1.45,Bf:12,Br:15,rear:1.06};
const TIRE_PEAK=Math.tan(Math.PI/(2*TIRE.C))/TIRE.Bf;  // angolo di deriva di picco all'anteriore (rad)
/* aderenza massima di un asse con carico N e trasferimento laterale dN (due gomme sensibili al carico) */
function axleGrip(mu,N,dN){
  if(N<=0)return 0;
  const g=mu*(N*(1-TIRE.ks*N/(2*TIRE.Fz0))-2*TIRE.ks*dN*dN/TIRE.Fz0);
  return Math.max(g,0.08*mu*N);
}
/* o (facoltativo): mu = aderenza della superficie e del meteo, g = gravità apparente (dossi < 1, compressioni > 1),
   ad / al = fattori di resistenza e carico aerodinamico (scia e aria sporca), mf / mr = stato delle gomme davanti e dietro */
const VL0={mu:1,g:1,ad:1,al:1,mf:1,mr:1};
function vehLoads(V,v,ax,ay,o){
  o=o||VL0;const A0=V.aero(v),g=9.81*(o.g===undefined?1:o.g),m=V.m,mu=V.mu*(o.mu||1);
  const al=o.al===undefined?1:o.al,bf=o.bf||1,br=o.br||1,A=al===1&&bf===1&&br===1&&(o.ad===undefined||o.ad===1)?A0:{D:A0.D*(o.ad===undefined?1:o.ad),Ff:A0.Ff*al*bf,Fr:A0.Fr*al*br};
  const dL=m*ax*V.h/V.lwb;
  const Nf=Math.max(0,m*g*V.wf+A.Ff-dL),Nr=Math.max(0,m*g*(1-V.wf)+A.Fr+dL);
  const dNf=Math.min(Nf/2,m*V.wf*Math.abs(ay)*V.h/V.track),dNr=Math.min(Nr/2,m*(1-V.wf)*Math.abs(ay)*V.h/V.track);
  return {A,Nf,Nr,Gf:axleGrip(mu*(o.mf||1),Nf,dNf),Gr:axleGrip(mu*TIRE.rear*(o.mr||1),Nr,dNr)};
}
/* velocità massima in una curva di curvatura k (entrambi gli assi devono reggere la propria quota di forza laterale) */
function cornerSpeed(V,k,kv,mu){
  const ak=Math.abs(k);if(ak<1e-5)return 400/3.6;
  let lo=5,hi=130;const o={mu:mu||1,g:1};
  for(let it=0;it<34;it++){const v=(lo+hi)/2,ay=v*v*ak;o.g=Math.max(0.05,1+v*v*(kv||0)/9.81);const L=vehLoads(V,v,0,ay,o);
    const ok=V.m*V.wf*ay<=L.Gf&&V.m*(1-V.wf)*ay<=L.Gr;if(ok)lo=v;else hi=v;}
  return Math.min(lo,400/3.6);
}
/* simulatore quasi-statico: curve al limite, poi accelerazione in avanti e frenata all'indietro con l'ellisse d'attrito */
function lapSim(V,RL,mu){
  const N=RL.k.length,vlim=new Float64Array(N),kv=RL.kv,sl=RL.sl,M=mu||1;
  for(let i=0;i<N;i++)vlim[i]=cornerSpeed(V,RL.k[i],kv?kv[i]:0,M);
  const g=9.81,m=V.m,P=V.kw*1000*0.92,crr=0.012;
  const v=new Float64Array(N),o={mu:M,g:1};
  /* in salita la gravità frena, in discesa spinge; sui dossi le gomme sono meno caricate, nelle compressioni di più */
  const accel=(vv,i)=>{const k=RL.k[i],ay=vv*vv*Math.abs(k);o.g=Math.max(0.05,1+vv*vv*(kv?kv[i]:0)/g);const L=vehLoads(V,vv,0.3*g,ay,o);
    const Fyr=m*(1-V.wf)*ay,cap=L.Gr>0?Math.sqrt(Math.max(0,1-(Fyr/L.Gr)**2))*L.Gr:0;
    const Fdrive=Math.min(P/Math.max(vv,4),cap,m*g*1.3);return (Fdrive-L.A.D-crr*m*g)/m-g*(sl?sl[i]:0);};
  const brake=(vv,i)=>{const k=RL.k[i],ay=vv*vv*Math.abs(k);o.g=Math.max(0.05,1+vv*vv*(kv?kv[i]:0)/g);const L=vehLoads(V,vv,-0.8*g,ay,o);
    const Fyf=m*V.wf*ay,Fyr=m*(1-V.wf)*ay;
    const cf=L.Gf>0?Math.sqrt(Math.max(0,1-(Fyf/L.Gf)**2))*L.Gf:0,cr=L.Gr>0?Math.sqrt(Math.max(0,1-(Fyr/L.Gr)**2))*L.Gr:0;
    return Math.max(0.5,(cf+cr+L.A.D+crr*m*g)/m+g*(sl?sl[i]:0));};
  /* parte dal punto più lento e fa due giri per chiudere il ciclo */
  let i0=0;for(let i=1;i<N;i++)if(vlim[i]<vlim[i0])i0=i;
  let cur=vlim[i0];
  for(let n=0;n<2*N;n++){const i=(i0+n)%N;cur=Math.min(cur,vlim[i]);v[i]=cur;const a=accel(cur,i);cur=Math.sqrt(Math.max(1,cur*cur+2*a*RL.seg[i]));}
  cur=v[i0];
  for(let n=0;n<2*N;n++){const i=(i0-n+2*N)%N;cur=Math.min(cur,v[i]);v[i]=cur;const p=(i-1+N)%N;const b=brake(cur,p);cur=Math.sqrt(cur*cur+2*b*RL.seg[p]);}
  const t=new Float64Array(N+1);let full=0;
  for(let i=0;i<N;i++){const b=(i+1)%N,dt=2*RL.seg[i]/(v[i]+v[b]);t[i+1]=t[i]+dt;if(v[b]>v[i]+1e-3&&v[b]<vlim[b]-0.01)full+=dt;}
  let vmax=0,imax=0;for(let i=0;i<N;i++)if(v[i]>vmax){vmax=v[i];imax=i;}
  return {v,t,vlim,lap:t[N],vmax,imax,full:full/t[N]};
}
/* curve: tratti dove la velocità ha un minimo locale marcato */
function findCorners(T,RL,v){
  const N=v.length,out=[];
  for(let i=0;i<N;i++){
    let isMin=true;for(let o=-60;o<=60&&isMin;o++){if(o&&v[(i+o+N)%N]<v[i])isMin=false;}
    if(!isMin)continue;
    let up=0;for(let o=-150;o<=150;o++)up=Math.max(up,v[(i+o+N)%N]);
    if(up-v[i]<6)continue;
    if(out.length&&i-out[out.length-1].i<40)continue;
    out.push({i,k:RL.k[i]});
  }
  return out;
}
if(typeof module!=='undefined')module.exports={TRK_DEFS,setTrackDef:i=>{TRKDEF=TRK_DEFS[i];},TRK_PTS,trkTerrain,trkBuild,trkRacingLine,lapSim,cornerSpeed,findCorners,vehLoads,TIRE,TIRE_PEAK};
