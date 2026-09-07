import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Trash2,
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
  clearLyricsCache,
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

  // Lock body scroll when search modal is open on mobile
  useEffect(() => {
    if (isSearchModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isSearchModalOpen]);

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

  const handleAutoFetch = async (forcePurgeCache = false) => {
    setIsAutoFetching(true);
    setFetchStatusMessage('Проверка базы лирики (LRCLIB)...');

    if (forcePurgeCache) {
      clearLyricsCache(track.title, track.artist);
    }

    try {
      const res = await fetchLyricsOnline({
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: duration || track.duration,
      });

      if (res && res.lyrics) {
        onUpdateLyrics(track.id, res.lyrics);
        setFetchStatusMessage(res.isSynced ? '✓ Синхронная лирика (LRC) загружена' : '✓ Текст песни загружен');
      } else {
        // If force refresh couldn't find a matching lyrics and user had a mismatch, notify clearly
        setFetchStatusMessage('Точная лирика для этого исполнителя не найдена');
      }
    } catch (err) {
      setFetchStatusMessage('Ошибка сети при запросе лирики');
    } finally {
      setIsAutoFetching(false);
      setTimeout(() => setFetchStatusMessage(null), 4000);
    }
  };

  const handleDeleteLyrics = () => {
    clearLyricsCache(track.title, track.artist);
    onUpdateLyrics(track.id, '');
    setFetchStatusMessage('Лирика отвязана от трека');
    setTimeout(() => setFetchStatusMessage(null), 3000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readLocalLrcFile(file);
      if (text) {
        onUpdateLyrics(track.id, text);
        setFetchStatusMessage(`✓ Файл лирики ${file.name} применен`);
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
    let rawArt = track.artist || '';
    // Strip trailing "// title" or file markers
    rawArt = rawArt.replace(/\s*\/\/\s*.*$/, '');
    const cleanedArt = cleanArtist(rawArt);
    setSearchArtist(cleanedArt);
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
      setFetchStatusMessage(item.syncedLyrics ? '✓ Синхронная лирика (LRC) применена' : '✓ Текст песни применен');
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
      {/* Lyrics Action & Status Bar */}
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
              ? 'ПОИСК ЛИРИКИ...'
              : parsedLRC.hasTimestamps
              ? `LRC ЛИРИКА [${parsedLRC.lines.length} СТР.]`
              : track.lyrics
              ? 'ТЕКСТ ПЕСНИ'
              : 'ЛИРИКА ОТСУТСТВУЕТ'}
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
                title="Сдвинуть лирику назад на 0.5 сек"
              >
                -0.5s
              </button>
              <span className="text-[#00E5FF] font-bold">
                {offsetSec === 0 ? '0s' : `${offsetSec > 0 ? '+' : ''}${offsetSec.toFixed(1)}s`}
              </span>
              <button
                onClick={() => setOffsetSec((prev) => Math.min(5, prev + 0.5))}
                className="hover:text-[#00E5FF] px-1 text-[#FF1A3C] font-black"
                title="Сдвинуть лирику вперед на 0.5 сек"
              >
                +0.5s
              </button>
            </div>
          )}

          {/* Re-fetch online button */}
          <button
            onClick={() => handleAutoFetch(true)}
            disabled={isAutoFetching}
            className="p-1 rounded bg-[#1A040D] hover:bg-[#250514] text-[#00E5FF] border border-[#00E5FF]/40 transition-colors"
            title="Обновить и проверить совпадение в LRCLIB"
          >
            <RefreshCw className={`w-3 h-3 ${isAutoFetching ? 'animate-spin' : ''}`} />
          </button>

          {/* Manual Search */}
          <button
            onClick={handleOpenSearchModal}
            className="p-1 rounded bg-[#1A040D] hover:bg-[#250514] text-[#FF4D6D] border border-[#FF1A3C]/40 transition-colors"
            title="Ручной поиск в базе лирики"
          >
            <Search className="w-3 h-3" />
          </button>

          {/* Upload .lrc file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded bg-[#1A040D] hover:bg-[#250514] text-[#E0E0E0] border border-[#FF1A3C]/40 transition-colors"
            title="Загрузить файл .LRC"
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

          {/* Delete / Unlink lyrics if present */}
          {track.lyrics && (
            <button
              onClick={handleDeleteLyrics}
              className="p-1 rounded bg-[#1A040D] hover:bg-[#250514] text-[#FF1A3C] hover:text-[#FF4D6D] border border-[#FF1A3C]/40 transition-colors"
              title="Отвязать/удалить лирику у этого трека"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          {/* Copy lyrics */}
          {track.lyrics && (
            <button
              onClick={handleCopyLyrics}
              className="p-1 rounded bg-[#1A040D] hover:bg-[#250514] text-[#E0E0E0] border border-[#FF1A3C]/40 transition-colors"
              title="Скопировать лирику"
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
              <p className="text-xs font-bold text-[#E0E0E0]">[ ЛИРИКА НЕ НАЙДЕНА ]</p>
              <p className="text-[10px] text-[#883344] max-w-xs">
                Лирика не обнаружена в метаданных трека. Выполните поиск в базе LRCLIB или импортируйте файл .LRC
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

      {/* Manual Search Modal Dialog (Rendered in Portal to prevent player overlay & mobile keyboard squish) */}
      {isSearchModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-[#050104]/98 backdrop-blur-2xl flex flex-col justify-start items-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => setIsSearchModalOpen(false)}
          >
            <div
              className="w-full max-w-md bg-[#0D0207] border-2 border-[#FF1A3C]/80 rounded-2xl p-4 sm:p-5 space-y-3.5 font-mono shadow-[0_0_50px_rgba(255,26,60,0.35)] my-auto shrink-0 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#FF1A3C]/40">
                <span className="text-xs font-bold text-[#FFFFFF] flex items-center gap-1.5 tracking-wide">
                  <Search className="w-4 h-4 text-[#00E5FF]" />
                  <span>ПОИСК ЛИРИКИ [ LRCLIB ]</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(false)}
                  className="p-1 rounded-lg text-[#883344] hover:text-[#FF1A3C] hover:bg-[#FF1A3C]/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteSearch();
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="text-[10px] text-[#883344] font-bold uppercase tracking-wider block mb-1">
                    Исполнитель
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={searchArtist}
                      onChange={(e) => setSearchArtist(e.target.value)}
                      placeholder="Например: Linkin Park"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className="w-full bg-[#16030B] border border-[#FF1A3C]/50 rounded-xl px-3 py-2 text-xs text-[#E0E0E0] placeholder-[#552233] focus:outline-none focus:border-[#00E5FF] pr-8 shadow-inner"
                    />
                    {searchArtist && (
                      <button
                        type="button"
                        onClick={() => setSearchArtist('')}
                        className="absolute right-2 text-[#883344] hover:text-[#FF1A3C] p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[#883344] font-bold uppercase tracking-wider block mb-1">
                    Название трека
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={searchTitle}
                      onChange={(e) => setSearchTitle(e.target.value)}
                      placeholder="Например: Numb"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      className="w-full bg-[#16030B] border border-[#FF1A3C]/50 rounded-xl px-3 py-2 text-xs text-[#E0E0E0] placeholder-[#552233] focus:outline-none focus:border-[#00E5FF] pr-8 shadow-inner"
                    />
                    {searchTitle && (
                      <button
                        type="button"
                        onClick={() => setSearchTitle('')}
                        className="absolute right-2 text-[#883344] hover:text-[#FF1A3C] p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSearching || (!searchArtist.trim() && !searchTitle.trim())}
                  className="w-full py-2.5 bg-[#FF1A3C] hover:bg-[#FF2E50] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,26,60,0.4)] active:scale-[0.98]"
                >
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Search className="w-4 h-4 text-white" />
                  )}
                  <span>{isSearching ? 'ПОИСК В БАЗЕ...' : 'НАЙТИ В БАЗЕ'}</span>
                </button>
              </form>

              {/* Results list */}
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1 pt-2 border-t border-[#FF1A3C]/30">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-[#16030B] hover:bg-[#220412] border border-[#FF1A3C]/40 hover:border-[#00E5FF]/70 rounded-xl flex items-center justify-between gap-2.5 text-xs transition-colors shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#E0E0E0] truncate">{item.trackName}</p>
                        <p className="text-[10px] text-[#AA4455] truncate">
                          {item.artistName} {item.albumName ? `• ${item.albumName}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                            item.syncedLyrics
                              ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50'
                              : 'bg-[#FF1A3C]/20 text-[#FF1A3C] border-[#FF1A3C]/50'
                          }`}
                        >
                          {item.syncedLyrics ? 'LRC СИНХРОН' : 'ТЕКСТ'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleApplySearchResult(item)}
                          className="px-2.5 py-1.5 bg-[#FF1A3C]/40 hover:bg-[#FF1A3C] text-white rounded-lg text-[10px] font-bold transition-all hover:shadow-[0_0_8px_rgba(255,26,60,0.6)]"
                        >
                          ВЫБРАТЬ
                        </button>
                      </div>
                    </div>
                  ))
                ) : isSearching ? (
                  <p className="text-center py-5 text-xs text-[#00E5FF] flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Выполняется запрос к LRCLIB...</span>
                  </p>
                ) : (
                  <p className="text-center py-4 text-xs text-[#662233]">
                    Введите имя артиста или название трека и нажмите «Найти»
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
