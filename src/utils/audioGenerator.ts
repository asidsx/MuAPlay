/**
 * Synthesizes playable high-quality audio PCM WAV Blobs for local offline preview / demo playback.
 * This guarantees real sound output, spectrum visualizers, and EQ processing in Web Audio API.
 */

export function generateSyntheticAudioBlob(type: 'synthwave' | 'chill' | 'jazz' | 'classical' | 'ambient' | 'rock', durationSec = 30): string {
  const sampleRate = 44100;
  const numChannels = 2;
  const numFrames = sampleRate * durationSec;
  const buffer = new Float32Array(numFrames * numChannels);

  // Musical scales for synthesis
  const scales: Record<string, number[]> = {
    synthwave: [110, 130.81, 146.83, 164.81, 196, 220, 261.63], // A minor pentatonic / synthwave
    chill: [130.81, 146.83, 164.81, 174.61, 196, 220, 246.94], // C major
    jazz: [146.83, 174.61, 196, 220, 261.63, 293.66, 349.23], // D minor 7 / 9
    classical: [220, 246.94, 277.18, 293.66, 329.63, 369.99, 440], // A major
    ambient: [110, 164.81, 220, 246.94, 329.63, 440], // Deep ambient pad
    rock: [82.41, 110, 123.47, 146.83, 164.81, 196], // E minor heavy
  };

  const freqs = scales[type] || scales.synthwave;

  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;
    let sampleL = 0;
    let sampleR = 0;

    // Bass line
    const bassFreq = freqs[0] / 2;
    const bassBeat = Math.floor(t * 2) % 4;
    const bassEnv = Math.exp(-((t * 2) % 1) * 3);
    sampleL += Math.sin(2 * Math.PI * bassFreq * t) * 0.25 * bassEnv;
    sampleR += Math.sin(2 * Math.PI * bassFreq * t) * 0.25 * bassEnv;

    // Chord pads
    const padFreq1 = freqs[Math.floor(t / 2) % freqs.length];
    const padFreq2 = freqs[(Math.floor(t / 2) + 2) % freqs.length];
    sampleL += Math.sin(2 * Math.PI * padFreq1 * t) * 0.12 * (0.6 + 0.4 * Math.sin(t * 1.5));
    sampleR += Math.sin(2 * Math.PI * padFreq2 * t) * 0.12 * (0.6 + 0.4 * Math.cos(t * 1.5));

    // Lead Arpeggio
    const arpIndex = Math.floor(t * 8) % freqs.length;
    const arpFreq = freqs[arpIndex] * 2;
    const arpEnv = Math.exp(-((t * 8) % 1) * 6);
    const arpWave = Math.sin(2 * Math.PI * arpFreq * t) + 0.3 * Math.sin(4 * Math.PI * arpFreq * t);
    sampleL += arpWave * 0.15 * arpEnv;
    sampleR += arpWave * 0.15 * arpEnv;

    // Rhythm Drums (Hi-hat / Kick)
    const subTime = (t * 4) % 1;
    if (subTime < 0.05) {
      // Kick drum
      const kickEnv = Math.exp(-subTime * 40);
      const kickFreq = 120 * Math.exp(-subTime * 30);
      sampleL += Math.sin(2 * Math.PI * kickFreq * t) * 0.4 * kickEnv;
      sampleR += Math.sin(2 * Math.PI * kickFreq * t) * 0.4 * kickEnv;
    }

    const hatTime = (t * 8) % 1;
    if (hatTime < 0.02) {
      // Noise hi-hat
      const noise = (Math.random() * 2 - 1) * Math.exp(-hatTime * 120);
      sampleL += noise * 0.08;
      sampleR += noise * 0.08;
    }

    // Master volume clamp
    buffer[i * 2] = Math.max(-1, Math.min(1, sampleL));
    buffer[i * 2 + 1] = Math.max(-1, Math.min(1, sampleR));
  }

  // Convert Float32 PCM to WAV 16-bit
  const wavBuffer = createWavFile(buffer, sampleRate, numChannels);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function createWavFile(samples: Float32Array, sampleRate: number, numChannels: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Write float samples converted to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
