// GUI smoke test — run under xvfb-run for headed chromium (real compositing).
//   xvfb-run -a node scripts/gui-smoke.mjs [outDir] [baseURL]
// NOTE: software-rendered containers run the page at ~2-10fps; waits are scaled
// for that. On a real GPU the same flow takes ~10s total.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL || process.argv[3] || 'http://localhost:4173'
const outDir = process.argv[2] || '/tmp/shots'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 920, height: 700 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text())
})

const waitScene = async (name, timeoutMs = 60000) => {
  await page.waitForFunction(
    (n) => window.__ROBO?.scene.isActive(n),
    name,
    { timeout: timeoutMs, polling: 250 },
  )
}

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await waitScene('Title')
await page.waitForTimeout(1500) // let attract elements settle
await page.screenshot({ path: `${outDir}/1-title.png` })

// Start game (SPACE)
await page.keyboard.press('Space')
await waitScene('Game')
await page.waitForTimeout(1500)
await page.screenshot({ path: `${outDir}/2-game.png` })

// Round 1: FIRE at default tank (SCOUT), default bet
await page.keyboard.press('Space')
await page.waitForTimeout(2500) // shell flight + presentation (slow-mo scaled)
await page.screenshot({ path: `${outDir}/3-outcome.png` })
await page.waitForTimeout(4000) // reveal + round unlock
await page.screenshot({ path: `${outDir}/4-settled.png` })

// Round 2: WARLORD + OVERDRIVE ON + bet up
await page.keyboard.press('Digit3')
await page.keyboard.press('KeyO')
await page.keyboard.press('Period')
await page.waitForTimeout(600)
await page.screenshot({ path: `${outDir}/5-configured.png` })
await page.keyboard.press('Space')
await page.waitForTimeout(6500)
await page.screenshot({ path: `${outDir}/6-outcome2.png` })

// Round 3: fire-spam guard — second SPACE while in flight must be ignored
await page.keyboard.press('Space')
await page.waitForTimeout(400)
await page.keyboard.press('Space')
await page.waitForTimeout(6500)
await page.screenshot({ path: `${outDir}/7-outcome3.png` })

// Paytable panel (key T in Game scene)
await page.keyboard.press('KeyT')
await page.waitForTimeout(600)
await page.screenshot({ path: `${outDir}/8-paytable.png` })
await page.keyboard.press('KeyT')

const state = await page.evaluate(() => {
  const g = window.__ROBO
  const game = g.scene.getScene('Game')
  return { active: g.scene.isActive('Game'), roundInFlight: game.roundInFlight ?? 'n/a' }
})
console.log(JSON.stringify({ errors, state }, null, 2))
await browser.close()
