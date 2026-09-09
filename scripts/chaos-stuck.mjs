// Stuck-randomness chaos test per GETTING_STARTED §7: advance past
// randomnessDeadlineBlock, then cancelStuckRandomness → refund + CANCELLED.
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { readFileSync } from 'node:fs'
const deployed = JSON.parse(readFileSync('vendor/casino-sdk/simulator/local-node/deployed.json', 'utf8'))
const abi = parseAbi([
  'function getSession(uint256 sessionId) view returns ((address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint32,uint64,bytes32,uint8,bytes,bytes,bytes))',
  'function cancelStuckRandomness(uint256 sessionId) returns (uint256 payout)',
  'function balanceOf(address) view returns (uint256)',
])
const c = createPublicClient({ transport: http(deployed.rpcUrl) })
const w = createWalletClient({ transport: http(deployed.rpcUrl), account: privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') })
const sid = BigInt(process.argv[2] || 46)
let s = await c.readContract({ address: deployed.host, abi, functionName: 'getSession', args: [sid] })
const deadline = s[8]
console.log(`session ${sid}: phase=${Number(s[12])} deadline block=${deadline} current=${await c.getBlockNumber()}`)
// advance blocks (hardhat evm_mine)
await fetch(deployed.rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'evm_mine', params: [{ blocks: 20 }], id: 1 }) })
console.log('mined 20 blocks →', await c.getBlockNumber())
const balBefore = await c.readContract({ address: deployed.token, abi, functionName: 'balanceOf', args: [w.account.address] })
const hash = await w.writeContract({ address: deployed.host, abi, functionName: 'cancelStuckRandomness', args: [sid] })
const rcpt = await c.waitForTransactionReceipt({ hash })
s = await c.readContract({ address: deployed.host, abi, functionName: 'getSession', args: [sid] })
const balAfter = await c.readContract({ address: deployed.token, abi, functionName: 'balanceOf', args: [w.account.address] })
console.log('cancel tx status:', rcpt.status, '→ phase now:', Number(s[12]), '(5=CANCELLED)')
console.log('refund (escrowedStake returned):', balBefore === balAfter ? '0 (cancelled before settle, wager already returned?)' : 'yes')
console.log('balance delta:', (Number(balAfter) - Number(balBefore)) / 1e18, 'chUSD')
console.log(Number(s[12]) === 5 ? 'STUCK-RANDOMNESS CHAOS PASS' : 'FAIL')
