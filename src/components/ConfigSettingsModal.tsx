import React, { useState } from 'react';
import { X, Settings, Download, Save, Check } from 'lucide-react';
import { PipelineConfig } from '../types/video';

interface ConfigSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigSettingsModal: React.FC<ConfigSettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<PipelineConfig>({
    outputDirectory: './output_shorts',
    resolutionWidth: 1080,
    resolutionHeight: 1920,
    fps: 30,
    targetDurationSeconds: 60.0,
    defaultStyle: 'cinematic_warm',
    defaultTransition: 'flash_white',
    defaultSubtitleStyle: 'hormozi_bold',
    imageModel: 'stable-diffusion-xl',
    audioProvider: 'procedural-synthesizer',
    ttsEngine: 'edge-tts',
    bitrateVideo: '8500k',
    bitrateAudio: '256k',
    ffmpegPreset: 'medium',
    hardwareAcceleration: 'cuda'
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleDownloadYaml = () => {
    const yamlString = `# ShortsForge AI — config.yaml (Custom Export)
pipeline:
  output_dir: "${config.outputDirectory}"
  target_duration_seconds: ${config.targetDurationSeconds}
  fps: ${config.fps}

video:
  width: ${config.resolutionWidth}
  height: ${config.resolutionHeight}
  video_bitrate: "${config.bitrateVideo}"
  ffmpeg_preset: "${config.ffmpegPreset}"
  hardware_accel: "${config.hardwareAcceleration}"

audio:
  bitrate: "${config.bitrateAudio}"
  provider: "${config.audioProvider}"
  tts_engine: "${config.ttsEngine}"
  target_lufs: -14.0

subtitles:
  default_style: "${config.defaultSubtitleStyle}"
  font_size: 64
`;
    const blob = new Blob([yamlString], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-white">Configuración del Pipeline (config.yaml)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Video Specs */}
          <div>
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Especificaciones de Video</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Resolución</label>
                <input
                  type="text"
                  disabled
                  value="1080 × 1920 (9:16)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">FPS (Cuadros por segundo)</label>
                <select
                  value={config.fps}
                  onChange={(e) => setConfig({ ...config, fps: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value={30}>30 FPS (Recomendado)</option>
                  <option value={60}>60 FPS (Ultra Suave)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Bitrate de Video</label>
                <input
                  type="text"
                  value={config.bitrateVideo}
                  onChange={(e) => setConfig({ ...config, bitrateVideo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* AI Providers */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Motores de Inteligencia Artificial</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Generador de Imágenes</label>
                <select
                  value={config.imageModel}
                  onChange={(e) => setConfig({ ...config, imageModel: e.target.value as PipelineConfig['imageModel'] })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="stable-diffusion-xl">Stable Diffusion XL (Local API)</option>
                  <option value="dall-e-3">OpenAI DALL·E 3 (Cloud API)</option>
                  <option value="procedural-fast">Motor Procedural Rápido (Fallback)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Motor de Voz (TTS)</label>
                <select
                  value={config.ttsEngine}
                  onChange={(e) => setConfig({ ...config, ttsEngine: e.target.value as PipelineConfig['ttsEngine'] })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="edge-tts">Microsoft Edge-TTS (Natural)</option>
                  <option value="openai-tts">OpenAI TTS-1-HD</option>
                  <option value="system-speech">Sintetizador Nativo WebSpeech</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hardware & FFmpeg */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Renderizado & FFmpeg</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Aceleración por Hardware</label>
                <select
                  value={config.hardwareAcceleration}
                  onChange={(e) => setConfig({ ...config, hardwareAcceleration: e.target.value as PipelineConfig['hardwareAcceleration'] })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="cuda">NVIDIA NVENC (CUDA)</option>
                  <option value="vaapi">Intel QuickSync / VAAPI</option>
                  <option value="videotoolbox">Apple Silicon VideoToolbox</option>
                  <option value="cpu">CPU Software (libx264)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Preset de Compresión</label>
                <select
                  value={config.ffmpegPreset}
                  onChange={(e) => setConfig({ ...config, ffmpegPreset: e.target.value as PipelineConfig['ffmpegPreset'] })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  <option value="ultrafast">Ultrafast (Desarrollo)</option>
                  <option value="fast">Fast (Equilibrado)</option>
                  <option value="medium">Medium (Máxima Calidad YouTube)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleDownloadYaml}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar config.yaml</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-rose-950/40"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Aplicar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
