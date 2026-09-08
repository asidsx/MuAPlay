import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  HardDrive,
  Sliders,
  Volume2,
  FileCode,
  Zap,
  CheckCircle2,
  Copy,
  Radio,
  Layers,
} from 'lucide-react';
import { Track } from '../types/music';
import { audioEngine } from '../services/audioEngine';

interface CyberTelemetryViewProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export const CyberTelemetryView: React.FC<CyberTelemetryViewProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
}) => {
  const [copied, setCopied] = useState(false);
  const [liveStats, setLiveStats] = useState({
    sampleRate: 48000,
    state: 'running',
    baseLatencyMs: 10.5,
    peakDb: -96,
    rmsDb: -96,
    peakPercent: 0,
    eqActive: false,
    normalizerEnabled: true,
    normalizerGainDb: 0,
    normalizerTargetDb: -14,
  });

  // Poll live telemetry at 15fps when playing
  useEffect(() => {
    const updateTelemetry = () => {
      const stats = audioEngine.getLiveTelemetry();
      const normStats = audioEngine.getNormalizerStats();
      setLiveStats({
        ...stats,
        normalizerEnabled: normStats.enabled,
        normalizerGainDb: normStats.gainAdjustmentDb,
        normalizerTargetDb: normStats.targetDb,
      });
    };

    updateTelemetry();
    const interval = setInterval(updateTelemetry, isPlaying ? 66 : 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Compute calculated technical values from track data
  const format = track.hiResInfo?.format || 'MP3';
  const isLossless = track.hiResInfo?.isLossless || format === 'FLAC' || format === 'WAV';
  const bitDepth = track.hiResInfo?.bitDepth || (isLossless ? 24 : 16);
  const sourceSampleRate = track.hiResInfo?.sampleRate || 44100;
  
  // Calculate precise bitrate based on duration & size
  let calculatedBitrate = track.hiResInfo?.bitrateKbps || 320;
  let fileSizeFormatted = track.fileSize || '7.5 MB';
  let fileSizeBytes = 0;

  if (track.fileSize) {
    const num = parseFloat(track.fileSize.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      fileSizeBytes = Math.round(num * 1024 * 1024);
      if (duration > 0) {
        calculatedBitrate = Math.round((fileSizeBytes * 8) / (duration * 1000));
      }
    }
  }

  // Calculate compression ratio vs raw 16/24 bit PCM
  const rawPcmBytes = (sourceSampleRate * (bitDepth / 8) * 2) * (duration || 180);
  const compressionPercent = fileSizeBytes && rawPcmBytes > 0
    ? Math.min(100, Math.round((fileSizeBytes / rawPcmBytes) * 100))
    : isLossless ? 60 : 22;
  const compressionRatio = compressionPercent > 0
    ? `1:${(100 / compressionPercent).toFixed(2)}`
    : '1:4.5';

  const codecFullNames: Record<string, string> = {
    FLAC: 'Free Lossless Audio Codec (Vorbis Comment)',
    WAV: 'Waveform Audio File Format (LPCM uncompressed)',
    MP3: 'MPEG-1 Audio Layer III (Fraunhofer IIS)',
    AAC: 'Advanced Audio Coding (MPEG-4 AAC-LC)',
    M4A: 'Apple Lossless / AAC Container (ALAC/AAC)',
    OGG: 'Ogg Vorbis Audio Stream',
    OPUS: 'Opus Interactive Audio Codec (IETF RFC 6716)',
    ALAC: 'Apple Lossless Audio Codec',
  };

  const copyTelemetryReport = () => {
    const report = `[ CYBER_DSP // ТЕЛЕМЕТРИЯ АУДИОТРАКТА ]
════════════════════════════════════════
ТРЕК: ${track.title}
ИСПОЛНИТЕЛЬ: ${track.artist}
АЛЬБОМ: ${track.album}
ГОД: ${track.year || '2026'} | ЖАНР: ${track.genre || 'Hi-Res Audio'}
ПУТЬ: ${track.filePath || '/storage/emulated/0/Download/'}

[ ПАРАМЕТРЫ ФАЙЛА И КОДЕКА ]
• Формат: ${format} (${codecFullNames[format] || format})
• Тип сжатия: ${isLossless ? 'LOSSLESS (Без потерь)' : 'LOSSY (Психоакустическое)'}
• Разрядность: ${bitDepth}-Bit ${isLossless ? 'Studio Master' : 'PCM'}
• Частота источника: ${(sourceSampleRate / 1000).toFixed(1)} kHz (${sourceSampleRate} Hz)
• Битрейт потока: ${calculatedBitrate} kbps ${isLossless ? '(Lossless Stream)' : '(CBR/VBR)'}
• Каналы: 2.0 Stereo (L/R Interleaved)
• Размер файла: ${fileSizeFormatted} (~${compressionPercent}% от сырого PCM, ${compressionRatio})
• Длительность: ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')} (${duration.toFixed(2)} сек)

[ ЦИФРОВОЙ ТРАКТ DSP & ЦАП ]
• Аппаратный вывод DAC: ${liveStats.sampleRate} Hz Direct Hardware Link
• Внутренняя шина DSP: 32-Bit IEEE 754 Floating Point
• Статус WebAudio: ${liveStats.state.toUpperCase()} (Задержка ~${liveStats.baseLatencyMs} ms)
• 10-Band Graphic EQ: ${liveStats.eqActive ? 'АКТИВЕН' : 'FLAT / BYPASS'}
• Пиковый уровень (Peak): ${liveStats.peakDb} dB
• Среднеквадратичный (RMS): ${liveStats.rmsDb} dB
════════════════════════════════════════
Отчет сгенерирован MuA Play Cyber Audio Engine`;

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-md bg-[#0D0207]/95 border-2 border-[#FF1A3C]/70 rounded-2xl p-4 sm:p-5 space-y-4 font-mono text-xs text-[#E0E0E0] my-auto shadow-[0_0_35px_rgba(255,26,60,0.3)] select-none animate-in fade-in duration-300 max-h-[75vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#FF1A3C]/40">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00E5FF] animate-pulse" />
          <span className="font-bold text-white tracking-wide text-xs">
            CYBER_DSP // ТЕЛЕМЕТРИЯ ТРАКТА
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded font-mono font-black text-[9px] border ${
              isLossless
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/60 shadow-[0_0_8px_rgba(0,229,255,0.4)]'
                : 'bg-[#FF1A3C]/20 text-[#FF1A3C] border-[#FF1A3C]/50 shadow-[0_0_8px_rgba(255,26,60,0.3)]'
            }`}
          >
            {isLossless ? 'LOSSLESS 24B' : 'HI-RES 16B'}
          </span>
        </div>
      </div>

      {/* 1. Live Signal Meters (Peak & RMS Dynamic Gauges) */}
      <div className="bg-[#15030A] border border-[#FF1A3C]/40 rounded-xl p-3 space-y-2.5 shadow-inner">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#00E5FF] font-bold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>ЖИВОЙ УРОВЕНЬ СИГНАЛА (DSP METER)</span>
          </span>
          <span className="text-[#00FF66] font-black text-[9px] animate-pulse">
            {isPlaying ? '● REAL-TIME DSP' : '○ СТАТИЧЕСКИ'}
          </span>
        </div>

        {/* Peak Meter Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-[#883344]">
            <span>ПИКОВЫЙ УРОВЕНЬ (PEAK)</span>
            <span className="font-bold text-[#FF1A3C]">{isPlaying ? `${liveStats.peakDb} dB` : '-∞ dB'}</span>
          </div>
          <div className="w-full h-2 bg-[#090104] rounded-full overflow-hidden border border-[#FF1A3C]/30 p-0.5">
            <div
              className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-[#00E5FF] via-[#00FF66] to-[#FF1A3C]"
              style={{ width: `${isPlaying ? Math.max(4, liveStats.peakPercent) : 2}%` }}
            />
          </div>
        </div>

        {/* RMS Loudness, ReplayGain Normalizer dB & DAC Specs */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
          <div className="bg-[#0A0205] p-2 rounded-lg border border-[#FF1A3C]/25">
            <span className="text-[#883344] block text-[8px] uppercase">LOUDNESS (RMS)</span>
            <span className="font-bold text-[#00E5FF] truncate block">
              {isPlaying ? `${liveStats.rmsDb} dB` : '-∞ dB'}
            </span>
          </div>
          <div className="bg-[#0A0205] p-2 rounded-lg border border-[#FF1A3C]/25">
            <span className="text-[#883344] block text-[8px] uppercase">ВЫРАВНИВАНИЕ</span>
            <span
              className={`font-bold truncate block ${
                liveStats.normalizerGainDb > 0
                  ? 'text-[#00FF66]'
                  : liveStats.normalizerGainDb < 0
                  ? 'text-[#FF8095]'
                  : 'text-white'
              }`}
            >
              {liveStats.normalizerEnabled
                ? `${liveStats.normalizerGainDb > 0 ? '+' : ''}${liveStats.normalizerGainDb} dB`
                : 'OFF'}
            </span>
          </div>
          <div className="bg-[#0A0205] p-2 rounded-lg border border-[#FF1A3C]/25">
            <span className="text-[#883344] block text-[8px] uppercase">ВЫВОД ЦАП</span>
            <span className="font-bold text-[#00FF66] truncate block">{liveStats.sampleRate} Hz</span>
          </div>
        </div>
      </div>

      {/* 2. File & Audio Codec Specs Grid */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[#883344] font-bold uppercase tracking-wider block">
          [ СВОЙСТВА АУДИОПОТОКА И КОДЕКА ]
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#140309] p-2.5 rounded-xl border border-[#FF1A3C]/40 space-y-0.5">
            <span className="text-[#883344] block text-[9px] uppercase font-bold">КОДЕК / ФОРМАТ</span>
            <span className="font-bold text-[#00E5FF] truncate block">{format}</span>
            <span className="text-[8px] text-[#884455] block truncate">
              {codecFullNames[format] || 'Audio Container'}
            </span>
          </div>

          <div className="bg-[#140309] p-2.5 rounded-xl border border-[#FF1A3C]/40 space-y-0.5">
            <span className="text-[#883344] block text-[9px] uppercase font-bold">РАЗРЯДНОСТЬ</span>
            <span className="font-bold text-[#FF1A3C] block">{bitDepth}-BIT {isLossless ? 'LOSSLESS' : 'PCM'}</span>
            <span className="text-[8px] text-[#884455] block">32-Bit Float Processing</span>
          </div>

          <div className="bg-[#140309] p-2.5 rounded-xl border border-[#FF1A3C]/40 space-y-0.5">
            <span className="text-[#883344] block text-[9px] uppercase font-bold">ЧАСТОТА ДИСКРЕТИЗАЦИИ</span>
            <span className="font-bold text-[#00E5FF] block">{(sourceSampleRate / 1000).toFixed(1)} kHz</span>
            <span className="text-[8px] text-[#884455] block">{sourceSampleRate} сэмплов/сек</span>
          </div>

          <div className="bg-[#140309] p-2.5 rounded-xl border border-[#FF1A3C]/40 space-y-0.5">
            <span className="text-[#883344] block text-[9px] uppercase font-bold">БИТРЕЙТ ПОТОКА</span>
            <span className="font-bold text-[#FF1A3C] block">{calculatedBitrate} kbps</span>
            <span className="text-[8px] text-[#884455] block">{isLossless ? 'Direct Lossless' : 'CBR/VBR Stream'}</span>
          </div>

          <div className="bg-[#140309] p-2.5 rounded-xl border border-[#FF1A3C]/40 space-y-0.5">
            <span className="text-[#883344] block text-[9px] uppercase font-bold">КАНАЛЫ ЗВУКА</span>
            <span className="font-bold text-[#00E5FF] block">2.0 Stereo</span>
            <span className="text-[8px] text-[#884455] block">Left / Right Matrix</span>
          </div>

          <div className="bg-[#140309] p-2.5 rounded-xl border border-[#FF1A3C]/40 space-y-0.5">
            <span className="text-[#883344] block text-[9px] uppercase font-bold">СЖАТИЕ / РАЗМЕР</span>
            <span className="font-bold text-[#FF1A3C] block">{fileSizeFormatted}</span>
            <span className="text-[8px] text-[#884455] block">Сжатие {compressionRatio} (~{compressionPercent}%)</span>
          </div>
        </div>
      </div>

      {/* 3. Metadata & Tag Information */}
      <div className="bg-[#120308] border border-[#FF1A3C]/40 rounded-xl p-3 space-y-2 text-[10px]">
        <div className="flex items-center justify-between border-b border-[#FF1A3C]/30 pb-1.5">
          <span className="text-[#00E5FF] font-bold flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>ТЕГИ МЕТАДАННЫХ (ID3 / VORBIS)</span>
          </span>
          <span className="text-[#884455]">
            {track.lyrics ? 'СИНХРОН LRC ✓' : 'НЕТ ЛИРИКИ'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#E0E0E0]">
          <div>
            <span className="text-[#883344] block text-[8px] uppercase">ТРЕК:</span>
            <span className="font-bold truncate block">{track.title}</span>
          </div>
          <div>
            <span className="text-[#883344] block text-[8px] uppercase">АРТИСТ:</span>
            <span className="font-bold truncate block">{track.artist}</span>
          </div>
          <div>
            <span className="text-[#883344] block text-[8px] uppercase">АЛЬБОМ:</span>
            <span className="font-bold truncate block">{track.album || 'Локальный'}</span>
          </div>
          <div>
            <span className="text-[#883344] block text-[8px] uppercase">ГОД / ЖАНР:</span>
            <span className="font-bold truncate block">{track.year || '2026'} • {track.genre || 'Hi-Res'}</span>
          </div>
        </div>

        <div className="border-t border-[#FF1A3C]/20 pt-1.5 text-[9px] break-all text-[#884455]">
          <span className="text-[#883344] block uppercase text-[8px]">ПУТЬ НА УСТРОЙСТВЕ:</span>
          <span className="text-[#CCCCCC]">{track.filePath || `/storage/emulated/0/Download/${track.title}.${format.toLowerCase()}`}</span>
        </div>
      </div>

      {/* Copy Diagnostic Report Button */}
      <button
        type="button"
        onClick={copyTelemetryReport}
        className="w-full py-2.5 bg-[#1C040E] hover:bg-[#FF1A3C] text-[#FF1A3C] hover:text-black border border-[#FF1A3C]/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(255,26,60,0.25)] active:scale-[0.98]"
      >
        {copied ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
            <span className="text-[#00FF66]">ОТЧЕТ DSP СКОПИРОВАН В БУФЕР</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>СКОПИРОВАТЬ ПОЛНЫЙ DSP ОТЧЕТ</span>
          </>
        )}
      </button>
    </div>
  );
};
