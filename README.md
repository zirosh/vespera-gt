# Vespera GT

Coupé costruita interamente in codice (three.js) con configuratore, laboratorio di forma, galleria del vento
con CFD sulla scheda video e un gioco di guida: tre circuiti (Prealpi, Montello, Grappa), fisica a quattro ruote,
fino a otto auto con piloti del computer, meteo variabile, box, controller Xbox, schermo diviso, campionato con officina.

## Provarla
Apri `dist/index.html` in un browser (serve la connessione per three.js e i font), oppure:
```
python3 -m http.server 8000 --directory dist
```
e vai su http://localhost:8000.

## Modificarla
I sorgenti sono in `src/`; dopo ogni modifica:
```
python3 build.py
```
Dettagli su struttura, prove e convenzioni in `CLAUDE.md`.
