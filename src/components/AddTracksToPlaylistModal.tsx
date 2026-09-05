import React, { useState, useEffect } from 'react';
import { Play, Square, Check, X, Search, FolderDown, RefreshCw, Cpu, Plus } from 'lucide-react';
import { ScannedFile } from '../types/music';
import { audioEngine } from '../services/audioEngine';

interface AddTracksToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistName: string;
  availableDownloads: ScannedFile[];
  existingTrackIds?: string[];
  onAddTracks: (selectedFiles: ScannedFile[]) => void;
  onRescanDownloads: () => void;
  isScanning: boolean;
}

export const AddTracksToPlaylistModal: React.FC<AddTracksToPlaylistModalProps> = ({
  isOpen,
  onClose,
  playlistName,
  availableDownloads,
  existingTrackIds = [],
  onAddTracks,
  onRescanDownloads,
  isScanning,
}) => {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingPath, setPreviewingPath] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPaths(new Set());
      setPreviewingPath(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredFiles = availableDownloads.filter((file) => {
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
    const selectedFiles = availableDownloads.filter((f) => selectedPaths.has(f.path));
    onAddTracks(selectedFiles);
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 font-mono animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-[#100308] border-2 border-[#FF1A3C] sm:rounded-2xl rounded-t-2xl shadow-[0_0_30px_rgba(255,26,60,0.4)] flex flex-col max-h-[90vh] sm:max-h-[82vh] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-[#18040C] border-b border-[#FF1A3C]/40 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#FF1A3C]" />
              <h3 className="text-xs font-black text-[#FFFFFF] tracking-wider">
                [ ИНИЦИАЛИЗАЦИЯ ЗАПИСИ В ШАРД ]
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

        {/* Scan & Search Controls */}
        <div className="p-2.5 bg-[#120308] border-b border-[#FF1A3C]/30 space-y-2 shrink-0">
          {/* Downloads folder path info & Rescan */}
          <div className="flex items-center justify-between bg-[#0A0206] px-2.5 py-1.5 rounded-lg border border-[#FF1A3C]/30 text-xs">
            <div className="flex items-center gap-2 text-[#E0E0E0] truncate">
              <FolderDown className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
              <span className="truncate text-[10px] text-[#883344]">
                /storage/emulated/0/Download/
              </span>
            </div>

            <button
              onClick={onRescanDownloads}
              disabled={isScanning}
              className="flex items-center gap-1 px-2 py-0.5 bg-[#FF1A3C]/20 hover:bg-[#FF1A3C]/30 text-[#FF1A3C] border border-[#FF1A3C]/40 rounded text-[9px] font-bold transition-colors shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'СКАНИРУЮ...' : 'ОБНОВИТЬ'}</span>
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
                placeholder="ПОИСК ПО НАЗВАНИЮ..."
                className="w-full bg-[#080104] border border-[#FF1A3C]/40 rounded-lg pl-8 pr-2.5 py-1 text-[10px] text-white placeholder-[#552233] focus:outline-none focus:border-[#FF1A3C]"
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

            <button
              onClick={toggleSelectAll}
              className="px-2.5 py-1 bg-[#18040C] hover:bg-[#250412] text-[#00E5FF] border border-[#00E5FF]/40 rounded-lg text-[9px] font-bold shrink-0"
            >
              {selectedPaths.size === filteredFiles.length && filteredFiles.length > 0
                ? 'СБРОСИТЬ'
                : 'ВЫБРАТЬ ВСЕ'}
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredFiles.length === 0 ? (
            <div className="py-12 text-center text-[#883344] space-y-2">
              <Cpu className="w-8 h-8 mx-auto opacity-40 text-[#FF1A3C]" />
              <p className="text-xs">[ АУДИОФАЙЛЫ НЕ ОБНАРУЖЕНЫ ]</p>
              <p className="text-[10px]">
                Нажмите «ОБНОВИТЬ» для сканирования папки Download
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
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                    isChecked
                      ? 'bg-[#1C040E] border-[#FF1A3C] shadow-[0_0_8px_rgba(255,26,60,0.3)]'
                      : 'bg-[#120308] border-[#FF1A3C]/25 hover:border-[#FF1A3C]/60'
                  }`}
                >
                  {/* Left: Play/Stop Button & Metadata */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <button
                      type="button"
                      onClick={(e) => handlePlayPreview(e, file)}
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

                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs font-bold truncate ${
                        isChecked ? 'text-[#00E5FF]' : 'text-white'
                      }`}>
                        {file.title || file.name}
                      </h4>

                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-[#883344]">
                        <span className="truncate max-w-[120px]">
                          {file.artist || 'Неизвестен'}
                        </span>
                        <span>•</span>
                        <span className="px-1 py-0.2 rounded font-bold text-[8px] bg-[#FF1A3C]/20 text-[#FF1A3C] border border-[#FF1A3C]/40">
                          {file.hiResInfo.format}
                        </span>
                        <span>•</span>
                        <span>{formatDuration(file.durationSec)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectTrack(file.path);
                    }}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-[#FF1A3C] border-[#FF1A3C] text-black shadow-[0_0_6px_#FF1A3C]'
                        : 'bg-[#080104] border-[#FF1A3C]/40 text-transparent'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${isChecked ? 'block' : 'hidden'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#18040C] border-t border-[#FF1A3C]/40 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-[#883344]">
            ВЫБРАНО:{' '}
            <span className="font-black text-[#00E5FF] ml-1">
              {selectedPaths.size}
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
              disabled={selectedPaths.size === 0}
              className="px-4 py-1.5 rounded-lg bg-[#FF1A3C] hover:bg-[#FF0033] text-black font-black text-[10px] flex items-center gap-1 shadow-[0_0_10px_rgba(255,26,60,0.6)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>СОХРАНИТЬ В ШАРД</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
