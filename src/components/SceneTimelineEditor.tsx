import React, { useState } from 'react';
import { CameraMotion, TransitionType, VisualFilter, VideoProject, Scene } from '../types/video';
import { Edit3, Clock, Camera, Sparkles, Sliders, Type, Plus, Trash2 } from 'lucide-react';

interface SceneTimelineEditorProps {
  project: VideoProject;
  onUpdateProject: (updated: VideoProject) => void;
}

export const SceneTimelineEditor: React.FC<SceneTimelineEditorProps> = ({
  project,
  onUpdateProject
}) => {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const activeScene = project.scenes[selectedSceneIndex] || project.scenes[0];

  const handleUpdateScene = (updatedFields: Partial<Scene>) => {
    const updatedScenes = project.scenes.map((s, idx) => {
      if (idx === selectedSceneIndex) {
        const changedVoice = updatedFields.narrationText !== undefined && updatedFields.narrationText !== s.narrationText;
        return { ...s, ...updatedFields, ...(changedVoice ? {
          narrationAudioUrl: undefined, subtitles: { text: updatedFields.narrationText! }
        } : {}) };
      }
      return s;
    });

    const totalDur = updatedScenes.reduce((acc, curr) => acc + curr.duration, 0);

    onUpdateProject({
      ...project,
      scenes: updatedScenes,
      totalDuration: totalDur
    });
  };

  const handleAddScene = () => {
    const newOrder = project.scenes.length + 1;
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      order: newOrder,
      duration: 5,
      imageUrl: project.scenes[0]?.imageUrl || 'https://images.pexels.com/photos/33441872/pexels-photo-33441872.jpeg',
      imagePrompt: `Cinematic vertical 8k scene for ${project.topic}, dynamic lighting`,
      narrationText: `Nuevo punto clave sobre ${project.topic} para el Short.`,
      subtitles: {
        text: `Nuevo dato impactante sobre ${project.topic} 🔥`,
        words: []
      },
      cameraMotion: 'zoom_in',
      transition: 'flash_white',
      filter: 'cinematic_warm',
      badge: `DATO #${newOrder}`
    };

    const newScenes = [...project.scenes, newScene];
    const totalDur = newScenes.reduce((acc, curr) => acc + curr.duration, 0);

    onUpdateProject({
      ...project,
      scenes: newScenes,
      totalDuration: totalDur
    });
    setSelectedSceneIndex(newScenes.length - 1);
  };

  const handleDeleteScene = (indexToDelete: number) => {
    if (project.scenes.length <= 2) return; // Keep at least 2 scenes
    const newScenes = project.scenes
      .filter((_, idx) => idx !== indexToDelete)
      .map((s, idx) => ({ ...s, order: idx + 1 }));

    const totalDur = newScenes.reduce((acc, curr) => acc + curr.duration, 0);

    onUpdateProject({
      ...project,
      scenes: newScenes,
      totalDuration: totalDur
    });
    setSelectedSceneIndex(Math.max(0, indexToDelete - 1));
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-500" />
            Editor de Escenas & Línea de Tiempo (~30s)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personaliza el movimiento de cámara Ken Burns, transiciones FFmpeg, textos y prompts para cada escena.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-slate-800 text-rose-400 px-3 py-1.5 rounded-xl border border-slate-700">
            Total: {project.totalDuration}s ({project.scenes.length} escenas)
          </span>
          <button
            onClick={handleAddScene}
            className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Escena</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scenes Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {project.scenes.map((scene, idx) => {
          const isSelected = idx === selectedSceneIndex;
          return (
            <div
              key={scene.id}
              onClick={() => setSelectedSceneIndex(idx)}
              className={`relative cursor-pointer rounded-2xl overflow-hidden border transition-all duration-200 group ${
                isSelected
                  ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/40 scale-102'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
              }`}
            >
              <div className="aspect-[9/14] bg-slate-950 overflow-hidden relative">
                <img
                  src={scene.imageUrl}
                  alt={`Escena ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20"></div>

                {/* Top Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white">
                    #{idx + 1}
                  </span>
                </div>

                {/* Duration Badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 text-slate-300">
                    {scene.duration}s
                  </span>
                </div>

                {/* Bottom Title */}
                <div className="absolute bottom-2 left-2 right-2 text-left">
                  <p className="text-[10px] font-bold text-white line-clamp-2">
                    {scene.subtitles.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Scene Detailed Editor Form */}
      {activeScene && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6 text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center">
                #{selectedSceneIndex + 1}
              </span>
              <div>
                <h3 className="text-base font-bold text-white">
                  Ajustes de la Escena #{selectedSceneIndex + 1}
                </h3>
                <p className="text-xs text-slate-400">
                  Edita la narrativa, el movimiento dinámico y la estética visual
                </p>
              </div>
            </div>

            {project.scenes.length > 2 && (
              <button
                onClick={() => handleDeleteScene(selectedSceneIndex)}
                className="py-1.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Escena</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Subtitles & Narration */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Type className="w-3.5 h-3.5 text-rose-400" />
                  Texto de Subtítulo Animado (Pantalla)
                </label>
                <input
                  type="text"
                  value={activeScene.subtitles.text}
                  onChange={(e) =>
                    handleUpdateScene({
                      subtitles: { ...activeScene.subtitles, text: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-rose-500 focus:outline-none"
                  placeholder="Subtítulo corto e impactante..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  Guion de Narración de Voz (Edge-TTS)
                </label>
                <textarea
                  rows={3}
                  value={activeScene.narrationText}
                  onChange={(e) => handleUpdateScene({ narrationText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none resize-none"
                  placeholder="Texto que la voz en off sintetizará..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Insignia Superior (Badge)
                </label>
                <input
                  type="text"
                  value={activeScene.badge || ''}
                  onChange={(e) => handleUpdateScene({ badge: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Ej: DATO #1, ADVERTENCIA, SECRETO..."
                />
              </div>
            </div>

            {/* Right Column: Motion, Duration & Filter */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Camera className="w-3.5 h-3.5 text-rose-400" />
                  Movimiento de Cámara (Ken Burns Dinámico)
                </label>
                <select
                  value={activeScene.cameraMotion}
                  onChange={(e) => handleUpdateScene({ cameraMotion: e.target.value as CameraMotion })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-rose-500 focus:outline-none"
                >
                  <option value="zoom_in">🔍 Zoom In Progresivo (1.0x ➔ 1.25x)</option>
                  <option value="zoom_out">🔎 Zoom Out Retracción (1.25x ➔ 1.0x)</option>
                  <option value="pan_left">⬅️ Panorámica Hacia la Izquierda</option>
                  <option value="pan_right">➡️ Panorámica Hacia la Derecha</option>
                  <option value="tilt_up">⬆️ Inclinación Vertical Arriba (Tilt Up)</option>
                  <option value="tilt_down">⬇️ Inclinación Vertical Abajo (Tilt Down)</option>
                  <option value="dolly_shake">📳 Dolly Dinámico con Pulso</option>
                  <option value="static">⏸️ Cámara Fija</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Duración (s)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={30}
                    step={1}
                    value={activeScene.duration}
                    onChange={(e) => handleUpdateScene({ duration: Math.max(2, parseInt(e.target.value) || 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                    Transición
                  </label>
                  <select
                    value={activeScene.transition}
                    onChange={(e) => handleUpdateScene({ transition: e.target.value as TransitionType })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-rose-500 focus:outline-none"
                  >
                    <option value="flash_white">⚡ Flash Blanco</option>
                    <option value="crossfade">🌫️ Disolución Suave</option>
                    <option value="glitch">👾 Glitch RGB</option>
                    <option value="wipe_left">◀️ Barrido Lateral</option>
                    <option value="push_up">🔼 Empuje Hacia Arriba</option>
                    <option value="zoom_blur">🌀 Desenfoque de Zoom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  Filtro Visual & LUT
                </label>
                <select
                  value={activeScene.filter}
                  onChange={(e) => handleUpdateScene({ filter: e.target.value as VisualFilter })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-rose-500 focus:outline-none"
                >
                  <option value="cinematic_warm">🔥 Cálido Épico (Vintage Gold)</option>
                  <option value="cyberpunk_neon">🌌 Cyberpunk Neon (Cian / Magenta)</option>
                  <option value="noir_contrast">🌑 Noir Alto Contraste</option>
                  <option value="vintage_35mm">🎞️ Película Clásica 35mm</option>
                  <option value="vivid_hyper">⚡ Hiper-Saturación Vibrante</option>
                  <option value="natural">🌿 Neutro Balanceado</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
