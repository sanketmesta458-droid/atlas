'use client'

/* © 2026 Aditya Sarode. All rights reserved. */

export type AudioBeatEvent = {
  source: 'mic' | 'file'
  energy: number // 0 to 1
  isBeat: boolean
  bpm: number
  freqBands: number[]
}

type AudioBeatListener = (event: AudioBeatEvent) => void

export class AudioDetector {
  private audioCtx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private micStream: MediaStream | null = null
  private micSource: MediaStreamAudioSourceNode | null = null
  private fileAudio: HTMLAudioElement | null = null
  private fileSource: MediaElementAudioSourceNode | null = null

  private isMicListening: boolean = false
  private isFilePlaying: boolean = false
  private currentFileName: string = ''
  private animFrameId: number | null = null

  private listeners: Set<AudioBeatListener> = new Set()
  private lastBeatTime: number = 0
  private beatIntervals: number[] = []
  private estimatedBpm: number = 120

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      this.audioCtx = new AudioCtx()
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
    return this.audioCtx
  }

  public subscribe(cb: AudioBeatListener) {
    this.listeners.add(cb)
    return () => {
      this.listeners.delete(cb)
    }
  }

  private emit(event: AudioBeatEvent) {
    this.listeners.forEach(cb => cb(event))
  }

  // 1. LIVE MIC LISTENER (Listens to room music from microphone)
  public async startMicListening(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    try {
      if (this.isMicListening) return true

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.micStream = stream
      const ctx = this.getAudioContext()

      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8

      this.micSource = ctx.createMediaStreamSource(stream)
      this.micSource.connect(this.analyser)

      this.isMicListening = true
      this.startAnalysisLoop('mic')
      return true
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err)
      return false
    }
  }

  public stopMicListening() {
    this.isMicListening = false
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop())
      this.micStream = null
    }
    if (this.micSource) {
      this.micSource.disconnect()
      this.micSource = null
    }
    if (!this.isFilePlaying && this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  public getIsMicListening(): boolean {
    return this.isMicListening
  }

  // 2. AUDIO FILE UPLOAD & PLAYBACK
  public loadAudioFile(file: File): Promise<string> {
    return new Promise((resolve) => {
      this.stopAudioFile()
      const url = URL.createObjectURL(file)
      this.currentFileName = file.name

      const audio = new Audio(url)
      this.fileAudio = audio
      const ctx = this.getAudioContext()

      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.82

      this.fileSource = ctx.createMediaElementSource(audio)
      this.fileSource.connect(this.analyser)
      this.analyser.connect(ctx.destination)

      audio.onplay = () => {
        this.isFilePlaying = true
        this.startAnalysisLoop('file')
      }

      audio.onpause = () => {
        this.isFilePlaying = false
      }

      audio.onended = () => {
        this.isFilePlaying = false
      }

      resolve(file.name)
    })
  }

  public playAudioFile() {
    if (this.fileAudio) {
      this.fileAudio.play()
    }
  }

  public pauseAudioFile() {
    if (this.fileAudio) {
      this.fileAudio.pause()
    }
  }

  public stopAudioFile() {
    if (this.fileAudio) {
      this.fileAudio.pause()
      this.fileAudio = null
      this.isFilePlaying = false
    }
    if (this.fileSource) {
      this.fileSource.disconnect()
      this.fileSource = null
    }
  }

  public getIsFilePlaying(): boolean {
    return this.isFilePlaying
  }

  public getFileName(): string {
    return this.currentFileName
  }

  // Shared FFT Beat Detection Loop
  private startAnalysisLoop(source: 'mic' | 'file') {
    if (!this.analyser) return

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const loop = () => {
      if (!this.isMicListening && !this.isFilePlaying) return

      this.analyser!.getByteFrequencyData(dataArray)

      // Calculate bass energy (first 8 bins)
      let bassSum = 0
      for (let i = 0; i < 8; i++) {
        bassSum += dataArray[i]
      }
      const bassAvg = bassSum / 8
      const energy = bassAvg / 255

      // Beat threshold detection
      const now = performance.now()
      let isBeat = false

      if (energy > 0.58 && now - this.lastBeatTime > 260) {
        isBeat = true
        const delta = now - this.lastBeatTime
        this.lastBeatTime = now

        if (delta > 280 && delta < 1200) {
          this.beatIntervals.push(delta)
          if (this.beatIntervals.length > 8) this.beatIntervals.shift()
          const avgInterval = this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length
          this.estimatedBpm = Math.round(60000 / avgInterval)
        }
      }

      // Sample 6 frequency bands for UI visualizer
      const bands = [
        dataArray[2] / 255,
        dataArray[6] / 255,
        dataArray[12] / 255,
        dataArray[24] / 255,
        dataArray[48] / 255,
        dataArray[72] / 255
      ]

      this.emit({
        source,
        energy,
        isBeat,
        bpm: this.estimatedBpm,
        freqBands: bands
      })

      this.animFrameId = requestAnimationFrame(loop)
    }

    loop()
  }
}

export const audioDetector = new AudioDetector()
