import React, { useState } from 'react';
import {
  Plus,
  Play,
  Pause,
  Trash2,
  ArrowLeft,
  Disc,
  Music2,
  Cpu,
  Download,
  Upload,
  FileCode,
  Shuffle,
  ListMusic,
  Activity,
} from 'lucide-react';
import { Playlist, Track } from '../types/music';
import { AddTracksToPlaylistModal } from './AddTracksToPlaylistModal';
import { downloadM3UFile, parseM3U, downloadLibraryBackup } from '../services/playlistExport';
import { CyberCoverImage } from './CyberCoverImage';

interface PlaylistViewProps {
  playlists: Playlist[];
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  activePlaylistId?: string | null;
  onTogglePlay?: () => void;
  onPlayTrack: (track: Track) => void;
  onPlayPlaylist: (playlist: Playlist, startIndex?: number, shuffle?: boolean) => void;
  onCreatePlaylist: (name: string, description: string) => void;
  onDeletePlaylist: (id: string) => void;
  onAddTracksToPlaylist: (playlistId: string, selectedTrackIds: string[]) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  onImportPlaylist?: (name: string, trackIds: string[]) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlists,
  tracks,
  currentTrackId,
  isPlaying,
  activePlaylistId,
  onTogglePlay,
  onPlayTrack,
  onPlayPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddTracksToPlaylist,
  onRemoveTrackFromPlaylist,
  onImportPlaylist,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isAddTracksModalOpen, setIsAddTracksModalOpen] = useState(false);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreateModalOpen(false);
  };

  const getPlaylistTracks = (playlist: Playlist): Track[] => {
    return playlist.trackIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is Track => t !== undefined);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isSelectedPlaylistActive = selectedPlaylist
    ? activePlaylistId === selectedPlaylist.id
    : false;
  const isSelectedPlaylistPlaying = isSelectedPlaylistActive && isPlaying;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 p-3 space-y-3 font-mono">
      {/* Detail View of a Selected Playlist */}
      {selectedPlaylist ? (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Header back & actions */}
          <div className="flex items-center justify-between py-1 border-b border-[#FF1A3C]/30 pb-2 shrink-0">
            <button
              onClick={() => setSelectedPlaylistId(null)}
              className="flex items-center gap-1.5 text-xs text-[#00E5FF] hover:text-white font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>// ВСЕ ШАРДЫ</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Удалить плейлист «${selectedPlaylist.name}»?`)) {
                  onDeletePlaylist(selectedPlaylist.id);
                  setSelectedPlaylistId(null);
                }
              }}
              className="text-xs text-[#FF1A3C] hover:text-rose-400 p-1.5 rounded-lg bg-[#18040C] border border-[#FF1A3C]/30 hover:border-[#FF1A3C] transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>УДАЛИТЬ</span>
            </button>
          </div>

          {/* Playlist Info Banner */}
          <div
            className={`py-3 flex items-center gap-3.5 border-b rounded-xl p-2.5 my-1 transition-all ${
              isSelectedPlaylistActive
                ? 'bg-[#18030B] border-[#FF1A3C] shadow-[0_0_15px_rgba(255,26,60,0.25)]'
                : 'border-[#FF1A3C]/30'
            } shrink-0`}
          >
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#100308] shadow-lg border border-[#FF1A3C]/50 shrink-0">
              <CyberCoverImage
                src={selectedPlaylist.coverUrl || getPlaylistTracks(selectedPlaylist)[0]?.coverUrl}
                alt={selectedPlaylist.name}
                className="w-full h-full object-cover"
              />
              {isSelectedPlaylistPlaying && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-4">
                    <span className="w-1 bg-[#00E5FF] animate-[pulse_0.6s_ease-in-out_infinite] h-3 rounded-full" />
                    <span className="w-1 bg-[#FF1A3C] animate-[pulse_0.4s_ease-in-out_infinite] h-4 rounded-full" />
                    <span className="w-1 bg-[#00E5FF] animate-[pulse_0.8s_ease-in-out_infinite] h-2 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {isSelectedPlaylistPlaying ? (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#00E5FF] flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#00E5FF] animate-spin" />
                    [ АКТИВНОЕ ВОСПРОИЗВЕДЕНИЕ ]
                  </span>
                ) : isSelectedPlaylistActive ? (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#FF8095]">
                    [ НА ПАУЗЕ // ТЕКУЩИЙ ШАРД ]
                  </span>
                ) : (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#FF1A3C]">
                    [ DATA_SHARD // MEMORY ]
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-[#FFFFFF] truncate mt-0.5">
                {selectedPlaylist.name}
              </h3>
              <p className="text-[10px] text-[#883344] truncate">
                {selectedPlaylist.description || 'Нейро-плейлист'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-[#00E5FF] font-bold">
                  ТРЕКОВ: {getPlaylistTracks(selectedPlaylist).length}
                </span>
                <span className="text-[9px] text-[#883344]">•</span>
                <span className="text-[9px] text-[#FF4D6D] flex items-center gap-1">
                  <ListMusic className="w-3 h-3 inline" />
                  <span>АВТО-ОЧЕРЕДЬ ВКЛЮЧЕНА</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Play All / Pause, Shuffle, Add Tracks, Export M3U */}
          <div className="py-2.5 flex items-center flex-wrap gap-2 shrink-0">
            {getPlaylistTracks(selectedPlaylist).length > 0 && (
              <>
                <button
                  onClick={() => onPlayPlaylist(selectedPlaylist, 0, false)}
                  className={`px-3 py-1.5 rounded-lg font-black text-[10px] sm:text-[11px] flex items-center gap-1.5 transition-all active:scale-95 ${
                    isSelectedPlaylistPlaying
                      ? 'bg-[#00E5FF] hover:bg-[#33EAFF] text-black shadow-[0_0_15px_rgba(0,229,255,0.6)] ring-1 ring-[#00E5FF]'
                      : 'bg-[#FF1A3C] hover:bg-[#FF0033] text-black shadow-[0_0_12px_rgba(255,26,60,0.5)]'
                  }`}
                  title={
                    isSelectedPlaylistPlaying
                      ? 'Приостановить воспроизведение плейлиста'
                      : 'Воспроизвести весь плейлист и загрузить его в очередь'
                  }
                >
                  {isSelectedPlaylistPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-black" />
                      <span>ПАУЗА</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>СЛУШАТЬ ВСЁ</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onPlayPlaylist(selectedPlaylist, 0, true)}
                  className="px-2.5 py-1.5 bg-[#18040C] hover:bg-[#250412] text-[#00E5FF] border border-[#00E5FF]/40 hover:border-[#00E5FF] rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all active:scale-95"
                  title="Перемешать треки плейлиста и загрузить в очередь"
                >
                  <Shuffle className="w-3 h-3 text-[#00E5FF]" />
                  <span>ПЕРЕМЕШАТЬ</span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsAddTracksModalOpen(true)}
              className="px-2.5 py-1.5 bg-[#18040C] hover:bg-[#250412] text-[#FF4D6D] border border-[#FF1A3C]/40 hover:border-[#FF1A3C] rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all active:scale-95"
              title="Выбрать песни из уже загруженных в плеер"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ ИЗ МЕДИАТЕКИ</span>
            </button>

            <button
              onClick={() => downloadM3UFile(selectedPlaylist, tracks)}
              className="px-2 py-1.5 bg-[#18040C] hover:bg-[#250412] text-[#883344] hover:text-[#00E5FF] border border-[#FF1A3C]/20 hover:border-[#00E5FF]/40 rounded-lg font-bold text-[9px] flex items-center gap-1 transition-all ml-auto"
              title="Экспортировать плейлист в файл .m3u8"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">ЭКСПОРТ .M3U</span>
            </button>
          </div>

          {/* Tracks inside playlist */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
            {getPlaylistTracks(selectedPlaylist).length === 0 ? (
              <div className="py-12 text-center text-[#883344] space-y-3 border border-dashed border-[#FF1A3C]/30 rounded-xl my-auto">
                <Music2 className="w-8 h-8 mx-auto opacity-40 text-[#FF1A3C]" />
                <p className="text-xs font-bold">[ ШАРД ПУСТ ]</p>
                <p className="text-[9px] text-[#662233] max-w-xs mx-auto">
                  Нажмите кнопку «+ ИЗ МЕДИАТЕКИ», чтобы добавить песни из аудиоплеера
                </p>
                <button
                  onClick={() => setIsAddTracksModalOpen(true)}
                  className="px-3 py-1.5 bg-[#FF1A3C] text-black font-black text-[10px] rounded-lg shadow-[0_0_10px_rgba(255,26,60,0.4)]"
                >
                  ДОБАВИТЬ ПЕСНИ ИЗ ПЛЕЕРА
                </button>
              </div>
            ) : (
              getPlaylistTracks(selectedPlaylist).map((track, idx) => {
                const isCurrentInThisPlaylist = isSelectedPlaylistActive && currentTrackId === track.id;
                const isTrackPlaying = isCurrentInThisPlaylist && isPlaying;
                return (
                  <div
                    key={`${selectedPlaylist.id}-${track.id}-${idx}`}
                    onClick={() => {
                      if (isCurrentInThisPlaylist) {
                        if (onTogglePlay) onTogglePlay();
                        else onPlayTrack(track);
                      } else {
                        onPlayPlaylist(selectedPlaylist, idx, false);
                      }
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border group ${
                      isCurrentInThisPlaylist
                        ? 'bg-[#1A040D] border-[#FF1A3C] shadow-[0_0_10px_rgba(255,26,60,0.3)] ring-1 ring-[#FF1A3C]/40'
                        : 'bg-[#120308] border-[#FF1A3C]/30 hover:border-[#FF1A3C]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      <span className="text-[9px] font-mono text-[#662233] w-5 text-center shrink-0 flex items-center justify-center">
                        {isTrackPlaying ? (
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.5 bg-[#00E5FF] h-2.5 animate-bounce" />
                            <span className="w-0.5 bg-[#FF1A3C] h-3 animate-pulse" />
                            <span className="w-0.5 bg-[#00E5FF] h-1.5 animate-bounce delay-75" />
                          </div>
                        ) : isCurrentInThisPlaylist ? (
                          <Pause className="w-3 h-3 text-[#FF1A3C]" />
                        ) : (
                          idx + 1
                        )}
                      </span>

                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#0A0206] shrink-0 border border-[#FF1A3C]/30 relative">
                        <CyberCoverImage
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isCurrentInThisPlaylist ? 'text-[#00E5FF]' : 'text-white group-hover:text-[#FF4D6D]'
                          }`}
                        >
                          {track.title}
                        </h4>
                        <p className="text-[10px] text-[#883344] truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-[#883344] font-mono">
                        {formatDuration(track.duration)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrackFromPlaylist(selectedPlaylist.id, track.id);
                        }}
                        className="p-1 text-[#882233] hover:text-[#FF1A3C] rounded transition-colors"
                        title="Удалить из плейлиста"
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
      ) : (
        /* List of All Playlists */
        <div className="flex-1 flex flex-col overflow-hidden space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#FF1A3C]/30 shrink-0">
            <div>
              <h2 className="text-xs font-black text-[#FFFFFF] flex items-center gap-1.5 tracking-wider">
                <Disc className="w-4 h-4 text-[#FF1A3C]" />
                <span>MEMORY_SHARDS // ДАТА-БАНК</span>
              </h2>
              <p className="text-[9px] text-[#883344]">
                АКТИВНЫХ ШАРДОВ: {playlists.length}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <label
                className="px-2 py-1 bg-[#18040C] hover:bg-[#250412] text-[#00E5FF] border border-[#00E5FF]/40 hover:border-[#00E5FF] rounded-lg font-bold text-[9px] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Импортировать плейлист из файла .m3u / .m3u8"
              >
                <Upload className="w-3 h-3 text-[#00E5FF]" />
                <span>ИМПОРТ .M3U</span>
                <input
                  type="file"
                  accept=".m3u,.m3u8"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      if (text) {
                        const parsed = parseM3U(text);
                        const matchedIds: string[] = [];
                        parsed.entries.forEach((entry) => {
                          const match = tracks.find(
                            (t) =>
                              t.title.toLowerCase() === entry.title.toLowerCase() ||
                              (entry.artist && t.artist.toLowerCase() === entry.artist.toLowerCase()) ||
                              (t.filePath && t.filePath.includes(entry.filename))
                          );
                          if (match) matchedIds.push(match.id);
                        });
                        if (onImportPlaylist) {
                          onImportPlaylist(parsed.name, matchedIds);
                        } else {
                          onCreatePlaylist(parsed.name, `Импортировано из ${file.name}`);
                        }
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>

              <button
                onClick={() => downloadLibraryBackup(tracks, playlists)}
                className="px-2 py-1 bg-[#18040C] hover:bg-[#250412] text-[#FF8095] border border-[#FF1A3C]/30 hover:border-[#FF1A3C] rounded-lg font-bold text-[9px] flex items-center gap-1 transition-all active:scale-95"
                title="Экспортировать полную резервную копию библиотеки (JSON)"
              >
                <FileCode className="w-3 h-3 text-[#FF1A3C]" />
                <span>БЭКАП</span>
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-2.5 py-1 bg-[#FF1A3C] hover:bg-[#FF0033] text-black rounded-lg font-black text-[10px] flex items-center gap-1 transition-all shadow-[0_0_8px_rgba(255,26,60,0.5)] active:scale-95"
              >
                <Plus className="w-3 h-3" />
                <span>СОЗДАТЬ</span>
              </button>
            </div>
          </div>

          {/* Grid/List of Playlists */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {playlists.length === 0 ? (
              <div className="py-16 text-center text-[#883344] space-y-3 my-auto">
                <Cpu className="w-12 h-12 mx-auto opacity-40 text-[#FF1A3C]" />
                <h3 className="text-xs font-bold text-white">[ НЕТ ДАТА-ШАРДОВ ]</h3>
                <p className="text-[10px] text-[#883344]">
                  Создайте новый дата-шард для группировки аудиофайлов из вашей медиатеки.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-[#FF1A3C] text-black rounded-xl font-black text-xs shadow-[0_0_12px_rgba(255,26,60,0.5)]"
                >
                  + СОЗДАТЬ ПЕРВЫЙ ПЛЕЙЛИСТ
                </button>
              </div>
            ) : (
              playlists.map((pl) => {
                const plTracks = getPlaylistTracks(pl);
                const isThisPlActive = activePlaylistId === pl.id;
                const isThisPlPlaying = isThisPlActive && isPlaying;

                return (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    className={`border rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all group shadow-sm ${
                      isThisPlActive
                        ? 'bg-[#18030B] border-[#FF1A3C] shadow-[0_0_15px_rgba(255,26,60,0.25)] ring-1 ring-[#FF1A3C]/50'
                        : 'bg-[#120308] border-[#FF1A3C]/35 hover:border-[#FF1A3C]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#0A0206] border border-[#FF1A3C]/40 shrink-0">
                        <CyberCoverImage
                          src={pl.coverUrl || plTracks[0]?.coverUrl}
                          alt={pl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isThisPlPlaying && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 bg-[#00E5FF] h-2.5 animate-bounce" />
                              <span className="w-0.5 bg-[#FF1A3C] h-3 animate-pulse" />
                              <span className="w-0.5 bg-[#00E5FF] h-1.5 animate-bounce delay-75" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-white group-hover:text-[#00E5FF] transition-colors truncate">
                            {pl.name}
                          </h4>
                          {isThisPlPlaying && (
                            <span className="px-1.5 py-0.2 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50 text-[7px] font-bold animate-pulse">
                              [ В ЭФИРЕ ]
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#883344] truncate mt-0.5">
                          {pl.description || 'Нейро-плейлист'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-block text-[8px] px-1.5 py-0.2 rounded font-bold bg-[#FF1A3C]/20 text-[#FF1A3C] border border-[#FF1A3C]/40">
                            {pl.trackIds.length} ТРЕКОВ
                          </span>
                          {plTracks.length > 0 && (
                            <span className="text-[8px] text-[#00E5FF] font-mono">
                              {formatDuration(
                                plTracks.reduce((acc, t) => acc + (t.duration || 0), 0)
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayPlaylist(pl, 0, false);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 hover:scale-105 active:scale-95 ${
                        isThisPlPlaying
                          ? 'bg-[#00E5FF] hover:bg-[#33EAFF] text-black shadow-[0_0_12px_rgba(0,229,255,0.6)]'
                          : 'bg-[#FF1A3C] hover:bg-[#00E5FF] text-black shadow-[0_0_8px_rgba(255,26,60,0.5)]'
                      }`}
                      title={
                        isThisPlPlaying
                          ? 'Приостановить воспроизведение плейлиста'
                          : 'Воспроизвести шард и загрузить очередь'
                      }
                    >
                      {isThisPlPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-black" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Shard */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#100308] border-2 border-[#FF1A3C] rounded-2xl p-4 w-full max-w-sm space-y-3 shadow-[0_0_30px_rgba(255,26,60,0.4)]">
            <h3 className="text-xs font-black text-[#FFFFFF] tracking-wider">
              [ ИНИЦИАЛИЗАЦИЯ ДАТА-ШАРДА ]
            </h3>
            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-[#FF4D6D] block mb-1">
                  НАЗВАНИЕ ШАРДА
                </label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="напр., NIGHT_CITY_MIX"
                  className="w-full bg-[#080104] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-white placeholder-[#552233] focus:outline-none focus:border-[#FF1A3C]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#FF4D6D] block mb-1">
                  ОПИСАНИЕ
                </label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="напр., Саундтрек для ночных поездок"
                  className="w-full bg-[#080104] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-white placeholder-[#552233] focus:outline-none focus:border-[#FF1A3C]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-[#18040C] border border-[#FF1A3C]/30 text-[#883344] rounded-lg text-[10px] font-bold"
                >
                  ОТМЕНА
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#FF1A3C] text-black rounded-lg text-[10px] font-black shadow-[0_0_10px_rgba(255,26,60,0.6)]"
                >
                  СОЗДАТЬ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Tracks from Player Library to Playlist */}
      {selectedPlaylist && isAddTracksModalOpen && (
        <AddTracksToPlaylistModal
          isOpen={isAddTracksModalOpen}
          onClose={() => setIsAddTracksModalOpen(false)}
          playlistName={selectedPlaylist.name}
          availableTracks={tracks}
          existingTrackIds={selectedPlaylist.trackIds}
          onAddTracks={(chosenTrackIds) => {
            onAddTracksToPlaylist(selectedPlaylist.id, chosenTrackIds);
            setIsAddTracksModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
