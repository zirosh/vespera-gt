# Vespera GT — istruzioni per Claude

App in un solo file HTML (three.js r128 da CDN, nessun bundler): una coupé generata in codice con
configuratore, laboratorio di forma, galleria del vento con CFD sulla GPU e un gioco di guida completo
(tre circuiti, fisica a quattro ruote, piloti del computer, meteo, box, campionato, classifica condivisa).

## Lingua e stile
- Testi dell'interfaccia e commenti nel codice in **italiano**, con frasi complete (niente gergo).
- Codice compatto nello stile esistente: una funzione per responsabilità, nomi `trk*` per tutto ciò che riguarda la pista.
- Niente dipendenze npm nella pagina: tutto deve restare un unico `dist/index.html` autosufficiente
  (script esterni solo da cdnjs/jsdelivr con versione esatta, font da Google Fonts).

## Struttura
```
src/base.html          app di partenza: modello dell'auto, configuratore, laboratorio, galleria del vento, CFD
src/game.css           tema «videogioco» (garage, HUD, menu, campionato)
src/track/track-core.js  tracciati (TRK_DEFS), spline, traiettoria ideale, simulatore quasi-statico (lapSim), carichi (vehLoads)
src/track/track-a.js   stato TRK e preferenze, gomme e meteo, box, costruzione del mondo 3D (strada, terreno, alberi, tribune…)
src/track/track-b1.js  auto in pista: materiali per auto, stampo della Vespera unito, avversari, atmosfera (trkAtmo)
src/track/track-b2.js  avvio/arresto, gara, comandi, FISICA (trkPhysics a 4 ruote), collisioni, pilota del computer, box, meteo
src/track/track-b3.js  replay, telecamere, aspetto delle auto (sospensioni, ruote, luci), ciclo trkFrame, HUD
src/track/track-b4.js  pannello «Pista» (pulsanti e impostazioni)
src/track/track-b5.js  post-produzione HDR (bloom, ACES, gocce, sfocatura di velocità), riflessi sul bagnato, suoni
src/track/track-b6.js  controller Xbox, pausa, classifica condivisa (capacità db dell'artifact)
src/track/track-b7.js  cielo, ombre estese, luci notturne per pixel, ombre di contatto, texture procedurali
src/track/track-b8.js  interfaccia da videogioco: contagiri, garage con prestazioni, schermata di caricamento, schede dei circuiti
src/track/track-b9.js  campionato «Coppa Vespera» (punti, crediti, officina, salvataggio)
src/track/track-b10.js freni che si scaldano, sporco sulle carrozzerie, commissari e bandiere gialle, pubblico, elicottero TV
src/track/track-b11.js ventola aspirante (fan car)
build.py               incolla i file in base.html e scrive dist/index.html
tools/                 simulazioni e prove (vedi sotto)
```
I file `track-*.js` finiscono dentro lo stesso IIFE di `base.html`, prima di `/* viste */`, nell'ordine
`track-core, track-a, b1 … b11`. Le dichiarazioni di funzione sono quindi tutte visibili fra loro.

## Comandi
- Build: `python3 build.py` → `dist/index.html` (va rifatta dopo ogni modifica in `src/`).
- Controllo sintassi veloce: `node -e "const s=require('fs').readFileSync('dist/index.html','utf8');for(const m of s.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(m[1]);console.log('ok')"`
- Gara simulata senza grafica (fisica + piloti del computer + box + meteo):
  `node tools/racesim.js <auto> <meteo 0-3> <giri> [passo]` — con `TRACK=0|1|2` per scegliere il circuito.
  Controllare: `nan false`, `reset 0`, tempi plausibili (Prealpi ~112-120 s al passo 0.965).
- Prova di fisica (0-100, frenate, sterzate, con e senza aiuti): `node tools/phys-t.js`
- Dati dei circuiti (lunghezza, curve, dislivello): `node tools/t2check.js`; progetto di un nuovo tracciato: `tools/t3design.js`.
- Prove nel browser (Playwright + Chromium software):
  `python3 tools/mk_test.py` (crea `dist/_test.html` con un finto `window.claude` e agganci `__TRK()`, `__STEP(n)`, `__RENDER()`, `__CH()`),
  poi `python3 -m http.server 8766 --directory dist` in background e
  `python3 tools/shot.py 1280 720 "js…" "~ms" "@cattura.png" "?espressione"`.
  Le catture vanno guardate: molti problemi sono solo visivi.

## Cose da sapere (errori già fatti)
- **Agganci**: le estensioni nuove avvolgono le funzioni esistenti (`{const f=trkStop;trkStop=function(){f();…};}`) invece di modificarle;
  tenere questo schema per non rompere l'ordine dei file.
- **Shader patch**: `onBeforeCompile` va sempre concatenato al precedente e accompagnato da `customProgramCacheKey`,
  altrimenti three.js riusa il programma di un altro materiale. `Material.clone()` NON copia `onBeforeCompile`:
  per i materiali delle auto usare `trkCarLightClone`.
- **HDR**: con la post-produzione accesa `renderer.toneMapping` è `NoToneMapping` e i colori di nebbia e cielo vanno
  passati da `ppInverseColor`. I render target hanno stencil (profondità a 24 bit), altrimenti sfarfallano.
- **InstancedMesh** in r128 non calcola i confini delle istanze: `trkWorldFinish` li imposta (senza, gli alberi spariscono).
- **Nuovi circuiti**: stesso rettilineo dei box (y = 0, da x −400 a 560, traguardo a x ≈ −60) e ultimi punti vicini a
  `[-545,210],[-508,82]`; tratti non adiacenti ad almeno ~80 m; pendenza massima ~12 %. Verificare con `t3design.js` e `racesim.js`.
- **Fisica**: il simulatore quasi-statico (`lapSim`) e la fisica devono restare coerenti (stessa sensibilità al carico delle gomme,
  `trkWheelGrip` ↔ `axleGrip`), perché i piloti del computer seguono il profilo di velocità di `lapSim`.
- **Dati condivisi**: classifica (`board/<uid>`) e campionato (`data/users/<uid>/champ`) usano la capacità `db` dell'artifact di claude.ai.
  Fuori da claude.ai `window.claude` non esiste: la classifica si spegne e il campionato si salva solo in localStorage.
  Non rimuovere i ripieghi.
- Prestazioni: la scena con 8 auto fa ~1200 draw call; aggiungere oggetti uniti o istanziati, non mesh sciolte.
