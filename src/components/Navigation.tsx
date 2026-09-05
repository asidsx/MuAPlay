import React from 'react';
import { Music, Disc3, FolderDown, Sliders, Heart } from 'lucide-react';

export type TabType = 'tracks' | 'playlists' | 'downloads' | 'equalizer' | 'favorites';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tracksCount: number;
  playlistsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  playlistsCount,
}) => {
  const tabs = [
    { id: 'tracks' as TabType, label: 'ТРЕКИ', icon: Music },
    { id: 'playlists' as TabType, label: 'ПЛЕЙЛИСТЫ', icon: Disc3, badge: playlistsCount },
    { id: 'downloads' as TabType, label: 'ЗАГРУЗКИ', icon: FolderDown, highlight: true },
    { id: 'equalizer' as TabType, label: 'DSP EQ', icon: Sliders },
    { id: 'favorites' as TabType, label: 'ИЗБРАННОЕ', icon: Heart },
  ];

  return (
    <nav className="backdrop-blur-xl border-t px-2 py-1.5 flex items-center justify-around z-20 bg-[#0C0206]/95 border-[#FF1A3C]/50 text-[#FF4D6D] relative">
      {/* Subtle top neon accent line */}
      <div className="absolute -top-[1px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF1A3C] to-transparent opacity-80" />

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center py-1 px-2.5 rounded-lg transition-all duration-200 group ${
              isActive
                ? 'text-[#FF1A3C] font-black'
                : 'text-[#992233] hover:text-[#FF6680]'
            }`}
          >
            {/* Active Indicator HUD bracket / glow */}
            {isActive && (
              <span className="absolute inset-0 rounded-lg bg-[#FF1A3C]/15 border border-[#FF1A3C] shadow-[0_0_12px_rgba(255,26,60,0.4)]" />
            )}

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-[#FF1A3C]' : ''
                  }`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#FF1A3C] text-black font-black text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#080205] shadow-[0_0_6px_#FF1A3C]">
                    {tab.badge}
                  </span>
                )}
                {tab.highlight && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF] animate-ping" />
                )}
              </div>
              <span
                className={`text-[9px] mt-1 font-mono tracking-wider ${
                  isActive ? 'text-[#FF1A3C] font-black text-glow-red' : 'text-[#882233]'
                }`}
              >
                {tab.label}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
};
