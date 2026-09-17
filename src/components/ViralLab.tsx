import { useEffect, useState } from 'react';
import { Microscope, Loader2, AlertTriangle, CheckCircle2, Trash2, Link2 } from 'lucide-react';
import { CHANNELS } from '../services/story';

interface ViralEntry {
  id: string;
  fecha: string;
  canal: string;
  enlace: string;
  transcripcion: string;
  metricas: string;
  notas: string;
  analisis: {
    resumen: string;
    ganchos: { texto: string; trigger?: string }[];
    beats: { desde: string; hasta: string; funcion: string; nota?: string }[];
    porQueFunciona?: string;
    patrones?: string[];
    aplicable?: string;
  };
}

export function ViralLab() {
  const [virales, setVirales] = useState<ViralEntry[]>([]);
  const [canal, setCanal] = useState('General');
  const [enlace, setEnlace] = useState('');
  const [metricas, setMetricas] = useState('');
  const [transcripcion, setTranscripcion] = useState('');
  const [notas, setNotas] = useState('');
  const [cargandoLista, setCargandoLista] = useState(true);
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paso, setPaso] = useState('');

  useEffect(() => {
    fetch('/api/analisis')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.virales)) setVirales(data.virales); })
      .catch(() => setError('No se pudo abrir el banco de virales.'))
      .finally(() => setCargandoLista(false));
  }, []);

  async function analizar() {
    if (analizando) return;
    setError(null);
    setPaso('');
    if (transcripcion.trim().length < 40) {
      setError('Pegá la transcripción del viral (mínimo 40 caracteres).');
      return;
    }
    setAnalizando(true);
    setPaso('Desglosando el viral segundo a segundo…');
    try {
      const resp = await fetch('/api/analisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canal, enlace, metricas, transcripcion, notas }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      setVirales(prev => [data.viral, ...prev]);
      setTranscripcion(''); setEnlace(''); setMetricas(''); setNotas('');
      setPaso('Análisis guardado en el banco ✅ Sus ganchos ya alimentan el generador.');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setAnalizando(false);
    }
  }

  async function eliminar(id: string) {
    try {
      const resp = await fetch(`/api/analisis?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (resp.ok) setVirales(prev => prev.filter(v => v.id !== id));
    } catch { /* la lista queda como está */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white font-heading">
            🔬 Laboratorio de Virales
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Pegá la transcripción de un viral de tu nicho: se desglosa segundo a segundo y sus ganchos pasan a alimentar el generador de guiones.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-400">
          <Microscope className="w-3.5 h-3.5 text-emerald-400" />
          {virales.length} viral{virales.length === 1 ? '' : 'es'} en el banco
        </div>
      </div>

      {/* Formulario de análisis */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap gap-3">
          <label className="text-xs text-slate-300">Canal donde aplicarlo
            <select aria-label="Canal" disabled={analizando} value={canal} onChange={e => setCanal(e.target.value)} className="block mt-1 bg-slate-800 rounded p-2">
              {CHANNELS.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300 flex-1 min-w-56">Enlace (opcional)
            <input aria-label="Enlace del viral" disabled={analizando} value={enlace} onChange={e => setEnlace(e.target.value)} placeholder="https://..." className="block w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-slate-300 flex-1 min-w-56">Métricas (opcional)
            <input aria-label="Métricas del viral" disabled={analizando} value={metricas} onChange={e => setMetricas(e.target.value)} placeholder="Ej: 2.4M vistas, 180K likes" className="block w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm" />
          </label>
        </div>
        <textarea
          aria-label="Transcripción del viral"
          disabled={analizando}
          value={transcripcion}
          onChange={e => setTranscripcion(e.target.value)}
          rows={5}
          placeholder="Pegá acá la transcripción o descripción del video viral (de YouTube: 'Mostrar transcripción' → copiar todo)…"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
        />
        <textarea
          aria-label="Notas del creador"
          disabled={analizando}
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={2}
          placeholder="Notas opcionales: qué te llamó la atención, por qué creés que explotó…"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={analizar}
            disabled={analizando}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-950/40 transition active:scale-95"
          >
            {analizando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Microscope className="w-4 h-4" />}
            Analizar viral
          </button>
          {paso && !error && (
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> {paso}
            </span>
          )}
        </div>
        {error && (
          <div className="text-[11px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-xl px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Banco de virales analizados */}
      {cargandoLista ? (
        <p className="text-xs text-slate-500 font-mono">Abriendo el banco…</p>
      ) : virales.length === 0 ? (
        <p className="text-xs text-slate-500">
          Todavía no analizaste ningún viral. Con uno solo alcanza: sus ganchos entran al banco y el generador empieza a usarlos para ese canal.
        </p>
      ) : (
        <div className="space-y-3">
          {virales.map(viral => (
            <div key={viral.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black bg-rose-600 text-white rounded-md px-1.5 py-0.5">{viral.canal}</span>
                    <span className="text-[10px] font-mono text-slate-500">{new Date(viral.fecha).toLocaleDateString('es-AR')}</span>
                    {viral.enlace && (
                      <a href={viral.enlace} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-sky-400 flex items-center gap-1 hover:text-sky-300">
                        <Link2 className="w-3 h-3" /> ver original
                      </a>
                    )}
                    {viral.metricas && <span className="text-[10px] font-mono text-amber-300">{viral.metricas}</span>}
                  </div>
                  <p className="text-sm text-slate-100 font-semibold mt-2">{viral.analisis.resumen}</p>
                  {viral.analisis.porQueFunciona && <p className="text-xs text-slate-400 mt-1">💡 {viral.analisis.porQueFunciona}</p>}
                </div>
                <button
                  onClick={() => eliminar(viral.id)}
                  title="Sacar del banco"
                  className="shrink-0 p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {viral.analisis.ganchos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {viral.analisis.ganchos.map((gancho, i) => (
                    <span key={i} title={gancho.trigger} className="text-[10px] font-mono text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-full px-2 py-0.5">
                      🎣 {gancho.texto}{gancho.trigger ? ` · ${gancho.trigger}` : ''}
                    </span>
                  ))}
                </div>
              )}

              {viral.analisis.beats.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="text-[11px] w-full">
                    <tbody>
                      {viral.analisis.beats.map((beat, i) => (
                        <tr key={i} className="border-t border-slate-800/60">
                          <td className="py-1 pr-3 font-mono text-slate-500 whitespace-nowrap align-top">{beat.desde}–{beat.hasta}</td>
                          <td className="py-1 pr-3 text-amber-300/90 font-semibold whitespace-nowrap align-top">{beat.funcion}</td>
                          <td className="py-1 text-slate-400">{beat.nota}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viral.analisis.patrones && viral.analisis.patrones.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {viral.analisis.patrones.map((patron, i) => (
                    <span key={i} className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 rounded-full px-2 py-0.5">{patron}</span>
                  ))}
                </div>
              )}

              {viral.analisis.aplicable && <p className="text-xs text-emerald-300/90">🎯 {viral.analisis.aplicable}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
