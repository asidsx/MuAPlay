import React, { useState } from 'react';
import { Plus, Play, Trash2, Music2, FolderPlus, Shuffle, Sparkles, Disc, ArrowLeft, Heart } from 'lucide-react';
import { Playlist, Track, ScannedFile } from '../types/music';
import { AddTracksToPlaylistModal } from './AddTracksToPlaylistModal';

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
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 space-y-3">
      {/* Detail View of a Selected Playlist */}
      {selectedPlaylist ? (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Header back & actions */}
          <div className="flex items-center justify-between py-1 border-b border-[#1F1F1F] pb-2">
            <button
              onClick={() => setSelectedPlaylistId(null)}
              className="flex items-center gap-1.5 text-xs text-[#00E5FF] hover:text-[#7C4DFF] font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Все плейлисты</span>
            </button>

            <button
              onClick={() => onDeletePlaylist(selectedPlaylist.id)}
              className="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить</span>
            </button>
          </div>

          {/* Playlist Info Banner */}
          <div className="py-3 flex items-center gap-3.5 border-b border-[#1F1F1F]">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-[#121212] shadow-xl border border-[#1F1F1F] shrink-0 group">
              <img
                src={selectedPlaylist.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
                alt={selectedPlaylist.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#0A0A0A]/20 group-hover:bg-transparent transition-colors" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#00E5FF]">
                Плейлист
              </span>
              <h2 className="text-lg font-black text-[#FFFFFF] truncate mt-0.5">
                {selectedPlaylist.name}
              </h2>
              <p className="text-xs text-[#777777] line-clamp-1 mt-0.5">
                {selectedPlaylist.description || 'Аудиофайлы высокого качества'}
              </p>
              <div className="text-[10px] text-[#555555] mt-1 font-mono">
                Треков: {selectedPlaylist.trackIds.length}
              </div>
            </div>
          </div>

          {/* Playlist Toolbar: Play All, Shuffle, PLUS BUTTON to Add Tracks */}
          <div className="py-2.5 flex items-center justify-between gap-2 border-b border-[#1F1F1F]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const pTracks = getPlaylistTracks(selectedPlaylist);
                  if (pTracks.length > 0) onPlayTrack(pTracks[0]);
                }}
                disabled={selectedPlaylist.trackIds.length === 0}
                className="px-3.5 py-1.5 bg-[#7C4DFF] hover:bg-[#6C3DFF] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Слушать</span>
              </button>

              <button
                onClick={() => {
                  const pTracks = getPlaylistTracks(selectedPlaylist);
                  if (pTracks.length > 0) {
                    const random = pTracks[Math.floor(Math.random() * pTracks.length)];
                    onPlayTrack(random);
                  }
                }}
                disabled={selectedPlaylist.trackIds.length === 0}
                className="p-1.5 bg-[#121212] hover:bg-[#1A1A1A] text-[#E0E0E0] rounded-xl transition-colors border border-[#1F1F1F] disabled:opacity-40"
                title="Перемешать"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>

            {/* PROMINENT PLUS (+) BUTTON TO ADD NEW FILES TO THIS PLAYLIST */}
            <button
              onClick={() => setIsAddTracksModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#7C4DFF] to-[#00E5FF] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-500/25 transition-all transform hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Добавить файлы</span>
            </button>
          </div>

          {/* Track List inside Playlist */}
          <div className="flex-1 overflow-y-auto py-2 space-y-1.5">
            {getPlaylistTracks(selectedPlaylist).length === 0 ? (
              <div className="py-12 text-center text-[#555555] space-y-3">
                <Music2 className="w-10 h-10 mx-auto text-[#222222] opacity-80" />
                <p className="text-sm font-medium text-[#777777]">Плейлист пока пуст</p>
                <p className="text-xs text-[#555555] max-w-xs mx-auto">
                  Нажмите кнопку «+ Добавить файлы», чтобы просканировать папку Загрузки и выбрать треки
                </p>
                <button
                  onClick={() => setIsAddTracksModalOpen(true)}
                  className="mt-2 px-4 py-2 bg-[#7C4DFF]/15 text-[#00E5FF] border border-[#7C4DFF]/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#7C4DFF]/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить файлы из Загрузок</span>
                </button>
              </div>
            ) : (
              getPlaylistTracks(selectedPlaylist).map((track, index) => {
                const isCurrent = currentTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    className={`group flex items-center justify-between p-2 rounded-2xl transition-all ${
                      isCurrent
                        ? 'bg-[#1A1A1A] border border-[#7C4DFF]/40 shadow-md shadow-purple-500/10'
                        : 'hover:bg-[#121212] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs font-mono text-[#555555] w-4 text-center">
                        {index + 1}
                      </span>

                      <div
                        onClick={() => onPlayTrack(track)}
                        className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#0A0A0A] shrink-0 cursor-pointer"
                      >
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

                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlayTrack(track)}>
                        <h4 className={`text-xs font-semibold truncate ${
                          isCurrent ? 'text-[#00E5FF]' : 'text-[#E0E0E0]'
                        }`}>
                          {track.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#777777]">
                          <span className="truncate">{track.artist}</span>
                          <span>•</span>
                          <span className="font-mono text-[#00E5FF] font-bold">
                            {track.hiResInfo.format}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#555555]">
                        {formatDuration(track.duration)}
                      </span>
                      <button
                        onClick={() => onRemoveTrackFromPlaylist(selectedPlaylist.id, track.id)}
                        className="text-[#555555] hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
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

          {/* Modal for adding files */}
          <AddTracksToPlaylistModal
            isOpen={isAddTracksModalOpen}
            onClose={() => setIsAddTracksModalOpen(false)}
            playlist={selectedPlaylist}
            availableFiles={availableDownloads}
            onSaveTracks={onAddTracksToPlaylist}
            onRescanDownloads={onRescanDownloads}
            isScanning={isScanning}
          />
        </div>
      ) : (
        /* List of All Playlists View */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#1F1F1F] shrink-0">
            <div>
              <h2 className="text-base font-extrabold text-[#FFFFFF] flex items-center gap-2">
                <Disc className="w-5 h-5 text-[#7C4DFF]" />
                <span>Мои Плейлисты</span>
              </h2>
              <p className="text-[11px] text-[#777777]">
                Создавайте подборки и добавляйте файлы из Загрузок
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-[#7C4DFF] to-[#00E5FF] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-purple-500/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Создать</span>
            </button>
          </div>

          {/* Grid/List of Playlists */}
          <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => setSelectedPlaylistId(playlist.id)}
                className="group relative bg-[#121212] hover:bg-[#1A1A1A] border border-[#1F1F1F] hover:border-[#7C4DFF]/40 rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all shadow-md hover:shadow-purple-500/10"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#0A0A0A] shrink-0">
                  <img
                    src={playlist.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
                    alt={playlist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-[#0A0A0A]/20 group-hover:bg-transparent" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-[#E0E0E0] group-hover:text-[#00E5FF] truncate transition-colors">
                    {playlist.name}
                  </h3>
                  <p className="text-[10px] text-[#777777] line-clamp-1 mt-0.5">
                    {playlist.description || 'Плейлист'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 font-mono font-bold">
                      {playlist.trackIds.length} треков
                    </span>
                  </div>
                </div>

                <div className="p-2 text-[#7C4DFF] opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Create New Playlist Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-[#121212] border border-[#1F1F1F] rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#FFFFFF] flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-[#7C4DFF]" />
                    <span>Новый плейлист</span>
                  </h3>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-[#777777] hover:text-[#E0E0E0]"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreatePlaylistSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#777777] block mb-1">
                      Название плейлиста
                    </label>
                    <input
                      type="text"
                      required
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Например: FLAC Night Drive"
                      className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#7C4DFF]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#777777] block mb-1">
                      Описание (опционально)
                    </label>
                    <textarea
                      rows={2}
                      value={newPlaylistDesc}
                      onChange={(e) => setNewPlaylistDesc(e.target.value)}
                      placeholder="Подборка для прослушивания..."
                      className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#7C4DFF] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-3 py-1.5 text-xs text-[#777777] hover:text-[#E0E0E0]"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#7C4DFF] hover:bg-[#6C3DFF] text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20"
                    >
                      Создать плейлист
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
