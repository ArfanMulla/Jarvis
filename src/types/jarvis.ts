export type LiveState = 'disconnected' | 'connecting' | 'listening' | 'speaking';

export interface UserMemory {
  profile: {
    name: string;
    preferredLanguage: string;
    favoriteArtists: string[];
    contacts: Record<string, string>;
    studySubjects: string[];
    examDates: Array<{ subject: string; date: string }>;
  };
  study_progress: Array<{
    topic: string;
    status: 'reviewed' | 'to_cover' | 'weak';
    notes: string;
  }>;
  conversation_summaries: Array<{
    date: string;
    summary: string;
  }>;
  tasks: Array<{
    id: string;
    task: string;
    status: 'pending' | 'active' | 'completed';
  }>;
}

export type HudCardType =
  | 'youtube'
  | 'search'
  | 'code'
  | 'whatsapp'
  | 'memory'
  | 'app'
  | 'screen_reader'
  | 'file_analyzer'
  | 'vscode'
  | 'notepad'
  | 'calculator'
  | 'news'
  | 'wikipedia';

export interface YouTubeCardData {
  query: string;
  title: string;
  videoId?: string;
  isPlaying: boolean;
}

export interface SearchCardData {
  query: string;
  summary: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  results?: Array<{ title: string; url: string; snippet: string }>;
}

export interface CodeCardData {
  language: string;
  code: string;
  output?: string;
  error?: string;
  executionTime?: number;
}

export interface WhatsAppCardData {
  contact: string;
  phone?: string;
  message: string;
  status: 'draft' | 'awaiting_confirmation' | 'sent' | 'cancelled';
  timestamp: string;
  allContacts?: Record<string, string>;
  searchQuery?: string;
}

export interface AppCardData {
  appName: string;
  icon?: string;
  action: string;
  timestamp: string;
  url?: string;
}

export interface ScreenReaderCardData {
  screenshotUrl?: string;
  summary: string;
  extractedText: string;
  detectedWindows?: string[];
  timestamp: string;
}

export interface UploadedFileContext {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  previewUrl?: string;
  extractedText: string;
  summary: string;
  timestamp: string;
}

export interface NewsCardData {
  source: string;
  headlines: string[];
  timestamp: string;
}

export interface WikipediaCardData {
  topic: string;
  title: string;
  summary: string;
  pageUrl?: string;
}

export interface HudCard {
  id: string;
  type: HudCardType;
  title: string;
  timestamp: string;
  data: any;
}
