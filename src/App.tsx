import React, { useState, useEffect, useRef } from 'react';
import { LiveSession } from './services/LiveSession';
import {
  LiveState,
  HudCard,
  ScreenReaderCardData,
  UploadedFileContext,
} from './types/jarvis';
import { ArcReactorCore } from './components/ArcReactorCore';
import { AudioWaveform } from './components/AudioWaveform';
import { HudHeader } from './components/HudHeader';
import { HudCards } from './components/HudCards';
import { FileAndScreenBar } from './components/FileAndScreenBar';
import { StudyCompanionModal } from './components/StudyCompanionModal';
import { MemoryBankDrawer } from './components/MemoryBankDrawer';
import {
  Sparkles,
  AlertCircle,
  HelpCircle,
  Brain,
  GraduationCap,
  MessageSquare,
  Play,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  const [liveState, setLiveState] = useState<LiveState>('disconnected');
  const [cards, setCards] = useState<HudCard[]>([]);
  const [activeFiles, setActiveFiles] = useState<UploadedFileContext[]>([]);
  const [transcripts, setTranscripts] = useState<
    Array<{ speaker: 'user' | 'jarvis'; text: string; id: string }>
  >([]);
  const [latestTranscript, setLatestTranscript] = useState<{
    speaker: 'user' | 'jarvis';
    text: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStudyGuideOpen, setIsStudyGuideOpen] = useState<boolean>(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const liveSessionRef = useRef<LiveSession | null>(null);

  // Fetch initial files
  useEffect(() => {
    fetch('/api/files')
      .then((r) => r.json())
      .then((data) => {
        if (data.files) setActiveFiles(data.files);
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    const session = new LiveSession({
      onStateChange: (newState) => {
        setLiveState(newState);
      },
      onTranscript: (speaker, text) => {
        setLatestTranscript({ speaker, text });
        setTranscripts((prev) => [
          ...prev.slice(-10),
          { speaker, text, id: 'tr-' + Date.now() + Math.random() },
        ]);
      },
      onToolCall: (card) => {
        setCards((prev) => [card, ...prev.slice(0, 6)]);
      },
      onToolUpdate: (cardId, updates) => {
        setCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c))
        );
      },
      onError: (err) => {
        setErrorMsg(err);
      },
    });

    liveSessionRef.current = session;

    return () => {
      session.disconnect();
    };
  }, []);

  const handleToggleConnection = () => {
    setErrorMsg(null);
    if (!liveSessionRef.current) return;

    if (liveState === 'disconnected') {
      liveSessionRef.current.connect();
    } else if (liveState === 'speaking') {
      liveSessionRef.current.interrupt();
    } else {
      liveSessionRef.current.disconnect();
    }
  };

  const handleRemoveCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleMediaControl = (action: string) => {
    if (liveSessionRef.current) {
      liveSessionRef.current.sendMediaControl(action);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && liveSessionRef.current) {
      liveSessionRef.current.audioStreamer.stopPlayback();
    }
  };

  // Screen Analysis Handler
  const handleScreenAnalyzed = (data: ScreenReaderCardData) => {
    const cardId = 'card-screen-' + Date.now();
    const newCard: HudCard = {
      id: cardId,
      type: 'screen_reader',
      title: 'Screen Vision OCR & App Context',
      timestamp: data.timestamp,
      data,
    };
    setCards((prev) => [newCard, ...prev.slice(0, 6)]);
  };

  // File Upload Handler
  const handleFileAnalyzed = (file: UploadedFileContext) => {
    setActiveFiles((prev) => [file, ...prev.slice(0, 4)]);
    const cardId = 'card-file-' + Date.now();
    const newCard: HudCard = {
      id: cardId,
      type: 'file_analyzer',
      title: `File Indexed: ${file.fileName}`,
      timestamp: file.timestamp,
      data: {
        fileName: file.fileName,
        result: file.summary,
        fullContent: file.extractedText,
      },
    };
    setCards((prev) => [newCard, ...prev.slice(0, 6)]);
  };

  const handleRemoveFile = (fileId: string) => {
    setActiveFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // App Launcher Handler
  const handleOpenAppTrigger = (appName: string) => {
    const cardId = 'card-app-' + Date.now();
    const time = new Date().toLocaleTimeString();

    if (appName === 'whatsapp') {
      setCards((prev) => [
        {
          id: cardId,
          type: 'whatsapp',
          title: 'WhatsApp • Rahul',
          timestamp: time,
          data: {
            contact: 'Rahul',
            phone: '+91-9876543210',
            message: 'Hello! Checking in regarding our project.',
            status: 'draft',
            timestamp: time,
          },
        },
        ...prev.slice(0, 6),
      ]);
    } else if (appName === 'vscode') {
      setCards((prev) => [
        {
          id: cardId,
          type: 'vscode',
          title: 'Visual Studio Code Focus',
          timestamp: time,
          data: {
            action: 'Switching focus back to VS Code window or web workspace',
          },
        },
        ...prev.slice(0, 6),
      ]);
    } else if (appName === 'notepad') {
      setCards((prev) => [
        {
          id: cardId,
          type: 'notepad',
          title: 'Cyber Notepad',
          timestamp: time,
          data: { text: '' },
        },
        ...prev.slice(0, 6),
      ]);
    } else if (appName === 'calculator') {
      setCards((prev) => [
        {
          id: cardId,
          type: 'calculator',
          title: 'Scientific Calculator',
          timestamp: time,
          data: { expression: '' },
        },
        ...prev.slice(0, 6),
      ]);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-gray-100 font-sans flex flex-col justify-between overflow-x-hidden select-none">
      {/* Background Cybernetic Hologram Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Telemetry Header */}
      <HudHeader
        state={liveState}
        onOpenStudyGuide={() => setIsStudyGuideOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Voice & Automation Viewport */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 max-w-4xl mx-auto w-full">
        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="w-full max-w-md mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-xl flex items-center justify-between text-xs text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-shake">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-white ml-2 text-sm font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Central Futuristic Arc Reactor Core */}
        <ArcReactorCore
          state={liveState}
          onToggle={handleToggleConnection}
          audioStreamer={liveSessionRef.current?.audioStreamer || null}
        />

        {/* Oscilloscope Waveform Bar Visualizer */}
        <AudioWaveform
          audioStreamer={liveSessionRef.current?.audioStreamer || null}
          state={liveState}
        />

        {/* Real-time Spoken Telemetry / Transcript Caption Toast */}
        {latestTranscript && (
          <div className="w-full max-w-lg mt-1 px-4 py-2 bg-gray-950/80 border border-cyan-500/30 rounded-xl backdrop-blur-md shadow-[0_4px_20px_rgba(0,240,255,0.1)] transition-all animate-fadeIn">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider mb-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  latestTranscript.speaker === 'user'
                    ? 'bg-sky-400'
                    : 'bg-cyan-400 animate-pulse'
                }`}
              />
              <span
                className={
                  latestTranscript.speaker === 'user'
                    ? 'text-sky-300 font-bold'
                    : 'text-cyan-300 font-bold'
                }
              >
                {latestTranscript.speaker === 'user'
                  ? 'VOICE INPUT'
                  : 'J.A.R.V.I.S. VOCALIZATION'}
              </span>
            </div>
            <p className="text-xs text-gray-200 italic font-sans leading-relaxed">
              "{latestTranscript.text}"
            </p>
          </div>
        )}

        {/* Quick Screen OCR, File Upload, and App Bar */}
        <FileAndScreenBar
          onScreenAnalyzed={handleScreenAnalyzed}
          onFileAnalyzed={handleFileAnalyzed}
          onOpenAppTrigger={handleOpenAppTrigger}
          activeFiles={activeFiles}
          onRemoveFile={handleRemoveFile}
        />

        {/* Action HUD Modules (Screen Reader, WhatsApp, VS Code, Files, YouTube, Code) */}
        <HudCards
          cards={cards}
          onRemoveCard={handleRemoveCard}
          onMediaControl={handleMediaControl}
        />

        {/* Quick Spoken Voice Prompt Chips */}
        {cards.length === 0 && (
          <div className="mt-4 w-full max-w-xl text-center space-y-2">
            <span className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase block">
              SPOKEN COMMANDS (COMBINED SCRIPT &amp; LIVE AUTOMATION)
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Jarvis, read my screen',
                'Search Rahul on WhatsApp and write hello',
                'Switch to VS Code',
                'Read news from Indian Express',
                'Take this from the uploaded file',
                'Play Tum Hi Ho on YouTube',
                'Tell me a joke',
                'What are your capabilities?',
              ].map((cmd, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-gray-900/60 border border-cyan-500/20 text-[11px] font-mono text-cyan-300/90 shadow-sm hover:border-cyan-400/50 transition-colors"
                >
                  "{cmd}"
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Futuristic Bottom Status Bar */}
      <footer className="relative z-10 w-full border-t border-cyan-500/20 bg-gray-950/80 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>STARK INDUSTRIES COMBINED CORE</span>
            <span className="text-gray-600">|</span>
            <span className="text-cyan-400">SCREEN OCR • WHATSAPP • VS CODE • FILES</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsStudyGuideOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              [ CAPABILITY GUIDE ]
            </button>
            <button
              onClick={() => setIsMemoryOpen(true)}
              className="text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
            >
              [ NEURAL MEMORY ]
            </button>
          </div>
        </div>
      </footer>

      {/* Study Companion Drawer */}
      <StudyCompanionModal
        isOpen={isStudyGuideOpen}
        onClose={() => setIsStudyGuideOpen(false)}
      />

      {/* Persistent Memory Bank Drawer */}
      <MemoryBankDrawer
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />
    </div>
  );
}
