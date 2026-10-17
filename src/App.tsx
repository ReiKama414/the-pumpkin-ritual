import { useEffect, useRef } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, RotateCcw, Volume2, VolumeX, X, MoveHorizontal, Sparkles as SparkleIcon } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Scene from './Scene'
import { chapters, disposeRitual, forms, motion, restart, runRitual, useRitual } from './ritual'
import type { Form } from './ritual'
import { audio } from './sound'

gsap.registerPlugin(ScrollTrigger)
// A suspended/background WebView may deliver very sparse frames. Keep the
// ritual on real elapsed time instead of stretching eight seconds into minutes.
gsap.ticker.lagSmoothing(0)

function FaceIcon({ form }: { form: Form }) {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 7C3 1 2 25 10 27q6 3 12 0C30 25 29 1 16 7Z" stroke="currentColor" strokeWidth="1" opacity=".55" />
    <path d="M16 7q-1-5 3-5" stroke="currentColor" strokeWidth="1.2" />
    {form === 'Classic' && <path d="m8 15 5-5 1 6Zm16 0-5-5-1 6ZM9 20q7 7 14 0l-2 5H11Z" fill="currentColor" />}
    {form === 'Wicked' && <path d="m7 11 8 4-6 2Zm18 0-8 4 6 2ZM8 20l4 1 2-2 2 3 3-2 2 1 3-2-3 6-3-1-2 2-3-2-3 1Z" fill="currentColor" />}
    {form === 'Haunted' && <><ellipse cx="11" cy="14" rx="2.5" ry="4" fill="currentColor"/><ellipse cx="21" cy="14" rx="2.5" ry="4" fill="currentColor"/><ellipse cx="16" cy="23" rx="3" ry="3.5" fill="currentColor"/></>}
    {form === 'Hollow' && <><circle cx="10.5" cy="14.5" r="3.5" fill="currentColor"/><circle cx="21.5" cy="14.5" r="3.5" fill="currentColor"/><path d="M11 22h10v4H11zm3-2 2-3 2 3" fill="currentColor"/></>}
    {form === 'Cursed' && <path d="m7 13 5-2 3 6-5-1Zm18 0-5-2-3 6 5-1ZM8 21l5-1 3 3 3-3 5 1-5 5-3-1-3 1Zm9-13-3 4 4 5-4 4" stroke="currentColor" strokeWidth="1.2" />}
  </svg>
}

function SpiritPicker() {
  const form = useRitual(s => s.form)
  const busy = useRitual(s => s.busy)
  const setForm = useRitual(s => s.setForm)
  return <div className="spirit-picker" role="group" aria-label="Choose your pumpkin spirit">
    <span className="picker-caption">CHOOSE YOUR SPIRIT <span>↘</span></span>
    <div className="spirit-options">
      {forms.map((name, i) => <button key={name} className={`spirit ${form === name ? 'active' : ''}`} disabled={busy}
        onClick={() => setForm(name)} aria-pressed={form === name} title={`${name} · keyboard ${i + 1}`}>
        <FaceIcon form={name} /><span>{name}</span><span className="spirit-dot" />
      </button>)}
    </div>
  </div>
}

function Progress() {
  const progress = useRitual(s => s.progress)
  const chapter = useRitual(s => s.chapter)
  const scrollTo = (i: number) => window.scrollTo({ top: (document.documentElement.scrollHeight - window.innerHeight) * (i === 0 ? 0 : (i + .45) / 5), behavior: motion.reduced ? 'instant' : 'smooth' })
  return <>
    <nav className="chapter-dots" aria-label="Ritual chapters">
      {chapters.map((item, i) => <button key={item.name} onClick={() => scrollTo(i)} aria-label={`Chapter ${i + 1}: ${item.name}`} aria-current={chapter === i ? 'step' : undefined}>
        <span className="chapter-tooltip">{item.name}</span><span className={`chapter-dot ${chapter === i ? 'active' : ''}`} />
      </button>)}
    </nav>
    <div className="chapter-readout"><span className="chapter-fraction"><b>0{chapter + 1}</b><i>/</i>05</span><span className="chapter-name">{chapters[chapter].name}</span></div>
    <div className="scroll-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
  </>
}

