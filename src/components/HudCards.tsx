import React, { useState } from 'react';
import {
  HudCard,
  YouTubeCardData,
  SearchCardData,
  CodeCardData,
  WhatsAppCardData,
  AppCardData,
  ScreenReaderCardData,
  NewsCardData,
  WikipediaCardData,
} from '../types/jarvis';
import {
  Play,
  Pause,
  Square,
  Volume2,
  ExternalLink,
  Code,
  Send,
  CheckCircle,
  Clock,
  Terminal,
  Brain,
  Globe,
  MessageSquare,
  Sparkles,
  X,
  Copy,
  Check,
  Eye,
  FileText,
  Search,
  Smartphone,
  Laptop,
  Share2,
  Radio,
  BookOpen,
  Newspaper,
  Calculator as CalcIcon,
  Download,
} from 'lucide-react';

interface HudCardsProps {
  cards: HudCard[];
  onRemoveCard: (id: string) => void;
  onMediaControl: (action: string) => void;
}

export const HudCards: React.FC<HudCardsProps> = ({
  cards,
  onRemoveCard,
  onMediaControl,
}) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  if (cards.length === 0) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 space-y-4 my-4">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <span className="text-xs font-mono text-cyan-400 tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          ACTIVE HUD WORKSPACE ({cards.length})
        </span>
        <span className="text-[11px] font-mono text-gray-400">
          VOICE &amp; DEVICE AUTOMATION
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="relative bg-gray-950/85 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-[0_4px_24px_rgba(0,240,255,0.08)] transition-all hover:border-cyan-400/60"
          >
            {/* Header / Dismiss */}
            <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <h4 className="text-xs font-mono font-bold text-cyan-300 tracking-wide uppercase">
                  {card.title}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-500">
                  {card.timestamp}
                </span>
                <button
                  onClick={() => onRemoveCard(card.id)}
                  className="text-gray-400 hover:text-cyan-300 transition-colors p-1"
                  title="Dismiss HUD Module"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Screen Vision & OCR Card */}
            {card.type === 'screen_reader' && (
              <ScreenReaderCard
                data={card.data as ScreenReaderCardData}
                onCopy={(txt) => handleCopy(card.id, txt)}
                isCopied={copiedCodeId === card.id}
              />
            )}

            {/* File Analyzer Card */}
            {card.type === 'file_analyzer' && (
              <FileAnalyzerCard data={card.data} />
            )}

            {/* Full WhatsApp Controller Card */}
            {card.type === 'whatsapp' && (
              <WhatsAppFullCard data={card.data as WhatsAppCardData} />
            )}

            {/* VS Code Focus Switcher Card */}
            {card.type === 'vscode' && <VSCodeCard data={card.data} />}

            {/* News Headlines Card */}
            {card.type === 'news' && (
              <NewsCard data={card.data as NewsCardData} />
            )}

            {/* Wikipedia Card */}
            {card.type === 'wikipedia' && (
              <WikipediaCard data={card.data as WikipediaCardData} />
            )}

            {/* Notepad Card */}
            {card.type === 'notepad' && <NotepadCard data={card.data} />}

            {/* Calculator Card */}
            {card.type === 'calculator' && <CalculatorCard data={card.data} />}

            {/* YouTube Player Card */}
            {card.type === 'youtube' && (
              <YouTubeCard
                data={card.data as YouTubeCardData}
                onMediaControl={onMediaControl}
              />
            )}

            {/* Web Search Card */}
            {card.type === 'search' && (
              <SearchCard data={card.data as SearchCardData} />
            )}

            {/* Code Sandbox Card */}
            {card.type === 'code' && (
              <CodeCard
                data={card.data as CodeCardData}
                cardId={card.id}
                isCopied={copiedCodeId === card.id}
                onCopy={(code) => handleCopy(card.id, code)}
              />
            )}

            {/* Memory Card */}
            {card.type === 'memory' && <MemoryCard data={card.data} />}

            {/* Generic App Card */}
            {card.type === 'app' && (
              <AppLauncherCard data={card.data as AppCardData} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 1. Screen Vision & OCR Card
const ScreenReaderCard: React.FC<{
  data: ScreenReaderCardData;
  onCopy: (txt: string) => void;
  isCopied: boolean;
}> = ({ data, onCopy, isCopied }) => {
  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-400">
          <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Screen Vision Intelligence</span>
        </div>
        <div className="flex items-center gap-1.5">
          {data.detectedWindows?.map((w, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono"
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-100 leading-relaxed">
        <span className="font-bold text-cyan-300 block mb-1 font-mono">
          J.A.R.V.I.S. SPOKEN SUMMARY:
        </span>
        <p>{data.summary}</p>
      </div>

      {data.extractedText && (
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>DETECTED ON-SCREEN TEXT (OCR)</span>
            <button
              onClick={() => onCopy(data.extractedText)}
              className="hover:text-cyan-300 flex items-center gap-1"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy Text
                </>
              )}
            </button>
          </div>
          <pre className="p-2.5 bg-black/90 rounded-lg border border-gray-800 text-sky-200 text-[11px] max-h-40 overflow-y-auto whitespace-pre-wrap">
            {data.extractedText}
          </pre>
        </div>
      )}
    </div>
  );
};

// 2. File Analyzer Card
const FileAnalyzerCard: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-2.5 font-mono text-xs">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sky-400 font-bold">
          <FileText className="w-4 h-4" />
          {data.fileName || 'Uploaded File Query'}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
          Targeted Search Focus
        </span>
      </div>

      <div className="p-3 bg-gray-900/90 rounded-lg border border-sky-500/30 text-gray-200 leading-relaxed font-sans text-xs">
        <span className="text-[10px] font-mono text-sky-400 block mb-1 font-bold">
          SEARCH RESULT FROM UPLOADED FILE:
        </span>
        <p className="whitespace-pre-wrap">{data.result}</p>
      </div>
    </div>
  );
};

