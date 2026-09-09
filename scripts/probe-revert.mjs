import { createPublicClient, http, parseAbi, encodeFunctionData, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync } from 'node:fs'
const deployed = JSON.parse(readFileSync('vendor/casino-sdk/simulator/local-node/deployed.json', 'utf8'))
console.log('games:', deployed.games.map(g => g.name + '=' + g.address))
const abi = parseAbi([
  'function openSession(address game, address vault, uint256 wager, bytes gameData, bytes randomnessRequestData)',
  'function quoteCaps(uint256 wager, bytes gameData) view returns (uint256, uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function availableLiquidity() view returns (uint256)',
])
const c = createPublicClient({ transport: http(deployed.rpcUrl) })
const acc = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')
const game = deployed.games.find(g => g.name === 'RoboStrikeGame').address
const gd = '0x' + '00'.repeat(31) + '00'
// 1. our game's quoteCaps directly
try {
  const caps = await c.readContract({ address: game, abi, functionName: 'quoteCaps', args: [parseEther('1'), gd] })
  console.log('quoteCaps ok:', caps.map((x) => x.toString()))
} catch (e) { console.log('quoteCaps REVERT:', String(e.cause?.message ?? e.message).slice(0, 160)) }
// 2. vault liquidity
try {
  const liq = await c.readContract({ address: deployed.vault, abi, functionName: 'availableLiquidity' })
  console.log('vault liquidity:', liq.toString())
} catch (e) { console.log('liquidity read failed:', String(e.message).slice(0, 100)) }
// 3. full openSession eth_call
const data = encodeFunctionData({ abi, functionName: 'openSession', args: [game, deployed.vault, parseEther('1'), gd, '0x'] })
try {
  const res = await c.call({ to: deployed.host, data, account: acc })
  console.log('openSession call ok')
} catch (e) {
  console.log('openSession revert data:', e.cause?.data ?? e.data ?? '(none)')
  console.log('openSession revert msg:', String(e.cause?.message ?? e.message).slice(0, 200))
}
