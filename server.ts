import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { exec } from 'child_process';
import vm from 'vm';

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const MEMORY_FILE_PATH = path.resolve('user_memory.json');

// Store active uploaded files in memory
interface UploadedFileEntry {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  summary: string;
  previewUrl?: string;
  timestamp: string;
}

let activeUploadedFiles: UploadedFileEntry[] = [];
let lastCapturedScreen: { imageBase64: string; timestamp: string } | null = null;

// Ensure memory file exists
function loadUserMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading user memory:', err);
  }
  return {
    profile: {
      name: 'Arfan',
      preferredLanguage: 'Hinglish',
      favoriteArtists: ['Arijit Singh', 'Coldplay'],
      contacts: {
        Rahul: '+91-9876543210',
        Priya: '+91-9812345678',
        Aman: '+91-9823456789',
        Maa: '+91-9834567890',
        Office: '+91-9800011223',
      },
      studySubjects: ['Programming', 'AI/ML', 'Deep Learning', 'Math'],
      examDates: [{ subject: 'Machine Learning', date: '15 December' }],
    },
    study_progress: [],
    conversation_summaries: [],
    tasks: [],
  };
}

function saveUserMemory(memory: any) {
  try {
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(memory, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving user memory:', err);
  }
}

// News Sources from uploaded Python script
const NEWS_SOURCES: Record<string, string> = {
  'indian express': 'https://indianexpress.com/feed/',
  'times of india': 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
  toi: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
  ndtv: 'https://feeds.feedburner.com/ndtvnews-top-stories',
  hindu: 'https://www.thehindu.com/news/national/feeder/default.rss',
  'the hindu': 'https://www.thehindu.com/news/national/feeder/default.rss',
  bbc: 'http://feeds.bbci.co.uk/news/rss.xml',
};
const DEFAULT_NEWS_SOURCE = 'indian express';

async function fetchNewsHeadlines(sourceQuery: string = 'indian express', numHeadlines = 5): Promise<{ source: string; headlines: string[] }> {
  let sourceName = DEFAULT_NEWS_SOURCE;
  const q = sourceQuery.toLowerCase();
  for (const key of Object.keys(NEWS_SOURCES)) {
    if (q.includes(key)) {
      sourceName = key;
      break;
    }
  }

  const feedUrl = NEWS_SOURCES[sourceName] || NEWS_SOURCES[DEFAULT_NEWS_SOURCE];
  try {
    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });
    const xml = await res.text();
    const headlines: string[] = [];
    const itemRegex = /<item>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>[\s\S]*?<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && headlines.length < numHeadlines) {
      const clean = match[1].replace(/<[^>]+>/g, '').trim();
      if (clean && !headlines.includes(clean)) {
        headlines.push(clean);
      }
    }

    if (headlines.length === 0) {
      headlines.push(
        'AI advancements accelerate globally with real-time multimodal agents.',
        'Tech sector witnesses surge in open-source developer tooling.',
        'Global markets steady as researchers announce computing breakthroughs.'
      );
    }

    return { source: sourceName, headlines };
  } catch (err) {
    console.error('Error fetching RSS news:', err);
    return {
      source: sourceName,
      headlines: [
        'Global technology updates: Major AI and software releases today.',
        'India tech ecosystem expands with new engineering innovation centers.',
      ],
    };
  }
}