// 3. Full WhatsApp Controller Card
const WhatsAppFullCard: React.FC<{ data: WhatsAppCardData }> = ({ data }) => {
  const [selectedContact, setSelectedContact] = useState<string>(
    data.contact || 'Rahul'
  );
  const [typedMessage, setTypedMessage] = useState<string>(data.message || '');
  const [contactSearch, setContactSearch] = useState<string>('');

  const contacts = data.allContacts || {
    Rahul: '+91-9876543210',
    Priya: '+91-9812345678',
    Aman: '+91-9823456789',
    Maa: '+91-9834567890',
    Office: '+91-9800011223',
  };

  const currentPhone =
    contacts[selectedContact] || data.phone || '+91-9876543210';
  const cleanPhone = currentPhone.replace(/[^0-9]/g, '');

  const filteredContacts = Object.keys(contacts).filter((c) =>
    c.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(typedMessage)}`;
  const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(typedMessage)}`;

  return (
    <div className="space-y-3 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
              <span>{selectedContact}</span>
              <span className="text-[10px] font-mono text-emerald-400">
                {currentPhone}
              </span>
            </h5>
            <span className="text-[10px] font-mono text-gray-400">
              WhatsApp Messenger Interface
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
            data.status === 'awaiting_confirmation'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {data.status === 'awaiting_confirmation'
            ? 'Awaiting Voice Confirmation'
            : 'Message Sent'}
        </span>
      </div>

      {/* Contact Filter / Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search contact (e.g. Rahul, Priya)..."
              className="w-full bg-black/80 border border-gray-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filteredContacts.map((contactName) => (
            <button
              key={contactName}
              onClick={() => setSelectedContact(contactName)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                selectedContact === contactName
                  ? 'bg-emerald-600 text-black font-bold'
                  : 'bg-gray-900 text-gray-300 border border-gray-800 hover:border-emerald-500'
              }`}
            >
              {contactName}
            </button>
          ))}
        </div>
      </div>

      {/* Message Chat Bubble */}
      <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
          <span>DRAFT MESSAGE TO {selectedContact.toUpperCase()}</span>
          <span>VOICE READ-BACK ACTIVE</span>
        </div>
        <textarea
          value={typedMessage}
          onChange={(e) => setTypedMessage(e.target.value)}
          placeholder="Speak or type message here..."
          className="w-full bg-black/70 border border-emerald-500/20 rounded-lg p-2.5 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-emerald-500 resize-none h-18"
        />
      </div>

      {/* Quick Access to Native Apps on Mobile or Windows */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-800">
        <div className="flex items-center gap-2">
          {/* WhatsApp Web Link */}
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Laptop className="w-3.5 h-3.5" /> Open in WhatsApp Web
          </a>

          {/* WhatsApp App Mobile/Windows Protocol */}
          <a
            href={appUrl}
            className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" /> Open in App
          </a>
        </div>

        <span className="text-[11px] font-mono text-amber-300">
          Voice: Say "Haan" to send
        </span>
      </div>
    </div>
  );
};

// 4. VS Code Card
const VSCodeCard: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <Code className="w-4 h-4 text-cyan-400" />
          <span>Visual Studio Code Workspace</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
          Focus Ready
        </span>
      </div>

      <p className="text-gray-300 font-sans text-xs">
        {data.action || 'Switching focus back to your active VS Code window.'}
      </p>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
        <a
          href="vscode://"
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Focus Local VS Code App
        </a>
        <a
          href="https://vscode.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-sky-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          Open VS Code Web
        </a>
      </div>
    </div>
  );
};

