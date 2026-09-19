// ============================================================================
// Stats: persistent session stats (localStorage roboStrike_stats_v1).
// Presentation fuel for banners and audio escalation. Never feeds the
// outcome path (VRF stays the sole authority).
// ============================================================================
export interface StatsState {
  rounds: number
  wins: number
  biggestMultX100: number // biggest payout/wager ×100 (integer)
  biggestWinLabel: string // e.g. 'JACKPOT ×30'
  streak: number
  bestStreak: number
}

const KEY = 'roboStrike_stats_v1'

export function loadStats(): StatsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      return {
        rounds: s.rounds | 0,
        wins: s.wins | 0,
        biggestMultX100: s.biggestMultX100 | 0,
        biggestWinLabel: typeof s.biggestWinLabel === 'string' ? s.biggestWinLabel : '',
        streak: s.streak | 0,
        bestStreak: s.bestStreak | 0,
      }
    }
  } catch {}
  return { rounds: 0, wins: 0, biggestMultX100: 0, biggestWinLabel: '', streak: 0, bestStreak: 0 }
}

export function saveStats(s: StatsState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {}
}

/** Record a settled round; returns the (possibly updated) state + flags for presentation. */
export function recordRound(
  s: StatsState,
  outcome: number,
  mult: number,
  outcomeName: string,
): { state: StatsState; streakIncreased: boolean; newBest: boolean } {
  const streak = outcome > 0 ? s.streak + 1 : 0
  const state: StatsState = {
    rounds: s.rounds + 1,
    wins: s.wins + (outcome > 0 ? 1 : 0),
    biggestMultX100: Math.max(s.biggestMultX100, Math.round(mult * 100)),
    biggestWinLabel:
      Math.round(mult * 100) > s.biggestMultX100 ? outcomeName : s.biggestWinLabel,
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
  }
  saveStats(state)
  return { state, streakIncreased: outcome > 0, newBest: state.biggestMultX100 > s.biggestMultX100 || state.bestStreak > s.bestStreak }
}
