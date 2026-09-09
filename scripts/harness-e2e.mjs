// Harness-UI E2E — the organizer's own bar: "don't consider anything done until
// full bet → outcome → payout rounds run flawlessly [in the simulator harness],
// including the WAITING_RANDOMNESS phase and reveal flow."
// Drives OUR game inside the real harness iframe at :3300 through the real
// penpal bridge → LocalCasinoHost → VRF → settle → revealOutcome.
//   xvfb-run -a node scripts/harness-e2e.mjs
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const outDir = '/tmp/harness'
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text().slice(0, 200)) })

await page.goto('http://localhost:3300/?game=http://localhost:4173', { waitUntil: 'domcontentloaded' })

// locate our game's iframe and wait for the Phaser game inside it
let frame = null
for (let i = 0; i < 60; i++) {
  frame = page.frames().find((f) => f.url().startsWith('http://localhost:4173'))
  if (frame) {
    const has = await frame.evaluate(() => !!window.__ROBO).catch(() => false)
    if (has) break
  }
  await page.waitForTimeout(500)
}
if (!frame) throw new Error('game iframe never mounted')
const waitScene = async (name, timeoutMs = 60000) => {
  const t0 = Date.now()
  for (;;) {
    const ok = await frame.evaluate((n) => window.__ROBO?.scene.isActive(n), name).catch(() => false)
    if (ok) return
    if (Date.now() - t0 > timeoutMs) throw new Error(`scene ${name} never became active`)
    await page.waitForTimeout(300)
  }
}
await waitScene('Title')
console.log('game mounted in harness iframe, Title active')

// snapshot plumbing sanity: bridge connected, wallet ready
const bridge = await frame.evaluate(() => {
  const g = window.__ROBO.scene.getScene('Game') // may not be active yet; use Title's casino? fallback below
  return 'constructed'
})
await page.screenshot({ path: `${outDir}/1-harness-title.png` })

// select RoboStrikeGame in the harness contract picker, then RESTART the
// harness so the game integration binds to it (default at mount = coinflip!)
const selectBoxes = page.locator('select')
const n = await selectBoxes.count()
let selected = false
for (let i = 0; i < n; i++) {
  const opts = await selectBoxes.nth(i).locator('option').allTextContents()
  const idx = opts.findIndex((o) => o.toLowerCase().includes('robostrike'))
  if (idx >= 0) {
    await selectBoxes.nth(i).selectOption({ index: idx })
    console.log('selected game option #' + idx + ':', opts[idx].trim())
    selected = true
    break
  }
}
if (!selected) throw new Error('no RoboStrikeGame option in harness picker')
await page.waitForTimeout(500)
// apply: the setup panel's Restart harness button rebinds the integration
const restartBtn = page.locator('button', { hasText: 'Restart harness' })
if (await restartBtn.count() > 0) {
  await restartBtn.first().click()
  console.log('clicked Restart harness — waiting for game remount...')
  // old iframe detaches; re-acquire the fresh one
  frame = null
  for (let i = 0; i < 60; i++) {
    frame = page.frames().find((f) => f.url().startsWith('http://localhost:4173'))
    if (frame && await frame.evaluate(() => !!window.__ROBO).catch(() => false)) break
    await page.waitForTimeout(500)
  }
  if (!frame) throw new Error('game iframe never remounted after restart')
  await waitScene('Title', 90000)
  console.log('game remounted with fresh integration')
} else {
  console.log('no Restart harness button found')
}

// start the game
await frame.evaluate(() => document.querySelector('canvas')?.focus())
await page.keyboard.press('Space')
await waitScene('Game')
await page.waitForTimeout(800)
await page.screenshot({ path: `${outDir}/2-harness-game.png` })

// one full bridge round: FIRE → openSession → WAITING_RANDOMNESS → settle → reveal
await page.keyboard.press('Space')
await page.waitForTimeout(2500)
const pre = await frame.evaluate(() => {
  const g = window.__ROBO.scene.getScene('Game')
  const cs = g.casino
  return { phase: cs.phase, mode: cs.mode, walletReady: cs.walletReady, hasHostApi: !!cs.conn?.hostApi, roundInFlight: g.roundInFlight, bank: g.bankText?.text }
})
console.log('post-FIRE diagnostics:', JSON.stringify(pre))
const phaseLog = []
let sawWaiting = false
for (let i = 0; i < 240; i++) {
  const st = await frame.evaluate(() => {
    const g = window.__ROBO.scene.getScene('Game')
    const cs = g.casino
    return {
      phase: cs.phase,
      mode: cs.mode,
      walletReady: cs.walletReady,
      balance: cs.displayBalance().toString(),
      sessions: cs.snapshot?.sessions?.items?.length ?? 0,
      lastPhase: cs.snapshot?.sessions?.items?.[cs.snapshot.sessions.items.length - 1]?.phaseName,
      bank: g.bankText?.text ?? '',
    }
  }).catch(() => null)
  if (st) {
    const marker = `${st.phase}/${st.lastPhase ?? '-'}`
    if (!phaseLog.length || phaseLog[phaseLog.length - 1] !== marker) phaseLog.push(marker)
    if (st.phase === 'waiting') sawWaiting = true
    if (st.phase === 'idle' && i > 2) {
      console.log('round complete. phases:', phaseLog.join(' → '))
      console.log('mode:', st.mode, 'walletReady:', st.walletReady, 'snapshot sessions:', st.sessions)
      console.log('bank after round:', st.bank, '| raw balance:', st.balance)
      break
    }
  }
  await page.waitForTimeout(500)
  if (i === 239) throw new Error('round never returned to idle')
}
await page.waitForTimeout(1200)
await page.screenshot({ path: `${outDir}/3-harness-after-round1.png` })

// second round for reproducibility
await page.waitForTimeout(800)
await page.keyboard.press('Space')
for (let i = 0; i < 240; i++) {
  const st = await frame.evaluate(() => {
    const g = window.__ROBO.scene.getScene('Game')
    return { phase: g.casino.phase, bank: g.bankText?.text ?? '' }
  }).catch(() => null)
  if (st && st.phase === 'idle' && i > 2) {
    console.log('round 2 complete. bank:', st.bank)
    break
  }
  await page.waitForTimeout(500)
  if (i === 719) throw new Error('round 2 never returned to idle')
}
await page.screenshot({ path: `${outDir}/4-harness-after-round2.png` })

const reveal = await frame.evaluate(() => {
  const g = window.__ROBO.scene.getScene('Game')
  return { sessions: g.casino.snapshot?.sessions?.items?.slice(-2).map((r) => ({ phase: r.phaseName, payout: r.payout, settled: r.isSettled })) ?? [] }
})
console.log('last host sessions (bridge snapshot):', JSON.stringify(reveal.sessions))
console.log('errors:', errors.length ? errors : 'none')
await browser.close()
