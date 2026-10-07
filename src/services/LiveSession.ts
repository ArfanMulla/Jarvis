import { AudioStreamer } from './AudioStreamer';
import { LiveState, HudCard } from '../types/jarvis';

export interface LiveSessionCallbacks {
  onStateChange: (state: LiveState) => void;
  onTranscript: (speaker: 'user' | 'jarvis', text: string) => void;
  onToolCall: (card: HudCard) => void;
  onToolUpdate: (cardId: string, updates: Partial<HudCard>) => void;
  onError: (error: string) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  public audioStreamer: AudioStreamer;
  private state: LiveState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private speakingTimeout: any = null;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
    this.audioStreamer = new AudioStreamer();
  }

  private setState(newState: LiveState) {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  getState(): LiveState {
    return this.state;
  }

  async connect(): Promise<void> {
    if (this.state !== 'disconnected') return;

    this.setState('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        try {
          // Initialize mic stream & audio context
          await this.audioStreamer.startRecording((base64Audio) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(
                JSON.stringify({
                  type: 'audio',
                  audio: base64Audio,
                })
              );
            }
          });

          this.setState('listening');
        } catch (micErr: any) {
          console.error('Microphone error:', micErr);
          this.callbacks.onError(
            'Microphone access denied. Please allow microphone permissions to speak with JARVIS.'
          );
          this.disconnect();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (parseErr) {
          console.error('Failed to parse WebSocket message:', parseErr);
        }
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        this.callbacks.onError('Neural link connection interrupted.');
      };

      this.ws.onclose = () => {
        this.disconnect();
      };
    } catch (err: any) {
      console.error('Connection failed:', err);
      this.callbacks.onError(err.message || 'Failed to initialize JARVIS session.');
      this.disconnect();
    }
  }

  private handleServerMessage(msg: any): void {
    switch (msg.type) {
      case 'audio':
        if (msg.audio) {
          this.setState('speaking');
          this.audioStreamer.playChunk(msg.audio);

          // Clear previous turn timeout and set speaking debounce
          if (this.speakingTimeout) clearTimeout(this.speakingTimeout);
          this.speakingTimeout = setTimeout(() => {
            if (this.state === 'speaking') {
              this.setState('listening');
            }
          }, 1200);
        }
        break;

      case 'interrupted':
        this.audioStreamer.stopPlayback();
        this.setState('listening');
        break;

      case 'turn_complete':
        if (this.state === 'speaking') {
          this.setState('listening');
        }
        break;

      case 'input_transcription':
        if (msg.text) {
          this.callbacks.onTranscript('user', msg.text);
        }
        break;

      case 'output_transcription':
        if (msg.text) {
          this.callbacks.onTranscript('jarvis', msg.text);
        }
        break;

      case 'tool_call':
        if (msg.card) {
          this.callbacks.onToolCall(msg.card);
        }
        break;

      case 'tool_update':
        if (msg.cardId && msg.updates) {
          this.callbacks.onToolUpdate(msg.cardId, msg.updates);
        }
        break;

      case 'error':
        if (msg.error) {
          this.callbacks.onError(msg.error);
        }
        break;

      default:
        break;
    }
  }

  interrupt(): void {
    this.audioStreamer.stopPlayback();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'interrupt' }));
    }
    this.setState('listening');
  }

  sendMediaControl(action: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'media_control', action }));
    }
  }

  disconnect(): void {
    if (this.speakingTimeout) clearTimeout(this.speakingTimeout);
    this.audioStreamer.dispose();

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }

    this.setState('disconnected');
  }
}
