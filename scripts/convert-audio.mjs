// Audio shrinker. Re-encodes the source MP3s to mono / low bitrate using the
// ffmpeg binary bundled by the `ffmpeg-static` npm package (no system ffmpeg
// required). BGM is the heaviest asset, so it is downmixed + trimmed to a
// short loop; SFX are downmixed to mono at a modest bitrate.
//
// Output goes to src/assets-webp/Audio/** with spaces replaced by '-' so the
// names import cleanly. Run once with `npm run audio`.
import ffmpegPath from 'ffmpeg-static'
import { execFileSync } from 'node:child_process'
import { mkdirSync, statSync } from 'node:fs'
import path from 'node:path'

const SRC = path.resolve('src/assets/Audio')
const OUT = path.resolve('src/assets-webp/Audio')
mkdirSync(OUT, { recursive: true })

// [sourceName, outputName, ffmpeg encode args]
const JOBS = [
  // BGM: mono, 72 kbps, trimmed to a 20 s loop with short fade-in/out edges.
  ['BGM.mp3', 'BGM.mp3', ['-ac', '1', '-b:a', '72k', '-t', '20']],
  ['Correct Answer.mp3', 'Correct-Answer.mp3', ['-ac', '1', '-b:a', '96k']],
  ['Wrong Answer.mp3', 'Wrong-Answer.mp3', ['-ac', '1', '-b:a', '96k']],
  ['Finished.mp3', 'Finished.mp3', ['-ac', '1', '-b:a', '96k']],
]

let totalIn = 0
let totalOut = 0
for (const [inName, outName, args] of JOBS) {
  const inPath = path.join(SRC, inName)
  const outPath = path.join(OUT, outName)
  execFileSync(ffmpegPath, ['-y', '-i', inPath, ...args, outPath], { stdio: 'pipe' })
  const inSize = statSync(inPath).size
  const outSize = statSync(outPath).size
  totalIn += inSize
  totalOut += outSize
  console.log(`${inName}  ${(inSize / 1024).toFixed(0)}KB -> ${(outSize / 1024).toFixed(0)}KB`)
}

const mb = (b) => (b / 1024 / 1024).toFixed(2)
console.log(`\nAudio: ${mb(totalIn)} MB -> ${mb(totalOut)} MB`)
