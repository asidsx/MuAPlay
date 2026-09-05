import React from 'react';
import { Play, Pause, SkipForward, Heart, ChevronUp } from 'lucide-react';
import { Track } from '../types/music';

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onOpenNowPlaying: () => void;
  onToggleFavorite: (trackId: string) => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onOpenNowPlaying,
  onToggleFavorite,
}) => {
  if (!track) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mx-2 mb-1 z-30 shrink-0">
      <div
        onClick={onOpenNowPlaying}
        className="relative bg-[#100308]/95 backdrop-blur-xl border border-[#FF1A3C]/60 hover:border-[#FF1A3C] rounded-xl p-2.5 shadow-[0_0_20px_rgba(255,26,60,0.25)] flex items-center justify-between cursor-pointer group transition-all"
      >
        {/* Neon Cyber Progress Bar Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#080205] rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF1A3C] via-[#FF0055] to-[#00E5FF] transition-all duration-300 shadow-[0_0_8px_#FF1A3C]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Left: Artwork & Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#0A0206] shrink-0 border border-[#FF1A3C]/40 shadow-[0_0_8px_rgba(255,26,60,0.2)]">
            <img
              src={track.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
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
