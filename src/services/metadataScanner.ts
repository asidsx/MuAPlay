import jsmediatags from 'jsmediatags';
import { Track, HiResInfo, AudioFormatType } from '../types/music';
import { DEFAULT_ALBUM_ARTS } from '../data/sampleTracks';

export const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  'mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg', 'oga', 'opus', 
  'alac', 'aiff', 'aif', 'wma', 'dsf', 'dff', 'ape', 'mpc', 
  'weba', 'mid', 'midi', 'm4b', 'caf'
]);

export const ACCEPT_AUDIO_INPUT_ATTR = 'audio/*';

/**
 * Strictly checks if a file is a valid audio file based on extension and MIME type.
 * Completely rejects PDFs, documents, archives, videos, executables, etc.
 */
export function isSupportedAudioFile(file: File | { name: string; type?: string }): boolean {
  if (!file || !file.name) return false;
  
  const name = file.name.trim();
  const lastDot = name.lastIndexOf('.');
  if (lastDot === -1) return false;

  const ext = name.substring(lastDot + 1).toLowerCase().trim();

  // Instant reject for known non-audio formats (PDF, DOC, ZIP, EXE, Images, etc.)
  const nonAudioExtensions = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'odt',
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso', 'dmg', 'apk', 'exe',
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'psd',
    'html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'csv',
    'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v'
  ];
  if (nonAudioExtensions.includes(ext)) {
    return false;
  }

  // Check valid audio extensions
  if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
    return true;
  }

  // Check MIME type if extension is uncommon but starts with audio/
  if (file.type && file.type.startsWith('audio/')) {
    return true;
  }

  return false;
}

export interface FilenameParsedInfo {
  title: string;
  artist: string;
  album?: string;
  trackNumber?: number;
}

/**
 * Checks if a title or artist string is a placeholder or generic tag
 */
export function isGenericPlaceholder(str?: string): boolean {
  if (!str) return true;
  const trimmed = str.trim().toLowerCase();
  if (trimmed.length === 0) return true;
  return (
    trimmed === 'unknown' ||
    trimmed === 'unknown artist' ||
    trimmed === 'unknown track' ||
    trimmed === 'неизвестный исполнитель' ||
    trimmed === 'исполнитель неизвестен' ||
    trimmed === 'неизвестный трек' ||
    trimmed === 'скачанный трек' ||
    trimmed === 'загрузки' ||
    trimmed === 'папка загрузки' ||
    trimmed === 'untitled' ||
    trimmed === 'track' ||
    trimmed === 'audio' ||
    /^track\s*\d*$/i.test(trimmed) ||
    /^audio\s*\d*$/i.test(trimmed) ||
    /^дорожка\s*\d*$/i.test(trimmed) ||
    /^трек\s*\d*$/i.test(trimmed)
  );
}

/**
 * Intelligently parses Artist, Title, Album and Track Number from audio file name
 * when metadata tags are missing or generic.
 * Examples:
 * - "Linkin Park - Numb.mp3" -> Artist: "Linkin Park", Title: "Numb"
 * - "01. Queen - Bohemian Rhapsody [320kbps].flac" -> Artist: "Queen", Title: "Bohemian Rhapsody"
 * - "The Weeknd - After Hours - 04 - Blinding Lights.flac" -> Artist: "The Weeknd", Album: "After Hours", Title: "Blinding Lights"
 * - "03 - Song Title.mp3" -> Title: "Song Title", Artist: "Неизвестный исполнитель"
 * - "Artist_Name_Track_Name.mp3" -> Artist: "Artist Name", Title: "Track Name"
 */
