import React from 'react';
import { ListMusic, Play, Trash2, ArrowUp, ArrowDown, X, Music, Sparkles } from 'lucide-react';
import { Track } from '../types/music';
import { CyberCoverImage } from './CyberCoverImage';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  userQueue: Track[];
  upcomingTracks: Track[];
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onMoveQueueItem: (fromIndex: number, toIndex: number) => void;
  onClearQueue: () => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  userQueue,
  upcomingTracks,
  onPlayTrack,
  onRemoveFromQueue,
  onMoveQueueItem,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 font-mono animate-in fade-in duration-200">
      <div className="bg-[#0D0206] border-t-2 sm:border-2 border-[#FF1A3C] rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 w-full max-w-md max-h-[85vh] flex flex-col shadow-[0_0_40px_rgba(255,26,60,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#FF1A3C]/30 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FF1A3C]/20 border border-[#FF1A3C]/50 text-[#FF1A3C]">
              <ListMusic className="w-4 h-4 text-[#FF1A3C]" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white tracking-wider flex items-center gap-1.5">
                <span>[ ОЧЕРЕДЬ // UP_NEXT_QUEUE ]</span>
              </h3>
              <span className="text-[9px] text-[#883344] block">
                {userQueue.length} в очереди пользователя • {upcomingTracks.length} в автоплейлисте
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {userQueue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="px-2 py-1 bg-[#18040C] border border-[#FF1A3C]/40 hover:border-[#FF1A3C] text-[#FF1A3C] rounded-lg text-[9px] font-bold transition-colors flex items-center gap-1"
                title="Очистить очередь"
              >
                <Trash2 className="w-3 h-3" />
                <span>ОЧИСТИТЬ</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#883344] hover:text-[#FF1A3C] hover:bg-[#FF1A3C]/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 min-h-0">
          {/* Currently Playing Card */}
          {currentTrack && (
            <div className="space-y-1.5 shrink-0">
              <span className="text-[9px] text-[#00E5FF] uppercase font-bold tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
                <span>СЕЙЧАС ИГРАЕТ</span>
              </span>

              <div className="flex items-center justify-between p-2.5 bg-[#1A040D] border border-[#00E5FF]/60 rounded-xl shadow-[0_0_12px_rgba(0,229,255,0.2)]">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#0A0206] shrink-0 border border-[#00E5FF]/50">
                    <CyberCoverImage
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate font-mono">
                      {currentTrack.title}
                    </h4>
                    <p className="text-[9px] text-[#00E5FF] truncate mt-0.5">
                      {currentTrack.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pl-2 font-mono">
                  <span className="text-[8px] font-bold px-1.5 py-0.5 bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 rounded">
                    {currentTrack.hiResInfo?.format || 'HI-RES'}
                  </span>
                  <span className="text-[9px] text-[#883344]">
                    {formatDuration(currentTrack.duration)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* User Priority Queue */}
          <div className="space-y-2">
            <span className="text-[9px] text-[#FF4D6D] uppercase font-bold tracking-wider flex items-center justify-between">
              <span>ПРИОРИТЕТНАЯ ОЧЕРЕДЬ ({userQueue.length})</span>
              <span className="text-[8px] text-[#883344]">Сыграют в первую очередь</span>
            </span>

            {userQueue.length === 0 ? (
              <div className="py-4 text-center border border-dashed border-[#FF1A3C]/30 rounded-xl bg-[#120308]/40 text-[#883344] text-[10px] space-y-1">
                <p>[ ОЧЕРЕДЬ ПУСТА ]</p>
                <p className="text-[8px] text-[#662233]">
                  Используйте «Играть следующим» или «В очередь» на любом треке
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {userQueue.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    className="flex items-center justify-between p-2 bg-[#14030A] border border-[#FF1A3C]/40 rounded-xl hover:border-[#FF1A3C] transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[9px] text-[#FF1A3C] font-mono font-bold w-4 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#0A0206] shrink-0 border border-[#FF1A3C]/30">
                        <CyberCoverImage
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-[11px] font-bold text-white truncate">
                          {track.title}
                        </h5>
                        <p className="text-[8px] text-[#883344] truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move Up */}
                      <button
                        onClick={() => onMoveQueueItem(idx, Math.max(0, idx - 1))}
                        disabled={idx === 0}
                        className="p-1 text-[#883344] hover:text-[#00E5FF] disabled:opacity-20 transition-colors"
                        title="Поднять выше"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => onMoveQueueItem(idx, Math.min(userQueue.length - 1, idx + 1))}
                        disabled={idx === userQueue.length - 1}
                        className="p-1 text-[#883344] hover:text-[#00E5FF] disabled:opacity-20 transition-colors"
                        title="Опустить ниже"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove from queue */}
                      <button
                        onClick={() => onRemoveFromQueue(idx)}
                        className="p-1 text-[#883344] hover:text-[#FF1A3C] transition-colors"
                        title="Удалить из очереди"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Playlist / Library Tracks */}
          <div className="space-y-2">
            <span className="text-[9px] text-[#883344] uppercase font-bold tracking-wider block">
              ДАЛЕЕ ИЗ ПЛЕЙЛИСТА / МЕДИАТЕКИ ({upcomingTracks.length})
            </span>

            {upcomingTracks.length === 0 ? (
              <div className="py-3 text-center text-[#883344] text-[9px]">
                Конец списка
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingTracks.slice(0, 15).map((track, idx) => (
                  <div
                    key={`up-${track.id}-${idx}`}
                    onClick={() => onPlayTrack(track)}
                    className="flex items-center justify-between p-1.5 px-2 bg-[#0F0207] hover:bg-[#18040C] border border-transparent hover:border-[#FF1A3C]/30 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[8px] text-[#552233] font-mono w-4 shrink-0">
                        +{idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] text-[#CCC] font-medium truncate block">
                          {track.title}
                        </span>
                        <span className="text-[8px] text-[#662233] truncate block">
                          {track.artist}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[8px] text-[#662233] font-mono shrink-0">
                      <span>{formatDuration(track.duration)}</span>
                      <Play className="w-3 h-3 text-[#883344] hover:text-[#FF1A3C]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#FF1A3C]/30 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-[#FF1A3C] hover:bg-[#FF0033] text-black font-black rounded-xl text-xs shadow-[0_0_15px_rgba(255,26,60,0.5)] transition-all"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
};
