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
} from 'lucide-react';
import { Track, Playlist, ScannedFile } from './types/music';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS, DOWNLOADS_FOLDER_FILES } from './data/sampleTracks';
import { audioEngine } from './services/audioEngine';
import { parseAudioFileMetadata, fetchMissingAlbumArt } from './services/metadataScanner';
import { AndroidFrame } from './components/AndroidFrame';
import { Navigation, TabType } from './components/Navigation';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlayingModal } from './components/NowPlayingModal';
import { PlaylistView } from './components/PlaylistView';
import { DownloadsScanner } from './components/DownloadsScanner';
import { EqualizerView } from './components/EqualizerView';
import { CyberpunkHudView } from './components/CyberpunkHudView';

export default function App() {
  // Navigation & Visual Theme State
  const [activeTab, setActiveTab] = useState<TabType>('tracks');
  const [guiMode, setGuiMode] = useState<'standard' | 'cyberpunk'>('standard');

  const toggleGuiMode = () => {
    setGuiMode((prev) => {
      const next = prev === 'standard' ? 'cyberpunk' : 'standard';
      if (next === 'cyberpunk') {
        setActiveTab('cyberpunk');
      } else if (activeTab === 'cyberpunk') {
        setActiveTab('tracks');
      }
      return next;
    });
  };

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
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist State to LocalStorage
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
    const handleEnded = () => handleNextTrack();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackId, isRepeat, isShuffle]);

  // Audio Controls
  const handlePlayTrack = (track: Track) => {
    setCurrentTrackId(track.id);
    setIsPlaying(true);
    audioEngine.playTrack(track.url, track.id);
  };

  const handleTogglePlayPause = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      setIsPlaying(false);
      audioEngine.pauseTrack();
    } else {
      setIsPlaying(true);
      audioEngine.playTrack(currentTrack.url, currentTrack.id);
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

  // Downloads Folder Scanning Simulation & File Chooser
  const handleScanDownloadsFolder = () => {
    setIsScanningDownloads(true);
    setTimeout(() => {
      setIsScanningDownloads(false);
    }, 1200);
  };

  const handleFileUpload = async (fileList: FileList) => {
    const parsedFiles: ScannedFile[] = [];
    const newTracks: Track[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const parsed = await parseAudioFileMetadata(file);

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
        isFavorite: false,
        addedAt: Date.now(),
      };

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
      guiMode={guiMode}
      onToggleGuiMode={toggleGuiMode}
    >
      {/* App Header */}
      <header className={`px-4 py-2.5 backdrop-blur-md border-b flex items-center justify-between z-10 shrink-0 ${
        guiMode === 'cyberpunk'
          ? 'bg-[#120408]/90 border-[#FF1A3C]/60 text-[#FF1A3C]'
          : 'bg-[#0A0A0A]/90 border-[#1F1F1F]'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${
            guiMode === 'cyberpunk'
              ? 'bg-[#FF1A3C] text-black shadow-[0_0_12px_#FF1A3C]'
              : 'bg-gradient-to-tr from-[#7C4DFF] to-[#00E5FF] text-white shadow-purple-500/20'
          }`}>
            <Music className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none text-[#FFFFFF]">
              {guiMode === 'cyberpunk' ? 'NETRUNNER HI-RES DAC' : 'MuAPlay'}
            </h1>
            <p className={`text-[10px] font-mono mt-0.5 font-bold ${
              guiMode === 'cyberpunk' ? 'text-[#FF1A3C]' : 'text-[#00E5FF]'
            }`}>
              {guiMode === 'cyberpunk' ? 'SYS.VER 55.0011214 • LOSSLESS' : 'FLAC 24-Bit / 192 kHz Player'}
            </p>
          </div>
        </div>

        {/* Global Search button toggle */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск..."
            className={`w-28 sm:w-36 rounded-xl pl-7 pr-2 py-1 text-xs text-[#E0E0E0] placeholder-[#555555] focus:outline-none ${
              guiMode === 'cyberpunk'
                ? 'bg-[#18050B] border border-[#FF1A3C]/50 focus:border-[#FF1A3C] text-[#FF8095]'
                : 'bg-[#121212] border border-[#1F1F1F] focus:border-[#7C4DFF]/80'
            }`}
          />
          <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2 ${
            guiMode === 'cyberpunk' ? 'text-[#FF1A3C]' : 'text-[#777777]'
          }`} />
        </div>
      </header>

      {/* Main Screen Content Router based on Active Tab */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {/* Tab 0: Cyberpunk HUD Mode */}
        {activeTab === 'cyberpunk' && (
          <CyberpunkHudView
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayTrack={handlePlayTrack}
            onPlayPause={handleTogglePlayPause}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
        {/* Tab 1: All Tracks (Треки) */}
        {activeTab === 'tracks' && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F1F1F] shrink-0">
              <div>
                <h2 className="text-sm font-black text-[#FFFFFF] flex items-center gap-2">
                  <Music className="w-4 h-4 text-[#7C4DFF]" />
                  <span>Медиатека аудиофайлов</span>
                </h2>
                <p className="text-[10px] text-[#777777] font-mono">
                  Всего файлов: {filteredTracks.length}
                </p>
              </div>

              <button
                onClick={handleAutoFetchAllCovers}
                disabled={isFetchingCovers}
                className="px-2.5 py-1 bg-[#7C4DFF]/15 hover:bg-[#7C4DFF]/25 text-[#00E5FF] border border-[#7C4DFF]/30 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                <span>Загрузить обложки</span>
              </button>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredTracks.length === 0 ? (
                <div className="py-16 px-4 text-center space-y-4 my-auto">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-[#121212] border border-[#1F1F1F] flex items-center justify-center text-[#7C4DFF] shadow-inner">
                    <Music className="w-8 h-8 text-[#7C4DFF]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#E0E0E0]">Медиатека пуста</h3>
                    <p className="text-xs text-[#777777] max-w-xs mx-auto">
                      Загрузите файлы с устройства или просканируйте папку Загрузки для автоматического добавления аудиозаписей.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('downloads')}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#7C4DFF] to-[#00E5FF] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                      <FolderDown className="w-4 h-4" />
                      <span>Открыть Загрузки</span>
                    </button>

                    <label className="w-full sm:w-auto px-4 py-2 bg-[#121212] hover:bg-[#1A1A1A] border border-[#222222] text-[#E0E0E0] font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Plus className="w-4 h-4 text-[#00E5FF]" />
                      <span>Выбрать файлы</span>
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
                    className={`group relative flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#1A1A1A] border border-[#7C4DFF]/50 shadow-md shadow-purple-500/10'
                        : 'bg-[#121212] hover:bg-[#161616] border border-[#1F1F1F]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#0A0A0A] shrink-0 border border-[#1F1F1F]">
                        <img
                          src={track.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <div
                          className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                            isCurrent
                              ? 'bg-[#0A0A0A]/60 opacity-100'
                              : 'bg-[#0A0A0A]/40 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Play
                            className={`w-4 h-4 ${
                              isCurrent && isPlaying
                                ? 'text-[#00E5FF] animate-pulse fill-[#00E5FF]'
                                : 'text-white fill-white'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-bold truncate ${
                          isCurrent ? 'text-[#00E5FF]' : 'text-[#E0E0E0]'
                        }`}>
                          {track.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#777777]">
                          <span className="truncate">{track.artist}</span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                            track.hiResInfo.isLossless
                              ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20'
                              : 'bg-[#1F1F1F] text-[#888888]'
                          }`}>
                            {track.hiResInfo.format} {track.hiResInfo.bitDepth ? `${track.hiResInfo.bitDepth}B` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(track.id);
                        }}
                        className="p-1 text-[#777777] hover:text-rose-400"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            track.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>

                      <span className="text-[10px] font-mono text-[#777777]">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  </div>
                );
              }))}
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
          <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F1F1F] shrink-0">
              <h2 className="text-sm font-black text-[#FFFFFF] flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>Избранные Hi-Res треки</span>
              </h2>
              <span className="text-[10px] font-mono text-[#777777]">
                Всего: {favoriteTracks.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {favoriteTracks.length === 0 ? (
                <div className="py-16 text-center text-[#555555] space-y-2">
                  <Heart className="w-10 h-10 mx-auto text-[#222222]" />
                  <p className="text-xs">В избранном пока нет треков</p>
                  <p className="text-[10px] text-[#555555]">
                    Нажмите сердечко возле трека, чтобы добавить его сюда
                  </p>
                </div>
              ) : (
                favoriteTracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handlePlayTrack(track)}
                    className="flex items-center justify-between p-2.5 bg-[#121212] hover:bg-[#161616] border border-[#1F1F1F] rounded-2xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-[#E0E0E0] truncate">
                          {track.title}
                        </h4>
                        <p className="text-[10px] text-[#777777] truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#00E5FF] font-bold bg-[#00E5FF]/10 px-1.5 py-0.5 rounded border border-[#00E5FF]/20">
                        {track.hiResInfo.format}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(track.id);
                        }}
                        className="p-1 text-rose-500"
                      >
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Mini Player */}
      <MiniPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlayPause={handleTogglePlayPause}
        onNext={handleNextTrack}
        onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
        onToggleFavorite={handleToggleFavorite}
      />

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
      />

      {/* Android Bottom Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tracksCount={tracks.length}
        playlistsCount={playlists.length}
        guiMode={guiMode}
      />
    </AndroidFrame>
  );
}
