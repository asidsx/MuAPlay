import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Track, AudioFormatType } from '../types/music';

const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.opus', '.wma'];

/**
 * Recursively scans Android Download folder and all subdirectories for audio files.
 */
export async function scanNativeDownloadDirectory(): Promise<Track[]> {
  const tracks: Track[] = [];

  if (!Capacitor.isNativePlatform()) {
    console.log('Not a native platform, native filesystem scan skipped.');
    return tracks;
  }

  try {
    // 1. Request permissions if required
    const permStatus = await Filesystem.checkPermissions();
    if (permStatus.publicStorage !== 'granted') {
      await Filesystem.requestPermissions();
    }

    // 2. Recursive walk through Download and subfolders
    async function walk(dirPath: string) {
      try {
        const res = await Filesystem.readdir({
          path: dirPath,
          directory: Directory.ExternalStorage,
        });

        for (const item of res.files) {
          const itemRelativePath = dirPath ? `${dirPath}/${item.name}` : item.name;

          if (item.type === 'directory') {
            await walk(itemRelativePath);
          } else if (item.type === 'file') {
            const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
            if (AUDIO_EXTENSIONS.includes(ext)) {
              const webUrl = Capacitor.convertFileSrc(item.uri);
              const cleanName = item.name.substring(0, item.name.lastIndexOf('.'));
              
              const parts = cleanName.split(' - ');
              const artist = parts.length > 1 ? parts[0].trim() : 'Скачанный трек';
              const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : cleanName;

              const rawFormat = ext.replace('.', '').toUpperCase();
              const format: AudioFormatType = (['FLAC', 'WAV', 'MP3', 'M4A', 'AAC', 'OGG', 'OPUS', 'ALAC'].includes(rawFormat) ? rawFormat : 'MP3') as AudioFormatType;

              tracks.push({
                id: `native-${dirPath.replace(/\//g, '-')}-${item.name}-${item.size || 0}`,
                title: title,
                artist: artist,
                album: dirPath.includes('/') ? dirPath.split('/').pop()! : 'Загрузки',
                url: webUrl,
                filePath: itemRelativePath,
                coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
                duration: 210, // Default estimated 3:30 min
                hiResInfo: {
                  format: format,
                  bitDepth: ext === '.flac' || ext === '.wav' ? 24 : 16,
                  sampleRate: ext === '.flac' || ext === '.wav' ? 96000 : 44100,
                  isLossless: ext === '.flac' || ext === '.wav',
                },
                fileSize: item.size ? `${(item.size / (1024 * 1024)).toFixed(1)} MB` : '3.5 MB',
                isFavorite: false,
                addedAt: Date.now(),
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Error scanning directory ${dirPath}:`, err);
      }
    }

    await walk('Download');
  } catch (err) {
    console.error('Native directory scan failed:', err);
  }

  return tracks;
}

/**
 * Loads a native file from ExternalStorage into a Blob for reliable playback
 */
export async function loadNativeFileAsBlob(relativePath: string): Promise<Blob | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const fileResult = await Filesystem.readFile({
      path: relativePath,
      directory: Directory.ExternalStorage,
    });
    if (fileResult.data) {
      const base64Data = fileResult.data as string;
      const lower = relativePath.toLowerCase();
      const mimeType = lower.endsWith('.flac')
        ? 'audio/flac'
        : lower.endsWith('.wav')
        ? 'audio/wav'
        : lower.endsWith('.m4a') || lower.endsWith('.aac')
        ? 'audio/mp4'
        : lower.endsWith('.ogg') || lower.endsWith('.opus')
        ? 'audio/ogg'
        : 'audio/mpeg';

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    }
  } catch (err) {
    console.warn(`Failed to read native file as base64 (${relativePath}):`, err);
  }
  return null;
}
