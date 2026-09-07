import React, { useState, useRef } from 'react';
import { Play, Pause, SkipForward, Heart, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Track } from '../types/music';
import { useTrackWaveform } from '../hooks/useTrackWaveform';
import { CyberCoverImage } from './CyberCoverImage';

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev?: () => void;
  onOpenNowPlaying: () => void;
  onToggleFavorite: (trackId: string) => void;
  onSeek?: (seconds: number) => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onPrev,
  onOpenNowPlaying,
  onToggleFavorite,
  onSeek,
}) => {
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Track-specific cached DSP waveform resampled to 36 bars
  const { waveform: miniBars } = useTrackWaveform(track, 36);

  if (!track) return null;

  const progressPercent = duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;

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

    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      setIsSwiping(true);
      const clamped = Math.max(-50, Math.min(50, dx));
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
      if (dx < 0) {
        onNext();
      } else if (onPrev) {
        onPrev();
      }
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 400) {
      onOpenNowPlaying();
    }

    setDragOffset(0);
    setIsSwiping(false);
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
    setDragOffset(0);
    setIsSwiping(false);
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || duration <= 0) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercent = clickX / rect.width;
    onSeek(newPercent * duration);
  };

  return (
    <div className="mx-2 mb-1 z-30 shrink-0 select-none">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          transform: dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
          touchAction: 'pan-y',
        }}
        className="relative bg-[#100308]/95 backdrop-blur-xl border border-[#FF1A3C]/60 hover:border-[#FF1A3C] rounded-xl p-2.5 pt-3.5 shadow-[0_0_20px_rgba(255,26,60,0.25)] flex items-center justify-between cursor-pointer group transition-all overflow-hidden"
      >
        {/* Dynamic swipe edge glows */}
        {dragOffset < -15 && (
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#FF1A3C]/40 to-transparent flex items-center justify-end pr-1 pointer-events-none z-20">
            <ChevronRight className="w-5 h-5 text-[#FF1A3C] animate-pulse" />
          </div>
        )}
        {dragOffset > 15 && (
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#00E5FF]/40 to-transparent flex items-center justify-start pl-1 pointer-events-none z-20">
            <ChevronLeft className="w-5 h-5 text-[#00E5FF] animate-pulse" />
          </div>
        )}
        {/* Visible Cyberpunk Green Mini Waveform Seek Bar in Frame */}
        <div
          onClick={handleSeekClick}
          title="Нажмите для перемотки"
          className="absolute top-0 left-0 right-0 h-2.5 bg-[#011409]/90 border-b border-[#00FF66]/50 rounded-t-xl overflow-hidden flex items-center justify-between px-1.5 cursor-pointer z-10 hover:h-3 transition-all"
        >
          {/* Subtle center line */}
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#00FF66]/20 pointer-events-none" />

          {/* Waveform vertical bars */}
          <div className="w-full h-full flex items-center justify-between gap-[1px]">
            {miniBars.map((height, idx) => {
              const barPos = (idx / (miniBars.length - 1)) * 100;
              const isPlayed = barPos <= progressPercent;
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-[1px] transition-colors ${
                    isPlayed
                      ? 'bg-[#00FF66] shadow-[0_0_4px_#00FF66]'
                      : 'bg-[#00FF66]/20'
                  }`}
                  style={{ height: `${Math.max(height * 85, 20)}%` }}
                />
              );
            })}
          </div>

          {/* Laser Scrubber Head */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#00FF66] shadow-[0_0_8px_#00FF66] pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Left: Artwork & Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#0A0206] shrink-0 border border-[#FF1A3C]/40 shadow-[0_0_8px_rgba(255,26,60,0.2)]">
            <CyberCoverImage
              src={track.coverUrl}
              alt={track.title}
              className={`w-full h-full object-cover ${
                isPlaying ? 'scale-105 transition-transform duration-1000' : ''
              }`}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-[#FF1A3C]/20 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-ping" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#FFFFFF] truncate group-hover:text-[#00E5FF] transition-colors font-mono">
                {track.title}
              </h4>
              <span className="px-1 py-0.2 rounded font-mono font-bold text-[8px] shrink-0 bg-[#FF1A3C]/20 text-[#FF1A3C] border border-[#FF1A3C]/40">
                {track.hiResInfo.format}
              </span>
            </div>
            <p className="text-[10px] text-[#A64455] truncate mt-0.5 font-mono">
              {track.artist} <span className="text-[#FF1A3C]">//</span> {track.album}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleFavorite(track.id)}
            className="p-1.5 text-[#882233] hover:text-[#FF1A3C] transition-colors"
            title="В избранное"
          >
            <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-[#FF1A3C] text-[#FF1A3C]' : ''}`} />
          </button>

          <button
            onClick={onPlayPause}
            className="w-9 h-9 rounded-lg bg-[#FF1A3C] hover:bg-[#FF0033] text-black font-black flex items-center justify-center shadow-[0_0_12px_rgba(255,26,60,0.6)] transition-all transform hover:scale-105 active:scale-95"
            title={isPlaying ? 'Пауза' : 'Воспроизведение'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-1.5 text-[#882233] hover:text-[#FF8095] transition-colors"
            title="Следующий трек"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNowPlaying}
            className="p-1.5 text-[#882233] hover:text-[#00E5FF] transition-colors ml-0.5"
            title="Развернуть плеер"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
