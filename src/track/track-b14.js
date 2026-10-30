/* =========================================================
   Texture fotografiche ad alta definizione, libreria CC0 di ambientCG (pubblico dominio, vedi src/assets/LEGGIMI.md):
   ghiaia Gravel006 (colore e rilievo) nelle vie di fuga, terreno erboso Ground037 sul prato. L'asfalto usa gli inerti
   della stessa scansione, scuriti e senza colore, a scala più piccola. Le immagini sono dentro la pagina (data URI),
   così il gioco resta un file unico. Se mancano si torna alle texture procedurali
   ========================================================= */
const TRK_PHOTO=/*@FOTO@*/{};
function trkPhotoTex(k,srgb){
  if(!TRK_PHOTO[k])return null;const t=new THREE.Texture(),im=new Image();
  im.onload=()=>{t.image=im;t.needsUpdate=true;};im.src=TRK_PHOTO[k];
  if(srgb)t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
{const f=trkGravelTex;trkGravelTex=function(){if(TXL.gravP)return TXL.gravP;const m=trkPhotoTex('gravelC',true),n=trkPhotoTex('gravelN',false);return TXL.gravP=m&&n?{map:m,normal:n}:f();};}
{const f=trkGrassTex;trkGrassTex=function(){if(TXL.grassP)return TXL.grassP;const m=trkPhotoTex('grassC',true);return TXL.grassP=m?{map:m}:f();};}
{const f=trkAsphaltTex;trkAsphaltTex=function(){if(TXL.asphP)return TXL.asphP;const m=trkPhotoTex('asphC',true),n=trkGravelTex().normal;return TXL.asphP=m&&n&&TRK_PHOTO.gravelN?{map:m,normal:n,photo:true}:f();};}
/* scale in metri per ripetizione: ciottoli di 2–3 cm in ghiaia, inerti di un centimetro nell'asfalto, prato a quadri di 4 m */
{const f=trkBuildWorld;trkBuildWorld=function(){const was=TRK.built;f();if(was)return;
  if(TXL.asphP&&TXL.asphP.photo&&TRK.asphalt){TRK.asphalt.userData.wuv=1.6;TRK.asphalt.normalScale.set(0.35,0.35);}
  if(TXL.grassP&&TRK.grassMat)TRK.grassMat.userData.wuv=4;};}
/* ---------- luce e riflessi da fotografie panoramiche HDR (Poly Haven, CC0) ----------
   Al posto del cielo sintetico, ogni ora del giorno ha la sua HDRI: parco al sole, prato alpino nuvoloso (bagnato e pioggia),
   tramonto, notte stellata. Si caricano solo quando servono; il sole della foto viene ruotato nella stessa direzione della
   luce principale, così riflessi e ombre concordano. Finché non è pronta resta l'ambiente sintetico */
const TRK_HDRI={day:['rooitou_park_1k.hdr',1],overcast:['immenstadter_horn_1k.hdr',1.1],sunset:['venice_sunset_1k.hdr',1.2],night:['dikhololo_night_1k.hdr',1.6],nightrain:['dikhololo_night_1k.hdr',0.8]};
const HDRI={env:{},busy:{}};
function trkHdriLoad(kind){
  const H=TRK_HDRI[kind];if(!H||HDRI.busy[kind]||!THREE.RGBELoader)return;HDRI.busy[kind]=true;
  new THREE.RGBELoader().setDataType(THREE.FloatType).load('assets/'+H[0],t=>{
    const im=t.image,W=im.width,Hh=im.height,d=im.data,sun=TRK_SUN[kind==='overcast'?'day':kind==='nightrain'?'night':kind]||TRK_SUN.day;
    /* colonna più luminosa = azimut del sole nella foto; spostamento orizzontale per portarlo dove sta la luce della scena */
    let best=-1,bx=0;for(let y=0;y<Hh/2;y++)for(let x=0;x<W;x++){const k=(y*W+x)*3,L=d[k]+d[k+1]+d[k+2];if(L>best){best=L;bx=x;}}
    const ut=Math.atan2(sun[2],sun[0])/(2*Math.PI)+0.5,sh=Math.round((ut-bx/W)*W),out=new Float32Array(d.length),kk=H[1];
    for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){const s=(y*W+x)*3,o=(y*W+((x+sh)%W+W)%W)*3;out[o]=d[s]*kk;out[o+1]=d[s+1]*kk;out[o+2]=d[s+2]*kk;}
    im.data=out;t.needsUpdate=true;
    const pm=new THREE.PMREMGenerator(renderer),env=pm.fromEquirectangular(t).texture;pm.dispose();t.dispose();
    HDRI.env[kind]=env;if(TRK.built)trkAtmo();},undefined,()=>{});
}
{const f=trkEnvFor;trkEnvFor=function(kind){if(HDRI.env[kind])return HDRI.env[kind];trkHdriLoad(kind);return f(kind);};}
