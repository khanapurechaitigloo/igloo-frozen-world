import { useEffect, useRef, useCallback } from 'react'

/**
 * AmbientAudio — procedural wind + crackle ambience using Web Audio API.
 * No audio files needed. Generates warm fire crackle and frozen wind on the fly.
 */
export default function AmbientAudio({ playing }) {
  const ctxRef = useRef(null)
  const nodesRef = useRef(null)

  const start = useCallback(() => {
    if (ctxRef.current) return

    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctxRef.current = ctx

    // Master volume
    const master = ctx.createGain()
    master.gain.value = 0.15
    master.connect(ctx.destination)

    // ── WIND (brown noise filtered) ──
    const windGain = ctx.createGain()
    windGain.gain.value = 0.4
    windGain.connect(master)

    // Generate noise buffer
    const bufferSize = ctx.sampleRate * 4
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)

    // Brown noise (integrated white noise)
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 3.5 // compensate for gain loss
    }

    const windSource = ctx.createBufferSource()
    windSource.buffer = noiseBuffer
    windSource.loop = true

    // Low-pass for wind rumble
    const windLP = ctx.createBiquadFilter()
    windLP.type = 'lowpass'
    windLP.frequency.value = 400
    windLP.Q.value = 1.0

    // Band-pass for wind howl
    const windBP = ctx.createBiquadFilter()
    windBP.type = 'bandpass'
    windBP.frequency.value = 250
    windBP.Q.value = 0.5

    windSource.connect(windLP)
    windLP.connect(windBP)
    windBP.connect(windGain)
    windSource.start()

    // Modulate wind with slow LFO
    const windLFO = ctx.createOscillator()
    windLFO.type = 'sine'
    windLFO.frequency.value = 0.15 // slow breath
    const windLFOGain = ctx.createGain()
    windLFOGain.gain.value = 0.15
    windLFO.connect(windLFOGain)
    windLFOGain.connect(windGain.gain)
    windLFO.start()

    // ── FIRE CRACKLE (high-freq noise bursts) ──
    const fireGain = ctx.createGain()
    fireGain.gain.value = 0.12
    fireGain.connect(master)

    // Higher noise for crackle
    const crackleBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const cData = crackleBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      // Sparse crackle — mostly silence with occasional pops
      cData[i] = Math.random() < 0.003 ? (Math.random() * 2 - 1) * 0.8 : Math.random() * 0.02 - 0.01
    }

    const fireSource = ctx.createBufferSource()
    fireSource.buffer = crackleBuffer
    fireSource.loop = true

    const fireBP = ctx.createBiquadFilter()
    fireBP.type = 'bandpass'
    fireBP.frequency.value = 2000
    fireBP.Q.value = 2.0

    fireSource.connect(fireBP)
    fireBP.connect(fireGain)
    fireSource.start()

    // ──LOW HUM (sub-bass warmth) ──
    const humGain = ctx.createGain()
    humGain.gain.value = 0.04
    humGain.connect(master)

    const humOsc = ctx.createOscillator()
    humOsc.type = 'sine'
    humOsc.frequency.value = 60
    humOsc.connect(humGain)
    humOsc.start()

    nodesRef.current = { master, windSource, windLFO, fireSource, humOsc, ctx }
  }, [])

  useEffect(() => {
    if (playing) {
      start()
    }
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {})
        ctxRef.current = null
        nodesRef.current = null
      }
    }
  }, [playing, start])

  return null // no DOM
}
