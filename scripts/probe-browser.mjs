import { chromium } from 'playwright'
const browser = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.on('console', (m) => console.log('CONSOLE[' + m.type() + ']:', m.text().slice(0, 300)))
await page.goto('http://localhost:3300/?game=http://localhost:4173', { waitUntil: 'domcontentloaded' })
let frame = null
for (let i = 0; i < 60; i++) {
  frame = page.frames().find((f) => f.url().startsWith('http://localhost:4173'))
  if (frame && await frame.evaluate(() => !!window.__ROBO).catch(() => false)) break
  await page.waitForTimeout(500)
}
await frame.waitForFunction(() => window.__ROBO?.scene.isActive('Title'), null, { timeout: 90000, polling: 500 })
// wait for bridge + walletReady
for (let i = 0; i < 30; i++) {
  const st = await frame.evaluate(() => {
    const g = window.__ROBO.scene.getScene('Game') ?? window.__ROBO.scene.getScene('Title')
    return g.casino ? { mode: g.casino.mode, walletReady: g.casino.walletReady, hasApi: !!g.casino.conn?.hostApi } : null
  }).catch(() => null)
  if (st && st.mode === 'host' && st.hasApi) { console.log('bridge ready:', JSON.stringify(st)); break }
  await page.waitForTimeout(500)
}
// point the harness at OUR contract (default picker = first game = coinflip!)
const deployedNow = await (await fetch('http://localhost:3300/__local-contracts.json')).json()
const ourGame = deployedNow.games.find((g) => g.name === 'RoboStrikeGame')
const selects = page.locator('select')
const nSel = await selects.count()
for (let i = 0; i < nSel; i++) {
  const opts = await selects.nth(i).locator('option').allTextContents()
  if (opts.some((o) => o.toLowerCase().includes('robostrike'))) {
    console.log('dropdown options:', opts.map((o) => o.trim().slice(0, 42)))
    const idx = opts.findIndex((o) => o.includes(ourGame.address))
    if (idx < 0) throw new Error('dropdown has no option with live address ' + ourGame.address)
    await selects.nth(i).selectOption({ index: idx })
    console.log('selected our contract by live address: option #' + idx)
    await page.waitForTimeout(800)
    break
  }
}

// go to Game scene
await frame.evaluate(() => document.querySelector('canvas')?.focus())
await page.keyboard.press('Space')
await frame.waitForFunction(() => window.__ROBO?.scene.isActive('Game'), null, { timeout: 60000, polling: 500 })
await page.waitForTimeout(1000)
// call placeRound directly and capture the FULL error
const err = await frame.evaluate(async () => {
  const g = window.__ROBO.scene.getScene('Game')
  try {
    const res = await g.casino.placeRound(1000000000000000000n, 0, false)
    return { ok: true, res: { outcome: res.outcome, payout: res.payout.toString(), sessionId: res.sessionId } }
  } catch (e) {
    const dump = { msg: e.message, short: e.shortMessage, name: e.name }
    let c = e.cause, depth = 0
    while (c && depth < 4) { dump['cause' + depth] = { msg: String(c.message ?? c).slice(0, 250), data: c.data } ; c = c.cause; depth++ }
    return { ok: false, dump }
  }
})
console.log('PLACE ROUND RESULT:', JSON.stringify(err, null, 1).slice(0, 1800))
await browser.close()
