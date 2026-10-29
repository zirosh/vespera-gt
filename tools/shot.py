import asyncio,sys,json
from playwright.async_api import async_playwright
# uso: tgt.py larghezza altezza azioni...   azioni: js | ?js | ~ms | +Tasto (giù) | -Tasto (su) | @file.png
async def main():
    W,H=int(sys.argv[1]),int(sys.argv[2])
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--use-gl=swiftshader","--ignore-gpu-blocklist","--enable-unsafe-swiftshader"])
        pg=await b.new_page(viewport={"width":W,"height":H},has_touch=W<700,is_mobile=W<700)
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
