/* prova di guidabilità con le ali vere della Vespera (tabelle esportate dal configuratore in aero-presets.json):
   per ogni assetto e circuito un pilota «da tastiera» (sterzo tutto o niente, come i tasti) segue la traiettoria
   al passo del simulatore e si contano uscite di pista, testacoda e angolo di deriva massimo.
   uso: node tools/handling-t.js [passo 1.0] [giri 2]   — AERO=file.json per altre tabelle, ASSIST=0 senza aiuti */
const {ctx,vm,TRK,H,tables,mkV,clamp}=require('./harness.js');
const pace=+(process.argv[2]||1),laps=+(process.argv[3]||2);
const rows=[];
for(const tr of [0,1,2]){
  vm.runInContext('TRKDEF=TRK_DEFS['+tr+'];TRK.data=null;',ctx);H.trkEnsureData();const T=TRK.T,N=T.N;
  for(const name in tables){
    TRK.weather=0;TRK.wet=0;TRK.rain=0;TRK.dryLine=0;TRK.duo=false;TRK.ai=false;TRK.collide=true;TRK.wearMode=0;TRK.assist=process.env.ASSIST!=='0';TRK.race.state='run';
    const P=TRK.p[0];TRK.cars=[P];P.isAI=false;P.el=null;P.tire=1;P.veh=mkV(tables[name]);P.simG=H.trkWxGrip(1,0);P.sim=H.lapSim(P.veh,TRK.RL,P.simG);
    P.pace=pace;P.ch=ctx.TRK_CHAR_PLAIN;P.errCool=1e9;P.vo={};P.aiOff=0;P.defT=0;P.defCool=0;P.stuckT=0;P.errT=0;P.errs=0;P.collT=0;P.wk=0;
    const c=P.car,i0=Math.round(N*0.95);Object.assign(c,{X:T.X[i0],Y:T.Y[i0],psi:Math.atan2(T.ty[i0],T.tx[i0]),vx:30,vy:0,r:0,delta:0,ax:0,ay:0,i:i0,d:0});
    P.zc=T.h[i0];P.air=false;P.surf='asfalto';P.Tf=P.Tr=85;P.Wf=P.Wr=0;P.steerIn=0;P.thr=0;P.brk=0;delete P.w;delete P.shiftT;H.trkWheelSync(P);
    const dt=1/60,sub=4,h=dt/sub;let t=0,dist=0,off=0,spins=0,inSpin=false,bmax=0,vmax=0,resets=0,lapT=[],lastI=c.i,lapStart=null,kbd=0;
    while(t<laps*200&&lapT.length<laps){t+=dt;TRK.clock=(TRK.clock||0)+dt;
      H.trkAIDrive(P,dt);
      /* pilota da tastiera: il tasto è premuto o no, e lo sterzo ci arriva con la stessa rampa di trkInputs */
      if(process.env.KBD!=="0"){const want=P.steerIn;kbd=want>0.12?1:want<-0.12?-1:Math.abs(want)>0.04&&Math.sign(want)===Math.sign(kbd)?kbd:0;
      if(!P.kbs)P.kbs=0;const rate=Math.sign(kbd)!==Math.sign(P.kbs)&&P.kbs!==0?5:2.4;P.kbs+=clamp(kbd*Math.min(1,Math.abs(want)*1.6+0.4)-P.kbs,-rate*dt,rate*dt);P.steerIn=P.kbs;}
      for(let k=0;k<sub;k++){H.trkPhysics(P,h);c.i=H.trkLocate(c.X,c.Y,c.i,6);c.d=(c.X-T.X[c.i])*T.nx[c.i]+(c.Y-T.Y[c.i])*T.ny[c.i];P.surf=H.trkSurface(c.i,c.d);H.trkCollide(P);H.trkVertical(P,h);}
      const beta=Math.abs(Math.atan2(c.vy,Math.max(Math.abs(c.vx),3)));if(c.vx>15)bmax=Math.max(bmax,beta);vmax=Math.max(vmax,c.vx);
      if(beta>0.45&&c.vx>8){if(!inSpin)spins++;inSpin=true;}else if(beta<0.15)inSpin=false;
      if(P.surf==='erba'||P.surf==='ghiaia')off+=dt;
      if(P.stuckT===0&&Math.abs(c.d)<0.01&&c.vx===0)resets++;
      if(lastI>N*0.9&&c.i<N*0.1){if(lapStart!=null)lapT.push(t-lapStart);lapStart=t;}lastI=c.i;
      if(!isFinite(c.X+c.vx)){lapT.push(NaN);break;}}
    rows.push({tr,name,sim:P.sim.lap.toFixed(1),giri:lapT.map(x=>x.toFixed(1)).join(' '),vmax:(vmax*3.6).toFixed(0),fuori:off.toFixed(1),testacoda:spins,deriva:(bmax*57.3).toFixed(1)});
  }}
console.table(rows);
