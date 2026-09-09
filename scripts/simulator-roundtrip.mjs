// Simulator round-trip verification — drives the REAL local casino stack:
//   approve → openSession → VRF fulfillment → SETTLED → verify payout == TS math.
// Chaos tests: invalid gameData, out-of-range tankId, over-balance wager,
// cancelStuckRandomness on a settled session.
// Prereq: simulator up (cd vendor/casino-sdk && npm start) and the contract
// registered in vendor/casino-sdk/simulator/local-node/deployed.json.
//   npm run sim:roundtrip
import { createPublicClient, createWalletClient, http, parseAbi, keccak256, encodeAbiParameters, parseEther, decodeEventLog } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync } from 'node:fs'
import { mapVrfToOutcome, payoutForOutcome, payoutAfterOverdrive, qualifiesForOverdrive, decodeGameState, OUTCOME_NAMES, TANK_NAMES } from '../node_modules/.cache/paytables.mjs'
import { fulfillLocalVrfRequest, LOCAL_VRF_NODE_PRIVATE_KEY } from '../node_modules/.cache/local-vrf.mjs'

const deployed = JSON.parse(readFileSync('vendor/casino-sdk/simulator/local-node/deployed.json', 'utf8'))
const ROUNDS = parseInt(process.argv[2] || '20', 10)

// Hardhat/Anvil dev account #0 — funded with 1M chUSD by the local node.
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const abis = parseAbi([
  'function openSession(address game, address vault, uint256 wager, bytes gameData, bytes randomnessRequestData) returns (uint256 sessionId, bytes32 requestId)',
  'function getSession(uint256 sessionId) view returns ((address player, address game, uint256 wagerBase, uint256 escrowedStake, uint256 reservedProfit, uint256 maxEscrowStake, uint256 maxReservedProfit, uint256 actionDeadlineBlock, uint256 randomnessDeadlineBlock, uint32 step, uint64 pendingRequestNonce, bytes32 pendingRequestId, uint8 phase, bytes gameData, bytes gameState, bytes randomnessRequestData))',
  'function cancelStuckRandomness(uint256 sessionId) returns (uint256 payout)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'event CasinoSessionOpened(uint256 indexed sessionId, address indexed game, address indexed player, address vault, address token, uint8 tokenDecimals, uint256 wager, uint256 maxEscrowStake, uint256 maxReservedProfit, string gameName, bytes gameData)',
  'event CasinoSessionSettled(uint256 indexed sessionId, address indexed game, address indexed player, uint8 phase, uint256 payout, string gameName, bytes gameState)',
  'event CasinoSessionRandomnessRequested(uint256 indexed sessionId, address indexed provider, bytes32 indexed requestId, uint64 requestNonce, uint256 randomnessDeadlineBlock)',
])

const client = createPublicClient({ transport: http(deployed.rpcUrl) })
const wallet = createWalletClient({ transport: http(deployed.rpcUrl), account: privateKeyToAccount(PRIVATE_KEY) })
const vrfWallet = createWalletClient({ transport: http(deployed.rpcUrl), account: privateKeyToAccount(LOCAL_VRF_NODE_PRIVATE_KEY) })

const SESSION_SETTLED = 3
const encodeTank = (tank, od) => '0x' + '00'.repeat(31) + (od ? tank | 0x80 : tank).toString(16).padStart(2, '0')

const waitSettled = async (sessionId, timeoutMs = 45000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    const s = await client.readContract({ address: deployed.host, abi: abis, functionName: 'getSession', args: [sessionId] })
    const phase = Number(s.phase ?? s[12])
    if (phase >= SESSION_SETTLED) return s
    if (Math.round((Date.now() - t0) / 5000) !== Math.round((Date.now() - t0 - 500) / 5000)) console.log(`  ...waiting session ${sessionId}: phase=${phase} elapsed=${Date.now() - t0}ms`)
    await new Promise((r) => setTimeout(r, 500))
  }
  return null // caller decides: cancel stuck + retry (SDK chaos flow)
}

