import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Activity, Sparkles, Volume2, Flame, Cpu, Zap } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS, audioEngine } from '../services/audioEngine';

interface EqualizerViewProps {
  isPlaying: boolean;
}

export const EqualizerView: React.FC<EqualizerViewProps> = ({ isPlaying }) => {
  const [activePreset, setActivePreset] = useState<string>('Hi-Res Studio (Студийный)');
  const [gains, setGains] = useState<number[]>([2, 3, 1, 0, 0, 1, 3, 4, 5, 5]);
  const [bassBoost, setBassBoost] = useState<number>(60);
  const [spatialAudio, setSpatialAudio] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle Preset Change
  const handleSelectPreset = (presetName: string) => {
    setActivePreset(presetName);
    const found = EQ_PRESETS.find((p) => p.name === presetName);
    if (found) {
      setGains([...found.gains]);
      audioEngine.applyEQPreset(found);
    }
  };

  // Handle Individual Band Change
  const handleBandChange = (index: number, valDb: number) => {
    const newGains = [...gains];
    newGains[index] = valDb;
    setGains(newGains);
    audioEngine.setEQBandGain(index, valDb);
  };

  // Spectrum Analyzer Canvas Loop in Cyberpunk Neon Red / Cyan style
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(64);

    const render = () => {
      audioEngine.getAnalyserData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Dark cyber background
      ctx.fillStyle = '#090104';
      ctx.fillRect(0, 0, width, height);

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(255, 26, 60, 0.15)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const barWidth = (width / dataArray.length) * 1.5;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height * (isPlaying ? 0.95 : 0.08);

        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#FF1A3C'); // Cyber Red
        gradient.addColorStop(0.7, '#00E5FF'); // Neon Cyan
        gradient.addColorStop(1, '#FFFFFF'); // Hot White glow

        ctx.fillStyle = gradient;
        ctx.shadowColor = '#FF1A3C';
        ctx.shadowBlur = isPlaying ? 8 : 0;

        ctx.fillRect(x, height - barHeight, barWidth - 1.5, barHeight);

        x += barWidth;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3 space-y-3 font-mono">
      {/* Header */}
      <div className="bg-[#120308] border border-[#FF1A3C]/50 rounded-xl p-3 space-y-2.5 shadow-[0_0_15px_rgba(255,26,60,0.2)] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#FF1A3C]/15 text-[#FF1A3C] rounded-lg border border-[#FF1A3C]/40">
              <Cpu className="w-4 h-4 text-[#FF1A3C]" />
            </div>
            <div>
              <h2 className="text-xs font-black text-[#FFFFFF] flex items-center gap-1.5 tracking-wider">
                CYBER_DSP // 10-BAND EQ
              </h2>
              <p className="text-[9px] text-[#00E5FF]">
                [ 32-BIT FLOATING DAC // DIRECT-OUT ]
              </p>
            </div>
          </div>

          <span className="text-[9px] px-2 py-0.5 rounded font-bold border bg-[#FF1A3C]/20 text-[#FF1A3C] border-[#FF1A3C]/40">
            {isPlaying ? 'ACTIVE // 192k' : 'STANDBY'}
          </span>
        </div>

        {/* Realtime Spectrum Analyzer Canvas */}
        <div className="relative rounded-lg overflow-hidden border border-[#FF1A3C]/40 shadow-inner">
          <canvas ref={canvasRef} width={380} height={70} className="w-full h-16 block" />
          <div className="absolute top-1 left-2 text-[8px] text-[#FF1A3C] opacity-80">
            RADAR: 20Hz - 22kHz
          </div>
        </div>
      </div>

      {/* Cyber Presets Selector */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[#883344] font-bold tracking-wider">
          // ПРЕДУСТАНОВКИ НЕЙРО-ПРОФИЛЯ
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {EQ_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.name;
            return (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset.name)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-[#FF1A3C] text-black border-[#FF1A3C] shadow-[0_0_10px_rgba(255,26,60,0.6)]'
                    : 'bg-[#120308] text-[#883344] border-[#FF1A3C]/30 hover:border-[#FF1A3C] hover:text-[#FF8095]'
                }`}
              >
                {preset.name.split(' (')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 10-Band Graphic Faders Matrix */}
      <div className="bg-[#100308] border border-[#FF1A3C]/40 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between text-[10px] text-[#883344] border-b border-[#FF1A3C]/30 pb-1">
          <span>+12 dB</span>
          <span className="text-[#00E5FF]">MATRIX 0 dB</span>
          <span>-12 dB</span>
        </div>

        <div className="grid grid-cols-10 gap-1 sm:gap-2 items-center h-44 py-1">
          {EQ_FREQUENCIES.map((freq, idx) => {
            const gain = gains[idx] || 0;
            return (
              <div key={freq} className="flex flex-col items-center justify-between h-full group">
                <span className={`text-[8px] font-bold ${gain > 0 ? 'text-[#FF1A3C]' : gain < 0 ? 'text-[#00E5FF]' : 'text-[#662233]'}`}>
                  {gain > 0 ? `+${gain}` : gain}
                </span>

                {/* Vertical Range Slider */}
                <div className="relative flex-1 flex items-center justify-center my-1 w-full">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => handleBandChange(idx, parseInt(e.target.value, 10))}
                    className="w-28 h-1 bg-[#1A030A] accent-[#FF1A3C] rounded-lg cursor-pointer transform -rotate-90 origin-center"
                  />
                </div>

                <span className="text-[8px] text-[#883344] font-bold">
                  {freq >= 1000 ? `${freq / 1000}k` : freq}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Cyber Matrix Enhancers */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#120308] border border-[#FF1A3C]/40 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#FFFFFF] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#FF1A3C]" />
              SANDEVISTAN BASS
            </span>
            <span className="text-[9px] text-[#883344] block">Суб-бас +6dB</span>
          </div>
          <button
            onClick={() => setBassBoost((prev) => (prev > 0 ? 0 : 70))}
            className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${
              bassBoost > 0
                ? 'bg-[#FF1A3C] text-black border-[#FF1A3C] shadow-[0_0_8px_#FF1A3C]'
                : 'bg-[#080104] text-[#883344] border-[#FF1A3C]/30'
            }`}
          >
            {bassBoost > 0 ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="bg-[#120308] border border-[#FF1A3C]/40 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#FFFFFF] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#00E5FF]" />
              3D SOUNDSTAGE
            </span>
            <span className="text-[9px] text-[#883344] block">Пространство</span>
          </div>
          <button
            onClick={() => setSpatialAudio((prev) => !prev)}
            className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${
              spatialAudio
                ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-[0_0_8px_#00E5FF]'
                : 'bg-[#080104] text-[#883344] border-[#00E5FF]/30'
            }`}
          >
            {spatialAudio ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
