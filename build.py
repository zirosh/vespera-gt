import re,sys
import os
ROOT=os.path.dirname(os.path.abspath(__file__))+'/'
SP=ROOT+'src/'
TR=ROOT+'src/track/'
P=ROOT+'dist/index.html'
s=open(SP+'base.html').read()
def rep(a,b,cnt=1):
    global s
    n=s.count(a)
    assert n==cnt,(n,a[:90])
    s=s.replace(a,b)

CSS=r'''
/* pista */
.racing .nameplate,.racing .hint,.racing .legend,.racing .alert{display:none!important}
.trk-hud{position:absolute;inset:0;pointer-events:none;color:#f3f5f6;font-family:"Saira",system-ui,sans-serif;z-index:2;--pr:330px}
.duo .trk-hud{--pr:0px}
.trk-hud[hidden]{display:none}
.th-player{position:absolute;inset:0;overflow:hidden}
.th-player[hidden]{display:none}
.duo #thP1{right:50%}.duo #thP2{left:50%}
.duo.duo-v #thP1{right:0;bottom:50%}.duo.duo-v #thP2{left:0;top:50%}
.duo #thP2::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:rgba(10,12,14,.85)}
.duo.duo-v #thP2::before{right:0;width:auto;height:3px;bottom:auto}
.th-card{background:rgba(12,14,17,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);border-radius:14px}
.th-time{position:absolute;left:clamp(12px,2vw,28px);top:clamp(12px,2vh,24px);padding:10px 14px 10px;min-width:210px}
.th-tag{display:none;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.duo .th-tag{display:block}
#thP1 .th-tag{color:#ff8f80}#thP2 .th-tag{color:#8fb8ff}
.th-lapn{font-size:.78rem;color:rgba(243,245,246,.72)}
.th-big{font-family:"Saira Condensed","Arial Narrow",sans-serif;font-weight:800;font-size:2.5rem;line-height:1;font-variant-numeric:tabular-nums;margin-top:2px}
.th-time dl{display:grid;grid-template-columns:auto auto;gap:2px 14px;margin:8px 0 0;font-size:.8rem}
.th-time dt{color:rgba(243,245,246,.68)}
.th-time dd{margin:0;text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
.th-delta{font-size:.86rem;font-weight:600;margin-top:6px;font-variant-numeric:tabular-nums;min-height:1.2em}
.th-delta.fast{color:#79e3a2}.th-delta.slow{color:#ff9584}
.th-map{position:absolute;left:clamp(12px,2vw,28px);top:calc(clamp(12px,2vh,24px) + 210px);width:190px;height:190px}
.th-speed{position:absolute;left:calc((100% - var(--pr))/2);transform:translateX(-50%);bottom:clamp(12px,2.5vh,26px);padding:8px 18px 10px;text-align:center;min-width:270px}
.th-sp{display:flex;align-items:baseline;justify-content:center;gap:8px}
.v-kmh{font-family:"Saira Condensed","Arial Narrow",sans-serif;font-weight:800;font-size:3.2rem;line-height:1;font-variant-numeric:tabular-nums;min-width:2.2em;text-align:right}
.th-sp small{font-size:.8rem;color:rgba(243,245,246,.7)}
.v-gear{font-family:"Saira Condensed","Arial Narrow",sans-serif;font-weight:800;font-size:1.6rem;border:1.5px solid rgba(243,245,246,.5);border-radius:8px;padding:0 9px;margin-left:6px}
.th-bars{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0 6px}
.th-bars span{height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.th-bars i{display:block;height:100%;transform-origin:left;transform:scaleX(0)}
.v-thr{background:#6fd893}.v-brk{background:#ff7462}
.v-aero{display:flex;gap:12px;justify-content:center;font-size:.76rem;color:rgba(243,245,246,.75);white-space:nowrap}
.v-aero b{color:#f3f5f6;font-variant-numeric:tabular-nums}
.v-surf{font-size:.76rem;color:#ffd27a;min-height:1em;margin-top:2px}
.th-toast{position:absolute;left:calc((100% - var(--pr))/2);transform:translateX(-50%);top:calc(clamp(12px,2vh,24px) + 54px);padding:9px 16px;font-size:.92rem;font-weight:600;max-width:min(520px,calc(100% - 60px));text-align:center}
.duo .th-toast{top:calc(clamp(12px,2vh,24px) + 74px)}
.th-toast[hidden]{display:none}
.th-pos{position:absolute;left:calc((100% - var(--pr))/2);transform:translateX(-50%);top:clamp(12px,2vh,24px);padding:5px 16px 7px;display:flex;align-items:baseline;gap:10px}
.th-pos[hidden]{display:none}
.v-pos{font-family:"Saira Condensed","Arial Narrow",sans-serif;font-weight:800;font-size:2.4rem;line-height:1}
.v-gap{font-variant-numeric:tabular-nums;font-weight:600;font-size:.95rem}
.th-btns{position:absolute;right:calc(clamp(12px,2vw,28px) + 312px);top:clamp(12px,2vh,24px);display:flex;gap:6px;pointer-events:auto;z-index:2}
.th-btns .bs{display:none}
.th-btns button,.tr-b button{border:1px solid rgba(255,255,255,.18);background:rgba(12,14,17,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#f3f5f6;font:inherit;font-size:.84rem;font-weight:600;padding:8px 12px;border-radius:10px;cursor:pointer}
.duo .th-btns{right:auto;left:50%;transform:translateX(-50%);top:auto;bottom:clamp(12px,2.5vh,26px);flex-wrap:wrap;justify-content:center;width:min(320px,27%)}
.duo .th-btns button{padding:6px 9px;font-size:.78rem}
.duo.duo-v .th-btns{left:auto;right:10px;transform:translateY(-50%);top:50%;bottom:auto}
#thPanel{display:none}
.duo #thPanel{display:block}
#thKeys{position:absolute;left:calc((100% - var(--pr))/2);transform:translateX(-50%);bottom:calc(clamp(12px,2.5vh,26px) + 128px);font-size:.75rem;color:rgba(243,245,246,.85);text-shadow:0 1px 3px rgba(0,0,0,.7);white-space:nowrap}
#thKeys .k2{display:none}
.duo #thKeys{left:50%;bottom:calc(clamp(12px,2.5vh,26px) + 84px);white-space:normal;width:min(300px,30%);text-align:center}
.duo #thKeys .k1{display:none}.duo #thKeys .k2{display:inline}
.duo.duo-v #thKeys{display:none}
#thTouch{display:none}
.touchy #thKeys{display:none}
.touchy #thTouch{display:block}
.duo #thTouch{display:none!important}
#thTouch button{position:absolute;bottom:calc(16px + env(safe-area-inset-bottom,0px));width:76px;height:76px;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);background:rgba(12,14,17,.45);color:#fff;font:inherit;font-weight:700;font-size:1rem;pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none}
#thTouch button.on{background:rgba(255,255,255,.3)}
#thTouch [data-k=left]{left:16px}#thTouch [data-k=right]{left:104px}
#thTouch [data-k=brake]{right:104px}#thTouch [data-k=gas]{right:16px;height:96px;border-radius:40px}
#thLights{position:absolute;left:50%;transform:translateX(-50%);top:26%;display:flex;gap:14px;padding:14px 18px;z-index:2}
#thLights[hidden]{display:none}
#thLights i{width:44px;height:44px;border-radius:50%;background:#2a0b0b;box-shadow:inset 0 0 0 3px rgba(0,0,0,.45)}
#thLights i.on{background:#ff2a1a;box-shadow:0 0 22px #ff2a1a,inset 0 0 0 3px rgba(0,0,0,.25)}
#thRace{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:18px 22px 16px;min-width:min(340px,calc(100% - 32px));pointer-events:auto;text-align:center;z-index:3}
#thRace[hidden]{display:none}
#thRace h3{margin:4px 0 12px;font-family:"Saira Condensed","Arial Narrow",sans-serif;font-weight:800;font-size:2.1rem;line-height:1}
#thRace dl{display:grid;grid-template-columns:1fr auto;gap:5px 16px;text-align:left;font-size:.86rem;margin:0 0 14px}
#thRace dt{color:rgba(243,245,246,.75)}#thRace dd{margin:0;font-weight:600;font-variant-numeric:tabular-nums;text-align:right}
.tr-k{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:rgba(243,245,246,.7)}
.tr-b{display:flex;gap:8px;justify-content:center}
.duo .racing .panel,.racing.duo .panel{display:none}
.racing.duo.panel-open .panel{display:block;z-index:4}
.duo .th-time{min-width:0;padding:8px 11px}
.duo .th-big{font-size:1.9rem}
.duo .th-map{width:150px;height:150px;top:calc(clamp(12px,2vh,24px) + 204px)}
.duo .th-speed{min-width:0;padding:6px 14px 8px}
.duo .v-kmh{font-size:2.6rem}
.duo .v-aero{font-size:.7rem;gap:8px}
.duo-v .th-map{left:auto;right:10px;top:10px;width:112px;height:112px}
.duo-v .th-time dl{display:none}
.duo-v .th-speed{bottom:8px}
.duo-v .v-aero{display:none}
.duo-v .th-toast{top:64px}
.v-tire{display:flex;gap:10px;justify-content:center;font-size:.72rem;margin-top:3px;white-space:nowrap}
.tw{color:rgba(243,245,246,.75)}.tw b{font-variant-numeric:tabular-nums}
.tw.cold b{color:#8fc2ff}.tw.ok b{color:#79e3a2}.tw.hot b{color:#ff8a6e}
.th-wake{position:absolute;left:calc((100% - var(--pr))/2);transform:translateX(-50%);bottom:calc(clamp(12px,2.5vh,26px) + 132px);padding:5px 12px;border-radius:999px;background:rgba(40,120,255,.75);font-size:.8rem;font-weight:600;white-space:nowrap}
.th-wake[hidden]{display:none}
.duo .th-wake{bottom:calc(clamp(12px,2.5vh,26px) + 118px)}
.replaying .th-player,.replaying #thLights,.replaying #thKeys,.replaying #thTouch{display:none!important}
#thReplay{position:absolute;left:calc((100% - var(--pr))/2);transform:translateX(-50%);bottom:clamp(12px,2.5vh,26px);width:min(720px,calc(100% - var(--pr) - 32px));padding:10px 14px 12px;pointer-events:auto;z-index:3}
#thReplay[hidden]{display:none}
.rp-top{display:flex;justify-content:space-between;align-items:baseline;font-size:.85rem;margin-bottom:4px}
.rp-top b{font-family:"Saira Condensed","Arial Narrow",sans-serif;font-weight:800;font-size:1.2rem;letter-spacing:.06em;text-transform:uppercase;color:#ff8f80}
#thRpT{width:100%;accent-color:#ff8f80}
.rp-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px}
.rp-row>button,.rp-seg button{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f3f5f6;font:inherit;font-size:.8rem;font-weight:600;padding:6px 10px;border-radius:9px;cursor:pointer}
.rp-seg{display:flex;gap:2px}.rp-seg[hidden]{display:none}
.rp-seg button.on{background:rgba(255,255,255,.28)}
.rp-row>button:last-child{margin-left:auto}
.sel{width:100%;font:inherit;font-size:.86rem;color:var(--ink);background:transparent;border:1px solid var(--edge);border-radius:10px;padding:7px 9px}
.sel option{color:#111}
.ttable{width:100%;border-collapse:collapse;font-size:.8rem;font-variant-numeric:tabular-nums}
.ttable th{text-align:right;color:var(--ink-soft);font-weight:500;padding:3px 4px;border-bottom:1px solid var(--edge)}
.ttable th:first-child,.ttable td:first-child{text-align:left}
.ttable td{text-align:right;padding:5px 4px;border-bottom:1px solid var(--edge)}
.ttable td.up{color:#2f9a5a}.ttable td.down{color:#c4402e}
.ttable small.dl{color:var(--ink-soft);font-size:.72rem}
.ttable .x{border:0;background:none;color:var(--ink-soft);font:inherit;font-size:1rem;cursor:pointer;padding:0 2px}
#trkChart{width:100%;height:170px;display:block;margin:4px 0 6px}
.small-btn:disabled{opacity:.6;cursor:progress}
.th-stand{position:absolute;left:clamp(12px,2vw,28px);top:calc(clamp(12px,2vh,24px) + 408px);padding:6px 8px;min-width:190px;font-size:.76rem;font-variant-numeric:tabular-nums}
.th-stand[hidden]{display:none}
.th-stand div{display:grid;grid-template-columns:18px 10px 1fr auto;gap:6px;align-items:center;padding:2px 2px;border-radius:5px}
.th-stand div.me{background:rgba(255,255,255,.16);font-weight:700}
.th-stand div.inpit em{color:#ffd27a}
.th-stand b{text-align:right;font-weight:700}.th-stand i{width:9px;height:9px;border-radius:2px;display:block}
.th-stand span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.th-stand em{font-style:normal;color:rgba(243,245,246,.75)}
.v-of{font-size:.85rem;color:rgba(243,245,246,.7);margin-left:-6px}
.tw-c{font-weight:700;color:#f3f5f6;margin-right:2px}
.th-pit{position:absolute;right:calc(var(--pr) + clamp(12px,2vw,28px));bottom:clamp(12px,2.5vh,26px);padding:8px 10px;pointer-events:auto;width:270px}
.th-pit[hidden]{display:none}
.pt-h{font-size:.8rem;font-weight:700;margin-bottom:6px}
.pt-b{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.pt-b button{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f3f5f6;font:inherit;font-size:.76rem;font-weight:600;padding:5px 7px;border-radius:8px;cursor:pointer;text-align:left}
.pt-b button b{opacity:.6;margin-right:3px}
.pt-b button.on{background:rgba(255,210,122,.32);border-color:rgba(255,210,122,.7)}
.th-pit.locked .pt-b{opacity:.55;pointer-events:none}
.duo .th-pit{left:clamp(12px,2vw,28px);right:auto;bottom:auto;top:calc(clamp(12px,2vh,24px) + 372px);width:230px}
.duo-v .th-pit{top:auto;bottom:8px;left:auto;right:10px}
.tr-sub{margin:-6px 0 10px;font-size:.88rem;color:rgba(243,245,246,.8)}
.tr-tab{width:100%;border-collapse:collapse;font-size:.84rem;margin:0 0 10px;font-variant-numeric:tabular-nums}
.tr-tab td{padding:3px 4px;text-align:left;border-bottom:1px solid rgba(255,255,255,.08);color:#e9ecee}
.tr-tab td:first-child{width:28px;color:rgba(243,245,246,.75)}.tr-tab td:nth-child(3),.tr-tab td:nth-child(4){text-align:right;white-space:nowrap}
.tr-tab tr.me td{font-weight:700;color:#fff}
.tr-tab i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px;vertical-align:baseline}
#thRace{max-height:calc(100% - 24px);overflow:auto}
@media (max-height:660px){.th-stand{display:none}}
.duo .v-wet,.duo .v-wetk{display:none}
.field #thKeys{display:none}
#thKeys .k3{display:none}.pad #thKeys .k1{display:none}.pad #thKeys .k3{display:inline}.pad.duo #thKeys .k3{display:none}
#thPause{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:18px 22px 14px;min-width:min(320px,calc(100% - 32px));pointer-events:auto;text-align:center;z-index:5}
#thPause[hidden]{display:none}
#thPause h3{margin:4px 0 4px;font-family:"Saira Condensed","Arial Narrow",sans-serif;font-weight:800;font-size:2.1rem;line-height:1}
.pz-b{display:grid;gap:7px;margin:8px 0 10px}
.pz-b button{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#f3f5f6;font:inherit;font-size:.95rem;font-weight:600;padding:10px 12px;border-radius:10px;cursor:pointer}
.pz-b button:hover{background:rgba(255,255,255,.14)}
#thPause button:focus-visible,#thRace button:focus-visible,#thPause button:focus,#thRace button:focus{outline:2px solid #ffd27a;outline-offset:2px}
.pz-h{font-size:.74rem;color:rgba(243,245,246,.65);margin:0}
.paused .th-player{opacity:.35}
.tr-tab small{color:rgba(243,245,246,.65);font-weight:500}
#trkBoard .ttable{table-layout:fixed}#trkBoard .ttable td{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#trkBoard .ttable td:nth-child(4){white-space:normal}#trkBoard .ttable td:last-child{overflow:visible;text-overflow:clip}
#trkBoard .ttable td.bcar{text-align:left}
#trkBoard .ttable th:nth-child(3){text-align:left}
#trkBoard tr.me td{font-weight:700}
#trkBoard .gh{font-size:.68rem;border:1px solid var(--edge);border-radius:8px;padding:2px 5px}
.racing:not(.duo) .th-pos{left:calc(clamp(12px,2vw,28px) + 224px);transform:none}
@media (max-width:720px){
  .racing .panel{display:none}
  .racing.panel-open .panel{display:block;z-index:4;max-height:60%}
  #thPanel{display:block}
  .th-btns{right:8px;left:8px;top:10px;justify-content:space-between;gap:4px}
  .th-btns button{padding:7px 6px;font-size:.74rem;flex:1 1 auto}
  .th-btns .bl{display:none}.th-btns .bs{display:inline}
  .racing:not(.duo) .th-time{max-width:calc(100% - 150px)}
  .racing:not(.duo) .th-wake{left:50%;bottom:calc(252px + env(safe-area-inset-bottom,0px))}
  #thReplay{left:50%;width:calc(100% - 20px);bottom:calc(10px + env(safe-area-inset-bottom,0px));padding:8px 10px 10px}
  .racing:not(.duo) .th-time{left:10px;top:54px;min-width:0;padding:7px 10px}
  .racing:not(.duo) .th-big{font-size:1.7rem}
  .racing:not(.duo) .th-time dl{font-size:.72rem;gap:1px 10px;margin-top:4px}
  .racing:not(.duo) .th-map{left:auto;right:10px;top:54px;width:112px;height:112px}
  .racing:not(.duo) .th-speed{left:50%;bottom:calc(112px + env(safe-area-inset-bottom,0px));min-width:0;padding:5px 12px 7px}
  .racing:not(.duo) .v-kmh{font-size:2.3rem}
  .v-aero{gap:8px;font-size:.68rem}
  .racing:not(.duo) .th-pos{left:50%;transform:translateX(-50%);top:208px;padding:4px 12px 5px;white-space:nowrap}
  .racing:not(.duo) .th-toast{left:50%;top:250px;bottom:auto;max-width:calc(100% - 32px);font-size:.82rem}
  .th-stand{display:none}
  .racing:not(.duo) .th-pit{right:10px;left:10px;top:318px;bottom:auto;width:auto;padding:6px 8px}
  .racing:not(.duo) .pt-b{grid-template-columns:repeat(4,1fr)}
  .racing:not(.duo) .pt-b button{font-size:.7rem;padding:5px 4px;text-align:center}
  .racing:not(.duo) .pt-b button b{display:none}
  .racing:not(.duo) .pt-h{font-size:.74rem;margin-bottom:4px}
  #thKeys{display:none}
}
'''
rep("@media (max-width:720px){\n  .panel{top:auto;", CSS+"@media (max-width:720px){\n  .panel{top:auto;")
rep("@media (max-width:720px){\n  .panel{top:auto;", open(SP+'game.css').read()+open(SP+'console.css').read()+"\n@media (max-width:720px){\n  .panel{top:auto;")
rep('family=Saira+Condensed:wght@300;600;800&','family=Saira+Condensed:ital,wght@0,300;0,600;0,800;1,700;1,800&')

