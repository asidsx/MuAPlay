import { EQBand, EQPreset } from '../types/music';

export const EQ_FREQUENCIES = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: EQPreset[] = [
  { name: 'Flat (Прямой)', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Bass Boost (Усиление баса)', gains: [8, 6, 4, 2, 0, 0, 0, 1, 2, 3] },
  { name: 'Hi-Res Studio (Студийный)', gains: [2, 3, 1, 0, 0, 1, 3, 4, 5, 5] },
  { name: 'Rock (Рок)', gains: [5, 4, 2, 0, -1, 1, 3, 4, 4, 3] },
  { name: 'Electronic / Synth (Электроника)', gains: [6, 5, 2, 0, -1, 2, 3, 4, 5, 4] },
  { name: 'Vocal / Clarity (Вокал)', gains: [-2, -1, 0, 2, 4, 5, 4, 2, 1, 0] },
  { name: 'Acoustic / Jazz (Джаз)', gains: [3, 2, 1, 2, 1, 1, 2, 3, 3, 2] },
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private previewAudioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private isInitialized = false;

  // Track state
  public currentTrackId: string | null = null;
  public previewingTrackPath: string | null = null;

  public init() {
    if (this.isInitialized) return;

    this.audioElement = new Audio();
    this.previewAudioElement = new Audio();

    this.isInitialized = true;
  }

  private ensureAudioContext() {
    this.init();
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      if (this.audioElement) {
        try {
          this.sourceNode = this.ctx.createMediaElementSource(this.audioElement);
          this.gainNode = this.ctx.createGain();
          this.analyserNode = this.ctx.createAnalyser();
          this.analyserNode.fftSize = 256;

          // Build 10-Band Graphic Equalizer
          this.eqFilters = EQ_FREQUENCIES.map((freq) => {
            const filter = this.ctx!.createBiquadFilter();
            filter.type = freq <= 63 ? 'lowshelf' : freq >= 8000 ? 'highshelf' : 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.4;
            filter.gain.value = 0;
            return filter;
          });

          // Connect chain: Source -> EQ Filter 0 -> ... -> EQ Filter N -> Gain -> Analyser -> Destination
          let currentNode: AudioNode = this.sourceNode;
          this.eqFilters.forEach((filter) => {
            currentNode.connect(filter);
            currentNode = filter;
          });

          currentNode.connect(this.gainNode);
          this.gainNode.connect(this.analyserNode);
          this.analyserNode.connect(this.ctx.destination);
        } catch (err) {
          console.warn('Web Audio source creation failed, using standard HTML5 Audio:', err);
        }
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public async playTrack(url: string, trackId: string, fallbackGenerator?: () => string, forceRestart = false) {
    this.ensureAudioContext();
    if (!this.audioElement) return;

    // Stop preview if running
    this.stopPreview();

    const isSameTrack = this.currentTrackId === trackId && Boolean(this.audioElement.src);

    if (!isSameTrack || forceRestart || this.audioElement.ended) {
      this.currentTrackId = trackId;
      this.audioElement.src = url;
      this.audioElement.currentTime = 0;
    }

    try {
      await this.audioElement.play();
    } catch (err) {
      console.warn('Primary audio playback error, attempting fallback:', err);
      if (fallbackGenerator) {
        const fallbackUrl = fallbackGenerator();
        this.audioElement.src = fallbackUrl;
        this.audioElement.play().catch((e) => console.error('Fallback playback error:', e));
      }
    }
  }

  public pauseTrack() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public resumeTrack() {
    this.ensureAudioContext();
    if (this.audioElement && this.audioElement.src) {
      if (this.audioElement.ended) {
        this.audioElement.currentTime = 0;
      }
      this.audioElement.play().catch((err) => console.warn('Audio play error:', err));
    }
  }

  public seek(seconds: number) {
    if (this.audioElement) {
      this.audioElement.currentTime = seconds;
    }
  }

  public setVolume(volume: number) { // 0 to 1
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
    if (this.audioElement) {
      this.audioElement.volume = volume;
    }
  }

  // --- PREVIEW PLAYER (For modal before adding to playlist) ---
  public playPreview(previewUrl: string, itemPath: string, onEnded?: () => void) {
    this.init();
    if (!this.previewAudioElement) return;

    // Pause main playback during preview if needed, or lower volume
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }

    if (this.previewingTrackPath === itemPath && !this.previewAudioElement.paused) {
      // Toggle stop
      this.stopPreview();
      return;
    }

    this.previewingTrackPath = itemPath;
    this.previewAudioElement.src = previewUrl;
    this.previewAudioElement.onended = () => {
      this.previewingTrackPath = null;
      if (onEnded) onEnded();
    };

    this.previewAudioElement.play().catch((err) => console.warn('Preview play error:', err));
  }

  public stopPreview() {
    if (this.previewAudioElement) {
      this.previewAudioElement.pause();
      this.previewAudioElement.currentTime = 0;
    }
    this.previewingTrackPath = null;
  }

  // --- EQUALIZER METHODS ---
  public setEQBandGain(index: number, gainDb: number) {
    if (this.eqFilters[index]) {
      this.eqFilters[index].gain.value = gainDb;
    }
  }

  public applyEQPreset(preset: EQPreset) {
    preset.gains.forEach((gain, idx) => {
      this.setEQBandGain(idx, gain);
    });
  }

  public getAnalyserData(dataArray: Uint8Array) {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(dataArray);
    }
  }

  public getFrequencyData(): Uint8Array | null {
    if (!this.analyserNode) return null;
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getTimeDomainData(): Uint8Array | null {
    if (!this.analyserNode) return null;
    const bufferLength = this.analyserNode.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  public getLiveTelemetry() {
    const sampleRate = this.ctx ? this.ctx.sampleRate : 48000;
    const state = this.ctx ? this.ctx.state : 'running';
    const baseLatencyMs = this.ctx && this.ctx.baseLatency ? +(this.ctx.baseLatency * 1000).toFixed(1) : 10.5;
    
    // Calculate RMS & Peak dB from Time Domain
    let peakDb = -96;
    let rmsDb = -96;
    let peakPercent = 0;

    if (this.analyserNode) {
      const data = this.getTimeDomainData();
      if (data && data.length > 0) {
        let sumSquares = 0;
        let maxDev = 0;
        for (let i = 0; i < data.length; i++) {
          const val = (data[i] - 128) / 128; // -1.0 to 1.0
          const absVal = Math.abs(val);
          if (absVal > maxDev) maxDev = absVal;
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        peakPercent = Math.min(100, Math.round(maxDev * 100));
        peakDb = maxDev > 0.0001 ? +(20 * Math.log10(maxDev)).toFixed(1) : -96;
        rmsDb = rms > 0.0001 ? +(20 * Math.log10(rms)).toFixed(1) : -96;
      }
    }

    const eqActive = this.eqFilters.some((f) => Math.abs(f.gain.value) > 0.1);

    return {
      sampleRate,
      state,
      baseLatencyMs,
      peakDb,
      rmsDb,
      peakPercent,
      eqActive,
    };
  }

  public getAudioElement() {
    return this.audioElement;
  }
}

export const audioEngine = new AudioEngine();
