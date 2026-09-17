import { useState } from 'react';
import type { Scene, VideoProject } from '../types/video';
import { applyStyle, loadGif, STYLES } from '../services/effects';

export function EffectsStudio({ project, onChange }: { project: VideoProject; onChange: (project: VideoProject) => void }) {
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const selected = Math.min(index, project.scenes.length - 1);
  const scene = project.scenes[selected];
  const update = (fields: Partial<Scene>) => onChange({ ...project, scenes: project.scenes.map((scene, i) => i === selected ? { ...scene, ...fields } : scene) });
  async function upload(file: File | undefined, type: 'gif' | 'sound') {
    if (!file) return;
    setError('');
    try {
      if (file.size > 5_000_000) throw new Error('Máximo 5 MB por archivo.');
      if (type === 'gif' && file.type !== 'image/gif') throw new Error('Elegí un GIF.');
      const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      if (type === 'gif') { await loadGif(url); update({ overlay: { kind: 'gif', url, duration: 1.5, start: 0 } }); }
      else {
        const context = new AudioContext();
        try { const audio = await context.decodeAudioData(await file.arrayBuffer()); if (audio.duration > 10) throw new Error('Usá un efecto de hasta 10 segundos.'); }
        finally { await context.close(); }
        update({ soundEffect: 'custom', soundUrl: url, soundVolume: 0.2 });
      }
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo cargar el archivo.'); }
  }
  const field = 'bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm';
  return <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
    <h2 className="font-bold text-lg">Estilos, memes y gráficos</h2>
    <p className="text-sm text-slate-400">Aplicá un estilo y personalizá cada escena. Los efectos y GIF se incluyen en el video exportado.</p>
    <div className="flex flex-wrap gap-2">{STYLES.map(style => <button key={style.id} className={`${field} ${project.visualStyle === style.id ? 'text-amber-300' : ''}`} onClick={() => onChange(applyStyle(project, style.id))}>{style.label}</button>)}</div>
    <label className="block">Escena <select aria-label="Escena para efectos" className={field} value={selected} onChange={e => setIndex(Number(e.target.value))}>{project.scenes.map((scene, i) => <option key={scene.id} value={i}>{i + 1} · {scene.narrationText.slice(0, 40)}</option>)}</select></label>
    <div className="flex flex-wrap gap-3">
      <label>Gráfico <select aria-label="Tipo de gráfico" className={field} value={scene.overlay?.kind || 'none'} onChange={e => update({ overlay: { kind: e.target.value as NonNullable<Scene['overlay']>['kind'], start: 0, duration: 1.5 } })}><option value="none">Ninguno</option><option value="reaction">Reacción animada</option><option value="chart">Porcentaje animado</option><option value="gif">GIF propio</option></select></label>
      <label>Sonido <select aria-label="Efecto sonoro" className={field} value={scene.soundEffect || 'none'} onChange={e => update({ soundEffect: e.target.value as Scene['soundEffect'] })}><option value="none">Ninguno</option><option value="impact">Impacto grave</option><option value="suspense">Tensión</option><option value="comedy">Rebote cómico</option><option value="whoosh">Barrido</option><option value="custom">Mi sonido</option></select></label>
      <label>Volumen del efecto <input aria-label="Volumen del efecto" type="range" min="0" max="0.5" step="0.01" value={scene.soundVolume ?? 0.18} onChange={e => update({ soundVolume: Number(e.target.value) })} /></label>
    </div>
    {scene.overlay?.kind === 'reaction' && <input aria-label="Texto de reacción" className={field} maxLength={35} value={scene.overlay.text || ''} placeholder="¡NO PUEDE SER!" onChange={e => update({ overlay: { ...scene.overlay!, text: e.target.value } })} />}
    {scene.overlay?.kind === 'chart' && <div className="flex flex-wrap gap-3"><input aria-label="Descripción del dato" className={field} placeholder="Descripción del dato comprobado" maxLength={35} value={scene.overlay.label || ''} onChange={e => update({ overlay: { ...scene.overlay!, label: e.target.value } })} /><label>Porcentaje real <input aria-label="Porcentaje real" className={field} type="number" min="0" max="100" value={scene.overlay.value ?? 0} onChange={e => update({ overlay: { ...scene.overlay!, value: Math.max(0, Math.min(100, Number(e.target.value))) } })} /></label></div>}
    {scene.overlay?.kind === 'gif' && <label className="block">Cargar GIF <input aria-label="Cargar GIF" type="file" accept="image/gif" onChange={e => void upload(e.target.files?.[0], 'gif')} /></label>}
    {scene.soundEffect === 'custom' && <label className="block">Cargar sonido de meme (hasta 10s) <input aria-label="Cargar sonido" type="file" accept="audio/*" onChange={e => void upload(e.target.files?.[0], 'sound')} /></label>}
    {scene.overlay && scene.overlay.kind !== 'none' && <div className="flex gap-3"><label>Inicio (s) <input aria-label="Inicio del gráfico" className={field} type="number" min="0" max={scene.duration} step="0.1" value={scene.overlay.start || 0} onChange={e => update({ overlay: { ...scene.overlay!, start: Math.max(0, Math.min(scene.duration, Number(e.target.value))) } })} /></label><label>Duración (s) <input aria-label="Duración del gráfico" className={field} type="number" min="0.2" max={scene.duration} step="0.1" value={scene.overlay.duration ?? 1.5} onChange={e => update({ overlay: { ...scene.overlay!, duration: Math.max(0.2, Math.min(scene.duration, Number(e.target.value))) } })} /></label></div>}
    {error && <p role="alert" className="text-rose-300">{error}</p>}
  </section>;
}
