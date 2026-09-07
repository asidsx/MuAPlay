import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../services/audioEngine';

interface CyberReactiveRingProps {
  isPlaying: boolean;
  enabled?: boolean;
  size?: number;
  className?: string;
  children?: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Shockwave {
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export const CyberReactiveRing: React.FC<CyberReactiveRingProps> = ({
  isPlaying,
  enabled = true,
  size = 320,
  className = '',
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const rotationAngleRef = useRef<number>(0);
  const hudRotationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // 84 radial bars around the 360° circle
  const totalBars = 84;
  const smoothedHeightsRef = useRef<Float32Array>(new Float32Array(totalBars));
  const peakValuesRef = useRef<Float32Array>(new Float32Array(totalBars));
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const lastBassKickTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Handle High-DPI screens
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const baseRadius = size * 0.38; // Clean circular base hugging the cover
    const maxSpikeHeight = size * 0.14; // Max spike leap

    // ECO / Power Saving Mode: If disabled, render faint static ring once and halt CPU/GPU render loop
    if (!enabled) {
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 26, 60, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();
      return () => {
        cancelAnimationFrame(animFrameRef.current);
      };
    }

    const render = () => {
      timeRef.current += 0.035;
      const t = timeRef.current;

      ctx.clearRect(0, 0, size, size);

      // Fetch live audio spectrum & waveform
      let freqData: Uint8Array | null = null;
      let timeData: Uint8Array | null = null;
      if (isPlaying) {
        freqData = audioEngine.getFrequencyData();
        timeData = audioEngine.getTimeDomainData();
      }

      // 1. Audio Energy Analysis across 3 Primary Bands (Sub/Bass, Mids, Highs)
      let bassEnergy = 0;
      let midEnergy = 0;
      let highEnergy = 0;
      let rawOverall = 0;

      if (freqData && isPlaying) {
        const binCount = freqData.length;
        // Sub-bass (bin 1 to 8)
        for (let b = 1; b < Math.min(10, binCount); b++) {
          bassEnergy += freqData[b] / 255;
        }
        bassEnergy /= 9;

        // Mids (bin 10 to 45)
        for (let b = 10; b < Math.min(45, binCount); b++) {
          midEnergy += freqData[b] / 255;
        }
        midEnergy /= 35;

        // Highs (bin 45 to 110)
        for (let b = 45; b < Math.min(110, binCount); b++) {
          highEnergy += freqData[b] / 255;
        }
        highEnergy /= 65;

        // Auto-boost high and mid registers for dynamic parity
        midEnergy = Math.min(1.0, midEnergy * 1.4);
        highEnergy = Math.min(1.0, highEnergy * 2.2);

        rawOverall = (bassEnergy * 0.5 + midEnergy * 0.3 + highEnergy * 0.2);
      }

      const overallEnergy = rawOverall;

      // 2. Uniform 360° Multi-Harmonic Distribution (Eliminates dead zones & "переломы")
      // We distribute 6 cyclic harmonic lobes around the circle with interleaved sub/mid/treble bins
      // and procedural high-energy micro-chaos so EVERY BAR jumps actively at the exact same base level!
      const smoothed = smoothedHeightsRef.current;
      const peaks = peakValuesRef.current;

      for (let i = 0; i < totalBars; i++) {
        let barRaw = 0;

        if (freqData && isPlaying) {
          // Quadrant/Sextant cyclical harmonic mapping
          const cycleAngle = (i / totalBars) * Math.PI * 6; // 3 full harmonic wave cycles around perimeter
          const harmonicWeight = 0.5 + 0.5 * Math.sin(cycleAngle);

          // Interleave bar types: 0 = Bass/Punch, 1 = Mids/Vocal, 2 = Highs/Cymbals
          const barType = i % 3;
          let baseAudioVal = 0;
          if (barType === 0) {
            // Bass-linked bar with harmonic modulation
            const bin = Math.min(freqData.length - 1, 1 + (i % 8));
            baseAudioVal = (freqData[bin] / 255) * 0.8 + bassEnergy * 0.4;
          } else if (barType === 1) {
            // Mid-range vocal / synth bar
            const bin = Math.min(freqData.length - 1, 12 + (i % 24));
            baseAudioVal = (freqData[bin] / 255) * 1.35 * harmonicWeight + midEnergy * 0.4;
          } else {
            // Treble shimmer bar
            const bin = Math.min(freqData.length - 1, 35 + (i % 40));
            baseAudioVal = (freqData[bin] / 255) * 2.2 * (1 - harmonicWeight * 0.5) + highEnergy * 0.5;
          }

          // Smart Controlled Cyber-Chaos: Adds crisp dancing jitter without breaking circle coherence
          const noise1 = Math.sin(i * 18.7 + t * 9.5) * Math.cos(i * 4.3 - t * 6.2);
          const noise2 = Math.sin(i * 9.1 - t * 14.0) * Math.sin(t * 8.0);
          const chaoticJitter = Math.abs(noise1 * 0.6 + noise2 * 0.4) * (overallEnergy * 0.65 + 0.05);

          // Combined active target
          barRaw = Math.min(1.0, Math.pow(baseAudioVal, 1.15) * 0.85 + chaoticJitter);
        } else {
          // Subtle idle ambient breathing when paused
          barRaw = 0.04 + 0.02 * Math.sin(i * 0.4 + t * 2);
        }

        // Snappy fast attack (0.65) for sharp jump, fluid decay (0.16)
        const attack = barRaw > smoothed[i] ? 0.65 : 0.16;
        smoothed[i] += (barRaw - smoothed[i]) * attack;

        // Peak markers with gravity fall
        if (smoothed[i] >= peaks[i]) {
          peaks[i] = smoothed[i];
        } else {
          peaks[i] = Math.max(0, peaks[i] - 0.022); // Fast gravity drop
        }
      }

      // Smooth rotation with slight speedup on loud sections
      const rotSpeed = isPlaying ? 0.003 + overallEnergy * 0.006 : 0.001;
      rotationAngleRef.current = (rotationAngleRef.current + rotSpeed) % (Math.PI * 2);
      const angleOffset = rotationAngleRef.current;

      const hudRotSpeed = isPlaying ? -0.002 - bassEnergy * 0.004 : -0.0008;
      hudRotationRef.current = (hudRotationRef.current + hudRotSpeed) % (Math.PI * 2);

      // 3. Trigger Bass Shockwave pulse on sharp beat transients
      const now = performance.now();
      if (isPlaying && bassEnergy > 0.55 && now - lastBassKickTimeRef.current > 240) {
        lastBassKickTimeRef.current = now;
        shockwavesRef.current.push({
          radius: baseRadius,
          maxRadius: baseRadius + maxSpikeHeight * 1.6 + 20,
          alpha: 0.85,
          color: Math.random() > 0.35 ? '#FF1A3C' : '#00E5FF',
        });

        // Spawn neon energy spark particles
        for (let p = 0; p < 4; p++) {
          const pAngle = Math.random() * Math.PI * 2;
          const pSpeed = 1.2 + Math.random() * 2.8 + bassEnergy * 2.5;
          particlesRef.current.push({
            x: center + Math.cos(pAngle) * baseRadius,
            y: center + Math.sin(pAngle) * baseRadius,
            vx: Math.cos(pAngle) * pSpeed,
            vy: Math.sin(pAngle) * pSpeed,
            size: 1.5 + Math.random() * 2,
            alpha: 1.0,
            color: Math.random() > 0.5 ? '#00E5FF' : '#FF1A3C',
            life: 0,
            maxLife: 20 + Math.random() * 20,
          });
        }
      }

      // 4. Render Expanding Bass Shockwaves
      const activeShockwaves: Shockwave[] = [];
      for (const sw of shockwavesRef.current) {
        sw.radius += (sw.maxRadius - sw.radius) * 0.14 + 1.2;
        sw.alpha *= 0.91;

        if (sw.alpha > 0.04 && sw.radius < sw.maxRadius) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(center, center, sw.radius, 0, Math.PI * 2);
          ctx.strokeStyle = sw.color;
          ctx.globalAlpha = sw.alpha;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = sw.color;
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.restore();
          activeShockwaves.push(sw);
        }
      }
      shockwavesRef.current = activeShockwaves.slice(-5);

      // 5. Render Flying Energy Particles
      const activeParticles: Particle[] = [];
      for (const pt of particlesRef.current) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx *= 0.95;
        pt.vy *= 0.95;
        pt.life++;
        pt.alpha = 1 - pt.life / pt.maxLife;

        if (pt.life < pt.maxLife && pt.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, pt.alpha);
          ctx.fillStyle = pt.color;
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          activeParticles.push(pt);
        }
      }
      particlesRef.current = activeParticles.slice(-40);

      // 6. Draw Fixed Circular Base Ring (Perfect circular baseline without warping)
      ctx.save();
      // Main circular guide ring
      ctx.beginPath();
      ctx.arc(center, center, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isPlaying ? 'rgba(255, 26, 60, 0.45)' : 'rgba(255, 26, 60, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner tech rotating reticle
      ctx.beginPath();
      ctx.arc(center, center, baseRadius - 6, 0, Math.PI * 2);
      ctx.strokeStyle = isPlaying ? 'rgba(0, 229, 255, 0.35)' : 'rgba(0, 229, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 8, 12, 6]);
      ctx.lineDashOffset = hudRotationRef.current * 80;
      ctx.stroke();
      ctx.restore();

      // 7. Draw All 84 Jumping Equalizer Bars on the Level Circular Base
      for (let i = 0; i < totalBars; i++) {
        const angle = (i / totalBars) * Math.PI * 2 + angleOffset;
        const val = smoothed[i];
        const peakVal = peaks[i];

        // Every bar starts from the exact same base radius!
        const rInner = baseRadius;
        const barHeight = Math.max(3, val * maxSpikeHeight * 1.45);
        const rOuter = rInner + barHeight;

        const x1 = center + Math.cos(angle) * rInner;
        const y1 = center + Math.sin(angle) * rInner;
        const x2 = center + Math.cos(angle) * rOuter;
        const y2 = center + Math.sin(angle) * rOuter;

        // Dynamic Color: alternating cyber pattern with neon glow
        // Red -> Purple -> Cyan transitions across bars
        let strokeColor = '#FF1A3C';
        let glowColor = 'rgba(255, 26, 60, 0.7)';

        const barMod = i % 4;
        if (barMod === 0) {
          strokeColor = '#00E5FF';
          glowColor = 'rgba(0, 229, 255, 0.85)';
        } else if (barMod === 2) {
          strokeColor = '#E000FF';
          glowColor = 'rgba(224, 0, 255, 0.8)';
        } else if (val > 0.45) {
          strokeColor = '#FF2E50';
          glowColor = 'rgba(255, 46, 80, 0.9)';
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = isPlaying && val > 0.15 ? 7 : 1;
        ctx.stroke();

        // 8. Jumping Peak Cap Dots (Floating Caps)
        if (peakVal > 0.05) {
          const rPeak = rInner + Math.max(5, peakVal * maxSpikeHeight * 1.45) + 3;
          const px = center + Math.cos(angle) * rPeak;
          const py = center + Math.sin(angle) * rPeak;

          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = barMod === 0 ? '#FFFFFF' : strokeColor;
          ctx.shadowColor = strokeColor;
          ctx.shadowBlur = 5;
          ctx.fill();
        }
        ctx.restore();
      }

      // 9. Outer Smooth Cyber-Ribbon contour connecting all dynamic peaks
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= totalBars; i++) {
        const idx = i % totalBars;
        const angle = (idx / totalBars) * Math.PI * 2 + angleOffset;
        const val = smoothed[idx];
        const r = baseRadius + Math.max(3, val * maxSpikeHeight * 1.45);
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      const outerGrad = ctx.createLinearGradient(0, 0, size, size);
      outerGrad.addColorStop(0, '#FF1A3C');
      outerGrad.addColorStop(0.33, '#E000FF');
      outerGrad.addColorStop(0.66, '#00E5FF');
      outerGrad.addColorStop(1, '#FF1A3C');

      ctx.strokeStyle = outerGrad;
      ctx.lineWidth = isPlaying ? 1.5 : 0.8;
      ctx.shadowColor = 'rgba(255, 26, 60, 0.4)';
      ctx.shadowBlur = isPlaying ? 8 : 2;
      ctx.stroke();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, size, enabled]);

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
