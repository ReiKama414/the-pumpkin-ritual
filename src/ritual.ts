import { create } from 'zustand'
import gsap from 'gsap'
import { audio } from './sound'

export const forms = ['Classic', 'Wicked', 'Haunted', 'Hollow', 'Cursed'] as const
export type Form = typeof forms[number]
export const chapters = [
  { name: 'Awakening', phrase: 'Something awakens.', note: 'Some things are only alive after midnight.' },
  { name: 'Rotation', phrase: 'Every side, a secret.', note: 'Look closer. There is more beneath the skin.' },
  { name: 'Separation', phrase: 'Let the light out.', note: 'Even the darkest things hold a little light.' },
  { name: 'Suspension', phrase: 'Beautifully undone.', note: 'For a moment, everything hangs in the balance.' },
  { name: 'Reconstruction', phrase: 'Whole. Once more.', note: 'An ending is just another kind of beginning.' },
]

export const motion = {
  progress: 0, separation: 0, rotation: 0, lift: 0,
  morph: 0, midnight: 0, flash: 0, hover: 0,
  drag: 0, pointerX: 0, pointerY: 0,
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
}
let morphTimeline: gsap.core.Timeline | null = null

export function revealSecret(swap: () => void) {
  useRitual.setState({ busy: true })
  const timeline = morphTimeline = gsap.timeline({ onComplete: () => {
    useRitual.setState({ busy: false })
    morphTimeline = null
  } })
  timeline.to(motion, { morph: 1, duration: motion.reduced ? .12 : .6, delay: .8, ease: 'power2.inOut' })
    .call(swap)
    .to(motion, { morph: 0, duration: motion.reduced ? .15 : .85, ease: 'power3.out' })
  return () => { timeline.kill(); if (morphTimeline === timeline) morphTimeline = null }
}

interface RitualState {
  form: Form
  chapter: number
  progress: number
  sound: boolean
  busy: boolean
  ready: boolean
  about: boolean
  completed: boolean
  midnight: boolean
  setForm: (form: Form) => void
  setProgress: (progress: number) => void
  toggleSound: () => void
  setAbout: (value: boolean) => void
}

export const useRitual = create<RitualState>((set, get) => ({
  form: 'Classic', chapter: 0, progress: 0, sound: false, busy: false,
  ready: false, about: false, completed: false, midnight: false,
  setForm: (form) => {
    if (form === get().form || get().busy) return
    set({ busy: true })
    audio.cue('morph')
    const tl = morphTimeline = gsap.timeline({ onComplete: () => { set({ busy: false }); morphTimeline = null } })
    // Collapse the actual shell toward its petal axis, exchange the cut geometry,
    // then unfurl the new contour. The swap happens only while fully contracted.
    tl.to(motion, { morph: 1, duration: motion.reduced ? .18 : .65, ease: 'power2.inOut' })
      .call(() => set({ form }))
      .to(motion, { morph: 0, duration: motion.reduced ? .18 : .85, ease: 'power3.out' })
  },
  setProgress: (progress) => {
    motion.progress = progress
    const chapter = Math.min(4, Math.floor(progress * 5))
    if (chapter !== get().chapter) audio.cue(chapter === 4 ? 'close' : 'open')
    if (progress > .97 && !get().completed) {
      gsap.to(motion, { flash: 1, duration: .12, yoyo: true, repeat: 3, onComplete: () => { motion.flash = 0 } })
    }
    set({ progress, chapter, completed: get().completed || progress > .97 })
  },
  toggleSound: () => {
    const enabled = !get().sound
    audio.setEnabled(enabled)
    set({ sound: enabled })
  },
  setAbout: (about) => set({ about }),
}))

let activeTimeline: gsap.core.Timeline | null = null
let clickTimes: number[] = []

export function runRitual(special = false) {
  if (useRitual.getState().about) return
  if (useRitual.getState().busy && !special) return
  activeTimeline?.kill()
  morphTimeline?.kill()
  morphTimeline = null
  motion.morph = 0
  motion.separation = Math.max(motion.separation, scrollSeparation(motion.progress))
  useRitual.setState({ busy: true, midnight: special })
  audio.cue(special ? 'midnight' : 'open')
  const pace = motion.reduced ? .18 : 1
  const baseRotation = motion.rotation
  activeTimeline = gsap.timeline({ onComplete: () => {
    motion.progress = 1
    useRitual.setState({ busy: false, completed: true, midnight: false, chapter: 4, progress: 1 })
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    activeTimeline = null
  } })
  activeTimeline.call(() => useRitual.setState({ chapter: 1, progress: .24 }), [], 0)
    .to(motion, { rotation: baseRotation + (motion.reduced ? 0 : Math.PI * 2), duration: 8.18 * pace, ease: 'sine.inOut' }, 0)
    .call(() => useRitual.setState({ chapter: 2, progress: .48 }), [], 1.15 * pace)
    .to(motion, { separation: 1, lift: 1, duration: 2.3 * pace, ease: 'power2.inOut' }, 1.15 * pace)
    .call(() => useRitual.setState({ chapter: 3, progress: .68 }), [], 3.45 * pace)
    .call(() => { useRitual.setState({ chapter: 4, progress: .88 }); audio.cue('close') }, [], 5.65 * pace)
    .to(motion, { separation: 0, lift: 0, midnight: 0, duration: 2.53 * pace, ease: 'back.out(1.12)' }, 5.65 * pace)
    .to(motion, { flash: 1, duration: .09 })
    .to(motion, { flash: 0, duration: .12 })
    .to(motion, { flash: .7, duration: .08 })
    .to(motion, { flash: 0, duration: .55 })
  if (special) activeTimeline.to(motion, { midnight: 1, duration: .6 * pace }, 0)
}

export function pumpkinClick() {
  const now = performance.now()
  clickTimes = [...clickTimes.filter(t => now - t < 1000), now]
  if (clickTimes.length >= 3) {
    clickTimes = []
    runRitual(true)
  } else if (!useRitual.getState().busy) runRitual()
}

export function restart() {
  activeTimeline?.kill()
  activeTimeline = null
  morphTimeline?.kill()
  morphTimeline = null
  gsap.killTweensOf(motion)
  Object.assign(motion, { separation: 0, rotation: 0, lift: 0, morph: 0, midnight: 0, flash: 0, drag: 0, progress: 0 })
  useRitual.setState({ busy: false, completed: false, midnight: false, form: 'Classic', chapter: 0, progress: 0 })
  window.scrollTo({ top: 0, behavior: 'instant' })
}

export function disposeRitual() {
  activeTimeline?.kill()
  morphTimeline?.kill()
  gsap.killTweensOf(motion)
}

export function scrollSeparation(p: number) {
  if (p < .35) return 0
  if (p < .60) return gsap.parseEase('power2.inOut')((p - .35) / .25)
  if (p < .77) return 1
  return 1 - gsap.parseEase('power2.inOut')(Math.min(1, (p - .77) / .23))
}
