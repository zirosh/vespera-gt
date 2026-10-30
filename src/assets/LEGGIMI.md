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

## Texture e modelli scaricati da `tools/fetch_assets.py`

Tutti con licenza **CC0 1.0** (pubblico dominio). Lo script li scarica di nuovo se mancano, li riduce a 1024 px
(texture dei modelli a 512 px) e schiarisce il colore dell'asfalto da pista fino a una luminosità media del 36 %.

| File | Fonte | Uso |
|---|---|---|
| `ph-asphalt-*.jpg` | [Poly Haven, Asphalt Track](https://polyhaven.com/a/asphalt_track) | carreggiata di tutti i circuiti |
| `ph-pavement-*.jpg` | [Poly Haven, Concrete Pavement](https://polyhaven.com/a/concrete_pavement) | selciato del cittadino |
| `ph-wall-*.jpg` | [Poly Haven, Concrete Wall 008](https://polyhaven.com/a/concrete_wall_008) | muri del cittadino |
| `acg-facade007/008/010/017-*.jpg` | [ambientCG, Facade 007, 008, 010, 017](https://ambientcg.com/list?q=facade) | facciate dei palazzi, finestre accese di notte (emissione) |
| `models/painted_wooden_bench` | [Poly Haven](https://polyhaven.com/a/painted_wooden_bench) | panchine lungo i marciapiedi |
| `models/planter_box_01` | [Poly Haven](https://polyhaven.com/a/planter_box_01) | fioriere |
| `models/barrel_03` | [Poly Haven](https://polyhaven.com/a/barrel_03) | barili dietro i box |
| `models/old_tyre` | [Poly Haven](https://polyhaven.com/a/old_tyre) | pneumatici di scorta ai box |
