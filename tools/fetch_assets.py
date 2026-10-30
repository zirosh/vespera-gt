"""Scarica le texture e i modelli CC0 usati dal gioco, li ridimensiona e li mette in src/assets.
Fonti: Poly Haven (api.polyhaven.com, dl.polyhaven.org) e ambientCG (ambientcg.com), tutte con licenza CC0 1.0.
Uso: python3 tools/fetch_assets.py   (serve la rete verso quei siti; i file già presenti non vengono riscaricati)"""
import io, json, os, sys, urllib.request, zipfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets')
UA = {'User-Agent': 'Mozilla/5.0 (vespera-gt asset fetch)'}

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        return r.read()

def save_jpg(data, name, size, q=82, mode='RGB', tone=None):
    path = os.path.join(OUT, name)
    im = Image.open(io.BytesIO(data)).convert(mode)
    if size: im = im.resize((size, size), Image.LANCZOS)
    if tone:  # schiarisce con una curva di potenza fino alla luminosità media voluta, contrasto un po' più alto
        import numpy as np
        a = np.asarray(im, dtype=np.float32) / 255.0; m = a.mean()
        g = np.log(tone) / np.log(max(m, 1e-3)); a = np.clip((a ** g - tone) * 1.25 + tone, 0, 1)
        im = Image.fromarray((a * 255).astype(np.uint8))
    im.save(path, quality=q, optimize=True, progressive=True)
    print('  ', name, os.path.getsize(path) // 1024, 'kB')

# texture di Poly Haven: nome -> (prefisso dei file, lato in pixel)
PH_TEX = {'asphalt_track': ('ph-asphalt', 1024), 'concrete_pavement': ('ph-pavement', 1024), 'concrete_wall_008': ('ph-wall', 1024)}
# luminosità media voluta per il colore (la foto dell'asfalto da pista è troppo scura per la luce del gioco): None = com'è
PH_TONE = {'asphalt_track': 0.36}
# mappe: colore (Diffuse), normali OpenGL (nor_gl), ruvidezza (Rough)
PH_MAPS = [('Diffuse', 'color', 'RGB'), ('nor_gl', 'normal', 'RGB'), ('Rough', 'rough', 'L')]
# facciate con finestre di ambientCG: colore e, se c'è, la mappa delle finestre accese di notte (Emission)
ACG_FACADES = ['Facade007', 'Facade008', 'Facade010', 'Facade017']
# modelli leggeri di Poly Haven (glTF con texture 1k): panchina, fioriera, barile, pneumatico
PH_MODELS = ['painted_wooden_bench', 'planter_box_01', 'barrel_03', 'old_tyre']

def poly_haven_textures():
    for asset, (pre, size) in PH_TEX.items():
        files = json.loads(get('https://api.polyhaven.com/files/' + asset))
        for key, kind, mode in PH_MAPS:
            name = f'{pre}-{kind}.jpg'
            if os.path.exists(os.path.join(OUT, name)) or key not in files: continue
            save_jpg(get(files[key]['1k']['jpg']['url']), name, size, mode=mode, tone=PH_TONE.get(asset) if kind == 'color' else None)

def ambientcg_facades():
    for a in ACG_FACADES:
        n = a.lower()
        if os.path.exists(os.path.join(OUT, f'acg-{n}-color.jpg')): continue
        z = zipfile.ZipFile(io.BytesIO(get(f'https://ambientcg.com/get?file={a}_1K-JPG.zip')))
        for f in z.namelist():
            low = f.lower()
            if low.endswith('_color.jpg'): save_jpg(z.read(f), f'acg-{n}-color.jpg', 1024)
            elif low.endswith('_emission.jpg'): save_jpg(z.read(f), f'acg-{n}-emission.jpg', 1024)

def poly_haven_models():
    os.makedirs(os.path.join(OUT, 'models'), exist_ok=True)
    for m in PH_MODELS:
        dst = os.path.join(OUT, 'models', m + '.gltf')
        if os.path.exists(dst): continue
        files = json.loads(get('https://api.polyhaven.com/files/' + m))
        g = files['gltf']['1k']['gltf']
        gltf = get(g['url']).decode('utf-8')
        # il .gltf punta a un .bin e a texture con percorsi relativi: scaricati accanto, con lo stesso nome
        for rel, info in g.get('include', {}).items():
            p = os.path.join(OUT, 'models', rel)
            os.makedirs(os.path.dirname(p), exist_ok=True)
            data = get(info['url'])
            if rel.lower().endswith('.jpg') or rel.lower().endswith('.png'):
                im = Image.open(io.BytesIO(data)); im.thumbnail((512, 512))
                if rel.lower().endswith('.jpg'): im.convert('RGB').save(p, quality=82, optimize=True)
                else: im.save(p, optimize=True)
            else:
                open(p, 'wb').write(data)
        open(dst, 'w').write(gltf)
        print('  ', m, 'ok')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    print('Poly Haven, texture');poly_haven_textures()
    print('ambientCG, facciate');ambientcg_facades()
    print('Poly Haven, modelli');poly_haven_models()
