import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Brain,
  Database,
  Network,
  Play,
  Pause,
  Sliders,
  Terminal,
  Zap,
  Volume2,
  ShieldAlert,
  Radio,
  Eye,
  RotateCw,
  Sparkles,
  Lock,
  Unlock,
  RadioTower,
  Cpu,
  Layers
} from 'lucide-react';
import { Track } from '../types/music';
import { audioEngine } from '../services/audioEngine';

interface CyberpunkHudViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayTrack: (track: Track) => void;
  onPlayPause: () => void;
  onToggleFavorite: (trackId: string) => void;
}

export const CyberpunkHudView: React.FC<CyberpunkHudViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onPlayTrack,
  onPlayPause,
}) => {
  const [hudTab, setHudTab] = useState<'brain' | 'subjects' | 'network'>('brain');
  const [selectedSubject, setSelectedSubject] = useState<string>('jefferson');
  const [subtitleIndex, setSubtitleIndex] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cyberpunk dialogue log lines matching the exact screenshot subtitles!
  const dialogues = [
    {
      speaker: 'V:',
      color: 'text-[#00E5FF]',
      text: 'Pictures, medical records... vulnerability to neuroplasticity? It\'s some kinda database.',
    },
    {
      speaker: 'Johnny:',
      color: 'text-[#FF2A4D]',
      text: 'What about that? The blue circle in the brain scan... that\'s where the signal is coming from.',
    },
    {
      speaker: 'Johnny:',
      color: 'text-[#FF2A4D]',
      text: 'Quick, download the data. Whoever comes lookin\' for it - that\'s your suspect.',
    },
    {
      speaker: 'SYS.NET:',
      color: 'text-amber-400',
      text: `DECRYPTING AUDIO WAVE: ${currentTrack?.title || 'NEURAL_LINK.FLAC'} [32-BIT / 384kHz LOSSLESS]`,
    },
  ];

  // Rotate dialogue logs periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % dialogues.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [dialogues.length]);

  // Render Futuristic Brain Scan & Frequency Radial Visualizer Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Dark background with red grid
      ctx.fillStyle = '#060205';
      ctx.fillRect(0, 0, width, height);

      // Red Grid Lines
      ctx.strokeStyle = 'rgba(255, 26, 60, 0.12)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render Brain Wireframe Contour Silhouette
      ctx.save();
      ctx.translate(centerX, centerY - 10);

      // Outer Brain Scan Crimson Oval Rings
      ctx.strokeStyle = 'rgba(255, 26, 60, 0.8)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FF1A3C';
      ctx.shadowBlur = isPlaying ? 15 : 5;

      ctx.beginPath();
      ctx.ellipse(0, 0, 85, 105, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 26, 60, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(0, 0, 100, 120, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner Brain Slices (MRI style contours)
      ctx.strokeStyle = 'rgba(255, 60, 90, 0.6)';
      ctx.lineWidth = 1.5;
      
      // Left hemisphere lobes
      ctx.beginPath();
      ctx.ellipse(-25, -20, 35, 55, -0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Right hemisphere lobes
      ctx.beginPath();
      ctx.ellipse(25, -20, 35, 55, 0.2, 0, Math.PI * 2);
      ctx.stroke();

      // Cerebellum base
      ctx.beginPath();
      ctx.ellipse(0, 50, 45, 25, 0, 0, Math.PI * 2);
      ctx.stroke();

      // THE FAMOUS GLOWING BLUE NEURO-SIGNAL CIRCLE (as seen in screenshot 2!)
      const pulseRadius = isPlaying ? 28 + Math.sin(angle * 3) * 6 : 28;
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 20;

      // Blue outer aura ring
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-10, -25, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Blue filled core pulse
      ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(-10, -25, pulseRadius - 4, 0, Math.PI * 2);
      ctx.fill();

      // Center crosshair inside blue circle
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-22, -25);
      ctx.lineTo(2, -25);
      ctx.moveTo(-10, -37);
      ctx.lineTo(-10, -13);
      ctx.stroke();

      ctx.restore();

      // Animated Frequency Bars / Spectrum around perimeter
      const dataArray = audioEngine.getFrequencyData();
      const bars = 36;
      ctx.save();
      ctx.translate(centerX, centerY - 10);

      for (let i = 0; i < bars; i++) {
        const value = dataArray ? dataArray[i * 3] || 80 : Math.sin(i + angle) * 60 + 80;
        const barHeight = (value / 255) * 45 * (isPlaying ? 1.2 : 0.3);
        const rad = (i * Math.PI * 2) / bars + angle * 0.2;

        const x1 = Math.cos(rad) * 115;
        const y1 = Math.sin(rad) * 135;
        const x2 = Math.cos(rad) * (115 + barHeight);
        const y2 = Math.sin(rad) * (135 + barHeight);

        ctx.strokeStyle = i % 4 === 0 ? '#00E5FF' : 'rgba(255, 26, 60, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.restore();

      // HUD Reticle Corner Brackets
      ctx.strokeStyle = '#FF1A3C';
      ctx.lineWidth = 2;
      const bracketLen = 15;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(10, 10 + bracketLen); ctx.lineTo(10, 10); ctx.lineTo(10 + bracketLen, 10);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(width - 10 - bracketLen, 10); ctx.lineTo(width - 10, 10); ctx.lineTo(width - 10, 10 + bracketLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(10, height - 10 - bracketLen); ctx.lineTo(10, height - 10); ctx.lineTo(10 + bracketLen, height - 10);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(width - 10 - bracketLen, height - 10); ctx.lineTo(width - 10, height - 10); ctx.lineTo(width - 10, height - 10 - bracketLen);
      ctx.stroke();

      angle += 0.03;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#060205] text-[#FF4D6D] font-mono select-none overflow-hidden cyberpunk-grid cyberpunk-scanlines p-2 space-y-2">
      
      {/* Top Cyberpunk Tech Header Banner */}
      <div className="cp-tech-corner bg-[#120408]/90 border border-[#FF1A3C]/80 p-2.5 glow-red-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#FF1A3C] animate-pulse rounded-full shadow-[0_0_8px_#FF1A3C]" />
          <div>
            <div className="text-[11px] font-black tracking-widest text-[#FF1A3C] text-glow-red flex items-center gap-1.5">
              <span>NETRUNNER DATABASE HUD v55.001</span>
              <span className="text-[9px] bg-[#FF1A3C]/20 px-1 py-0.2 border border-[#FF1A3C]/40 text-[#FF8095]">
                ACTIVE
              </span>
            </div>
            <p className="text-[9px] text-[#A62B3F] tracking-tight">
              CYBERWARE DSP LINK • 32-BIT 384kHz AUDIO DECRYPTION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[9px] text-[#00E5FF] font-bold border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-2 py-0.5 rounded">
            SYS VER: 55.0011214
          </span>
        </div>
      </div>

      {/* Cyberpunk HUD Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 shrink-0">
        <button
          onClick={() => setHudTab('brain')}
          className={`py-1.5 px-2 cp-tech-corner text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            hudTab === 'brain'
              ? 'bg-[#FF1A3C] text-black shadow-[0_0_12px_#FF1A3C] border-2 border-[#FF8095]'
              : 'bg-[#18050B] text-[#FF4D6D] border border-[#FF1A3C]/40 hover:bg-[#280812]'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>[ Brain Scan ]</span>
        </button>

        <button
          onClick={() => setHudTab('subjects')}
          className={`py-1.5 px-2 cp-tech-corner text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            hudTab === 'subjects'
              ? 'bg-[#FF1A3C] text-black shadow-[0_0_12px_#FF1A3C] border-2 border-[#FF8095]'
              : 'bg-[#18050B] text-[#FF4D6D] border border-[#FF1A3C]/40 hover:bg-[#280812]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>[ Subject Files ]</span>
        </button>

        <button
          onClick={() => setHudTab('network')}
          className={`py-1.5 px-2 cp-tech-corner text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            hudTab === 'network'
              ? 'bg-[#FF1A3C] text-black shadow-[0_0_12px_#FF1A3C] border-2 border-[#FF8095]'
              : 'bg-[#18050B] text-[#FF4D6D] border border-[#FF1A3C]/40 hover:bg-[#280812]'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>[ Suspect Net ]</span>
        </button>
      </div>

      {/* Main Tab Content Display */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
        
        {/* TAB 1: BRAIN SCAN & RADIAL FREQUENCY ANALYZER (Recreates middle screenshot!) */}
        {hudTab === 'brain' && (
          <div className="flex-1 flex flex-col space-y-2 overflow-hidden animate-in fade-in duration-200">
            {/* Canvas Container */}
            <div className="relative flex-1 bg-[#090207] border border-[#FF1A3C]/60 cp-tech-corner-lg overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={380}
                height={260}
                className="w-full h-full object-contain"
              />

              {/* HUD Telemetry Overlay Labels */}
              <div className="absolute top-2 left-2 text-[9px] text-[#00E5FF] font-bold bg-[#080206]/80 p-1 border border-[#00E5FF]/30">
                <span>[ NEURAL SIGNAL: 104.2 MHz ]</span>
              </div>

              <div className="absolute top-2 right-2 text-[9px] text-[#FF1A3C] font-bold bg-[#080206]/80 p-1 border border-[#FF1A3C]/40">
                <span>[ DISORIENTATION: MILD ]</span>
              </div>

              <div className="absolute bottom-2 left-2 text-[9px] text-amber-400 font-bold bg-[#080206]/80 p-1 border border-amber-500/30">
                <span>[ DAC: 32-BIT / 384kHz FLAC ]</span>
              </div>
            </div>

            {/* Quick Player Bar inside Brain Scan */}
            <div className="bg-[#120408] border border-[#FF1A3C]/50 p-2 rounded-xl flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  onClick={onPlayPause}
                  className="w-9 h-9 rounded-lg bg-[#FF1A3C] text-black font-extrabold flex items-center justify-center shadow-[0_0_10px_#FF1A3C] shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-[#FFFFFF] truncate">
                    {currentTrack?.title || 'НЕТ ТРЕКА'}
                  </h4>
                  <p className="text-[9px] text-[#FF7088] truncate">
                    {currentTrack?.artist || 'Аудио Декодер'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-1.5 py-0.5 border border-[#00E5FF]/30 rounded">
                  {currentTrack?.hiResInfo.format || 'FLAC'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBJECT RECORDS DATABASE (Recreates top screenshot with Jefferson & Elizabeth Peralez!) */}
        {hudTab === 'subjects' && (
          <div className="flex-1 flex flex-col space-y-2 overflow-y-auto pr-0.5 animate-in fade-in duration-200">
            {/* Subject 01: Jefferson Peralez */}
            <div className="bg-[#120408]/90 border-2 border-[#FF1A3C]/80 p-2.5 cp-tech-corner space-y-2 relative">
              <div className="flex items-start justify-between border-b border-[#FF1A3C]/40 pb-1.5">
                <div>
                  <span className="text-[9px] text-[#FF1A3C] font-bold uppercase tracking-widest">
                    [ SUBJECT 01 ]
                  </span>
                  <h3 className="text-xs font-black text-[#FFFFFF] tracking-wider">
                    JEFFERSON PERALEZ
                  </h3>
                </div>
                <span className="text-[9px] text-[#00E5FF] font-mono border border-[#00E5FF]/40 px-1.5 py-0.2 bg-[#00E5FF]/10">
                  MAYORAL CANDIDATE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="space-y-0.5 text-[#FF8095]">
                  <p><span className="text-[#A62B3F]">ETHNICITY:</span> HISPANIC</p>
                  <p><span className="text-[#A62B3F]">DATE OF BIRTH:</span> JULY 4, 2031</p>
                  <p><span className="text-[#A62B3F]">HEIGHT:</span> 6'1"</p>
                  <p><span className="text-[#A62B3F]">WEIGHT:</span> 187 LBS</p>
                </div>
                <div className="space-y-0.5 text-[#FF8095]">
                  <p><span className="text-[#A62B3F]">DISORIENTATION:</span> MILD</p>
                  <p><span className="text-[#A62B3F]">APATHY:</span> NO</p>
                  <p><span className="text-[#A62B3F]">DROWSINESS:</span> NONE</p>
                  <p className="text-[#00E5FF] font-bold"><span className="text-[#A62B3F]">MEMORY LOSS:</span> SEVERE (LOSSLESS)</p>
                </div>
              </div>

              {/* Decrypted Audio Files for Jefferson */}
              <div className="pt-1.5 border-t border-[#FF1A3C]/30 space-y-1">
                <p className="text-[9px] text-[#FF1A3C] font-bold">
                  РАSCHIФРОВАННЫЕ АУДИОФАЙЛЫ SUBJECT 01:
                </p>
                {tracks.slice(0, 3).map((track) => (
                  <div
                    key={track.id}
                    onClick={() => onPlayTrack(track)}
                    className="flex items-center justify-between p-1.5 bg-[#1B060D] hover:bg-[#2D0915] border border-[#FF1A3C]/40 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="text-[10px] font-bold text-[#FFFFFF] truncate">
                        {track.title}
                      </h5>
                      <p className="text-[8px] text-[#FF7088] truncate">{track.artist}</p>
                    </div>
                    <span className="text-[8px] text-[#00E5FF] font-bold px-1 py-0.2 border border-[#00E5FF]/30 bg-[#00E5FF]/10">
                      {track.hiResInfo.format}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject 02: Elizabeth Peralez */}
            <div className="bg-[#120408]/90 border-2 border-[#FF1A3C]/80 p-2.5 cp-tech-corner space-y-2 relative">
              <div className="flex items-start justify-between border-b border-[#FF1A3C]/40 pb-1.5">
                <div>
                  <span className="text-[9px] text-[#FF1A3C] font-bold uppercase tracking-widest">
                    [ SUBJECT 02 ]
                  </span>
                  <h3 className="text-xs font-black text-[#FFFFFF] tracking-wider">
                    ELIZABETH PERALEZ
                  </h3>
                </div>
                <span className="text-[9px] text-[#00E5FF] font-mono border border-[#00E5FF]/40 px-1.5 py-0.2 bg-[#00E5FF]/10">
                  ATTORNEY AT LAW
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="space-y-0.5 text-[#FF8095]">
                  <p><span className="text-[#A62B3F]">ETHNICITY:</span> ASIAN</p>
                  <p><span className="text-[#A62B3F]">DATE OF BIRTH:</span> APRIL 10, 2032</p>
                  <p><span className="text-[#A62B3F]">HEIGHT:</span> 5'7"</p>
                  <p><span className="text-[#A62B3F]">WEIGHT:</span> 133 LBS</p>
                </div>
                <div className="space-y-0.5 text-[#FF8095]">
                  <p><span className="text-[#A62B3F]">DROWSINESS:</span> NONE</p>
                  <p><span className="text-[#A62B3F]">DISORIENTATION:</span> MILD</p>
                  <p className="text-amber-400 font-bold"><span className="text-[#A62B3F]">MEMORY LOSS:</span> SEVERE</p>
                  <p><span className="text-[#A62B3F]">RESPONSIVENESS:</span> NORMAL</p>
                </div>
              </div>

              {/* Decrypted Audio Files for Elizabeth */}
              <div className="pt-1.5 border-t border-[#FF1A3C]/30 space-y-1">
                <p className="text-[9px] text-[#FF1A3C] font-bold">
                  РАSCHIФРОВАННЫЕ АУДИОФАЙЛЫ SUBJECT 02:
                </p>
                {tracks.slice(3, 6).map((track) => (
                  <div
                    key={track.id}
                    onClick={() => onPlayTrack(track)}
                    className="flex items-center justify-between p-1.5 bg-[#1B060D] hover:bg-[#2D0915] border border-[#FF1A3C]/40 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="text-[10px] font-bold text-[#FFFFFF] truncate">
                        {track.title}
                      </h5>
                      <p className="text-[8px] text-[#FF7088] truncate">{track.artist}</p>
                    </div>
                    <span className="text-[8px] text-[#00E5FF] font-bold px-1 py-0.2 border border-[#00E5FF]/30 bg-[#00E5FF]/10">
                      {track.hiResInfo.format}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUSPECT NETWORK NODES (Recreates bottom screenshot with target node network!) */}
        {hudTab === 'network' && (
          <div className="flex-1 flex flex-col space-y-2 overflow-y-auto animate-in fade-in duration-200">
            <div className="text-[10px] text-[#00E5FF] font-bold flex items-center justify-between border-b border-[#FF1A3C]/40 pb-1">
              <span>[ NETRUNNER SUSPECT DECRYPTION MAP ]</span>
              <span>NODES: {tracks.length}</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {[
                { name: 'JOSIAH GUERRERO', role: 'SECURITY CONSULTANT', track: tracks[0] },
                { name: 'FRED WARD', role: 'ARASAKA AUDIO TECH', track: tracks[1] },
                { name: 'KIERA KNIGHT', role: 'NEURO-DSP ANALYST', track: tracks[2] },
                { name: 'AMINAH BOLTON', role: 'CYBERWARE ACOUSTICS', track: tracks[3] },
                { name: 'HECTOR BYRD', role: 'SIGNAL INTERCEPTOR', track: tracks[4] },
                { name: 'LIBERTY PATEL', role: 'FLAC DECRYPTION OPERATIVE', track: tracks[5] },
              ].map((node, index) => (
                <div
                  key={index}
                  onClick={() => node.track && onPlayTrack(node.track)}
                  className="bg-[#120408]/90 border border-[#FF1A3C]/60 hover:border-[#FF1A3C] p-2 cp-tech-corner flex items-center justify-between gap-2 cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded bg-[#FF1A3C]/20 border border-[#FF1A3C] flex items-center justify-center shrink-0 group-hover:bg-[#FF1A3C] group-hover:text-black transition-colors">
                      <span className="text-[10px] font-black">{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-black text-[#FFFFFF] group-hover:text-[#00E5FF] truncate transition-colors">
                        {node.name}
                      </h4>
                      <p className="text-[8px] text-[#FF7088] truncate">
                        {node.role} • {node.track?.title || 'FLAC NODE'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[8px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-1.5 py-0.5 border border-[#00E5FF]/30">
                      LINKED
                    </span>
                    <Play className="w-3.5 h-3.5 text-[#FF1A3C] fill-[#FF1A3C]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* CYBERPUNK SUBTITLE DIALOGUE BOX (Directly matching the screenshot subtitles at the bottom!) */}
      <div className="cp-tech-corner bg-[#080205]/95 border-2 border-[#FF1A3C] p-2.5 shadow-[0_0_20px_rgba(255,26,60,0.4)] shrink-0 space-y-1">
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-[#FF1A3C] font-bold flex items-center gap-1">
            <Terminal className="w-3 h-3" />
            <span>CYBERWARE AUDIO LOG #4029</span>
          </span>
          <button
            onClick={() => setSubtitleIndex((prev) => (prev + 1) % dialogues.length)}
            className="text-[#00E5FF] hover:underline text-[8px]"
          >
            [ NEXT LOG ]
          </button>
        </div>

        <p className="text-[11px] font-extrabold tracking-wide leading-tight">
          <span className={`${dialogues[subtitleIndex].color} mr-1.5 uppercase drop-shadow`}>
            {dialogues[subtitleIndex].speaker}
          </span>
          <span className="text-[#FFFFFF] text-glow-red">
            "{dialogues[subtitleIndex].text}"
          </span>
        </p>
      </div>

    </div>
  );
};
