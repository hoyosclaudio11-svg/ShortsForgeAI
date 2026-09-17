// Proxy server-side para ShortsForge AI.
// Evita CORS y mantiene las API keys fuera del bundle del navegador.
// El navegador llama a /api/guion y /api/imagen; acá se habla con la infra del ecosistema:
//   Chat:    FreeLLMAPI (localhost:3001) -> fallback OpenRouter (deepseek-chat)
//   Imagen:  FreeLLMAPI (modelo auto)    -> fallback OpenRouter flux.2-klein-4b -> Pollinations (sin key)
import type { Plugin, Connect } from 'vite';
import type { ServerResponse } from 'http';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';
import { createHash } from 'crypto';

// ── Config: env vars con prioridad, .env del ecosistema como respaldo ──
const ENV_FILE = path.resolve('E:/DelMonte/automatizacion/.env');
function leerEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const txt = fs.readFileSync(ENV_FILE, 'utf-8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
  } catch {
    // .env ausente: se usan solo las variables de entorno
  }
  return out;
}
const env = leerEnv();

const FREELLM_BASE_URL = process.env.FREELLM_BASE_URL || env.FREELLM_BASE_URL || 'http://localhost:3001/v1';
const FREELLM_API_KEY = process.env.FREELLM_API_KEY || env.FREELLM_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || '';
const LLM_MODEL = process.env.FREELLM_MODEL || env.FREELLM_MODEL || 'auto'; // "auto" deja que FreeLLMAPI elija el modelo con cuota disponible
const OR_CHAT_MODEL = process.env.OR_CHAT_MODEL || 'deepseek/deepseek-chat';
const OR_IMAGE_MODEL = process.env.OR_IMAGE_MODEL || 'black-forest-labs/flux.2-klein-4b';
const OR_BASE = 'https://openrouter.ai/api/v1/chat/completions';

// Imágenes generadas servidas en memoria (sesión del dev server).
const imageCache = new Map<string, { bytes: Buffer; mime: string }>();
let imageCounter = 0;

// Narración TTS (edge-tts vía Python, cache en memoria) — misma voz que el pipeline automático.
const ttsCache = new Map<string, { bytes: Buffer; mime: string; words: {word: string; start: number; end: number}[] }>();
const TTS_VOZ = process.env.TTS_VOZ || 'es-AR-ElenaNeural';
const PYTHON = process.env.PYTHON || 'python';
function mediaDirectory(): string {
  if (process.env.SHORTSFORGE_MEDIA_DIR) return path.resolve(process.env.SHORTSFORGE_MEDIA_DIR);
  try {
    const config = JSON.parse(fs.readFileSync(path.resolve('shortsforge.config.json'), 'utf-8'));
    if (typeof config.mediaDirectory === 'string' && config.mediaDirectory.trim()) return path.resolve(config.mediaDirectory);
  } catch { /* use workspace default */ }
  return path.resolve('.shortsforge-media');
}
const MEDIA_DIR = mediaDirectory();
fs.mkdirSync(MEDIA_DIR, { recursive: true });