export function parseFilenameInfo(fileName: string): FilenameParsedInfo {
  // Strip file extension
  let clean = fileName.replace(/\.[^/.]+$/, '').trim();

  // Strip promotional/bitrate junk tags in brackets/parentheses
  clean = clean.replace(/\[(?:320\s*kbps|flac|mp3|wav|hq|lossless|remastered|official|vk\.com|zaycev|promodj|music|audio|cd).*?\]/gi, '');
  clean = clean.replace(/\((?:official\s*(?:video|audio|music\s*video|lyric\s*video)|lyric\s*video|audio\s*track|320\s*kbps|flac|hq|remastered\s*\d*).*?\)/gi, '');
  clean = clean.trim();

  // Strip leading track numbers like "01. ", "01 - ", "01_", "1. "
  let trackNumber: number | undefined;
  const trackNumMatch = clean.match(/^(\d{1,3})[\.\-_ ]\s*/);
  if (trackNumMatch) {
    trackNumber = parseInt(trackNumMatch[1], 10);
    clean = clean.substring(trackNumMatch[0].length).trim();
  }

  // Replace underscores with spaces if no dashes are present
  if (clean.includes('_') && !clean.includes(' - ') && !clean.includes(' — ') && !clean.includes(' – ')) {
    clean = clean.replace(/_/g, ' ').trim();
  }

  // Check for standard separators: " - ", " — ", " – "
  const separatorRegex = /\s+[\-\u2013\u2014]\s+/;
  if (separatorRegex.test(clean)) {
    const parts = clean.split(separatorRegex).map((p) => p.trim()).filter(Boolean);

    if (parts.length === 2) {
      // Artist - Title
      return {
        artist: parts[0],
        title: parts[1],
        trackNumber,
      };
    } else if (parts.length >= 3) {
      // Artist - Album - Title or Artist - TrackNum - Title
      const isPart1Num = /^\d+$/.test(parts[1]);
      if (isPart1Num) {
        return {
          artist: parts[0],
          title: parts.slice(2).join(' - '),
          trackNumber: parseInt(parts[1], 10),
        };
      }
      return {
        artist: parts[0],
        album: parts[1],
        title: parts.slice(2).join(' - '),
        trackNumber,
      };
    }
  }

  // Check for simple tight dash "Artist-Title" without spaces
  const tightDashMatch = clean.match(/^([A-Za-z0-9\u0400-\u04FF\s]+)-([A-Za-z0-9\u0400-\u04FF\s]+)$/);
  if (tightDashMatch && tightDashMatch[1].trim() && tightDashMatch[2].trim()) {
    return {
      artist: tightDashMatch[1].trim(),
      title: tightDashMatch[2].trim(),
      trackNumber,
    };
  }

  // Single string fallback: Title is the whole string, artist is unknown
  return {
    title: clean || fileName,
    artist: 'Неизвестный исполнитель',
    trackNumber,
  };
}

/**
 * Converts binary Uint8Array/ArrayBuffer to a durable Base64 Data URL
 * This ensures album art persists in localStorage & IndexedDB across reboots without expiring
 */
export function uint8ArrayToBase64DataUrl(bytes: Uint8Array, format = 'image/jpeg'): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return `data:${format};base64,${btoa(binary)}`;
}

/**
 * Reads tags using jsmediatags (ID3v1, ID3v2, MP4/AAC)
 */