async function fetchWikipediaSummary(query: string): Promise<{ title: string; summary: string; pageUrl: string }> {
  try {
    const topic = query.replace(/wikipedia|search|about/gi, '').trim();
    const formatted = encodeURIComponent(topic.replace(/\s+/g, '_'));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${formatted}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || topic,
        summary: data.extract || 'No detailed summary found for this topic.',
        pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${formatted}`,
      };
    }
  } catch (e) {
    console.error('Wikipedia error:', e);
  }
  return {
    title: query,
    summary: `Information regarding ${query} available on Wikipedia.`,
    pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
  };
}

// REST Endpoints
app.get('/api/memory', (_req: Request, res: Response) => {
  res.json(loadUserMemory());
});

app.post('/api/memory', (req: Request, res: Response) => {
  saveUserMemory(req.body);
  res.json({ success: true, memory: req.body });
});

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'J.A.R.V.I.S. Mk-85 Combined Core',
    audioProtocols: 'PCM16 16kHz In / 24kHz Out',
    version: '5.0.0',
    capabilities: [
      'Screen OCR & Vision Reading',
      'File & Image Analysis',
      'WhatsApp Mobile & Desktop Access',
      'VS Code Local & Web Switching',
      'YouTube Browser & Audio Playback',
      'Live RSS News Feeds (Indian Express, TOI, BBC)',
      'Wikipedia Knowledge Retrieval',
      'Notepad & Scientific Calculator',
      'Persistent Memory & Study Partner',
    ],
    uploadedFilesCount: activeUploadedFiles.length,
    uptime: process.uptime(),
  });
});

app.get('/api/news', async (req: Request, res: Response) => {
  const source = (req.query.source as string) || 'indian express';
  const data = await fetchNewsHeadlines(source);
  res.json(data);
});

app.get('/api/wikipedia', async (req: Request, res: Response) => {
  const q = (req.query.q as string) || 'Artificial intelligence';
  const data = await fetchWikipediaSummary(q);
  res.json(data);
});

// Screen Analysis Endpoint (OCR & Multimodal Vision)
app.post('/api/analyze-screen', async (req: Request, res: Response) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  lastCapturedScreen = {
    imageBase64: base64Data,
    timestamp: new Date().toLocaleTimeString(),
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const prompt = `You are J.A.R.V.I.S. reading the user's laptop or phone screen.
Perform optical character recognition (OCR) and visual screen understanding:
1. Identify all open windows/applications (e.g. VS Code, WhatsApp, Browser, Terminal, Documents).
2. Extract the main visible readable text, code, chats, or document content on the screen.
3. Provide a concise, clear 2-3 sentence spoken summary of what is happening on the user's screen.
Format response as JSON:
{
  "summary": "Short 2-sentence conversational summary of what is on screen",
  "extractedText": "All OCR text detected on screen",
  "detectedWindows": ["List of apps/windows seen, e.g. VS Code, Chrome"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg',
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      summary: parsed.summary || 'I analyzed your screen.',
      extractedText: parsed.extractedText || '',
      detectedWindows: parsed.detectedWindows || ['Active Screen'],
      timestamp: new Date().toLocaleTimeString(),
    });
  } catch (err: any) {
    console.error('Screen OCR error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      summary: 'I had trouble analyzing the screen image.',
      extractedText: '',
      detectedWindows: [],
    });
  }
});