// ── Banco de ganchos virales (hooks/formulas.json) con rotación de uso ──
interface HookFormula { id: string; trigger: string; formula: string; ejemplo: string; canales: string[]; dato?: boolean }
let HOOK_FORMULAS: HookFormula[] = [];
try {
  const banco = JSON.parse(fs.readFileSync(path.resolve('hooks/formulas.json'), 'utf-8'));
  if (Array.isArray(banco.formulas)) {
    HOOK_FORMULAS = banco.formulas.filter((f: any) => f && typeof f.id === 'string' && typeof f.formula === 'string' && Array.isArray(f.canales));
  }
} catch { /* banco ausente: el guion se genera sin ganchos sugeridos */ }
const USO_FILE = path.join(MEDIA_DIR, 'hooks-uso.json');
function formulasUso(): string[] {
  try {
    const uso = JSON.parse(fs.readFileSync(USO_FILE, 'utf-8'));
    return Array.isArray(uso.recientes) ? uso.recientes : [];
  } catch { return []; }
}
function elegirFormulas(canal: string, cantidad: number, excluir: string[] = []): HookFormula[] {
  const elegibles = HOOK_FORMULAS.filter(f => f.canales.includes(canal) && !excluir.includes(f.id));
  const recientes = formulasUso();
  const frescas = elegibles.filter(f => !recientes.includes(f.id));
  const pool = (frescas.length >= cantidad ? frescas : elegibles).slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, cantidad);
}
function registrarUsoFormulas(ids: string[]) {
  if (!ids.length) return;
  const recientes = [...ids, ...formulasUso().filter(id => !ids.includes(id))].slice(0, 30);
  try {
    fs.writeFileSync(USO_FILE, JSON.stringify({ recientes, actualizado: new Date().toISOString() }, null, 2));
  } catch { /* la rotación es best-effort */ }
}
function bancoPrompt(formulas: HookFormula[]): string {
  if (!formulas.length) return '';
  const lista = formulas
    .map(f => `- [${f.id} · ${f.trigger}] ${f.formula} — ej: "${f.ejemplo}"${f.dato ? ' (necesita dato real del brief)' : ''}`)
    .join('\n');
  return `\nBANCO DE GANCHOS VIRALES: elegí UNA de estas fórmulas como base del gancho (la primera narración), adaptala al tema en español rioplatense y devolvé su id en el campo "gancho_formula_id". Mezclá el scroll-stop de la fórmula con la pregunta del loop abierto. Las marcadas como "necesita dato real" solo si el brief aporta el número; jamás inventes datos.
${lista}
OBLIGATORIO: el JSON final debe incluir el campo "gancho_formula_id" con el id entre corchetes de la fórmula que usaste (si ninguna encaja, usá "libre").
`;
}

function ttsKey(texto: string): string {
  return `tts-${createHash('sha256').update(`${TTS_VOZ}:v2:${texto}`).digest('hex')}`;
}

async function ttsGenerar(texto: string) {
  const tmp = path.join(os.tmpdir(), `${ttsKey(texto)}-${Date.now()}.mp3`);
  try {
  await new Promise<void>((resolve, reject) => {
    execFile(
      PYTHON,
      [path.resolve('scripts/tts.py'), texto, TTS_VOZ, tmp],
      { timeout: 90_000, windowsHide: true },
      (err) => (err ? reject(err) : resolve())
    );
  });
    return { bytes: fs.readFileSync(tmp), words: JSON.parse(fs.readFileSync(tmp + '.json', 'utf-8')) };
  } finally {
    for (const file of [tmp, tmp + '.json']) { try { fs.unlinkSync(file); } catch { /* temp */ } }
  }
}

// ── Laboratorio de virales: banco propio de ganchos comprobados ──
interface ViralEntry {
  id: string; fecha: string; canal: string; enlace: string; transcripcion: string; metricas: string; notas: string;
  analisis: { resumen: string; ganchos: { texto: string; trigger?: string }[]; beats: { desde: string; hasta: string; funcion: string; nota?: string }[]; porQueFunciona?: string; patrones?: string[]; aplicable?: string };
}
const BANCO_FILE = path.join(MEDIA_DIR, 'banco_virales.json');
function leerBanco(): ViralEntry[] {
  try {
    const banco = JSON.parse(fs.readFileSync(BANCO_FILE, 'utf-8'));
    return Array.isArray(banco.virales) ? banco.virales : [];
  } catch { return []; }
}
function guardarBanco(virales: ViralEntry[]) {
  fs.writeFileSync(BANCO_FILE, JSON.stringify({ virales }, null, 2));
}
function ganchosComprobados(canal: string, max = 6): string[] {
  const banco = leerBanco();
  const relevantes = canal === 'General' ? banco : banco.filter(v => v.canal === canal);
  const ganchos: string[] = [];
  for (const viral of relevantes) {
    for (const gancho of viral.analisis?.ganchos || []) {
      const texto = String(gancho.texto || '').trim();
      if (texto && !ganchos.some(g => g.toLowerCase() === texto.toLowerCase())) ganchos.push(texto);
      if (ganchos.length >= max) return ganchos;
    }
  }
  return ganchos;
}
function comprobadosPrompt(canal: string): string {
  const ganchos = ganchosComprobados(canal);
  if (!ganchos.length) return '';
  return `\nGANCHOS COMPROBADOS EN TU NICHO (extraídos de virales reales que analizaste; inspirate en su estructura, no los copies textual):
${ganchos.map(g => `- ${g}`).join('\n')}
`;
}

