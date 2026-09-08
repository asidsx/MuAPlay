/**
 * Sleep Timer Service with Smooth Volume Fade-Out
 */
import { audioEngine } from './audioEngine';

export type SleepTimerMode = 'time' | 'end_of_track';

export interface SleepTimerState {
  isActive: boolean;
  mode: SleepTimerMode;
  remainingSeconds: number;
  totalSeconds: number;
  targetTimestamp: number | null;
}

type Listener = (state: SleepTimerState) => void;

class SleepTimerService {
  private timerId: number | null = null;
  private checkIntervalId: number | null = null;
  private listeners: Set<Listener> = new Set();
  private originalVolume: number = 0.8;
  private isFading = false;
  private onTrackEndedCallback: (() => void) | null = null;
  private onPauseAction: (() => void) | null = null;

  public state: SleepTimerState = {
    isActive: false,
    mode: 'time',
    remainingSeconds: 0,
    totalSeconds: 0,
    targetTimestamp: null,
  };

  public setPauseHandler(handler: () => void) {
    this.onPauseAction = handler;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  /**
   * Start timer for specified minutes
   */
  public start(minutes: number, currentVolume: number) {
    this.cancel();
    this.originalVolume = currentVolume;
    const totalSeconds = Math.max(1, Math.round(minutes * 60));
    const targetTimestamp = Date.now() + totalSeconds * 1000;

    this.state = {
      isActive: true,
      mode: 'time',
      remainingSeconds: totalSeconds,
      totalSeconds,
      targetTimestamp,
    };
    this.notify();

    this.checkIntervalId = window.setInterval(() => {
      if (!this.state.targetTimestamp) return;
      const now = Date.now();
      const diffMs = this.state.targetTimestamp - now;
      const remSec = Math.max(0, Math.ceil(diffMs / 1000));

      this.state.remainingSeconds = remSec;

      // Smooth volume fade out in last 30 seconds (or 10s if duration < 60s)
      const fadeWindow = Math.min(30, Math.floor(this.state.totalSeconds * 0.5));
      if (remSec <= fadeWindow && remSec > 0) {
        this.isFading = true;
        const fadeRatio = remSec / fadeWindow;
        audioEngine.setVolume(this.originalVolume * fadeRatio);
      }

      if (remSec <= 0) {
        this.triggerExpire();
      } else {
        this.notify();
      }
    }, 1000);
  }

  /**
   * Start timer set to pause when the currently playing track finishes
   */
  public startEndOfTrack(currentVolume: number) {
    this.cancel();
    this.originalVolume = currentVolume;
    this.state = {
      isActive: true,
      mode: 'end_of_track',
      remainingSeconds: 0,
      totalSeconds: 0,
      targetTimestamp: null,
    };
    this.notify();
  }

  /**
   * Called by player when a track ends; if mode === 'end_of_track', pauses playback
   */
  public handleTrackEnded(): boolean {
    if (this.state.isActive && this.state.mode === 'end_of_track') {
      this.triggerExpire();
      return true;
    }
    return false;
  }

  /**
   * Extend active timer by minutes
   */
  public addMinutes(extraMinutes: number) {
    if (!this.state.isActive || this.state.mode !== 'time' || !this.state.targetTimestamp) return;
    const extraSeconds = extraMinutes * 60;
    this.state.targetTimestamp += extraSeconds * 1000;
    this.state.totalSeconds += extraSeconds;
    this.state.remainingSeconds += extraSeconds;
    if (this.isFading) {
      this.isFading = false;
      audioEngine.setVolume(this.originalVolume);
    }
    this.notify();
  }

  /**
   * Cancel / Disarm timer
   */
  public cancel() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.isFading) {
      audioEngine.setVolume(this.originalVolume);
      this.isFading = false;
    }
    this.state = {
      isActive: false,
      mode: 'time',
      remainingSeconds: 0,
      totalSeconds: 0,
      targetTimestamp: null,
    };
    this.notify();
  }

  private triggerExpire() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }

    // Call pause action
    if (this.onPauseAction) {
      this.onPauseAction();
    } else {
      audioEngine.pauseTrack();
    }

    // Restore volume so user's next play isn't muted
    setTimeout(() => {
      audioEngine.setVolume(this.originalVolume);
      this.isFading = false;
    }, 500);

    this.state = {
      isActive: false,
      mode: 'time',
      remainingSeconds: 0,
      totalSeconds: 0,
      targetTimestamp: null,
    };
    this.notify();
  }
}

export const sleepTimer = new SleepTimerService();
