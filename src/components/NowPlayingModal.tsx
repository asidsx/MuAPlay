import React, { useState } from 'react';
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
  Disc,
  Info,
  Mic2,
  Share2,
  Sparkles,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { Track } from '../types/music';

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
}) => {
  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics' | 'details'>('cover');
  const [isMuted, setIsMuted] = useState(false);

  if (!isOpen || !track) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
    <div className="fixed inset-0 z-50 bg-[#0A0A0A]/98 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between text-[#E0E0E0] z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#1F1F1F] text-[#888888] hover:text-[#E0E0E0] transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E5FF] font-bold block">
            Слушаете сейчас
          </span>
          <span className="text-xs text-[#777777] font-medium">{track.album}</span>
        </div>

        <button
          onClick={onOpenEQ}
          className="p-2 rounded-full hover:bg-[#1F1F1F] text-[#7C4DFF] transition-colors"
          title="Открыть Эквалайзер"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area: Cover / Lyrics / Info Switcher */}
      <div className="flex-1 my-4 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Tab switch buttons */}
        <div className="flex items-center gap-2 bg-[#121212] p-1 rounded-2xl border border-[#1F1F1F] mb-4 z-10">
          <button
            onClick={() => setActiveTab('cover')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'cover'
                ? 'bg-[#7C4DFF] text-white shadow-md shadow-purple-500/20'
                : 'text-[#777777] hover:text-[#E0E0E0]'
            }`}
          >
            Обложка
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'lyrics'
                ? 'bg-[#7C4DFF] text-white shadow-md shadow-purple-500/20'
                : 'text-[#777777] hover:text-[#E0E0E0]'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Текст</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'details'
                ? 'bg-[#7C4DFF] text-white shadow-md shadow-purple-500/20'
                : 'text-[#777777] hover:text-[#E0E0E0]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Hi-Res инфо</span>
          </button>
        </div>

        {/* Tab 1: Spinning Vinyl / Glow Album Cover */}
        {activeTab === 'cover' && (
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-auto">
            {/* Background Glow */}
            <div
              className={`absolute inset-0 rounded-full bg-[#7C4DFF]/20 blur-3xl transition-opacity duration-1000 ${
                isPlaying ? 'opacity-100 scale-110' : 'opacity-30'
              }`}
            />

            {/* Album Card */}
            <div
              className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-[#222222] transition-transform duration-700 ${
                isPlaying ? 'scale-100' : 'scale-95'
              }`}
            >
              <img
                src={track.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
                alt={track.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/70 via-transparent to-transparent" />
            </div>
          </div>
        )}

        {/* Tab 2: Synced Lyrics */}
        {activeTab === 'lyrics' && (
          <div className="w-full max-w-md h-64 sm:h-72 bg-[#121212]/80 border border-[#1F1F1F] rounded-3xl p-4 overflow-y-auto space-y-3 text-center my-auto">
            {track.lyrics ? (
              track.lyrics.split('\n').map((line, idx) => (
                <p
                  key={idx}
                  className={`text-xs sm:text-sm font-medium transition-all ${
                    idx === 1 ? 'text-[#00E5FF] font-bold scale-105' : 'text-[#777777]'
                  }`}
                >
                  {line.replace(/\[\d{2}:\d{2}\.\d{2}\]/, '')}
                </p>
              ))
            ) : (
              <div className="py-16 text-[#555555] space-y-2">
                <Mic2 className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs">Текст песни пока недоступен</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Detailed Hi-Res Audio Format Info */}
        {activeTab === 'details' && (
          <div className="w-full max-w-md bg-[#121212] border border-[#1F1F1F] rounded-3xl p-4 space-y-2.5 text-xs text-[#E0E0E0] my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F1F1F]">
              <span className="font-bold text-[#FFFFFF] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
                Параметры аудиопотока
              </span>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                {track.hiResInfo.format}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="bg-[#0A0A0A] p-2.5 rounded-xl border border-[#1F1F1F]">
                <span className="text-[#555555] block text-[10px]">Формат кодека</span>
                <span className="font-bold text-[#7C4DFF]">{track.hiResInfo.format}</span>
              </div>
              <div className="bg-[#0A0A0A] p-2.5 rounded-xl border border-[#1F1F1F]">
                <span className="text-[#555555] block text-[10px]">Разрядность (Bit depth)</span>
                <span className="font-bold text-[#7C4DFF]">
                  {track.hiResInfo.bitDepth ? `${track.hiResInfo.bitDepth}-Bit` : '16-Bit Standard'}
                </span>
              </div>
              <div className="bg-[#0A0A0A] p-2.5 rounded-xl border border-[#1F1F1F]">
                <span className="text-[#555555] block text-[10px]">Частота дискретизации</span>
                <span className="font-bold text-[#7C4DFF]">
                  {track.hiResInfo.sampleRate ? `${track.hiResInfo.sampleRate / 1000} kHz` : '44.1 kHz'}
                </span>
              </div>
              <div className="bg-[#0A0A0A] p-2.5 rounded-xl border border-[#1F1F1F]">
                <span className="text-[#555555] block text-[10px]">Битрейт</span>
                <span className="font-bold text-[#7C4DFF]">
                  {track.hiResInfo.bitrateKbps ? `${track.hiResInfo.bitrateKbps} kbps` : '1411 kbps'}
                </span>
              </div>
            </div>

            <div className="bg-[#0A0A0A] p-2.5 rounded-xl border border-[#1F1F1F] text-[10px] font-mono break-all text-[#777777] mt-2">
              <span className="text-[#555555] block">Путь к файлу:</span>
              <span className="text-[#E0E0E0]">{track.filePath || '/storage/emulated/0/Download/'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Track Controls & Progress */}
      <div className="w-full max-w-md mx-auto space-y-4 shrink-0">
        {/* Track Title & Favorite */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-lg font-black text-[#FFFFFF] truncate">{track.title}</h2>
            <p className="text-xs text-[#777777] truncate mt-0.5">{track.artist}</p>
          </div>

          <button
            onClick={() => onToggleFavorite(track.id)}
            className="p-2 rounded-full hover:bg-[#1A1A1A] text-[#777777] hover:text-rose-400 transition-colors"
          >
            <Heart
              className={`w-6 h-6 ${
                track.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Scrubbing Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#1F1F1F] accent-[#7C4DFF] rounded-lg appearance-none cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-[#555555]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls (Shuffle, Prev, Play/Pause, Next, Loop) */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onToggleShuffle}
            className={`p-2.5 rounded-2xl transition-colors ${
              isShuffle ? 'text-[#7C4DFF] bg-[#7C4DFF]/15' : 'text-[#555555] hover:text-[#E0E0E0]'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={onPrev}
            className="p-2.5 text-[#E0E0E0] hover:text-[#7C4DFF] transition-colors"
          >
            <SkipBack className="w-6 h-6 fill-[#E0E0E0]" />
          </button>

          <button
            onClick={onPlayPause}
            className="w-16 h-16 rounded-3xl bg-[#7C4DFF] hover:bg-[#6C3DFF] text-white flex items-center justify-center shadow-xl shadow-purple-500/30 transition-transform active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2.5 text-[#E0E0E0] hover:text-[#7C4DFF] transition-colors"
          >
            <SkipForward className="w-6 h-6 fill-[#E0E0E0]" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-2.5 rounded-2xl transition-colors ${
              isRepeat ? 'text-[#7C4DFF] bg-[#7C4DFF]/15' : 'text-[#555555] hover:text-[#E0E0E0]'
            }`}
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* Volume Bar */}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleVolumeToggle} className="text-[#777777] hover:text-[#E0E0E0]">
            {volume === 0 || isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-[#1F1F1F] accent-[#7C4DFF] rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