const GUION_SYSTEM_PROMPT = `Escribís Shorts originales en español rioplatense. Devolvé SOLO JSON.
Usá exactamente 6 escenas. Cada escena aporta información o acción nueva, sin relleno.
Estructura de loop abierto (obligatoria): la escena 1 abre con una PREGUNTA intrigante que el short recién responde en la ÚLTIMA escena, e invitá a quedarse hasta el final en la misma frase ("¿Sabés qué...? Quedate que al final te lo muestro.").
Las escenas 2 a 5 alimentan la curiosidad con pistas parciales sin cerrar el loop; la última escena revela la respuesta de forma directa y clara.
El campo hook debe coincidir con la primera narración; los subtítulos deben reproducir la narración.
El cierre resuelve la promesa del inicio; evitá pedir like y suscripción por defecto.
No inventes estudios, porcentajes, citas, resultados deportivos ni hechos históricos.
Si el tema es ficción, tratá sus hechos como ficción. Si faltan datos factuales, pedí que se aporten en el campo descripcion y evitá afirmaciones no sustentadas.
Los prompts de imagen deben repetir los rasgos del personaje y el estilo visual, variar encuadres y componer para 9:16 sin texto dibujado.
Formato: {"titulo":"hasta 70 caracteres","hook":"...","cta":"","descripcion":"...","hashtags":["#Shorts"],"escenas":[{"narracion":"...","subtitulo":"...","prompt_imagen":"..."}]}`;

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, obj: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

// Repara los errores de JSON típicos de un LLM: comas faltantes entre
// elementos de un array/objeto y comas de más al final (trailing commas).
function repararJsonLlm(text: string): string {
  let t = text;
  t = t.replace(/\}\s*\{/g, '},{');
  t = t.replace(/\}\s*"/g, '},"');
  t = t.replace(/\]\s*\[/g, '],[');
  t = t.replace(/\]\s*"/g, '],"');
  t = t.replace(/,\s*\}/g, '}');
  t = t.replace(/,\s*\]/g, ']');
  return t;
}

function parseLlmJson(text: string): any {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('El LLM no devolvió JSON válido');
  const candidato = clean.slice(start, end + 1);
  try {
    return JSON.parse(candidato);
  } catch {
    // 1er salvataje: reparar comas mal puestas; si no alcanza, el handler
    // reintenta pidiéndole al LLM que arregle su propia respuesta.
    const reparado = repararJsonLlm(candidato);
    try {
      return JSON.parse(reparado);
    } catch {
      throw new Error('El LLM devolvió JSON inválido');
    }
  }
}

// ── Chat: FreeLLMAPI con fallback a OpenRouter ──
async function llamarChatFreeLlmapi(messages: { role: string; content: string }[]): Promise<string> {
  if (!FREELLM_API_KEY) throw new Error('FreeLLMAPI: sin API key configurada');
  const resp = await fetch(`${FREELLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FREELLM_API_KEY}` },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 2500,
      extra_body: { thinking: { type: 'disabled' } },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!resp.ok) {
    throw new Error(`FreeLLMAPI chat error ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('FreeLLMAPI no devolvió contenido');
  return content;
}

async function llamarChatOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter: sin API key configurada');
  const resp = await fetch(OR_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://shortsforge.test',
      'X-Title': 'ShortsForgeAI',
    },
    body: JSON.stringify({ model: OR_CHAT_MODEL, messages, temperature: 0.8, max_tokens: 2500 }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!resp.ok) {
    throw new Error(`OpenRouter chat error ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter no devolvió contenido');
  return content;
}

async function llamarChat(messages: { role: string; content: string }[]): Promise<{ text: string; fuente: string }> {
  const errores: string[] = [];
  try {
    return { text: await llamarChatFreeLlmapi(messages), fuente: 'freellmapi' };
  } catch (e: any) {
    errores.push(e?.message || String(e));
  }
  try {
    return { text: await llamarChatOpenRouter(messages), fuente: 'openrouter' };
  } catch (e: any) {
    errores.push(e?.message || String(e));
  }
  throw new Error(`Chat agotó la cascada (FreeLLMAPI → OpenRouter):\n- ${errores.join('\n- ')}`);
}

// ── Imagen: FreeLLMAPI (modelo auto) → OpenRouter flux.2-klein-4b → Pollinations ──
async function generarImagenFreellmapi(prompt: string): Promise<string | null> {
  if (!FREELLM_API_KEY) return null;
  for (const size of ['1024x1792', '1024x1024']) {
    try {
      const resp = await fetch(`${FREELLM_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FREELLM_API_KEY}` },
        body: JSON.stringify({ model: 'auto', prompt, n: 1, size }),
        signal: AbortSignal.timeout(180_000),
      });
      if (resp.status !== 200) continue;
      const data = await resp.json();
      const b64 = data?.data?.[0]?.b64_json;
      if (b64) return b64;
    } catch {
      // probar siguiente tamaño
    }
  }
  return null;
}

