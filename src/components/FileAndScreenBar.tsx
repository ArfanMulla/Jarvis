import React, { useRef, useState } from 'react';
import { UploadedFileContext, ScreenReaderCardData } from '../types/jarvis';
import {
  Upload,
  Eye,
  FileText,
  Image as ImageIcon,
  Smartphone,
  Laptop,
  Code,
  Newspaper,
  Calculator,
  X,
  Sparkles,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface FileAndScreenBarProps {
  onScreenAnalyzed: (data: ScreenReaderCardData) => void;
  onFileAnalyzed: (file: UploadedFileContext) => void;
  onOpenAppTrigger: (appName: string) => void;
  activeFiles: UploadedFileContext[];
  onRemoveFile: (fileId: string) => void;
}

export const FileAndScreenBar: React.FC<FileAndScreenBarProps> = ({
  onScreenAnalyzed,
  onFileAnalyzed,
  onOpenAppTrigger,
  activeFiles,
  onRemoveFile,
}) => {
  const [isCapturingScreen, setIsCapturingScreen] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Capture screen using DisplayMedia API
  const handleCaptureScreen = async () => {
    setIsCapturingScreen(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Wait a moment for frame to render
      await new Promise((r) => setTimeout(r, 400));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Stop screen stream tracks immediately
      stream.getTracks().forEach((track) => track.stop());

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // Send to server OCR & Vision endpoint
      const res = await fetch('/api/analyze-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const result = await res.json();

      onScreenAnalyzed({
        screenshotUrl: dataUrl,
        summary: result.summary || 'Screen analysis complete.',
        extractedText: result.extractedText || '',
        detectedWindows: result.detectedWindows || ['Laptop/Phone Screen'],
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.error('Screen capture error:', err);
    } finally {
      setIsCapturingScreen(false);
    }
  };

  // Handle File & Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const reader = new FileReader();

      if (file.type.startsWith('image/')) {
        reader.onload = async () => {
          const base64Data = reader.result as string;
          const res = await fetch('/api/analyze-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              base64Data,
            }),
          });
          const data = await res.json();
          if (data.file) {
            onFileAnalyzed(data.file);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Text, code, json, csv, etc.
        reader.onload = async () => {
          const textContent = reader.result as string;
          const res = await fetch('/api/analyze-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type || 'text/plain',
              textContent,
            }),
          });
          const data = await res.json();
          if (data.file) {
            onFileAnalyzed(data.file);
          }
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 my-2 select-none">
      {/* Control Bar */}
      <div className="p-3 bg-gray-950/70 border border-cyan-500/25 rounded-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 shadow-[0_2px_16px_rgba(0,240,255,0.06)]">
        {/* Screen Reader & File Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Read Screen Button */}
          <button
            onClick={handleCaptureScreen}
            disabled={isCapturingScreen}
            className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] cursor-pointer disabled:opacity-50"
            title="Capture & Read Screen via Vision OCR"
          >
            {isCapturingScreen ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning Screen...
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-cyan-400" /> Read My Screen (OCR)
              </>
            )}
          </button>

          {/* Upload File / Image Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingFile}
            className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-sky-500/30 text-sky-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Upload code, documents, or images for JARVIS to read"
          >
            {isUploadingFile ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" /> Indexing File...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-sky-400" /> Upload File / Image
              </>
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.txt,.py,.js,.ts,.tsx,.json,.csv,.md,.pdf,.c,.cpp"
          />
        </div>

        {/* Device & Native App Launchers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-gray-500 hidden sm:inline mr-1">
            APPS:
          </span>

          <button
            onClick={() => onOpenAppTrigger('whatsapp')}
            className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="Open WhatsApp on Laptop/Mobile"
          >
            <Smartphone className="w-3 h-3 text-emerald-400" /> WhatsApp
          </button>

          <button
            onClick={() => onOpenAppTrigger('vscode')}
            className="px-2.5 py-1 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-blue-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="Switch back to VS Code"
          >
            <Code className="w-3 h-3 text-blue-400" /> VS Code
          </button>

          <button
            onClick={() => onOpenAppTrigger('notepad')}
            className="px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="Open Notepad"
          >
            <FileText className="w-3 h-3 text-cyan-400" /> Notepad
          </button>

          <button
            onClick={() => onOpenAppTrigger('calculator')}
            className="px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="Open Calculator"
          >
            <Calculator className="w-3 h-3 text-purple-400" /> Calc
          </button>
        </div>
      </div>

      {/* Active Uploaded Files Chips */}
      {activeFiles.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-sky-400 font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            ACTIVE FILE CONTEXT (JARVIS PRIORITIZES THIS):
          </span>
          {activeFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/70 border border-sky-500/40 text-[11px] font-mono text-sky-200"
            >
              {file.fileType.startsWith('image/') ? (
                <ImageIcon className="w-3 h-3 text-sky-400" />
              ) : (
                <FileText className="w-3 h-3 text-cyan-400" />
              )}
              <span className="max-w-[140px] truncate">{file.fileName}</span>
              <button
                onClick={() => onRemoveFile(file.id)}
                className="text-gray-400 hover:text-red-400 ml-1"
                title="Remove file from context"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
