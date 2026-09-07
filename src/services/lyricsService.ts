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
  artistName?: string;
  trackName?: string;
  matchScore?: number;
}

const LRCLIB_BASE_URL = 'https://lrclib.net/api';
const CACHE_PREFIX = 'muaplay_lrc_v3_cache_';

// Purge any legacy unverified cache entries on module load to clear old bad matches
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('muaplay_lrc_cache_') || key.startsWith('muaplay_lrc_v2_cache_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
} catch {}

/**
 * Split multi-artist strings into individual artist names
 * e.g. "bulletrain/skyfall beats // burn" -> ["bulletrain", "skyfall beats", "bulletrain/skyfall beats"]
 */
export function splitArtistVariants(rawArtist: string): string[] {
  if (!rawArtist) return [];
  const cleaned = rawArtist
    .replace(/\s*\/\/\s*.*$/, '') // remove trailing "// title" suffixes
    .trim();

  const variants = new Set<string>();
  if (cleaned) variants.add(cleaned.toLowerCase());

  // Split by common separators: /, &, feat, ft., +, vs, x, comma
  const parts = cleaned
    .split(/\s*(?:\/|&|feat\.?|ft\.?|\+|\bvs\.?\b|\bx\b|,)\s*/i)
    .map((p) => p.replace(/[()\[\]]/g, '').trim().toLowerCase())
    .filter((p) => p.length >= 2 && !['unknown', 'various', 'artist', 'prod', 'remix'].includes(p));

  parts.forEach((p) => variants.add(p));
  return Array.from(variants);
}

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
    /\s*(\(|\[)(official\s*(music\s*)?video|video|audio|lyrics?|visualizer|remastered(\s*\d{4})?|deluxe|bonus\s*track|hd|4k|hq|radio\s*edit|extended\s*mix|prod\.?\s*by\s*[^)\]]+)(\)|\])/gi,
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

  // Remove trailing // title suffix
  cleaned = cleaned.replace(/\s*\/\/\s*.*$/, '');

  // Replace common multi-artist joins
  cleaned = cleaned.replace(/\s*(?:\/|&|feat\.?|ft\.?|,)\s+.*$/i, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned || rawArtist;
}

/**
 * Strict Multi-Factor Anti-Mismatch Scorer
 * Prevents attaching lyrics from different artists (e.g. Zach Bryan for bulletrain's "burn")
 */
