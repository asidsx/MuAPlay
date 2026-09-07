import { useState, useEffect } from 'react';
import { Track } from '../types/music';
import { getOrGenerateTrackWaveform, resampleWaveform } from '../services/waveformService';

interface UseTrackWaveformResult {
  waveform: number[];
  isCached: boolean;
  isGenerating: boolean;
  source: 'pcm' | 'dsp' | 'cache';
}

export function useTrackWaveform(
  track?: Partial<Track> | null,
  barCount = 68
): UseTrackWaveformResult {
  const [waveform, setWaveform] = useState<number[]>(() => {
    return Array(barCount).fill(0.35);
  });
  const [isCached, setIsCached] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [source, setSource] = useState<'pcm' | 'dsp' | 'cache'>('cache');

  useEffect(() => {
    if (!track || !track.id) {
      setWaveform(Array(barCount).fill(0.35));
      setIsCached(false);
      setIsGenerating(false);
      setSource('cache');
      return;
    }

    let isMounted = true;
    setIsGenerating(true);

    getOrGenerateTrackWaveform(track, barCount)
      .then((res) => {
        if (!isMounted) return;
        setWaveform(res.peaks);
        setIsCached(res.isCached);
        setSource(res.source);
        setIsGenerating(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [track?.id, track?.title, track?.duration, barCount]);

  return { waveform, isCached, isGenerating, source };
}