HUD='''<div class="trk-hud" id="trkHud" hidden>
  <div class="th-btns"><button id="thPanel">Pannello</button><button id="thBox">Box</button><button id="thReplayBtn">Replay</button><button id="thCamBtn"><span class="bl">Telecamera</span><span class="bs">Vista</span></button><button id="thReset"><span class="bl">Rimetti in pista</span><span class="bs">Rimetti</span></button><button id="thExit">Esci</button></div>
  <div id="thKeys"><span class="k1">W o ↑ gas · S o ↓ freno (tenuto da fermo: retro) · A D o ← → sterzo · C telecamera · R rimetti in pista · B box · V guarda dietro · P replay · Esc pausa</span><span class="k3">LS sterza · RT gas · LT freno · X box · Y telecamera · B guarda dietro · RS guarda intorno · LB replay · View rimetti in pista · Menu pausa</span><span class="k2">G1: W A S D · C telecamera · R in pista · B box &nbsp;|&nbsp; G2: frecce · Shift destro telecamera · Invio in pista · punto box &nbsp;|&nbsp; P replay · Esc pausa · vanno anche due controller</span></div>
  <div id="thTouch"><button data-k="left" aria-label="Sinistra">◀</button><button data-k="right" aria-label="Destra">▶</button><button data-k="brake">Freno</button><button data-k="gas">Gas</button></div>
  <div class="th-card" id="thLights" hidden aria-label="Semaforo di partenza"><i></i><i></i><i></i><i></i><i></i></div>
  <div class="th-card" id="thRace" hidden></div>
  <div class="th-card" id="thPause" hidden role="dialog" aria-label="Pausa"><div class="tr-k">Pausa</div><h3>In pausa</h3><p class="tr-sub" id="thPauseSub"></p>
    <div class="pz-b"><button data-pz="resume">Riprendi</button><button data-pz="restart">Ricomincia</button><button data-pz="replay">Replay</button><button data-pz="panel">Impostazioni</button><button data-pz="exit">Esci dalla pista</button></div>
    <p class="pz-h">Con il controller: croce per scegliere, A conferma, B o Menu per riprendere</p></div>
  <div class="th-card" id="thReplay" hidden>
    <div class="rp-top"><b>Replay</b><span id="thRpInfo"></span></div>
    <input type="range" id="thRpT" min="0" max="1000" value="0" aria-label="Posizione nel replay">
    <div class="rp-row"><button data-rp="restart" aria-label="Dall'inizio">⏮</button><button data-rp="play" id="thRpPlay" aria-label="Riproduci o pausa">❚❚</button>
      <div class="rp-seg" id="thRpSpeed"><button data-v="0.25">¼×</button><button data-v="0.5">½×</button><button data-v="1">1×</button><button data-v="2">2×</button></div>
      <div class="rp-seg" id="thRpCam"><button data-v="tv">TV</button><button data-v="chase">Dietro</button><button data-v="heli">Dall'alto</button><button data-v="cockpit">Bordo</button></div>
      <div class="rp-seg" id="thRpFocus"><button data-v="0">G1</button><button data-v="1">G2</button></div>
      <button data-rp="exit">Torna in pista</button></div>
  </div>
</div>
'''
rep('<div class="legend" id="legend" hidden>', HUD+'<div class="legend" id="legend" hidden>')

