import React, { useState, useEffect } from 'react';
import { Moon, Clock, X, Check, Volume2, Plus, AlertCircle } from 'lucide-react';
import { sleepTimer, SleepTimerState } from '../services/sleepTimer';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVolume: number;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  currentVolume,
}) => {
  const [timerState, setTimerState] = useState<SleepTimerState>(sleepTimer.state);
  const [customMinutes, setCustomMinutes] = useState<string>('20');

  useEffect(() => {
    const unsubscribe = sleepTimer.subscribe((st) => {
      setTimerState({ ...st });
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartPreset = (minutes: number) => {
    sleepTimer.start(minutes, currentVolume);
  };

  const handleStartEndOfTrack = () => {
    sleepTimer.startEndOfTrack(currentVolume);
  };

  const handleCustomStart = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseFloat(customMinutes);
    if (!isNaN(mins) && mins > 0) {
      sleepTimer.start(mins, currentVolume);
    }
  };

  const handleCancel = () => {
    sleepTimer.cancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono animate-in fade-in duration-200">
      <div className="bg-[#100308] border-2 border-[#FF1A3C] rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-[0_0_35px_rgba(255,26,60,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#FF1A3C]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FF1A3C]/20 border border-[#FF1A3C]/50 text-[#FF1A3C]">
              <Moon className="w-4 h-4 text-[#FF1A3C]" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white tracking-wider flex items-center gap-1.5">
                <span>[ ТАЙМЕР СНА // SLEEP_TIMER ]</span>
              </h3>
              <span className="text-[9px] text-[#883344] block">
                Плавное затухание громкости за 30 сек до сна
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#883344] hover:text-[#FF1A3C] hover:bg-[#FF1A3C]/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Timer Status Banner */}
        {timerState.isActive ? (
          <div className="bg-[#18040C] border border-[#00E5FF]/60 rounded-xl p-3.5 text-center space-y-2 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <span className="text-[9px] text-[#00E5FF] font-bold block uppercase tracking-widest">
              {timerState.mode === 'end_of_track' ? 'РЕЖИМ: ПО ОКОНЧАНИИ ТРЕКА' : 'ОСТАЛОСЬ ДО ОСТАНОВКИ'}
            </span>

            {timerState.mode === 'time' ? (
              <div className="text-3xl font-black text-white font-mono tracking-wider text-glow-cyan">
                {formatSeconds(timerState.remainingSeconds)}
              </div>
            ) : (
              <div className="text-xs font-bold text-white py-1">
                Остановка сразу по окончании текущей песни
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-[#883344]">
              <Volume2 className="w-3 h-3 text-[#00E5FF]" />
              <span>Громкость мягко снизится до 0 dB</span>
            </div>

            {/* Quick Actions while active */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#FF1A3C]/20">
              {timerState.mode === 'time' && (
                <>
                  <button
                    onClick={() => sleepTimer.addMinutes(5)}
                    className="px-2 py-1 bg-[#100308] border border-[#00E5FF]/40 text-[#00E5FF] rounded-lg text-[9px] font-bold hover:bg-[#00E5FF]/10 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+5 МИН</span>
                  </button>
                  <button
                    onClick={() => sleepTimer.addMinutes(15)}
                    className="px-2 py-1 bg-[#100308] border border-[#00E5FF]/40 text-[#00E5FF] rounded-lg text-[9px] font-bold hover:bg-[#00E5FF]/10 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+15 МИН</span>
                  </button>
                </>
              )}
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-[#FF1A3C] hover:bg-[#FF0033] text-black font-black rounded-lg text-[9px] shadow-[0_0_10px_rgba(255,26,60,0.5)] transition-all"
              >
                ОТМЕНИТЬ
              </button>
            </div>
          </div>
        ) : (
          /* Preset Buttons Grid */
          <div className="space-y-3">
            <span className="text-[9px] text-[#883344] uppercase tracking-wider block">
              ВЫБЕРИТЕ ВРЕМЯ РАБОТЫ:
            </span>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '15 МИНУТ', mins: 15 },
                { label: '30 МИНУТ', mins: 30 },
                { label: '45 МИНУТ', mins: 45 },
                { label: '60 МИНУТ', mins: 60 },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  onClick={() => handleStartPreset(preset.mins)}
                  className="p-2.5 bg-[#18040C] border border-[#FF1A3C]/40 hover:border-[#FF1A3C] hover:bg-[#FF1A3C]/15 rounded-xl text-[10px] font-bold text-white transition-all text-center flex items-center justify-center gap-1.5 group shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5 text-[#FF1A3C] group-hover:scale-110 transition-transform" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            {/* End of Current Track Preset */}
            <button
              onClick={handleStartEndOfTrack}
              className="w-full p-2.5 bg-[#18040C] border border-[#00E5FF]/40 hover:border-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-xl text-[10px] font-bold text-[#00E5FF] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>ПО ОКОНЧАНИИ ТЕКУЩЕГО ТРЕКА</span>
            </button>

            {/* Custom Minutes Input */}
            <form onSubmit={handleCustomStart} className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="1"
                max="360"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="Минуты"
                className="w-24 bg-[#080104] border border-[#FF1A3C]/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[#552233] focus:outline-none focus:border-[#FF1A3C] font-mono text-center"
              />
              <span className="text-[10px] text-[#883344]">мин</span>
              <button
                type="submit"
                className="flex-1 py-1.5 px-3 bg-[#FF1A3C] hover:bg-[#FF0033] text-black rounded-lg text-[10px] font-black shadow-[0_0_10px_rgba(255,26,60,0.4)] transition-all"
              >
                ЗАПУСТИТЬ
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#18040C] border border-[#FF1A3C]/40 hover:border-[#FF1A3C] text-white rounded-lg text-[10px] font-bold"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