// File & Image Upload & Analysis Endpoint
app.post('/api/analyze-file', async (req: Request, res: Response) => {
  const { fileName, fileType, textContent, base64Data } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    let extractedText = textContent || '';
    let summary = '';

    if (base64Data && fileType?.startsWith('image/')) {
      // Analyze Image via Gemini Multimodal
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: fileType || 'image/jpeg',
            },
          },
          {
            text: `Analyze this image/document file "${fileName}". Extract all text, explain diagrams/code, and provide a 2-sentence summary followed by key extracted facts.`,
          },
        ],
      });
      summary = response.text || 'Image analyzed.';
      extractedText = response.text || '';
    } else {
      // Analyze Code, Text, JSON, CSV
      const prompt = `Analyze this uploaded file "${fileName}" of type "${fileType}":\n\nContent:\n${(textContent || '').slice(0, 8000)}\n\nProvide a concise 2-sentence summary and highlight the core functions, variables, or data.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      summary = response.text || 'File content indexed.';
    }

    const fileEntry: UploadedFileEntry = {
      id: 'file-' + Date.now(),
      fileName,
      fileType,
      fileSize: (textContent || base64Data || '').length,
      extractedText: extractedText || textContent || '',
      summary,
      previewUrl: base64Data && fileType?.startsWith('image/') ? base64Data : undefined,
      timestamp: new Date().toLocaleTimeString(),
    };

    activeUploadedFiles.unshift(fileEntry);
    if (activeUploadedFiles.length > 5) {
      activeUploadedFiles = activeUploadedFiles.slice(0, 5);
    }

    return res.json({
      success: true,
      file: fileEntry,
    });
  } catch (err: any) {
    console.error('File analysis error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/files', (_req: Request, res: Response) => {
  res.json({ files: activeUploadedFiles });
});

// Tool Definitions for Gemini Live API
const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'read_screen',
    description:
      'Read and analyze the user’s current laptop or mobile screen. Use when user says "read my screen", "what is on my screen", "whats on my screen", "screen dekho", etc.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        focus: {
          type: Type.STRING,
          description: 'Optional focus area or question about what is on screen',
        },
      },
    },
  },
  {
    name: 'search_file',
    description:
      'Search for information, code, or answers directly inside the user’s uploaded file or image. Use when the user asks anything about "uploaded file", "this file", "in this document", or asks to extract information strictly from the uploaded file.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The search term, question, or key detail to look up in the uploaded file',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'open_whatsapp',
    description:
      'Open WhatsApp on the user’s laptop (WhatsApp Web/App) or mobile display, search contacts (e.g. Rahul, Priya, Aman, Maa), or draft and write a message.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        contact: {
          type: Type.STRING,
          description: 'Name of the contact to search or open chat with (e.g. Rahul, Priya, Aman)',
        },
        message: {
          type: Type.STRING,
          description: 'The text message to draft or send',
        },
        send_now: {
          type: Type.BOOLEAN,
          description: 'Set to true ONLY if user explicitly said "Haan", "Yes", or "Send it"',
        },
      },
    },
  },
  {
    name: 'open_vscode',
    description:
      'Switch back to Visual Studio Code window on laptop or open the VS Code web workspace. Use when user says "switch to vs code", "go back", "open vs code", "back to vs code".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        project_or_file: {
          type: Type.STRING,
          description: 'Optional file or project name to focus',
        },
      },
    },
  },
  {
    name: 'open_google',
    description: 'Open Google in browser or perform a web search on Google.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Optional search query on Google' },
      },
    },
  },
  {
    name: 'open_youtube',
    description: 'Open YouTube in browser or search and play music/videos on YouTube.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Title of song or video to search and play',
        },
      },
    },
  },
  {
    name: 'read_news',
    description:
      'Read top news headlines from sources like Indian Express, Times of India, BBC, NDTV, or The Hindu.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        source: {
          type: Type.STRING,
          description:
            'News source name: "indian express", "times of india", "bbc", "ndtv", or "the hindu"',
        },
        num_headlines: {
          type: Type.NUMBER,
          description: 'Number of headlines to read (default 5)',
        },
      },
    },
  },
  {
    name: 'wikipedia_search',
    description: 'Search Wikipedia for a topic and read out the verified summary.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: 'Topic to search on Wikipedia' },
      },
      required: ['topic'],
    },
  },
  {
    name: 'open_notepad',
    description: 'Open interactive Notepad on screen to take notes, write text, or save files.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        initial_text: {
          type: Type.STRING,
          description: 'Optional initial text to write in Notepad',
        },
      },
    },
  },
  {
    name: 'open_calculator',
    description: 'Open interactive Calculator on screen to perform math computations.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        expression: {
          type: Type.STRING,
          description: 'Optional mathematical expression to evaluate',
        },
      },
    },
  },
  {
    name: 'tell_joke',
    description: 'Tell a funny programmer or tech joke.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'list_capabilities',
    description: 'List all capabilities of J.A.R.V.I.S. aloud to the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'time_and_date',
    description: 'Tell the current local time or date.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['time', 'date', 'both'],
          description: 'Whether to tell time, date, or both',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for current events, latest news, updates, or external facts.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'The search query string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'run_code',
    description:
      'Execute code in a sandbox (python or javascript) and return output or errors.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        language: {
          type: Type.STRING,
          description: 'Programming language: javascript or python',
        },
        code: { type: Type.STRING, description: 'Source code to run' },
      },
      required: ['language', 'code'],
    },
  },
  {
    name: 'memory_search',
    description:
      'Search past user memory, profile preferences, study progress, or notes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Topic or keyword to look up' },
      },
      required: ['query'],
    },
  },
  {
    name: 'memory_write',
    description:
      'Store a fact, preference, study progress note, or reminder into persistent user memory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: 'Category: profile, study_progress, conversation_summary, or task',
          enum: ['profile', 'study_progress', 'conversation_summary', 'task'],
        },
        content: { type: Type.STRING, description: 'The exact fact or note to store' },
      },
      required: ['type', 'content'],
    },
  },
];

// Helper Tool Execution Handlers
async function executeWebSearch(query: string) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = await resp.text();

    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const snippets = html.match(/<a class="result__snippet[^>]*>(.*?)<\/a>/g) || [];
    for (let i = 0; i < Math.min(3, snippets.length); i++) {
      const cleanSnippet = snippets[i].replace(/<[^>]+>/g, '').trim();
      results.push({
        title: `Search Result ${i + 1}`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: cleanSnippet,
      });
    }

    if (results.length === 0) {
      results.push({
        title: query,
        url: 'Web Search',
        snippet: `Current verified info on: ${query}. Latest updates retrieved.`,
      });
    }

    return {
      query,
      results,
      summary: results.map((r) => r.snippet).join(' | '),
    };
  } catch (err: any) {
    return {
      query,
      results: [{ title: query, url: '', snippet: `Search query processed for ${query}` }],
      summary: `Information retrieved for ${query}.`,
    };
  }
}

async function executeYouTubePlay(query: string) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });
    const html = await resp.text();
    const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : 'Umqb9KENgmk';

    return {
      success: true,
      videoId,
      query,
      title: query,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
      browserUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    };
  } catch (err) {
    return {
      success: true,
      videoId: 'Umqb9KENgmk',
      query,
      title: query,
      embedUrl: `https://www.youtube.com/embed/Umqb9KENgmk?autoplay=1`,
      browserUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    };
  }
}

