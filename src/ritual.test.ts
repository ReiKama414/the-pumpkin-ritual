import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import gsap from 'gsap'

let ritual: typeof import('./ritual')

beforeAll(async () => {
  vi.stubGlobal('window', { matchMedia: () => ({ matches: false }), scrollTo: vi.fn() })
  vi.stubGlobal('document', { documentElement: { scrollHeight: 6000 } })
  ritual = await import('./ritual')
})
afterEach(() => ritual.restart())

function currentTimeline() {
  const tweens = gsap.getTweensOf(ritual.motion)
  const timeline = tweens.at(-1)?.parent
  expect(timeline).toBeDefined()
  return timeline as gsap.core.Timeline
}

describe('repeatable ritual lifecycle', () => {
  it('opens, floats, closes precisely and can repeat', () => {
    for (let i = 0; i < 2; i++) {
      ritual.runRitual()
      const timeline = currentTimeline()
      timeline.totalProgress(.47)
      expect(ritual.motion.separation).toBeCloseTo(1)
      expect(ritual.useRitual.getState().chapter).toBe(3)
      timeline.totalProgress(1)
      expect(ritual.motion.separation).toBeCloseTo(0)
      expect(ritual.motion.progress).toBe(1)
      expect(ritual.motion.rotation).toBeCloseTo(Math.PI * 2 * (i + 1))
      expect(ritual.useRitual.getState().busy).toBe(false)
      expect(ritual.useRitual.getState().completed).toBe(true)
    }
  })

  it('restart cancels a live Midnight Ritual and restores controls', () => {
    ritual.runRitual(true)
    currentTimeline().totalProgress(.45)
    expect(ritual.motion.midnight).toBeCloseTo(1)
    expect(ritual.useRitual.getState().midnight).toBe(true)
    ritual.restart()
    expect(ritual.motion.separation).toBe(0)
    expect(ritual.motion.midnight).toBe(0)
    expect(ritual.useRitual.getState().busy).toBe(false)
    expect(ritual.useRitual.getState().chapter).toBe(0)
  })

  it('switches carving topology only when the shell has contracted', () => {
    ritual.useRitual.getState().setForm('Haunted')
    const timeline = currentTimeline()
    timeline.time(.64)
    expect(ritual.useRitual.getState().form).toBe('Classic')
    timeline.time(.66)
    expect(ritual.useRitual.getState().form).toBe('Haunted')
    expect(ritual.motion.morph).toBeGreaterThan(.9)
    timeline.totalProgress(1)
    expect(ritual.motion.morph).toBe(0)
    expect(ritual.useRitual.getState().busy).toBe(false)
  })

  it('scroll stages return to exact closed geometry at both endpoints', () => {
    expect(ritual.scrollSeparation(0)).toBe(0)
    expect(ritual.scrollSeparation(.67)).toBe(1)
    expect(ritual.scrollSeparation(1)).toBe(0)
  })
})