rep('    <button role="tab" aria-selected="false" data-tab="tAria">Aria</button>','    <button role="tab" aria-selected="false" data-tab="tPista">Pista</button>\n    <button role="tab" aria-selected="false" data-tab="tAria">Aria</button>')

TAB='''  <section class="tab" id="tPista" hidden>
    <div class="group">
      <h2>Circuito</h2><div class="seg" id="trkTrack" style="margin-bottom:10px"></div>
      <button class="tog big" id="trkGo" aria-pressed="false">Scendi in pista</button>
      <p class="note" id="trkCarNote">In pista va l'auto attuale: la Vespera con le ali montate nella scheda Ali, oppure la forma del laboratorio se è aperto.</p>
    </div>
    <div class="group"><h2>Giocatori</h2><div class="seg" id="trkPlayers"></div>
      <div id="trkDuo" hidden>
        <h2 style="margin-top:10px">Auto del computer in gara</h2><div class="seg" id="trkOpp"></div>
        <div id="trkAiG" hidden><h2 style="margin-top:10px">Livello del computer</h2><div class="seg" id="trkAiLvl"></div>
          <div class="toggles" style="margin-top:8px;grid-template-columns:1fr"><button class="tog" id="trkAiChar" aria-pressed="true">Caratteri ed errori dei piloti</button></div>
          <p class="note">Ogni pilota ha un carattere: aggressivo (attacca da vicino e rischia), prudente, mago della pioggia, irruento (sbaglia spesso), regolare, difensore (copre l'interno quando lo attacchi). Ogni tanto qualcuno va lungo in staccata o si gira, soprattutto sul bagnato.</p></div>
        <div class="wrow" style="margin-top:10px"><label for="trkP2Car" id="trkP2Lbl">Auto del giocatore 2</label></div><select id="trkP2Car" class="sel"></select>
        <div class="wrow" style="margin-top:8px"><label for="trkP2Paint" id="trkP2PLbl">Colore del giocatore 2</label></div><select id="trkP2Paint" class="sel"></select>
        <h2 style="margin-top:10px">Gara</h2><div class="seg" id="trkLaps"></div>
        <div class="toggles" style="margin-top:8px;grid-template-columns:1fr"><button class="tog" id="trkCollide" aria-pressed="true">Contatti tra le auto</button></div>
        <p class="note"><span id="trkDuoNote"></span> In scia l'auto dietro ha meno resistenza ma, nell'aria turbolenta, anche meno deportanza. La gara parte con il semaforo; con «Blocca massa e potenza» le due auto hanno la stessa massa e la stessa potenza, così contano l'aerodinamica e chi guida meglio.</p>
      </div>
    </div>
    <div class="group" id="trkModeG"><h2>Chi guida</h2><div class="seg" id="trkMode"></div></div>
    <div class="group"><h2>Condizioni</h2>
      <div class="seg" id="trkTod"></div>
      <div class="seg" id="trkWx" style="margin-top:6px"></div>
      <h2 style="margin-top:10px">Usura delle gomme</h2><div class="seg" id="trkWear"></div>
      <div class="toggles" style="margin-top:8px;grid-template-columns:1fr"><button class="tog" id="trkGhost" aria-pressed="true">Fantasma del giro migliore</button><button class="tog" id="trkFxPost" aria-pressed="true">Bagliore delle luci e gocce sull'obiettivo</button><button class="tog" id="trkFxRefl" aria-pressed="true">Riflessi delle auto sull'asfalto bagnato</button><button class="tog" id="trkFxShadow" aria-pressed="true">Ombre estese (paesaggio e altre auto)</button></div>
      <p class="note">Le gomme lavorano bene solo calde: fredde o surriscaldate tengono meno, e con l'usura perdono aderenza. Sul bagnato le gomme da asciutto perdono molta aderenza e ad alta velocità arriva l'aquaplaning; quelle da pioggia tengono, ma sull'asciutto si scaldano troppo e si consumano. Con «Variabile» la pioggia arriva durante la gara e poi smette: la traiettoria si asciuga per prima. Al box (B, o infilando la corsia dopo l'ultima curva) l'auto va da sola a 60 km/h e cambia le gomme (1–4 per sceglierle). Il replay (P) rivede gli ultimi minuti con le telecamere TV. Bagliori e riflessi chiedono più alla scheda video: se l'immagine scatta, spegnili.</p>
    </div>
    <div class="group"><h2>Telecamera</h2><div class="seg" id="trkCam"></div></div>
    <div class="group"><h2>Controller</h2><p class="note" id="trkPadState" style="margin-top:0">Nessun controller collegato.</p>
      <h2 style="margin-top:8px">Risposta dello sterzo</h2><div class="seg" id="trkPadCurve"></div>
      <div class="toggles" style="margin-top:8px;grid-template-columns:1fr"><button class="tog" id="trkPadVib" aria-pressed="true">Vibrazione</button></div>
      <p class="note">Controller Xbox (o compatibile): levetta sinistra sterzo, RT gas, LT freno (tenuto da fermi: retromarcia), A gas, X box (ripremi per cambiare gomme o annullare, croce ← → per sceglierle), Y o croce ↑ ↓ telecamera, B tenuto guarda dietro, levetta destra guarda intorno, LB replay, RB clacson, View rimetti in pista, Menu pausa (fuori dalla pista: scendi in pista). Nel replay: A pausa, RB e X velocità, croce telecamera e auto, grilletti per scorrere, B esci. In due, il secondo controller guida il giocatore 2. La vibrazione segue contatti, cordoli, erba e ruote che pattinano (Chrome ed Edge).</p></div>
    <div class="group">
      <h2><label for="trkMass">Massa</label><output id="trkMassOut"></output></h2>
      <input type="range" id="trkMass" min="800" max="2700" step="10" value="1480">
      <h2 style="margin-top:10px"><label for="trkKw">Potenza</label><output id="trkKwOut"></output></h2>
      <input type="range" id="trkKw" min="40" max="900" step="5" value="460">
      <h2 style="margin-top:10px">Gomme</h2><div class="seg" id="trkTires"></div>
      <div class="toggles" style="margin-top:8px"><button class="tog" id="trkAssist" aria-pressed="true">Assistenze</button><button class="tog" id="trkSame" aria-pressed="false">Blocca massa e potenza</button><button class="tog" id="trkLine" aria-pressed="true">Traiettoria consigliata</button><button class="tog" id="trkDmg" aria-pressed="true">Danni</button><button class="tog" id="trkRb" aria-pressed="true">Scocca 3D (Rapier)</button></div>
      <button class="small-btn" id="trkTypical" style="margin-top:8px">Valori tipici di questa auto</button>
      <p class="note">Le assistenze (controllo di trazione e di stabilità, sterzo dosato) rendono l'auto guidabile da tastiera. La traiettoria consigliata si colora secondo la tua velocità: verde gas, giallo alza il piede, rosso frena. Con i danni gli urti piegano ali e sospensioni: l'auto tira da un lato e carica meno, finché non la ripari ai box (la sosta si allunga). Con «Blocca» massa e potenza restano uguali quando cambi auto, così il confronto riguarda solo l'aerodinamica.</p>
    </div>
    <div class="group">
      <div class="cxrow"><span class="cxbig" id="trkLap">—</span><small>giro ideale calcolato</small></div>
      <dl class="readout" id="trkSum"></dl>
    </div>
    <div class="group"><h2>Velocità lungo il giro</h2>
      <canvas id="trkChart" role="img" aria-label="Velocità lungo il giro: giro ideale, tuo ultimo giro e riferimento"></canvas>
      <div class="flegend"><span style="--sw:var(--ink)">giro ideale</span><span style="--sw:var(--accent)">tuo ultimo giro</span><span style="--sw:var(--ink-soft)">riferimento</span></div>
    </div>
    <div class="group"><h2>Velocità minima in curva</h2><div id="trkCorners"></div></div>
    <div class="group"><h2>Classifica condivisa</h2><p class="note" id="trkBoardState" style="margin-top:0">Collegamento alla classifica…</p>
      <div class="seg" id="trkBoardFilter"></div>
      <div id="trkBoard" style="margin-top:8px"></div>
      <div class="toggles" style="margin-top:8px;grid-template-columns:1fr"><button class="tog" id="trkBoardOn" aria-pressed="true">Pubblica i miei record</button></div>
      <p class="note">I migliori giri di chi apre questa pagina, per circuito: ognuno vede il proprio nome e quello degli altri come li mostra claude.ai. Un record personale valido (guidando tu, non il giro ideale) entra da solo; da soli si salva anche il fantasma, che chiunque può inseguire con «Insegui».</p></div>
    <div class="group"><h2>Confronto</h2>
      <button class="small-btn" id="trkSave">Aggiungi l'auto attuale al confronto</button>
      <button class="small-btn" id="trkAll" style="margin-top:6px">Confronta tutte le forme a parità di massa e potenza</button>
      <p class="note" id="trkAllNote"></p>
      <div id="trkTable" style="margin-top:8px"></div>
    </div>
    <p class="note">Il giro ideale è calcolato sulla traiettoria più rotonda possibile dentro la pista: in ogni curva l'auto va al limite di aderenza di ciascun asse (con la deportanza che aumenta il carico sulle gomme e il trasferimento di carico che le fa lavorare peggio), sui rettilinei accelera finché potenza e resistenza dell'aria si equilibrano, e frena con l'ellisse d'attrito delle gomme. Per le forme del laboratorio la portanza è una stima; per la Vespera viene dallo stesso modello delle schede Ali e Assetto.</p>
  </section>

'''
rep('  <section class="tab" id="tAria" hidden>', TAB+'  <section class="tab" id="tAria" hidden>')

