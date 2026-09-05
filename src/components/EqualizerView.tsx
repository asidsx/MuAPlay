import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Activity, Sparkles, Volume2, Flame, ShieldCheck } from 'lucide-react';
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

  // Spectrum Analyzer Canvas Loop
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

      // Draw background glow grid
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / dataArray.length) * 1.5;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height * (isPlaying ? 0.95 : 0.05);

        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#7C4DFF'); // Purple
        gradient.addColorStop(0.6, '#00E5FF'); // Cyan
        gradient.addColorStop(1, '#FFFFFF'); // White glow

        ctx.fillStyle = gradient;
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = isPlaying ? 10 : 0;

        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

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
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-3 space-y-3">
      {/* Header */}
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-3.5 space-y-3 shadow-lg shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#7C4DFF]/15 text-[#00E5FF] rounded-xl border border-[#7C4DFF]/30">
              <Sliders className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#FFFFFF] flex items-center gap-1.5">
                Графический Эквалайзер 10-Band
              </h2>
              <p className="text-[10px] text-[#777777] font-mono">
                Hi-Res Audio DSP Processing
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1 text-[10px] text-[#00E5FF] font-mono bg-[#00E5FF]/10 px-2.5 py-1 rounded-full border border-[#00E5FF]/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" /> 32-Bit Float DSP
          </span>
        </div>

        {/* Visualizer Spectrum Canvas */}
        <div className="relative w-full h-24 rounded-xl overflow-hidden border border-[#1F1F1F] bg-[#0A0A0A]">
          <canvas
            ref={canvasRef}
            width={380}
            height={96}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2.5 flex items-center gap-1.5 text-[9px] font-mono text-[#00E5FF] bg-[#0A0A0A]/80 px-2 py-0.5 rounded-full border border-[#00E5FF]/30">
            <Activity className="w-3 h-3 animate-pulse text-[#00E5FF]" />
            <span>{isPlaying ? 'SPECTRUM ACTIVE' : 'STANDBY'}</span>
          </div>
        </div>

        {/* Presets dropdown */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold text-[#E0E0E0] shrink-0">
            Пресет эквалайзера:
          </label>
          <select
            value={activePreset}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="bg-[#0A0A0A] border border-[#1F1F1F] text-[#00E5FF] text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#7C4DFF] shrink-0"
          >
            {EQ_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 10-Band Sliders Grid */}
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-3 space-y-2">
        <h3 className="text-xs font-bold text-[#E0E0E0] mb-2 flex items-center justify-between">
          <span>Частотные полосы (dB)</span>
          <span className="text-[10px] text-[#555555] font-mono">-12dB — +12dB</span>
        </h3>

        <div className="grid grid-cols-10 gap-1.5 pt-2 pb-1 text-center">
          {EQ_FREQUENCIES.map((freq, idx) => {
            const gain = gains[idx] || 0;
            const freqLabel = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

            return (
              <div key={freq} className="flex flex-col items-center space-y-2">
                <span className="text-[9px] font-mono font-bold text-[#00E5FF]">
                  {gain > 0 ? `+${gain}` : `${gain}`}
                </span>

                {/* Vertical slider wrapper */}
                <div className="h-32 flex items-center justify-center">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => handleBandChange(idx, parseFloat(e.target.value))}
                    className="h-28 w-1.5 bg-[#0A0A0A] accent-[#7C4DFF] rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                  />
                </div>

                <span className="text-[9px] font-mono text-[#777777] font-bold">
                  {freqLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Effects: Bass Boost & Spatial Audio */}
      <div className="bg-[#121212] border border-[#1F1F1F] rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#E0E0E0]">
            <Flame className="w-4 h-4 text-[#00E5FF]" />
            <span>Усиление Баса (Bass Boost)</span>
          </div>
          <span className="text-xs font-mono font-bold text-[#00E5FF]">{bassBoost}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={bassBoost}
          onChange={(e) => setBassBoost(parseInt(e.target.value))}
          className="w-full accent-[#7C4DFF] bg-[#0A0A0A] h-2 rounded-lg cursor-pointer"
        />

        <div className="flex items-center justify-between pt-2 border-t border-[#1F1F1F]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#E0E0E0]">
            <Sparkles className="w-4 h-4 text-[#7C4DFF]" />
            <span>Объемное 3D звучание (Spatial Audio)</span>
          </div>
          <button
            onClick={() => setSpatialAudio(!spatialAudio)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              spatialAudio ? 'bg-[#7C4DFF]' : 'bg-[#1F1F1F]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                spatialAudio ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
