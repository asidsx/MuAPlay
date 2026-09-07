/**
 * MuAPlay Lossless & Cyberpunk Audio - Lyrics & Subtitles Service
 * Synchronized LRC Subtitle Parser, Online Auto-Fetcher (LRCLIB), Local File Importer, and Offset Sync
 */

export interface ParsedLyricLine {
  time: number; // in seconds
  text: string;
}

export interface ParsedLRC {
  lines: ParsedLyricLine[];
  hasTimestamps: boolean;
  offset: number; // seconds
}

export interface LyricSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  syncedLyrics?: string;
  plainLyrics?: string;
  instrumental?: boolean;
}

export interface FetchLyricsResult {
  lyrics: string;
  isSynced: boolean;
  source: string;
}

const LRCLIB_BASE_URL = 'https://lrclib.net/api';
const CACHE_PREFIX = 'muaplay_lrc_cache_';

/**
 * Clean track title by removing track numbers, extensions, and audio/video tags
 */
export function cleanTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  let cleaned = rawTitle;

  // Remove file extension
  cleaned = cleaned.replace(/\.(mp3|flac|wav|m4a|aac|ogg|opus|alac)$/i, '');

  // Remove leading track numbers: "01 - ", "01. ", "1-01 "
  cleaned = cleaned.replace(/^(\d{1,2}[\s.-]+)+/, '');

  // Remove common video/audio suffixes and metadata brackets
  cleaned = cleaned.replace(
    /\s*(\(|\[)(official\s*(music\s*)?video|video|audio|lyrics?|visualizer|remastered(\s*\d{4})?|deluxe|bonus\s*track|hd|4k|hq|radio\s*edit|extended\s*mix)(\)|\])/gi,
    ''
  );

  // Remove feat / ft patterns in title for cleaner search matching
  cleaned = cleaned.replace(/\s*(\(|\[)?(feat|ft)\.?\s+[^)\]]+(\)|\])?/gi, '');

  // Trim whitespace and special dashes
  cleaned = cleaned.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  return cleaned || rawTitle;
}

/**
 * Clean artist name
 */
export function cleanArtist(rawArtist: string): string {
  if (!rawArtist) return '';
  let cleaned = rawArtist;

  // Replace common multi-artist joins
  cleaned = cleaned.replace(/\s*(\/|&|feat\.?|ft\.?|,)\s+.*$/i, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned || rawArtist;
}

/**
 * Parse LRC text with timestamps [mm:ss.xx] into structured timeline
 */
export function parseLRC(lrcText: string): ParsedLRC {
  if (!lrcText || typeof lrcText !== 'string') {
    return { lines: [], hasTimestamps: false, offset: 0 };
  }

  const lines = lrcText.split('\n');
  const parsedLines: ParsedLyricLine[] = [];
  let fileOffset = 0; // in seconds

  const timestampRegex = /\[(\d{2,}):(\d{2})(?:[.:](\d{2,3}))?\]/g;
  const offsetRegex = /\[offset:\s*([+-]?\d+)\s*\]/i;

  let hasAnyTimestamps = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check for offset tag e.g. [offset:+500] (milliseconds)
    const offsetMatch = trimmed.match(offsetRegex);
    if (offsetMatch) {
      const ms = parseInt(offsetMatch[1], 10);
      if (!isNaN(ms)) {
        fileOffset = ms / 1000;
      }
      continue;
    }

    // Skip other metadata tags like [ar:...] [ti:...] [al:...]
    if (/^\[(ar|ti|al|by|re|ve|length):/i.test(trimmed)) {
      continue;
    }

    // Match all timestamps on the line (e.g. [00:12.30][01:14.20] text)
    const matches = Array.from(trimmed.matchAll(timestampRegex));

    if (matches.length > 0) {
      hasAnyTimestamps = true;
      const cleanLineText = trimmed.replace(timestampRegex, '').trim();

      for (const m of matches) {
        const min = parseInt(m[1], 10);
        const sec = parseInt(m[2], 10);
        let ms = 0;
        if (m[3]) {
          const rawMs = m[3];
          ms = rawMs.length === 2 ? parseInt(rawMs, 10) * 10 : parseInt(rawMs, 10);
        }
        const totalSec = min * 60 + sec + ms / 1000;

        parsedLines.push({
          time: Math.max(0, totalSec + fileOffset),
          text: cleanLineText,
        });
      }
    } else {
      // Line without timestamp (plain lyrics or unsynced)
      parsedLines.push({
        time: -1,
        text: trimmed,
      });
    }
  }

  if (hasAnyTimestamps) {
    // Keep lines that either have valid timestamp or are non-empty text
    // Sort lines chronologically
    const sorted = parsedLines
      .filter((l) => l.time >= 0)
      .sort((a, b) => a.time - b.time);

    return {
      lines: sorted,
      hasTimestamps: true,
      offset: fileOffset,
    };
  }

  // Plain lyrics without timestamps
  return {
    lines: parsedLines.filter((l) => l.text.length > 0),
    hasTimestamps: false,
    offset: 0,
  };
}

/**
 * Find index of the active lyric line for currentTime with user-applied offset
 */
export function getActiveLyricIndex(
  lines: ParsedLyricLine[],
  currentTime: number,
  manualOffsetSec: number = 0
): number {
  if (!lines || lines.length === 0) return -1;

  const adjustedTime = currentTime + manualOffsetSec;

  // Search forward for the latest line whose time <= adjustedTime
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= adjustedTime) {
      activeIndex = i;
    } else {
      break;
    }
  }

  return activeIndex;
}

