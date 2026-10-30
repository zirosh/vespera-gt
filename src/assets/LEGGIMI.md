# Texture fotografiche

Scansioni fotografiche della libreria [ambientCG](https://ambientcg.com) (licenza **CC0 1.0**, pubblico dominio:
si possono usare, modificare e ridistribuire senza attribuzione). Prese dalla raccolta di pubblico dominio
[MrBrax/Source-2-Public-Domain-Textures](https://github.com/MrBrax/Source-2-Public-Domain-Textures), ridotte a 1024 px e ricompresse.

| File | Origine | Uso |
|---|---|---|
| `gravel-color.jpg` | Gravel006, colore | ghiaia delle vie di fuga |
| `gravel-normal.jpg` | Gravel006, normali (OpenGL) | rilievo di ghiaia e asfalto |
| `grass-color.jpg` | Ground037, colore | prato e colline |
| `asphalt-color.jpg` | Gravel006, colore → grigio scuro a contrasto ridotto | inerti dell'asfalto |

`build.py` le incorpora in `dist/index.html` come data URI (track-b14.js); senza questi file il gioco usa le texture procedurali.

## Fotografie panoramiche HDR (luce e riflessi in pista)

Da [Poly Haven](https://polyhaven.com) (già HDRI Haven), licenza **CC0 1.0**, prese dalla raccolta
[pmndrs/drei-assets](https://github.com/pmndrs/drei-assets) in versione 1k.

| File | Uso |
|---|---|
| `rooitou_park_1k.hdr` | giorno sereno |
| `immenstadter_horn_1k.hdr` | cielo coperto, bagnato e pioggia |
| `venice_sunset_1k.hdr` | tramonto |
| `dikhololo_night_1k.hdr` | notte |
