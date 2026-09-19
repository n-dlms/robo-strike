// ============================================================================
// Manifest validator, port of casino-sdk src/manifest.ts validateCasinoGameManifest
// rules (verbatim failure strings from CHAIN_WTF doc §5.1, cross-checked against
// the coinflip example). No zod dependency; same acceptance/rejection decisions.
// ============================================================================

import type { CasinoGameManifestV1 } from './types'

export const validateCasinoGameManifest = (
  value: unknown,
): { valid: true; manifest: CasinoGameManifestV1 } | { valid: false; reason: string } => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { valid: false, reason: 'Manifest must be an object.' }
  }
  const m = value as Record<string, unknown>

  if (m.schemaVersion !== 1 || m.apiVersion !== 1) {
    return { valid: false, reason: 'Unsupported manifest schemaVersion or apiVersion.' }
  }
  if (typeof m.gameId !== 'string' || m.gameId.length === 0 || typeof m.defaultLocale !== 'string' || m.defaultLocale.length === 0) {
    return { valid: false, reason: 'Manifest gameId and defaultLocale are required.' }
  }
  const locales = m.locales
  if (typeof locales !== 'object' || locales === null || Array.isArray(locales) || Object.keys(locales).length < 1) {
    return { valid: false, reason: 'Manifest locales must contain at least one locale.' }
  }
  const localeRecord = locales as Record<string, unknown>
  if (!(m.defaultLocale in localeRecord)) {
    return { valid: false, reason: 'Manifest defaultLocale must exist in locales.' }
  }
  const def = localeRecord[m.defaultLocale] as Record<string, unknown> | null
  if (typeof def !== 'object' || def === null || typeof def.name !== 'string' || def.name.length === 0) {
    return { valid: false, reason: 'Manifest defaultLocale must exist in locales.' }
  }

  // presentation
  const p = m.presentation as Record<string, unknown> | undefined
  const panels = p?.hostPanels as Record<string, unknown> | undefined
  const panelsOk =
    typeof panels === 'object' &&
    panels !== null &&
    typeof panels.openSession === 'boolean' &&
    typeof panels.history === 'boolean' &&
    typeof panels.status === 'boolean'
  if (
    typeof p !== 'object' ||
    p === null ||
    (p.mode !== 'full-iframe' && p.mode !== 'embedded') ||
    !panelsOk
  ) {
    return { valid: false, reason: 'Manifest presentation is invalid.' }
  }

  // capabilities, openSession must be literal true
  const c = m.capabilities as Record<string, unknown> | undefined
  const capsOk =
    typeof c === 'object' &&
    c !== null &&
    c.openSession === true &&
    typeof c.submitAction === 'boolean' &&
    typeof c.forfeitExpiredSession === 'boolean' &&
    typeof c.cancelStuckRandomness === 'boolean' &&
    typeof c.resize === 'boolean'
  if (!capsOk) return { valid: false, reason: 'Manifest capabilities are invalid.' }

  // assets optional
  if (m.assets !== undefined) {
    const a = m.assets as Record<string, unknown>
    if (typeof a !== 'object' || a === null || Array.isArray(a)) {
      return { valid: false, reason: 'Manifest assets are invalid.' }
    }
    if (a.iconUrl !== undefined && typeof a.iconUrl !== 'string') {
      return { valid: false, reason: 'Manifest assets are invalid.' }
    }
    if (a.coverUrl !== undefined && typeof a.coverUrl !== 'string') {
      return { valid: false, reason: 'Manifest assets are invalid.' }
    }
  }

  return {
    valid: true,
    manifest: value as unknown as CasinoGameManifestV1,
  }
}

/** canonicalCasinoGameId, verbatim port (host rejects gameId canonical mismatch). */
export const canonicalCasinoGameId = (value: string | undefined | null): string => {
  if (!value) return ''
  let trimmed = value.trim()
  if (trimmed.match(/Game$/i)) trimmed = trimmed.replace(/Game$/i, '')
  return trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export const assertSameOriginUrls = (manifestUrl: string, iframeUrl: string): boolean => {
  try {
    return new URL(manifestUrl).origin === new URL(iframeUrl).origin
  } catch {
    return false
  }
}