async function generarImagenOpenRouter(prompt: string): Promise<string | null> {
  if (!OPENROUTER_API_KEY) return null;
  try {
    const resp = await fetch(OR_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://shortsforge.test',
        'X-Title': 'ShortsForgeAI',
      },
      body: JSON.stringify({ model: OR_IMAGE_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 4000 }),
      signal: AbortSignal.timeout(180_000),
    });
    if (resp.status !== 200) return null;
    const data = await resp.json();
    const imgUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
    if (!imgUrl.startsWith('data:image/')) return null;
    return imgUrl.split(',')[1] || null;
  } catch {
    return null;
  }
}

function pollinationsUrl(prompt: string): string {
  const p = `${prompt}, cinematic vertical 9:16 storybook`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=800&height=1200&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1e9)}`;
}

export function aiProxyPlugin(): Plugin {
  const configure = (server: { middlewares: Connect.Server }) => {
      const mid = server.middlewares;

      mid.use('/ttsaudio', (req, res) => {
        const id = (req.url || '').replace(/^\//, '').split('?')[0];
        if (/^tts-[a-f0-9]{64}$/.test(id) && !ttsCache.has(id)) {
          try { ttsCache.set(id, { bytes: fs.readFileSync(path.join(MEDIA_DIR, id + '.mp3')), mime: 'audio/mpeg', words: JSON.parse(fs.readFileSync(path.join(MEDIA_DIR, id + '.json'), 'utf-8')) }); } catch { /* not cached */ }
        }
        const tts = ttsCache.get(id);
        if (!tts) {
          res.statusCode = 404;
          res.end('not found');
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', tts.mime);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.end(tts.bytes);
      });

      mid.use('/genimg', (req, res) => {
        const id = (req.url || '').replace(/^\//, '').split('?')[0];
        if (/^img-[0-9]+-[0-9]+$/.test(id) && !imageCache.has(id)) {
          try { imageCache.set(id, { bytes: fs.readFileSync(path.join(MEDIA_DIR, id + '.png')), mime: 'image/png' }); } catch { /* not cached */ }
        }
        const img = imageCache.get(id);
        if (!img) {
          res.statusCode = 404;
          res.end('not found');
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', img.mime);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.end(img.bytes);
      });

      mid.use('/api', async (req, res) => {
        // Connect quita el prefijo '/api' de req.url → comparamos sin él.
        const url = (req.url || '').split('?')[0];
        try {
          if (url === '/guion' && req.method === 'POST') {
            const body = JSON.parse((await readBody(req)) || '{}');
            const tema = String(body.tema || '').trim().slice(0, 6000);
            const seconds = [15, 20, 30].includes(Number(body.seconds)) ? Number(body.seconds) : 20;
            const channel = ['Roldán', 'Fútbol Medieval'].includes(body.channel) ? body.channel : 'General';
            const brief = String(body.brief || '').slice(0, 4000);
            const userPrompt = `Tema: ${tema}. Canal: ${channel}. Indicaciones del creador: ${brief}.
