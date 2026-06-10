/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Baked-in iteration selector: '10clk' | '60sec' | 'full'. */
  readonly VITE_ITERATION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
