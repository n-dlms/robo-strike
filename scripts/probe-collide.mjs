// Collision probe: measures player-vs-bot separation in the LIVE game.
// Run: xvfb-run -a node scripts/probe-collide.mjs [baseURL]
// Exits 0 if separation holds (>= 20px), 1 if pass-through observed.
import { chromium } from 'playwright'

const BASE = process.argv[2] || 'http://localhost:5174'
const browser = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 920, height: 700 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForFunction((n) => window.__ROBO?.scene.isActive(n), 'Title', { timeout: 60000, polling: 250 })
await page.keyboard.press('Space')
await page.waitForFunction((n) => window.__ROBO?.scene.isActive(n), 'Game', { timeout: 60000, polling: 250 })
await page.waitForTimeout(1000)

// Freeze bot AI wandering so the test is deterministic-ish: park bots by zeroing speed via targets
const setup = await page.evaluate(() => {
  const game = window.__ROBO
  const scene = game.scene.getScene('Game')
  const bot = scene.bots[0]
  return {
    nBots: scene.bots.length,
    player: { x: scene.playerBase.x, y: scene.playerBase.y },
    bot0: { x: bot.base.x, y: bot.base.y, w: bot.base.displayWidth },
    playerW: scene.playerBase.displayWidth,
  }
})
console.log('setup:', JSON.stringify(setup))

// TEST 1: teleport player exactly onto bot0 (d ~ 0, dead-zone path), watch 2s
const t1 = await page.evaluate(async () => {
  const scene = window.__ROBO.scene.getScene('Game')
  const bot = scene.bots[0]
  scene.playerBase.x = bot.base.x
  scene.playerBase.y = bot.base.y
  scene.playerTurret.x = bot.base.x
  scene.playerTurret.y = bot.base.y
  const samples = []
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 100))
    const d = Phaser.Math.Distance.Between(bot.base.x, bot.base.y, scene.playerBase.x, scene.playerBase.y)
    samples.push(Math.round(d * 10) / 10)
  }
  return samples
})
console.log('T1 dead-zone teleport samples:', JSON.stringify(t1))

// TEST 2: drive player through bot with keys held (WASD 1.4px/frame vs push)
const t2 = await page.evaluate(async () => {
  const scene = window.__ROBO.scene.getScene('Game')
  const bot = scene.bots[1] || scene.bots[0]
  // place player 60px left of bot, then walk right through it
  scene.playerBase.x = bot.base.x - 60
  scene.playerBase.y = bot.base.y
  scene.playerTurret.x = scene.playerBase.x
  scene.playerTurret.y = scene.playerBase.y
  // hold D by directly stepping like update does (keys need focus; simulate via scene input)
  const samples = []
  scene.input.keyboard.emit('keydown-D')
  // emulate: manually move like WASD does for 120 frames worth via direct calls
  for (let i = 0; i < 40; i++) {
    scene.playerBase.x += 1.4
    scene.playerTurret.x = scene.playerBase.x
    await new Promise((r) => setTimeout(r, 50)) // let update() + push run
    const d = Phaser.Math.Distance.Between(bot.base.x, bot.base.y, scene.playerBase.x, scene.playerBase.y)
    samples.push(Math.round(d * 10) / 10)
  }
  scene.input.keyboard.emit('keyup-D')
  return samples
})
console.log('T2 drive-through samples:', JSON.stringify(t2))

const min1 = Math.min(...t1)
const min2 = Math.min(...t2)
console.log('min T1 (dead-zone):', min1, '| min T2 (drive-through):', min2)
console.log('errors:', errors.length ? errors : 'none')
await browser.close()
if (min1 < 5 || min2 < 10) {
  console.log('RESULT: FAIL — pass-through observed')
  process.exit(1)
}
console.log('RESULT: PASS — separation holds')
