import React, { useEffect, useRef } from 'react';
import { AudioStreamer } from '../services/AudioStreamer';
import { LiveState } from '../types/jarvis';

interface AudioWaveformProps {
  audioStreamer: AudioStreamer | null;
  state: LiveState;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioStreamer,
  state,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      if (state === 'disconnected') {
        // Idle flat-line with subtle cosmic noise
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, centerY);
        for (let x = 0; x < width; x += 4) {
          const noise = Math.sin(x * 0.05 + Date.now() * 0.002) * 2;
          ctx.lineTo(x, centerY + noise);
        }
        ctx.stroke();
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const { input, output } = audioStreamer
        ? audioStreamer.getFrequencyData()
        : { input: new Uint8Array(64), output: new Uint8Array(64) };

      // Determine active frequency array
      const isSpeaking = state === 'speaking';
      const freqData = isSpeaking ? output : input;
      const numBars = 48;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        const dataIdx = Math.floor((i / numBars) * freqData.length);
        const val = freqData[dataIdx] || 0;
        const normalized = val / 255.0;

        // Dynamic height based on audio level
        const barHeight = Math.max(3, normalized * (height * 0.85));

        const x = i * (barWidth + 2);
        const y = centerY - barHeight / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isSpeaking) {
          gradient.addColorStop(0, '#00ffff');
          gradient.addColorStop(0.5, '#0088ff');
          gradient.addColorStop(1, '#0044aa');
        } else if (state === 'listening') {
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(0.5, '#06b6d4');
          gradient.addColorStop(1, '#0284c7');
        } else {
          gradient.addColorStop(0, '#f59e0b');
          gradient.addColorStop(1, '#d97706');
        }

        ctx.fillStyle = gradient;
        ctx.shadowBlur = normalized > 0.3 ? 8 : 2;
        ctx.shadowColor = isSpeaking ? '#00f0ff' : '#38bdf8';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioStreamer, state]);

  return (
    <div className="w-full flex items-center justify-center py-2 px-4">
      <canvas
        ref={canvasRef}
        width={380}
        height={48}
        className="w-full max-w-md h-12 rounded-lg opacity-90"
      />
    </div>
  );
};
