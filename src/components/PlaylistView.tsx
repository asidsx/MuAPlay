import React, { useState } from 'react';
import { Plus, Play, Trash2, FolderPlus, ArrowLeft, Disc, Music2, Cpu, Download, Upload, FileCode } from 'lucide-react';
import { Playlist, Track, ScannedFile } from '../types/music';
import { AddTracksToPlaylistModal } from './AddTracksToPlaylistModal';
import { downloadM3UFile, parseM3U, downloadLibraryBackup } from '../services/playlistExport';

interface PlaylistViewProps {
  playlists: Playlist[];
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onCreatePlaylist: (name: string, description: string) => void;
  onDeletePlaylist: (id: string) => void;
  onAddTracksToPlaylist: (playlistId: string, selectedFiles: ScannedFile[]) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  onImportPlaylist?: (name: string, trackIds: string[]) => void;
  availableDownloads: ScannedFile[];
  onRescanDownloads: () => void;
  isScanning: boolean;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlists,
  tracks,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddTracksToPlaylist,
  onRemoveTrackFromPlaylist,
  onImportPlaylist,
  availableDownloads,
  onRescanDownloads,
  isScanning,
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 p-3 space-y-3 font-mono">
      {/* Detail View of a Selected Playlist */}
      {selectedPlaylist ? (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Header back & actions */}
          <div className="flex items-center justify-between py-1 border-b border-[#FF1A3C]/30 pb-2">
            <button
              onClick={() => setSelectedPlaylistId(null)}
              className="flex items-center gap-1.5 text-xs text-[#00E5FF] hover:text-white font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>// ВСЕ ШАРДЫ</span>
            </button>

            <button
              onClick={() => onDeletePlaylist(selectedPlaylist.id)}
              className="text-xs text-[#FF1A3C] hover:text-rose-400 p-1.5 rounded-lg bg-[#18040C] border border-[#FF1A3C]/30 hover:border-[#FF1A3C] transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>УДАЛИТЬ</span>
            </button>
          </div>

          {/* Playlist Info Banner */}
          <div className="py-3 flex items-center gap-3.5 border-b border-[#FF1A3C]/30">
            <div className="relative w-18 h-18 rounded-xl overflow-hidden bg-[#100308] shadow-lg border border-[#FF1A3C]/50 shrink-0">
              <img
                src={selectedPlaylist.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
                alt={selectedPlaylist.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[9px] uppercase tracking-wider font-bold text-[#FF1A3C]">
                [ DATA_SHARD // MEMORY ]
              </span>
              <h3 className="text-sm font-black text-[#FFFFFF] truncate mt-0.5">
                {selectedPlaylist.name}
              </h3>
              <p className="text-[10px] text-[#883344] truncate">
                {selectedPlaylist.description || 'Нейро-плейлист'}
              </p>
              <p className="text-[9px] text-[#00E5FF] mt-1 font-bold">
                ТРЕКОВ В ШАРДЕ: {selectedPlaylist.trackIds.length}
              </p>
            </div>
          </div>

          {/* Action Buttons: Add tracks & Export M3U */}
          <div className="py-2 flex items-center justify-between gap-2">
            <button
              onClick={() => setIsAddTracksModalOpen(true)}
              className="px-3 py-1.5 bg-[#FF1A3C] hover:bg-[#FF0033] text-black rounded-lg font-black text-[11px] flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(255,26,60,0.5)] active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ЗАГРУЗИТЬ В ШАРД</span>
            </button>

            <button
              onClick={() => downloadM3UFile(selectedPlaylist, tracks)}
              className="px-2.5 py-1.5 bg-[#18040C] hover:bg-[#250412] text-[#00E5FF] border border-[#00E5FF]/40 hover:border-[#00E5FF] rounded-lg font-bold text-[10px] flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Экспортировать плейлист в файл .m3u8"
            >
              <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>ЭКСПОРТ .M3U</span>
            </button>
          </div>

          {/* Tracks inside playlist */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {getPlaylistTracks(selectedPlaylist).length === 0 ? (
              <div className="py-12 text-center text-[#883344] space-y-2 border border-dashed border-[#FF1A3C]/30 rounded-xl my-auto">
                <Music2 className="w-8 h-8 mx-auto opacity-40 text-[#FF1A3C]" />
                <p className="text-xs">[ ШАРД ПУСТ. ДОБАВЬТЕ АУДИОТРЕКИ ]</p>
              </div>
            ) : (
              getPlaylistTracks(selectedPlaylist).map((track) => {
                const isCurrent = currentTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => onPlayTrack(track)}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                      isCurrent
                        ? 'bg-[#1A040D] border-[#FF1A3C] shadow-[0_0_10px_rgba(255,26,60,0.3)]'
                        : 'bg-[#120308] border-[#FF1A3C]/30 hover:border-[#FF1A3C]/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-[#00E5FF]' : 'text-white'}`}>
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-[#883344] truncate">{track.artist}</p>
                    </div>

                    <div className="flex items-center gap-2">
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
          <div className="flex items-center justify-between pb-2 border-b border-[#FF1A3C]/30">
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
                        // match track IDs
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
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {playlists.length === 0 ? (
              <div className="py-16 text-center text-[#883344] space-y-3 my-auto">
                <Cpu className="w-12 h-12 mx-auto opacity-40 text-[#FF1A3C]" />
                <h3 className="text-xs font-bold text-white">[ НЕТ ДАТА-ШАРДОВ ]</h3>
                <p className="text-[10px] text-[#883344]">
                  Создайте новый дата-шард для группировки аудиофайлов.
                </p>
              </div>
            ) : (
              playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className="bg-[#120308] border border-[#FF1A3C]/35 hover:border-[#FF1A3C] rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#0A0206] border border-[#FF1A3C]/40 shrink-0">
                      <img
                        src={pl.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
                        alt={pl.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-white group-hover:text-[#00E5FF] transition-colors truncate">
                        {pl.name}
                      </h4>
                      <p className="text-[10px] text-[#883344] truncate mt-0.5">
                        {pl.description || 'Нейро-плейлист'}
                      </p>
                      <span className="inline-block mt-1 text-[8px] px-1.5 py-0.2 rounded font-bold bg-[#FF1A3C]/20 text-[#FF1A3C] border border-[#FF1A3C]/40">
                        {pl.trackIds.length} ТРЕКОВ
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const tracksInPl = getPlaylistTracks(pl);
                      if (tracksInPl.length > 0) onPlayTrack(tracksInPl[0]);
                    }}
                    className="w-8 h-8 rounded-lg bg-[#FF1A3C] text-black flex items-center justify-center shadow-[0_0_8px_rgba(255,26,60,0.5)] hover:scale-105 transition-transform shrink-0"
                    title="Воспроизвести шард"
                  >
                    <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                  </button>
                </div>
              ))
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
                  НАИМЕНОВАНИЕ ШАРДА
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
                  placeholder="напр., Саундтрек для поездок"
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

      {/* Modal: Add Tracks to Playlist */}
      {selectedPlaylist && isAddTracksModalOpen && (
        <AddTracksToPlaylistModal
          isOpen={isAddTracksModalOpen}
          onClose={() => setIsAddTracksModalOpen(false)}
          playlistName={selectedPlaylist.name}
          availableDownloads={availableDownloads}
          existingTrackIds={selectedPlaylist.trackIds}
          onAddTracks={(selectedFiles) => {
            onAddTracksToPlaylist(selectedPlaylist.id, selectedFiles);
            setIsAddTracksModalOpen(false);
          }}
          onRescanDownloads={onRescanDownloads}
          isScanning={isScanning}
        />
      )}
    </div>
  );
};