Duración objetivo ${seconds}s: máximo ${Math.floor(seconds * 2.5)} palabras en total entre las 6 narraciones. Primera escena muy breve.
${channel === 'Fútbol Medieval' ? 'Estética medieval para fútbol. No atribuyas hechos inventados a jugadores reales; distinguí fantasía de información deportiva.' : 'Adaptá el estilo al tema y a las indicaciones, sin suponer la temática del canal.'}
No te olvides del campo "gancho_formula_id" en el JSON.`;
            if (!tema) return sendJson(res, 400, { error: 'Falta el tema' });
            const systemPrompt = GUION_SYSTEM_PROMPT + bancoPrompt(elegirFormulas(channel, 5)) + comprobadosPrompt(channel);
            let { text, fuente } = await llamarChat([
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ]);
            let guion: any;
            try {
              guion = parseLlmJson(text);
            } catch {
              // Reintento: le pasamos su propia respuesta rota para que la arregle
              const retry = await llamarChat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
                { role: 'assistant', content: text.slice(0, 6000) },
                { role: 'user', content: 'Tu respuesta anterior no es JSON válido. Devolvé SOLO el JSON completo corregido, sin explicaciones ni markdown.' },
              ]);
              text = retry.text;
              fuente = retry.fuente;
              guion = parseLlmJson(text);
            }
            if (!Array.isArray(guion.escenas) || guion.escenas.length !== 6) {
              throw new Error('El guion devuelto no tiene 6 escenas');
            }
            for (const field of ['titulo', 'hook', 'descripcion', 'cta']) {
              if (typeof guion[field] !== 'string') throw new Error(`Guion inválido: ${field}`);
            }
            if (!Array.isArray(guion.hashtags) || !guion.hashtags.every((h: unknown) => typeof h === 'string')) throw new Error('Hashtags inválidos');
            for (const scene of guion.escenas) {
              if (!scene || !['narracion', 'subtitulo', 'prompt_imagen'].every(key => typeof scene[key] === 'string' && scene[key].trim())) throw new Error('Escena incompleta: volvé a generar el guion');
            }
            const count = guion.escenas.reduce((n: number, scene: {narracion: string}) => n + scene.narracion.trim().split(/\s+/).length, 0);
            if (count > Math.ceil(seconds * 3)) throw new Error('El guion excede la duración solicitada. Volvé a generar para acortarlo.');
            // El LLM a veces devuelve el id con formato raro ("fórmula 071", "[071]") → extraer los 3 dígitos.
            const crudoFormula = guion.gancho_formula_id != null ? String(guion.gancho_formula_id) : '';
            if (crudoFormula) console.log(`[guion] gancho_formula_id crudo del LLM: ${JSON.stringify(crudoFormula)}`);
            const matchFormula = crudoFormula.match(/\d{3}/);
            const formulaElegida = (matchFormula && HOOK_FORMULAS.find(f => f.id === matchFormula[0])) || null;
            guion.gancho_formula_id = formulaElegida ? formulaElegida.id : 'libre';
            guion.hook = guion.escenas[0].narracion;
            registrarUsoFormulas(formulaElegida ? [formulaElegida.id] : []);
            return sendJson(res, 200, { ok: true, guion, fuente, ganchoFormula: formulaElegida });
          }

          if (url === '/gancho' && req.method === 'POST') {
            const body = JSON.parse((await readBody(req)) || '{}');
            const tema = String(body.tema || '').trim().slice(0, 6000);
            const channel = ['Roldán', 'Fútbol Medieval'].includes(body.channel) ? body.channel : 'General';
            const brief = String(body.brief || '').slice(0, 4000);
            const narracionActual = String(body.narracion || '').trim().slice(0, 500);
            const formulaActual = typeof body.gancho_formula_id === 'string' ? body.gancho_formula_id : '';
            if (!tema || !narracionActual) return sendJson(res, 400, { error: 'Faltan el tema y la narración actual' });
            const systemPrompt = `Reescribís SOLO el gancho (la primera narración) de un short en español rioplatense. Devolvé SOLO JSON.
El gancho nuevo debe detener el scroll en 3 segundos, conservar el sentido del short, mantener el loop abierto (si el original abría con pregunta, el nuevo también abre con pregunta) y no inventar datos.
${bancoPrompt(elegirFormulas(channel, 5, formulaActual ? [formulaActual] : []))}
Formato: {"gancho":"...","titulo":"hasta 70 caracteres","gancho_formula_id":"id de la fórmula usada"}`;
            const userPrompt = `Tema: ${tema}. Canal: ${channel}. Indicaciones del creador: ${brief}.