async function readTagsWithJsmediatags(file: File): Promise<{
  title?: string;
  artist?: string;
  album?: string;
  lyrics?: string;
  year?: string;
  genre?: string;
  coverUrl?: string;
}> {
  return new Promise((resolve) => {
    try {
      (jsmediatags as any).read(file, {
        onSuccess: (tag: any) => {
          const tags = tag?.tags || {};
          let coverUrl: string | undefined;

          // Picture / Album Art (Convert to persistent base64 Data URL)
          if (tags.picture) {
            try {
              const { data, format } = tags.picture;
              const byteArray = new Uint8Array(data);
              coverUrl = uint8ArrayToBase64DataUrl(byteArray, format || 'image/jpeg');
            } catch {
              // Ignore image conversion error
            }
          }

          // Embedded Lyrics extraction (USLT, SYLT, lyrics atom)
          let lyrics: string | undefined;
          if (typeof tags.lyrics === 'string' && tags.lyrics.trim()) {
            lyrics = tags.lyrics.trim();
          } else if (tags.USLT) {
            const uslt = tags.USLT;
            if (typeof uslt === 'string' && uslt.trim()) {
              lyrics = uslt.trim();
            } else if (uslt?.data?.lyrics) {
              lyrics = String(uslt.data.lyrics).trim();
            } else if (uslt?.lyrics) {
              lyrics = String(uslt.lyrics).trim();
            }
          } else if (tags.SYLT) {
            const sylt = tags.SYLT;
            if (sylt?.data?.lyrics) {
              lyrics = String(sylt.data.lyrics).trim();
            }
          }

          // Search any frame for lyrics text if still empty
          if (!lyrics) {
            for (const key of Object.keys(tags)) {
              if (key.startsWith('USLT') || key.toLowerCase().includes('lyric')) {
                const val = tags[key];
                if (typeof val === 'string' && val.trim()) {
                  lyrics = val.trim();
                  break;
                } else if (val?.data?.lyrics) {
                  lyrics = String(val.data.lyrics).trim();
                  break;
                }
              }
            }
          }

          resolve({
            title: tags.title ? String(tags.title).trim() : undefined,
            artist: tags.artist ? String(tags.artist).trim() : undefined,
            album: tags.album ? String(tags.album).trim() : undefined,
            lyrics,
            year: tags.year ? String(tags.year).trim() : undefined,
            genre: tags.genre ? String(tags.genre).trim() : undefined,
            coverUrl,
          });
        },
        onError: () => {
          resolve({});
        },
      });
    } catch {
      resolve({});
    }
  });
}

/**
 * Parses FLAC Vorbis Comments and Picture metadata directly from ArrayBuffer
 */
async function readFlacVorbisMetadata(file: File): Promise<{
  title?: string;
  artist?: string;
  album?: string;
  lyrics?: string;
  coverUrl?: string;
}> {
  try {
    const sliceSize = Math.min(file.size, 512 * 1024);
    const buffer = await file.slice(0, sliceSize).arrayBuffer();
    const dataView = new DataView(buffer);

    // Verify "fLaC" magic marker
    if (
      dataView.getUint8(0) !== 0x66 ||
      dataView.getUint8(1) !== 0x4c ||
      dataView.getUint8(2) !== 0x61 ||
      dataView.getUint8(3) !== 0x43
    ) {
      return {};
    }

    let offset = 4;
    let isLast = false;
    let title: string | undefined;
    let artist: string | undefined;
    let album: string | undefined;
    let lyrics: string | undefined;
    let coverUrl: string | undefined;

    const decoder = new TextDecoder('utf-8');

    while (offset + 4 <= buffer.byteLength && !isLast) {
      const header = dataView.getUint32(offset);
      isLast = (header & 0x80000000) !== 0;
      const blockType = (header >> 24) & 0x7f;
      const blockLength = header & 0x00ffffff;
      offset += 4;

      if (offset + blockLength > buffer.byteLength) break;

      // Block Type 4 = VORBIS_COMMENT
      if (blockType === 4 && blockLength > 8) {
        let commentOffset = offset;
        const vendorLength = dataView.getUint32(commentOffset, true);
        commentOffset += 4 + vendorLength;

        if (commentOffset + 4 <= offset + blockLength) {
          const userCommentCount = dataView.getUint32(commentOffset, true);
          commentOffset += 4;

          for (let i = 0; i < userCommentCount && commentOffset < offset + blockLength; i++) {
            const commentLength = dataView.getUint32(commentOffset, true);
            commentOffset += 4;
            if (commentOffset + commentLength <= offset + blockLength) {
              const commentBytes = new Uint8Array(buffer, commentOffset, commentLength);
              const commentStr = decoder.decode(commentBytes);
              commentOffset += commentLength;

              const eqIdx = commentStr.indexOf('=');
              if (eqIdx > 0) {
                const key = commentStr.substring(0, eqIdx).toUpperCase();
                const val = commentStr.substring(eqIdx + 1).trim();
                if (key === 'TITLE' && !title) title = val;
                else if (key === 'ARTIST' && !artist) artist = val;
                else if (key === 'ALBUM' && !album) album = val;
                else if ((key === 'LYRICS' || key === 'UNSYNCEDLYRICS') && !lyrics) lyrics = val;
              }
            } else {
              break;
            }
          }
        }
      } else if (blockType === 6 && !coverUrl) {
        // Block Type 6 = PICTURE
        try {
          let picOffset = offset;
          picOffset += 4; // picture type
          const mimeLen = dataView.getUint32(picOffset);
          picOffset += 4;
          const mime = decoder.decode(new Uint8Array(buffer, picOffset, mimeLen));
          picOffset += mimeLen;
          const descLen = dataView.getUint32(picOffset);
          picOffset += 4 + descLen;
          picOffset += 16; // width, height, color depth, colors
          const dataLen = dataView.getUint32(picOffset);
          picOffset += 4;

          if (picOffset + dataLen <= buffer.byteLength) {
            const imgBytes = new Uint8Array(buffer, picOffset, dataLen);
            coverUrl = uint8ArrayToBase64DataUrl(imgBytes, mime || 'image/jpeg');
          }
        } catch {
          // Ignore picture parsing failure
        }
      }

      offset += blockLength;
    }

    return { title, artist, album, lyrics, coverUrl };
  } catch {
    return {};
  }
}

