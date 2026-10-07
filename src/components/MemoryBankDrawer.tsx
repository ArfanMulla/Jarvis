import React, { useEffect, useState } from 'react';
import { UserMemory } from '../types/jarvis';
import {
  Brain,
  X,
  RefreshCw,
  User,
  Calendar,
  BookOpen,
  CheckSquare,
  Music,
  Phone,
  Sparkles,
  Plus,
} from 'lucide-react';

interface MemoryBankDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryBankDrawer: React.FC<MemoryBankDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [newNote, setNewNote] = useState<string>('');

  const fetchMemory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      setMemory(data);
    } catch (err) {
      console.error('Failed to load memory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemory();
    }
  }, [isOpen]);

  const handleAddQuickNote = async () => {
    if (!newNote.trim() || !memory) return;

    const updatedTasks = [
      ...memory.tasks,
      {
        id: 'task-' + Date.now(),
        task: newNote.trim(),
        status: 'pending' as const,
      },
    ];

    const updated = { ...memory, tasks: updatedTasks };
    setMemory(updated);
    setNewNote('');

    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error('Error saving memory note:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-950 border border-sky-500/40 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.2)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-sky-950/20">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold font-mono text-sky-300 tracking-wider">
              J.A.R.V.I.S. PERSISTENT NEURAL MEMORY
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchMemory}
              disabled={loading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-sky-300 hover:bg-gray-900 transition-colors"
              title="Refresh Memory"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-sky-300 hover:bg-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs font-mono text-gray-300">
          {/* Profile Card */}
          <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
              <span className="font-bold text-sky-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-400" /> USER PROFILE
              </span>
              <span className="text-[10px] text-gray-500">Persistent ID</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px]">NAME</span>
                <span className="text-white font-bold">
                  {memory?.profile.name || 'Arfan'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">
                  PREFERRED LANGUAGE
                </span>
                <span className="text-sky-200">
                  {memory?.profile.preferredLanguage || 'Hinglish (Hindi / English)'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] flex items-center gap-1">
                  <Music className="w-3 h-3 text-cyan-400" /> FAVORITE ARTISTS
                </span>
                <span className="text-gray-300">
                  {memory?.profile.favoriteArtists.join(', ') || 'Arijit Singh, Coldplay'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" /> CONTACTS (WHATSAPP)
                </span>
                <span className="text-gray-300">
                  {memory?.profile.contacts
                    ? Object.keys(memory.profile.contacts).join(', ')
                    : 'Rahul, Priya'}
                </span>
              </div>
            </div>
          </div>

          {/* Exam Dates & Reminders */}
          <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" /> UPCOMING EXAMS
              </span>
              <span className="text-[10px] text-amber-500/80">Spoken Reminder</span>
            </div>

            <div className="space-y-2">
              {memory?.profile.examDates.map((ex, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded bg-amber-950/20 border border-amber-500/30"
                >
                  <span className="text-amber-200 font-semibold">{ex.subject}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    {ex.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Study Progress */}
          <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-400" /> STUDY PROGRESS &amp; TOPICS
              </span>
              <span className="text-[10px] text-cyan-500/80">Curriculum Link</span>
            </div>

            <div className="space-y-2">
              {memory?.study_progress.map((prog, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-gray-950/60 border border-gray-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sky-200 font-semibold">{prog.topic}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                        prog.status === 'reviewed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {prog.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px]">{prog.notes}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Tasks / Remembered Items */}
          <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" /> REMEMBERED TASKS &amp; NOTES
              </span>
              <span className="text-[10px] text-gray-500">"Yaad rakhna..."</span>
            </div>

            <div className="space-y-1.5">
              {memory?.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded bg-gray-950 border border-gray-800 text-xs"
                >
                  <span className="text-gray-200">{task.task}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-700 uppercase">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Note Add */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuickNote()}
                placeholder="Add fact or study note to remember..."
                className="flex-1 bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleAddQuickNote}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-black font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-gray-950">
          <span className="text-[11px] font-mono text-gray-500">
            Voice command: "Yaad rakhna..." or "Bhool jao..."
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-sky-500 text-black font-mono font-bold text-xs hover:bg-sky-400 transition-colors cursor-pointer"
          >
            CLOSE MEMORY
          </button>
        </div>
      </div>
    </div>
  );
};
