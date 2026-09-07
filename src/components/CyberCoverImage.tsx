import React, { useState, useEffect } from 'react';
import { Music2, Disc3 } from 'lucide-react';

interface CyberCoverImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIconClassName?: string;
  roundedClassName?: string;
}

export const CyberCoverImage: React.FC<CyberCoverImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackIconClassName = 'w-4 h-4',
  roundedClassName = 'rounded-lg',
}) => {
  // If src starts with ephemeral blob:, it is likely dead on page reload
  const isDeadBlob = src?.startsWith('blob:');
  const [hasError, setHasError] = useState<boolean>(!src || isDeadBlob);

  useEffect(() => {
    setHasError(!src || src.startsWith('blob:'));
  }, [src]);

  // Generate deterministic holographic accent from alt string
  const getGradient = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash += text.charCodeAt(i);
    const variants = [
      'from-[#FF1A3C]/30 via-[#2A0512] to-[#0A0206]',
      'from-[#00E5FF]/30 via-[#031E2B] to-[#0A0206]',
      'from-[#9D00FF]/30 via-[#1E032B] to-[#0A0206]',
      'from-[#FF0055]/30 via-[#2B0314] to-[#0A0206]',
    ];
    return variants[hash % variants.length];
  };

  const initials = alt
    ? alt
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '♫';

  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${getGradient(
          alt || 'Track'
        )} border border-[#FF1A3C]/40 relative overflow-hidden select-none ${roundedClassName}`}
      >
        {/* Cyber Grid background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#FF1A3C_1px,transparent_1px)] [background-size:6px_6px]" />
        
        {/* Hologram Initial */}
        <span className="text-[11px] font-mono font-black text-[#00E5FF] tracking-wider z-10 drop-shadow-[0_0_6px_rgba(0,229,255,0.7)]">
          {initials}
        </span>
        
        <Disc3 className={`${fallbackIconClassName} text-[#FF1A3C]/80 mt-0.5 animate-[spin_8s_linear_infinite] opacity-70 z-10`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} ${roundedClassName}`}
      loading="lazy"
    />
  );
};