/**
 * Build Cache Key
 */
function getCacheKey(artist: string, title: string): string {
  const norm = `${artist.toLowerCase().trim()}___${title.toLowerCase().trim()}`;
  return CACHE_PREFIX + norm.replace(/[^a-z0-9а-яё]/gi, '_');
}

/**
 * Fetch lyrics from LRCLIB API with multi-stage fallback
 */
export async function fetchLyricsOnline(params: {
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
}): Promise<FetchLyricsResult | null> {
  const { title, artist = '', album = '', duration } = params;

  if (!title) return null;

  const cleanT = cleanTitle(title);
  const cleanA = cleanArtist(artist);

  // Check cache
  const cacheKey = getCacheKey(cleanA, cleanT);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.lyrics) {
        return parsed;
      }
    }
  } catch {}

  // 1. Try exact match using /api/get
  try {
    const queryParams = new URLSearchParams();
    queryParams.set('track_name', cleanT);
    if (cleanA) queryParams.set('artist_name', cleanA);
    if (album) queryParams.set('album_name', album);
    if (duration && duration > 0) queryParams.set('duration', Math.round(duration).toString());

    const res = await fetch(`${LRCLIB_BASE_URL}/get?${queryParams.toString()}`, {
      headers: { 'User-Agent': 'MuAPlay-CyberAudio/1.0' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics) {
        const result: FetchLyricsResult = {
          lyrics: data.syncedLyrics,
          isSynced: true,
          source: 'LRCLIB (Синхронизированные LRC)',
        };
        saveToCache(cacheKey, result);
        return result;
      } else if (data.plainLyrics) {
        const result: FetchLyricsResult = {
          lyrics: data.plainLyrics,
          isSynced: false,
          source: 'LRCLIB (Текст)',
        };
        saveToCache(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('LRCLIB exact get attempt failed:', err);
  }

  // 2. Try search using /api/search with combined query
  try {
    const searchQuery = cleanA ? `${cleanA} ${cleanT}` : cleanT;
    const searchUrl = `${LRCLIB_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`;

    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'MuAPlay-CyberAudio/1.0' },
    });

    if (res.ok) {
      const items: LyricSearchResult[] = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        // Prioritize items with syncedLyrics
        const syncedItem = items.find((it) => !!it.syncedLyrics);
        if (syncedItem && syncedItem.syncedLyrics) {
          const result: FetchLyricsResult = {
            lyrics: syncedItem.syncedLyrics,
            isSynced: true,
            source: `LRCLIB: ${syncedItem.artistName} - ${syncedItem.trackName}`,
          };
          saveToCache(cacheKey, result);
          return result;
        }

        // Fallback to plain lyrics
        const plainItem = items.find((it) => !!it.plainLyrics);
        if (plainItem && plainItem.plainLyrics) {
          const result: FetchLyricsResult = {
            lyrics: plainItem.plainLyrics,
            isSynced: false,
            source: `LRCLIB: ${plainItem.artistName} - ${plainItem.trackName}`,
          };
          saveToCache(cacheKey, result);
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('LRCLIB search attempt failed:', err);
  }

  // 3. Last attempt: Search by title alone if artist had unusual prefixes
  if (cleanA) {
    try {
      const searchUrl = `${LRCLIB_BASE_URL}/search?q=${encodeURIComponent(cleanT)}`;
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'MuAPlay-CyberAudio/1.0' },
      });

      if (res.ok) {
        const items: LyricSearchResult[] = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          const syncedItem = items.find((it) => !!it.syncedLyrics);
          if (syncedItem?.syncedLyrics) {
            const result: FetchLyricsResult = {
              lyrics: syncedItem.syncedLyrics,
              isSynced: true,
              source: `LRCLIB: ${syncedItem.artistName} - ${syncedItem.trackName}`,
            };
            saveToCache(cacheKey, result);
            return result;
          }
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Manual search for custom search modal
 */
export async function searchLyricsOnline(query: string): Promise<LyricSearchResult[]> {
  if (!query || !query.trim()) return [];

  try {
    const res = await fetch(`${LRCLIB_BASE_URL}/search?q=${encodeURIComponent(query.trim())}`, {
      headers: { 'User-Agent': 'MuAPlay-CyberAudio/1.0' },
    });

    if (res.ok) {
      const items: LyricSearchResult[] = await res.json();
      return Array.isArray(items) ? items : [];
    }
  } catch (err) {
    console.error('searchLyricsOnline failed:', err);
  }
  return [];
}

/**
 * Read local .lrc or .txt file as string
 */
export function readLocalLrcFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      resolve(text || '');
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

function saveToCache(key: string, data: FetchLyricsResult) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}
