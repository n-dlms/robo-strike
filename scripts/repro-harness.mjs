import { createPublicClient, createWalletClient, http, parseAbi, encodeFunctionData, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync } from 'node:fs'
const deployed = JSON.parse(readFileSync('vendor/casino-sdk/simulator/local-node/deployed.json', 'utf8'))
const abi = parseAbi([
  'function openSession(address game, address vault, uint256 wager, bytes gameData, bytes randomnessRequestData) returns (uint256, bytes32)',
  'function approve(address, uint256) returns (bool)',
])
const c = createPublicClient({ transport: http(deployed.rpcUrl) })
const w = createWalletClient({ transport: http(deployed.rpcUrl), account: privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') })
const game = deployed.games.find(g => g.name === 'RoboStrikeGame').address
// approve exactly like the harness batch
const ah = await w.writeContract({ address: deployed.token, abi, functionName: 'approve', args: [deployed.host, parseEther('1000')] })
await c.waitForTransactionReceipt({ hash: ah })
const data = encodeFunctionData({ abi, functionName: 'openSession', args: [game, deployed.vault, parseEther('1'), '0x' + '00'.repeat(31) + '00', '0x'] })
try {
  const { request } = await c.simulateContract({ address: deployed.host, abi, functionName: 'openSession', args: [game, deployed.vault, parseEther('1'), '0x' + '00'.repeat(31) + '00', '0x'], account: w.account })
  const h = await w.writeContract({ address: deployed.host, abi, functionName: 'openSession', args: [game, deployed.vault, parseEther('1'), '0x' + '00'.repeat(31) + '00', '0x'] })
  const r = await c.waitForTransactionReceipt({ hash: h })
  console.log('openSession TX SUCCESS, status:', r.status, 'gas:', r.gasUsed.toString())
} catch (e) {
  const raw = e.cause?.cause?.data ?? e.cause?.data ?? e.data
  console.log('REVERT raw:', typeof raw === 'string' ? raw : JSON.stringify(raw)?.slice(0, 300))
  console.log('msg:', String(e.cause?.message ?? e.message).slice(0, 250))
}
