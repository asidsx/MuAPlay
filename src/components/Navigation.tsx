import React from 'react';
import { Music, Disc3, FolderDown, Sliders, Heart, Terminal } from 'lucide-react';

export type TabType = 'tracks' | 'playlists' | 'downloads' | 'equalizer' | 'favorites' | 'cyberpunk';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  tracksCount: number;
  playlistsCount: number;
  guiMode?: 'standard' | 'cyberpunk';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  playlistsCount,
  guiMode = 'standard',
}) => {
  const isCyber = guiMode === 'cyberpunk';

  const tabs = [
    { id: 'tracks' as TabType, label: isCyber ? 'ТРЕКИ' : 'Треки', icon: Music },
    { id: 'playlists' as TabType, label: isCyber ? 'ПЛЕЙЛИСТЫ' : 'Плейлисты', icon: Disc3, badge: playlistsCount },
    { id: 'downloads' as TabType, label: isCyber ? 'ЗАГРУЗКИ' : 'Загрузки', icon: FolderDown, highlight: true },
    { id: 'equalizer' as TabType, label: isCyber ? 'DSP EQ' : 'Эквалайзер', icon: Sliders },
    { id: 'cyberpunk' as TabType, label: isCyber ? 'CP2077 HUD' : 'Netrunner', icon: Terminal, special: true },
    { id: 'favorites' as TabType, label: isCyber ? 'ИЗБРАННОЕ' : 'Избранное', icon: Heart },
  ];

  return (
    <nav className={`backdrop-blur-xl border-t px-1.5 py-1.5 flex items-center justify-around z-20 ${
      isCyber
        ? 'bg-[#080205]/95 border-[#FF1A3C]/50 text-[#FF4D6D] cyberpunk-scanlines'
        : 'bg-[#0A0A0A]/95 border-[#1F1F1F]'
    }`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center py-1 px-1.5 rounded-xl transition-all duration-200 group ${
              isActive
                ? isCyber
                  ? 'text-[#FF1A3C] font-bold'
                  : 'text-[#7C4DFF] font-medium'
                : isCyber
                ? 'text-[#A62B3F] hover:text-[#FF8095]'
                : 'text-[#777777] hover:text-[#E0E0E0]'
            }`}
          >
            {/* Active Indicator background pill */}
            {isActive && (
              <span className={`absolute inset-0 rounded-xl border transition-all ${
                isCyber
                  ? 'bg-[#FF1A3C]/20 border-[#FF1A3C] shadow-[0_0_10px_rgba(255,26,60,0.4)]'
                  : 'bg-[#7C4DFF]/15 border-[#7C4DFF]/30'
              }`} />
            )}

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                  isActive
                    ? isCyber
                      ? 'scale-110 text-[#FF1A3C]'
                      : 'scale-110 text-[#7C4DFF]'
                    : ''
                }`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`absolute -top-1 -right-2 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                    isCyber ? 'bg-[#FF1A3C] border-[#080205]' : 'bg-[#7C4DFF] border-[#0A0A0A]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {tab.highlight && !isActive && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping ${
                    isCyber ? 'bg-[#FF1A3C]' : 'bg-[#00E5FF]'
                  }`} />
                )}
              </div>
              <span className={`text-[9px] mt-1 tracking-tight font-mono ${
                isActive
                  ? isCyber
                    ? 'text-[#FF1A3C] font-black'
                    : 'text-[#7C4DFF] font-bold'
                  : isCyber
                  ? 'text-[#A62B3F]'
                  : 'text-[#777777]'
              }`}>
                {tab.label}
              </span>
            </div>
          </button>
        );
      })}
    </nav>
  );
};

