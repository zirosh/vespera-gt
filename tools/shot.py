import asyncio,sys,json
from playwright.async_api import async_playwright
# uso: tgt.py larghezza altezza azioni...   azioni: js | ?js | ~ms | +Tasto (giù) | -Tasto (su) | @file.png
async def main():
    W,H=int(sys.argv[1]),int(sys.argv[2])
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=__import__("os").environ.get("PW_CHROMIUM") or None,args=["--use-gl=swiftshader","--ignore-gpu-blocklist","--enable-unsafe-swiftshader"])
        pg=await b.new_page(viewport={"width":W,"height":H},has_touch=W<700,is_mobile=W<700)
        # rete senza CDN: con PW_THREE=<cartella con three/ di npm> three.js e OrbitControls arrivano dai file locali
        loc=__import__("os").environ.get("PW_THREE")
        if loc:
            async def rt(route):
                u=route.request.url
                if u.endswith('three.min.js'): await route.fulfill(path=loc+'/three/build/three.min.js',content_type='text/javascript')
                elif 'OrbitControls' in u: await route.fulfill(path=loc+'/three/examples/js/controls/OrbitControls.js',content_type='text/javascript')
                else: await route.abort()
            await pg.route(lambda u: not u.startswith('http://localhost'),rt)
        errs=[]; pg.on("pageerror",lambda e:errs.append('ERR '+str(e))); pg.on("console",lambda m: errs.append('console:'+m.text) if m.type in ("error",) else None)
        await pg.goto("http://localhost:8766/_test.html",timeout=150000,wait_until="commit")
        await pg.wait_for_function("document.getElementById('busy')&&document.getElementById('busy').hidden",timeout=150000)
        for a in sys.argv[3:]:
            if a.startswith('?'): print('>>',await pg.evaluate(a[1:]))
            elif a.startswith('~'): await pg.wait_for_timeout(int(a[1:]))
            elif a.startswith('+'): await pg.keyboard.down(a[1:])
            elif a.startswith('-'): await pg.keyboard.up(a[1:])
            elif a.startswith('@'): await pg.screenshot(path=a[1:],timeout=120000)
            else: await pg.evaluate(a); await pg.wait_for_timeout(300)
        print("errors:",errs[:10])
        await b.close()
asyncio.run(main())
