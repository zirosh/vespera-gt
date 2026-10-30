# Vespera GT

Coupé costruita interamente in codice (three.js) con configuratore, laboratorio di forma, galleria del vento
con CFD sulla scheda video e un gioco di guida: tre circuiti (Prealpi, Montello, Grappa), fisica a quattro ruote,
fino a otto auto con piloti del computer, meteo variabile, box, danni (ali e sospensioni, riparazione ai box), traiettoria consigliata,
texture fotografiche CC0, controller Xbox, schermo diviso, campionato con officina.

## Provarla
Online su GitHub Pages: https://zirosh.github.io/vespera-gt/ (si aggiorna a ogni modifica di `main`;
la prima volta va attivato in Settings → Pages → Source: GitHub Actions).

In locale, dalla cartella del progetto:
```
python3 -m http.server 8000 --directory dist
```
e vai su http://localhost:8000 (aprendo il file con doppio clic le texture non si caricano).

## Modificarla
I sorgenti sono in `src/`; dopo ogni modifica:
```
python3 build.py
```
Dettagli su struttura, prove e convenzioni in `CLAUDE.md`.
