import React, { useState } from 'react';
import { Play, Download, Copy, CheckCircle2, Film, Clock, Hash } from 'lucide-react';
import { SAMPLE_SHORTS_PROJECTS } from '../data/samples';
import { VideoProject } from '../types/video';
import { downloadJsonMetadata } from '../services/exportManager';

interface SampleShortsShowcaseProps {
  onSelectSample: (sample: VideoProject) => void;
  activeProject: VideoProject;
}

export const SampleShortsShowcase: React.FC<SampleShortsShowcaseProps> = ({
  onSelectSample,
  activeProject
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTabScene, setActiveTabScene] = useState<Record<string, number>>({
    'sample-cosmos-01': 0,
    'sample-productivity-02': 0,
    'sample-rome-03': 0
  });

  const handleCopyMeta = (sample: VideoProject) => {
    const text = `TÍTULO:\n${sample.metadata.title}\n\nDESCRIPCIÓN:\n${sample.metadata.description}\n\nHASHTAGS:\n${sample.metadata.hashtags.join(' ')}\n\nETIQUETAS:\n${sample.metadata.tags.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(sample.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 shadow-xl text-left">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1.5 mb-2">
              <Film className="w-3.5 h-3.5" />
              3 Videos de Muestra Listos para YouTube Shorts
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-heading">
              Videos de Muestra Generados por el Pipeline
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Tres proyectos completos de ~30 segundos con resolución 1080×1920, sincronización de audio, efectos de cámara Ken Burns, subtítulos cinemáticos y paquetes SEO listos para subir a YouTube.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-slate-800 text-cyan-400 px-3 py-1.5 rounded-xl border border-slate-700">
              Formato: 1080×1920 • 60fps • ~30s
            </span>
          </div>
        </div>
      </div>

      {/* 3 Samples Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {SAMPLE_SHORTS_PROJECTS.map((sample, idx) => {
          const isSelected = activeProject.id === sample.id;
          const currentSceneIdx = activeTabScene[sample.id] || 0;
          const currentScene = sample.scenes[currentSceneIdx] || sample.scenes[0];

          return (
            <div
              key={sample.id}
              className={`flex flex-col rounded-3xl overflow-hidden bg-slate-900/90 border transition-all duration-300 shadow-xl ${
                isSelected
                  ? 'border-rose-500 ring-2 ring-rose-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Video Preview Thumbnail with Shorts Framing */}
              <div className="relative aspect-[9/12] bg-slate-950 overflow-hidden group">
                <img
                  src={currentScene.imageUrl}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/40"></div>

                {/* Top Pill Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-lg flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    Muestra #{idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/75 text-emerald-400 border border-emerald-500/30">
                    ~30s • 1080x1920
                  </span>
                </div>

                {/* Filename Tag */}
                <div className="absolute top-11 left-3">
                  <span className="text-[10px] font-mono bg-slate-950/80 text-cyan-300 px-2 py-0.5 rounded border border-slate-800">
                    {sample.sampleFileName}
                  </span>
                </div>

                {/* Central Play Button */}
                <button
                  onClick={() => onSelectSample(sample)}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-rose-600/95 text-white flex items-center justify-center pl-1 shadow-2xl group-hover:scale-110 transition"
                  title="Cargar en el reproductor vertical"
                >
                  <Play className="w-6 h-6 fill-white" />
                </button>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <span className="text-[10px] font-bold text-amber-300 bg-black/80 px-2 py-0.5 rounded-md">
                    {sample.thumbnailBadgeText}
                  </span>
                  <h3 className="text-sm font-black text-white mt-1 leading-snug drop-shadow-md">
                    {sample.metadata.title}
                  </h3>
                </div>
              </div>

              {/* Body Details */}
              <div className="p-4 flex flex-col justify-between flex-1 space-y-3 text-left">
                {/* Scene Selector Mini Bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                    <span>Escenas ({sample.scenes.length} de 10s c/u):</span>
                    <span className="text-cyan-400 font-mono">Escena #{currentSceneIdx + 1}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {sample.scenes.map((sc, sIdx) => (
                      <button
                        key={sc.id}
                        onClick={() => setActiveTabScene({ ...activeTabScene, [sample.id]: sIdx })}
                        className={`h-7 rounded-lg text-[10px] font-bold transition flex items-center justify-center ${
                          sIdx === currentSceneIdx
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        #{sIdx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Scene Prompt & Narration */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 space-y-1.5">
                  <p className="text-[11px] font-mono text-cyan-300/90 line-clamp-1">
                    🎨 {currentScene.imagePrompt}
                  </p>
                  <p className="text-xs text-slate-200 line-clamp-2">
                    <span className="text-rose-400 font-bold">Voz: </span>
                    "{currentScene.narrationText}"
                  </p>
                </div>

                {/* Viral Shorts Package Info */}
                <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-2.5">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Hash className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px] font-semibold text-cyan-300 truncate">
                      {sample.metadata.hashtags.join(' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] text-slate-300">
                      Banda Sonora: <strong className="text-white">{sample.metadata.soundtrackName}</strong>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onSelectSample(sample)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isSelected ? 'Reproduciendo' : 'Cargar en Studio'}</span>
                  </button>

                  <button
                    onClick={() => handleCopyMeta(sample)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Copiar Título, Descripción y Hashtags para YouTube"
                  >
                    {copiedId === sample.id ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => downloadJsonMetadata(sample)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Descargar paquete de metadata JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
