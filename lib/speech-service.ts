"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

export type LipSyncData = {
  speaking: boolean;
  amplitude: number;
  viseme: "closed" | "open" | "wide" | "round" | "smile";
};

type LipSyncCallback = (data: LipSyncData) => void;

class OpenSourceSpeechService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private listening: boolean = false;
  private recognition: any = null;
  private lipListeners: Set<LipSyncCallback> = new Set();
  private animFrameId: number | null = null;
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
      this.initVoice();
      if (this.synth) {
        this.synth.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return;

    // Priority list of clear, articulate voices
    const best =
      voices.find(
        (v) =>
          /Google US English|Google UK English|Samantha|Daniel|Arthur|Alex|Fred|Victoria|Karen|en-US-Standard/i.test(
            v.name,
          ) && v.lang.startsWith("en"),
      ) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];

    if (best) {
      this.voice = best;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public onLipSync(cb: LipSyncCallback) {
    this.lipListeners.add(cb);
    return () => {
      this.lipListeners.delete(cb);
    };
  }

  private notifyLip(data: LipSyncData) {
    this.lipListeners.forEach((cb) => cb(data));
  }

  // Play modern Apple/Cyber robotic sound effects
  public playChime(type: "startup" | "action" | "ack" | "complete") {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "action") {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "complete") {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "startup") {
        osc.frequency.setValueAtTime(261.63, now);
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.2);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        osc.frequency.setValueAtTime(659.25, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {}
  }

  // Synthesize expressive cyber robotic vocal syllables via Web Audio API
  private playRoboticVocals(wordCount: number, durationMs: number) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const syllables = Math.max(3, Math.min(24, Math.round(wordCount * 1.5)));
      const stepDuration = durationMs / 1000 / syllables;

      for (let i = 0; i < syllables; i++) {
        const startTime = ctx.currentTime + i * stepDuration;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // Alternate formant harmonic tones (mimics robot voice synthesis)
        const baseFreq = 220 + (i % 4) * 65 + Math.sin(i * 1.8) * 45;
        osc.type = i % 2 === 0 ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(
          baseFreq * 1.15,
          startTime + stepDuration * 0.7,
        );

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(baseFreq * 2.2, startTime);
        filter.Q.setValueAtTime(3.5, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(
          0.035,
          startTime + stepDuration * 0.25,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          startTime + stepDuration * 0.9,
        );

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + stepDuration);
      }
    } catch {}
  }

  // INFALLIBLE DUAL-ENGINE SPEECH SYNTHESIS (Zero silent failures)
  public speak(text: string, onEnd?: () => void): Promise<void> {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("atlas-speech", { detail: text }));
    }
    return new Promise((resolve) => {
      if (typeof window === "undefined" || this.isMuted) {
        onEnd?.();
        resolve();
        return;
      }

      this.stopSpeaking();

      const cleanText = text.replace(/[*_#`[\]()]/g, "").trim();
      if (!cleanText) {
        onEnd?.();
        resolve();
        return;
      }

      const words = cleanText.split(/\s+/);
      const estimatedDuration = Math.max(900, words.length * 280);
      let startTime = performance.now();
      let speechEnded = false;
      let nativeSpeechStarted = false;
      let usingAudioFallback = false;

      const finishSpeaking = () => {
        if (speechEnded) return;
        speechEnded = true;
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.notifyLip({ speaking: false, amplitude: 0, viseme: "closed" });
        onEnd?.();
        resolve();
      };

      // Continuous lip-sync animation
      const tickLip = () => {
        const elapsed = performance.now() - startTime;
        if (elapsed > estimatedDuration + 300) {
          finishSpeaking();
          return;
        }

        const phase = elapsed * 0.02;
        const syllableBurst = Math.sin(phase) * 0.5 + 0.5;
        const microJitter = Math.sin(phase * 2.8) * 0.2;
        const amp = Math.max(0.12, Math.min(1, syllableBurst + microJitter));

        let viseme: LipSyncData["viseme"] = "open";
        if (amp < 0.25) viseme = "closed";
        else if (amp > 0.7) viseme = "wide";
        else if (Math.sin(phase * 1.5) > 0.3) viseme = "round";

        this.notifyLip({
          speaking: true,
          amplitude: amp,
          viseme,
        });

        this.animFrameId = requestAnimationFrame(tickLip);
      };

      // Natural voice speech synthesis with keepalive anti-hang watchdog
      if (this.synth) {
        try {
          this.synth.resume();
          const utterance = new SpeechSynthesisUtterance(cleanText);
          if (!this.voice) this.initVoice();
          if (this.voice) utterance.voice = this.voice;

          utterance.rate = 1.02;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          // Chromium speech synthesis keepalive to prevent audio freeze
          const keepAlive = setInterval(() => {
            if (this.synth && this.synth.speaking) {
              this.synth.pause();
              this.synth.resume();
            } else {
              clearInterval(keepAlive);
            }
          }, 3500);

          utterance.onstart = () => {
            nativeSpeechStarted = true;
            startTime = performance.now();
            tickLip();
          };

          utterance.onend = () => {
            clearInterval(keepAlive);
            if (!usingAudioFallback) finishSpeaking();
          };
          utterance.onerror = () => {
            clearInterval(keepAlive);
            if (!usingAudioFallback) finishSpeaking();
          };

          this.synth.speak(utterance);

          // Chromium occasionally accepts an utterance but never begins it.
          // Cancel that stalled item and use the audible Web Audio fallback
          // rather than leaving chat and hands-free replies silent.
          setTimeout(() => {
            if (!nativeSpeechStarted && !speechEnded) {
              usingAudioFallback = true;
              try {
                this.synth?.cancel();
              } catch {}
              startTime = performance.now();
              this.playRoboticVocals(words.length, estimatedDuration);
              tickLip();
              setTimeout(finishSpeaking, estimatedDuration);
            }
          }, 900);

          // Fallback safety timeout if utterance hangs
          setTimeout(() => {
            clearInterval(keepAlive);
            if (!speechEnded) finishSpeaking();
          }, estimatedDuration + 1200);
          return;
        } catch {
          // Native synthesis failed, proceed with web audio fallback
        }
      }

      // If no synth or error, run visual lip-sync + soft chime
      startTime = performance.now();
      this.playRoboticVocals(words.length, estimatedDuration);
      tickLip();
    });
  }

  public stopSpeaking() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    this.notifyLip({ speaking: false, amplitude: 0, viseme: "closed" });
  }

  // CONTINUOUS REAL-TIME CONVERSATION (Hands-Free Duplex Voice Loop)
  private continuousMode: boolean = false;
  private continuousHandler: ((text: string) => Promise<string | void>) | null =
    null;
  private activeFinalCallback: ((text: string) => void | Promise<void>) | null = null;
  private currentTranscriptBuffer: string = "";
  private finalTranscriptBuffer: string = "";
  private silenceTimer: any = null;
  private continuousTurnInProgress = false;
  private continuousStateHandler: ((active: boolean) => void) | undefined;
  private continuousInterimHandler: ((text: string) => void) | undefined;
  private continuousRestartTimer: ReturnType<typeof setTimeout> | null = null;
  private lastListeningError: string | null = null;

  // Chromium can end a `continuous` recognition session at any time, including
  // before it produces a result. Keep the hands-free conversation alive in
  // that case, but never retry permission/service failures.
  private restartContinuousListening() {
    if (
      !this.continuousMode ||
      this.listening ||
      this.continuousTurnInProgress ||
      this.continuousRestartTimer
    ) {
      return;
    }

    this.continuousRestartTimer = setTimeout(() => {
      this.continuousRestartTimer = null;
      if (
        this.continuousMode &&
        !this.listening &&
        !this.continuousTurnInProgress
      ) {
        this.setContinuousMode(
          true,
          undefined,
          this.continuousStateHandler,
          this.continuousInterimHandler,
        );
      }
    }, 300);
  }

  public setContinuousMode(
    enabled: boolean,
    handler?: (text: string) => Promise<string | void>,
    onStateChange?: (active: boolean) => void,
    onInterim?: (text: string) => void,
  ) {
    this.continuousMode = enabled;
    if (handler) this.continuousHandler = handler;
    if (onStateChange) this.continuousStateHandler = onStateChange;
    if (onInterim) this.continuousInterimHandler = onInterim;

    if (enabled) {
      if (this.continuousRestartTimer) {
        clearTimeout(this.continuousRestartTimer);
        this.continuousRestartTimer = null;
      }
      this.listen(
        async (finalText) => {
          if (!finalText.trim()) return;
          if (this.continuousHandler) {
            await this.continuousHandler(finalText);
          }
        },
        this.continuousInterimHandler,
        this.continuousStateHandler,
      );
    } else {
      if (this.continuousRestartTimer) {
        clearTimeout(this.continuousRestartTimer);
        this.continuousRestartTimer = null;
      }
      this.stopListening();
      this.continuousStateHandler?.(false);
    }
  }

  public isContinuousMode() {
    return this.continuousMode;
  }

  public getLastListeningError() {
    return this.lastListeningError;
  }

  public listen(
    onFinalResult: (text: string) => void | Promise<void>,
    onInterimResult?: (text: string) => void,
    onStateChange?: (active: boolean) => void,
  ): () => void {
    if (typeof window === "undefined") return () => {};

    // First ensure AudioContext is active for chimes
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      this.playChime("ack");
      onStateChange?.(false);
      // Helpful spoken fallback
      this.speak(
        "Speech recognition is not available in this browser. Please type any command into the cyber bar!",
      );
      return () => {};
    }

    this.stopListening();

    try {
      this.recognition = new SpeechRec();
      this.recognition.lang = "en-US";
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.activeFinalCallback = onFinalResult;
      this.currentTranscriptBuffer = "";
      this.finalTranscriptBuffer = "";
      this.lastListeningError = null;

      const resetSilenceTimer = () => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.silenceTimer = setTimeout(() => {
          if (this.listening && this.currentTranscriptBuffer.trim()) {
            this.commitSpeechResult();
          }
        }, 1400); // Auto-commit after 1.4s of quiet
      };

      this.recognition.onstart = () => {
        this.listening = true;
        // Hands-free recognition may be restarted by Chromium repeatedly.
        // An acknowledgement sound here becomes an endless "tun tun" loop,
        // so reserve it for the explicit tap-to-talk interaction only.
        if (!this.continuousMode) this.playChime("ack");
        onStateChange?.(true);
      };

      this.recognition.onresult = (e: any) => {
        let finalChunk = "";
        let interimChunk = "";

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const item = e.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript + " ";
          } else {
            interimChunk += item[0].transcript;
          }
        }

        if (finalChunk) {
          this.finalTranscriptBuffer = (
            this.finalTranscriptBuffer +
            " " +
            finalChunk
          ).trim();
        }

        const displayCandidate = (
          this.finalTranscriptBuffer +
          " " +
          interimChunk
        ).trim();
        if (displayCandidate) {
          // Some Chromium implementations deliver the last phrase only as an
          // interim result before they end recognition. Keep it so hands-free
          // commands are not silently discarded.
          this.currentTranscriptBuffer = displayCandidate;
          onInterimResult?.(displayCandidate);
          resetSilenceTimer();
        }
      };

      this.recognition.onerror = (err: any) => {
        // If error occurred but we have text, commit it!
        if (this.currentTranscriptBuffer.trim()) {
          this.commitSpeechResult();
        } else {
          this.listening = false;
          const error = err?.error;
          const terminalErrors = [
            "not-allowed",
            "service-not-allowed",
            "audio-capture",
            "network",
            "language-not-supported",
          ];
          if (terminalErrors.includes(error)) {
            // Retrying cannot solve permission, microphone, or browser speech
            // service errors. Stop and surface the cause to the UI.
            this.lastListeningError = error || "unknown";
            this.continuousMode = false;
          } else {
            this.restartContinuousListening();
          }
          onStateChange?.(false);
        }
      };

      this.recognition.onend = () => {
        this.recognition = null;
        if (this.listening && this.currentTranscriptBuffer.trim()) {
          this.commitSpeechResult();
        } else {
          this.listening = false;
          onStateChange?.(false);
          this.restartContinuousListening();
        }
      };

      // Request microphone permission explicitly
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            // Stop stream immediately, we just needed browser permission granted
            stream.getTracks().forEach((t) => t.stop());
            try {
              this.recognition.start();
            } catch {}
          })
          .catch(() => {
            // Try starting anyway in case it was already granted
            try {
              this.recognition.start();
            } catch {}
          });
      } else {
        this.recognition.start();
      }
    } catch {
      this.listening = false;
      onStateChange?.(false);
    }

    return () => this.stopListening();
  }

  // Immediately commit current speech buffer and notify listener
  public commitSpeechResult() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    const captured = this.currentTranscriptBuffer.trim();
    this.currentTranscriptBuffer = "";
    this.finalTranscriptBuffer = "";
    const cb = this.activeFinalCallback;
    const isContinuousTurn = this.continuousMode;
    this.activeFinalCallback = null;
    // Mark the turn before aborting recognition. Otherwise `onend` races with
    // the async reply and restarts the microphone while Atlas is still talking.
    if (captured && cb && isContinuousTurn) {
      this.continuousTurnInProgress = true;
    }
    this.stopListening();

    if (captured && cb) {
      this.playChime("action");
      void Promise.resolve(cb(captured))
        .catch(() => {})
        .finally(() => {
          // Re-open the mic only after the command and spoken reply complete.
          // This prevents the recognizer from hearing Atlas's own response.
          if (this.continuousMode && isContinuousTurn) {
            setTimeout(() => {
              this.continuousTurnInProgress = false;
              if (this.continuousMode && !this.listening) {
                this.setContinuousMode(
                  true,
                  undefined,
                  this.continuousStateHandler,
                  this.continuousInterimHandler,
                );
              }
            }, 350);
          }
        });
    }
  }

  public stopListening() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.listening = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
  }

  public isListening() {
    return this.listening;
  }
}

export const speechService = new OpenSourceSpeechService();
