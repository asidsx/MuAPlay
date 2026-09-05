import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Maximize2, ShieldCheck, Terminal, Cpu } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTrackFormat?: string;
  isLossless?: boolean;
  guiMode?: 'standard' | 'cyberpunk';
  onToggleGuiMode?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTrackFormat,
  isLossless,
  guiMode = 'standard',
  onToggleGuiMode,
}) => {
  const [isPhoneMode, setIsPhoneMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCyber = guiMode === 'cyberpunk';

  return (
    <div className={`min-h-screen text-[#E0E0E0] flex flex-col items-center justify-center p-0 sm:p-4 font-sans select-none overflow-x-hidden ${
      isCyber ? 'bg-[#030102] cyberpunk-grid' : 'bg-[#050505]'
    }`}>
      {/* Top frame mode bar */}
      <div className="w-full max-w-md hidden sm:flex items-center justify-between mb-3 px-2 text-xs">
        <div className="flex items-center gap-2">
          {onToggleGuiMode && (
            <button
              onClick={onToggleGuiMode}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md ${
                isCyber
                  ? 'bg-[#FF1A3C] text-black shadow-[0_0_15px_rgba(255,26,60,0.6)] border border-[#FF8095]'
                  : 'bg-[#1A1A1A] hover:bg-[#252525] text-[#00E5FF] border border-[#00E5FF]/30'
              }`}
              title="Переключить визуальный интерфейс GUI"
            >
              {isCyber ? (
                <>
                  <Terminal className="w-3.5 h-3.5 fill-black" />
                  <span>🔴 CYBERPUNK 2077 HUD</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>⚡ Включить Cyberpunk GUI</span>
                </>
              )}
            </button>
          )}

          {activeTrackFormat && (
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
              isCyber
                ? 'bg-[#FF1A3C]/20 text-[#FF1A3C] border border-[#FF1A3C]/40'
                : isLossless 
                ? 'bg-[#7C4DFF]/20 text-[#7C4DFF] border border-[#7C4DFF]/30' 
                : 'bg-[#121212] text-[#888]'
            }`}>
              {activeTrackFormat}
            </span>
          )}
        </div>

        <button
          onClick={() => setIsPhoneMode(!isPhoneMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border ${
            isCyber
              ? 'bg-[#18040A] text-[#FF4D6D] border-[#FF1A3C]/40 hover:bg-[#2A0612]'
              : 'bg-[#121212] hover:bg-[#1A1A1A] text-[#E0E0E0] border-[#1F1F1F]'
          }`}
        >
          {isPhoneMode ? (
            <>
              <Maximize2 className={`w-3.5 h-3.5 ${isCyber ? 'text-[#FF1A3C]' : 'text-[#7C4DFF]'}`} />
              <span>Полный экран</span>
            </>
          ) : (
            <>
              <Smartphone className={`w-3.5 h-3.5 ${isCyber ? 'text-[#FF1A3C]' : 'text-[#7C4DFF]'}`} />
              <span>Режим Android</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col overflow-hidden ${
          isCyber
            ? 'bg-[#080205] border-[#FF1A3C]/60 shadow-[0_0_35px_rgba(255,26,60,0.3)]'
            : 'bg-[#0A0A0A] border-[#1F1F1F]'
        } ${
          isPhoneMode
            ? `sm:max-w-[420px] sm:h-[860px] sm:rounded-[44px] sm:border-[10px] ${
                isCyber
                  ? 'sm:border-[#1F040C] sm:shadow-[0_25px_60px_-15px_rgba(255,26,60,0.4)] sm:ring-2 sm:ring-[#FF1A3C]/50'
                  : 'sm:border-[#1A1A1A] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(124,77,255,0.15)] sm:ring-1 sm:ring-[#222222]'
              }`
            : 'max-w-4xl h-screen sm:h-[860px] sm:rounded-2xl sm:border sm:shadow-2xl'
        }`}
      >
        {/* Android Top Notch & Status Bar */}
        <div className={`pt-2 px-6 pb-2.5 flex items-center justify-between text-xs font-semibold z-30 border-b shrink-0 ${
          isCyber
            ? 'bg-[#100308]/90 text-[#FF4D6D] border-[#FF1A3C]/50'
            : 'bg-[#0A0A0A]/90 text-[#888888] border-[#1F1F1F]'
        }`}>
          <span className={`font-mono font-bold ${isCyber ? 'text-[#FF1A3C]' : 'text-[#00E5FF]'}`}>
            {currentTime || '10:08'}
          </span>

          {/* Camera Notch simulation in phone mode */}
          {isPhoneMode && (
            <div className={`hidden sm:block w-20 h-4 rounded-b-xl border-x border-b ${
              isCyber ? 'bg-[#080205] border-[#FF1A3C]/40' : 'bg-[#0A0A0A] border-[#1F1F1F]'
            }`} />
          )}

          <div className="flex items-center gap-2">
            {activeTrackFormat && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold tracking-wider border ${
                isCyber
                  ? 'bg-[#FF1A3C]/20 text-[#FF1A3C] border-[#FF1A3C]/40'
                  : 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20'
              }`}>
                {isCyber ? 'CYBER-DSP' : 'Hi-Res'}
              </span>
            )}
            <Wifi className={`w-3.5 h-3.5 ${isCyber ? 'text-[#FF1A3C]' : 'text-[#888888]'}`} />
          </div>
        </div>

        {/* Dynamic App Content */}
        <div className={`flex-1 relative overflow-hidden flex flex-col ${
          isCyber ? 'bg-[#060205]' : 'bg-gradient-to-b from-[#0D0D0D] to-[#0A0A0A]'
        }`}>
          {children}
        </div>

        {/* Android Bottom Gesture Navigation Bar */}
        <div className={`py-2.5 flex items-center justify-center shrink-0 border-t z-30 ${
          isCyber ? 'bg-[#080205]/95 border-[#FF1A3C]/40' : 'bg-[#0A0A0A]/95 border-[#1F1F1F]'
        }`}>
          <div className={`w-32 h-1 rounded-full transition-colors ${
            isCyber ? 'bg-[#FF1A3C] shadow-[0_0_8px_#FF1A3C]' : 'bg-[#222222] hover:bg-[#7C4DFF]'
          }`} />
        </div>
      </div>
    </div>
  );
};