/**
 * Accurately measures audio duration via browser Audio metadata
 */
function probeAudioDuration(fileUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    const timer = setTimeout(() => resolve(180), 3000);

    audio.onloadedmetadata = () => {
      clearTimeout(timer);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        resolve(Math.round(audio.duration));
      } else {
        resolve(180);
      }
    };

    audio.onerror = () => {
      clearTimeout(timer);
      resolve(180);
    };

    audio.src = fileUrl;
  });
}

/**
 * Main audio metadata extractor:
 * 1. Checks embedded tags (ID3, Vorbis, MP4) for Title, Artist, Album, Cover Art, and Lyrics.
 * 2. If metadata fields are absent or generic, seamlessly falls back to smart filename parsing.
 */
export async function parseAudioFileMetadata(file: File): Promise<Partial<Track>> {
  if (!isSupportedAudioFile(file)) {
    throw new Error(`Файл «${file.name}» не является поддерживаемым аудиофайлом.`);
  }

  const fileUrl = URL.createObjectURL(file);
  const ext = file.name.split('.').pop()?.toUpperCase() as AudioFormatType || 'MP3';

  const sizeMb = file.size / (1024 * 1024);
  const isFlacWav = ext === 'FLAC' || ext === 'WAV' || ext === 'ALAC';
  const isLossless = isFlacWav || ext === 'OPUS';

  let sampleRate = 44100;
  let bitDepth = 16;
  let bitrateKbps = Math.round((file.size * 8) / (180 * 1000));

  if (ext === 'FLAC' || ext === 'WAV') {
    sampleRate = sizeMb > 40 ? 192000 : 96000;
    bitDepth = 24;
    bitrateKbps = Math.round((sampleRate * bitDepth * 2) / 1000);
  } else if (ext === 'MP3') {
    bitrateKbps = 320;
  }

  const hiResInfo: HiResInfo = {
    format: ext,
    bitDepth,
    sampleRate,
    bitrateKbps: Math.max(128, bitrateKbps),
    isLossless,
  };

  // Step 1: Parse from filename as foundational baseline
  const fnInfo = parseFilenameInfo(file.name);

  // Step 2: Extract embedded metadata tags
  let tagTitle: string | undefined;
  let tagArtist: string | undefined;
  let tagAlbum: string | undefined;
  let tagLyrics: string | undefined;
  let tagCoverUrl: string | undefined;
  let tagYear: string | undefined;
  let tagGenre: string | undefined;

  // Run FLAC Vorbis reader if flac
  if (ext === 'FLAC') {
    const vorbis = await readFlacVorbisMetadata(file);
    if (vorbis.title) tagTitle = vorbis.title;
    if (vorbis.artist) tagArtist = vorbis.artist;
    if (vorbis.album) tagAlbum = vorbis.album;
    if (vorbis.lyrics) tagLyrics = vorbis.lyrics;
    if (vorbis.coverUrl) tagCoverUrl = vorbis.coverUrl;
  }

  // Run jsmediatags for ID3 / MP4
  const jsTags = await readTagsWithJsmediatags(file);
  if (!tagTitle && jsTags.title) tagTitle = jsTags.title;
  if (!tagArtist && jsTags.artist) tagArtist = jsTags.artist;
  if (!tagAlbum && jsTags.album) tagAlbum = jsTags.album;
  if (!tagLyrics && jsTags.lyrics) tagLyrics = jsTags.lyrics;
  if (!tagCoverUrl && jsTags.coverUrl) tagCoverUrl = jsTags.coverUrl;
  if (jsTags.year) tagYear = jsTags.year;
  if (jsTags.genre) tagGenre = jsTags.genre;

  // Step 3: Prioritize Metadata -> Fallback to Filename
  const finalTitle = tagTitle && !isGenericPlaceholder(tagTitle) ? tagTitle : fnInfo.title;
  const finalArtist = tagArtist && !isGenericPlaceholder(tagArtist) ? tagArtist : fnInfo.artist;
  const finalAlbum = tagAlbum && !isGenericPlaceholder(tagAlbum) ? tagAlbum : (fnInfo.album || 'Локальный альбом');
  const finalLyrics = tagLyrics && tagLyrics.trim() ? tagLyrics.trim() : undefined;
  const finalCover = tagCoverUrl || getRandomFallbackCover(finalArtist + ' ' + finalTitle);

  // Measure actual duration
  const realDuration = await probeAudioDuration(fileUrl);

  if (realDuration > 0 && file.size > 0) {
    const computedBitrate = Math.round((file.size * 8) / (realDuration * 1000));
    if (computedBitrate > 32 && computedBitrate < 30000) {
      hiResInfo.bitrateKbps = computedBitrate;
    }
  }

  return {
    title: finalTitle,
    artist: finalArtist,
    album: finalAlbum,
    lyrics: finalLyrics,
    duration: realDuration,
    url: fileUrl,
    coverUrl: finalCover,
    filePath: `/storage/emulated/0/Download/${file.name}`,
    fileSize: `${sizeMb.toFixed(2)} MB`,
    hiResInfo,
    year: tagYear || '2026',
    genre: tagGenre || 'Hi-Res Audio',
  };
}

export function getRandomFallbackCover(seedStr: string): string {
  const arts = [
    DEFAULT_ALBUM_ARTS.synthwave,
    DEFAULT_ALBUM_ARTS.neon,
    DEFAULT_ALBUM_ARTS.cyber,
    DEFAULT_ALBUM_ARTS.classical,
    DEFAULT_ALBUM_ARTS.jazz,
    DEFAULT_ALBUM_ARTS.ambient,
  ];
  let charCodeSum = 0;
  for (let i = 0; i < seedStr.length; i++) {
    charCodeSum += seedStr.charCodeAt(i);
  }
  return arts[charCodeSum % arts.length];
}

/**
 * Automatically fetch missing album art using server route / iTunes API
 */
export async function fetchMissingAlbumArt(artist: string, title: string, album?: string): Promise<string> {
  try {
    const res = await fetch('/api/cover-art', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist, title, album }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.coverUrl) return data.coverUrl;
    }
  } catch {
    // Fallback
  }

  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
      }
    }
  } catch {
    // Fallback
  }

  return getRandomFallbackCover(artist + title);
}