# codice
core=open(TR+'track-core.js').read()
core=re.sub(r"if\(typeof module!=='undefined'\)module\.exports=\{[^\n]*\n","",core)
assert 'module.exports' not in core
page=open(TR+'track-a.js').read()+''.join(open(TR+f).read() for f in ['track-b1.js','track-b2.js','track-b3.js','track-b4.js','track-b5.js','track-b6.js','track-b7.js','track-b8.js','track-b9.js','track-b10.js','track-b11.js','track-b12.js','track-b13.js','track-b14.js','track-b15.js','track-b16.js','track-b17.js','track-b18.js'])
# il sito è la cartella dist/: librerie in dist/lib (copiate da vendor/, niente CDN), immagini in dist/assets
import json,shutil
for d,src in [('lib',ROOT+'vendor/three'),('lib',ROOT+'vendor/rapier'),('assets',SP+'assets')]:  # .hdr compresi
    os.makedirs(ROOT+'dist/'+d,exist_ok=True)
    for f in os.listdir(src):
        if f.endswith(('.js','.jpg','.png','.hdr','.glb','.wasm'))and not f.endswith('.cjs.js'):shutil.copyfile(src+'/'+f,ROOT+'dist/'+d+'/'+f)
FOTO={k:'assets/'+f for k,f in [('gravelC','gravel-color.jpg'),('gravelN','gravel-normal.jpg'),('grassC','grass-color.jpg'),('asphC','asphalt-color.jpg')]}
# texture di Poly Haven e ambientCG (tools/fetch_assets.py): chiave = nome del file senza .jpg; modelli glTF in dist/assets/models
for f in sorted(os.listdir(SP+'assets')):
    if f.endswith('.jpg') and (f.startswith('ph-') or f.startswith('acg-')):FOTO[f[:-4]]='assets/'+f
