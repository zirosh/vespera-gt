const C=require('../src/track/track-core.js');
for(const k of [0,1]){C.setTrackDef(k);const T=C.trkBuild(),RL=C.trkRacingLine(T,1.2);
 const ref={m:1480,kw:460,mu:1.15,wf:0.51,h:0.45,lwb:2.7,track:1.62,aero:v=>{const q=0.6125*v*v;return {D:q*0.72,Ff:-q*0.02,Fr:-q*0.05};}};
 const S=C.lapSim(ref,RL);let minR=1e9,mi=0;for(let i=0;i<T.N;i++){const r=1/Math.max(1e-6,Math.abs(T.k[i]));if(r<minR){minR=r;mi=i;}}
 let hmin=1e9,hmax=-1e9,gmin=9;for(let i=0;i<T.N;i++){hmin=Math.min(hmin,T.h[i]);hmax=Math.max(hmax,T.h[i]);gmin=Math.min(gmin,1+(S.v[i]**2)*T.kv[i]/9.81);}
 const cs=C.findCorners(T,RL,S.v);
 let straight='';for(const o of [-200,-180,-150,-120,-60,0,60,130,180]){const i=(o+T.N)%T.N;straight+=` ${o}:${(1/Math.max(1e-6,Math.abs(T.k[i]))).toFixed(0)}`;}
 console.log(C.TRK_DEFS[k].name,'L',T.L.toFixed(0),'N',T.N,'lap',S.lap.toFixed(2),'vmax',(S.vmax*3.6).toFixed(0),'minR',minR.toFixed(0),'at',mi,'h',hmin.toFixed(1),hmax.toFixed(1),'gmin',gmin.toFixed(2),'corners',cs.length,'R:',straight);
 console.log('  curve km/h',cs.map(c=>(S.v[c.i]*3.6).toFixed(0)).join(' '));}