const balance = await client.readContract({ address: deployed.token, abi: abis, functionName: 'balanceOf', args: [wallet.account.address] })
console.log(`player chUSD balance: ${Number(balance) / 1e18}`)
await wallet.writeContract({ address: deployed.token, abi: abis, functionName: 'approve', args: [deployed.host, balance] })

const game = deployed.games.find((g) => g.name === 'RoboStrikeGame')?.address
if (!game) throw new Error('RoboStrikeGame not registered — drop contracts into vendor/casino-sdk/simulator/contracts/')

let totalWager = 0n
let totalPayout = 0n
let mismatches = 0

async function placeOnce(i) {
  const tank = i % 3
  const od = i % 4 === 3 // every 4th round commits Overdrive
  const wager = i % 5 === 0 ? parseEther('5') : parseEther('1')

  const hash = await wallet.writeContract({
    address: deployed.host, abi: abis, functionName: 'openSession',
    args: [game, deployed.vault, wager, encodeTank(tank, od), '0x'],
  })
  const rcpt = await client.waitForTransactionReceipt({ hash })
  const opened = rcpt.logs
    .map((l) => { try { return decodeEventLog({ abi: abis, data: l.data, topics: l.topics }) } catch { return null } })
    .find((e) => e?.eventName === 'CasinoSessionOpened')
  const sessionId = opened.args.sessionId
  const reqEvent = rcpt.logs
    .map((l) => { try { return decodeEventLog({ abi: abis, data: l.data, topics: l.topics }) } catch { return null } })
    .find((e) => e?.eventName === 'CasinoSessionRandomnessRequested')
  if (!reqEvent) throw new Error('no randomness request event — VRF not requested by onSessionStart')
  // Fulfill immediately with the SDK's local VRF node key (the background
  // watcher would eventually fulfill too; in-script keeps the 20-round test ~2s/round).
  try {
    await fulfillLocalVrfRequest({
      publicClient: client,
      walletClient: vrfWallet,
      routerAddress: deployed.router,
      requestId: reqEvent.args.requestId,
      nodePrivateKey: LOCAL_VRF_NODE_PRIVATE_KEY,
    })
  } catch (e) {
    const msg = String(e.shortMessage || e.message)
    if (msg.includes('InvalidRequestId')) {
      // Request expired on the router (older nonce-race casualty or >15 blocks
      // old): exercise the SDK's own stuck-randomness path — cancel + refund —
      // then re-open the round.
      // advance past randomnessDeadlineBlock (host reverts cancel before it)
      await fetch(deployed.rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'hardhat_mine', params: ['0x14'], id: 1 }) })
      const payout = await wallet.writeContract({ address: deployed.host, abi: abis, functionName: 'cancelStuckRandomness', args: [sessionId] }).then(() => true).catch(() => false)
      console.log(`  session ${sessionId} expired → cancelStuckRandomness: ${payout ? 'refunded, retrying round' : 'cancel failed'}`)
      return placeOnce(i)
    }
    throw e
  }

  let s = await waitSettled(sessionId)
  if (!s) {
    // Fulfillment stranded (router latency quirk): mine past randomnessDeadline,
    // cancelStuckRandomness refunds the wager, then re-open the round.
    await fetch(deployed.rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'hardhat_mine', params: ['0x14'], id: 1 }) })
    const ok = await wallet.writeContract({ address: deployed.host, abi: abis, functionName: 'cancelStuckRandomness', args: [sessionId] }).then(() => true).catch(() => false)
    console.log(`  session ${sessionId} stranded → cancelStuckRandomness: ${ok ? 'refunded, retrying' : 'FAILED'}`)
    if (!ok) throw new Error(`session ${sessionId} unrecoverable`)
    return placeOnce(i)
  }
  const { wagerBase, phase, gameState } = s
  const decoded = decodeGameState(gameState)
  if (!decoded) throw new Error(`session ${sessionId} settled but gameState has no randomness`)

  // Cross-check: TS paytable math on the on-chain randomness word must equal
  // the payout the contract actually settled (CasinoSessionSettled event).
  const v = BigInt(decoded.randomness)
  const tsOutcome = mapVrfToOutcome(v, decoded.tankId)
  if (tsOutcome !== decoded.outcome) throw new Error(`gameState outcome ${decoded.outcome} != TS-mapped ${tsOutcome}`)
  let tsPayout = payoutForOutcome(wagerBase, decoded.tankId, tsOutcome)
  if (decoded.overdriveTaken) tsPayout = payoutAfterOverdrive(tsPayout, decoded.overdriveWon)

  const settledLogs = await client.getContractEvents({
    address: deployed.host, abi: abis, eventName: 'CasinoSessionSettled',
    args: { sessionId }, fromBlock: 0n, toBlock: 'latest',
  })
  const payoutOnChain = settledLogs[0]?.args?.payout ?? -1n

  const checks = {
    tankEcho: decoded.tankId === tank,
    settledPhase: Number(phase) === SESSION_SETTLED,
    outcomeRange: decoded.outcome >= 0 && decoded.outcome <= 4,
    odCoherent: !decoded.overdriveTaken || qualifiesForOverdrive(decoded.tankId, decoded.outcome),
    payoutMatch: payoutOnChain === tsPayout,
  }
  const ok = Object.values(checks).every(Boolean)
  if (!ok) mismatches++
  totalWager += wagerBase
  totalPayout += payoutOnChain

  console.log(
    `#${String(i + 1).padStart(2, '0')} sess=${String(sessionId).padEnd(3)} ${TANK_NAMES[tank].padEnd(8)} ` +
    `od=${decoded.overdriveTaken ? (decoded.overdriveWon ? 'WIN' : 'BUST') : '-  '} ` +
    `${OUTCOME_NAMES[decoded.outcome].padEnd(7)} payout=${(Number(payoutOnChain) / 1e18).toFixed(2).padStart(6)} ` +
    `${ok ? 'MATCH' : 'MISMATCH ' + JSON.stringify(checks)}`,
  )
}

