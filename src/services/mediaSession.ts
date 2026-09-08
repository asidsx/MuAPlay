/**
 * Native MediaSession API Integration
 * Supports Android notification panel, lockscreen controls, and Bluetooth car/headset remotes
 */
import { Track } from '../types/music';

interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
}

let registeredCallbacks: MediaSessionCallbacks | null = null;

export function initMediaSession(callbacks: MediaSessionCallbacks) {
  registeredCallbacks = callbacks;

  if (!('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.setActionHandler('play', () => {
      registeredCallbacks?.onPlay();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      registeredCallbacks?.onPause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      registeredCallbacks?.onPrev();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      registeredCallbacks?.onNext();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && !isNaN(details.seekTime)) {
        registeredCallbacks?.onSeek(details.seekTime);
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skip = details.seekOffset || 10;
      // Triggers relative jump if supported
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skip = details.seekOffset || 10;
      // Triggers relative jump if supported
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      registeredCallbacks?.onPause();
    });
  } catch (err) {
    console.warn('MediaSession handler registration notice:', err);
  }
}

export function updateMediaSessionMetadata(track: Track | null) {
  if (!('mediaSession' in navigator) || !track) return;

  try {
    const artworkList: MediaImage[] = [];

    if (track.coverUrl) {
      artworkList.push(
        { src: track.coverUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: track.coverUrl, sizes: '256x256', type: 'image/jpeg' },
        { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' }
      );
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'Hi-Res Cyber Audio',
      artwork: artworkList,
    });
  } catch (err) {
    console.warn('Failed to update MediaMetadata:', err);
  }
}

export function updateMediaSessionPlaybackState(isPlaying: boolean) {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  } catch {}
}

export function updateMediaSessionPositionState(currentTime: number, duration: number) {
  if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;

  if (isNaN(currentTime) || isNaN(duration) || duration <= 0) return;

  try {
    navigator.mediaSession.setPositionState({
      duration: Math.max(0, duration),
      playbackRate: 1,
      position: Math.min(Math.max(0, currentTime), duration),
    });
  } catch {}
}
