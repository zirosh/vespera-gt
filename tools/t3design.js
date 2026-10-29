const C=require('../src/track/track-core.js');
const def={id:'grappa',name:'Circuito del Grappa',short:'Grappa',banner:'CIRCUITO DEL GRAPPA',autumn:false,
 pts:JSON.parse(process.argv[2]),hills:JSON.parse(process.argv[3]),corners:[],bridge:[-300,-150,600],tower:[-800,1150]};
C.TRK_DEFS[2]=def;C.setTrackDef(2);
const T=C.trkBuild(),RL=C.trkRacingLine(T,1.2),N=T.N;
const ref={m:1480,kw:460,mu:1.15,wf:0.51,h:0.45,lwb:2.7,track:1.62,aero:v=>{const q=0.6125*v*v;return {D:q*0.72,Ff:-q*0.02,Fr:-q*0.05};}};
const S=C.lapSim(ref,RL);
let hmin=1e9,hmax=-1e9,gmin=9,gmax=0,smax=0;for(let i=0;i<N;i++){hmin=Math.min(hmin,T.h[i]);hmax=Math.max(hmax,T.h[i]);const g=1+(S.v[i]**2)*T.kv[i]/9.81;gmin=Math.min(gmin,g);gmax=Math.max(gmax,g);smax=Math.max(smax,Math.abs(T.sl[i]));}
/* parti vicine non adiacenti */
let worst=1e9,wi=0,wj=0;for(let i=0;i<N;i+=3)for(let j=0;j<N;j+=3){let di=Math.abs(i-j);di=Math.min(di,N-di);if(di<60)continue;const d=Math.hypot(T.X[i]-T.X[j],T.Y[i]-T.Y[j]);if(d<worst){worst=d;wi=i;wj=j;}}
let minR=1e9;for(let i=0;i<N;i++)minR=Math.min(minR,1/Math.max(1e-6,Math.abs(T.k[i])));
const cs=C.findCorners(T,RL,S.v);
console.log('L',T.L.toFixed(0),'N',N,'lap',S.lap.toFixed(2),'vmax',(S.vmax*3.6).toFixed(0),'minR',minR.toFixed(0),'h',hmin.toFixed(1),hmax.toFixed(1),'pend max',(smax*100).toFixed(1)+'%','g',gmin.toFixed(2),gmax.toFixed(2),'vicini',worst.toFixed(0),'m tra',wi,wj,'dh',Math.abs(T.h[wi]-T.h[wj]).toFixed(1));
console.log('curve',cs.length,cs.map(c=>`${c.i}:${(S.v[c.i]*3.6).toFixed(0)}@${T.h[c.i].toFixed(0)}m`).join(' '));
let prof='';for(let i=0;i<N;i+=Math.round(N/24))prof+=` ${i}:${T.h[i].toFixed(0)}`;console.log('quota',prof);
