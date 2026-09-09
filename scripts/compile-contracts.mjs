#!/usr/bin/env node
// Compile gate for contracts/ — mirrors the SDK simulator's solc settings
// (viaIR, optimizer 200 runs, evmVersion shanghai). Exit 1 on any error.
// Run: npm run compile:sol
import solc from 'solc'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'contracts')

const sources = {}
for (const f of readdirSync(root)) {
  if (f.endsWith('.sol')) sources[f] = { content: readFileSync(join(root, f), 'utf8') }
}

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    evmVersion: 'shanghai',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'metadata'] } },
  },
}

// Virtual filesystem resolver so `./ICasinoGameV2.sol` resolves inside contracts/.
const resolvePath = (sourcePath) => {
  if (sources[sourcePath]) return { contents: sources[sourcePath].content }
  throw new Error(`unresolvable import: ${sourcePath}`)
}

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: resolvePath }))

let failed = false
for (const e of output.errors ?? []) {
  const critical = e.severity === 'error'
  console.error(`${critical ? 'ERROR' : 'warning'}: ${e.formattedMessage}`)
  if (critical) failed = true
}

for (const [file, contracts] of Object.entries(output.contracts ?? {})) {
  for (const [name, c] of Object.entries(contracts)) {
    const bc = c.evm?.bytecode?.object ?? ''
    console.log(`${file}:${name} — abi ${c.abi.length} entries, bytecode ${bc.length / 2} bytes`)
  }
}

if (failed) process.exit(1)
console.log('SOL COMPILE PASS')