function About() {
  const about = useRitual(s => s.about)
  const dialog = useRef<HTMLDialogElement>(null)
  const close = () => useRitual.getState().setAbout(false)
  useEffect(() => {
    const el = dialog.current
    if (about) { el?.showModal(); document.body.style.overflow = 'hidden' }
    else { el?.close(); document.body.style.overflow = '' }
    return () => { document.body.style.overflow = '' }
  }, [about])
  return <dialog ref={dialog} className="about-dialog" onCancel={close} onClick={e => { if (e.target === e.currentTarget) close() }} aria-labelledby="about-title">
    <div className="about-content">
      <button className="close-about icon-button" aria-label="Close about" onClick={close}><X size={20}/></button>
      <div className="eyebrow"><span className="little-star">✦</span> AN INTERACTIVE HALLOWEEN EXPERIMENT</div>
      <h2 id="about-title">A little darkness.<br/><em>A little wonder.</em></h2>
      <p>The Pumpkin Ritual is an invitation to slow down and play with the unknown. One pumpkin. Ten pieces. Five souls. And a quiet night that never quite stands still.</p>
      <div className="about-controls">
        <div><MoveHorizontal size={18}/><span>Drag to turn</span><small>← / →</small></div>
        <div><SparkleIcon size={18}/><span>Click to unravel</span><small>SPACE</small></div>
        <div><ArrowDown size={18}/><span>Scroll through the ritual</span><small>↑ / ↓</small></div>
        <div><FaceIcon form="Classic"/><span>Choose a spirit</span><small>1 — 5</small></div>
      </div>
      <p className="secret-note">Some secrets answer only three quick knocks.</p>
      <div className="about-colophon"><span>CRAFTED IN LIGHT, SHADOW & CODE</span><span>ALL HALLOWS' EVE · MMXXVI</span></div>
    </div>
  </dialog>
}

const titleLines = [
  ['Something', 'awakens.'], ['Every side,', 'a secret.'], ['Let the', 'light out.'],
  ['Beautifully', 'undone.'], ['Whole.', 'Once more.'],
]

function Story() {
  const chapter = useRitual(s => s.chapter)
  const busy = useRitual(s => s.busy)
  const midnight = useRitual(s => s.midnight)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.story-reveal', { y: motion.reduced ? 0 : 28, opacity: 0 }, { y: 0, opacity: 1, duration: motion.reduced ? .2 : 1.15, stagger: .10, ease: 'power3.out' })
    }, ref)
    return () => ctx.revert()
  }, [chapter, midnight])
  return <div ref={ref} className="story">
    <div className="eyebrow story-reveal"><span className="little-star">✦</span>{midnight ? 'THE MIDNIGHT RITUAL' : 'SOMETHING AWAKENS AFTER MIDNIGHT'}</div>
    <h1 className="story-title" aria-live="polite">
      <span className="title-mask"><span className="story-reveal">{midnight ? 'Midnight' : titleLines[chapter][0]}</span></span>
      <span className="title-mask"><em className="story-reveal">{midnight ? 'is calling.' : titleLines[chapter][1]}</em></span>
    </h1>
    <p className="story-description story-reveal">{chapters[chapter].note}<br/>A ritual of light, shadow, and a little mischief.</p>
    <button className="ritual-button story-reveal group" onClick={() => runRitual()} disabled={busy}>
      <span>{busy ? 'THE RITUAL IS UNFOLDING' : 'BEGIN THE RITUAL'}</span><span className="ritual-arrow"><ArrowUpRight size={17} className="transition-transform group-hover:rotate-45" /></span>
    </button>
    <div className="story-footnote story-reveal"><span className="tiny-line"/> NO TWO SPIRITS ARE THE SAME.</div>
  </div>
}

