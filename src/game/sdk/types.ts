// ============================================================================
// Vendored bridge types, faithful to casino-sdk src/types.ts (2026-09-01 zip,
// ETag ac54be4c). Trimmed to the surface ROBO STRIKE consumes; field names and
// semantics are verbatim so snapshots from the simulator / production host
// decode identically.
// ============================================================================

export type HexString = string

export type CasinoGameManifestV1 = {
  schemaVersion: 1
  gameId: string
  apiVersion: 1
  defaultLocale: string
  locales: Record<string, { name: string; description?: string }>
  presentation: {
    mode: 'full-iframe' | 'embedded'
    hostPanels: { openSession: boolean; history: boolean; status: boolean }
  }
  capabilities: {
    openSession: true
    submitAction: boolean
    forfeitExpiredSession: boolean
    cancelStuckRandomness: boolean
    resize: boolean
  }
  assets?: { iconUrl?: string; coverUrl?: string }
}

export type WalletStatus = 'ready' | 'disconnected' | 'setup-required' | 'session-key-mismatch'

export type HostSnapshotV1 = {
  apiVersion: number
  integration: {
    chainId: number
    slug: string
    gameAddress: `0x${string}`
    manifest: CasinoGameManifestV1
  }
  wallet: {
    address?: `0x${string}`
    smartVaultAddress?: `0x${string}`
    status: WalletStatus
  }
  token: {
    symbol?: string
    decimals?: number
    iconUrl?: string
  }
  balances: { smartVaultBalance?: string }
  casino?: {
    availableLiquidity?: string
    maxBetRiskBps?: number
    maxAllowedReservedProfit?: string
    maxBetAmount?: string
  }
  sessions: {
    items: Array<{
      sessionId: string
      sessionKey: string // `${chainId}:${sessionId}`
      gameAddress: `0x${string}`
      phase?: number
      phaseName?: string // 'WAITING_RANDOMNESS' | 'SETTLED' | ...
      wager?: string
      stake?: string
      payout?: string
      isSettled: boolean
      openedAt?: number
      settledAt?: number
      lastEventTimestamp: number
      raw: {
        gameData?: HexString
        gameState?: HexString
        randomness?: HexString
        requestId?: HexString
        openTransactionHash?: HexString
        settleTransactionHash?: HexString
      }
    }>
  }
  ui: {
    locale: string
    theme: 'light' | 'dark' | 'system'
    viewport?: { availableHeight: number }
  }
}

export type HostApiV1 = {
  reportContentSize?(input: { minHeight: number }): Promise<void>
  openSession(input: {
    wager: string
    gameData: HexString
    randomnessRequestData?: HexString
  }): Promise<{ sessionKey: string; transactionHash: HexString }>
  submitAction(input: {
    sessionId: string
    actionData: HexString
    randomnessRequestData?: HexString
    approvalAmount?: string
  }): Promise<{ transactionHash: HexString }>
  cancelStuckRandomness(input: { sessionId: string }): Promise<{ transactionHash: HexString }>
  revealOutcome(input: { sessionId: string }): Promise<void>
  getRandomnessVerification?(input: { sessionId: string }): Promise<unknown>
}

export type GuestApiV1 = {
  setState(snapshot: HostSnapshotV1 | null): Promise<void>
}

export const TERMINAL_PHASES = ['SETTLED', 'FORFEITED', 'CANCELLED'] as const

export const isTerminalPhase = (row: { isSettled: boolean; phaseName?: string }): boolean =>
  row.isSettled || (row.phaseName !== undefined && (TERMINAL_PHASES as readonly string[]).includes(row.phaseName))
