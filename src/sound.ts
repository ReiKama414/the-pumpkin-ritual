type Cue = 'open' | 'close' | 'morph' | 'midnight'

class RitualAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private ambient: AudioNode[] = []
  private enabled = false

  async setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      if (this.context && this.master) {
        this.master.gain.setTargetAtTime(0, this.context.currentTime, .2)
      }
      return
    }
    if (!this.context) this.init()
    await this.context!.resume()
    this.master!.gain.setTargetAtTime(.42, this.context!.currentTime, .6)
  }

  private init() {
    const ctx = this.context = new AudioContext()
    const master = this.master = ctx.createGain()
    master.gain.value = 0
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -18
    limiter.ratio.value = 6
    master.connect(limiter).connect(ctx.destination)

    // Filtered, slowly modulated noise creates a seamless night breeze.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let brown = 0
    for (let i = 0; i < data.length; i++) {
      brown = (brown + Math.random() * .04 - .02) / 1.02
      data[i] = brown * 3
    }
    const wind = ctx.createBufferSource()
    wind.buffer = buffer
    wind.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 650
    const windGain = ctx.createGain()
    windGain.gain.value = .38
    wind.connect(filter).connect(windGain).connect(master)
    wind.start()
    const lfo = ctx.createOscillator()
    const modulation = ctx.createGain()
    lfo.frequency.value = .09
    modulation.gain.value = .12
    lfo.connect(modulation).connect(windGain.gain)
    lfo.start()
    const hum = ctx.createOscillator()
    hum.type = 'sine'
    hum.frequency.value = 54
    const humGain = ctx.createGain()
    humGain.gain.value = .055
    hum.connect(humGain).connect(master)
    hum.start()
    this.ambient = [wind, lfo, hum]
  }

  cue(kind: Cue) {
    if (!this.enabled || !this.context || !this.master) return
    const ctx = this.context
    const now = ctx.currentTime
    const special = kind === 'midnight'
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = kind === 'close' ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(special ? 80 : kind === 'close' ? 130 : 210, now)
    oscillator.frequency.exponentialRampToValueAtTime(special ? 38 : kind === 'close' ? 62 : 76, now + 1.3)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(.085, now + .08)
    gain.gain.exponentialRampToValueAtTime(.001, now + 1.8)
    oscillator.connect(gain).connect(this.master)
    oscillator.start(now)
    oscillator.stop(now + 2)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }

    // Short, quiet wooden creaks or crystalline reconstruction harmonics.
    for (let i = 0; i < 4; i++) {
      const partial = ctx.createOscillator()
      const envelope = ctx.createGain()
      partial.type = kind === 'open' ? 'triangle' : 'sine'
      partial.frequency.value = kind === 'open' ? 73 + i * 47 : 380 + i * 177
      envelope.gain.setValueAtTime(0, now)
      envelope.gain.linearRampToValueAtTime(.014, now + .12 + i * .09)
      envelope.gain.exponentialRampToValueAtTime(.0001, now + .8 + i * .16)
      partial.connect(envelope).connect(this.master)
      partial.start(now)
      partial.stop(now + 1.6)
      partial.onended = () => { partial.disconnect(); envelope.disconnect() }
    }
  }

  dispose() {
    this.ambient.forEach(node => node.disconnect())
    this.context?.close()
    this.context = null
    this.master = null
    this.ambient = []
    this.enabled = false
  }
}

export const audio = new RitualAudio()
