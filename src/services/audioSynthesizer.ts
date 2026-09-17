import { MusicGenre } from '../types/video';

class AudioSynthesizerEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private musicGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private currentOscillators: OscillatorNode[] = [];
  private currentInterval: number | null = null;
  private currentGenre: MusicGenre = 'synthwave_pulse';
  private targetVolume: number = 0.35;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  public getCurrentGenre(): MusicGenre {
    return this.currentGenre;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.musicGainNode = this.ctx.createGain();
      this.musicGainNode.gain.setValueAtTime(this.targetVolume, this.ctx.currentTime);

      this.destinationNode = this.ctx.createMediaStreamDestination();

      this.musicGainNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.ctx.destination);
      this.masterGainNode.connect(this.destinationNode);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAudioStream(): MediaStream | null {
    this.initContext();
    return this.destinationNode ? this.destinationNode.stream : null;
  }

  public playTrack(genre: MusicGenre, volume: number = 0.35) {
    this.initContext();
    this.stopTrack();
    this.currentGenre = genre;
    this.targetVolume = volume;
    this.isPlaying = true;

    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }

    if (genre === 'synthwave_pulse') {
      this.startSynthwavePattern();
    } else if (genre === 'cinematic_epic') {
      this.startCinematicPattern();
    } else if (genre === 'dark_suspense') {
      this.startSuspensePattern();
    } else if (genre === 'energetic_trap') {
      this.startTrapPattern();
    } else {
      this.startLoFiPattern();
    }
  }

  private speechElements = new Map<string, HTMLAudioElement>();
  private speechNodes = new Map<string, MediaElementAudioSourceNode>();
  private currentSpeech: HTMLAudioElement | null = null;

  /** Reproduce narración TTS (mp3) mezclada por el master → parlantes + grabación. */
  public playSpeech(url: string, key: string, offset = 0): Promise<void> {
    this.initContext();
    if (!this.ctx || !this.masterGainNode) return Promise.resolve();
    this.stopSpeech();

    let el = this.speechElements.get(key);
    if (!el) {
      el = new Audio(url);
      el.crossOrigin = 'anonymous';
      try {
        const src = this.ctx.createMediaElementSource(el);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        src.connect(gain);
        gain.connect(this.masterGainNode);
        this.speechNodes.set(key, src);
      } catch {
        return Promise.reject(new Error('No se pudo conectar la narración al audio.'));
      }
      this.speechElements.set(key, el);
    }

    this.currentSpeech = el;
    el.currentTime = Math.max(0, offset);
    el.volume = 1.0;
    el.onplay = () => this.duckAudio(true);
    el.onended = () => this.duckAudio(false);
    return el.play();
  }

  public stopSpeech() {
    if (this.currentSpeech) {
      try {
        this.currentSpeech.pause();
        this.currentSpeech.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentSpeech = null;
      this.duckAudio(false);
    }
  }

  public duckAudio(isSpeaking: boolean) {
    if (!this.ctx || !this.musicGainNode) return;
    const now = this.ctx.currentTime;
    const target = isSpeaking ? this.targetVolume * 0.35 : this.targetVolume;
    this.musicGainNode.gain.cancelScheduledValues(now);
    this.musicGainNode.gain.linearRampToValueAtTime(target, now + 0.2);
  }

  public stopTrack() {
    this.isPlaying = false;
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
      this.currentInterval = null;
    }
    this.currentOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.currentOscillators = [];
  }

  private startSynthwavePattern() {
    if (!this.ctx || !this.musicGainNode) return;
    const bpm = 124;
    const intervalMs = (60 / bpm / 2) * 1000; // Eighth notes
    const bassNotes = [110, 110, 130.81, 146.83, 110, 98, 110, 164.81];
    let step = 0;

    this.currentInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || !this.musicGainNode) return;
      const t = this.ctx.currentTime;
      const freq = bassNotes[step % bassNotes.length];

      // Bass synth pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.exponentialRampToValueAtTime(150, t + 0.2);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq / 2, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(t);
      osc.stop(t + 0.24);

      // Snare on 2 and 4
      if (step % 4 === 2) {
        this.triggerNoiseSnare(t);
      }
      // Kick on 0 and 4
      if (step % 4 === 0) {
        this.triggerKick(t);
      }

      step++;
    }, intervalMs);
  }

  private startCinematicPattern() {
    if (!this.ctx || !this.musicGainNode) return;
    const bpm = 90;
    const intervalMs = (60 / bpm) * 1000;
    const chords = [
      [65.41, 98.00, 130.81, 164.81], // C minor
      [58.27, 87.31, 116.54, 146.83], // Bb
      [55.00, 82.41, 110.00, 138.59], // Ab
      [49.00, 73.42, 98.00, 123.47]   // G
    ];
    let chordIdx = 0;

    this.currentInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || !this.musicGainNode) return;
      const t = this.ctx.currentTime;
      const currentChord = chords[chordIdx % chords.length];

      currentChord.forEach((f) => {
        if (!this.ctx || !this.musicGainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 3.8);

        osc.connect(gain);
        gain.connect(this.musicGainNode);
        osc.start(t);
        osc.stop(t + 4.0);
      });

      this.triggerTaikoThud(t);
      chordIdx++;
    }, intervalMs * 4);
  }

  private startSuspensePattern() {
    if (!this.ctx || !this.musicGainNode) return;
    const t = this.ctx.currentTime;
    // Ambient dark drone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, t); // A1
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(55.6, t); // Slight detune for pulsing tension

    droneGain.gain.setValueAtTime(0.25, t);

    osc1.connect(droneGain);
    osc2.connect(droneGain);
    droneGain.connect(this.musicGainNode);

    osc1.start(t);
    osc2.start(t);
    this.currentOscillators.push(osc1, osc2);

    // Occasional sub drop & tick
    let count = 0;
    this.currentInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      if (count % 4 === 0) {
        this.triggerKick(now, 45, 0.6);
      }
      count++;
    }, 1000);
  }

  private startTrapPattern() {
    if (!this.ctx || !this.musicGainNode) return;
    const intervalMs = 250;
    let step = 0;

    this.currentInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || !this.musicGainNode) return;
      const t = this.ctx.currentTime;
      if (step % 8 === 0) {
        this.triggerKick(t, 60, 0.8);
      }
      if (step % 8 === 4) {
        this.triggerNoiseSnare(t);
      }
      // Hi-hat
      this.triggerHiHat(t);
      step++;
    }, intervalMs);
  }

  private startLoFiPattern() {
    if (!this.ctx || !this.musicGainNode) return;
    const intervalMs = 1200;
    const lofiChords = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [164.81, 196.00, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.00, 261.63]  // Dm7
    ];
    let step = 0;

    this.currentInterval = window.setInterval(() => {
      if (!this.ctx || !this.isPlaying || !this.musicGainNode) return;
      const t = this.ctx.currentTime;
      const chord = lofiChords[step % lofiChords.length];

      chord.forEach((freq) => {
        if (!this.ctx || !this.musicGainNode) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
        osc.connect(g);
        g.connect(this.musicGainNode);
        osc.start(t);
        osc.stop(t + 1.2);
      });
      step++;
    }, intervalMs);
  }

  private triggerKick(time: number, startFreq = 140, vol = 0.5) {
    if (!this.ctx || !this.musicGainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.25);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(gain);
    gain.connect(this.musicGainNode);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private triggerNoiseSnare(time: number) {
    if (!this.ctx || !this.musicGainNode) return;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGainNode);
    noise.start(time);
  }

  private triggerHiHat(time: number) {
    if (!this.ctx || !this.musicGainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, time);
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain);
    gain.connect(this.musicGainNode);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  private triggerTaikoThud(time: number) {
    this.triggerKick(time, 90, 0.7);
  }
}

export const audioSynthesizer = new AudioSynthesizerEngine();