if os.path.isdir(SP+'assets/models'):shutil.copytree(SP+'assets/models',ROOT+'dist/assets/models',dirs_exist_ok=True)
assert '/*@FOTO@*/{}' in page
page=page.replace('/*@FOTO@*/{}',json.dumps(FOTO))
rep('/* viste */\nlet camTween=null', core+page+'\n/* viste */\nlet camTween=null')

# ciclo di rendering
rep("    camera.position.lerpVectors(camTween.fp,camTween.tp,k);controls.target.lerpVectors(camTween.ft,camTween.tt,k);if(camTween.t>=1){camTween=null;finishView();}}\n",
    "    camera.position.lerpVectors(camTween.fp,camTween.tp,k);controls.target.lerpVectors(camTween.ft,camTween.tt,k);if(camTween.t>=1){camTween=null;finishView();}}\n  if(TRK.on)trkFrame(dt);else trkPadIdle();\n")
rep("  if(!DYN.frozen)kmhLive+=clamp(kmhTarget-kmhLive,-140*dt,70*dt);","  if(TRK.on)kmhLive=TRK.p[0].kmh;else if(!DYN.frozen)kmhLive+=clamp(kmhTarget-kmhLive,-140*dt,70*dt);")
rep("  speed+=(targetSpeed-speed)*(1-Math.pow(0.25,dt));dist+=speed*dt;","  if(TRK.on)speed=TRK.p[0].car.vx;else speed+=(targetSpeed-speed)*(1-Math.pow(0.25,dt));dist+=speed*dt;")
rep("  chassis.rotation.x=moving?-steerCur*0.06:0;","  chassis.rotation.x=TRK.on?TRK.p[0].roll:(moving?-steerCur*0.06:0);")
rep("   chassis.rotation.z=DYN.th;","   chassis.rotation.z=DYN.th+(TRK.on?TRK.p[0].pitch:0);")
rep("  alertEl.hidden=!DYN.frozen;","  alertEl.hidden=!DYN.frozen||TRK.on;")
rep("  const load=kmhNow>1?clamp(kmhNow/300,0.2,1):0;","  const load=TRK.on?0.15+0.85*TRK.p[0].thr:(kmhNow>1?clamp(kmhNow/300,0.2,1):0);")
rep("  else rpmT=gb.rpm;\n  engine.rpm+=(rpmT-engine.rpm)*(1-Math.pow(engine.on&&t-engine.startT<1.5?0.0005:0.05,dt));",
    "  else rpmT=gb.rpm;\n  if(TRK.on&&TRK.p[0].rpm&&!TRK.replay.on)rpmT=TRK.p[0].rpm;\n  engine.rpm+=(rpmT-engine.rpm)*(1-Math.pow(engine.on&&t-engine.startT<1.5?0.0005:TRK.on?0.00002:0.05,dt));")
