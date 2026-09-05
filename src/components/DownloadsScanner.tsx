import React, { useState, useRef } from 'react';
import { FolderDown, RefreshCw, UploadCloud, Sparkles, Play, Square, CheckCircle2, Music, ShieldCheck, FileAudio, Disc, FolderSearch } from 'lucide-react';
import { ScannedFile, Track } from '../types/music';
import { audioEngine } from '../services/audioEngine';

interface DownloadsScannerProps {
  scannedFiles: ScannedFile[];
  isScanning: boolean;
  onScanDownloadsFolder: () => void;
  onFileUpload: (files: FileList) => void;
  onAutoFetchAllCovers: () => void;
  isFetchingCovers: boolean;
  onAddTrackToLibrary: (file: ScannedFile) => void;
  tracks: Track[];
}

export const DownloadsScanner: React.FC<DownloadsScannerProps> = ({
  scannedFiles,
  isScanning,
  onScanDownloadsFolder,
  onFileUpload,
  onAutoFetchAllCovers,
  isFetchingCovers,
  onAddTrackToLibrary,
  tracks,
}) => {
  const [filterFormat, setFilterFormat] = useState<string>('ALL');
  const [previewingPath, setPreviewingPath] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  const triggerFolderPicker = () => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    } else {
      onScanDownloadsFolder();
    }
  };

  const handlePreview = (e: React.MouseEvent, file: ScannedFile) => {
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

  const filteredFiles = scannedFiles.filter((f) => {
    if (filterFormat === 'ALL') return true;
    return f.hiResInfo.format === filterFormat;
  });

  const isTrackInLibrary = (file: ScannedFile) => {
    return tracks.some((t) => t.filePath === file.path || t.title === file.title);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 space-y-3">
      {/* Header & Path Banner */}
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-3.5 space-y-3 shrink-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#7C4DFF]/15 text-[#00E5FF] rounded-xl border border-[#7C4DFF]/30">
              <FolderDown className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#FFFFFF] flex items-center gap-1.5">
                Сканер папки Загрузки
              </h2>
              <p className="text-[10px] text-[#777777] font-mono">
                /storage/emulated/0/Download/
              </p>
            </div>
          </div>

          {/* Hidden inputs for Folder and File selection */}
          <input
            ref={folderInputRef}
            type="file"
            multiple
            accept="audio/*,.flac,.wav,.mp3,.m4a,.aac,.ogg,.opus"
            onChange={(e) => e.target.files && onFileUpload(e.target.files)}
            className="hidden"
          />

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onScanDownloadsFolder}
              disabled={isScanning}
              className="px-3 py-2 bg-gradient-to-r from-[#7C4DFF] to-[#00E5FF] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Сканирование...' : 'Сканировать'}</span>
            </button>

            <button
              onClick={triggerFolderPicker}
              disabled={isScanning}
              title="Открыть системный проводник папок"
              className="px-2.5 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#222222] text-[#E0E0E0] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <FolderSearch className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span className="hidden sm:inline">Папка</span>
            </button>
          </div>
        </div>

        {/* Quick Actions: Dropzone & Auto Cover Art */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* File Drag/Drop or Select */}
          <label
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex items-center justify-center gap-2 p-2.5 bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-dashed border-[#222222] hover:border-[#7C4DFF]/60 rounded-xl cursor-pointer transition-colors text-xs text-[#E0E0E0] group"
          >
            <UploadCloud className="w-4 h-4 text-[#00E5FF] group-hover:scale-110 transition-transform" />
            <span className="truncate">Выбрать аудиофайлы</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.flac,.wav,.mp3,.m4a,.aac,.ogg,.opus"
              onChange={(e) => e.target.files && onFileUpload(e.target.files)}
              className="hidden"
            />
          </label>

          {/* Auto Cover Art Loader */}
          <button
            onClick={onAutoFetchAllCovers}
            disabled={isFetchingCovers}
            className="flex items-center justify-center gap-2 p-2.5 bg-[#7C4DFF]/15 hover:bg-[#7C4DFF]/25 border border-[#7C4DFF]/30 rounded-xl text-xs font-semibold text-[#00E5FF] transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-[#00E5FF] ${isFetchingCovers ? 'animate-spin' : ''}`} />
            <span>{isFetchingCovers ? 'Загрузка обложек...' : 'Авто-обложки альбомов'}</span>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between gap-1 border-b border-[#1F1F1F] pb-2 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {['ALL', 'FLAC', 'WAV', 'MP3', 'M4A', 'OPUS'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFilterFormat(fmt)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                filterFormat === fmt
                  ? 'bg-[#7C4DFF] text-white shadow-sm'
                  : 'bg-[#121212] text-[#777777] hover:text-[#E0E0E0] border border-[#1F1F1F]'
              }`}
            >
              {fmt === 'ALL' ? 'Все файлы' : fmt}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-[#777777] font-mono shrink-0">
          Найдено: {filteredFiles.length}
        </span>
      </div>

      {/* Scanned Audio Files List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredFiles.length === 0 ? (
          <div className="py-12 text-center text-[#555555] space-y-2">
            <FileAudio className="w-10 h-10 mx-auto text-[#222222] opacity-80" />
            <p className="text-sm font-medium text-[#777777]">Файлы не найдены</p>
            <p className="text-xs text-[#555555]">
              Нажмите «Сканировать» для проверки папки Загрузки
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const inLibrary = isTrackInLibrary(file);
            const isPreviewing = previewingPath === file.path;

            return (
              <div
                key={file.path}
                className="group bg-[#121212] hover:bg-[#161616] border border-[#1F1F1F] rounded-2xl p-2.5 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Play preview button */}
                  <button
                    onClick={(e) => handlePreview(e, file)}
                    title={isPreviewing ? 'Остановить' : 'Прослушать перед добавлением'}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isPreviewing
                        ? 'bg-[#7C4DFF] text-white shadow-md shadow-purple-500/30 animate-pulse'
                        : 'bg-[#0A0A0A] hover:bg-[#7C4DFF]/20 text-[#00E5FF] border border-[#7C4DFF]/30'
                    }`}
                  >
                    {isPreviewing ? (
                      <Square className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-[#00E5FF] ml-0.5" />
                    )}
                  </button>

                  {/* Album Cover Thumbnail */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0A0A0A] shrink-0 border border-[#1F1F1F]">
                    <img
                      src={file.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
                      alt={file.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#E0E0E0] truncate">
                      {file.title || file.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#777777]">
                      <span className="truncate max-w-[100px]">{file.artist || 'Аудиофайл'}</span>
                      <span>•</span>
                      <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                        file.hiResInfo.isLossless
                          ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20'
                          : 'bg-[#1F1F1F] text-[#888888]'
                      }`}>
                        {file.hiResInfo.format} {file.hiResInfo.bitDepth ? `${file.hiResInfo.bitDepth}B` : ''}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[#555555]">{file.size}</span>
                    </div>
                  </div>
                </div>

                {/* Add to library button */}
                <div className="shrink-0">
                  {inLibrary ? (
                    <span className="flex items-center gap-1 text-[11px] text-[#00E5FF] font-medium px-2.5 py-1 bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                      <span>В медиатеке</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onAddTrackToLibrary(file)}
                      className="px-3 py-1.5 bg-[#7C4DFF] hover:bg-[#6C3DFF] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span>+ Добавить</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