export function calculateMatchScore(
  target: { title: string; artist?: string; duration?: number },
  candidate: LyricSearchResult
): { score: number; isAcceptable: boolean; reason: string } {
  if (candidate.instrumental && !candidate.syncedLyrics && !candidate.plainLyrics) {
    return { score: 0, isAcceptable: false, reason: 'Инструментальный трек без лирики' };
  }

  const targetTitleNorm = cleanTitle(target.title).toLowerCase().trim();
  const candidateTitleNorm = cleanTitle(candidate.trackName || '').toLowerCase().trim();

  const targetArtist = target.artist?.trim() || '';
  const isGenericArtist =
    !targetArtist ||
    /^(unknown|unknown artist|неизвестный|неизвестный исполнитель)$/i.test(targetArtist);

  const candidateArtistNorm = (candidate.artistName || '').toLowerCase().trim();
  const artistVariants = splitArtistVariants(targetArtist);

  // 1. ARTIST VALIDATION (Crucial: prevents completely unrelated songs from matching)
  let artistScore = 0;
  if (!isGenericArtist && artistVariants.length > 0) {
    let bestArtistMatch = 0;
    for (const v of artistVariants) {
      if (candidateArtistNorm === v) {
        bestArtistMatch = Math.max(bestArtistMatch, 45); // Exact artist match
      } else if (candidateArtistNorm.includes(v) || v.includes(candidateArtistNorm)) {
        bestArtistMatch = Math.max(bestArtistMatch, 38); // Substring match
      } else {
        // Token overlap check
        const candTokens = candidateArtistNorm.split(/\s+/).filter((w) => w.length >= 3);
        const varTokens = v.split(/\s+/).filter((w) => w.length >= 3);
        const hasCommonToken = candTokens.some((ct) => varTokens.includes(ct));
        if (hasCommonToken) {
          bestArtistMatch = Math.max(bestArtistMatch, 30);
        }
      }
    }

    if (bestArtistMatch === 0) {
      // Hard rejection: target artist is known, but candidate artist is completely different!
      return {
        score: 0,
        isAcceptable: false,
        reason: `Несовпадение исполнителя: "${candidate.artistName}" ≠ "${target.artist}"`,
      };
    }
    artistScore = bestArtistMatch;
  } else {
    // If target artist was unknown, give neutral artist score
    artistScore = 20;
  }

  // 2. TITLE VALIDATION
  let titleScore = 0;
  if (targetTitleNorm === candidateTitleNorm) {
    titleScore = 45; // Exact title match
  } else if (
    candidateTitleNorm.startsWith(targetTitleNorm) ||
    targetTitleNorm.startsWith(candidateTitleNorm)
  ) {
    titleScore = 35;
  } else if (candidateTitleNorm.includes(targetTitleNorm)) {
    // Penalize if candidate title has many extra words compared to a 1-word target
    const targetWords = targetTitleNorm.split(/\s+/).filter(Boolean);
    const candWords = candidateTitleNorm.split(/\s+/).filter(Boolean);
    if (targetWords.length === 1 && candWords.length > 2) {
      // e.g. "burn" vs "Burn, Burn, Burn" or "Burn It Down"
      titleScore = 20;
    } else {
      titleScore = 30;
    }
  } else {
    return {
      score: 0,
      isAcceptable: false,
      reason: `Несовпадение названия: "${candidate.trackName}" ≠ "${target.title}"`,
    };
  }

  // 3. DURATION VALIDATION (if both durations are available)
  let durationScore = 0;
  if (target.duration && target.duration > 15 && candidate.duration && candidate.duration > 15) {
    const diff = Math.abs(target.duration - candidate.duration);
    if (diff <= 3) {
      durationScore = 10;
    } else if (diff <= 8) {
      durationScore = 7;
    } else if (diff <= 15) {
      durationScore = 3;
    } else if (diff > 25) {
      // High duration mismatch
      durationScore = -20;
    }
  }

  const totalScore = Math.max(0, artistScore + titleScore + durationScore);

  // Strict acceptance criteria:
  // Must have matched title and (if artist is known) matched artist
  const isAcceptable =
    totalScore >= 60 &&
    titleScore >= 30 &&
    (isGenericArtist ? durationScore >= 3 : artistScore >= 30);

  return {
    score: totalScore,
    isAcceptable,
    reason: isAcceptable
      ? `Надежное совпадение (${totalScore}%)`
      : `Низкая уверенность (${totalScore}%): возможно, трек другой версии`,
  };
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
 * Clear cached lyrics for a track
 */
export function clearLyricsCache(title: string, artist?: string) {
  const cleanT = cleanTitle(title);
  const cleanA = cleanArtist(artist || '');
  const cacheKey = getCacheKey(cleanA, cleanT);
  try {
    localStorage.removeItem(cacheKey);
  } catch {}
}

/**
 * Fetch lyrics from LRCLIB API with strict multi-factor anti-mismatch verification
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
  const artistVariants = splitArtistVariants(artist);

  // Check cache
  const cacheKey = getCacheKey(cleanA, cleanT);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.lyrics) {
        // Double check cache validity: if artist was specified, check it didn't cache a mismatched artist
        if (cleanA && parsed.artistName) {
          const matchCheck = calculateMatchScore(
            { title: cleanT, artist: cleanA, duration },
            {
              id: 0,
              trackName: parsed.trackName || cleanT,
              artistName: parsed.artistName,
              duration: duration,
            }
          );
          if (matchCheck.isAcceptable) {
            return parsed;
          } else {
            // Bad legacy cache! Remove it
            localStorage.removeItem(cacheKey);
          }
        } else {
          return parsed;
        }
      }
    }
  } catch {}

  const candidates: LyricSearchResult[] = [];

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
      const data: LyricSearchResult = await res.json();
      if (data && (data.syncedLyrics || data.plainLyrics)) {
        const match = calculateMatchScore({ title: cleanT, artist: cleanA, duration }, data);
        if (match.isAcceptable) {
          const result: FetchLyricsResult = {
            lyrics: data.syncedLyrics || data.plainLyrics!,
            isSynced: Boolean(data.syncedLyrics),
            source: `LRCLIB: ${data.artistName} - ${data.trackName}`,
            artistName: data.artistName,
            trackName: data.trackName,
            matchScore: match.score,
          };
          saveToCache(cacheKey, result);
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('LRCLIB exact get attempt failed:', err);
  }

  // Helper to query and collect candidates
  const executeSearch = async (query: string) => {
    try {
      const res = await fetch(`${LRCLIB_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': 'MuAPlay-CyberAudio/1.0' },
      });
      if (res.ok) {
        const items: LyricSearchResult[] = await res.json();
        if (Array.isArray(items)) {
          for (const it of items) {
            if (!candidates.some((c) => c.id === it.id)) {
              candidates.push(it);
            }
          }
        }
      }
    } catch {}
  };

  // 2. Try primary search: clean artist + clean title
  const primaryQuery = cleanA ? `${cleanA} ${cleanT}` : cleanT;
  await executeSearch(primaryQuery);

  // 3. If no acceptable candidate yet and there are alternative artist variants, try each
  if (artistVariants.length > 1) {
    for (const variant of artistVariants) {
      if (variant !== cleanA.toLowerCase()) {
        await executeSearch(`${variant} ${cleanT}`);
      }
    }
  }

  // 4. Evaluate and rank all candidate results
  interface ScoredCandidate {
    item: LyricSearchResult;
    score: number;
    hasSynced: boolean;
  }

  const scoredCandidates: ScoredCandidate[] = [];

  for (const item of candidates) {
    if (!item.syncedLyrics && !item.plainLyrics) continue;
    const match = calculateMatchScore({ title: cleanT, artist: cleanA, duration }, item);
    if (match.isAcceptable) {
      scoredCandidates.push({
        item,
        score: match.score + (item.syncedLyrics ? 10 : 0), // Slight bonus for synchronized lyrics
        hasSynced: Boolean(item.syncedLyrics),
      });
    }
  }

  if (scoredCandidates.length > 0) {
    // Pick the highest scoring verified candidate
    scoredCandidates.sort((a, b) => b.score - a.score);
    const best = scoredCandidates[0];

    const result: FetchLyricsResult = {
      lyrics: best.item.syncedLyrics || best.item.plainLyrics!,
      isSynced: best.hasSynced,
      source: `LRCLIB: ${best.item.artistName} - ${best.item.trackName}`,
      artistName: best.item.artistName,
      trackName: best.item.trackName,
      matchScore: best.score,
    };
    saveToCache(cacheKey, result);
    return result;
  }

  // 5. DO NOT fallback to blind title search when artist is known!
  // It is vastly better to report "Лирика не найдена" than to show completely wrong lyrics.
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
