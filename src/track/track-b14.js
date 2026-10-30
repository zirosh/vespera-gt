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
