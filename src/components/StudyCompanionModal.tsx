import React from 'react';
import {
  GraduationCap,
  X,
  Code,
  Brain,
  Layers,
  Sparkles,
  Calculator,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface StudyCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudyCompanionModal: React.FC<StudyCompanionModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const topics = [
    {
      category: 'Deep Learning & Neural Networks',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      items: [
        'Backpropagation & Chain Rule intuition',
        'Gradient Descent & Learning Rate tuning',
        'Convolutional Neural Networks (CNNs)',
        'Transformers & Multi-Head Self-Attention',
        'Loss Functions & Optimizers (Adam, SGD)',
      ],
      suggestedVoicePrompt: 'Jarvis, backpropagation simple real-life example se samjhao.',
    },
    {
      category: 'Artificial Intelligence & Machine Learning',
      icon: <Brain className="w-4 h-4 text-sky-400" />,
      items: [
        'Linear & Logistic Regression',
        'Decision Trees, Random Forests & SVM',
        'Clustering (K-Means, PCA Dimensionality)',
        'Overfitting, Bias-Variance Tradeoff & Regularization',
      ],
      suggestedVoicePrompt: 'Explain the bias-variance tradeoff and test me with a quick question.',
    },
    {
      category: 'LLMs & Modern GenAI',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      items: [
        'Tokenization & Word Embeddings',
        'Pretraining vs Supervised Fine-Tuning (SFT)',
        'Retrieval-Augmented Generation (RAG)',
        'Prompt Engineering & Autonomous Agents',
      ],
      suggestedVoicePrompt: 'RAG architecture kaise kaam karta hai step-by-step batao.',
    },
    {
      category: 'Programming & Data Structures',
      icon: <Code className="w-4 h-4 text-emerald-400" />,
      items: [
        'Python, C, C++ algorithms & syntax',
        'Binary Search, Trees, Graphs, Hash Maps',
        'Object-Oriented Programming (OOP) principles',
        'Live sandbox execution & debugging',
      ],
      suggestedVoicePrompt: 'Jarvis, Python mein QuickSort algorithm likh kar chala ke dikhao.',
    },
    {
      category: 'Mathematics & Science',
      icon: <Calculator className="w-4 h-4 text-purple-400" />,
      items: [
        'Calculus: Derivatives, Limits, Integrals',
        'Linear Algebra: Matrices, Eigenvalues, Vector Spaces',
        'Probability distributions & Bayes Theorem',
        'Physics & Chemistry derivations',
      ],
      suggestedVoicePrompt: 'Matrix multiplication ka geometric meaning kya hota hai?',
    },
  ];

  const exampleVoiceCommands = [
    {
      title: 'YouTube Music / Media',
      command: 'Jarvis, Arijit Singh ka Tum Hi Ho YouTube pe chalao.',
      desc: 'Searches & plays official video directly in your HUD player.',
    },
    {
      title: 'WhatsApp Message Draft & Voice Confirmation',
      command: 'Open WhatsApp, Rahul ki chat kholo aur "hello" likho.',
      desc: 'Stages draft, reads it back, and sends ONLY after you say "Haan" or "Send".',
    },
    {
      title: 'Study Tutor & Quiz Check',
      command: 'Gradient descent samjhao aur samajh check karne ke liye ek sawal poochho.',
      desc: 'Explains simply and tests your understanding with a follow-up question.',
    },
    {
      title: 'Persistent Memory & Exam Reminder',
      command: 'Yaad rakhna, mera Machine Learning ka exam 15 December ko hai.',
      desc: 'Stores in persistent memory file across sessions and reloads.',
    },
    {
      title: 'Recall Past Session',
      command: 'Pichli baar hum ne kya padha tha?',
      desc: 'Retrieves your past study topics and weak areas to resume seamlessly.',
    },
    {
      title: 'Live Web Intelligence',
      command: 'Search karo ki aaj AI field mein kya naya launch hua hai.',
      desc: 'Runs live web search, summarizes 3-5 points, and asks if you need more details.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-950 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-cyan-950/20">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono text-cyan-300 tracking-wider">
              J.A.R.V.I.S. STUDY TUTOR &amp; VOICE PROTOCOL GUIDE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm text-gray-300">
          {/* Rules Banner */}
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 text-xs font-mono text-cyan-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-cyan-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> J.A.R.V.I.S. VOICE RULES:
            </p>
            <p>&bull; Speaks in your exact language: Hindi, English, or Hinglish.</p>
            <p>&bull; Explains intuition first with real-life examples, then provides math/code.</p>
            <p>&bull; Code and math formulas appear directly on screen while JARVIS speaks the intuitive summary.</p>
          </div>

          {/* Section: Study Topics */}
          <div>
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
              Subjects &amp; Tutor Capabilities
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topics.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800/80 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center space-x-2 mb-2 font-mono font-bold text-xs text-sky-300">
                    {t.icon}
                    <span>{t.category}</span>
                  </div>
                  <ul className="text-xs text-gray-400 space-y-1 pl-4 list-disc mb-2">
                    {t.items.slice(0, 3).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-gray-800 text-[11px] font-mono text-cyan-400/90 italic">
                    Try: "{t.suggestedVoicePrompt}"
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Example Spoken Voice Commands */}
          <div>
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">
              Recommended Spoken Voice Commands
            </h4>
            <div className="space-y-2.5">
              {exampleVoiceCommands.map((ex, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/40 p-3 rounded-lg border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                      {ex.title}
                    </span>
                    <p className="font-mono text-xs text-sky-200 mt-0.5">
                      "{ex.command}"
                    </p>
                    <span className="text-[11px] text-gray-400">
                      {ex.desc}
                    </span>
                  </div>
                  <span className="self-start sm:self-center px-2 py-1 rounded bg-cyan-950/80 text-[10px] font-mono text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                    Voice Action
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-end bg-gray-950">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            DISMISS GUIDE
          </button>
        </div>
      </div>
    </div>
  );
};