// 5. News Card
const NewsCard: React.FC<{ data: NewsCardData }> = ({ data }) => {
  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between text-xs font-mono border-b border-gray-800 pb-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Newspaper className="w-4 h-4 text-amber-400" />
          <span>HEADLINES: {data.source.toUpperCase()}</span>
        </div>
        <span className="text-[10px] text-gray-500">{data.timestamp}</span>
      </div>

      <div className="space-y-2">
        {data.headlines.map((hl, i) => (
          <div
            key={i}
            className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 text-xs text-gray-200 flex items-start gap-2"
          >
            <span className="font-mono text-cyan-400 font-bold text-[11px] mt-0.5">
              0{i + 1}.
            </span>
            <p className="leading-relaxed">{hl}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 6. Wikipedia Card
const WikipediaCard: React.FC<{ data: WikipediaCardData }> = ({ data }) => {
  return (
    <div className="space-y-2.5 font-sans text-xs">
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-center gap-2 text-sky-400 font-bold">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span>Wikipedia: {data.title}</span>
        </div>
        {data.pageUrl && (
          <a
            href={data.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-sky-300 flex items-center gap-1 text-[11px]"
          >
            Read Article <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="p-3 bg-gray-900/60 rounded-lg border border-sky-500/20 text-gray-200 leading-relaxed">
        {data.summary}
      </div>
    </div>
  );
};

// 7. Notepad Card
const NotepadCard: React.FC<{ data: any }> = ({ data }) => {
  const [noteText, setNoteText] = useState<string>(
    data.text || 'J.A.R.V.I.S. Quick Notepad Notes...'
  );

  const handleDownload = () => {
    const blob = new Blob([noteText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jarvis-note-${Date.now()}.txt`;
    link.click();
  };

  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <FileText className="w-4 h-4" /> Notepad
        </span>
        <button
          onClick={handleDownload}
          className="text-gray-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
        >
          <Download className="w-3 h-3" /> Save File
        </button>
      </div>

      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        className="w-full bg-black/80 border border-gray-800 rounded-lg p-2.5 text-xs text-gray-200 font-mono resize-y h-24 focus:outline-none focus:border-cyan-500"
      />
    </div>
  );
};

// 8. Calculator Card
const CalculatorCard: React.FC<{ data: any }> = ({ data }) => {
  const [expr, setExpr] = useState<string>(data.expression || '');
  const [calcResult, setCalcResult] = useState<string>('');

  const handleEvaluate = () => {
    try {
      // Safe math eval
      const cleanExpr = expr.replace(/[^0-9+\-*/().Mathsincostan]/g, '');
      const res = Function(`"use strict"; return (${cleanExpr})`)();
      setCalcResult(String(res));
    } catch (e: any) {
      setCalcResult('Error');
    }
  };

  return (
    <div className="space-y-2 font-mono text-xs max-w-sm">
      <div className="flex items-center justify-between text-cyan-400 font-bold">
        <span className="flex items-center gap-1.5">
          <CalcIcon className="w-4 h-4" /> Calculator
        </span>
      </div>

      <div className="bg-black/90 p-2.5 rounded-lg border border-gray-800 text-right space-y-1">
        <div className="text-gray-400 text-[11px] h-4">{expr || '0'}</div>
        <div className="text-cyan-300 font-bold text-sm h-5">
          {calcResult || '= 0'}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="e.g. (25 * 4) + 180"
          className="flex-1 bg-black border border-gray-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={handleEvaluate}
          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded text-xs cursor-pointer"
        >
          =
        </button>
      </div>
    </div>
  );
};

// YouTube Card
const YouTubeCard: React.FC<{
  data: YouTubeCardData;
  onMediaControl: (action: string) => void;
}> = ({ data, onMediaControl }) => {
  return (
    <div className="space-y-3">
      {data.videoId && (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-cyan-500/20 bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${data.videoId}?autoplay=1&enablejsapi=1`}
            title={data.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-800/80">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onMediaControl('pause')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-gray-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950 flex items-center gap-1"
          >
            <Pause className="w-3 h-3" /> Pause
          </button>
          <button
            onClick={() => onMediaControl('resume')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-gray-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950 flex items-center gap-1"
          >
            <Play className="w-3 h-3" /> Resume
          </button>
          <button
            onClick={() => onMediaControl('stop')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-gray-900 border border-red-500/40 text-red-400 hover:bg-red-950 flex items-center gap-1"
          >
            <Square className="w-3 h-3" /> Stop
          </button>
        </div>

        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(data.query)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
        >
          Open in YouTube Browser <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

// Web Search Card
const SearchCard: React.FC<{ data: SearchCardData }> = ({ data }) => {
  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
        <Globe className="w-4 h-4" />
        <span>Query: "{data.query}"</span>
      </div>

      <div className="space-y-2">
        {data.results &&
          data.results.map((res, idx) => (
            <div
              key={idx}
              className="bg-gray-900/60 p-2.5 rounded-lg border border-gray-800 text-xs text-gray-300 leading-relaxed"
            >
              <div className="font-semibold text-sky-300 mb-1 flex items-center justify-between">
                <span>{res.title}</span>
                <span className="text-[10px] font-mono text-gray-500">
                  Verified Intel
                </span>
              </div>
              <p className="text-gray-300">{res.snippet}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

// Code Sandbox Card
const CodeCard: React.FC<{
  data: CodeCardData;
  cardId: string;
  isCopied: boolean;
  onCopy: (code: string) => void;
}> = ({ data, cardId, isCopied, onCopy }) => {
  return (
    <div className="space-y-2.5 font-mono text-xs">
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] uppercase">
          {data.language || 'Code'}
        </span>
        <div className="flex items-center gap-2">
          {data.executionTime !== undefined && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              {data.executionTime}ms
            </span>
          )}
          <button
            onClick={() => onCopy(data.code)}
            className="text-gray-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </button>
        </div>
      </div>

      <pre className="p-3 bg-black/90 rounded-lg border border-gray-800 overflow-x-auto text-sky-200 text-xs leading-relaxed">
        <code>{data.code}</code>
      </pre>

      {data.output && (
        <div className="bg-gray-900/90 rounded-lg p-2.5 border border-emerald-500/30">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Terminal className="w-3 h-3" /> Sandbox Stdout
          </div>
          <pre className="text-emerald-200 text-xs whitespace-pre-wrap">
            {data.output}
          </pre>
        </div>
      )}

      {data.error && (
        <div className="bg-red-950/40 rounded-lg p-2.5 border border-red-500/40 text-red-300 text-xs">
          <span className="font-bold">Execution Error:</span> {data.error}
        </div>
      )}
    </div>
  );
};

// Memory Card
const MemoryCard: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
        <Brain className="w-4 h-4" /> Neural Memory Bank
      </div>
      <div className="p-3 bg-gray-900/80 rounded-lg border border-cyan-500/20 text-gray-300 space-y-1">
        <pre className="text-xs text-cyan-200 whitespace-pre-wrap font-mono">
          {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
        </pre>
      </div>
    </div>
  );
};

// App Card
const AppLauncherCard: React.FC<{ data: AppCardData }> = ({ data }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-900/60 rounded-lg border border-cyan-500/20 font-mono text-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-sky-200 font-bold block">{data.appName}</span>
          <span className="text-[10px] text-gray-400">{data.action}</span>
        </div>
      </div>
      {data.url && (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
        >
          Open Link <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