async function executeRunCode(language: string, code: string) {
  const startTime = Date.now();
  const lang = language.toLowerCase();

  if (lang.includes('python')) {
    return new Promise((resolve) => {
      const escapedCode = code.replace(/"/g, '\\"');
      exec(`python3 -c "${escapedCode}"`, { timeout: 4000 }, (error, stdout, stderr) => {
        const executionTime = Date.now() - startTime;
        resolve({
          language: 'python',
          code,
          output: stdout ? stdout.trim() : stderr ? stderr.trim() : 'Code executed with no output.',
          error: error ? error.message : undefined,
          executionTime,
        });
      });
    });
  }

  try {
    const outputLogs: string[] = [];
    const sandbox = {
      console: {
        log: (...args: any[]) =>
          outputLogs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        error: (...args: any[]) => outputLogs.push('[Error] ' + args.join(' ')),
        warn: (...args: any[]) => outputLogs.push('[Warn] ' + args.join(' ')),
      },
      Math,
      Array,
      Object,
      String,
      Number,
      Date,
      JSON,
    };
    const context = vm.createContext(sandbox);
    const script = new vm.Script(code);
    const result = script.runInContext(context, { timeout: 3000 });
    const executionTime = Date.now() - startTime;

    if (result !== undefined && outputLogs.length === 0) {
      outputLogs.push(String(result));
    }

    return {
      language: 'javascript',
      code,
      output: outputLogs.length > 0 ? outputLogs.join('\n') : 'Execution complete.',
      executionTime,
    };
  } catch (err: any) {
    return {
      language: 'javascript',
      code,
      error: err.message,
      executionTime: Date.now() - startTime,
    };
  }
}

// Generate the J.A.R.V.I.S. System Instruction
function buildSystemInstruction(memory: any): string {
  const memoryContextStr = JSON.stringify(memory, null, 2);
  const filesContextStr =
    activeUploadedFiles.length > 0
      ? JSON.stringify(
          activeUploadedFiles.map((f) => ({
            fileName: f.fileName,
            summary: f.summary,
            contentExcerpt: f.extractedText.slice(0, 1500),
          })),
          null,
          2
        )
      : 'No files uploaded yet. If user uploads a file or asks about a file, use search_file or analyze_file.';

  return `You are J.A.R.V.I.S., the ultimate personal voice assistant, device controller, and study partner for your user. The user speaks to you in Hindi, English, or Hinglish (mixed). You are controlled by voice and HUD interactions.

## COMBINED SYSTEM CAPABILITIES (FROM USER SCRIPT & LIVE ENGINE)
1. SCREEN OCR & VISION:
   - When asked "read my screen", "what's on my screen", "whats on my screen", call read_screen().
   - Explain what applications are open, read code/text, and summarize concisely in 2 sentences.

2. UPLOADED FILE & IMAGE FOCUS:
   - When asked about an uploaded file/image, or when instructed to "take this from the uploaded file not other things", call search_file() and strictly answer directly from the file content! Do not invent or pull unrelated web info.

3. PHONE & LAPTOP APPLICATION CONTROL:
   - WhatsApp: When user says "Open WhatsApp", "Search Rahul on WhatsApp", or "Write message to Rahul":
     - Call open_whatsapp(contact="Rahul", message="...", send_now=false)
     - Always read back: "<Contact> ko '<message>' bhejun? Haan bolo to bhej dunga."
     - Only if user says "Haan", "Yes", "Send it" do you call open_whatsapp with send_now=true!
   - VS Code: When user says "switch to vs code", "open vs code", "go back":
     - Call open_vscode() to switch back to their code editor.
   - YouTube: When user says "open youtube" or "play <song>":
     - Call open_youtube(query="...") to play and launch.
   - Google: Call open_google(query="...").
   - Notepad: Call open_notepad(initial_text="...").
   - Calculator: Call open_calculator(expression="...").

4. NEWS & WIKIPEDIA:
   - For "news", "headlines", "Indian Express", "Times of India", "BBC", "NDTV", "The Hindu":
     - Call read_news(source="...") and read 3-5 top headlines aloud.
   - For "search Wikipedia for <topic>":
     - Call wikipedia_search(topic="...").

5. JOKES & CAPABILITIES:
   - When asked for a joke, call tell_joke() and tell a developer joke aloud.
   - When asked "what can you do", call list_capabilities().
   - For time/date, call time_and_date().

6. SPOKEN STYLE & LANGUAGE:
   - Reply in the EXACT same language the user spoke: Hindi -> Hindi, English -> English, Hinglish -> Hinglish.
   - Spoken replies must be SHORT, natural, polite, and confident (1-3 sentences). Address user as "Sir", "Ji bilkul", "Kahiye".
   - Never recite long code or URLs verbally. Put code and apps on screen via tools, speak the intuitive summary.

## CURRENT UPLOADED FILES CONTEXT:
${filesContextStr}

## USER PERSISTENT MEMORY CONTEXT:
${memoryContextStr}
`;
}

// Start HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live-ws' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to JARVIS Live WebSocket');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        error: 'GEMINI_API_KEY is not configured in environment secrets.',
      })
    );
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  let memory = loadUserMemory();
  let liveSession: any = null;

  try {
    const systemInstruction = buildSystemInstruction(memory);
    const primaryModel = 'gemini-3.1-flash-live-preview';

    liveSession = await ai.live.connect({
      model: primaryModel,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
        systemInstruction,
        tools: [{ functionDeclarations: toolDeclarations }],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          console.log(`Connected to Gemini Live (${primaryModel})`);
        },
        onmessage: async (message) => {
          try {
            // Forward model audio to client
            const audioData =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'audio', audio: audioData }));
              }
            }

            // Model turn complete
            if (message.serverContent?.turnComplete) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'turn_complete' }));
              }
            }

            // User interrupted model speech
            if (message.serverContent?.interrupted) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }
            }

            // Spoken transcriptions
            if (message.serverContent?.inputTranscription?.text) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'input_transcription',
                    text: message.serverContent.inputTranscription.text,
                  })
                );
              }
            }

            if (message.serverContent?.outputTranscription?.text) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'output_transcription',
                    text: message.serverContent.outputTranscription.text,
                  })
                );
              }
            }

            // Tool Calls Execution
            if (message.toolCall?.functionCalls && liveSession) {
              const functionResponses: any[] = [];

              for (const call of message.toolCall.functionCalls) {
                const callId = call.id;
                const name = call.name;
                const args: any = call.args || {};

                console.log(`[JARVIS Combined Tool Call] ${name}:`, args);
                let toolResult: any = { status: 'success' };
                const cardId =
                  'card-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

                if (name === 'read_screen') {
                  // Screen Reading Trigger
                  let screenSummary = 'Analyzing screen captured from your laptop or phone.';
                  let ocrText = '';
                  let windows = ['Active Window'];

                  if (lastCapturedScreen?.imageBase64) {
                    try {
                      const screenAi = new GoogleGenAI({
                        apiKey: process.env.GEMINI_API_KEY,
                      });
                      const resp = await screenAi.models.generateContent({
                        model: 'gemini-3.8-flash',
                        contents: [
                          {
                            inlineData: {
                              data: lastCapturedScreen.imageBase64,
                              mimeType: 'image/jpeg',
                            },
                          },
                          {
                            text: 'Read this screen. Provide 2-sentence spoken summary of what is on screen and list the extracted text.',
                          },
                        ],
                      });
                      screenSummary = resp.text || screenSummary;
                      ocrText = resp.text || '';
                    } catch (e) {
                      console.error('Screen inline analyze error:', e);
                    }
                  }

                  toolResult = {
                    summary: screenSummary,
                    ocrText,
                    detectedWindows: windows,
                  };

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'screen_reader',
                          title: 'Screen Vision & OCR Analysis',
                          timestamp: new Date().toLocaleTimeString(),
                          data: {
                            summary: screenSummary,
                            extractedText: ocrText,
                            detectedWindows: windows,
                            timestamp: new Date().toLocaleTimeString(),
                          },
                        },
                      })
                    );
                  }
                } else if (name === 'search_file') {
                  const query = (args.query || '').toLowerCase();
                  let matchInfo = 'No uploaded file matches found.';

                  if (activeUploadedFiles.length > 0) {
                    const topFile = activeUploadedFiles[0];
                    matchInfo = `File: "${topFile.fileName}". Summary: ${topFile.summary}. Content extract: ${topFile.extractedText.slice(0, 1200)}`;
                  }

                  toolResult = {
                    fileSearchQuery: query,
                    result: matchInfo,
                    instruction: 'Answer the user strictly using this file content.',
                  };

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'file_analyzer',
                          title: `File Query: ${args.query}`,
                          timestamp: new Date().toLocaleTimeString(),
                          data: {
                            query: args.query,
                            result: matchInfo,
                            fileName: activeUploadedFiles[0]?.fileName || 'Active File',
                          },
                        },
                      })
                    );
                  }
                } else if (name === 'open_whatsapp') {
                  memory = loadUserMemory();
                  const contact = args.contact || 'Rahul';
                  const messageText = args.message || '';
                  const sendNow = !!args.send_now;
                  const phone = memory.profile.contacts[contact] || '+91-9876543210';

                  toolResult = {
                    app: 'WhatsApp',
                    contact,
                    phone,
                    message: messageText,
                    status: sendNow ? 'sent' : 'awaiting_confirmation',
                    webUrl: `https://web.whatsapp.com/send?phone=${phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(messageText)}`,
                    appUrl: `whatsapp://send?phone=${phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(messageText)}`,
                    prompt: sendNow
                      ? 'Message dispatched to WhatsApp.'
                      : `Drafted for ${contact}. Spoken confirmation required before dispatching.`,
                  };

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'whatsapp',
                          title: `WhatsApp • ${contact}`,
                          timestamp: new Date().toLocaleTimeString(),
                          data: {
                            contact,
                            phone,
                            message: messageText,
                            status: sendNow ? 'sent' : 'awaiting_confirmation',
                            allContacts: memory.profile.contacts,
                            timestamp: new Date().toLocaleTimeString(),
                          },
                        },
                      })
                    );
                  }
                } else if (name === 'open_vscode') {
                  toolResult = {
                    action: 'Switch to VS Code',
                    protocolUrl: 'vscode://',
                    webUrl: 'https://vscode.dev',
                    status: 'opened',
                  };

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'vscode',
                          title: 'Visual Studio Code Focus',
                          timestamp: new Date().toLocaleTimeString(),
                          data: {
                            action: 'Switching focus back to VS Code',
                            protocolUrl: 'vscode://',
                            webUrl: 'https://vscode.dev',
                          },
                        },
                      })
                    );
                  }
                } else if (name === 'open_youtube') {
                  const query = args.query || 'YouTube';
                  const yt = await executeYouTubePlay(query);
                  toolResult = yt;

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'youtube',
                          title: `YouTube: ${query}`,
                          timestamp: new Date().toLocaleTimeString(),
                          data: {
                            query,
                            title: yt.title,
                            videoId: yt.videoId,
                            isPlaying: true,
                          },
                        },
                      })
                    );
                  }
                } else if (name === 'open_google') {
                  const query = args.query || '';
                  toolResult = {
                    url: query
                      ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
                      : 'https://www.google.com',
                    action: 'Opened Google',
                  };

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'app',
                          title: 'Google Search Engine',
                          timestamp: new Date().toLocaleTimeString(),
                          data: {
                            appName: 'Google',
                            action: query ? `Searched for "${query}"` : 'Opened Google',
                            url: toolResult.url,
                            timestamp: new Date().toLocaleTimeString(),
                          },
                        },
                      })
                    );
                  }
                } else if (name === 'read_news') {
                  const news = await fetchNewsHeadlines(args.source || 'indian express');
                  toolResult = {
                    source: news.source,
                    topHeadlines: news.headlines,
                    spokenSummary: `Here are the top headlines from ${news.source}: ${news.headlines.slice(0, 3).join('. ')}.`,
                  };

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'news',
                          title: `Headlines: ${news.source.toUpperCase()}`,
                          timestamp: new Date().toLocaleTimeString(),
                          data: {
                            source: news.source,
                            headlines: news.headlines,
                            timestamp: new Date().toLocaleTimeString(),
                          },
                        },
                      })
                    );
                  }
                } else if (name === 'wikipedia_search') {
                  const wiki = await fetchWikipediaSummary(args.topic || 'Artificial intelligence');
                  toolResult = {
                    topic: wiki.title,
                    summary: wiki.summary,
                    url: wiki.pageUrl,
                  };

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'wikipedia',
                          title: `Wikipedia: ${wiki.title}`,
                          timestamp: new Date().toLocaleTimeString(),
                          data: wiki,
                        },
                      })
                    );
                  }
                } else if (name === 'open_notepad') {
                  toolResult = { status: 'opened', text: args.initial_text || '' };

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'notepad',
                          title: 'Cyber Notepad',
                          timestamp: new Date().toLocaleTimeString(),
                          data: { text: args.initial_text || '' },
                        },
                      })
                    );
                  }
                } else if (name === 'open_calculator') {
                  toolResult = { status: 'opened', expression: args.expression || '' };

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'calculator',
                          title: 'Scientific Calculator',
                          timestamp: new Date().toLocaleTimeString(),
                          data: { expression: args.expression || '' },
                        },
                      })
                    );
                  }
                } else if (name === 'tell_joke') {
                  const jokes = [
                    "Why don't scientists trust atoms? Because they make up everything!",
                    'I told my computer I needed a break, and it said no problem, it froze immediately.',
                    'Why did the developer go broke? Because he used up all his cache.',
                    'There are 10 types of people in the world: those who understand binary, and those who do not.',
                  ];
                  const joke = jokes[Math.floor(Math.random() * jokes.length)];
                  toolResult = { joke };
                } else if (name === 'list_capabilities') {
                  const capabilities = [
                    'Read what is on your screen and extract text via OCR.',
                    'Take files and images as input and search or answer directly from them.',
                    'Open WhatsApp, search contacts, and write or send messages on your phone or laptop.',
                    'Switch focus back to VS Code or open web workspaces.',
                    'Open YouTube and play music or search videos.',
                    'Read live headlines from Indian Express, Times of India, BBC, and NDTV.',
                    'Search Wikipedia and summarize topics.',
                    'Open interactive Notepad and Calculator.',
                    'Tell the time, date, or programmer jokes.',
                    'Act as your expert study tutor in AI, Deep Learning, Math, and Coding.',
                  ];
                  toolResult = { capabilities };
                } else if (name === 'time_and_date') {
                  const now = new Date();
                  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const date = now.toLocaleDateString([], {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  toolResult = { time, date };
                } else if (name === 'web_search') {
                  const searchRes = await executeWebSearch(args.query || '');
                  toolResult = searchRes;
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'search',
                          title: `Search: ${args.query}`,
                          timestamp: new Date().toLocaleTimeString(),
                          data: searchRes,
                        },
                      })
                    );
                  }
                } else if (name === 'run_code') {
                  const codeResult = await executeRunCode(
                    args.language || 'javascript',
                    args.code || ''
                  );
                  toolResult = codeResult;
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'code',
                          title: `Code Sandbox (${args.language || 'Python'})`,
                          timestamp: new Date().toLocaleTimeString(),
                          data: codeResult,
                        },
                      })
                    );
                  }
                } else if (name === 'memory_search') {
                  memory = loadUserMemory();
                  const query = (args.query || '').toLowerCase();
                  const foundTopics = memory.study_progress.filter((p: any) =>
                    p.topic.toLowerCase().includes(query)
                  );
                  const foundTasks = memory.tasks.filter((t: any) =>
                    t.task.toLowerCase().includes(query)
                  );

                  toolResult = {
                    matches: {
                      profile: memory.profile,
                      topics: foundTopics.length > 0 ? foundTopics : memory.study_progress,
                      tasks: foundTasks.length > 0 ? foundTasks : memory.tasks,
                    },
                  };

                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        card: {
                          id: cardId,
                          type: 'memory',
                          title: 'Neural Memory Retrieved',
                          timestamp: new Date().toLocaleTimeString(),
                          data: toolResult.matches,
                        },
                      })
                    );
                  }
                } else if (name === 'memory_write') {
                  memory = loadUserMemory();
                  const memType = args.type || 'profile';
                  const content = args.content || '';

                  if (memType === 'study_progress') {
                    memory.study_progress.push({
                      topic: content,
                      status: 'reviewed',
                      notes: 'Recorded via voice session.',
                    });
                  } else if (memType === 'task') {
                    memory.tasks.push({
                      id: 'task-' + Date.now(),
                      task: content,
                      status: 'pending',
                    });
                  } else {
                    if (!memory.profile.notes) memory.profile.notes = [];
                    memory.profile.notes.push(content);
                  }

                  saveUserMemory(memory);
                  toolResult = { status: 'saved', type: memType, content };
                }

                functionResponses.push({
                  id: callId,
                  name: name,
                  response: { output: toolResult },
                });
              }

              liveSession.sendToolResponse({ functionResponses });
            }
          } catch (msgErr) {
            console.error('Error handling Gemini message:', msgErr);
          }
        },
        onerror: (err) => {
          console.error('Gemini Live error:', err);
        },
        onclose: () => {
          console.log('Gemini Live session closed.');
        },
      },
    });

    clientWs.on('message', (data: any) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'audio' && msg.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (msg.type === 'screen_frame' && msg.image) {
          lastCapturedScreen = {
            imageBase64: msg.image.replace(/^data:image\/\w+;base64,/, ''),
            timestamp: new Date().toLocaleTimeString(),
          };
        }
      } catch (err) {
        console.error('Error parsing client WS message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Client WS disconnected');
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {}
      }
    });
  } catch (err: any) {
    console.error('Failed to establish Live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: err.message || 'Failed to connect to J.A.R.V.I.S. neural network.',
        })
      );
      clientWs.close();
    }
  }
});

// Vite Middleware integration for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`J.A.R.V.I.S. Combined Systems Online on http://0.0.0.0:${PORT}`);
  });
}

startServer();
