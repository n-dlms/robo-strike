import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  validateCasinoGameManifest,
  canonicalCasinoGameId,
  assertSameOriginUrls,
} from '../src/game/sdk/manifest'
import { computeMaxWager, parseUnits, formatUnits, maxReservedProfitFor } from '../src/game/sdk/guest'
import type { HostSnapshotV1 } from '../src/game/sdk/types'

const manifestPath = new URL('../public/game.manifest.json', import.meta.url)

describe('game.manifest.json (ships to the host)', () => {
  const json = JSON.parse(readFileSync(manifestPath, 'utf8'))

  it('passes the ported validateCasinoGameManifest rules', () => {
    const res = validateCasinoGameManifest(json)
    expect(res.valid).toBe(true)
  })

  it('instant game shape: openSession only, no submitAction, resize on', () => {
    expect(json.capabilities).toEqual({
      openSession: true,
      submitAction: false,
      forfeitExpiredSession: false,
      cancelStuckRandomness: false,
      resize: true,
    })
    expect(json.presentation.mode).toBe('full-iframe')
    expect(json.presentation.hostPanels).toEqual({ openSession: false, history: false, status: false })
  })

  it('canonical gameId matches the contract name (RoboStrikeGame → robostrike)', () => {
    expect(canonicalCasinoGameId(json.gameId)).toBe('robostrike')
    expect(canonicalCasinoGameId('RoboStrikeGame')).toBe(canonicalCasinoGameId('robostrikegame'))
  })
})

describe('manifest validator rejections (exact host strings)', () => {
  const base = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const mutate = (fn: (m: any) => void): unknown => {
    const copy = JSON.parse(JSON.stringify(base))
    fn(copy)
    return copy
  }
  const invalidReason = (v: unknown): string => {
    const res = validateCasinoGameManifest(v)
    expect(res.valid).toBe(false)
    return (res as { valid: false; reason: string }).reason
  }

  it('rejects non-object', () => {
    expect(invalidReason('nope')).toBe('Manifest must be an object.')
  })
  it('rejects wrong schemaVersion', () => {
    expect(invalidReason(mutate((m) => (m.schemaVersion = 2)))).toBe(
      'Unsupported manifest schemaVersion or apiVersion.',
    )
  })
  it('rejects empty gameId', () => {
    expect(invalidReason(mutate((m) => (m.gameId = '')))).toBe(
      'Manifest gameId and defaultLocale are required.',
    )
  })
  it('rejects missing defaultLocale entry', () => {
    expect(invalidReason(mutate((m) => (m.defaultLocale = 'fr')))).toBe(
      'Manifest defaultLocale must exist in locales.',
    )
  })
  it('rejects bad presentation mode', () => {
    expect(invalidReason(mutate((m) => (m.presentation.mode = 'floating')))).toBe(
      'Manifest presentation is invalid.',
    )
  })
  it('rejects capabilities.openSession !== literal true', () => {
    expect(invalidReason(mutate((m) => (m.capabilities.openSession = false)))).toBe(
      'Manifest capabilities are invalid.',
    )
  })
})

describe('assertSameOriginUrls', () => {
  it('same origin passes, cross-origin fails', () => {
    expect(assertSameOriginUrls('https://a.example/game.manifest.json', 'https://a.example/')).toBe(true)
    expect(assertSameOriginUrls('https://b.example/manifest.json', 'https://a.example/')).toBe(false)
  })
})

describe('computeMaxWager (bet-limits port)', () => {
  const snap = (casino: HostSnapshotV1['casino']): HostSnapshotV1 =>
    ({ casino }) as unknown as HostSnapshotV1

  it('riskBound = maxAllowedReservedProfit × 10000 / (multBps − 10000)', () => {
    // WARLORD max 12× → multBps 120000 → denominator 110000
    // reservedProfit 1100 → 1100*10000/110000 = 100
    expect(computeMaxWager(snap({ maxAllowedReservedProfit: '1100' }), 12)).toBe(100n)
  })

  it('clamps by maxBetAmount when both present', () => {
    expect(
      computeMaxWager(snap({ maxAllowedReservedProfit: '1100000', maxBetAmount: '50' }), 12),
    ).toBe(50n)
  })

  it('no casino block → undefined (no ceiling)', () => {
    expect(computeMaxWager(null, 30)).toBeUndefined()
    expect(computeMaxWager(snap(undefined), 30)).toBeUndefined()
  })

  it('maxReservedProfitFor matches quoteCaps (wager × (mult−1))', () => {
    expect(maxReservedProfitFor(10n, 30)).toBe(290n)
    expect(maxReservedProfitFor(10n, 1)).toBe(0n)
  })
})

describe('unit helpers', () => {
  it('parseUnits / formatUnits round-trip at 18 decimals', () => {
    expect(parseUnits('1.5')).toBe(1500000000000000000n)
    expect(parseUnits('0.000000000000000001')).toBe(1n)
    expect(formatUnits(1500000000000000000n)).toBe('1.5')
    expect(formatUnits(1n)).toBe('0.000000000000000001')
    expect(formatUnits(parseUnits('12.34'))).toBe('12.34')
    expect(() => parseUnits('abc')).toThrow()
  })
})
