import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Radio,
  Search,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Copy,
  Check,
  Music2,
  SlidersHorizontal,
  X,
  Sparkles,
} from 'lucide-react';
import { Track } from '../types/music';
import {
  parseLRC,
  getActiveLyricIndex,
  fetchLyricsOnline,
  searchLyricsOnline,
  readLocalLrcFile,
  LyricSearchResult,
  cleanTitle,
  cleanArtist,
} from '../services/lyricsService';

interface CyberLyricsViewProps {
  track: Track;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onUpdateLyrics: (trackId: string, lyrics: string) => void;
}

export const CyberLyricsView: React.FC<CyberLyricsViewProps> = ({
  track,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onUpdateLyrics,
}) => {
  const [offsetSec, setOffsetSec] = useState<number>(0);
  const [isAutoFetching, setIsAutoFetching] = useState<boolean>(false);
  const [fetchStatusMessage, setFetchStatusMessage] = useState<string | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Search Modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [searchArtist, setSearchArtist] = useState<string>('');
  const [searchTitle, setSearchTitle] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<LyricSearchResult[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Parse current lyrics
  const parsedLRC = useMemo(() => {
    return parseLRC(track.lyrics || '');
  }, [track.lyrics]);

  // Determine currently active line
  const activeIndex = useMemo(() => {
    if (!parsedLRC.hasTimestamps || parsedLRC.lines.length === 0) return -1;
    return getActiveLyricIndex(parsedLRC.lines, currentTime, offsetSec);
  }, [parsedLRC, currentTime, offsetSec]);

  // Auto-scroll to active line
  useEffect(() => {
    if (!autoScrollEnabled || activeIndex < 0) return;
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, autoScrollEnabled]);

  // Auto-fetch if track has no lyrics
  useEffect(() => {
    if (!track.lyrics && track.title) {
      handleAutoFetch();
    }
  }, [track.id]);

  const handleAutoFetch = async () => {
    setIsAutoFetching(true);
    setFetchStatusMessage('Поиск LRC субтитров в сети...');

    try {
      const res = await fetchLyricsOnline({
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: duration || track.duration,
      });

      if (res && res.lyrics) {
        onUpdateLyrics(track.id, res.lyrics);
        setFetchStatusMessage(res.isSynced ? '✓ Субтитры синхронизированы (LRC)' : '✓ Текст загружен');
      } else {
        setFetchStatusMessage('Субтитры не найдены в базе');
      }
    } catch (err) {
      setFetchStatusMessage('Ошибка сети при запросе субтитров');
    } finally {
      setIsAutoFetching(false);
      setTimeout(() => setFetchStatusMessage(null), 4000);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readLocalLrcFile(file);
      if (text) {
        onUpdateLyrics(track.id, text);
        setFetchStatusMessage(`✓ Файл ${file.name} применен`);
        setTimeout(() => setFetchStatusMessage(null), 3000);
      }
    } catch {
      setFetchStatusMessage('Ошибка чтения файла .LRC');
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopyLyrics = () => {
    if (!track.lyrics) return;
    navigator.clipboard.writeText(track.lyrics);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenSearchModal = () => {
    setSearchArtist(cleanArtist(track.artist || ''));
    setSearchTitle(cleanTitle(track.title || ''));
    setSearchResults([]);
    setIsSearchModalOpen(true);
  };

  const handleExecuteSearch = async () => {
    const query = [searchArtist, searchTitle].filter(Boolean).join(' ');
    if (!query) return;

    setIsSearching(true);
    try {
      const results = await searchLyricsOnline(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplySearchResult = (item: LyricSearchResult) => {
    const lyrics = item.syncedLyrics || item.plainLyrics;
    if (lyrics) {
      onUpdateLyrics(track.id, lyrics);
      setFetchStatusMessage(item.syncedLyrics ? '✓ Синхронизированный LRC применен' : '✓ Текст применен');
      setIsSearchModalOpen(false);
      setTimeout(() => setFetchStatusMessage(null), 3000);
    }
  };

  const formatLineTime = (sec: number) => {
    if (sec < 0) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-lg h-72 sm:h-80 flex flex-col bg-[#0B0206]/95 border border-[#FF1A3C]/40 rounded-2xl overflow-hidden my-auto font-mono shadow-[0_0_25px_rgba(255,26,60,0.15)]">
      {/* Subtitles Action & Status Bar */}
      <div className="px-3 py-2 bg-[#140309] border-b border-[#FF1A3C]/30 flex flex-wrap items-center justify-between gap-2 text-[10px]">
        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Radio
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              isAutoFetching
                ? 'text-[#00E5FF] animate-spin'
                : parsedLRC.hasTimestamps
                ? 'text-[#00E5FF] animate-pulse'
                : 'text-[#FF1A3C]'
            }`}
          />
          <span className="font-bold truncate text-[#E0E0E0]">
            {isAutoFetching
              ? 'ПОДКАЧКА СУБТИТРОВ...'
              : parsedLRC.hasTimestamps
              ? `LRC СИНХРОН [${parsedLRC.lines.length} СТР.]`
              : track.lyrics
              ? 'ОБЫЧНЫЙ ТЕКСТ'
              : 'СУБТИТРЫ ОТСУТСТВУЮТ'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Timing offset buttons if synced */}
          {parsedLRC.hasTimestamps && (
            <div className="flex items-center gap-0.5 bg-[#080104] border border-[#FF1A3C]/30 rounded px-1 py-0.5 mr-1 text-[9px]">
              <Clock className="w-2.5 h-2.5 text-[#883344]" />
              <button
                onClick={() => setOffsetSec((prev) => Math.max(-5, prev - 0.5))}
                className="hover:text-[#00E5FF] px-1 text-[#FF1A3C] font-black"
                title="Сдвинуть субтитры назад на 0.5 сек"
              >
                -0.5s
              </button>
              <span className="text-[#00E5FF] font-bold">
                {offsetSec === 0 ? '0s' : `${offsetSec > 0 ? '+' : ''}${offsetSec.toFixed(1)}s`}
              </span>
              <button
                onClick={() => setOffsetSec((prev) => Math.min(5, prev + 0.5))}
                className="hover:text-[#00E5FF] px-1 text-[#FF1A3C] font-black"
                title="Сдвинуть субтитры вперед на 0.5 сек"
              >
                +0.5s
              </button>
            </div>
          )}

          {/* Re-fetch online button */}
          <button
            onClick={handleAutoFetch}
            disabled={isAutoFetching}
            className="p-1 rounded bg-[#1A040D] hover:bg-[#250514] text-[#00E5FF] border border-[#00E5FF]/40 transition-colors"
            title="Автоподкачка с LRCLIB"
          >
            <RefreshCw className={`w-3 h-3 ${isAutoFetching ? 'animate-spin' : ''}`} />
          </button>

          {/* Manual Search */}
          <button
            onClick={handleOpenSearchModal}
            className="p-1 rounded bg-[#1A040D] hover:bg-[#250514] text-[#FF4D6D] border border-[#FF1A3C]/40 transition-colors"
            title="Ручной поиск в базе субтитров"
          >
            <Search className="w-3 h-3" />
          </button>

          {/* Upload .lrc file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded bg-[#1A040D] hover:bg-[#250514] text-[#E0E0E0] border border-[#FF1A3C]/40 transition-colors"
            title="Загрузить локальный файл .LRC"
          >
            <Upload className="w-3 h-3 text-[#FF1A3C]" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".lrc,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Copy lyrics */}
          {track.lyrics && (
            <button
              onClick={handleCopyLyrics}
              className="p-1 rounded bg-[#1A040D] hover:bg-[#250514] text-[#E0E0E0] border border-[#FF1A3C]/40 transition-colors"
              title="Скопировать текст"
            >
              {isCopied ? <Check className="w-3 h-3 text-[#00FF66]" /> : <Copy className="w-3 h-3 text-[#883344]" />}
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast if any */}
      {fetchStatusMessage && (
        <div className="bg-[#1A040F] border-b border-[#00E5FF]/30 px-3 py-1 text-[10px] text-[#00E5FF] text-center font-bold tracking-wide animate-in fade-in duration-200">
          {fetchStatusMessage}
        </div>
      )}

      {/* Lyrics Display Scroll Area */}
      <div
        ref={scrollContainerRef}
        onWheel={() => setAutoScrollEnabled(true)}
        className="flex-1 overflow-y-auto p-4 space-y-2.5 text-center select-none"
      >
        {parsedLRC.lines.length > 0 ? (
          parsedLRC.lines.map((line, idx) => {
            const isActive = idx === activeIndex;

            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => {
                  if (line.time >= 0) {
                    onSeek(line.time);
                  }
                }}
                className={`group py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-[#FF1A3C]/20 border border-[#00E5FF]/60 scale-105 shadow-[0_0_15px_rgba(0,229,255,0.25)] text-[#00E5FF] font-black'
                    : 'hover:bg-[#1A040D]/60 text-[#883344] hover:text-[#FF4D6D] border border-transparent'
                }`}
              >
                {/* Optional Timestamp badge */}
                {parsedLRC.hasTimestamps && line.time >= 0 && (
                  <span
                    className={`text-[9px] font-mono px-1 rounded transition-colors ${
                      isActive
                        ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 font-bold'
                        : 'opacity-40 group-hover:opacity-100 text-[#662233]'
                    }`}
                  >
                    {formatLineTime(line.time)}
                  </span>
                )}

                <p
                  className={`text-xs sm:text-sm tracking-wide ${
                    isActive ? 'drop-shadow-[0_0_8px_#00E5FF]' : 'font-medium'
                  }`}
                >
                  {line.text || '♪ ♪ ♪'}
                </p>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-10 space-y-3 text-center">
            <Radio className="w-10 h-10 text-[#FF1A3C] opacity-40 animate-pulse" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#E0E0E0]">[ СУБТИТРЫ НЕ НАЙДЕНЫ ]</p>
              <p className="text-[10px] text-[#883344] max-w-xs">
                Попробуйте выполнить поиск в глобальной базе LRCLIB или загрузить локальный .LRC файл
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleAutoFetch}
                disabled={isAutoFetching}
                className="px-3 py-1.5 bg-[#FF1A3C]/20 hover:bg-[#FF1A3C]/30 text-[#FF1A3C] hover:text-white border border-[#FF1A3C]/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(255,26,60,0.2)]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>НАЙТИ В LRCLIB</span>
              </button>

              <button
                onClick={handleOpenSearchModal}
                className="px-3 py-1.5 bg-[#140309] hover:bg-[#1E050F] text-[#00E5FF] border border-[#00E5FF]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ПОИСК ВРУЧНУЮ</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#140309] hover:bg-[#1E050F] text-[#E0E0E0] border border-[#FF1A3C]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-[#FF1A3C]" />
                <span>ИМПОРТ .LRC</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Search Modal Dialog */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D0207] border border-[#FF1A3C]/60 rounded-2xl p-4 space-y-3 font-mono shadow-[0_0_30px_rgba(255,26,60,0.3)]">
            <div className="flex items-center justify-between pb-2 border-b border-[#FF1A3C]/30">
              <span className="text-xs font-bold text-[#FFFFFF] flex items-center gap-1.5">
                <Search className="w-4 h-4 text-[#00E5FF]" />
                <span>ПОИСК СУБТИТРОВ (LRCLIB)</span>
              </span>
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1 rounded text-[#883344] hover:text-[#FF1A3C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-[#883344] uppercase block mb-0.5">Исполнитель</label>
                <input
                  type="text"
                  value={searchArtist}
                  onChange={(e) => setSearchArtist(e.target.value)}
                  placeholder="Например: Linkin Park"
                  className="w-full bg-[#16030B] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#883344] uppercase block mb-0.5">Название трека</label>
                <input
                  type="text"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="Например: Numb"
                  className="w-full bg-[#16030B] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <button
                onClick={handleExecuteSearch}
                disabled={isSearching}
                className="w-full py-2 bg-[#FF1A3C] hover:bg-[#FF2E50] disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(255,26,60,0.4)]"
              >
                {isSearching ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>{isSearching ? 'ПОИСК В БАЗЕ...' : 'НАЙТИ В БАЗЕ'}</span>
              </button>
            </div>

            {/* Results list */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 pt-1 border-t border-[#FF1A3C]/20">
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-[#16030B] hover:bg-[#200410] border border-[#FF1A3C]/30 hover:border-[#00E5FF]/60 rounded-lg flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#E0E0E0] truncate">{item.trackName}</p>
                      <p className="text-[10px] text-[#883344] truncate">
                        {item.artistName} {item.albumName ? `• ${item.albumName}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                          item.syncedLyrics
                            ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40'
                            : 'bg-[#FF1A3C]/20 text-[#FF1A3C] border-[#FF1A3C]/40'
                        }`}
                      >
                        {item.syncedLyrics ? 'LRC СИНХРОН' : 'ТЕКСТ'}
                      </span>

                      <button
                        onClick={() => handleApplySearchResult(item)}
                        className="px-2 py-1 bg-[#FF1A3C]/30 hover:bg-[#FF1A3C] text-white rounded text-[10px] font-bold transition-colors"
                      >
                        ВЫБРАТЬ
                      </button>
                    </div>
                  </div>
                ))
              ) : isSearching ? (
                <p className="text-center py-4 text-xs text-[#883344]">Выполняется запрос к LRCLIB...</p>
              ) : (
                <p className="text-center py-4 text-xs text-[#883344]">Введите запрос и нажмите «Найти»</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
