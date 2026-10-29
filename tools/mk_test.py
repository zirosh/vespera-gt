s=open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'../dist/index.html')).read()
mock=r'''<script>
(function(){const store=new Map(),subs=[];const snapAll=()=>{const docs=[...store.entries()].filter(([p])=>p.split('/').length===2&&p.startsWith('board/')).map(([p,d])=>({id:p.split('/')[1],exists:true,data:()=>d}));subs.forEach(cb=>cb({docs,size:docs.length,empty:!docs.length}));};
const docRef=p=>({path:p,id:p.split('/').pop(),set:async d=>{store.set(p,JSON.parse(JSON.stringify(d)));window.__dbw=(window.__dbw||0)+1;setTimeout(snapAll,5);},get:async()=>({exists:store.has(p),data:()=>store.get(p)}),collection:c=>colRef(p+'/'+c)});
const colRef=p=>({path:p,doc:id=>docRef(p+'/'+id),onSnapshot:(cb,err)=>{subs.push(cb);setTimeout(snapAll,5);return ()=>{};}});
const db={doc:docRef,collection:colRef};
const user={id:async()=>'u_me',profiles:async ids=>{const o={};(Array.isArray(ids)?ids:[ids]).forEach(i=>o[i]={id:i,name:i==='u_me'?'Elia':'Marco',avatarUrl:'',color:'#888',email:null,isMe:i==='u_me',guest:false});return o;}};
store.set('board/u_x',{v:1,laps:{'1-abc':{t:118.2,track:1,car:'Supercar',kg:1520,kw:530,tire:1,wx:0,assist:1,at:1,gh:1}}});
store.set('board/u_x/ghosts/1-abc',{v:1,track:1,lap:118.2,pts:[]});
window.claude={use:async n=>n==='db'?db:n==='user'?user:null};window.__store=store;})();
</script>'''
s=s.replace('<style>',mock+'<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>',1)
s=s.replace('const TRK={on:false','window.__TRK=()=>TRK;window.__CH=()=>CH;window.__HELI=()=>HELI;window.__DBG=()=>({pb:paintBody.trkDirt?paintBody.trkDirt.uDirt.value:null,g:paintBody.trkDirt?paintBody.trkDirt.uGround.value:null,lit:paintBody.userData.trkLit,progs:renderer.info.programs.map(p=>p.cacheKey.slice(-40)).filter(k=>k.includes("trk"))});const TRK={on:false',1)
s=s.replace('function trkFrame(dt){','window.__STEP=(n,dt)=>{for(let k=0;k<n;k++)trkFrame(dt||1/60);};window.__PP=()=>PP;window.__R=()=>renderer;window.__B=()=>BOARD;window.__RENDER=()=>{renderer.info.autoReset=false;renderer.info.reset();trkRender();const c=renderer.info.render.calls,t=renderer.info.render.triangles;renderer.info.autoReset=true;return [c,t];};function trkFrame(dt){',1)
open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'../dist/_test.html'),'w').write(s)
