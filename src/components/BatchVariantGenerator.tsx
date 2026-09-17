import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Play, Download, Copy, Layers, Flame, RefreshCw } from 'lucide-react';
import { VideoProject } from '../types/video';
import { generateFiveVariantsForTopic } from '../services/videoGeneratorEngine';
import { downloadJsonMetadata } from '../services/exportManager';
import confetti from 'canvas-confetti';
import { CHANNELS } from '../services/story';

interface BatchVariantGeneratorProps {
  onSelectProjectForPlayback: (project: VideoProject) => void;
  activeProject: VideoProject;
}

const TOPIC_PRESETS = [
  { label: '🌌 Misterios del Cosmos', topic: 'Misterios del Cosmos y Agujeros Negros' },
  { label: '⚡ Hábitos de Productividad', topic: '5 Hábitos de Productividad Extrema' },
  { label: '⚔️ Gladiadores de Roma', topic: 'La Brutal Verdad de los Gladiadores Romanos' },
  { label: '🤖 Inteligencia Artificial 2026', topic: 'El Futuro de la Inteligencia Artificial en 2026' },
  { label: '🌊 Criaturas del Abismo', topic: 'Misterios Inexplorados del Océano Profundo' },
  { label: '🧠 Psicología Oscura & Sesgos', topic: '3 Trucos de Psicología Oscura y Lenguaje Corporal' }
];

export const BatchVariantGenerator: React.FC<BatchVariantGeneratorProps> = ({
  onSelectProjectForPlayback,
  activeProject
}) => {
  const [topicInput, setTopicInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [generatedVariants, setGeneratedVariants] = useState<VideoProject[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [error, setError] = useState('');
  const [channel, setChannel] = useState('General');
  const PIPELINE_STEPS = ['Pregunta', 'Acción', 'Contraste', 'Decisión', 'Revelación'].map(title => ({ title, desc: 'Guion e imágenes originales' }));
  const handleGenerate = async (targetTopic?: string) => {
    const topic = (targetTopic || topicInput).trim();
    if (!topic || isGenerating) return;
    setIsGenerating(true);
    setError('');
    setGenerationStep(0);
    try {
      const variants = await generateFiveVariantsForTopic(topic, channel, setGenerationStep);
      setGeneratedVariants(variants);
      confetti({ particleCount: 40, spread: 60 });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudieron generar las variantes.');
    } finally { setIsGenerating(false); }
  };

  const copyShortsPackage = (variant: VideoProject, idx: number) => {
    const text = `TÍTULO:\n${variant.metadata.title}\n\nDESCRIPCIÓN:\n${variant.metadata.description}\n\nHASHTAGS:\n${variant.metadata.hashtags.join(' ')}\n\nETIQUETAS:\n${variant.metadata.tags.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Top Creation Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-3">
            <Flame className="w-3.5 h-3.5" />
            5 enfoques originales de unos 20s
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-white font-heading tracking-tight leading-tight">
            Creá 5 propuestas para <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-fuchsia-400 to-cyan-400">YouTube Shorts</span>
          </h1>

          <p className="text-sm md:text-base text-slate-400 mt-2 leading-relaxed">
            Generá cinco guiones e imágenes con aperturas diferentes. Elegí uno en el Studio: la voz se prepara al reproducir o exportar. Este proceso utiliza tus proveedores de IA y puede tardar varios minutos.
          </p>

          <label className="block mt-3">Canal <select aria-label="Canal de variantes" value={channel} disabled={isGenerating} onChange={e => setChannel(e.target.value)} className="bg-slate-800 rounded p-2">{CHANNELS.map(c => <option key={c}>{c}</option>)}</select></label>
          {error && <p role="alert" className="text-rose-300 mt-3">{error}</p>}
          {/* Search Input Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                placeholder="Ej: Misterios del Triángulo de las Bermudas, 5 Trucos de Dinero..."
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 transition shadow-inner"
              />
            </div>
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-950/50 transition transform active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar 5 Variantes</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Quick Topic Presets */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Temas de prueba rápidos:</span>
            {TOPIC_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopicInput(p.topic);
                  handleGenerate(p.topic);
                }}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded-full text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Execution Animation Card */}
        {isGenerating && (
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              Generando guiones e imágenes con tus proveedores
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {PIPELINE_STEPS.map((s, idx) => {
                const isCurrent = idx === generationStep;
                const isDone = idx < generationStep;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-950/50 scale-102'
                        : isDone
                        ? 'bg-slate-900/90 border-emerald-500/50 text-slate-300'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin shrink-0"></div>
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                      )}
                      <p className="text-xs font-bold text-white line-clamp-1">{s.title}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-6">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Generated 5 Variants Grid */}
      {generatedVariants && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                5 propuestas para comparar
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona cualquier variante para reproducirla en vivo en el reproductor vertical 9:16 o exportarla directamente.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              Guiones e imágenes preparados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {generatedVariants.map((variant, idx) => {
              const isSelected = activeProject.id === variant.id;
              return (
                <div
                  key={variant.id}
                  className={`flex flex-col rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-300 hover:shadow-xl ${
                    isSelected
                      ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-rose-950/40'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Thumbnail Cover with Badge */}
                  <div className="relative aspect-[9/16] bg-slate-950 overflow-hidden group">
                    <img
                      src={variant.thumbnailUrl}
                      alt={variant.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                    {/* Top Variant Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-md">
                        VARIANTE #{idx + 1}
                      </span>
                    </div>

                    {/* CTR Score Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-emerald-400 border border-emerald-500/40">
                        Sin medición
                      </span>
                    </div>

                    {/* Central Play Trigger Button */}
                    <button
                      onClick={() => onSelectProjectForPlayback(variant)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center pl-0.5 shadow-xl opacity-90 group-hover:opacity-100 group-hover:scale-110 transition"
                    >
                      <Play className="w-5 h-5 fill-white" />
                    </button>

                    {/* Bottom Headline on Image */}
                    <div className="absolute bottom-2 left-2 right-2 text-left">
                      <span className="text-[10px] font-bold text-amber-300 bg-black/60 px-1.5 py-0.5 rounded">
                        {variant.thumbnailBadgeText}
                      </span>
                      <p className="text-xs font-black text-white mt-1 line-clamp-2 drop-shadow-md">
                        {variant.thumbnailHeadline}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2.5 text-left">
                    <div>
                      <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block">
                        {variant.variantStyleName}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-2 mt-0.5" title={variant.metadata.title}>
                        {variant.metadata.title}
                      </h4>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      <p className="line-clamp-1">
                        🎵 <span className="text-slate-300">{variant.musicGenre.replace('_', ' ')}</span>
                      </p>
                      <p className="line-clamp-1">
                        ⏱️ <span className="text-slate-300">6 Escenas • 60.0 Segundos</span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectProjectForPlayback(variant)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isSelected ? 'Activo' : 'Ver'}</span>
                      </button>

                      <button
                        onClick={() => copyShortsPackage(variant, idx)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Copiar Título, Descripción y Hashtags para YouTube"
                      >
                        {copiedIndex === idx ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => downloadJsonMetadata(variant)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Descargar Metadata JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