Narración actual de la escena 1: "${narracionActual}"
Devolvé un gancho nuevo, distinto del actual.`;
            let { text, fuente } = await llamarChat([
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ]);
            let data: any;
            try {
              data = parseLlmJson(text);
            } catch {
              const retry = await llamarChat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
                { role: 'assistant', content: text.slice(0, 3000) },
                { role: 'user', content: 'Tu respuesta anterior no es JSON válido. Devolvé SOLO el JSON corregido, sin explicaciones ni markdown.' },
              ]);
              text = retry.text;
              fuente = retry.fuente;
              data = parseLlmJson(text);
            }
            if (typeof data.gancho !== 'string' || !data.gancho.trim()) throw new Error('El LLM no devolvió un gancho válido');
            const crudoFormula = data.gancho_formula_id != null ? String(data.gancho_formula_id) : '';
            const matchFormula = crudoFormula.match(/\d{3}/);
            const formulaElegida = (matchFormula && HOOK_FORMULAS.find(f => f.id === matchFormula[0])) || null;
            registrarUsoFormulas(formulaElegida ? [formulaElegida.id] : []);
            return sendJson(res, 200, {
              ok: true,
              gancho: data.gancho.trim(),
              titulo: typeof data.titulo === 'string' && data.titulo.trim() ? data.titulo.trim() : '',
              ganchoFormula: formulaElegida,
              fuente,
            });
          }

          if (url === '/analisis' && req.method === 'GET') {
            return sendJson(res, 200, { ok: true, virales: leerBanco() });
          }

          if (url === '/analisis' && req.method === 'DELETE') {
            const id = new URLSearchParams((req.url || '').split('?')[1] || '').get('id') || '';
            const banco = leerBanco();
            const filtrado = banco.filter(v => v.id !== id);
            if (filtrado.length === banco.length) return sendJson(res, 404, { error: 'No existe ese análisis' });
            guardarBanco(filtrado);
            return sendJson(res, 200, { ok: true });
          }

          if (url === '/analisis' && req.method === 'POST') {
            const body = JSON.parse((await readBody(req)) || '{}');
            const canal = ['Roldán', 'Fútbol Medieval'].includes(body.canal) ? body.canal : 'General';
            const transcripcion = String(body.transcripcion || '').trim().slice(0, 20000);
            const enlace = String(body.enlace || '').trim().slice(0, 500);
            const metricas = String(body.metricas || '').trim().slice(0, 300);
            const notas = String(body.notas || '').trim().slice(0, 2000);
            if (transcripcion.length < 40) return sendJson(res, 400, { error: 'Pegá la transcripción del viral (mínimo 40 caracteres)' });
            const systemPrompt = `Analizás Shorts/TikTok/Reels virales para replicar su estructura en otros videos. Devolvé SOLO JSON.
Campos: "resumen" (una línea), "ganchos" (array de {"texto","trigger"}: el gancho tal como aparece y a qué fórmula psicológica responde), "beats" (array de {"desde","hasta","funcion","nota"} mapeando el video: gancho, setup, desarrollo, giro, cierre), "porQueFunciona" (1-2 frases), "patrones" (array de strings concretos: ritmo, tipos de plano, texto en pantalla, música), "aplicable" (cómo adaptarlo al canal indicado).
No inventes métricas que no te pasen; si la transcripción es parcial, analizá solo lo que hay.`;
            const userPrompt = `Canal propio donde aplicarlo: ${canal}. Métricas del viral: ${metricas || 'no informadas'}. Notas del creador: ${notas || '—'}.