rep("tailMat.emissiveIntensity=1.0+lightK*1.6;","tailMat.emissiveIntensity=1.0+lightK*1.6+(TRK.on&&TRK.p[0].brk>0.05?3.2:0);")
rep("  controls.update();\n  renderer.render(scene,camera);","  if(!TRK.on)controls.update();\n  if(TRK.on)trkRender();else renderer.render(scene,camera);")

# ricalcolo quando cambia l'auto
rep("  wingsVer++;layoutSideWings();syncWingControls();updateReadout();","  wingsVer++;layoutSideWings();syncWingControls();updateReadout();try{trkDirty();}catch(e){}")
rep("rideEl.oninput=()=>{SETUP.ride=+rideEl.value/1000;","rideEl.oninput=()=>{SETUP.ride=+rideEl.value/1000;try{trkDirty();}catch(e){}")
rep("    labBuild();const A=labFrontalArea(LAB);labResult=labDrag(LAB,A);labSyncControls();labRender();","    labBuild();const A=labFrontalArea(LAB);labResult=labDrag(LAB,A);labSyncControls();labRender();try{trkDirty();}catch(e){}")
rep("  if(G3.active)g3Dirty();\n  updateLegend();\n}","  if(G3.active)g3Dirty();\n  try{trkDirty();}catch(e){}\n  updateLegend();\n}")
rep('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>','<script src="lib/three.min.js"></script>')
rep('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>','<script src="lib/OrbitControls.js"></script>')
rep('<script src="lib/OrbitControls.js"></script>','<script src="lib/OrbitControls.js"></script>\n<script src="lib/RGBELoader.js"></script>\n<script src="lib/GLTFLoader.js"></script>')
rep('<link rel="preconnect" href="https://fonts.googleapis.com">','<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Cpath d=%27M4 24 12 8h18l-8 16z%27 fill=%27%23ff4b2b%27/%3E%3C/svg%3E">\n<link rel="preconnect" href="https://fonts.googleapis.com">')
open(P,'w').write(s)
print('ok',len(s))
