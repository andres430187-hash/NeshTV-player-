import React from 'react';

interface NeshLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const NeshLogo: React.FC<NeshLogoProps> = ({ size = 'md', showSubtitle = false }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl md:text-6xl',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  return (
    <div className="flex items-center gap-2.5 tracking-wider select-none group">
      {/* Sleek TV & Play Screen Emblem */}
      <div className={`relative flex items-center justify-center rounded-lg bg-black border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.35)] p-1.5 transition-transform duration-200 group-hover:scale-105`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={`${iconSizes[size]} text-[#00F0FF]`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" className="stroke-[#00F0FF]" />
          <polyline points="17 2 12 7 7 2" className="stroke-[#00F0FF]/80" />
          <polygon points="10 11 15 14.5 10 18" fill="#00F0FF" className="stroke-none" />
        </svg>
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
      </div>

      <div className="flex flex-col">
        <div className={`font-black font-['Outfit'] ${sizeClasses[size]} tracking-tight flex items-center leading-none`}>
          <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Nesh</span>
          <span className="text-[#00F0FF] ml-0.5 drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]">TV</span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-400 font-semibold mt-1">
            IPTV Pro Player
          </span>
        )}
      </div>
    </div>
  );
};
