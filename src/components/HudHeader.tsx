import React from 'react';
import { LiveState } from '../types/jarvis';
import {
  Cpu,
  Brain,
  GraduationCap,
  Volume2,
  VolumeX,
  Radio,
  ShieldCheck,
} from 'lucide-react';

interface HudHeaderProps {
  state: LiveState;
  onOpenStudyGuide: () => void;
  onOpenMemory: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  state,
  onOpenStudyGuide,
  onOpenMemory,
  isMuted,
  onToggleMute,
}) => {
  const isConnected = state !== 'disconnected';

  return (
    <header className="w-full border-b border-cyan-500/20 bg-gray-950/70 backdrop-blur-md px-4 py-3 sticky top-0 z-30 select-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Stark Brand & System Identification */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-[0.2em] font-mono text-cyan-300">
                J.A.R.V.I.S.
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                MK-85
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-400 hidden sm:block">
              STARK INDUSTRIES • AUDIO-TO-AUDIO NEURAL LINK
            </p>
          </div>
        </div>

        {/* Center: Live Stream Protocol Status */}
        <div className="hidden md:flex items-center space-x-2 bg-gray-900/80 px-3 py-1.5 rounded-full border border-cyan-500/20 text-xs font-mono">
          <Radio
            className={`w-3.5 h-3.5 ${
              isConnected ? 'text-cyan-400 animate-pulse' : 'text-gray-500'
            }`}
          />
          <span className="text-gray-400 text-[11px]">
            PROTOCOL:{' '}
            <strong className="text-cyan-300">
              {isConnected ? '16kHz PCM &harr; 24kHz LIVE' : 'STANDBY'}
            </strong>
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-[11px]">
            LANG:{' '}
            <span className="text-sky-300 font-semibold">
              HINDI • ENGLISH • HINGLISH
            </span>
          </span>
        </div>

        {/* Right: Quick Tools (Study Tutor, Memory Bank, Mute) */}
        <div className="flex items-center space-x-2">
          {/* Study Tutor Mode Shortcut */}
          <button
            onClick={onOpenStudyGuide}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 hover:bg-cyan-950/60 hover:border-cyan-400 transition-all cursor-pointer"
            title="Open Study Tutor Guide"
          >
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">STUDY TUTOR</span>
          </button>

          {/* Memory Bank Shortcut */}
          <button
            onClick={onOpenMemory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-900/90 border border-sky-500/30 text-xs font-mono text-sky-300 hover:bg-sky-950/60 hover:border-sky-400 transition-all cursor-pointer"
            title="Open Persistent Memory Bank"
          >
            <Brain className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">MEMORY</span>
          </button>

          {/* Mute / Output Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isMuted
                ? 'bg-red-950/60 border-red-500/50 text-red-400'
                : 'bg-gray-900/90 border-gray-700 text-gray-300 hover:text-cyan-300 hover:border-cyan-500/50'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
