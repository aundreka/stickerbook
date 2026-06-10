import { defineConfig, type Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import shared from './vite.shared.js'

// VITE_ITERATION selects which end-card trigger this build bakes in
// (10clk | 60sec | full). build-all.mjs sets it per build via process.env;
// defaults to 'full' for plain `npm run dev` / `npm run build`.
const ITERATION = process.env.VITE_ITERATION || 'full'

// Post-build cleanup on the single inlined HTML:
//  - neutralize Phaser's internal console.error (validators reject it; esbuild
//    `pure` doesn't drop calls inside the bundled dependency under Vite 8).
//    Safe as a text replace — base64 data URIs can't contain "console.error"
//    because '.' isn't in the base64 alphabet.
//  - strip `type="module"` / `crossorigin` (ad networks reject ES modules; also
//    lets the file run from file://).
function cleanOutput(): Plugin {
  return {
    name: 'clean-output',
    closeBundle() {
      const file = resolve(process.cwd(), 'dist/index.html')
      let html: string
      try {
        html = readFileSync(file, 'utf8')
      } catch {
        return
      }
      html = html
        .replace(/console\.error/g, '(()=>{})')
        .replace(/\s+type="module"/g, '')
        .replace(/\s+crossorigin/g, '')
      writeFileSync(file, html)
    },
  }
}

export default defineConfig({
  ...shared,
  plugins: [viteSingleFile(), cleanOutput()],
  define: {
    'import.meta.env.VITE_ITERATION': JSON.stringify(ITERATION),
  },
  build: {
    // build-all.mjs writes per-network variants into dist/<length>/ between
    // builds; emptying the dir each build would wipe them. It cleans dist once
    // up front instead.
    emptyOutDir: false,
    // Inline every asset as base64 so the output is a single self-contained HTML.
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    // Older WebViews used by ad containers — keep transpile target conservative.
    target: 'es2018',
    rollupOptions: {
      output: {
        // IIFE single chunk — ad networks reject ES modules.
        format: 'iife',
      },
    },
  },
})
