/**
 * Playlist M3U / M3U8 & Library Backup Exporter / Importer
 */
import { Playlist, Track } from '../types/music';

/**
 * Generate standard M3U / M3U8 playlist string
 */
export function generateM3U(playlist: Playlist, tracks: Track[]): string {
  const playlistTracks = playlist.trackIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter((t): t is Track => t !== undefined);

  let output = '#EXTM3U\n';
  output += `#PLAYLIST:${playlist.name}\n\n`;

  playlistTracks.forEach((t) => {
    const duration = Math.round(t.duration || 0);
    output += `#EXTINF:${duration},${t.artist} - ${t.title}\n`;
    // Use filePath if available, or title/url
    output += `${t.filePath || t.title + '.' + t.hiResInfo.format.toLowerCase()}\n`;
  });

  return output;
}

/**
 * Trigger download of M3U file in the browser
 */
export function downloadM3UFile(playlist: Playlist, tracks: Track[]) {
  const content = generateM3U(playlist, tracks);
  const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeName = playlist.name.replace(/[^a-zA-Z0-9_\-\u0400-\u04FF]/g, '_');
  a.download = `${safeName}.m3u8`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Parse an imported M3U / M3U8 string
 */
export function parseM3U(content: string): { name: string; entries: { duration?: number; artist?: string; title: string; filename: string }[] } {
  const lines = content.split(/\r?\n/);
  let playlistName = 'Импортированный плейлист';
  const entries: { duration?: number; artist?: string; title: string; filename: string }[] = [];

  let currentDuration: number | undefined;
  let currentArtist: string | undefined;
  let currentTitle: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('#PLAYLIST:')) {
      playlistName = trimmed.replace('#PLAYLIST:', '').trim() || playlistName;
      continue;
    }

    if (trimmed.startsWith('#EXTINF:')) {
      // Format: #EXTINF:seconds,Artist - Title or #EXTINF:seconds,Title
      const match = trimmed.match(/^#EXTINF:(-?\d+),(.*)$/);
      if (match) {
        currentDuration = parseInt(match[1], 10);
        const rawName = match[2].trim();
        if (rawName.includes(' - ')) {
          const parts = rawName.split(' - ');
          currentArtist = parts[0].trim();
          currentTitle = parts.slice(1).join(' - ').trim();
        } else {
          currentTitle = rawName;
        }
      }
      continue;
    }

    if (trimmed.startsWith('#')) {
      // Other comments
      continue;
    }

    // Path / filename line
    const filename = trimmed;
    const title = currentTitle || filename.replace(/\.[^/.]+$/, '').split(/[\\/]/).pop() || filename;
    entries.push({
      duration: currentDuration,
      artist: currentArtist,
      title,
      filename,
    });

    currentDuration = undefined;
    currentArtist = undefined;
    currentTitle = undefined;
  }

  return { name: playlistName, entries };
}

/**
 * Export full library backup (JSON)
 */
export function downloadLibraryBackup(tracks: Track[], playlists: Playlist[]) {
  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    tracksCount: tracks.length,
    playlistsCount: playlists.length,
    tracks: tracks.map((t) => ({
      ...t,
      // exclude huge local object URLs, keep metadata
      url: t.url.startsWith('blob:') ? '' : t.url,
    })),
    playlists,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MUAPLAY_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
