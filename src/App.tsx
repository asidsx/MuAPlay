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
  Lock,
  Moon,
  ListMusic,
  Edit3,
  CornerDownRight,
  ArrowDownUp,
  Filter,
} from 'lucide-react';
import { Track, Playlist, ScannedFile, RepeatMode } from './types/music';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS, DOWNLOADS_FOLDER_FILES } from './data/sampleTracks';
import { audioEngine } from './services/audioEngine';
import { parseAudioFileMetadata, fetchMissingAlbumArt, isSupportedAudioFile, ACCEPT_AUDIO_INPUT_ATTR } from './services/metadataScanner';
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
import { CyberCoverImage } from './components/CyberCoverImage';
import { getAudioBlob, getCoverCache, saveCoverCache } from './services/audioStorage';
import { sleepTimer, SleepTimerState } from './services/sleepTimer';
import { SleepTimerModal } from './components/SleepTimerModal';
import { QueueModal } from './components/QueueModal';
import { TagEditorModal } from './components/TagEditorModal';
import {
  initMediaSession,
  updateMediaSessionMetadata,
  updateMediaSessionPlaybackState,
  updateMediaSessionPositionState,
} from './services/mediaSession';

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
        // Clean out legacy demo track IDs if present and purge mismatched lyrics
        return parsed
          .filter((t: Track) => !t.id.startsWith('track-') || t.id.startsWith('track-upload-') || t.id.length > 15)
          .map((t: Track) => {
            // Auto-clean known false mismatch (e.g. Zach Bryan's "Burn, Burn, Burn" attached to EDM beat "burn")
            if (
              t.lyrics &&
              t.lyrics.includes('Everyone seems a damn genius lately') &&
              !t.artist.toLowerCase().includes('zach bryan')
            ) {
              return { ...t, lyrics: undefined };
            }
            return t;
          });
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
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
    const saved = localStorage.getItem('android_music_repeat_mode');
    if (saved === 'off' || saved === 'all' || saved === 'one') {
      return saved as RepeatMode;
    }
    return 'all';
  });

  const isRepeat = repeatMode !== 'off';

  const handleCycleRepeatMode = () => {
    setRepeatMode((prev) => {
      const next: RepeatMode = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      localStorage.setItem('android_music_repeat_mode', next);
      return next;
    });
  };

  // Modals & Tools
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [isScanningDownloads, setIsScanningDownloads] = useState<boolean>(false);
  const [isFetchingCovers, setIsFetchingCovers] = useState<boolean>(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fileAlert, setFileAlert] = useState<string | null>(null);

  // User Priority Queue State (Up Next)
  const [userQueue, setUserQueue] = useState<Track[]>(() => {
    const saved = localStorage.getItem('android_music_user_queue');
    if (saved) {
      try {
        const parsed: Track[] = JSON.parse(saved);
        return parsed.map((t, idx) => ({
          ...t,
          queueId: t.queueId || `q-${t.id || 'track'}-${Date.now()}-${idx}`,
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('android_music_user_queue', JSON.stringify(userQueue));
  }, [userQueue]);

  // Sleep Timer State & Subscriptions
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState<boolean>(false);
  const [sleepTimerState, setSleepTimerState] = useState<SleepTimerState>(sleepTimer.state);

  useEffect(() => {
    sleepTimer.setPauseHandler(() => {
      setIsPlaying(false);
      audioEngine.pauseTrack();
    });
    const unsub = sleepTimer.subscribe((st) => setSleepTimerState({ ...st }));
    return unsub;
  }, []);

  // Queue Modal & Tag Editor Modal State
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isTagEditorOpen, setIsTagEditorOpen] = useState<boolean>(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(() => {
    return localStorage.getItem('android_music_active_playlist_id') || null;
  });

  useEffect(() => {
    if (activePlaylistId) {
      localStorage.setItem('android_music_active_playlist_id', activePlaylistId);
    } else {
      localStorage.removeItem('android_music_active_playlist_id');
    }
  }, [activePlaylistId]);

  // Sorting & Filtering State
  const [trackSort, setTrackSort] = useState<'default' | 'title' | 'artist' | 'duration'>('default');
  const [trackFilter, setTrackFilter] = useState<'all' | 'flac' | 'favorites'>('all');

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

  // Auto-restore / rehydrate covers if previous session stored ephemeral blob: URLs
  useEffect(() => {
    const restoreCovers = async () => {
      let hasChanges = false;
      const updated = await Promise.all(
        tracks.map(async (t) => {
          if (!t.coverUrl || t.coverUrl.startsWith('blob:')) {
            // 1. Try cached cover from IndexedDB
            const cached = await getCoverCache(t.id);
            if (cached && !cached.startsWith('blob:')) {
              hasChanges = true;
              return { ...t, coverUrl: cached };
            }

            // 2. Try re-extracting embedded ID3/Vorbis cover from stored audio blob
            const blob = await getAudioBlob(t.id);
            if (blob) {
              try {
                const meta = await parseAudioFileMetadata(blob as File);
                if (meta.coverUrl && !meta.coverUrl.startsWith('blob:')) {
                  await saveCoverCache(t.id, meta.coverUrl);
                  hasChanges = true;
                  return { ...t, coverUrl: meta.coverUrl };
                }
              } catch {}
            }
          }
          return t;
        })
      );
      if (hasChanges) {
        setTracks(updated);
      }
    };

    if (tracks.length > 0) {
      restoreCovers();
    }
  }, []);

  // Filtered & Sorted tracks for Media Library
  const processedTracks = tracks
    .filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.hiResInfo.format.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (trackFilter === 'flac') {
        return t.hiResInfo.isLossless || t.hiResInfo.format.toUpperCase() === 'FLAC';
      }
      if (trackFilter === 'favorites') {
        return t.isFavorite;
      }
      return true;
    })
    .sort((a, b) => {
      if (trackSort === 'title') return a.title.localeCompare(b.title);
      if (trackSort === 'artist') return a.artist.localeCompare(b.artist);
      if (trackSort === 'duration') return b.duration - a.duration;
      return 0;
    });

  const filteredTracks = processedTracks;
  const favoriteTracks = tracks.filter((t) => t.isFavorite);

  const currentTrack = tracks.find((t) => t.id === currentTrackId) || tracks[0] || null;

  // Audio Playback Listener Sync
  useEffect(() => {
    audioEngine.init();
    const audio = audioEngine.getAudioElement();
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 180);
    const handleEnded = () => {
      // Sleep Timer check: pause if set to stop at end of track
      if (sleepTimer.handleTrackEnded()) {
        setIsPlaying(false);
        return;
      }

      if (repeatMode === 'one' && currentTrack) {
        audioEngine.seek(0);
        audioEngine.resumeTrack();
      } else if (repeatMode === 'all') {
        handleNextTrack();
      } else {
        // repeatMode === 'off'
        if (userQueue.length > 0) {
          handleNextTrack();
        } else {
          const activeId = currentTrackId || currentTrack?.id;
          const currentIndex = activeId ? tracks.findIndex((t) => t.id === activeId) : -1;
          if (currentIndex !== -1 && currentIndex < tracks.length - 1) {
            handleNextTrack();
          } else {
            setIsPlaying(false);
            audioEngine.pauseTrack();
          }
        }
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
  }, [currentTrackId, repeatMode, isShuffle, currentTrack, tracks, userQueue]);

  // MediaSession API Integration (Lockscreen, Notification & Bluetooth Remote)
  useEffect(() => {
    initMediaSession({
      onPlay: () => {
        if (!isPlaying) handleTogglePlayPause();
      },
      onPause: () => {
        if (isPlaying) handleTogglePlayPause();
      },
      onNext: () => handleNextTrack(),
      onPrev: () => handlePrevTrack(),
      onSeek: (sec) => handleSeek(sec),
    });
  }, [isPlaying, currentTrack, tracks, userQueue, isShuffle, currentTime]);

  useEffect(() => {
    updateMediaSessionMetadata(currentTrack);
  }, [currentTrack]);

  useEffect(() => {
    updateMediaSessionPlaybackState(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    updateMediaSessionPositionState(currentTime, duration);
  }, [currentTime, duration]);

  // Queue and Tag Helper Functions
  const handleAddToQueue = (track: Track, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const queueItem: Track = {
      ...track,
      queueId: `q-${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setUserQueue((prev) => [...prev, queueItem]);
    setFileAlert(`[ +ОЧЕРЕДЬ ] «${track.title}» добавлен в очередь`);
    setTimeout(() => setFileAlert(null), 2000);
  };

  const handlePlayNext = (track: Track, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const queueItem: Track = {
      ...track,
      queueId: `q-${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setUserQueue((prev) => [queueItem, ...prev]);
    setFileAlert(`[ СЛЕДУЮЩИЙ ] «${track.title}» сыграет первым`);
    setTimeout(() => setFileAlert(null), 2000);
  };

  const handleRemoveFromQueue = (index: number) => {
    setUserQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveQueueItem = (fromIndex: number, toIndex: number) => {
    setUserQueue((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  const handleReorderQueue = (newQueue: Track[]) => {
    setUserQueue(newQueue);
  };

  const handleClearQueue = () => {
    setUserQueue([]);
  };

  const handleOpenTagEditor = (track?: Track, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTrack(track || currentTrack || null);
    setIsTagEditorOpen(true);
  };

  const handleSaveEditedTrack = (updated: Track) => {
    setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setUserQueue((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setFileAlert(`[ ID3 ] Теги «${updated.title}» успешно обновлены`);
    setTimeout(() => setFileAlert(null), 2000);
  };

  const handleImportPlaylist = (name: string, trackIds: string[]) => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description: `Импортированный M3U плейлист`,
      trackIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    setFileAlert(`Плейлист «${name}» успешно импортирован (${trackIds.length} треков)`);
    setTimeout(() => setFileAlert(null), 2500);
  };

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

  // Core audio playback engine trigger
  const handlePlayTrackCore = async (track: Track) => {
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

  // General Play Track (used by modals, previews, or single trigger)
  const handlePlayTrack = async (track: Track) => {
    // If the user tapped on the currently loaded track, toggle play/pause instead of restarting
    if (currentTrackId === track.id) {
      handleTogglePlayPause();
      return;
    }

    handlePlayTrackCore(track);
  };

  // Play Track from Media Library (Tab 1) -> Detaches playlist and sets queue from tracks view
  const handlePlayTrackFromLibrary = (track: Track) => {
    // If user tapped on currently loaded track while already in library mode (activePlaylistId === null)
    if (currentTrackId === track.id && activePlaylistId === null) {
      handleTogglePlayPause();
      return;
    }

    // 1. Detach from any playlist: remove activePlaylistId so playlists never show active state
    setActivePlaylistId(null);

    // 2. Reset upcoming queue according to Tracks tab rules
    const currentPool = filteredTracks.length > 0 ? filteredTracks : tracks;
    const currentIndex = currentPool.findIndex((t) => t.id === track.id);
    let upcoming: Track[] = [];
    if (currentIndex !== -1) {
      const nextTracks = currentPool.slice(currentIndex + 1);
      const prevTracks = currentPool.slice(0, currentIndex);
      upcoming = [...nextTracks, ...prevTracks].map((t, idx) => ({
        ...t,
        queueId: `q-lib-${t.id}-${Date.now()}-${idx}`,
      }));
    }
    setUserQueue(upcoming);

    // 3. Play the chosen track
    handlePlayTrackCore(track);
    setFileAlert(`[ МЕДИАТЕКА ] Воспроизведение «${track.title}». Очередь треков обновлена`);
    setTimeout(() => setFileAlert(null), 2000);
  };

  // Play Track from Favorites (Tab 5) -> Detaches playlist and sets queue from favorites
  const handlePlayTrackFromFavorites = (track: Track) => {
    if (currentTrackId === track.id && activePlaylistId === null) {
      handleTogglePlayPause();
      return;
    }

    setActivePlaylistId(null);

    const currentIndex = favoriteTracks.findIndex((t) => t.id === track.id);
    let upcoming: Track[] = [];
    if (currentIndex !== -1) {
      const nextTracks = favoriteTracks.slice(currentIndex + 1);
      const prevTracks = favoriteTracks.slice(0, currentIndex);
      upcoming = [...nextTracks, ...prevTracks].map((t, idx) => ({
        ...t,
        queueId: `q-fav-${t.id}-${Date.now()}-${idx}`,
      }));
    }
    setUserQueue(upcoming);

    handlePlayTrackCore(track);
    setFileAlert(`[ ИЗБРАННОЕ ] Воспроизведение «${track.title}»`);
    setTimeout(() => setFileAlert(null), 2000);
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
    if (currentTrackId !== currentTrack.id) {
      setCurrentTrackId(currentTrack.id);
    }
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
    // If user has queued tracks, play the next queued item
    if (userQueue.length > 0) {
      const nextFromQueue = userQueue[0];
      setUserQueue((prev) => prev.slice(1));
      handlePlayTrackCore(nextFromQueue);
      return;
    }

    // If activePlaylistId is set, determine next track within playlist
    if (activePlaylistId) {
      const currentPl = playlists.find((p) => p.id === activePlaylistId);
      if (currentPl && currentPl.trackIds.length > 0) {
        const plTracks = currentPl.trackIds
          .map((id) => tracks.find((t) => t.id === id))
          .filter((t): t is Track => t !== undefined);
        if (plTracks.length > 0) {
          const activeId = currentTrackId || currentTrack?.id;
          const curIdx = plTracks.findIndex((t) => t.id === activeId);
          let nextIdx = 0;
          if (isShuffle) {
            nextIdx = plTracks.length > 1 ? Math.floor(Math.random() * plTracks.length) : 0;
            if (plTracks.length > 1 && nextIdx === curIdx) {
              nextIdx = (curIdx + 1) % plTracks.length;
            }
          } else {
            nextIdx = curIdx === -1 ? 0 : (curIdx + 1) % plTracks.length;
          }
          handlePlayTrackCore(plTracks[nextIdx]);
          return;
        }
      }
    }

    // Default tracks library sequence:
    const pool = filteredTracks.length > 0 ? filteredTracks : tracks;
    if (pool.length === 0) return;
    let nextIndex = 0;
    const activeId = currentTrackId || currentTrack?.id;
    const currentIndex = activeId ? pool.findIndex((t) => t.id === activeId) : -1;

    if (isShuffle) {
      nextIndex = pool.length > 1 ? Math.floor(Math.random() * pool.length) : 0;
      if (pool.length > 1 && nextIndex === currentIndex) {
        nextIndex = (currentIndex + 1) % pool.length;
      }
    } else {
      if (currentIndex === -1) {
        nextIndex = pool.length > 1 ? 1 : 0;
      } else {
        nextIndex = (currentIndex + 1) % pool.length;
      }
    }

    const nextTrack = pool[nextIndex];
    if (nextTrack) {
      handlePlayTrackCore(nextTrack);
    }
  };

  const lastPrevClickRef = useRef<number>(0);

  const handlePrevTrack = () => {
    const audio = audioEngine.getAudioElement();
    const curAudioTime = audio ? audio.currentTime : currentTime;
    const now = Date.now();
    const timeSinceLastPrev = now - lastPrevClickRef.current;

    // Temporal trigger: 3 seconds (3000ms)
    // If track is past 3 seconds AND last "Prev" click was not within 3 seconds:
    // First press rewinds track to beginning (0s)
    // Second press within 3 seconds (or if track is at < 3s) jumps to previous track
    if (curAudioTime > 3 && timeSinceLastPrev > 3000) {
      audioEngine.seek(0);
      setCurrentTime(0);
      lastPrevClickRef.current = now;
      return;
    }

    lastPrevClickRef.current = 0;

    // If activePlaylistId is set, determine prev track within playlist
    if (activePlaylistId) {
      const currentPl = playlists.find((p) => p.id === activePlaylistId);
      if (currentPl && currentPl.trackIds.length > 0) {
        const plTracks = currentPl.trackIds
          .map((id) => tracks.find((t) => t.id === id))
          .filter((t): t is Track => t !== undefined);
        if (plTracks.length > 0) {
          const activeId = currentTrackId || currentTrack?.id;
          const curIdx = plTracks.findIndex((t) => t.id === activeId);
          const effIdx = curIdx === -1 ? 0 : curIdx;
          const prevIdx = (effIdx - 1 + plTracks.length) % plTracks.length;
          handlePlayTrackCore(plTracks[prevIdx]);
          return;
        }
      }
    }

    const pool = filteredTracks.length > 0 ? filteredTracks : tracks;
    if (pool.length === 0) return;
    const activeId = currentTrackId || currentTrack?.id;
    const currentIndex = activeId ? pool.findIndex((t) => t.id === activeId) : 0;
    const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;
    const prevIndex = (effectiveIndex - 1 + pool.length) % pool.length;
    const prevTrack = pool[prevIndex];
    if (prevTrack) {
      handlePlayTrackCore(prevTrack);
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

  // Add tracks to playlist from player library
  const handleAddTracksToPlaylist = (playlistId: string, selectedTrackIds: string[]) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          const uniqueIds = Array.from(new Set([...p.trackIds, ...selectedTrackIds]));
          const firstTrack = tracks.find((t) => t.id === uniqueIds[0]);
          return {
            ...p,
            trackIds: uniqueIds,
            coverUrl: p.coverUrl || firstTrack?.coverUrl,
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
    const targetPl = playlists.find((p) => p.id === playlistId);
    setFileAlert(`[ ШАРД ] В «${targetPl?.name || 'Плейлист'}» добавлено +${selectedTrackIds.length} треков`);
    setTimeout(() => setFileAlert(null), 2500);
  };

  // Play playlist and automatically populate upcoming queue with playlist tracks
  const handlePlayPlaylist = (playlist: Playlist, startIndex = 0, shuffle = false) => {
    const playlistTracks = playlist.trackIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is Track => t !== undefined);

    if (playlistTracks.length === 0) {
      setFileAlert(`[ ШАРД ПУСТ ] В «${playlist.name}» нет треков`);
      setTimeout(() => setFileAlert(null), 2500);
      return;
    }

    // If this playlist is ALREADY active and playing, toggle pause!
    if (activePlaylistId === playlist.id && isPlaying) {
      handleTogglePlayPause();
      setFileAlert(`[ ПАУЗА ] Шард «${playlist.name}» приостановлен`);
      setTimeout(() => setFileAlert(null), 2000);
      return;
    }

    // If this playlist is ALREADY active and paused, resume playback!
    if (activePlaylistId === playlist.id && !isPlaying && currentTrack && playlist.trackIds.includes(currentTrack.id)) {
      handleTogglePlayPause();
      setFileAlert(`[ ВОСПРОИЗВЕДЕНИЕ ] Шард «${playlist.name}» возобновлен`);
      setTimeout(() => setFileAlert(null), 2000);
      return;
    }

    setActivePlaylistId(playlist.id);

    let orderedTracks = [...playlistTracks];
    let firstTrack: Track;

    if (shuffle) {
      orderedTracks = [...playlistTracks].sort(() => Math.random() - 0.5);
      firstTrack = orderedTracks[0];
      const upcoming = orderedTracks.slice(1).map((t, idx) => ({
        ...t,
        queueId: `q-pl-${playlist.id}-${t.id}-${Date.now()}-${idx}`,
      }));
      setUserQueue(upcoming);
    } else {
      const validIndex = Math.max(0, Math.min(startIndex, orderedTracks.length - 1));
      firstTrack = orderedTracks[validIndex];
      const nextTracks = orderedTracks.slice(validIndex + 1);
      const prevTracks = orderedTracks.slice(0, validIndex);
      const upcoming = [...nextTracks, ...prevTracks].map((t, idx) => ({
        ...t,
        queueId: `q-pl-${playlist.id}-${t.id}-${Date.now()}-${idx}`,
      }));
      setUserQueue(upcoming);
    }

    handlePlayTrackCore(firstTrack);
    setFileAlert(`[ ОЧЕРЕДЬ ШАРДА ] Загружено ${playlistTracks.length} треков из «${playlist.name}»`);
    setTimeout(() => setFileAlert(null), 2500);
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
    const rawFiles = Array.from(fileList);
    
    // Separate audio files, companion lyrics files, and completely rejected non-audio files (like PDF, DOC, ZIP, EXE)
    const audioFiles: File[] = [];
    const lyricsFiles: File[] = [];
    const rejectedFiles: File[] = [];

    for (const file of rawFiles) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.lrc') || (lower.endsWith('.txt') && !isSupportedAudioFile(file))) {
        lyricsFiles.push(file);
      } else if (isSupportedAudioFile(file)) {
        audioFiles.push(file);
      } else {
        rejectedFiles.push(file);
      }
    }

    // If non-audio files were chosen (e.g. PDF, DOCX, ZIP, MP4 video, etc.), reject them immediately with HUD toast
    if (rejectedFiles.length > 0) {
      const names = rejectedFiles.map((f) => `«${f.name}»`).join(', ');
      const msg = rejectedFiles.length === 1
        ? `⚠️ ОТКЛОНЕНО: ${names} не является аудиофайлом. Принимаются только форматы FLAC, MP3, WAV, M4A, OGG, OPUS, AAC.`
        : `⚠️ ОТКЛОНЕНО: ${rejectedFiles.length} файлов не являются аудио (пропущены). Поддерживаются только FLAC, MP3, WAV, M4A, OGG, OPUS, AAC.`;
      
      setFileAlert(msg);
      setTimeout(() => {
        setFileAlert(null);
      }, 4500);
    }

    // If no valid audio files were found, halt processing immediately (do not touch CPU/IndexedDB)
    if (audioFiles.length === 0) {
      return;
    }

    const parsedFiles: ScannedFile[] = [];
    const newTracks: Track[] = [];

    // 1. Gather any companion .lrc or .txt lyrics files uploaded alongside audio files
    const companionLrcMap = new Map<string, string>();
    for (const f of lyricsFiles) {
      try {
        const content = await f.text();
        if (content.trim()) {
          const baseName = f.name.replace(/\.[^/.]+$/, '').toLowerCase().trim();
          companionLrcMap.set(baseName, content.trim());
        }
      } catch {}
    }

    // 2. Parse ONLY verified audio files
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];

      try {
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
        // prefetchTrackWaveform(trackObj); // Removed to prevent OOM crash during batch uploads

        parsedFiles.push(scanned);
        newTracks.push(trackObj);
      } catch (err) {
        console.warn('Skipping unparseable or rejected file:', file.name, err);
      }
    }

    if (parsedFiles.length > 0) {
      setDownloadFiles((prev) => [...parsedFiles, ...prev]);
      setTracks((prev) => [...newTracks, ...prev]);
    }
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
      <header className="px-3.5 py-2.5 backdrop-blur-md border-b flex items-center justify-between z-10 shrink-0 bg-[#120308]/95 border-[#FF1A3C]/50 text-[#FF1A3C]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FF1A3C] text-black shadow-[0_0_12px_#FF1A3C]">
            <Music className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider leading-none text-[#FFFFFF] font-mono">
              MUAPLAY // CYBER_AUDIO
            </h1>
            <p className="text-[9px] font-mono mt-0.5 font-bold text-[#00E5FF]">
              [ 192 kHz LOSSLESS ]
            </p>
          </div>
        </div>

        {/* Global Search input & Lockscreen launcher */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ПОИСК..."
              className="w-24 sm:w-32 rounded-lg pl-6 pr-2 py-1 text-[11px] font-mono bg-[#18040C] border border-[#FF1A3C]/40 focus:border-[#FF1A3C] text-[#FF8095] placeholder-[#661828] focus:outline-none"
            />
            <Search className="w-3 h-3 absolute left-2 top-2 text-[#FF1A3C]" />
          </div>

          <button
            onClick={() => setIsLockscreenOpen(true)}
            title="Экран блокировки (AOD виджет)"
            className="p-1.5 rounded-lg bg-[#18040C] border border-[#FF1A3C]/50 text-[#FF1A3C] hover:bg-[#FF1A3C] hover:text-black transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Screen Content Router based on Active Tab */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
        {/* File Format Alert Toast */}
        {fileAlert && (
          <div className="absolute top-2 inset-x-3 z-50 bg-[#1A030A]/95 border-2 border-[#FF1A3C] text-[#FF8095] p-2.5 rounded-xl shadow-[0_0_25px_rgba(255,26,60,0.8)] font-mono text-[11px] leading-relaxed flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top duration-300">
            <span className="font-bold">{fileAlert}</span>
            <button
              onClick={() => setFileAlert(null)}
              className="px-2 py-0.5 bg-[#FF1A3C] text-black font-black rounded text-[10px] shrink-0"
            >
              OK
            </button>
          </div>
        )}

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

            {/* Filter & Sort Controls Bar */}
            <div className="flex items-center justify-between gap-1.5 pb-1 shrink-0 overflow-x-auto text-[9px]">
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[#883344] font-bold uppercase hidden sm:inline">ФИЛЬТР:</span>
                {[
                  { id: 'all', label: 'ВСЕ' },
                  { id: 'flac', label: 'HI-RES' },
                  { id: 'favorites', label: 'ИЗБРАННОЕ' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTrackFilter(f.id as any)}
                    className={`px-2 py-0.5 rounded-md border text-[9px] transition-all font-bold ${
                      trackFilter === f.id
                        ? 'bg-[#FF1A3C] text-black border-[#FF1A3C] shadow-[0_0_8px_rgba(255,26,60,0.6)]'
                        : 'bg-[#120308] text-[#883344] border-[#FF1A3C]/30 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-auto">
                <ArrowDownUp className="w-3 h-3 text-[#00E5FF]" />
                <select
                  value={trackSort}
                  onChange={(e) => setTrackSort(e.target.value as any)}
                  className="bg-[#120308] border border-[#00E5FF]/40 text-[#00E5FF] rounded px-1.5 py-0.5 text-[9px] font-bold focus:outline-none"
                >
                  <option value="default">СОРТИРОВКА: СТАНДАРТ</option>
                  <option value="title">НАЗВАНИЕ (А-Я)</option>
                  <option value="artist">ИСПОЛНИТЕЛЬ</option>
                  <option value="duration">ДЛИТЕЛЬНОСТЬ</option>
                </select>
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
                        accept={ACCEPT_AUDIO_INPUT_ATTR}
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
                      onClick={() => handlePlayTrackFromLibrary(track)}
                      className={`group relative flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                        isCurrent
                          ? 'bg-[#1C040E] border-[#FF1A3C] shadow-[0_0_12px_rgba(255,26,60,0.35)]'
                          : 'bg-[#120308] hover:bg-[#18040D] border-[#FF1A3C]/35'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#0A0206] shrink-0 border border-[#FF1A3C]/40">
                          <CyberCoverImage
                            src={track.coverUrl}
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

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => handlePlayNext(track, e)}
                          className="p-1 text-[#882233] hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded transition-colors"
                          title="Воспроизвести следующим"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleAddToQueue(track, e)}
                          className="p-1 text-[#882233] hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded transition-colors"
                          title="Добавить в очередь"
                        >
                          <ListMusic className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleOpenTagEditor(track, e)}
                          className="p-1 text-[#882233] hover:text-[#FF1A3C] hover:bg-[#FF1A3C]/10 rounded transition-colors"
                          title="Редактировать ID3 теги"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

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

                        <span className="text-[9px] font-mono text-[#883344] px-1 hidden xs:inline">
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
            activePlaylistId={activePlaylistId}
            onTogglePlay={handleTogglePlayPause}
            onPlayTrack={handlePlayTrack}
            onPlayPlaylist={handlePlayPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onAddTracksToPlaylist={handleAddTracksToPlaylist}
            onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
            onImportPlaylist={handleImportPlaylist}
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
                    onClick={() => handlePlayTrackFromFavorites(track)}
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
          onPrev={handlePrevTrack}
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
        repeatMode={repeatMode}
        onPlayPause={handleTogglePlayPause}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleRepeat={handleCycleRepeatMode}
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
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenQueue={() => setIsQueueOpen(true)}
        onOpenTagEditor={() => handleOpenTagEditor(currentTrack || undefined)}
        sleepTimerRemaining={
          sleepTimerState.isActive
            ? sleepTimerState.mode === 'end_of_track'
              ? 'КОНЕЦ'
              : `${Math.ceil(sleepTimerState.remainingSeconds / 60)}м`
            : null
        }
        queueCount={userQueue.length}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        currentVolume={volume}
      />

      {/* Up Next / Queue Modal */}
      <QueueModal
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        userQueue={userQueue}
        upcomingTracks={tracks.filter((t) => t.id !== (currentTrackId || currentTrack?.id))}
        onPlayTrack={(t) => handlePlayTrack(t)}
        onRemoveFromQueue={handleRemoveFromQueue}
        onMoveQueueItem={handleMoveQueueItem}
        onReorderQueue={handleReorderQueue}
        onAddToQueue={handleAddToQueue}
        onClearQueue={handleClearQueue}
      />

      {/* ID3 Tag Editor Modal */}
      <TagEditorModal
        isOpen={isTagEditorOpen}
        track={editingTrack}
        onClose={() => {
          setIsTagEditorOpen(false);
          setEditingTrack(null);
        }}
        onSave={handleSaveEditedTrack}
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