export default function App() {
  const ready = useRitual(s => s.ready)
  const sound = useRitual(s => s.sound)
  const midnight = useRitual(s => s.midnight)
  const completed = useRitual(s => s.completed)
  const frame = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: '#scroll-journey', start: 'top top', end: 'bottom bottom',
      onUpdate: self => { if (!useRitual.getState().about) useRitual.getState().setProgress(self.progress) },
    })
    // Also synchronize against the document's real scroll position. This keeps
    // mobile visual-viewport changes and restored browser scroll positions in
    // step with ScrollTrigger's cached measurements.
    const syncScroll = () => {
      trigger.update()
      const range = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(1, range)))
      if (!useRitual.getState().about && Math.abs(motion.progress - progress) > .0001) {
        useRitual.getState().setProgress(progress)
      }
    }
    const refresh = requestAnimationFrame(() => { trigger.refresh(); syncScroll() })
    const pointer = (e: PointerEvent) => {
      motion.pointerX = e.clientX / window.innerWidth * 2 - 1
      motion.pointerY = e.clientY / window.innerHeight * 2 - 1
    }
    const keyboard = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, dialog')) return
      if (useRitual.getState().about) return
      if (e.code === 'Space' && !target.closest('button, a')) { e.preventDefault(); runRitual() }
      if (e.code === 'ArrowLeft') { e.preventDefault(); motion.drag -= .25 }
      if (e.code === 'ArrowRight') { e.preventDefault(); motion.drag += .25 }
      const key = Number(e.key)
      if (key >= 1 && key <= 5) useRitual.getState().setForm(forms[key - 1])
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const preference = () => { motion.reduced = reduced.matches }
    window.addEventListener('pointermove', pointer, { passive: true })
    window.addEventListener('scroll', syncScroll, { passive: true })
    window.addEventListener('keydown', keyboard)
    reduced.addEventListener('change', preference)
    return () => {
      trigger.kill(); disposeRitual(); audio.dispose()
      cancelAnimationFrame(refresh)
      window.removeEventListener('scroll', syncScroll)
      window.removeEventListener('pointermove', pointer)
      window.removeEventListener('keydown', keyboard)
      reduced.removeEventListener('change', preference)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.entrance', { opacity: 0, y: motion.reduced ? 0 : 12 }, { opacity: 1, y: 0, duration: .9, stagger: .12, delay: .25, ease: 'power2.out' })
    }, frame)
    return () => ctx.revert()
  }, [ready])

  return <>
    <a className="skip-link" href="#ritual-controls">Skip to ritual controls</a>
    <div id="scroll-journey" aria-hidden="true" />
    <main ref={frame} className={`experience ${midnight ? 'midnight-active' : ''} ${completed ? 'ritual-completed' : ''}`} aria-label="The Pumpkin Ritual interactive experience">
      <div className="scene" aria-label="Interactive three-dimensional pumpkin. Drag to rotate, click to disassemble, or use the ritual controls."><Scene /></div>
      <div className="scene-shade" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <header className="header entrance">
        <a className="wordmark" href="#" onClick={e => { e.preventDefault(); restart() }} aria-label="The Pumpkin Ritual, restart">
          <span>THE</span><span>PUMPKIN</span><span>RITUAL<span className="wordmark-star">✦</span></span>
        </a>
        <div className="header-edition"><span>AN INTERACTIVE</span><span>HALLOWEEN EXPERIMENT</span></div>
        <nav className="top-nav" aria-label="Experience settings">
          <button onClick={() => useRitual.getState().setAbout(true)}>ABOUT <ArrowUpRight size={12}/></button>
          <span className="nav-divider"/>
          <button className="sound-button" onClick={() => useRitual.getState().toggleSound()} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>
            {sound ? <Volume2 size={15}/> : <VolumeX size={15}/>}<span>SOUND {sound ? 'ON' : 'OFF'}</span>
          </button>
          <button className="restart-button" onClick={restart} aria-label="Restart the ritual" title="Restart"><RotateCcw size={15}/></button>
        </nav>
      </header>

      <div className="edition-note entrance"><span className="edition-line"/> OCTOBER XXXI <span className="edition-dot">·</span> AFTER DARK</div>
      <Story />
      <div className="object-note entrance" aria-hidden="true"><span className="object-note-line"/><span>A SOUL, WAITING TO BE UNRAVELLED.</span></div>
      <div className="interaction-note entrance"><MoveHorizontal size={18}/><span>DRAG TO ROTATE <i>·</i> CLICK TO UNRAVEL</span></div>
      {completed && <button className="discovery-note" onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: motion.reduced ? 'instant' : 'smooth' })}><span>✦</span> THE NIGHT REMEMBERS YOU <ArrowRight size={12}/></button>}

      <footer className="footer entrance" id="ritual-controls">
        <button className="scroll-invitation" onClick={() => window.scrollBy({ top: window.innerHeight * 1.08, behavior: motion.reduced ? 'instant' : 'smooth' })}>
          <span className="scroll-icon"><ArrowDown size={16}/></span><span>SCROLL TO AWAKEN<small>THE NIGHT IS STILL YOUNG.</small></span>
        </button>
        <SpiritPicker />
        <Progress />
      </footer>
      <div className="bottom-colophon entrance"><span>AN EXPERIMENT IN THE AFTER HOURS</span><span>MADE OF DARKNESS. LIT FROM WITHIN.</span></div>
      <div className="midnight-veil" aria-hidden="true" />
    </main>
    <About />
    <div className={`loading-screen ${ready ? 'loaded' : ''}`} aria-hidden={ready}>
      <span className="loading-star">✦</span><span className="loading-title">The Pumpkin Ritual</span>
      <span className="loading-line"/><span className="loading-caption">GATHERING A LITTLE DARKNESS</span>
    </div>
  </>
}
