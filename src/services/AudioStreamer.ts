/**
 * AudioStreamer handles:
 * 1. 16kHz microphone capture (PCM16 Little-Endian base64) for streaming to Gemini Live API
 * 2. 24kHz audio playback (PCM16 Little-Endian base64) with gapless scheduling
 * 3. Instant playback interruption handling
 * 4. Real-time AnalyserNodes for futuristic HUD audio visualizers
 */

export class AudioStreamer {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;

  public inputAnalyser: AnalyserNode | null = null;
  public outputAnalyser: AnalyserNode | null = null;

  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isRecording: boolean = false;
  private onAudioChunkCallback: ((base64Pcm: string) => void) | null = null;
  private onVolumeChangeCallback: ((micVol: number, outVol: number) => void) | null = null;

  constructor() {}

  /**
   * Initializes input recording at 16kHz
   */
  async startRecording(onChunk: (base64Pcm: string) => void): Promise<void> {
    this.onAudioChunkCallback = onChunk;

    // Check mic permission and get media stream
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    // Create 16kHz input context for Live API compatibility
    this.inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
    if (this.inputAudioCtx.state === 'suspended') {
      await this.inputAudioCtx.resume();
    }

    this.inputSource = this.inputAudioCtx.createMediaStreamSource(this.micStream);

    // Setup input analyser for mic visualization
    this.inputAnalyser = this.inputAudioCtx.createAnalyser();
    this.inputAnalyser.fftSize = 256;
    this.inputAnalyser.smoothingTimeConstant = 0.5;
    this.inputSource.connect(this.inputAnalyser);

    // Use ScriptProcessorNode to capture PCM samples
    const bufferSize = 4096;
    this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(
      bufferSize,
      1,
      1
    );

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);

      // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
      const int16Array = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Convert to Base64
      const base64 = this.arrayBufferToBase64(int16Array.buffer);
      if (this.onAudioChunkCallback && base64) {
        this.onAudioChunkCallback(base64);
      }
    };

    this.inputSource.connect(this.scriptProcessor);
    // Connect to destination to keep ScriptProcessor running (silent output)
    this.scriptProcessor.connect(this.inputAudioCtx.destination);
    this.isRecording = true;

    // Ensure output context is ready
    this.initOutputContext();
  }

  /**
   * Initializes 24kHz output context for Gemini Live playback
   */
  private initOutputContext(): void {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioCtx = new AudioContextClass({ sampleRate: 24000 });
      this.outputAnalyser = this.outputAudioCtx.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.6;
      this.outputAnalyser.connect(this.outputAudioCtx.destination);
    }
  }

  /**
   * Enqueues and plays a 24kHz PCM16 base64 chunk from Gemini Live
   */
  async playChunk(base64Pcm: string): Promise<void> {
    this.initOutputContext();
    if (!this.outputAudioCtx) return;

    if (this.outputAudioCtx.state === 'suspended') {
      await this.outputAudioCtx.resume();
    }

    try {
      // Decode Base64 to ArrayBuffer
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Read as Int16 (little-endian)
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Create AudioBuffer at 24000Hz mono
      const audioBuffer = this.outputAudioCtx.createBuffer(
        1,
        float32Array.length,
        24000
      );
      audioBuffer.getChannelData(0).set(float32Array);

      // Create BufferSourceNode
      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.outputAnalyser) {
        source.connect(this.outputAnalyser);
      } else {
        source.connect(this.outputAudioCtx.destination);
      }

      // Schedule gapless playback
      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
      };
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  }

  /**
   * Instantly stops all current and scheduled audio playback (Interruption)
   */
  stopPlayback(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source may already have ended
      }
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    } else {
      this.nextStartTime = 0;
    }
  }

  /**
   * Returns current audio frequency data for visualizations (0 - 255)
   */
  getFrequencyData(): { input: Uint8Array; output: Uint8Array } {
    const inputData = new Uint8Array(128);
    const outputData = new Uint8Array(128);

    if (this.inputAnalyser) {
      this.inputAnalyser.getByteFrequencyData(inputData);
    }
    if (this.outputAnalyser) {
      this.outputAnalyser.getByteFrequencyData(outputData);
    }

    return { input: inputData, output: outputData };
  }

  /**
   * Stop recording and close media stream
   */
  stopRecording(): void {
    this.isRecording = false;
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.inputAudioCtx) {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }
  }

  /**
   * Full cleanup
   */
  dispose(): void {
    this.stopPlayback();
    this.stopRecording();
    if (this.outputAudioCtx) {
      this.outputAudioCtx.close();
      this.outputAudioCtx = null;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
