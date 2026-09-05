import React, { useState, useRef } from 'react';
import {
  FolderDown,
  RefreshCw,
  Sparkles,
  Play,
  Square,
  CheckCircle2,
  FileAudio,
  Plus,
  FolderSearch,
  Terminal,
} from 'lucide-react';
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
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 space-y-3 font-mono">
      {/* Header & Path Banner */}
      <div className="bg-[#120308] border border-[#FF1A3C]/50 rounded-xl p-3 space-y-2.5 shrink-0 shadow-[0_0_15px_rgba(255,26,60,0.2)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#FF1A3C]/15 text-[#FF1A3C] rounded-lg border border-[#FF1A3C]/40">
              <Terminal className="w-4 h-4 text-[#FF1A3C]" />
            </div>
            <div>
              <h2 className="text-xs font-black text-[#FFFFFF] tracking-wide">
                TERMINAL // FILE_SCANNER
              </h2>
              <p className="text-[9px] text-[#00E5FF]">
                /storage/emulated/0/Download/
              </p>
            </div>
          </div>

          {/* Hidden inputs for Folder and File selection */}
          <input
            ref={folderInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && onFileUpload(e.target.files)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.flac,.wav,.mp3,.m4a,.aac,.ogg,.opus"
            onChange={(e) => e.target.files && onFileUpload(e.target.files)}
            className="hidden"
          />

          <button
            onClick={onScanDownloadsFolder}
            disabled={isScanning}
            className="px-2.5 py-1 bg-[#FF1A3C] hover:bg-[#FF0033] text-black rounded-lg font-black text-[10px] flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(255,26,60,0.6)] disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'СКАНИРУЮ...' : 'СКАНИРОВАТЬ'}</span>
          </button>
        </div>

        {/* Cyber terminal action buttons */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            onClick={triggerFolderPicker}
            className="py-1.5 px-2 bg-[#18040C] hover:bg-[#250614] border border-[#FF1A3C]/40 text-[#FF8095] rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FolderSearch className="w-3.5 h-3.5 text-[#FF1A3C]" />
            <span>Указать папку</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-1.5 px-2 bg-[#18040C] hover:bg-[#250614] border border-[#00E5FF]/40 text-[#00E5FF] rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Выбрать файлы</span>
          </button>
        </div>
      </div>

      {/* Format Filter Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        {['ALL', 'FLAC', 'WAV', 'MP3', 'M4A', 'OGG'].map((fmt) => (
          <button
            key={fmt}
            onClick={() => setFilterFormat(fmt)}
            className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold transition-all border ${
              filterFormat === fmt
                ? 'bg-[#FF1A3C] text-black border-[#FF1A3C] shadow-[0_0_8px_#FF1A3C]'
                : 'bg-[#120308] text-[#883344] border-[#FF1A3C]/30 hover:text-[#FF8095]'
            }`}
          >
            [ {fmt} ]
          </button>
        ))}
      </div>

      {/* Scanned Files List / Terminal View */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex-1 overflow-y-auto space-y-2 pr-1"
      >
        {filteredFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[#100308]/40 border border-dashed border-[#FF1A3C]/30 rounded-xl">
            <FolderDown className="w-10 h-10 text-[#FF1A3C]/50 mx-auto" />
            <div>
              <h3 className="text-xs font-bold text-[#FFFFFF]">
                [ АУДИОФАЙЛЫ НЕ ОБНАРУЖЕНЫ ]
              </h3>
              <p className="text-[10px] text-[#883344] mt-1 max-w-xs">
                Нажмите «Сканировать» для проверки папки Download или перетащите аудиофайлы сюда.
              </p>
            </div>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const inLibrary = isTrackInLibrary(file);
            const isPreviewing = previewingPath === file.path;

            return (
              <div
                key={file.id}
                className="bg-[#120308] border border-[#FF1A3C]/35 hover:border-[#FF1A3C]/70 rounded-xl p-2.5 flex items-center justify-between gap-2.5 transition-all shadow-sm"
              >
                {/* Preview play button */}
                <button
                  onClick={(e) => handlePreview(e, file)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                    isPreviewing
                      ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-[0_0_8px_#00E5FF]'
                      : 'bg-[#1A040D] text-[#FF1A3C] border-[#FF1A3C]/40 hover:border-[#FF1A3C]'
                  }`}
                  title="Предпрослушивание"
                >
                  {isPreviewing ? (
                    <Square className="w-3.5 h-3.5 fill-black" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#FFFFFF] truncate">
                      {file.title}
                    </h4>
                    <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-[#FF1A3C]/20 text-[#FF1A3C] border border-[#FF1A3C]/40 shrink-0">
                      {file.hiResInfo.format}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-[#883344] mt-0.5">
                    <span className="truncate">{file.artist}</span>
                    <span>•</span>
                    <span>{file.fileSize}</span>
                  </div>
                </div>

                {/* Add to Library action button */}
                <button
                  onClick={() => onAddTrackToLibrary(file)}
                  disabled={inLibrary}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all border shrink-0 ${
                    inLibrary
                      ? 'bg-[#0A0206] text-[#00E5FF] border-[#00E5FF]/30 cursor-default'
                      : 'bg-[#FF1A3C] hover:bg-[#FF0033] text-black border-[#FF1A3C] shadow-[0_0_8px_rgba(255,26,60,0.5)] active:scale-95'
                  }`}
                >
                  {inLibrary ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#00E5FF]" />
                      <span>В БАЗЕ</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>ДОБАВИТЬ</span>
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
