export type CameraMotion = 
  | 'zoom_in'
  | 'zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'tilt_up'
  | 'tilt_down'
  | 'dolly_shake'
  | 'static';

export type TransitionType = 
  | 'crossfade'
  | 'flash_white'
  | 'zoom_blur'
  | 'wipe_left'
  | 'push_up'
  | 'glitch'
  | 'none';

export type VisualFilter = 
  | 'cinematic_warm'
  | 'cyberpunk_neon'
  | 'noir_contrast'
  | 'vintage_35mm'
  | 'emerald_matrix'
  | 'vivid_hyper'
  | 'dark_vignette'
  | 'natural';

export type SubtitleStyle =
  | 'hormozi_bold'      // Bold yellow/green highlight, black outline, punchy
  | 'cinematic_gold'    // Elegant serif / gold gradient, ambient
  | 'cyber_neon'        // Cyan & magenta glow, uppercase, futuristic
  | 'mrbeast_pop'       // Comic bold, rotated bounce, energetic
  | 'clean_minimal'     // Modern sans-serif, semi-transparent dark box
  | 'capcut_pop'        // 1-2 words at a time, pop-in per word, thick stroke, active yellow
  | 'karaoke_active';   // Word-by-word active glow

export type MusicGenre = 
  | 'synthwave_pulse'
  | 'cinematic_epic'
  | 'dark_suspense'
  | 'lofi_chill_beat'
  | 'energetic_trap'
  | 'ambient_deep';

export interface WordTimestamp {
  word: string;
  start: number; // in seconds relative to scene
  end: number;
}

export interface Scene {
  overlay?: { kind: 'none' | 'reaction' | 'chart' | 'gif'; text?: string; value?: number; label?: string; url?: string; start?: number; duration?: number };
  soundEffect?: 'none' | 'impact' | 'suspense' | 'comedy' | 'whoosh' | 'custom';
  soundUrl?: string;
  soundVolume?: number;
  id: string;
  order: number;
  duration: number; // seconds (~5s x 6 escenas = ~30s total)
  imageUrl: string;
  imagePrompt: string;
  narrationText: string;
  narrationAudioUrl?: string; // voz edge-tts pre-generada: la escena dura lo que dura el audio
  subtitles: {
    text: string;
    words?: WordTimestamp[];
  };
  cameraMotion: CameraMotion;
  transition: TransitionType;
  filter: VisualFilter;
  badge?: string; // e.g. "#1", "SECRETO", "ADVERTENCIA", "DATO CLAVE"
}

export interface ShortsMetadata {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  viralHook: string;
  callToAction: string;
  soundtrackName: string;
  targetAudience: string;
  estimatedCTR: string;
}

export interface VideoProject {
  visualStyle?: 'documental' | 'epico' | 'humor' | 'explicativo';
  channel?: string;
  motionIntensity?: 'suave' | 'dinamica';
  id: string;
  title: string;
  topic: string;
  variantIndex: number;
  variantStyleName: string;
  aspectRatio: '9:16';
  width: 1080;
  height: 1920;
  totalDuration: number; // in seconds (~30 total)
  fps: number;
  musicGenre: MusicGenre;
  musicVolume: number; // 0.0 to 1.0 (default ducking ~0.35 during speech)
  voiceSpeed: number; // 0.8 to 1.5
  subtitleStyle: SubtitleStyle;
  scenes: Scene[];
  metadata: ShortsMetadata;
  thumbnailUrl: string;
  thumbnailBadgeText: string;
  thumbnailHeadline: string;
  createdAt: string;
  isPreRenderedSample?: boolean;
  sampleFileName?: string;
}

export interface PipelineConfig {
  outputDirectory: string;
  resolutionWidth: number;
  resolutionHeight: number;
  fps: number;
  targetDurationSeconds: number;
  defaultStyle: VisualFilter;
  defaultTransition: TransitionType;
  defaultSubtitleStyle: SubtitleStyle;
  imageModel: 'stable-diffusion-xl' | 'dall-e-3' | 'midjourney-api' | 'procedural-fast';
  audioProvider: 'freemusicarchive' | 'jamendo' | 'procedural-synthesizer';
  ttsEngine: 'edge-tts' | 'openai-tts' | 'system-speech';
  bitrateVideo: string;
  bitrateAudio: string;
  ffmpegPreset: 'ultrafast' | 'fast' | 'medium' | 'slow';
  hardwareAcceleration: 'cuda' | 'vaapi' | 'videotoolbox' | 'cpu';
}

export interface LogMessage {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'DEBUG' | 'FFMPEG';
  message: string;
  step?: string;
  progressPercent?: number;
}

export interface PythonCodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}
