export type AudioFormatType = 'FLAC' | 'WAV' | 'MP3' | 'M4A' | 'AAC' | 'OGG' | 'OPUS' | 'ALAC';
export type RepeatMode = 'off' | 'all' | 'one';

export interface HiResInfo {
  format: AudioFormatType;
  bitDepth?: number; // e.g., 24, 16, 32
  sampleRate?: number; // e.g., 96000, 192000, 44100
  bitrateKbps?: number; // e.g., 320, 1411, 2304
  isLossless: boolean;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  url: string; // Blob URL, object URL, or remote URL
  coverUrl?: string;
  filePath?: string; // e.g., "/storage/emulated/0/Download/Nightcall_HiRes.flac"
  fileSize?: string; // e.g., "42.8 MB"
  hiResInfo: HiResInfo;
  year?: string;
  genre?: string;
  lyrics?: string;
  isFavorite?: boolean;
  addedAt: number; // timestamp
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface FolderScanState {
  isScanning: boolean;
  currentFolder: string;
  scannedCount: number;
  totalFound: number;
  scannedFiles: ScannedFile[];
  lastScanTime?: number;
}

export interface ScannedFile {
  name: string;
  path: string;
  size: string;
  extension: string;
  durationSec: number;
  artist?: string;
  title?: string;
  album?: string;
  hiResInfo: HiResInfo;
  previewUrl: string; // url to audio for instant preview
  coverUrl?: string;
  lyrics?: string;
  alreadyInLibrary: boolean;
}

export type EQBand = {
  freq: number;
  label: string;
  gain: number; // -12dB to +12dB
};

export type EQPreset = {
  name: string;
  gains: number[];
};
