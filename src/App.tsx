/**
 * Android Hi-Res Music Player
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Disc3,
  FolderDown,
  Sliders,
  Heart,
  Search,
  Play,
  Pause,
  Plus,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Trash2,
  MoreVertical,
  ShieldCheck,
  Disc,
  FileText,
} from 'lucide-react';
import { Track, Playlist, ScannedFile } from './types/music';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS, DOWNLOADS_FOLDER_FILES } from './data/sampleTracks';
import { audioEngine } from './services/audioEngine';
import { parseAudioFileMetadata, fetchMissingAlbumArt } from './services/metadataScanner';
import { fetchLyricsOnline } from './services/lyricsService';
import { saveAudioBlob, getAudioBlobUrl, deleteAudioBlob } from './services/audioStorage';
import { prefetchTrackWaveform } from './services/waveformService';
import { generateSyntheticAudioBlob } from './utils/audioGenerator';
import { scanNativeDownloadDirectory, loadNativeFileAsBlob } from './services/nativeScanner';
import { AndroidFrame } from './components/AndroidFrame';
import { Navigation, TabType } from './components/Navigation';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlayingModal } from './components/NowPlayingModal';
import { PlaylistView } from './components/PlaylistView';
import { DownloadsScanner } from './components/DownloadsScanner';
import { EqualizerView } from './components/EqualizerView';
import { CyberLockscreen } from './components/CyberLockscreen';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('tracks');
  const [isLockscreenOpen, setIsLockscreenOpen] = useState<boolean>(false);

  // Media Data State (starts 100% clean without demo tracks)
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('android_music_tracks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean out legacy demo track IDs if present
        return parsed.filter((t: Track) => !t.id.startsWith('track-') || t.id.startsWith('track-upload-') || t.id.length > 15);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('android_music_playlists');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [downloadFiles, setDownloadFiles] = useState<ScannedFile[]>([]);

  // Player State
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(184);
  const [volume, setVolume] = useState<number>(0.8);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  // Modals
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [isScanningDownloads, setIsScanningDownloads] = useState<boolean>(false);
  const [isFetchingCovers, setIsFetchingCovers] = useState<boolean>(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist State to LocalStorage
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('android_music_tracks', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem('android_music_playlists', JSON.stringify(playlists));
  }, [playlists]);

  const currentTrack = tracks.find((t) => t.id === currentTrackId) || tracks[0] || null;

  // Audio Playback Listener Sync
  useEffect(() => {
    audioEngine.init();
    const audio = audioEngine.getAudioElement();
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 180);
    const handleEnded = () => {
      if (isRepeat && currentTrack) {
        audioEngine.seek(0);
        audioEngine.resumeTrack();
      } else {
        handleNextTrack();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackId, isRepeat, isShuffle, currentTrack]);

  // Audio Controls
  const getPlayableUrl = async (track: Track): Promise<string | null> => {
    // 1. Try retrieving stored Blob URL from IndexedDB
    const storedUrl = await getAudioBlobUrl(track.id);
    if (storedUrl) return storedUrl;

    // 2. Try loading native Android file if present
    if (track.filePath) {
      const nativeBlob = await loadNativeFileAsBlob(track.filePath);
      if (nativeBlob) {
        await saveAudioBlob(track.id, nativeBlob);
        const url = URL.createObjectURL(nativeBlob);
        return url;
      }
    }

    // 3. Check if track.url is active or valid
    if (track.url && track.url.startsWith('blob:')) {
      try {
        const check = await fetch(track.url, { method: 'HEAD' });
        if (check.ok) return track.url;
      } catch {
        // Blob expired
      }
    } else if (track.url && (track.url.startsWith('http://') || track.url.startsWith('https://'))) {
      return track.url;
    }

    // Return null if file is unreachable or broken
    return null;
  };

  const handlePlayTrack = async (track: Track) => {
    // If the user tapped on the currently loaded track, toggle play/pause instead of restarting
    if (currentTrackId === track.id) {
      handleTogglePlayPause();
      return;
    }

    setCurrentTrackId(track.id);
    prefetchTrackWaveform(track);

    const playUrl = await getPlayableUrl(track);
    if (!playUrl) {
      setIsPlaying(false);
      alert(`Аудиофайл «${track.title}» недоступен или ссылку невозможно открыть. Вы можете удалить его из медиатеки.`);
      return;
    }

    setIsPlaying(true);
    const fallbackGen = () => generateSyntheticAudioBlob('synthwave', track.duration || 180);
    audioEngine.playTrack(playUrl, track.id, fallbackGen, true);
  };

  const handleDeleteTrack = async (trackId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    await deleteAudioBlob(trackId);

    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setPlaylists((prev) =>
      prev.map((pl) => ({
        ...pl,
        trackIds: pl.trackIds.filter((id) => id !== trackId),
      }))
    );

    if (currentTrackId === trackId) {
      audioEngine.pauseTrack();
      setIsPlaying(false);
      setCurrentTrackId(null);
    }
  };

  const handleClearAllTracks = async () => {
    if (window.confirm('Очистить весь список и удалить все треки из медиатеки?')) {
      for (const t of tracks) {
        await deleteAudioBlob(t.id);
      }
      setTracks([]);
      setPlaylists((prev) => prev.map((pl) => ({ ...pl, trackIds: [] })));
      audioEngine.pauseTrack();
      setIsPlaying(false);
      setCurrentTrackId(null);
    }
  };

  const handleTogglePlayPause = async () => {
    if (!currentTrack) return;
    if (isPlaying) {
      setIsPlaying(false);
      audioEngine.pauseTrack();
    } else {
      setIsPlaying(true);
      const audio = audioEngine.getAudioElement();
      // If the current track is already loaded in the audio element and not ended, resume from current position
      if (audioEngine.currentTrackId === currentTrack.id && audio?.src && !audio.ended) {
        audioEngine.resumeTrack();
        return;
      }

      const playUrl = await getPlayableUrl(currentTrack);
      if (playUrl) {
        const fallbackGen = () => generateSyntheticAudioBlob('synthwave', currentTrack.duration || 180);
        audioEngine.playTrack(playUrl, currentTrack.id, fallbackGen);
      }
    }
  };

  const handleNextTrack = () => {
    if (tracks.length === 0) return;
    let nextIndex = 0;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrackId);

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }

    const nextTrack = tracks[nextIndex];
    if (nextTrack) {
      handlePlayTrack(nextTrack);
    }
  };

  const handlePrevTrack = () => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrackId);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const prevTrack = tracks[prevIndex];
    if (prevTrack) {
      handlePlayTrack(prevTrack);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
  };

  const handleToggleFavorite = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  // Real Android Smartphone OS Lockscreen Media Notification (MediaSession API)
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Cyberpunk Audio',
        artwork: [
          {
            src: currentTrack.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=512&auto=format&fit=crop&q=80',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        handleTogglePlayPause();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        handleTogglePlayPause();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNextTrack();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlePrevTrack();
      });
      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            handleSeek(details.seekTime);
          }
        });
      } catch {}
    }
  }, [currentTrack]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      if ('setPositionState' in navigator.mediaSession && duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(duration, 0),
            playbackRate: 1,
            position: Math.min(Math.max(currentTime, 0), duration),
          });
        } catch {}
      }
    }

    // Sync with Native Android Foreground Service Notification (for lockscreen media controls)
    try {
      if (currentTrack && (window as any).NativeAudioBridge?.updateMedia) {
        (window as any).NativeAudioBridge.updateMedia(
          currentTrack.title,
          currentTrack.artist,
          currentTrack.album || 'MuAPlay Lossless',
          isPlaying,
          Math.floor(duration || 180),
          Math.floor(currentTime || 0)
        );
      }
    } catch {}
  }, [isPlaying, currentTime, duration, currentTrack]);

  // Handle incoming native Android lockscreen & notification media actions
  useEffect(() => {
    const handleNativeAction = (event: any) => {
      let action = '';
      if (typeof event.detail === 'string') {
        try {
          const parsed = JSON.parse(event.detail);
          action = parsed.action || '';
        } catch {
          action = event.detail;
        }
      } else if (event.detail && event.detail.action) {
        action = event.detail.action;
      } else if (event.action) {
        action = event.action;
      }

      if (!action) return;

      if (action === 'play') {
        if (!isPlaying) handleTogglePlayPause();
      } else if (action === 'pause') {
        if (isPlaying) handleTogglePlayPause();
      } else if (action === 'toggle') {
        handleTogglePlayPause();
      } else if (action === 'next') {
        handleNextTrack();
      } else if (action === 'prev') {
        handlePrevTrack();
      } else if (action.startsWith('seek:')) {
        const seekMs = parseFloat(action.split(':')[1]);
        if (!isNaN(seekMs)) {
          handleSeek(seekMs / 1000);
        }
      }
    };

    window.addEventListener('muaplayAudioAction', handleNativeAction);
    return () => {
      window.removeEventListener('muaplayAudioAction', handleNativeAction);
    };
  }, [isPlaying, handleTogglePlayPause, handleNextTrack, handlePrevTrack, handleSeek]);

  // Playlists Management
  const handleCreatePlaylist = (name: string, description: string) => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      description,
      coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
      trackIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  // Add tracks to playlist (Called from AddTracksToPlaylistModal)
  const handleAddTracksToPlaylist = (playlistId: string, selectedFiles: ScannedFile[]) => {
    // 1. Ensure all selected files exist in `tracks` library
    const newTracksToAdd: Track[] = [];

    selectedFiles.forEach((file) => {
      let existing = tracks.find((t) => t.filePath === file.path || t.title === file.title);
      if (!existing) {
        existing = {
          id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: file.title || file.name,
          artist: file.artist || 'Неизвестный исполнитель',
          album: file.album || 'Папка Загрузки',
          duration: file.durationSec,
          url: file.previewUrl,
          coverUrl: file.coverUrl,
          filePath: file.path,
          fileSize: file.size,
          hiResInfo: file.hiResInfo,
          year: '2026',
          genre: 'Local',
          isFavorite: false,
          addedAt: Date.now(),
        };
        newTracksToAdd.push(existing);
      }
    });

    if (newTracksToAdd.length > 0) {
      setTracks((prev) => [...prev, ...newTracksToAdd]);
    }

    // 2. Map track IDs to the playlist
    const addedTrackIds = selectedFiles.map((file) => {
      const match = [...tracks, ...newTracksToAdd].find(
        (t) => t.filePath === file.path || t.title === file.title
      );
      return match ? match.id : null;
    }).filter((id): id is string => id !== null);

    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          const uniqueIds = Array.from(new Set([...p.trackIds, ...addedTrackIds]));
          return {
            ...p,
            trackIds: uniqueIds,
            coverUrl: selectedFiles[0]?.coverUrl || p.coverUrl,
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) }
          : p
      )
    );
  };

  // Downloads Folder Scanning (Native Recursive Directory Walk & Web Chooser)
  const handleScanDownloadsFolder = async () => {
    setIsScanningDownloads(true);
    try {
      const nativeTracks = await scanNativeDownloadDirectory();
      if (nativeTracks && nativeTracks.length > 0) {
        setTracks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const fresh = nativeTracks.filter((nt) => !existingIds.has(nt.id));
          return [...fresh, ...prev];
        });

        const scanned: ScannedFile[] = nativeTracks.map((t) => ({
          name: t.title,
          path: t.url,
          size: t.fileSize || '3.5 MB',
          extension: `.${t.hiResInfo.format.toLowerCase()}`,
          durationSec: t.duration,
          artist: t.artist,
          title: t.title,
          album: t.album,
          hiResInfo: t.hiResInfo,
          previewUrl: t.url,
          coverUrl: t.coverUrl,
          alreadyInLibrary: true,
        }));

        setDownloadFiles((prev) => [...scanned, ...prev]);
      }
    } catch (e) {
      console.warn('Native scan error:', e);
    } finally {
      setIsScanningDownloads(false);
    }
  };

  const handleFileUpload = async (fileList: FileList) => {
    const parsedFiles: ScannedFile[] = [];
    const newTracks: Track[] = [];

    // 1. Gather any companion .lrc or .txt lyrics files uploaded alongside audio files
    const companionLrcMap = new Map<string, string>();
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const lower = f.name.toLowerCase();
      if (lower.endsWith('.lrc') || lower.endsWith('.txt')) {
        try {
          const content = await f.text();
          if (content.trim()) {
            const baseName = f.name.replace(/\.[^/.]+$/, '').toLowerCase().trim();
            companionLrcMap.set(baseName, content.trim());
          }
        } catch {}
      }
    }

    // 2. Parse audio files
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const lower = file.name.toLowerCase();
      // Skip companion text files as audio items
      if (lower.endsWith('.lrc') || lower.endsWith('.txt')) continue;

      // Extract metadata tags with intelligent filename fallback
      const parsed = await parseAudioFileMetadata(file);

      // Determine lyrics:
      // Priority 1: Embedded in file metadata tags (ID3 USLT/SYLT, Vorbis LYRICS, MP4 ©lyr)
      // Priority 2: Companion .lrc file in the same upload batch
      // Priority 3: Auto-query LRCLIB online using extracted artist & title
      let trackLyrics = parsed.lyrics;

      if (!trackLyrics) {
        const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().trim();
        trackLyrics = companionLrcMap.get(baseName);
      }

      if (!trackLyrics && parsed.title && parsed.artist && !parsed.artist.includes('Неизвестный')) {
        try {
          const onlineLyrics = await fetchLyricsOnline({
            title: parsed.title,
            artist: parsed.artist,
            album: parsed.album,
            duration: parsed.duration,
          });
          if (onlineLyrics?.lyrics) {
            trackLyrics = onlineLyrics.lyrics;
          }
        } catch {}
      }

      const scanned: ScannedFile = {
        name: file.name,
        path: `/storage/emulated/0/Download/${file.name}`,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        extension: `.${file.name.split('.').pop()?.toLowerCase() || 'mp3'}`,
        durationSec: parsed.duration || 180,
        artist: parsed.artist,
        title: parsed.title,
        album: parsed.album,
        hiResInfo: parsed.hiResInfo!,
        previewUrl: parsed.url!,
        coverUrl: parsed.coverUrl,
        lyrics: trackLyrics,
        alreadyInLibrary: true,
      };

      const trackObj: Track = {
        id: `track-upload-${Date.now()}-${i}`,
        title: parsed.title || file.name,
        artist: parsed.artist || 'Загруженный файл',
        album: parsed.album || 'Загрузки',
        duration: parsed.duration || 180,
        url: parsed.url!,
        coverUrl: parsed.coverUrl,
        filePath: scanned.path,
        fileSize: scanned.size,
        hiResInfo: parsed.hiResInfo!,
        lyrics: trackLyrics,
        year: parsed.year,
        genre: parsed.genre,
        isFavorite: false,
        addedAt: Date.now(),
      };

      await saveAudioBlob(trackObj.id, file);
      prefetchTrackWaveform(trackObj);

      parsedFiles.push(scanned);
      newTracks.push(trackObj);
    }

    setDownloadFiles((prev) => [...parsedFiles, ...prev]);
    setTracks((prev) => [...newTracks, ...prev]);
  };

  const handleAddTrackToLibrary = (scannedFile: ScannedFile) => {
    const existing = tracks.find((t) => t.filePath === scannedFile.path);
    if (existing) return;

    const newTrack: Track = {
      id: `track-${Date.now()}`,
      title: scannedFile.title || scannedFile.name,
      artist: scannedFile.artist || 'Исполнитель',
      album: scannedFile.album || 'Загрузки',
      duration: scannedFile.durationSec,
      url: scannedFile.previewUrl,
      coverUrl: scannedFile.coverUrl,
      filePath: scannedFile.path,
      fileSize: scannedFile.size,
      hiResInfo: scannedFile.hiResInfo,
      lyrics: scannedFile.lyrics,
      isFavorite: false,
      addedAt: Date.now(),
    };

    setTracks((prev) => [newTrack, ...prev]);
  };

  // Automatic Album Art Loader for missing covers
  const handleAutoFetchAllCovers = async () => {
    setIsFetchingCovers(true);
    const updatedTracks = [...tracks];

    for (let i = 0; i < updatedTracks.length; i++) {
      const t = updatedTracks[i];
      if (!t.coverUrl || t.coverUrl.includes('unsplash')) {
        const cover = await fetchMissingAlbumArt(t.artist, t.title, t.album);
        if (cover) {
          updatedTracks[i] = { ...t, coverUrl: cover };
        }
      }
    }

    setTracks(updatedTracks);
    setIsFetchingCovers(false);
  };

  // Update lyrics for an individual track (persists to state & localStorage)
  const handleUpdateTrackLyrics = (trackId: string, lyrics: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, lyrics } : t))
    );
  };

  // Batch fetch lyrics for all tracks in library missing lyrics
  const handleAutoFetchAllLyrics = async () => {
    setIsFetchingLyrics(true);
    const updatedTracks = [...tracks];

    for (let i = 0; i < updatedTracks.length; i++) {
      const t = updatedTracks[i];
      if (!t.lyrics) {
        try {
          const res = await fetchLyricsOnline({
            title: t.title,
            artist: t.artist,
            album: t.album,
            duration: t.duration,
          });
          if (res && res.lyrics) {
            updatedTracks[i] = { ...t, lyrics: res.lyrics };
          }
        } catch {}
      }
    }

    setTracks(updatedTracks);
    setIsFetchingLyrics(false);
  };

  // Filtered tracks for Search
  const filteredTracks = tracks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.hiResInfo.format.toLowerCase().includes(q)
    );
  });

  const favoriteTracks = tracks.filter((t) => t.isFavorite);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AndroidFrame
      activeTrackFormat={currentTrack ? `${currentTrack.hiResInfo.format}` : undefined}
      isLossless={currentTrack?.hiResInfo.isLossless}
      onLockScreen={() => setIsLockscreenOpen(true)}
    >
      {/* App Cyberpunk Header */}
      <header className="px-4 py-2.5 backdrop-blur-md border-b flex items-center justify-between z-10 shrink-0 bg-[#120308]/95 border-[#FF1A3C]/50 text-[#FF1A3C]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FF1A3C] text-black shadow-[0_0_12px_#FF1A3C]">
            <Music className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider leading-none text-[#FFFFFF] font-mono">
              MUAPLAY // CYBER_AUDIO 2077
            </h1>
            <p className="text-[9px] font-mono mt-0.5 font-bold text-[#00E5FF]">
              [ NEURAL_DAC // 192 kHz LOSSLESS ]
            </p>
          </div>
        </div>

        {/* Global Search input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ПОИСК..."
            className="w-28 sm:w-36 rounded-lg pl-7 pr-2 py-1 text-[11px] font-mono bg-[#18040C] border border-[#FF1A3C]/40 focus:border-[#FF1A3C] text-[#FF8095] placeholder-[#661828] focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 absolute left-2 top-1.5 text-[#FF1A3C]" />
        </div>
      </header>

      {/* Main Screen Content Router based on Active Tab */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
        {/* Tab 1: All Tracks (Треки) */}
        {activeTab === 'tracks' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 p-3 space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#FF1A3C]/30 shrink-0">
              <div>
                <h2 className="text-xs font-black text-[#FFFFFF] flex items-center gap-1.5 tracking-wider">
                  <Music className="w-4 h-4 text-[#FF1A3C]" />
                  <span>МЕДИАТЕКА АУДИОФАЙЛОВ</span>
                </h2>
                <p className="text-[9px] text-[#883344]">
                  ВСЕГО ФАЙЛОВ: {filteredTracks.length}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {tracks.length > 0 && (
                  <button
                    onClick={handleClearAllTracks}
                    title="Очистить всю медиатеку"
                    className="px-2 py-1 bg-[#18040C] hover:bg-[#250412] text-[#FF1A3C] border border-[#FF1A3C]/40 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ОЧИСТИТЬ</span>
                  </button>
                )}

                <button
                  onClick={handleAutoFetchAllCovers}
                  disabled={isFetchingCovers}
                  className="px-2 py-1 bg-[#18040C] hover:bg-[#250412] text-[#00E5FF] border border-[#00E5FF]/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                  <span>ОБЛОЖКИ</span>
                </button>

                <button
                  onClick={handleAutoFetchAllLyrics}
                  disabled={isFetchingLyrics}
                  className="px-2 py-1 bg-[#18040C] hover:bg-[#250412] text-[#FF4D6D] border border-[#FF1A3C]/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                  title="Подкачать синхронизированную лирику (LRC)"
                >
                  <FileText className={`w-3 h-3 text-[#FF1A3C] ${isFetchingLyrics ? 'animate-spin' : ''}`} />
                  <span>{isFetchingLyrics ? 'LRC...' : 'ЛИРИКА'}</span>
                </button>
              </div>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredTracks.length === 0 ? (
                <div className="py-16 px-4 text-center space-y-3 my-auto border border-dashed border-[#FF1A3C]/30 rounded-xl bg-[#100308]/40">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-[#18040C] border border-[#FF1A3C]/50 flex items-center justify-center text-[#FF1A3C] shadow-[0_0_10px_rgba(255,26,60,0.3)]">
                    <Music className="w-6 h-6 text-[#FF1A3C]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-[#FFFFFF]">[ МЕДИАТЕКА ПУСТА ]</h3>
                    <p className="text-[10px] text-[#883344] max-w-xs mx-auto">
                      Загрузите аудиофайлы с устройства или запустите сканирование папки Загрузки.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('downloads')}
                      className="w-full sm:w-auto px-3.5 py-1.5 bg-[#FF1A3C] hover:bg-[#FF0033] text-black font-black text-[10px] rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(255,26,60,0.6)]"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>ОТКРЫТЬ ЗАГРУЗКИ</span>
                    </button>

                    <label className="w-full sm:w-auto px-3.5 py-1.5 bg-[#18040C] hover:bg-[#250412] border border-[#00E5FF]/40 text-[#00E5FF] font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      <Plus className="w-3.5 h-3.5 text-[#00E5FF]" />
                      <span>ВЫБРАТЬ ФАЙЛЫ</span>
                      <input
                        type="file"
                        multiple
                        accept="audio/*,.flac,.wav,.mp3,.m4a,.aac,.ogg,.opus"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                filteredTracks.map((track) => {
                  const isCurrent = currentTrackId === track.id;

                  return (
                    <div
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className={`group relative flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-[#1C040E] border-[#FF1A3C] shadow-[0_0_12px_rgba(255,26,60,0.35)]'
                          : 'bg-[#120308] hover:bg-[#18040D] border-[#FF1A3C]/35'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#0A0206] shrink-0 border border-[#FF1A3C]/40">
                          <img
                            src={track.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                              isCurrent
                                ? 'bg-[#080104]/60 opacity-100'
                                : 'bg-[#080104]/40 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Play
                              className={`w-3.5 h-3.5 ${
                                isCurrent && isPlaying
                                  ? 'text-[#FF1A3C] animate-pulse fill-[#FF1A3C]'
                                  : 'text-white fill-white'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold truncate ${
                            isCurrent ? 'text-[#00E5FF] font-black' : 'text-[#FFFFFF]'
                          }`}>
                            {track.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-[#883344]">
                            <span className="truncate">{track.artist}</span>
                            <span>•</span>
                            <span className="px-1 py-0.2 rounded font-bold text-[8px] bg-[#FF1A3C]/20 text-[#FF1A3C] border border-[#FF1A3C]/40">
                              {track.hiResInfo.format}
                            </span>
                            {track.lyrics && (
                              <span
                                className="px-1 py-0.2 rounded font-bold text-[8px] bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40"
                                title="Лирика загружена (LRC)"
                              >
                                LRC
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(track.id);
                          }}
                          className="p-1 text-[#882233] hover:text-[#FF1A3C] rounded transition-colors"
                          title="В избранное"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              track.isFavorite ? 'fill-[#FF1A3C] text-[#FF1A3C]' : ''
                            }`}
                          />
                        </button>

                        <span className="text-[9px] font-mono text-[#883344] px-1">
                          {formatDuration(track.duration)}
                        </span>

                        <button
                          onClick={(e) => handleDeleteTrack(track.id, e)}
                          className="p-1 text-[#882233] hover:text-[#FF1A3C] hover:bg-[#FF1A3C]/10 rounded transition-colors"
                          title="Удалить трек из медиатеки"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Playlists (Плейлисты) */}
        {activeTab === 'playlists' && (
          <PlaylistView
            playlists={playlists}
            tracks={tracks}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onAddTracksToPlaylist={handleAddTracksToPlaylist}
            onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
            availableDownloads={downloadFiles}
            onRescanDownloads={handleScanDownloadsFolder}
            isScanning={isScanningDownloads}
          />
        )}

        {/* Tab 3: Downloads Scanner (Загрузки) */}
        {activeTab === 'downloads' && (
          <DownloadsScanner
            scannedFiles={downloadFiles}
            isScanning={isScanningDownloads}
            onScanDownloadsFolder={handleScanDownloadsFolder}
            onFileUpload={handleFileUpload}
            onAutoFetchAllCovers={handleAutoFetchAllCovers}
            isFetchingCovers={isFetchingCovers}
            onAddTrackToLibrary={handleAddTrackToLibrary}
            tracks={tracks}
          />
        )}

        {/* Tab 4: Equalizer (Эквалайзер) */}
        {activeTab === 'equalizer' && (
          <EqualizerView isPlaying={isPlaying} />
        )}

        {/* Tab 5: Favorites (Избранное) */}
        {activeTab === 'favorites' && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#FF1A3C]/30 shrink-0">
              <h2 className="text-xs font-black text-[#FFFFFF] flex items-center gap-1.5 tracking-wider">
                <Heart className="w-4 h-4 text-[#FF1A3C] fill-[#FF1A3C]" />
                <span>ИЗБРАННЫЕ АУДИОТРЕКИ</span>
              </h2>
              <span className="text-[9px] text-[#883344]">
                ВСЕГО: {favoriteTracks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {favoriteTracks.length === 0 ? (
                <div className="py-16 text-center text-[#883344] space-y-2 border border-dashed border-[#FF1A3C]/30 rounded-xl my-auto">
                  <Heart className="w-8 h-8 mx-auto opacity-40 text-[#FF1A3C]" />
                  <p className="text-xs">[ В ИЗБРАННОМ НЕТ ТРЕКОВ ]</p>
                  <p className="text-[10px] text-[#883344]">
                    Нажмите сердечко возле трека, чтобы закрепить его в этой вкладке.
                  </p>
                </div>
              ) : (
                favoriteTracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handlePlayTrack(track)}
                    className="flex items-center justify-between p-2 bg-[#120308] hover:bg-[#18040D] border border-[#FF1A3C]/35 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#FF1A3C]/40"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-[#FFFFFF] truncate">
                          {track.title}
                        </h4>
                        <p className="text-[9px] text-[#883344] truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold bg-[#FF1A3C]/20 text-[#FF1A3C] px-1 py-0.2 rounded border border-[#FF1A3C]/40">
                        {track.hiResInfo.format}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(track.id);
                        }}
                        className="p-1 text-[#FF1A3C]"
                      >
                        <Heart className="w-4 h-4 fill-[#FF1A3C]" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Sticky Bottom Dock: Mini Player & Tab Navigation */}
      <div className="shrink-0 z-20 flex flex-col bg-[#0A0206]/98 border-t border-[#FF1A3C]/40 shadow-[0_-8px_25px_rgba(0,0,0,0.9)]">
        <MiniPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={handleTogglePlayPause}
          onNext={handleNextTrack}
          onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
          onToggleFavorite={handleToggleFavorite}
          onSeek={handleSeek}
        />

        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tracksCount={tracks.length}
          playlistsCount={playlists.length}
        />
      </div>

      {/* Full Screen Now Playing Screen Modal */}
      <NowPlayingModal
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isShuffle={isShuffle}
        isRepeat={isRepeat}
        onPlayPause={handleTogglePlayPause}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleRepeat={() => setIsRepeat(!isRepeat)}
        onToggleFavorite={handleToggleFavorite}
        onOpenEQ={() => {
          setIsNowPlayingOpen(false);
          setActiveTab('equalizer');
        }}
        onLockScreen={() => {
          setIsNowPlayingOpen(false);
          setIsLockscreenOpen(true);
        }}
        onUpdateLyrics={handleUpdateTrackLyrics}
      />

      {/* Cyberpunk Smartphone Lock Screen Widget */}
      <CyberLockscreen
        isOpen={isLockscreenOpen}
        onUnlock={() => setIsLockscreenOpen(false)}
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlayPause={handleTogglePlayPause}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onSeek={handleSeek}
        onToggleFavorite={handleToggleFavorite}
        onOpenNowPlaying={() => {
          setIsLockscreenOpen(false);
          setIsNowPlayingOpen(true);
        }}
      />
    </AndroidFrame>
  );
}
