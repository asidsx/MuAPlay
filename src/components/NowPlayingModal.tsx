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
  Sliders,
  ShieldCheck,
  Radio,
  Cpu,
  Activity,
  Lock,
} from 'lucide-react';
import { Track } from '../types/music';
import { CyberWaveformScrubber } from './CyberWaveformScrubber';

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
}) => {
  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics' | 'details'>('cover');
  const [isMuted, setIsMuted] = useState(false);

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
    <div className="fixed inset-0 z-50 bg-[#070104]/98 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-in fade-in duration-300 font-sans">
      {/* Subtle CRT Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none cyberpunk-scanlines opacity-40 z-0" />

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between text-[#E0E0E0] z-10 border-b border-[#FF1A3C]/40 pb-3">
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
          {onLockScreen && (
            <button
              onClick={onLockScreen}
              className="p-2 rounded-lg bg-[#150308] border border-[#FF1A3C]/50 text-[#FF4D6D] hover:border-[#FF1A3C] hover:text-white transition-colors"
              title="Экран блокировки (AOD виджет)"
            >
              <Lock className="w-5 h-5" />
            </button>
          )}

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
            <span>[ ТЕКСТ ]</span>
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

        {/* Tab 1: Spinning Holographic Cyber Album Cover */}
        {activeTab === 'cover' && (
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-auto">
            {/* Background Holographic Glow & Rotating Cyber Ring */}
            <div
              className={`absolute inset-0 rounded-full border-2 border-dashed border-[#FF1A3C]/40 transition-all duration-1000 ${
                isPlaying ? 'animate-spin opacity-100 scale-105' : 'opacity-30 scale-95'
              }`}
              style={{ animationDuration: '15s' }}
            />
            <div
              className={`absolute inset-2 rounded-full border border-[#00E5FF]/40 transition-all duration-1000 ${
                isPlaying ? 'opacity-80 scale-100' : 'opacity-20'
              }`}
            />
            <div
              className={`absolute inset-0 rounded-full bg-[#FF1A3C]/15 blur-3xl transition-opacity duration-1000 ${
                isPlaying ? 'opacity-100' : 'opacity-20'
              }`}
            />

            {/* Album Card inside Cyberpunk Frame */}
            <div
              className={`relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-[#FF1A3C]/80 transition-transform duration-700 ${
                isPlaying ? 'scale-100 shadow-[0_0_25px_rgba(255,26,60,0.4)]' : 'scale-95'
              }`}
            >
              <img
                src={track.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
                alt={track.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0206]/80 via-transparent to-transparent" />
              
              {/* Corner HUD brackets */}
              <div className="absolute top-2 left-2 text-[9px] font-mono font-bold text-[#FF1A3C] bg-[#0A0206]/80 px-1.5 py-0.5 rounded border border-[#FF1A3C]/40">
                [ 24-BIT / 192k ]
              </div>
              <div className="absolute bottom-2 right-2 text-[9px] font-mono font-bold text-[#00E5FF] bg-[#0A0206]/80 px-1.5 py-0.5 rounded border border-[#00E5FF]/40">
                LOSSLESS
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Synced Lyrics */}
        {activeTab === 'lyrics' && (
          <div className="w-full max-w-md h-64 sm:h-72 bg-[#120308]/90 border border-[#FF1A3C]/40 rounded-2xl p-4 overflow-y-auto space-y-3 text-center my-auto font-mono">
            {track.lyrics ? (
              track.lyrics.split('\n').map((line, idx) => (
                <p
                  key={idx}
                  className={`text-xs sm:text-sm font-medium transition-all ${
                    idx === 1 ? 'text-[#00E5FF] font-bold scale-105 text-glow-cyan' : 'text-[#883344]'
                  }`}
                >
                  {line.replace(/\[\d{2}:\d{2}\.\d{2}\]/, '')}
                </p>
              ))
            ) : (
              <div className="py-16 text-[#883344] space-y-2">
                <Radio className="w-8 h-8 mx-auto opacity-50 text-[#FF1A3C]" />
                <p className="text-xs">[ НЕЙРО-ТЕКСТ НЕДОСТУПЕН ]</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Detailed Hi-Res Audio Format Telemetry */}
        {activeTab === 'details' && (
          <div className="w-full max-w-md bg-[#120308]/95 border border-[#FF1A3C]/50 rounded-2xl p-4 space-y-2.5 text-xs text-[#E0E0E0] my-auto font-mono shadow-[0_0_20px_rgba(255,26,60,0.2)]">
            <div className="flex items-center justify-between pb-2 border-b border-[#FF1A3C]/30">
              <span className="font-bold text-[#FFFFFF] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#00E5FF]" />
                <span>CYBER_DSP // ТЕЛЕМЕТРИЯ</span>
              </span>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-[#FF1A3C]/20 text-[#FF1A3C] border border-[#FF1A3C]/40">
                [ {track.hiResInfo.format} ]
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-[#0A0206] p-2 rounded-lg border border-[#FF1A3C]/30">
                <span className="text-[#883344] block text-[9px] uppercase">КОДЕК</span>
                <span className="font-bold text-[#00E5FF]">{track.hiResInfo.format}</span>
              </div>
              <div className="bg-[#0A0206] p-2 rounded-lg border border-[#FF1A3C]/30">
                <span className="text-[#883344] block text-[9px] uppercase">РАЗРЯДНОСТЬ</span>
                <span className="font-bold text-[#FF1A3C]">
                  {track.hiResInfo.bitDepth ? `${track.hiResInfo.bitDepth}-BIT LOSSLESS` : '16-BIT PCM'}
                </span>
              </div>
              <div className="bg-[#0A0206] p-2 rounded-lg border border-[#FF1A3C]/30">
                <span className="text-[#883344] block text-[9px] uppercase">ЧАСТОТА</span>
                <span className="font-bold text-[#00E5FF]">
                  {track.hiResInfo.sampleRate ? `${track.hiResInfo.sampleRate / 1000} kHz` : '44.1 kHz'}
                </span>
              </div>
              <div className="bg-[#0A0206] p-2 rounded-lg border border-[#FF1A3C]/30">
                <span className="text-[#883344] block text-[9px] uppercase">БИТРЕЙТ</span>
                <span className="font-bold text-[#FF1A3C]">
                  {track.hiResInfo.bitrateKbps ? `${track.hiResInfo.bitrateKbps} kbps` : '1411 kbps'}
                </span>
              </div>
            </div>

            <div className="bg-[#0A0206] p-2 rounded-lg border border-[#FF1A3C]/30 text-[10px] break-all text-[#884455] mt-2">
              <span className="text-[#883344] block uppercase text-[9px]">ПУТЬ В ПАМЯТИ:</span>
              <span className="text-[#E0E0E0]">{track.filePath || '/storage/emulated/0/Download/'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Track Controls & Progress */}
      <div className="w-full max-w-md mx-auto space-y-4 shrink-0 z-10 font-mono">
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

        {/* Volume Bar */}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleVolumeToggle} className="text-[#882233] hover:text-[#FF1A3C]">
            {volume === 0 || isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-[#1A030A] accent-[#00E5FF] rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
