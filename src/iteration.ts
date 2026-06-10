// A/B iteration config. VITE_ITERATION is baked at build time (see
// vite.config.ts / build-all.mjs) and selects when the end card appears:
//   10clk -> after 10 successful placements
//   60sec -> after 60 seconds of play (from first interaction)
//   full  -> after the whole room is completed
export type IterationMode = 'clicks' | 'time' | 'complete'

export interface IterationConfig {
  length: string
  mode: IterationMode
  limit: number | null
}

const RAW = (import.meta.env.VITE_ITERATION as string | undefined) || 'full'

const MAP: Record<string, IterationConfig> = {
  '10clk': { length: '10clk', mode: 'clicks', limit: 10 },
  '60sec': { length: '60sec', mode: 'time', limit: 60 },
  full: { length: 'full', mode: 'complete', limit: null },
}

export const ITERATION: IterationConfig = MAP[RAW] ?? MAP.full
