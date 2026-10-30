"""Prova del controller su tutte le schermate, con un pad Xbox finto (mappatura standard) al posto di navigator.getGamepads.
Uso: python3 tools/mk_test.py, server su 8766 (python3 -m http.server 8766 --directory dist), poi python3 tools/pad-t.py
(PW_CHROMIUM=<chromium> per il browser preinstallato). Stampa ogni passaggio con OK o NO e alla fine gli errori della pagina."""
import asyncio, os, sys
from playwright.async_api import async_playwright

INIT = """
window.__PADS={buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0})),axes:[0,0,0,0],rumble:0};
const fake={id:'Xbox Wireless Controller (finto)',index:0,connected:true,mapping:'standard',timestamp:0,
  get buttons(){return window.__PADS.buttons;},get axes(){return window.__PADS.axes;},
  vibrationActuator:{type:'dual-rumble',playEffect(){window.__PADS.rumble++;return Promise.resolve('complete');}}};
Object.defineProperty(navigator,'getGamepads',{value:()=>[fake,null,null,null]});
"""
B = dict(A=0, B=1, X=2, Y=3, LB=4, RB=5, LT=6, RT=7, VIEW=8, MENU=9, UP=12, DOWN=13, LEFT=14, RIGHT=15)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None,
                                    args=['--use-gl=swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script(INIT)
        await pg.goto('http://localhost:8766/_test.html', timeout=150000, wait_until='commit')
        await pg.wait_for_function("document.getElementById('busy')&&document.getElementById('busy').hidden", timeout=150000)
        await pg.wait_for_timeout(1500)
        ok_all = [True]

        async def press(name, hold=350):
            await pg.evaluate(f"window.__PADS.buttons[{B[name]}].pressed=true;window.__PADS.buttons[{B[name]}].value=1")
            await pg.wait_for_timeout(hold)
            await pg.evaluate(f"window.__PADS.buttons[{B[name]}].pressed=false;window.__PADS.buttons[{B[name]}].value=0")
            await pg.wait_for_timeout(350)

        async def ev(js):
            return await pg.evaluate(f"__EV({js!r})")

        async def check(label, js, want):
            got = await ev(js)
            good = got == want if not callable(want) else want(got)
            ok_all[0] &= bool(good)
            print(('OK ' if good else 'NO ') + label + ':', got)

        focus = "(document.activeElement&&(document.activeElement.textContent||document.activeElement.id||'').trim().slice(0,40))"
        await check('pad riconosciuto', "document.documentElement.classList.contains('pad')", True)
        await press('DOWN'); await check('menu: prima voce a fuoco', focus, lambda t: 'Gara veloce' in t)
        await press('A'); await check('A apre Gara veloce', 'CS.screen', 'race')
        await press('DOWN'); await press('DOWN'); await check('croce giù sposta il fuoco', focus, lambda t: bool(t))
        await press('B'); await check('B torna al menu', 'CS.screen', 'home')
        await press('DOWN'); await press('DOWN'); await press('A'); await check('Garage', 'CS.screen', 'garage')
        await press('RB'); await check('RB: scheda Assetto', "CS.tabs.garage", 'setup')
        for _ in range(3): await press('DOWN')
        await check('fuoco su un cursore', "document.activeElement.type", 'range')
        v0 = await ev("+document.activeElement.value")
        await press('RIGHT'); await check('croce a destra cambia il cursore', "+document.activeElement.value", lambda v: v != v0)
        await press('LEFT')
        await press('RB'); await check('RB: scheda Ali', "CS.tabs.garage", 'ali')
        await press('LB'); await press('LB'); await check('LB due volte: scheda Auto', "CS.tabs.garage", 'auto')
        await press('B'); await press('DOWN'); await press('A'); await check('Officina', 'CS.screen', 'lab')
        await press('RB'); await check('RB: Galleria del vento', "CS.tabs.lab", 'aria')
        await press('LB')
        await press('B'); await press('DOWN'); await press('A'); await check('Impostazioni', 'CS.screen', 'opt')
        for k in ['grafica', 'pad', 'rete']:
            await press('RB'); await check('RB: ' + k, "CS.tabs.opt", k)
        await check('scheda Controller mostra il pad', "document.getElementById('trkPadState').textContent", lambda t: 'Xbox' in t)
        await press('RB'); await press('B'); await check('di nuovo al menu', 'CS.screen', 'home')
        # campionato: dal menu, voce 2
        await ev("document.querySelector('[data-go=\"champ\"]').focus()")
        await press('A'); await check('Campionato aperto', "!chEl.hidden", True)
        await press('B'); await check('B chiude il campionato', "chEl.hidden", True)
        # in pista: Menu parte, il grilletto destro accelera, la vibrazione arriva, Menu mette in pausa e B riprende
        await ev("csGo('race')")
        await press('MENU', 400); await pg.wait_for_timeout(9000)
        await check('Menu scende in pista', 'TRK.on', True)
        await pg.evaluate("window.__PADS.buttons[7].pressed=true;window.__PADS.buttons[7].value=1")
        # il browser di prova fa pochi fotogrammi al secondo: la simulazione avanza a mano, il pad resta premuto
        await ev("__STEP(300)")
        await check('RT accelera', 'Math.round(TRK.p[0].kmh)', lambda v: v > 60)
        await ev("TRK.padVib=true;__STEP(120)")
        await pg.evaluate("window.__PADS.buttons[7].pressed=false;window.__PADS.buttons[7].value=0")
        await check('vibrazione chiamata', 'window.__PADS.rumble', lambda v: v > 0)
        await press('MENU'); await check('Menu: pausa', 'TRK.paused', True)
        await press('DOWN'); await check('pausa: croce sposta il fuoco', focus, lambda t: bool(t))
        await press('B'); await check('B riprende', 'TRK.paused', False)
        await press('MENU'); await ev("document.querySelector('#thPause [data-pz=\"exit\"]').focus()")
        await press('A'); await pg.wait_for_timeout(800); await check('Esci dalla pausa torna ai menu', 'TRK.on', False)
        print('errori della pagina:', errs[:8])
        print('TUTTO OK' if ok_all[0] and not errs else 'CI SONO PROBLEMI')
        await b.close()

asyncio.run(main())
