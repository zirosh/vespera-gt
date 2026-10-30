# Vespera GT — istruzioni per Claude

Sito statico in `dist/` (pubblicato su GitHub Pages dal workflow `.github/workflows/pages.yml`, nessun bundler; three.js r128 copiato in `vendor/`): una coupé generata in codice con
configuratore, laboratorio di forma, galleria del vento con CFD sulla GPU e un gioco di guida completo
(quattro circuiti fra cui un cittadino, fisica a quattro ruote con scocca rigida Rapier, piloti del computer, meteo, box, campionato, classifica condivisa).

## Lingua e stile
- Testi dell'interfaccia e commenti nel codice in **italiano**, con frasi complete (niente gergo).
- Codice compatto nello stile esistente: una funzione per responsabilità, nomi `trk*` per tutto ciò che riguarda la pista.
- Niente bundler e niente CDN per il codice: le librerie stanno in `vendor/` (copiate da npm con versione esatta) e `build.py`
  le mette in `dist/lib`; le immagini di `src/assets` finiscono in `dist/assets`. Solo i font vengono da Google Fonts.
  Il sito va aperto da un server (GitHub Pages, o `python3 -m http.server --directory dist`): da file:// le texture non si caricano.

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
src/track/track-b12.js traiettoria consigliata colorata (verde gas, giallo alza, rosso frena) sul profilo lapSim della tua auto
src/track/track-b13.js danni: ali e sospensioni piegate dagli urti, convergenza storta, meno carico, riparazione ai box
src/track/track-b14.js texture fotografiche CC0 (ghiaia, prato, inerti dell'asfalto) e luce da HDRI Poly Haven per ora del giorno (trkEnvFor)
src/track/track-b15.js interfaccia da console: menu iniziale e schermate (Gara veloce, Garage, Officina, Impostazioni) che spostano i blocchi esistenti
src/track/track-b16.js scocca rigida 3D con Rapier: sospensioni per ruota, carichi dalle molle, guard rail e contatti fra auto, urti → danni
src/track/track-b17.js circuito cittadino (TRKDEF.urban): muri con rete, palazzi istanziati, mare, lampioni, finestre accese di notte
src/track/track-b18.js asfalto fotografico Poly Haven su tutti i circuiti, modelli glTF CC0 istanziati (panchine, fioriere, barili, gomme)
src/track/track-b19.js assetto nel Garage (molle, barre antirollio → SETUP.kf/kr ed equilibrium, scocca Rapier dei giocatori), ruote che seguono le molle, vibrazione dai carichi
src/track/track-b20.js anteprima grande del circuito in Gara veloce, riepilogo di fine gara (posizioni, giro migliore, velocità massima, danni, distacco per giro)
src/track/track-b21.js occlusione ambientale SSAO (profondità dalla DepthTexture del render target della scena) e FXAA finale, dentro la post-produzione
src/console.css        stile dell'interfaccia da console (incollato dopo game.css)
src/assets/            immagini JPG CC0 di ambientCG (vedi LEGGIMI.md), copiate in dist/assets da build.py
vendor/three/          three.js r128, OrbitControls, GLTFLoader, RGBELoader (licenza MIT), copiati in dist/lib
vendor/rapier/         @dimforge/rapier3d-compat 0.14.0 (Apache-2.0): rapier.es.js per il sito (import dinamico), rapier.cjs.js per le prove
build.py               incolla i file in base.html e scrive dist/index.html
tools/                 simulazioni e prove (vedi sotto)
```
I file `track-*.js` finiscono dentro lo stesso IIFE di `base.html`, prima di `/* viste */`, nell'ordine
`track-core, track-a, b1 … b21`. Le dichiarazioni di funzione sono quindi tutte visibili fra loro.

## Comandi
- Build: `python3 build.py` → `dist/index.html` (va rifatta dopo ogni modifica in `src/`).
- Controllo sintassi veloce: `node -e "const s=require('fs').readFileSync('dist/index.html','utf8');for(const m of s.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(m[1]);console.log('ok')"`
- Gara simulata senza grafica (fisica + piloti del computer + box + meteo):
  `node tools/racesim.js <auto> <meteo 0-3> <giri> [passo]` — con `TRACK=0|1|2` per scegliere il circuito.
  Controllare: `nan false`, `reset 0`, tempi plausibili (Prealpi ~112-120 s al passo 0.965).
- Prova di fisica (0-100, frenate, sterzate, con e senza aiuti): `node tools/phys-t.js`
- Ali vere della Vespera: `tools/aero-presets.json` (carichi per ogni preset, esportati dal configuratore; vanno riesportati se cambia il modello aerodinamico).
  `node tools/stab-t.js` (sterzate e staccate a 280 km/h, deriva massima), `node tools/handling-t.js [passo] [giri]` (giro su tutti i circuiti
  con un pilota «da tastiera»; `KBD=0` sterzo proporzionale, `ASSIST=0` senza aiuti), `node tools/dmg-t.js` (urti, tiro laterale, sosta di riparazione).
  Il banco comune è `tools/harness.js`. `racesim.js` include i danni (`DMG=0` per spegnerli) e stampa danni massimi e finali.
- Scocca Rapier: `node tools/rb-t.js` (carichi, 0-100, frenata con beccheggio, curva con rollio, cordoli, salti); `RB=0` davanti a
  qualsiasi prova (racesim, harness) usa la fisica piana per confrontare. Le prove basate su harness aspettano `ready` prima di partire.
- Assetto: `node tools/setup-t.js` (stessa sterzata con assetti diversi; `ASSIST=0 S1=0.7 S2=0.4` per il limite): barra anteriore → meno imbardata.
- Materiali e modelli CC0: `python3 tools/fetch_assets.py` (Poly Haven e ambientCG, serve la rete verso quei siti) li rimette in src/assets;
  build.py li copia in dist/assets e mette ogni `ph-*.jpg`/`acg-*.jpg` in TRK_PHOTO con il nome del file come chiave.
- Dati dei circuiti (lunghezza, curve, dislivello): `node tools/t2check.js`; progetto di un nuovo tracciato: `tools/t3design.js`.
- Prove nel browser (Playwright + Chromium software):
  `python3 tools/mk_test.py` (crea `dist/_test.html` con un finto `window.claude` e agganci `__TRK()`, `__STEP(n)`, `__RENDER()`, `__CH()`),
  poi `python3 -m http.server 8766 --directory dist` in background e
  `python3 tools/shot.py 1280 720 "js…" "~ms" "@cattura.png" "?espressione"`.
  Le catture vanno guardate: molti problemi sono solo visivi.
  Controller: `python3 tools/pad-t.py` (pad Xbox finto: menu, Garage, Officina, Impostazioni, campionato, pista, pausa; deve finire con TUTTO OK).
  Le variabili della pagina (TRK, CS, chEl…) si leggono con `__EV('espressione')`, aggiunto da mk_test.py.
  `PW_CHROMIUM=<chromium>` per usare il browser preinstallato.

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
- **Aerodinamica in pista**: `equilibrium()` (base.html) usa i tamponi di fine corsa come `springForce` (oltre 7 cm la molla è 13 volte più rigida).
  Senza, l'anteriore scendeva senza limite, lo splitter andava in effetto suolo e ad alta velocità il carico si spostava davanti (sovrasterzo violento).
- **Danni**: agganci dentro `trkPhysics` (`P.toe`, `P.toeR`, `P.wgk`) e aerodinamica avvolta per auto (`trkDmgAero`); i piloti del computer
  seguono il profilo ricalcolato con l'auto danneggiata e vanno ai box se i danni superano il 40 %.
- **Interfaccia**: i blocchi dei vecchi pannelli (`#tAuto`, `#tSetup`, `#tAli`, `#tForma`, `#tAria`, `#tVista`, `#tPista` e i gruppi trovati per id)
  vengono spostati da `csBuild()` nelle schermate di `#cs`; la logica resta legata agli id. `#tPista` deve restare con `hidden=false`
  (trkDirty ricalcola il giro solo se è visibile). Il vecchio pannello `aside.panel` è vuoto e nascosto. Nuovi comandi: mettili nei blocchi
  esistenti o in `csBuild()`, e nei test usa `csGo('race'|'garage'|'lab'|'opt'|'home')`.
- **Scocca Rapier** (track-b16): trkPhysics calcola gomme, motore e aiuti come prima, ma con `P.rb` i carichi delle ruote vengono
  dalle molle (`P.rb.fz`) e le forze vanno al corpo rigido (`trkRbForces`) invece dell'integrazione piana. Il mondo fa un passo quando
  un'auto riceve le forze per la seconda volta (`RB.pend`); le auto senza fisica in quel passo (box, via, giro automatico) seguono
  `P.car` con `trkRbPlace`. Dopo ogni teletrasporto di `P.car` (reset, test) chiamare `trkRbPlace`. Il suolo è analitico (`trkRbGround`:
  quota della strada e dentellatura dei cordoli), niente collider di terreno; ribaltata per 2 s o sotto il suolo → rimessa dritta.
  Urti = variazione di velocità non spiegata dalle forze applicate → `trkDmgHit`. `trkCollide`, `trkCarsCollide`, `trkVertical` sono saltati.
- **Porto Vespera** (TRK_DEFS[3]) è un cittadino tortuoso di mare: salita alla piazza (36 m), tornante, galleria (`TRKDEF.tunnel=[X0,X1,Y0]`,
  tratto con X fra X0 e X1 e Y > Y0), mare oltre `TRKDEF.sea` (Y). I rami del tornante distano ~65 m: va bene in città (muri a 2,4 m).
- **Passi di tempo minuscoli**: nel browser capitano fotogrammi a pochi decimillesimi di secondo; con Rapier Δv/h esplode. Il wrapper di
  trkPhysics in track-b16 salta i passi sotto 0,2 ms e, se lo stato diventa comunque non numerico, `trkRbRecover` rimette l'auto all'ultima
  posizione valida con una scocca nuova. Non togliere queste protezioni.
- **Circuito cittadino**: `TRKDEF.urban` cambia barriere (muri a 2,4 m, strade di scampo all'esterno delle curve lente), niente ghiaia
  né lago, superficie fuori dal bordo = asfalto, scenario di track-b17. Il mare è a X > −60, Y > 610: niente palazzi lì.
- **three.js resta alla r128**: dalla r148 non ci sono più `examples/js` e cambiano colori, luci e render target multicampione;
  aggiornare vorrebbe dire riscrivere materiali e post-produzione. SSAO e FXAA (track-b21) avvolgono `ppEnsure` e `ppFinal` di track-b5:
  `PP.rt.depthTexture` deve restare DepthStencil a 24 bit (stesso formato del buffer multicampione, altrimenti la copia fallisce).
- Prestazioni: la scena con 8 auto fa ~1200 draw call; aggiungere oggetti uniti o istanziati, non mesh sciolte.
