import React, { useState, useEffect } from 'react';
import { Play, Square, Check, X, Search, Music2, Plus, Sparkles, Heart } from 'lucide-react';
import { Track } from '../types/music';
import { audioEngine } from '../services/audioEngine';
import { getPlayableTrackUrl } from '../services/audioStorage';
import { CyberCoverImage } from './CyberCoverImage';

interface AddTracksToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistName: string;
  availableTracks: Track[];
  existingTrackIds: string[];
  onAddTracks: (selectedTrackIds: string[]) => void;
}

export const AddTracksToPlaylistModal: React.FC<AddTracksToPlaylistModalProps> = ({
  isOpen,
  onClose,
  playlistName,
  availableTracks,
  existingTrackIds = [],
  onAddTracks,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'favorites'>('all');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setPreviewingId(null);
      setSearchQuery('');
      setActiveTab('all');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const existingSet = new Set(existingTrackIds);

  const filteredTracks = availableTracks.filter((track) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      (track.album && track.album.toLowerCase().includes(q)) ||
      track.hiResInfo?.format.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeTab === 'new') {
      return !existingSet.has(track.id);
    }
    if (activeTab === 'favorites') {
      return !!track.isFavorite;
    }

    return true;
  });

  const toggleSelectTrack = (trackId: string) => {
    // If already in playlist, user can still toggle or see it's in shard
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const selectableTracks = filteredTracks.filter((t) => !existingSet.has(t.id));

  const toggleSelectAll = () => {
    const allSelectableChosen =
      selectableTracks.length > 0 && selectableTracks.every((t) => selectedIds.has(t.id));

    if (allSelectableChosen) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableTracks.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        selectableTracks.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  const handlePlayPreview = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (previewingId === track.id) {
      audioEngine.stopPreview();
      setPreviewingId(null);
    } else {
      const playUrl = await getPlayableTrackUrl(track);
      if (!playUrl) return;
      setPreviewingId(track.id);
      audioEngine.playPreview(playUrl, track.id, () => {
        setPreviewingId(null);
      });
    }
  };

  const handleSave = () => {
    audioEngine.stopPreview();
    const chosen = Array.from(selectedIds);
    onAddTracks(chosen);
    onClose();
  };

  const handleClose = () => {
    audioEngine.stopPreview();
    setPreviewingId(null);
    onClose();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 font-mono animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-[#100308] border-2 border-[#FF1A3C] sm:rounded-2xl rounded-t-2xl shadow-[0_0_30px_rgba(255,26,60,0.4)] flex flex-col max-h-[90vh] sm:max-h-[82vh] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-[#18040C] border-b border-[#FF1A3C]/40 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <Music2 className="w-4 h-4 text-[#FF1A3C]" />
              <h3 className="text-xs font-black text-[#FFFFFF] tracking-wider">
                [ ДОБАВЛЕНИЕ В ШАРД ИЗ МЕДИАТЕКИ ]
              </h3>
            </div>
            <p className="text-[10px] text-[#00E5FF] font-bold mt-0.5">
              ШАРД: «{playlistName}»
            </p>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#882233] hover:text-[#FF1A3C] hover:bg-[#250412] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters and Search */}
        <div className="p-2.5 bg-[#120308] border-b border-[#FF1A3C]/30 space-y-2 shrink-0">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#FF1A3C] text-black shadow-[0_0_10px_rgba(255,26,60,0.4)]'
                  : 'bg-[#18040C] text-[#883344] hover:text-white border border-[#FF1A3C]/30'
              }`}
            >
              ВСЕ В ПЛЕЕРЕ ({availableTracks.length})
            </button>

            <button
              onClick={() => setActiveTab('new')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'new'
                  ? 'bg-[#00E5FF] text-black shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                  : 'bg-[#18040C] text-[#883344] hover:text-[#00E5FF] border border-[#FF1A3C]/30'
              }`}
            >
              ЕЩЁ НЕ В ШАРДЕ ({availableTracks.filter((t) => !existingSet.has(t.id)).length})
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'favorites'
                  ? 'bg-[#FF4D6D] text-black shadow-[0_0_10px_rgba(255,77,109,0.4)]'
                  : 'bg-[#18040C] text-[#883344] hover:text-[#FF4D6D] border border-[#FF1A3C]/30'
              }`}
            >
              <Heart className="w-2.5 h-2.5 inline fill-current" />
              <span>ИЗБРАННОЕ ({availableTracks.filter((t) => t.isFavorite).length})</span>
            </button>
          </div>

          {/* Search bar & Select All */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#882233] absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ПОИСК ПО НАЗВАНИЮ, АРТИСТУ..."
                className="w-full bg-[#080104] border border-[#FF1A3C]/40 rounded-lg pl-8 pr-2.5 py-1 text-[10px] text-white placeholder-[#552233] focus:outline-none focus:border-[#00E5FF]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-[#882233] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {selectableTracks.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="px-2.5 py-1 bg-[#18040C] hover:bg-[#250412] text-[#00E5FF] border border-[#00E5FF]/40 rounded-lg text-[9px] font-bold shrink-0 active:scale-95 transition-all"
              >
                {selectableTracks.every((t) => selectedIds.has(t.id))
                  ? 'СБРОСИТЬ'
                  : 'ВЫБРАТЬ ВСЕ'}
              </button>
            )}
          </div>
        </div>

        {/* Tracks List from Player Library */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {availableTracks.length === 0 ? (
            <div className="py-12 text-center text-[#883344] space-y-2">
              <Music2 className="w-8 h-8 mx-auto opacity-40 text-[#FF1A3C]" />
              <p className="text-xs font-bold">[ МЕДИАТЕКА ПЛЕЕРА ПУСТА ]</p>
              <p className="text-[9px] text-[#662233] max-w-xs mx-auto">
                Сначала загрузите треки в плеер через вкладку «МЕДИАТЕКА» (сканированием или загрузкой файлов)
              </p>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="py-10 text-center text-[#883344] space-y-1.5">
              <p className="text-xs">[ ТРЕКИ НЕ НАЙДЕНЫ ]</p>
              <p className="text-[9px] text-[#662233]">Измените параметры поиска или фильтр</p>
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isAlreadyInPlaylist = existingSet.has(track.id);
              const isChecked = selectedIds.has(track.id);
              const isPreviewing = previewingId === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => {
                    if (!isAlreadyInPlaylist) {
                      toggleSelectTrack(track.id);
                    }
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                    isAlreadyInPlaylist
                      ? 'bg-[#14040A]/60 border-[#FF1A3C]/20 opacity-70 cursor-default'
                      : isChecked
                      ? 'bg-[#1F0410] border-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.25)]'
                      : 'bg-[#120308] border-[#FF1A3C]/30 hover:border-[#FF1A3C]/70'
                  }`}
                >
                  {/* Left: Preview button, Cover, Info */}
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <button
                      type="button"
                      onClick={(e) => handlePlayPreview(e, track)}
                      title={isPreviewing ? 'Остановить' : 'Прослушать'}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all border ${
                        isPreviewing
                          ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-[0_0_8px_#00E5FF]'
                          : 'bg-[#1A040D] text-[#FF1A3C] border-[#FF1A3C]/40 hover:border-[#FF1A3C]'
                      }`}
                    >
                      {isPreviewing ? (
                        <Square className="w-3 h-3 fill-black" />
                      ) : (
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#0A0206] shrink-0 border border-[#FF1A3C]/30">
                      <CyberCoverImage
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isChecked ? 'text-[#00E5FF]' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </h4>

                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-[#883344]">
                        <span className="truncate max-w-[110px]">{track.artist}</span>
                        <span>•</span>
                        <span className="px-1 py-0.2 rounded font-bold text-[8px] bg-[#FF1A3C]/20 text-[#FF1A3C] border border-[#FF1A3C]/40">
                          {track.hiResInfo?.format || 'AUDIO'}
                        </span>
                        <span>•</span>
                        <span>{formatDuration(track.duration)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status badge or Checkbox */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isAlreadyInPlaylist ? (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30">
                        В ШАРДЕ
                      </span>
                    ) : (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectTrack(track.id);
                        }}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#00E5FF] border-[#00E5FF] text-black shadow-[0_0_6px_#00E5FF]'
                            : 'bg-[#080104] border-[#FF1A3C]/40 text-transparent hover:border-[#FF1A3C]'
                        }`}
                      >
                        <Check className={`w-3.5 h-3.5 stroke-[3] ${isChecked ? 'block' : 'hidden'}`} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#18040C] border-t border-[#FF1A3C]/40 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-[#883344]">
            ВЫБРАНО ДЛЯ ДОБАВЛЕНИЯ:{' '}
            <span className="font-black text-[#00E5FF] ml-1">
              {selectedIds.size}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#883344] hover:text-white bg-[#0A0206] border border-[#FF1A3C]/30 transition-colors"
            >
              ОТМЕНА
            </button>

            <button
              onClick={handleSave}
              disabled={selectedIds.size === 0}
              className="px-4 py-1.5 rounded-lg bg-[#FF1A3C] hover:bg-[#FF0033] text-black font-black text-[10px] flex items-center gap-1 shadow-[0_0_10px_rgba(255,26,60,0.6)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ДОБАВИТЬ В ШАРД (+{selectedIds.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
