import React, { useState, useEffect } from 'react';
import { Wifi, Smartphone, Maximize2, Cpu, Zap, Activity, Lock } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTrackFormat?: string;
  isLossless?: boolean;
  onLockScreen?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTrackFormat,
  onLockScreen,
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

  return (
    <div className="h-[100dvh] w-full text-[#E0E0E0] flex flex-col items-center justify-center p-0 sm:p-4 font-sans select-none overflow-hidden bg-[#030103] cyberpunk-grid">
      {/* Top frame telemetry bar (visible on larger screens) */}
      <div className="w-full max-w-md hidden sm:flex items-center justify-between mb-2.5 px-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#150308] border border-[#FF1A3C]/60 rounded-md text-[#FF1A3C] shadow-[0_0_10px_rgba(255,26,60,0.3)]">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-bold text-[10px] tracking-wider">NEURAL_DECK // 2077</span>
          </div>

          <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
            {activeTrackFormat ? `[ ${activeTrackFormat} ]` : '[ 24-BIT / 192kHz ]'}
          </span>
        </div>

        <button
          onClick={() => setIsPhoneMode(!isPhoneMode)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all border bg-[#150308] text-[#FF4D6D] border-[#FF1A3C]/40 hover:border-[#FF1A3C] hover:bg-[#20040C]"
        >
          {isPhoneMode ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-[#FF1A3C]" />
              <span className="text-[10px] uppercase font-bold">FULLSCREEN</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-[#FF1A3C]" />
              <span className="text-[10px] uppercase font-bold">DEVICE_VIEW</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full h-full max-h-[100dvh] transition-all duration-300 relative flex flex-col overflow-hidden bg-[#080205] border-[#FF1A3C]/60 shadow-[0_0_40px_rgba(255,26,60,0.25)] ${
          isPhoneMode
            ? 'sm:max-w-[420px] sm:h-[860px] sm:max-h-[860px] sm:rounded-[36px] sm:border-[8px] sm:border-[#1A030A] sm:shadow-[0_25px_60px_-15px_rgba(255,26,60,0.35)] sm:ring-2 sm:ring-[#FF1A3C]/50'
            : 'max-w-4xl sm:h-[860px] sm:rounded-2xl sm:border sm:shadow-2xl'
        }`}
      >
        {/* Android Top Notch & Cyberpunk Status Bar */}
        <div className="pt-2 px-5 pb-2 flex items-center justify-between text-xs font-semibold z-30 border-b shrink-0 bg-[#120308]/95 text-[#FF4D6D] border-[#FF1A3C]/50">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-[#FF1A3C] text-[11px] tracking-wider">
              {currentTime || '10:08'}
            </span>
            <span className="text-[9px] text-[#00E5FF] font-mono font-bold hidden xs:inline">
              // K-SYS ONLINE
            </span>
          </div>

          {/* Camera Notch simulation in phone mode */}
          {isPhoneMode && (
            <div className="hidden sm:block w-20 h-4 rounded-b-xl border-x border-b bg-[#080205] border-[#FF1A3C]/40" />
          )}

          <div className="flex items-center gap-2">
            {onLockScreen && (
              <button
                onClick={onLockScreen}
                title="Экран блокировки (AOD виджет)"
                className="p-1 rounded bg-[#1C040E] border border-[#FF1A3C]/40 text-[#FF4D6D] hover:text-white hover:border-[#FF1A3C] transition-colors"
              >
                <Lock className="w-3 h-3" />
              </button>
            )}
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold tracking-wider border bg-[#FF1A3C]/20 text-[#FF1A3C] border-[#FF1A3C]/40">
              CYBER_DSP
            </span>
            <Wifi className="w-3.5 h-3.5 text-[#FF1A3C]" />
          </div>
        </div>

        {/* Dynamic App Content */}
        <div className="flex-1 relative overflow-hidden flex flex-col min-h-0 bg-[#070104] cyberpunk-scanlines">
          {children}
        </div>

        {/* Android Bottom Gesture Navigation Bar */}
        <div className="py-2 flex items-center justify-center shrink-0 border-t z-30 bg-[#0C0206]/95 border-[#FF1A3C]/40">
          <div className="w-28 h-1 rounded-full bg-[#FF1A3C] shadow-[0_0_10px_#FF1A3C]" />
        </div>
      </div>
    </div>
  );
};
