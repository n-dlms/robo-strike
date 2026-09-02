import { describe, it, expect } from 'vitest'
import { PALETTE, PALETTE_HEX } from '../src/config/palette'

describe('palette', () => {
  it('has 6 + outline colors', () => {
    expect(Object.keys(PALETTE)).toEqual(['navy', 'cyan', 'magenta', 'yellow', 'green', 'white', 'outline'])
  })
  it('hex matches', () => {
    expect(PALETTE_HEX.navy).toBe('#0a1a3f')
    expect(PALETTE_HEX.cyan).toBe('#4ff2e3')
  })
})
