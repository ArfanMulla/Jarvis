import React, { useEffect, useRef } from 'react';
import { LiveState } from '../types/jarvis';
import { AudioStreamer } from '../services/AudioStreamer';
import { Mic, MicOff, Power, Radio, Volume2 } from 'lucide-react';

interface ArcReactorCoreProps {
  state: LiveState;
  onToggle: () => void;
  audioStreamer: AudioStreamer | null;
}

export const ArcReactorCore: React.FC<ArcReactorCoreProps> = ({
  state,
  onToggle,
  audioStreamer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 88;

      if (state === 'disconnected') {
        // Idle faint pulse
        const t = Date.now() * 0.0015;
        const pulse = Math.sin(t) * 4;

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        animId = requestAnimationFrame(render);
        return;
      }

      const { input, output } = audioStreamer
        ? audioStreamer.getFrequencyData()
        : { input: new Uint8Array(64), output: new Uint8Array(64) };

      const isSpeaking = state === 'speaking';
      const freqArray = isSpeaking ? output : input;
      const totalPoints = 64;

      // Draw radial frequency spikes
      for (let i = 0; i < totalPoints; i++) {
        const angle = (i / totalPoints) * Math.PI * 2;
        const val = freqArray[i % freqArray.length] || 0;
        const spikeLength = Math.max(4, (val / 255.0) * 45);

        const r1 = baseRadius + 12;
        const r2 = r1 + spikeLength;

        const x1 = centerX + Math.cos(angle) * r1;
        const y1 = centerY + Math.sin(angle) * r1;
        const x2 = centerX + Math.cos(angle) * r2;
        const y2 = centerY + Math.sin(angle) * r2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isSpeaking
          ? `rgba(0, 240, 255, ${0.4 + (val / 255) * 0.6})`
          : `rgba(56, 189, 248, ${0.3 + (val / 255) * 0.7})`;
        ctx.shadowBlur = val > 80 ? 10 : 0;
        ctx.shadowColor = isSpeaking ? '#00f0ff' : '#38bdf8';
        ctx.stroke();
      }

      // Draw inner glowing audio energy ring
      let avgLevel = 0;
      for (let i = 0; i < 32; i++) {
        avgLevel += freqArray[i] || 0;
      }
      avgLevel = avgLevel / (32 * 255);

      const dynamicRadius = baseRadius + avgLevel * 14;
      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isSpeaking ? 'rgba(0, 255, 255, 0.7)' : 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = isSpeaking ? '#00ffff' : '#38bdf8';
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, audioStreamer]);

  // Status text & colors
  const getStatusLabel = () => {
    switch (state) {
      case 'disconnected':
        return 'TAP TO INITIALIZE J.A.R.V.I.S.';
      case 'connecting':
        return 'ESTABLISHING NEURAL UPLINK...';
      case 'listening':
        return 'LISTENING (SPEAK IN HINDI / EN / HINGLISH)';
      case 'speaking':
        return 'J.A.R.V.I.S. VOCALIZING... (TAP TO INTERRUPT)';
    }
  };

  const isConnected = state !== 'disconnected';

  return (
    <div className="relative flex flex-col items-center justify-center my-4 select-none">
      {/* Outer Holographic Radar & Tech Rings */}
      <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center">
        {/* Radial Canvas Audio Visualizer */}
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          className="absolute inset-0 pointer-events-none z-10"
        />

        {/* Outer Gyro Ring with Tech Ticks */}
        <div
          className={`absolute inset-0 rounded-full border border-cyan-500/20 border-dashed ${
            state === 'connecting'
              ? 'animate-spin'
              : state === 'speaking'
              ? 'animate-[spin_20s_linear_infinite]'
              : 'animate-[spin_40s_linear_infinite]'
          }`}
          style={{ animationDuration: state === 'speaking' ? '8s' : '30s' }}
        >
          {/* Compass Tech Markers */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-cyan-400"></div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 bg-cyan-400"></div>
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-cyan-400"></div>
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-cyan-400"></div>
        </div>

        {/* Secondary Counter-Rotating Ring */}
        <div
          className="absolute inset-4 rounded-full border border-cyan-400/30 border-dotted"
          style={{
            animation: isConnected ? 'spin 18s linear infinite reverse' : 'none',
          }}
        ></div>

        {/* Glowing Pulse Aura */}
        <div
          className={`absolute inset-8 rounded-full transition-all duration-700 pointer-events-none ${
            state === 'speaking'
              ? 'bg-cyan-500/20 shadow-[0_0_80px_rgba(0,240,255,0.6)] animate-pulse'
              : state === 'listening'
              ? 'bg-sky-500/15 shadow-[0_0_50px_rgba(56,189,248,0.4)]'
              : state === 'connecting'
              ? 'bg-amber-500/15 shadow-[0_0_40px_rgba(245,158,11,0.4)]'
              : 'bg-transparent shadow-none'
          }`}
        ></div>

        {/* Central Core Arc Reactor Button */}
        <button
          onClick={onToggle}
          type="button"
          aria-label="Toggle JARVIS Voice Link"
          className={`relative z-20 w-40 h-40 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 focus:outline-none cursor-pointer ${
            state === 'disconnected'
              ? 'bg-gradient-to-b from-gray-900 to-black border-2 border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.2)]'
              : state === 'connecting'
              ? 'bg-gradient-to-b from-amber-950/60 to-black border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.5)]'
              : state === 'speaking'
              ? 'bg-gradient-to-b from-cyan-950/80 to-blue-950/90 border-2 border-cyan-300 shadow-[0_0_60px_rgba(0,240,255,0.8)]'
              : 'bg-gradient-to-b from-sky-950/80 to-gray-950 border-2 border-sky-400 shadow-[0_0_40px_rgba(56,189,248,0.5)]'
          }`}
        >
          {/* Internal Arc Reactor Geometric Details */}
          <div className="absolute inset-2 rounded-full border border-cyan-400/20 pointer-events-none"></div>
          <div className="absolute inset-5 rounded-full border border-cyan-400/30 border-dashed pointer-events-none"></div>

          {/* Central Holographic Icon */}
          <div className="relative z-10 flex flex-col items-center">
            {state === 'disconnected' && (
              <>
                <Power className="w-10 h-10 text-cyan-400 mb-1 animate-pulse" />
                <span className="text-[10px] tracking-[0.25em] text-cyan-400 font-mono font-bold">
                  STANDBY
                </span>
              </>
            )}

            {state === 'connecting' && (
              <>
                <Radio className="w-10 h-10 text-amber-400 mb-1 animate-bounce" />
                <span className="text-[10px] tracking-[0.25em] text-amber-400 font-mono font-bold">
                  LINKING
                </span>
              </>
            )}

            {state === 'listening' && (
              <>
                <Mic className="w-10 h-10 text-sky-300 mb-1 animate-pulse" />
                <span className="text-[10px] tracking-[0.25em] text-sky-300 font-mono font-bold">
                  LISTENING
                </span>
              </>
            )}

            {state === 'speaking' && (
              <>
                <Volume2 className="w-11 h-11 text-cyan-300 mb-1 animate-pulse" />
                <span className="text-[10px] tracking-[0.25em] text-cyan-200 font-mono font-bold">
                  SPEAKING
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Futuristic Telemetry Status Indicator */}
      <div className="mt-3 flex flex-col items-center">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              state === 'speaking'
                ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-ping'
                : state === 'listening'
                ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse'
                : state === 'connecting'
                ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                : 'bg-gray-600'
            }`}
          />
          <p
            className={`text-xs sm:text-sm font-semibold tracking-wider font-mono ${
              state === 'speaking'
                ? 'text-cyan-300'
                : state === 'listening'
                ? 'text-sky-300'
                : state === 'connecting'
                ? 'text-amber-300'
                : 'text-gray-400'
            }`}
          >
            {getStatusLabel()}
          </p>
        </div>

        {isConnected && (
          <p className="text-[11px] font-mono text-cyan-500/70 mt-1">
            VOICE CONTROLLED • PCM16 16kHz &harr; 24kHz LIVE STREAM
          </p>
        )}
      </div>
    </div>
  );
};