for (let i = 0; i < ROUNDS; i++) await placeOnce(i)

// ---- chaos tests ----
const chaos = []
const expectRevert = async (label, fn) => {
  try { await fn(); chaos.push(`${label}: FAIL (no revert)`) } catch (e) { chaos.push(`${label}: PASS`) }
}
await expectRevert('invalid gameData (1 byte)', () =>
  wallet.writeContract({ address: deployed.host, abi: abis, functionName: 'openSession', args: [game, deployed.vault, parseEther('1'), '0x01', '0x'] }))
await expectRevert('tankId=3 out of range', () =>
  wallet.writeContract({ address: deployed.host, abi: abis, functionName: 'openSession', args: [game, deployed.vault, parseEther('1'), encodeTank(3, false), '0x'] }))
await expectRevert('wager over balance', () =>
  wallet.writeContract({ address: deployed.host, abi: abis, functionName: 'openSession', args: [game, deployed.vault, balance * 2n, encodeTank(0, false), '0x'] }))
await expectRevert('cancelStuckRandomness on SETTLED session', () =>
  wallet.writeContract({ address: deployed.host, abi: abis, functionName: 'cancelStuckRandomness', args: [1n] }))

const rtp = Number(totalPayout) / Number(totalWager)
console.log('')
console.log(`ROUNDS: ${ROUNDS}  wagered: ${Number(totalWager) / 1e18}  paid out: ${Number(totalPayout) / 1e18}  empirical RTP: ${(rtp * 100).toFixed(1)}%`)
console.log(`MISMATCHES (on-chain payout vs TS paytable math): ${mismatches}`)
console.log('CHAOS:')
chaos.forEach((c) => console.log('  ' + c))
process.exit(mismatches > 0 || chaos.some((c) => c.includes('FAIL')) ? 1 : 0)
