import React, { useState, useEffect } from 'react';
import { Play, Square, Check, X, Search, FolderDown, RefreshCw, Music, Sparkles } from 'lucide-react';
import { ScannedFile, Playlist } from '../types/music';
import { audioEngine } from '../services/audioEngine';

interface AddTracksToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
  availableFiles: ScannedFile[];
  onSaveTracks: (playlistId: string, selectedFiles: ScannedFile[]) => void;
  onRescanDownloads: () => void;
  isScanning: boolean;
}

export const AddTracksToPlaylistModal: React.FC<AddTracksToPlaylistModalProps> = ({
  isOpen,
  onClose,
  playlist,
  availableFiles,
  onSaveTracks,
  onRescanDownloads,
  isScanning,
}) => {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingPath, setPreviewingPath] = useState<string | null>(null);

  // Initialize checkboxes for files already in playlist if mapped
  useEffect(() => {
    if (isOpen) {
      setSelectedPaths(new Set());
      setPreviewingPath(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredFiles = availableFiles.filter((file) => {
    const q = searchQuery.toLowerCase();
    return (
      file.name.toLowerCase().includes(q) ||
      (file.title && file.title.toLowerCase().includes(q)) ||
      (file.artist && file.artist.toLowerCase().includes(q)) ||
      file.hiResInfo.format.toLowerCase().includes(q)
    );
  });

  const toggleSelectTrack = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPaths.size === filteredFiles.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(filteredFiles.map((f) => f.path)));
    }
  };

  const handlePlayPreview = (e: React.MouseEvent, file: ScannedFile) => {
    e.stopPropagation();
    if (previewingPath === file.path) {
      audioEngine.stopPreview();
      setPreviewingPath(null);
    } else {
      setPreviewingPath(file.path);
      audioEngine.playPreview(file.previewUrl, file.path, () => {
        setPreviewingPath(null);
      });
    }
  };

  const handleSave = () => {
    audioEngine.stopPreview();
    const selectedFiles = availableFiles.filter((f) => selectedPaths.has(f.path));
    onSaveTracks(playlist.id, selectedFiles);
    onClose();
  };

  const handleClose = () => {
    audioEngine.stopPreview();
    setPreviewingPath(null);
    onClose();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-[#121212] border border-[#1F1F1F] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[82vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0A0A0A]/90 border-b border-[#1F1F1F] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
              <h3 className="text-base font-bold text-[#FFFFFF] flex items-center gap-1.5">
                Добавить треки в плейлист
              </h3>
            </div>
            <p className="text-xs text-[#00E5FF] font-medium mt-0.5">
              Плейлист: «{playlist.name}»
            </p>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full text-[#777777] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan & Search Controls */}
        <div className="p-3 bg-[#0A0A0A]/60 border-b border-[#1F1F1F] space-y-2.5 shrink-0">
          {/* Downloads folder path info & Rescan */}
          <div className="flex items-center justify-between bg-[#121212] px-3 py-2 rounded-xl border border-[#1F1F1F] text-xs">
            <div className="flex items-center gap-2 text-[#E0E0E0] truncate">
              <FolderDown className="w-4 h-4 text-[#00E5FF] shrink-0" />
              <span className="truncate font-mono text-[11px] text-[#777777]">
                /storage/emulated/0/Download/
              </span>
            </div>

            <button
              onClick={onRescanDownloads}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#7C4DFF]/10 hover:bg-[#7C4DFF]/20 text-[#00E5FF] border border-[#7C4DFF]/20 rounded-lg text-xs font-medium transition-colors shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Сканирование...' : 'Обновить'}</span>
            </button>
          </div>

          {/* Search bar & Select All */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#777777] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, формату..."
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#E0E0E0] placeholder-[#555555] focus:outline-none focus:border-[#7C4DFF]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-[#777777] hover:text-[#E0E0E0] text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={toggleSelectAll}
              className="px-2.5 py-1.5 bg-[#1A1A1A] hover:bg-[#222222] text-[#E0E0E0] border border-[#262626] rounded-xl text-xs font-medium transition-colors shrink-0"
            >
              {selectedPaths.size === filteredFiles.length && filteredFiles.length > 0
                ? 'Снять выбор'
                : 'Выбрать все'}
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#1F1F1F]">
          {filteredFiles.length === 0 ? (
            <div className="py-12 text-center text-[#555555] space-y-2">
              <Music className="w-10 h-10 mx-auto text-[#222222] opacity-80" />
              <p className="text-sm font-medium text-[#777777]">Аудиофайлы не найдены</p>
              <p className="text-xs text-[#555555]">
                Нажмите «Обновить» для сканирования папки загрузок
              </p>
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isChecked = selectedPaths.has(file.path);
              const isPreviewing = previewingPath === file.path;

              return (
                <div
                  key={file.path}
                  onClick={() => toggleSelectTrack(file.path)}
                  className={`group flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-[#1A1A1A] border border-[#7C4DFF]/40'
                      : 'hover:bg-[#161616] border border-transparent'
                  }`}
                >
                  {/* Left: Play/Stop Button & Metadata */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    {/* Play / Stop Button BEFORE file name */}
                    <button
                      type="button"
                      onClick={(e) => handlePlayPreview(e, file)}
                      title={isPreviewing ? 'Остановить прослушивание' : 'Прослушать перед добавлением'}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isPreviewing
                          ? 'bg-[#7C4DFF] text-white shadow-lg shadow-purple-500/40 animate-pulse'
                          : 'bg-[#0A0A0A] hover:bg-[#7C4DFF]/20 text-[#00E5FF] border border-[#7C4DFF]/30'
                      }`}
                    >
                      {isPreviewing ? (
                        <Square className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-[#00E5FF] ml-0.5" />
                      )}
                    </button>

                    {/* Track info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-semibold truncate ${
                          isChecked ? 'text-[#00E5FF]' : 'text-[#E0E0E0]'
                        }`}>
                          {file.title || file.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#777777]">
                        <span className="truncate max-w-[120px]">
                          {file.artist || 'Неизвестен'}
                        </span>
                        <span>•</span>
                        {/* Format Badge */}
                        <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                          file.hiResInfo.isLossless
                            ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20'
                            : 'bg-[#1F1F1F] text-[#888888]'
                        }`}>
                          {file.hiResInfo.format} {file.hiResInfo.bitDepth ? `${file.hiResInfo.bitDepth}/` : ''}{file.hiResInfo.sampleRate ? `${Math.round(file.hiResInfo.sampleRate / 1000)}k` : ''}
                        </span>
                        <span>•</span>
                        <span>{formatDuration(file.durationSec)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Checkbox (Галочка) */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectTrack(file.path);
                    }}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-[#7C4DFF] border-[#7C4DFF] text-white shadow-md shadow-purple-500/30 scale-105'
                        : 'bg-[#0A0A0A] border-[#222222] text-transparent hover:border-[#555555]'
                    }`}
                  >
                    <Check className={`w-4 h-4 stroke-[3] ${isChecked ? 'block' : 'hidden'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Save (Сохранить) Button */}
        <div className="p-3.5 bg-[#0A0A0A]/95 border-t border-[#1F1F1F] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#777777]">
            Выбрано для добавления:{' '}
            <span className="font-bold text-[#00E5FF] font-mono text-sm ml-1">
              {selectedPaths.size}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#777777] hover:text-[#E0E0E0] hover:bg-[#1A1A1A] transition-colors"
            >
              Отмена
            </button>

            <button
              onClick={handleSave}
              disabled={selectedPaths.size === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C4DFF] to-[#00E5FF] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Сохранить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
