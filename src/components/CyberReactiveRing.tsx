import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../services/audioEngine';

interface CyberReactiveRingProps {
  isPlaying: boolean;
  size?: number; // Size in px (width & height)
  className?: string;
  children?: React.ReactNode;
}

export const CyberReactiveRing: React.FC<CyberReactiveRingProps> = ({
  isPlaying,
  size = 320,
  className = '',
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const rotationAngleRef = useRef<number>(0);

  // Smooth interpolation buffer for frequency bins so it doesn't flicker
  const smoothedFreqRef = useRef<Float32Array>(new Float32Array(64));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const numPoints = 64; // Number of radial equalizer bars / polygon vertices
    const center = size / 2;
    const baseRadius = size * 0.42; // Base circle radius hugging the album card
    const maxBarHeight = size * 0.12;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // Advance rotation angle smoothly
      const rotSpeed = isPlaying ? 0.006 : 0.002;
      rotationAngleRef.current = (rotationAngleRef.current + rotSpeed) % (Math.PI * 2);
      const angleOffset = rotationAngleRef.current;

      // Fetch live frequency data
      let freqData: Uint8Array | null = null;
      if (isPlaying) {
        freqData = audioEngine.getFrequencyData();
      }

      // Smooth the frequency data for a fluid organic distortion
      const smoothed = smoothedFreqRef.current;
      for (let i = 0; i < numPoints; i++) {
        let target = 0;
        if (freqData && isPlaying) {
          // Sample across lower to mid-high frequencies (human voice + bass + instruments)
          const freqIndex = Math.min(
            freqData.length - 1,
            Math.floor((i / numPoints) * (freqData.length * 0.65))
          );
          target = freqData[freqIndex] / 255;
        }
        // Lerp for smooth springy reaction
        const attackFactor = target > smoothed[i] ? 0.45 : 0.15;
        smoothed[i] += (target - smoothed[i]) * attackFactor;
      }

      // Calculate bass power for central holographic glow
      let bassEnergy = 0;
      for (let i = 0; i < 8; i++) {
        bassEnergy += smoothed[i];
      }
      bassEnergy /= 8;

      // 1. Draw Ambient Radial Holographic Glow
      if (isPlaying && bassEnergy > 0.05) {
        const glowRadius = baseRadius + bassEnergy * maxBarHeight * 1.5;
        const radGrad = ctx.createRadialGradient(
          center,
          center,
          baseRadius * 0.8,
          center,
          center,
          glowRadius + 20
        );
        radGrad.addColorStop(0, `rgba(255, 26, 60, ${0.05 + bassEnergy * 0.18})`);
        radGrad.addColorStop(0.6, `rgba(0, 229, 255, ${bassEnergy * 0.12})`);
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(center, center, glowRadius + 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw Distorted Equalizer Outer Ring (Smooth Waveform Polygon)
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const idx = i % numPoints;
        const angle = (idx / numPoints) * Math.PI * 2 + angleOffset;
        const val = smoothed[idx];
        const r = baseRadius + val * maxBarHeight;
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Neon gradient stroke around the distorted perimeter
      const strokeGrad = ctx.createLinearGradient(0, 0, size, size);
      strokeGrad.addColorStop(0, '#FF1A3C');
      strokeGrad.addColorStop(0.5, '#00E5FF');
      strokeGrad.addColorStop(1, '#FF0055');

      ctx.strokeStyle = strokeGrad;
      ctx.lineWidth = isPlaying ? 2.5 : 1.5;
      ctx.shadowColor = isPlaying ? 'rgba(255, 26, 60, 0.75)' : 'rgba(255, 26, 60, 0.2)';
      ctx.shadowBlur = isPlaying ? 12 : 4;
      ctx.stroke();
      ctx.restore();

      // 3. Draw Radial Equalizer Spikes / Ticks on each frequency bin
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2 + angleOffset;
        const val = smoothed[i];
        
        // Inner anchor point
        const rInner = baseRadius - 2;
        const x1 = center + Math.cos(angle) * rInner;
        const y1 = center + Math.sin(angle) * rInner;

        // Outer distorted spike point
        const spikeHeight = 3 + val * maxBarHeight;
        const rOuter = baseRadius + spikeHeight;
        const x2 = center + Math.cos(angle) * rOuter;
        const y2 = center + Math.sin(angle) * rOuter;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        // Cyberpunk color transition based on frequency & intensity
        if (i % 4 === 0) {
          ctx.strokeStyle = val > 0.4 ? '#00E5FF' : 'rgba(0, 229, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00E5FF';
          ctx.shadowBlur = val > 0.3 ? 8 : 2;
        } else {
          ctx.strokeStyle = val > 0.5 ? '#FF1A3C' : 'rgba(255, 26, 60, 0.5)';
          ctx.lineWidth = 1.2;
          ctx.shadowColor = '#FF1A3C';
          ctx.shadowBlur = val > 0.4 ? 6 : 0;
        }
        ctx.stroke();

        // Tip glowing dot for strong frequencies
        if (val > 0.25) {
          ctx.beginPath();
          ctx.arc(x2, y2, 1.5 + val * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = i % 4 === 0 ? '#00E5FF' : '#FF1A3C';
          ctx.shadowBlur = 8;
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Secondary Counter-Rotating Cyberpunk Segmented Dash Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, baseRadius - 8, 0, Math.PI * 2);
      ctx.strokeStyle = isPlaying ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255, 26, 60, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.lineDashOffset = -angleOffset * 40; // Counter-rotation effect
      ctx.stroke();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, size]);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Visualizer Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: size, height: size }}
      />
      
      {/* Central Content (Album Artwork Card) */}
      <div className="relative z-20 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};
