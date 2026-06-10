// Asset manifest. Every sprite/audio file is imported so Vite inlines it as a
// base64 data URI (assetsInlineLimit is huge) -> single-file HTML.
//
// The 50 stickers exist in 3 roles with divergent filenames, so each role is
// globbed and keyed by the id parsed from ITS OWN filename. Never derive one
// role's name from another (Draggable adds "_outline"; the source's sticker 48
// had a space that the asset pipeline normalised to a hyphen).

import bgWhite from './assets-webp/Sprites/Background/Bg-colored-white-extended_1.webp'
import bgColored from './assets-webp/Sprites/Background/Bg-colored-extended_1.webp'
import trayBg from './assets-webp/Sprites/blue-cointainer.webp'
import handIcon from './assets-webp/Sprites/hand-icon.webp'
import starBurst from './assets-webp/Sprites/Star-Burst.webp'
import ctaButton from './assets-webp/Sprites/End-Card/ctaButton.webp'
import logo from './assets-webp/Sprites/End-Card/logo.webp'

import bgm from './assets-webp/Audio/BGM.mp3'
import sfxCorrect from './assets-webp/Audio/Correct-Answer.mp3'
import sfxWrong from './assets-webp/Audio/Wrong-Answer.mp3'
import sfxFinished from './assets-webp/Audio/Finished.mp3'

type UrlMap = Record<number, string>

function keyById(glob: Record<string, string>, re: RegExp): UrlMap {
  const map: UrlMap = {}
  for (const [path, url] of Object.entries(glob)) {
    const m = path.match(re)
    if (m) map[Number(m[1])] = url
  }
  return map
}

const coloredGlob = import.meta.glob('./assets-webp/Sprites/Colored/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const numberedGlob = import.meta.glob('./assets-webp/Sprites/Numbered/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const draggableGlob = import.meta.glob('./assets-webp/Sprites/Draggable/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>

/** id -> data URI of the final colored sticker (placed art). */
export const COLORED: UrlMap = keyById(coloredGlob, /sticker_(\d+)_/)
/** id -> data URI of the in-scene outline silhouette (empty slot). */
export const OUTLINE: UrlMap = keyById(numberedGlob, /\/(\d+)\.webp$/)
/** id -> data URI of the tray draggable (colored + white die-cut border). */
export const DRAGGABLE: UrlMap = keyById(draggableGlob, /sticker_(\d+)_/)

export const IMAGES = { bgWhite, bgColored, trayBg, handIcon, starBurst, ctaButton, logo }
export const AUDIO = { bgm, sfxCorrect, sfxWrong, sfxFinished }

// Phaser texture-key helpers (consistent across modules).
export const texKey = {
  colored: (id: number) => `col_${id}`,
  outline: (id: number) => `out_${id}`,
  draggable: (id: number) => `drag_${id}`,
}
