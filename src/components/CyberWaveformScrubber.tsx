import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Activity, Clock, Database, CheckCircle2 } from 'lucide-react';
import { Track } from '../types/music';
import { useTrackWaveform } from '../hooks/useTrackWaveform';

interface CyberWaveformScrubberProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  track?: Partial<Track> | null;
  trackId?: string;
  trackTitle?: string;
  compact?: boolean;
}

export const CyberWaveformScrubber: React.FC<CyberWaveformScrubberProps> = ({
  currentTime,
  duration,
  isPlaying,
  onSeek,
  track,
  trackId = 'default-track',
  trackTitle = 'Neural Audio',
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const barCount = compact ? 48 : 68;

  const trackObj = useMemo(() => {
    if (track) return track;
    return { id: trackId, title: trackTitle, duration };
  }, [track, trackId, trackTitle, duration]);

  const { waveform: waveformBars, isCached, isGenerating, source } = useTrackWaveform(trackObj, barCount);

  const progressPercent = duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;

  const calculateTimeFromEvent = useCallback(
    (clientX: number) => {
      if (!containerRef.current || duration <= 0) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = clickX / rect.width;
      return percent * duration;
    },
    [duration]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const newTime = calculateTimeFromEvent(e.clientX);
    onSeek(newTime);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const seekTime = calculateTimeFromEvent(moveEvent.clientX);
      onSeek(seekTime);
      if (containerRef.current && duration > 0) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
        setHoverPercent((clickX / rect.width) * 100);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setHoverPercent((x / rect.width) * 100);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className={`relative w-full rounded-xl transition-all select-none font-mono ${
        compact
          ? 'p-2 bg-[#021208]/80 border border-[#00FF66]/40'
          : 'p-3 bg-[#011409]/85 border-2 border-[#00FF66]/60 shadow-[0_0_20px_rgba(0,255,102,0.18)]'
      }`}
    >
      {/* Top HUD Frame Header */}
      <div className="flex items-center justify-between mb-1.5 text-[9px] text-[#00FF66]">
        <div className="flex items-center gap-1.5 font-bold tracking-wider">
          <Activity className={`w-3 h-3 text-[#00FF66] ${isPlaying ? 'animate-pulse' : 'opacity-70'}`} />
          <span className="text-glow-green">
            {compact ? '[ DSP // WAVE ]' : '[ AUDIO_DSP // NEURAL_WAVEFORM ]'}
          </span>
          {isGenerating ? (
            <span className="text-[8px] px-1 py-0.2 rounded bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 animate-pulse hidden xs:inline">
              ГЕНЕРАЦИЯ DSP...
            </span>
          ) : isCached ? (
            <span
              className="text-[8px] px-1 py-0.2 rounded bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 flex items-center gap-0.5 hidden xs:inline-flex"
              title="Аудиоволна DSP сохранена в IndexedDB кэш"
            >
              <Database className="w-2.5 h-2.5" />
              КЭШ DSP
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#00FF66] font-black">
            {progressPercent.toFixed(0)}%
          </span>
          {!compact && (
            <span className="text-[8px] text-[#00FF66]/60 hidden xs:inline">
              {source === 'pcm' ? '// DECODED_PCM' : '// ACOUSTIC_DSP'}
            </span>
          )}
        </div>
      </div>

      {/* Interactive Waveform Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setHoverPercent(null);
        }}
        onMouseMove={handleMouseMove}
        className={`relative w-full cursor-pointer flex items-center justify-between overflow-hidden rounded-lg bg-[#000A04]/90 border border-[#00FF66]/30 ${
          compact ? 'h-11 px-1.5' : 'h-16 sm:h-20 px-2'
        }`}
        style={{ touchAction: 'none' }}
      >
        {/* Subtle Horizontal Center Zero-Line */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#00FF66]/20 -translate-y-1/2 z-0" />

        {/* Hover Scrub Preview Line & Tooltip */}
        {isHovering && hoverPercent !== null && (
          <>
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-[#00E5FF]/80 z-20 pointer-events-none"
              style={{ left: `${hoverPercent}%` }}
            />
            <div
              className="absolute -top-1 transform -translate-x-1/2 -translate-y-full z-30 pointer-events-none px-1.5 py-0.5 rounded bg-[#001F0E] border border-[#00FF66] text-[#00FF66] text-[8px] font-bold shadow-[0_0_8px_#00FF66]"
              style={{ left: `${hoverPercent}%` }}
            >
              {formatTime((hoverPercent / 100) * duration)}
            </div>
          </>
        )}

        {/* Mirrored Vertical Audio Bars (Image 3 Style) */}
        <div className="w-full h-full flex items-center justify-between gap-[2px] z-10">
          {waveformBars.map((barHeight, idx) => {
            const barPosPercent = (idx / (barCount - 1)) * 100;
            const isPlayed = barPosPercent <= progressPercent;

            // Height calculation: mirrored above and below center line
            const pixelHeightPercent = Math.max(barHeight * 90, 8);

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-center h-full group"
              >
                {/* Mirrored audio bar: Top half & Bottom half around center */}
                <div
                  className={`w-full rounded-sm transition-all duration-100 ${
                    isPlayed
                      ? 'bg-[#00FF66] shadow-[0_0_6px_rgba(0,255,102,0.85)]'
                      : 'bg-[#00FF66]/20 hover:bg-[#00FF66]/40'
                  }`}
                  style={{
                    height: `${pixelHeightPercent}%`,
                    opacity: isPlayed ? 1 : 0.4,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Glowing Laser Playhead Indicator */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center"
          style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
        >
          {/* Top Reticle Marker */}
          <div className="w-2.5 h-1.5 bg-[#00FF66] clip-polygon shadow-[0_0_10px_#00FF66] rounded-xs" />

          {/* Laser Line */}
          <div className="flex-1 w-[2px] bg-[#00FF66] shadow-[0_0_12px_#00FF66]" />

          {/* Bottom Reticle Marker */}
          <div className="w-2.5 h-1.5 bg-[#00FF66] clip-polygon shadow-[0_0_10px_#00FF66] rounded-xs" />
        </div>
      </div>

      {/* Bottom Timestamps & Cyber Telemetry */}
      <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#00FF66]/80" />
          <span className="font-black text-[#00FF66] text-glow-green">
            {formatTime(currentTime)}
          </span>
        </div>

        {!compact && (
          <div className="text-[9px] text-[#00FF66]/60 font-bold hidden sm:block">
            // SEEK_TRACK // BUFFER 100% //
          </div>
        )}

        <div className="flex items-center gap-1">
          <span className="font-bold text-[#00FF66]/80">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
