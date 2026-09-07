import React, { useState, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Sliders,
  ShieldCheck,
  Radio,
  Cpu,
  Activity,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Track } from '../types/music';
import { CyberWaveformScrubber } from './CyberWaveformScrubber';
import { CyberLyricsView } from './CyberLyricsView';
import { CyberCoverImage } from './CyberCoverImage';
import { CyberTelemetryView } from './CyberTelemetryView';
import { CyberReactiveRing } from './CyberReactiveRing';

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  isRepeat: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenEQ: () => void;
  onLockScreen?: () => void;
  onUpdateLyrics?: (trackId: string, lyrics: string) => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  isShuffle,
  isRepeat,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onOpenEQ,
  onLockScreen,
  onUpdateLyrics,
}) => {
  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics' | 'details'>('cover');
  const [isMuted, setIsMuted] = useState(false);
  const [isTouchLocked, setIsTouchLocked] = useState(false);
  const [isRingFxEnabled, setIsRingFxEnabled] = useState<boolean>(() => {
    return localStorage.getItem('cyber_ring_fx_enabled') !== 'false';
  });
  const [ringToast, setRingToast] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [swipeFeedback, setSwipeFeedback] = useState<string | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const toggleRingAnimation = () => {
    setIsRingFxEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('cyber_ring_fx_enabled', String(next));
      setRingToast(next ? '⚡ ЭКВАЛАЙЗЕР-ОРБИТА: ВКЛ' : '🔋 ЭКОНОМИЯ ЭНЕРГИИ: АНИМАЦИЯ ВЫКЛ');
      setTimeout(() => {
        setRingToast(null);
      }, 2000);
      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    setIsSwiping(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      setIsSwiping(true);
      const clamped = Math.max(-65, Math.min(65, dx));
      setDragOffset(clamped);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const dt = Date.now() - pointerStartRef.current.time;
    pointerStartRef.current = null;

    if (Math.abs(dx) >= 35 && Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx < 0) {
        // Right to left swipe -> Next track
        onNext();
        setSwipeFeedback('⏭️ СЛЕДУЮЩИЙ ТРЕК');
      } else {
        // Left to right swipe -> Prev track
        onPrev();
        setSwipeFeedback('⏮️ ПРЕДЫДУЩИЙ ТРЕК');
      }
      setTimeout(() => setSwipeFeedback(null), 1200);
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 400) {
      // Tap/click -> toggle ring FX
      toggleRingAnimation();
    }

    setDragOffset(0);
    setIsSwiping(false);
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
    setDragOffset(0);
    setIsSwiping(false);
  };

  if (!isOpen || !track) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      onVolumeChange(0.8);
      setIsMuted(false);
    } else {
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070104]/98 backdrop-blur-2xl flex flex-col justify-between pt-8 pb-4 px-4 sm:p-6 overflow-hidden animate-in fade-in duration-300 font-sans">
      {/* Subtle CRT Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none cyberpunk-scanlines opacity-40 z-0" />

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between text-[#E0E0E0] z-10 border-b border-[#FF1A3C]/40 pb-3 pt-1">
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-[#150308] border border-[#FF1A3C]/50 text-[#FF4D6D] hover:text-white hover:border-[#FF1A3C] transition-colors"
          title="Свернуть плеер"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="text-center font-mono">
          <span className="text-[10px] tracking-widest text-[#FF1A3C] font-black block text-glow-red">
            [ NEURAL_AUDIO // DIRECT_LINK ]
          </span>
          <span className="text-xs text-[#00E5FF] font-medium tracking-wide">
            {track.album || 'CYBER_DATABASE'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Touch Lock Toggle */}
          <button
            onClick={() => setIsTouchLocked(!isTouchLocked)}
            className={`p-2 rounded-lg border transition-all ${
              isTouchLocked
                ? 'bg-[#FF1A3C] text-black border-[#FF1A3C] shadow-[0_0_15px_rgba(255,26,60,0.8)]'
                : 'bg-[#150308] border-[#FF1A3C]/50 text-[#FF4D6D] hover:border-[#FF1A3C] hover:text-white'
            }`}
            title={
              isTouchLocked
                ? 'Управление заблокировано (нажмите для разблокировки)'
                : 'Заблокировать управление (защита от нажатий в кармане)'
            }
          >
            {isTouchLocked ? <Lock className="w-5 h-5 fill-black" /> : <Lock className="w-5 h-5" />}
          </button>

          <button
            onClick={onOpenEQ}
            className="p-2 rounded-lg bg-[#150308] border border-[#00E5FF]/50 text-[#00E5FF] hover:border-[#00E5FF] hover:shadow-[0_0_10px_rgba(0,229,255,0.4)] transition-colors"
            title="Открыть DSP Эквалайзер"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Cover / Lyrics / Info Switcher */}
      <div className="flex-1 my-4 flex flex-col items-center justify-center relative overflow-hidden z-10">
        {/* Tab switch buttons */}
        <div className="flex items-center gap-2 bg-[#120308] p-1 rounded-lg border border-[#FF1A3C]/40 mb-4 font-mono">
          <button
            onClick={() => setActiveTab('cover')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
              activeTab === 'cover'
                ? 'bg-[#FF1A3C] text-black shadow-[0_0_10px_rgba(255,26,60,0.6)]'
                : 'text-[#882233] hover:text-[#FF8095]'
            }`}
          >
            [ ХОЛО-ДЕК ]
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
              activeTab === 'lyrics'
                ? 'bg-[#FF1A3C] text-black shadow-[0_0_10px_rgba(255,26,60,0.6)]'
                : 'text-[#882233] hover:text-[#FF8095]'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>[ ЛИРИКА / LRC ]</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
              activeTab === 'details'
                ? 'bg-[#FF1A3C] text-black shadow-[0_0_10px_rgba(255,26,60,0.6)]'
                : 'text-[#882233] hover:text-[#FF8095]'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>[ ТЕЛЕМЕТРИЯ ]</span>
          </button>
        </div>

        {/* Tab 1: Spinning Reactive Holographic Equalizer Ring & Cyber Album Cover */}
        {activeTab === 'cover' && (
          <div className="relative flex flex-col items-center justify-center my-auto py-2">
            <CyberReactiveRing isPlaying={isPlaying} enabled={isRingFxEnabled} size={320}>
              {/* Album Card inside Cyberpunk Frame with Touch/Mouse Swipe support */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                style={{
                  transform: dragOffset !== 0 ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.08}deg)` : undefined,
                  transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
                  touchAction: 'pan-y',
                }}
                className={`relative w-48 h-48 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border-2 cursor-grab active:cursor-grabbing select-none group focus:outline-none ${
                  isRingFxEnabled
                    ? 'border-[#FF1A3C]/80 ' + (isPlaying ? 'scale-100 shadow-[0_0_35px_rgba(255,26,60,0.5)]' : 'scale-95')
                    : 'border-[#555]/60 opacity-90 scale-95 shadow-lg grayscale-[15%]'
                }`}
                title="Свайп влево — следующий трек, свайп вправо — предыдущий. Тап — переключение анимации"
              >
                <CyberCoverImage
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0206]/80 via-transparent to-transparent pointer-events-none" />
                
                {/* Corner HUD brackets */}
                <div className="absolute top-2 left-2 text-[9px] font-mono font-bold text-[#FF1A3C] bg-[#0A0206]/80 px-1.5 py-0.5 rounded border border-[#FF1A3C]/40 pointer-events-none">
                  [ {track.hiResInfo?.format || 'AUDIO'} // {track.hiResInfo?.sampleRate ? `${track.hiResInfo.sampleRate / 1000}k` : '44.1k'} ]
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono font-bold text-[#00E5FF] bg-[#0A0206]/80 px-1.5 py-0.5 rounded border border-[#00E5FF]/40 pointer-events-none">
                  {track.hiResInfo?.isLossless ? 'LOSSLESS' : 'HI-RES'}
                </div>

                {/* Left/Right Interactive Dynamic Swipe Cues during drag */}
                {dragOffset < -15 && (
                  <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#FF1A3C]/40 to-transparent flex items-center justify-end pr-2 pointer-events-none animate-in fade-in">
                    <ChevronRight className="w-6 h-6 text-[#FF1A3C] animate-pulse" />
                  </div>
                )}
                {dragOffset > 15 && (
                  <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#00E5FF]/40 to-transparent flex items-center justify-start pl-2 pointer-events-none animate-in fade-in">
                    <ChevronLeft className="w-6 h-6 text-[#00E5FF] animate-pulse" />
                  </div>
                )}

                {/* Battery Saver Status Badge on Cover */}
                {!isRingFxEnabled && (
                  <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none animate-in fade-in">
                    <span className="text-[9px] font-mono font-bold text-[#00E5FF] bg-[#0A0206]/90 px-2 py-0.5 rounded-full border border-[#00E5FF]/50 shadow-md">
                      🔋 [ FX: OFF // ТАП ДЛЯ ВКЛ ]
                    </span>
                  </div>
                )}
              </div>
            </CyberReactiveRing>

            {/* Quick Swipe Toast Feedback or Ring Toggle Notification */}
            {(swipeFeedback || ringToast) && (
              <div className="absolute -bottom-2 z-30 bg-[#150308]/95 border border-[#FF1A3C] text-white px-3 py-1 rounded-full text-[10px] font-mono tracking-wider shadow-[0_0_15px_rgba(255,26,60,0.6)] animate-in fade-in zoom-in-95 duration-200">
                {swipeFeedback || ringToast}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Synced Cyber Subtitles & Lyrics (LRCLIB + Local LRC) */}
        {activeTab === 'lyrics' && (
          <CyberLyricsView
            track={track}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={onSeek}
            onUpdateLyrics={onUpdateLyrics || (() => {})}
          />
        )}

        {/* Tab 3: Detailed Hi-Res Audio Format Telemetry */}
        {activeTab === 'details' && (
          <CyberTelemetryView
            track={track}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
          />
        )}
      </div>

      {/* Bottom Track Controls & Progress */}
      <div className="w-full max-w-md mx-auto space-y-4 shrink-0 z-10 font-mono relative">
        {/* Track Title & Favorite */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-base sm:text-lg font-black text-[#FFFFFF] truncate tracking-wide">
              {track.title}
            </h2>
            <p className="text-xs text-[#FF4D6D] truncate mt-0.5">
              {track.artist} <span className="text-[#883344]">//</span> {track.album}
            </p>
          </div>

          <button
            onClick={() => onToggleFavorite(track.id)}
            className="p-2 rounded-lg bg-[#150308] border border-[#FF1A3C]/40 text-[#882233] hover:text-[#FF1A3C] transition-colors"
            title="В избранное"
          >
            <Heart
              className={`w-5 h-5 ${
                track.isFavorite ? 'fill-[#FF1A3C] text-[#FF1A3C]' : ''
              }`}
            />
          </button>
        </div>

        {/* Cyberpunk Audio Waveform Scrubbing Bar */}
        <div className="pt-1">
          <CyberWaveformScrubber
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={onSeek}
            track={track}
            trackId={track.id}
            trackTitle={track.title}
          />
        </div>

        {/* Playback Controls (Shuffle, Prev, Play/Pause, Next, Loop) */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onToggleShuffle}
            className={`p-2 rounded-lg transition-colors border ${
              isShuffle
                ? 'text-[#00E5FF] bg-[#00E5FF]/15 border-[#00E5FF]/50 shadow-[0_0_8px_rgba(0,229,255,0.4)]'
                : 'text-[#882233] border-transparent hover:text-[#FF8095]'
            }`}
            title="Перемешать"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            className="p-2 text-[#E0E0E0] hover:text-[#FF1A3C] transition-colors"
            title="Предыдущий трек"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onPlayPause}
            className="w-14 h-14 rounded-2xl bg-[#FF1A3C] hover:bg-[#FF0033] text-black font-black flex items-center justify-center shadow-[0_0_20px_rgba(255,26,60,0.8)] transition-all transform hover:scale-105 active:scale-95"
            title={isPlaying ? 'Пауза' : 'Воспроизведение'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2 text-[#E0E0E0] hover:text-[#FF1A3C] transition-colors"
            title="Следующий трек"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-2 rounded-lg transition-colors border ${
              isRepeat
                ? 'text-[#00E5FF] bg-[#00E5FF]/15 border-[#00E5FF]/50 shadow-[0_0_8px_rgba(0,229,255,0.4)]'
                : 'text-[#882233] border-transparent hover:text-[#FF8095]'
            }`}
            title="Повтор"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Touch Lock Protective HUD Overlay */}
        {isTouchLocked && (
          <div className="absolute inset-0 -top-2 bg-[#080205]/92 backdrop-blur-md rounded-2xl border-2 border-[#FF1A3C] z-30 flex flex-col items-center justify-center p-4 text-center space-y-3 shadow-[0_0_30px_rgba(255,26,60,0.5)] animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-[#FF1A3C] font-black text-xs">
              <Lock className="w-4 h-4 text-[#FF1A3C] animate-pulse" />
              <span>[ УПРАВЛЕНИЕ ЗАБЛОКИРОВАНО ]</span>
            </div>
            <p className="text-[10px] text-[#00E5FF]">
              Защита от случайных нажатий в кармане активна
            </p>
            <button
              type="button"
              onClick={() => setIsTouchLocked(false)}
              className="px-5 py-2 bg-[#FF1A3C] hover:bg-[#FF2E50] text-black rounded-xl text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,26,60,0.7)] active:scale-95 transition-all"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>РАЗБЛОКИРОВАТЬ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
