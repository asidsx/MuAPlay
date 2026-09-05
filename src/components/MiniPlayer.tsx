import React from 'react';
import { Play, Pause, SkipForward, Heart, ChevronUp, Music } from 'lucide-react';
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
        className="relative bg-[#141414]/95 backdrop-blur-xl border border-[#1F1F1F] hover:border-[#7C4DFF]/40 rounded-2xl p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.85)] flex items-center justify-between cursor-pointer group transition-all"
      >
        {/* Progress Bar Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#0A0A0A] rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7C4DFF] to-[#00E5FF] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Left: Artwork & Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[#0A0A0A] shrink-0 border border-[#1F1F1F] shadow-md">
            <img
              src={track.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
              alt={track.title}
              className={`w-full h-full object-cover ${
                isPlaying ? 'scale-105 transition-transform duration-1000' : ''
              }`}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-[#7C4DFF]/20 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#E0E0E0] truncate group-hover:text-[#00E5FF] transition-colors">
                {track.title}
              </h4>
              <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] shrink-0 ${
                track.hiResInfo.isLossless
                  ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20'
                  : 'bg-[#1A1A1A] text-[#777777]'
              }`}>
                {track.hiResInfo.format}
              </span>
            </div>
            <p className="text-[10px] text-[#777777] truncate mt-0.5">
              {track.artist} • {track.album}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleFavorite(track.id)}
            className="p-1.5 text-[#777777] hover:text-rose-400 transition-colors"
          >
            <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={onPlayPause}
            className="w-9 h-9 rounded-full bg-[#7C4DFF] hover:bg-[#6C3DFF] text-white flex items-center justify-center shadow-md shadow-purple-500/25 transition-all transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-1.5 text-[#777777] hover:text-[#E0E0E0] transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNowPlaying}
            className="p-1.5 text-[#555555] hover:text-[#00E5FF] transition-colors ml-1"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
