import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Maximize2,
  Flashlight,
  Camera,
  ShieldAlert,
  ChevronUp,
  Volume2,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Track } from '../types/music';
import { CyberWaveformScrubber } from './CyberWaveformScrubber';
import { parseLRC, getActiveLyricIndex } from '../services/lyricsService';
import { CyberCoverImage } from './CyberCoverImage';

interface CyberLockscreenProps {
  isOpen: boolean;
  onUnlock: () => void;
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenNowPlaying: () => void;
}

export const CyberLockscreen: React.FC<CyberLockscreenProps> = ({
  isOpen,
  onUnlock,
  track,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onToggleFavorite,
  onOpenNowPlaying,
}) => {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentSecondsStr, setCurrentSecondsStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [torchActive, setTorchActive] = useState(false);
  const [widgetDragOffset, setWidgetDragOffset] = useState<number>(0);
  const [isWidgetSwiping, setIsWidgetSwiping] = useState<boolean>(false);
  const [swipeFeedback, setSwipeFeedback] = useState<string | null>(null);
  const widgetPointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleWidgetPointerDown = (e: React.PointerEvent) => {
    widgetPointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    setIsWidgetSwiping(false);
  };

  const handleWidgetPointerMove = (e: React.PointerEvent) => {
    if (!widgetPointerStartRef.current) return;
    const dx = e.clientX - widgetPointerStartRef.current.x;
    const dy = e.clientY - widgetPointerStartRef.current.y;

    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      setIsWidgetSwiping(true);
      const clamped = Math.max(-60, Math.min(60, dx));
      setWidgetDragOffset(clamped);
    }
  };

  const handleWidgetPointerUp = (e: React.PointerEvent) => {
    if (!widgetPointerStartRef.current) return;
    const dx = e.clientX - widgetPointerStartRef.current.x;
    const dy = e.clientY - widgetPointerStartRef.current.y;
    widgetPointerStartRef.current = null;

    if (Math.abs(dx) >= 35 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        onNext();
        setSwipeFeedback('⏭️ СЛЕДУЮЩИЙ ТРЕК');
      } else {
        onPrev();
        setSwipeFeedback('⏮️ ПРЕДЫДУЩИЙ ТРЕК');
      }
      setTimeout(() => setSwipeFeedback(null), 1200);
    }

    setWidgetDragOffset(0);
    setIsWidgetSwiping(false);
  };

  const handleWidgetPointerCancel = () => {
    widgetPointerStartRef.current = null;
    setWidgetDragOffset(0);
    setIsWidgetSwiping(false);
  };

  // Synchronized Cyber Subtitles
  const parsedLRC = React.useMemo(() => {
    return parseLRC(track?.lyrics || '');
  }, [track?.lyrics]);

  const currentLyricLine = React.useMemo(() => {
    if (!parsedLRC.hasTimestamps || parsedLRC.lines.length === 0) return null;
    const idx = getActiveLyricIndex(parsedLRC.lines, currentTime);
    return idx >= 0 && parsedLRC.lines[idx]?.text ? parsedLRC.lines[idx].text : null;
  }, [parsedLRC, currentTime]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${hours}:${minutes}`);
      setCurrentSecondsStr(seconds);

      const days = ['ВОСКРЕСЕНЬЕ', 'ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'];
      const months = [
        'ЯНВАРЯ', 'ФЕВРАЛЯ', 'МАРТА', 'АПРЕЛЯ', 'МАЯ', 'ИЮНЯ',
        'ИЮЛЯ', 'АВГУСТА', 'СЕНТЯБРЯ', 'ОКТЯБРЯ', 'НОЯБРЯ', 'ДЕКАБРЯ',
      ];
      const dayName = days[now.getDay()];
      const dayNum = now.getDate();
      const monthName = months[now.getMonth()];
      setCurrentDateStr(`${dayName}, ${dayNum} ${monthName}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  // Swipe up to unlock handler
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      if (diff > 80) {
        // Swiped up
        onUnlock();
      }
      setTouchStartY(null);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 bg-[#000000] text-[#E0E0E0] flex flex-col justify-between p-4 sm:p-6 font-mono select-none overflow-hidden cyberpunk-scanlines animate-in fade-in duration-300"
    >
      {/* Torch simulation flash */}
      {torchActive && (
        <div className="absolute inset-0 bg-white/10 pointer-events-none z-40 transition-opacity" />
      )}

      {/* Top Lock Status Bar */}
      <div className="flex items-center justify-between text-[10px] text-[#883344] shrink-0 pt-1 z-30">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#FF1A3C]">// ARASAKA_NET</span>
          <span className="text-[#00E5FF] hidden xs:inline">NIGHT_CITY // 2077</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[#00FF66]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66] animate-pulse" />
            <span className="font-bold text-[9px]">100% ⚡</span>
          </div>

          <button
            onClick={onUnlock}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1C040E] border border-[#FF1A3C]/50 text-[#FF1A3C] hover:bg-[#FF1A3C] hover:text-black font-bold transition-all text-[9px]"
          >
            <Unlock className="w-3 h-3" />
            <span>ОТКРЫТЬ</span>
          </button>
        </div>
      </div>

      {/* Big Cyber Digital Clock & Date */}
      <div className="my-auto text-center space-y-1 shrink-0 z-30 py-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#18040C] border border-[#FF1A3C]/40 text-[#FF1A3C] text-[9px] font-bold mb-2 shadow-[0_0_10px_rgba(255,26,60,0.3)]">
          <Lock className="w-3 h-3 text-[#FF1A3C]" />
          <span>[ ЭКРАН БЛОКИРОВКИ // СИСТЕМА ЗАЩИЩЕНА ]</span>
        </div>

        <div className="flex items-baseline justify-center gap-1">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,26,60,0.6)]">
            {currentTimeStr || '19:13'}
          </h1>
          <span className="text-sm sm:text-base font-bold text-[#00E5FF] drop-shadow-[0_0_8px_#00E5FF]">
            :{currentSecondsStr || '00'}
          </span>
        </div>

        <p className="text-xs text-[#00E5FF] font-bold tracking-wider uppercase">
          {currentDateStr || 'ПОНЕДЕЛЬНИК, 7 СЕНТЯБРЯ'}
        </p>
      </div>

      {/* Cyberpunk Music Lockscreen Widget */}
      <div className="w-full max-w-sm mx-auto z-30 my-auto">
        {track ? (
          <div
            onPointerDown={handleWidgetPointerDown}
            onPointerMove={handleWidgetPointerMove}
            onPointerUp={handleWidgetPointerUp}
            onPointerCancel={handleWidgetPointerCancel}
            style={{
              transform: widgetDragOffset !== 0 ? `translateX(${widgetDragOffset}px)` : undefined,
              transition: isWidgetSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
              touchAction: 'pan-y',
            }}
            className="relative bg-[#100308]/92 backdrop-blur-2xl border-2 border-[#FF1A3C]/70 rounded-2xl p-3.5 shadow-[0_0_35px_rgba(255,26,60,0.35)] space-y-3 select-none"
          >
            {/* Widget Header Tag */}
            <div className="flex items-center justify-between border-b border-[#FF1A3C]/30 pb-2 text-[9px]">
              <div className="flex items-center gap-1.5 text-[#00E5FF] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-ping" />
                <span>[ ВИДЖЕТ // СВАЙП ДЛЯ СМЕНЫ ТРЕКА ]</span>
              </div>

              <span className="px-1.5 py-0.2 rounded bg-[#FF1A3C]/20 text-[#FF1A3C] border border-[#FF1A3C]/40 font-black text-[8px]">
                {track.hiResInfo?.format || 'FLAC 24B'}
              </span>
            </div>

            {/* Left/Right Dynamic Swipe Cues during drag */}
            {widgetDragOffset < -15 && (
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#FF1A3C]/40 to-transparent flex items-center justify-end pr-2 pointer-events-none rounded-r-2xl z-20">
                <ChevronRight className="w-6 h-6 text-[#FF1A3C] animate-pulse" />
              </div>
            )}
            {widgetDragOffset > 15 && (
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#00E5FF]/40 to-transparent flex items-center justify-start pl-2 pointer-events-none rounded-l-2xl z-20">
                <ChevronLeft className="w-6 h-6 text-[#00E5FF] animate-pulse" />
              </div>
            )}

            {/* Swipe Feedback Toast */}
            {swipeFeedback && (
              <div className="absolute -top-3 inset-x-0 flex justify-center z-30 pointer-events-none animate-in fade-in zoom-in-95">
                <span className="bg-[#180309] border border-[#FF1A3C] text-white px-3 py-0.5 rounded-full text-[10px] font-mono tracking-wider shadow-[0_0_12px_#FF1A3C]">
                  {swipeFeedback}
                </span>
              </div>
            )}

            {/* Track Info & Artwork */}
            <div className="flex items-center gap-3">
              {/* Artwork with subtle holographic ring */}
              <div
                onClick={() => {
                  onUnlock();
                  onOpenNowPlaying();
                }}
                className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#0A0206] shrink-0 border-2 border-[#FF1A3C]/70 cursor-pointer shadow-[0_0_12px_rgba(255,26,60,0.3)] group"
              >
                <CyberCoverImage
                  src={track.coverUrl}
                  alt={track.title}
                  className={`w-full h-full object-cover ${isPlaying ? 'scale-105' : ''}`}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 className="w-4 h-4 text-[#00E5FF]" />
                </div>
              </div>

              {/* Title & Artist */}
              <div className="min-w-0 flex-1 pr-1">
                <h3 className="text-sm font-black text-white truncate tracking-wide">
                  {track.title}
                </h3>
                <p className="text-[11px] text-[#FF4D6D] truncate mt-0.5">
                  {track.artist}
                </p>
                <span className="text-[9px] text-[#883344] truncate block">
                  {track.album || 'Папка Загрузки'}
                </span>
              </div>

              {/* Like / Favorite Button */}
              <button
                onClick={() => onToggleFavorite(track.id)}
                className="p-2 rounded-lg bg-[#18040C] border border-[#FF1A3C]/40 text-[#882233] hover:text-[#FF1A3C] transition-colors shrink-0"
              >
                <Heart
                  className={`w-4 h-4 ${track.isFavorite ? 'fill-[#FF1A3C] text-[#FF1A3C]' : ''}`}
                />
              </button>
            </div>

            {/* Live Synchronized Lyrics Karaoke Line */}
            {currentLyricLine && (
              <div className="bg-[#080104] border border-[#00E5FF]/40 rounded-xl px-3 py-1.5 text-center text-[10px] text-[#00E5FF] font-mono font-bold tracking-wide truncate drop-shadow-[0_0_8px_#00E5FF] animate-in fade-in duration-200">
                <span className="text-[#FF1A3C] mr-1.5">♪</span>
                {currentLyricLine}
              </div>
            )}

            {/* Mini Green Cyber Waveform Scrubber inside Lockscreen Widget */}
            <div className="pt-0.5">
              <CyberWaveformScrubber
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onSeek={onSeek}
                track={track}
                trackId={track.id}
                trackTitle={track.title}
                compact={true}
              />
            </div>

            {/* Widget Playback Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onPrev}
                className="p-2.5 rounded-xl bg-[#18040C] hover:bg-[#250412] text-white hover:text-[#FF1A3C] border border-[#FF1A3C]/30 transition-all active:scale-95"
                title="Предыдущий трек"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={onPlayPause}
                className="w-12 h-12 rounded-xl bg-[#FF1A3C] hover:bg-[#FF0033] text-black font-black flex items-center justify-center shadow-[0_0_18px_rgba(255,26,60,0.8)] transition-all active:scale-95"
                title={isPlaying ? 'Пауза' : 'Воспроизведение'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-black" />
                ) : (
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-2.5 rounded-xl bg-[#18040C] hover:bg-[#250412] text-white hover:text-[#FF1A3C] border border-[#FF1A3C]/30 transition-all active:scale-95"
                title="Следующий трек"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={() => {
                  onUnlock();
                  onOpenNowPlaying();
                }}
                className="p-2.5 rounded-xl bg-[#18040C] hover:bg-[#250412] text-[#00E5FF] hover:text-white border border-[#00E5FF]/40 transition-all active:scale-95"
                title="Развернуть Холо-дек"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#100308]/90 border border-[#FF1A3C]/40 rounded-2xl p-4 text-center space-y-2">
            <Cpu className="w-8 h-8 mx-auto text-[#FF1A3C]/50" />
            <p className="text-xs text-[#883344]">[ АУДИОПОТОК НЕ АКТИВЕН ]</p>
            <button
              onClick={onUnlock}
              className="px-3 py-1 bg-[#FF1A3C] text-black font-bold text-xs rounded-lg"
            >
              ОТКРЫТЬ МЕДИАТЕКУ
            </button>
          </div>
        )}
      </div>

      {/* Bottom Lockscreen Footer & Swipe to Unlock Prompt */}
      <div className="w-full max-w-sm mx-auto space-y-3 z-30 shrink-0 pb-1">
        {/* Swipe Prompt */}
        <div
          onClick={onUnlock}
          className="cursor-pointer text-center space-y-1 py-2 group"
        >
          <ChevronUp className="w-5 h-5 mx-auto text-[#00E5FF] animate-bounce" />
          <p className="text-[10px] font-black tracking-widest text-[#00E5FF] group-hover:text-white transition-colors">
            ПРОВЕДИТЕ ВВЕРХ ИЛИ НАЖМИТЕ ДЛЯ РАЗБЛОКИРОВКИ
          </p>
          <div className="w-32 h-1 mx-auto rounded-full bg-[#FF1A3C] shadow-[0_0_10px_#FF1A3C]" />
        </div>

        {/* Quick Shortcut Buttons (Flashlight & Camera) */}
        <div className="flex items-center justify-between px-4">
          <button
            onClick={() => setTorchActive(!torchActive)}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
              torchActive
                ? 'bg-white text-black border-white shadow-[0_0_15px_#FFFFFF]'
                : 'bg-[#18040C] text-[#FF4D6D] border-[#FF1A3C]/40 hover:border-[#FF1A3C]'
            }`}
            title="Фонарик"
          >
            <Flashlight className="w-4 h-4" />
          </button>

          <span className="text-[8px] text-[#883344] font-bold">
            MUAPLAY 2077 // AOD MODE
          </span>

          <button
            onClick={onUnlock}
            className="w-10 h-10 rounded-full bg-[#18040C] text-[#00E5FF] border border-[#00E5FF]/40 hover:border-[#00E5FF] flex items-center justify-center transition-all"
            title="Камера / Разблокировать"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
