import { useState } from 'react';
import { Wand2, Image as ImageIcon, Loader2, Play, AlertTriangle, CheckCircle2, BookOpen } from 'lucide-react';
import { VideoProject } from '../types/video';
import { CHANNELS, prepareProject, storyProject, requestApi } from '../services/story';
import { STYLES, applyStyle } from '../services/effects';

interface GuionEscena {
  narracion: string;
  subtitulo: string;
  prompt_imagen: string;
}

interface Guion {
  titulo: string;
  hook: string;
  cta: string;
  descripcion: string;
  hashtags: string[];
  gancho_formula_id?: string;
  escenas: GuionEscena[];
}

interface FormulaInfo {
  id: string;
  trigger: string;
  formula: string;
  ejemplo?: string;
}

const CUENTO_BADGES = ['INICIO', 'PERSONAJES', 'CONFLICTO', 'EL GIRO', 'CLÍMAX', 'MORALEJA'];

interface AiStoryGeneratorProps {
  onLoadProject: (project: VideoProject) => void;
}

export function AiStoryGenerator({ onLoadProject }: AiStoryGeneratorProps) {
  const [channel, setChannel] = useState('General');
  const [seconds, setSeconds] = useState(20);
  const [brief, setBrief] = useState('');
  const [style, setStyle] = useState<VideoProject['visualStyle']>('documental');
  const [tema, setTema] = useState('Cuento corto: un dragón pequeño que tenía miedo a rugir');
  const [guion, setGuion] = useState<Guion | null>(null);
  const [ganchoFormula, setGanchoFormula] = useState<FormulaInfo | null>(null);
  const [imagenes, setImagenes] = useState<(string | null)[]>([]);
  const [fuenteImg, setFuenteImg] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [paso, setPaso] = useState('');
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [cargandoStudio, setCargandoStudio] = useState(false);
  function rememberProfile() {
    try { localStorage.setItem(`shortsforge-profile:${channel}`, JSON.stringify({ seconds, brief, style })); } catch { /* generation can continue */ }
  }
  function chooseChannel(value: string) {
    rememberProfile(); setChannel(value); setGuion(null); setImagenes([]); setGanchoFormula(null);
    try {
      const profile = JSON.parse(localStorage.getItem(`shortsforge-profile:${value}`) || '{}');
      setBrief(typeof profile.brief === 'string' ? profile.brief : '');
      setSeconds([15, 20, 30].includes(profile.seconds) ? profile.seconds : 20);
      setStyle(STYLES.some(style => style.id === profile.style) ? profile.style : value === 'Fútbol Medieval' ? 'epico' : 'documental');
    } catch { setBrief(''); }
  }

  async function generarGuion(): Promise<Guion | null> {
    rememberProfile();
    const temaLimpio = tema.trim();
    if (!temaLimpio) return null;
    setError(null);
    setOcupado(true);
    setPaso('Escribiendo un guion breve con tu proveedor...');
    try {
      const resp = await fetch('/api/guion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: temaLimpio, channel, seconds, brief }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || `Error ${resp.status}${data.hint ? ` — ${data.hint}` : ''}`);
      }
      setGuion(data.guion);
      setGanchoFormula(data.ganchoFormula ?? null);
      setImagenes(new Array(data.guion.escenas.length).fill(null));
      setFuenteImg([]);
      setPaso('Guion listo ✅');
      return data.guion as Guion;
    } catch (e: any) {
      setError(e?.message || String(e));
      return null;
    } finally {
      setOcupado(false);
    }
  }

  async function generarImagenEscena(idx: number, prompt: string) {
    setPaso(`Generando imagen ${idx + 1}/6 (FLUX vía FreeLLMAPI)...`);
    const resp = await fetch('/api/imagen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `Error de imagen ${resp.status}`);
    setImagenes((prev) => {
      const next = [...prev];
      next[idx] = data.url;
      return next;
    });
    setFuenteImg((prev) => {
      const next = [...prev];
      next[idx] = data.fuente;
      return next;
    });
  }

  async function generarTodo() {
    let guionActual = guion;
    if (!guionActual) {
      guionActual = await generarGuion();
    }
    if (!guionActual) return;
    setError(null);
    setOcupado(true);
    setProgreso({ actual: 0, total: guionActual.escenas.length });
    try {
      for (let i = 0; i < guionActual.escenas.length; i++) {
        await generarImagenEscena(i, guionActual.escenas[i].prompt_imagen);
        setProgreso({ actual: i + 1, total: guionActual.escenas.length });
      }
      setPaso('Video listo para cargar en el Studio ✅');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setOcupado(false);
      setProgreso({ actual: 0, total: 0 });
    }
  }

  async function otroGancho() {
    if (!guion || ocupado || cargandoStudio) return;
    setError(null);
    setOcupado(true);
    setPaso('Pidiendo otro gancho con distinta fórmula…');
    try {
      const resp = await fetch('/api/gancho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema: tema.trim(), channel, brief,
          narracion: guion.escenas[0].narracion,
          gancho_formula_id: ganchoFormula?.id ?? '',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || `Error ${resp.status}`);
      setGuion({
        ...guion,
        hook: data.gancho,
        titulo: data.titulo || guion.titulo,
        escenas: guion.escenas.map((escena, i) => i === 0 ? { ...escena, narracion: data.gancho, subtitulo: data.gancho } : escena),
      });
      setGanchoFormula(data.ganchoFormula ?? null);
      setPaso('Gancho nuevo listo ✅ Si cambió mucho la escena 1, regenerá su imagen.');
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setOcupado(false);
    }
  }

  async function cargarEnStudio() {
    if (!guion) return;
    const tieneTodasLasImagenes = imagenes.length === guion.escenas.length && imagenes.every(Boolean);
    if (!tieneTodasLasImagenes) {
      setError('Generá las 6 imágenes antes de cargar al Studio (o usá el botón "Guion + Imágenes").');
      return;
    }
    setError(null);
    setCargandoStudio(true);
    setPaso('Generando voces y calculando la duración de cada escena...');
    try {
      const project = await prepareProject(storyProject(guion, tema.trim(), imagenes as string[], channel));
      project.motionIntensity = 'dinamica';
      setPaso('Video listo: cada escena dura lo que su narración ✅');
      onLoadProject(applyStyle(project, style));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setCargandoStudio(false);
    }
  }

  const progresoVisible = ocupado && progreso.total > 0;
  async function automatico() {
    if (ocupado || cargandoStudio || !tema.trim()) return;
    rememberProfile(); setOcupado(true); setError(null);
    try {
      setPaso('Escribiendo el guion…');
      const respuesta = await requestApi<{ guion: Guion; ganchoFormula?: FormulaInfo | null }>('guion', { tema, channel, seconds, brief: `${brief}. Estilo: ${style}` });
      const story = respuesta.guion;
      setGanchoFormula(respuesta.ganchoFormula ?? null);
      setGuion(story); setImagenes([]);
      const images: string[] = [];
      for (const [index, scene] of story.escenas.entries()) {
        setPaso(`Generando imagen ${index + 1}/${story.escenas.length}…`);
        const { url } = await requestApi<{ url: string }>('imagen', { prompt: scene.prompt_imagen });
        images.push(url); setImagenes([...images]);
      }
      setPaso('Preparando voces y subtítulos sincronizados…');
      const project = await prepareProject(storyProject(story, tema, images, channel));
      onLoadProject(applyStyle(project, style));
    } catch (error) { setError(error instanceof Error ? error.message : 'La generación se interrumpió.'); }
    finally { setOcupado(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white font-heading">
            ✨ IA · Generá Cualquier Video (Cuentos, Historias...)
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Elegí un canal, una duración y un tema. Revisá el gancho antes de generar las imágenes y la narración.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Guion → Imágenes → Voz y subtítulos
        </div>
      </div>

      {/* Input de tema */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-rose-500" /> Tema del video
        </label>
        <div className="flex flex-wrap gap-3">
          <label>Estilo <select aria-label="Estilo del video" disabled={ocupado || cargandoStudio} value={style} onChange={e => setStyle(e.target.value as VideoProject['visualStyle'])} className="bg-slate-800 rounded p-2">{STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
          <label>Canal <select aria-label="Canal" disabled={ocupado || cargandoStudio} value={channel} onChange={e => { chooseChannel(e.target.value); }} className="bg-slate-800 rounded p-2">{CHANNELS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Duración <select aria-label="Duración" disabled={ocupado || cargandoStudio} value={seconds} onChange={e => { setSeconds(Number(e.target.value)); setGuion(null); setImagenes([]); setGanchoFormula(null); }} className="bg-slate-800 rounded p-2">{[15,20,30].map(n => <option key={n} value={n}>{n} segundos</option>)}</select></label>
        </div>
        <textarea aria-label="Estilo y datos del canal" disabled={ocupado || cargandoStudio} value={brief} onChange={e => { setBrief(e.target.value); setGuion(null); setImagenes([]); setGanchoFormula(null); }} placeholder="Estilo del canal, personajes y datos comprobados para el guion" className="w-full bg-slate-950 rounded-xl p-3 text-sm" />
        <textarea
          disabled={ocupado || cargandoStudio}
          value={tema}
          onChange={(e) => { setTema(e.target.value); setGuion(null); setImagenes([]); setGanchoFormula(null); }}
          rows={2}
          placeholder="Ej: Cuento de un gato que salva su barrio usando solo su intuición / La historia de la primera pizza de Nápoles / Explicá por qué el cielo es azul..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={automatico} disabled={ocupado || cargandoStudio || !tema.trim()} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold disabled:opacity-40">Generar todo automáticamente</button>
          <button
            onClick={generarGuion}
            disabled={ocupado || cargandoStudio}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-950/40 transition active:scale-95"
          >
            {ocupado && !progresoVisible ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            1 · Generar guion (LLM)
          </button>
          <button
            onClick={generarTodo}
            disabled={ocupado || cargandoStudio || !guion}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-950/40 transition active:scale-95"
          >
            {ocupado && progresoVisible ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            2 · Generar imágenes (6 escenas)
          </button>
          <button
            onClick={cargarEnStudio}
            disabled={ocupado || cargandoStudio || !guion}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 border border-slate-700 transition active:scale-95"
          >
            {cargandoStudio ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <Play className="w-4 h-4 text-rose-400" />}
            {cargandoStudio ? 'Preparando voces...' : 'Cargar en el Studio'}
          </button>
        </div>

        {paso && !error && (
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> {paso}
          </div>
        )}
        {progresoVisible && (
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300"
                style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Imágenes {progreso.actual}/{progreso.total}
            </div>
          </div>
        )}
        {error && (
          <div className="text-[11px] font-mono text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-xl px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
          </div>
        )}
      </div>

      {/* Guion generado */}
      {guion && (
        <div className="space-y-3">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-extrabold text-white font-heading">{guion.titulo}</h2>
              <button
                onClick={otroGancho}
                disabled={ocupado || cargandoStudio}
                title="Reescribe solo el gancho con otra fórmula del banco"
                className="shrink-0 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] font-bold text-slate-200 border border-slate-700 transition active:scale-95"
              >
                🎲 Otro gancho
              </button>
            </div>
            <p className="text-xs text-rose-300 font-semibold">🎣 {guion.hook}</p>
            {ganchoFormula && (
              <p className="text-[10px] font-mono text-rose-400/80" title={ganchoFormula.formula}>
                Fórmula {ganchoFormula.id} · {ganchoFormula.trigger}
              </p>
            )}
            <p className="text-xs text-slate-400">{guion.descripcion}</p>
            <div className="flex flex-wrap gap-1.5">
              {(guion.hashtags || []).map((h) => (
                <span key={h} className="text-[10px] font-mono text-sky-400 bg-sky-950/40 border border-sky-800/50 rounded-full px-2 py-0.5">
                  {h}
                </span>
              ))}
            </div>
            <p className="text-xs text-amber-300 font-semibold">📣 {guion.cta}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guion.escenas.map((esc, i) => (
              <div key={i} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2 flex gap-3">
                {imagenes[i] ? (
                  <img
                    src={imagenes[i]!}
                    alt={`Escena ${i + 1}`}
                    className="w-20 h-36 object-cover rounded-xl border border-slate-700 shrink-0"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-20 h-36 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-6 h-6 text-slate-700" />
                  </div>
                )}
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-rose-600 text-white rounded-md px-1.5 py-0.5">
                      {CUENTO_BADGES[i]}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">ESC {i + 1}</span>
                    {fuenteImg[i] && (
                      <span className="text-[9px] font-mono text-emerald-400/80">{fuenteImg[i]}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">🎙️ {esc.narracion}</p>
                  <p className="text-[11px] text-amber-300/90 font-semibold">💬 {esc.subtitulo}</p>
                  <p className="text-[10px] text-slate-500 italic line-clamp-2">🎨 {esc.prompt_imagen}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