Transcripción/descripción del viral:
${transcripcion}`;
            let { text, fuente } = await llamarChat([
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ]);
            let analisis: any;
            try {
              analisis = parseLlmJson(text);
            } catch {
              const retry = await llamarChat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
                { role: 'assistant', content: text.slice(0, 6000) },
                { role: 'user', content: 'Tu respuesta anterior no es JSON válido. Devolvé SOLO el JSON completo corregido, sin explicaciones ni markdown.' },
              ]);
              text = retry.text;
              fuente = retry.fuente;
              analisis = parseLlmJson(text);
            }
            if (typeof analisis.resumen !== 'string' || !Array.isArray(analisis.ganchos)) throw new Error('El análisis devuelto está incompleto');
            const entry: ViralEntry = {
              id: `viral-${Date.now()}`,
              fecha: new Date().toISOString(),
              canal, enlace, transcripcion, metricas, notas,
              analisis: {
                resumen: analisis.resumen,
                ganchos: (Array.isArray(analisis.ganchos) ? analisis.ganchos : []).map((g: any) => ({ texto: String(g?.texto || ''), trigger: g?.trigger ? String(g.trigger) : undefined })).filter((g: any) => g.texto),
                beats: (Array.isArray(analisis.beats) ? analisis.beats : []).map((b: any) => ({ desde: String(b?.desde || ''), hasta: String(b?.hasta || ''), funcion: String(b?.funcion || ''), nota: b?.nota ? String(b.nota) : undefined })).filter((b: any) => b.funcion),
                porQueFunciona: typeof analisis.porQueFunciona === 'string' ? analisis.porQueFunciona : undefined,
                patrones: Array.isArray(analisis.patrones) ? analisis.patrones.map((p: any) => String(p)).slice(0, 10) : undefined,
                aplicable: typeof analisis.aplicable === 'string' ? analisis.aplicable : undefined,
              },
            };
            const banco = leerBanco();
            banco.unshift(entry);
            if (banco.length > 50) banco.length = 50;
            guardarBanco(banco);
            return sendJson(res, 200, { ok: true, viral: entry, fuente });
          }

          if (url === '/tts' && req.method === 'POST') {
            const body = JSON.parse((await readBody(req)) || '{}');
            const texto = String(body.texto || '').trim();
            if (!texto) return sendJson(res, 400, { error: 'Falta el texto' });
            const key = ttsKey(texto);
            if (!ttsCache.has(key)) {
              try { ttsCache.set(key, { bytes: fs.readFileSync(path.join(MEDIA_DIR, key + '.mp3')), mime: 'audio/mpeg', words: JSON.parse(fs.readFileSync(path.join(MEDIA_DIR, key + '.json'), 'utf-8')) }); } catch { /* generate below */ }
            }
            if (!ttsCache.has(key)) {
              try {
                const audio = await ttsGenerar(texto);
                ttsCache.set(key, { ...audio, mime: 'audio/mpeg' });
                fs.writeFileSync(path.join(MEDIA_DIR, key + '.mp3'), audio.bytes);
                fs.writeFileSync(path.join(MEDIA_DIR, key + '.json'), JSON.stringify(audio.words));
              } catch (e: any) {
                return sendJson(res, 500, {
                  error: `edge-tts falló: ${e?.message || e}`,
                  hint: '¿Python con edge-tts instalado? (pip install edge-tts)',
                });
              }
            }
            return sendJson(res, 200, { ok: true, url: `/ttsaudio/${key}`, voz: TTS_VOZ, words: ttsCache.get(key)!.words });
          }

          if (url === '/imagen' && req.method === 'POST') {
            const body = JSON.parse((await readBody(req)) || '{}');
            const prompt = String(body.prompt || '').trim();
            if (!prompt) return sendJson(res, 400, { error: 'Falta el prompt' });

            const b64 = await generarImagenFreellmapi(prompt);
            if (b64) {
              imageCounter += 1;
              const id = `img-${imageCounter}-${Date.now()}`;
              imageCache.set(id, { bytes: Buffer.from(b64, 'base64'), mime: 'image/png' });
              fs.writeFileSync(path.join(MEDIA_DIR, id + '.png'), Buffer.from(b64, 'base64'));
              return sendJson(res, 200, { ok: true, url: `/genimg/${id}`, fuente: 'freellmapi' });
            }

            const b64Or = await generarImagenOpenRouter(prompt);
            if (b64Or) {
              imageCounter += 1;
              const id = `img-${imageCounter}-${Date.now()}`;
              imageCache.set(id, { bytes: Buffer.from(b64Or, 'base64'), mime: 'image/png' });
              fs.writeFileSync(path.join(MEDIA_DIR, id + '.png'), Buffer.from(b64Or, 'base64'));
              return sendJson(res, 200, { ok: true, url: `/genimg/${id}`, fuente: 'openrouter-flux' });
            }

            // Fallback final sin key: Pollinations
            return sendJson(res, 200, { ok: true, url: pollinationsUrl(prompt), fuente: 'pollinations' });
          }

          return sendJson(res, 404, { error: 'Ruta no encontrada' });
        } catch (e: any) {
          const msg = e?.message || String(e);
          const status = /fetch failed|ECONNREFUSED|socket/i.test(msg) ? 502 : 500;
          return sendJson(res, status, {
            error: msg,
            hint:
              status === 502
                ? 'No se pudo conectar con FreeLLMAPI (localhost:3001) ni OpenRouter. Revisá la red o las keys en E:\\DelMonte\\automatizacion\\.env'
                : undefined,
          });
        }
      });
  };
  return { name: 'shortsforge-ai-proxy', configureServer: configure, configurePreviewServer: configure };
}
