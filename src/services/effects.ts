import { parseGIF, decompressFrames } from 'gifuct-js';
import type { Scene, VideoProject } from '../types/video';

export const STYLES = [
  { id: 'documental', label: 'Documental', music: 'cinematic_epic', captions: 'cinematic_gold' },
  { id: 'epico', label: 'Fútbol épico', music: 'dark_suspense', captions: 'capcut_pop' },
  { id: 'humor', label: 'Humor y memes', music: 'lofi_chill_beat', captions: 'capcut_pop' },
  { id: 'explicativo', label: 'Explicación y gráficos', music: 'ambient_deep', captions: 'clean_minimal' },
] as const;

export function applyStyle(project: VideoProject, id: VideoProject['visualStyle']): VideoProject {
  const style = STYLES.find(style => style.id === id) || STYLES[0];
  return { ...project, visualStyle: style.id, musicGenre: style.music, subtitleStyle: style.captions,
    motionIntensity: style.id === 'documental' ? 'suave' : 'dinamica',
    scenes: project.scenes.map((scene, index) => ({ ...scene,
      cameraMotion: index % 2 ? 'pan_left' : 'zoom_in', transition: 'crossfade',
      soundEffect: index === 0 ? (style.id === 'humor' ? 'comedy' : style.id === 'epico' ? 'impact' : 'whoosh') : 'none',
      soundVolume: 0.18,
    })),
  };
}

type GifFrame = { canvas: HTMLCanvasElement; end: number };
const gifs = new Map<string, { frames: GifFrame[]; duration: number }>();

export async function loadGif(url: string) {
  if (gifs.has(url)) return;
  const response = await fetch(url);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 5_000_000) throw new Error('El GIF debe pesar menos de 5 MB.');
  const parsed = parseGIF(bytes);
  const width = parsed.lsd.width, height = parsed.lsd.height;
  const count = parsed.frames.filter(frame => 'image' in frame).length;
  if (width * height * count > 16_000_000) throw new Error('Este GIF ocupa demasiada memoria. Usá uno más corto o de menor resolución.');
  const frames = decompressFrames(parsed, true);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const output: GifFrame[] = [];
  let duration = 0;
  for (const frame of frames) {
    const previous = ctx.getImageData(0, 0, width, height);
    const patch = document.createElement('canvas'); patch.width = frame.dims.width; patch.height = frame.dims.height;
    const data = patch.getContext('2d')!.createImageData(patch.width, patch.height);
    data.data.set(frame.patch); patch.getContext('2d')!.putImageData(data, 0, 0);
    ctx.drawImage(patch, frame.dims.left, frame.dims.top);
    const snapshot = document.createElement('canvas'); snapshot.width = width; snapshot.height = height;
    snapshot.getContext('2d')!.drawImage(canvas, 0, 0);
    duration += Math.max(20, frame.delay || 100) / 1000;
    output.push({ canvas: snapshot, end: duration });
    if (frame.disposalType === 2) ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    if (frame.disposalType === 3) ctx.putImageData(previous, 0, 0);
  }
  if (!output.length) throw new Error('El GIF no contiene fotogramas.');
  if (gifs.size >= 8) gifs.delete(gifs.keys().next().value!);
  gifs.set(url, { frames: output, duration });
}

export function drawOverlay(ctx: CanvasRenderingContext2D, scene: Scene, time: number) {
  const overlay = scene.overlay;
  if (!overlay || overlay.kind === 'none') return;
  const local = time - (overlay.start || 0);
  const duration = overlay.duration ?? 1.5;
  if (local < 0 || local > duration) return;
  const enter = 1 - Math.pow(1 - Math.min(1, local / 0.18), 3);
  ctx.save(); ctx.globalAlpha = Math.min(1, (duration - local) / 0.15);
  ctx.translate(500, 930 + (1 - enter) * 80); ctx.scale(0.85 + enter * 0.15, 0.85 + enter * 0.15);
  if (overlay.kind === 'gif' && overlay.url) {
    const gif = gifs.get(overlay.url);
    const frame = gif?.frames.find(frame => frame.end > local % gif.duration);
    if (frame) { const width = Math.min(520, frame.canvas.width * 2), height = Math.min(420, width * frame.canvas.height / frame.canvas.width); ctx.drawImage(frame.canvas, -width / 2, -height / 2, width, height); }
  } else {
    ctx.fillStyle = 'rgba(8,12,24,.92)'; ctx.beginPath(); ctx.roundRect(-370, -120, 740, 240, 32); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 60px sans-serif'; ctx.fillStyle = '#fde047';
    if (overlay.kind === 'reaction') {
      const text = (overlay.text || '¡¿QUÉ?!').slice(0, 35);
      const width = ctx.measureText(text).width;
      if (width > 680) ctx.font = `900 ${Math.floor(60 * 680 / width)}px sans-serif`;
      ctx.rotate(Math.sin(local * 14) * 0.025 * Math.exp(-local * 3)); ctx.fillText(text, 0, 0);
    } else if (overlay.kind === 'chart') {
      const value = Math.max(0, Math.min(100, overlay.value ?? 0));
      const fraction = Math.min(1, local / 0.8);
      ctx.font = '700 36px sans-serif'; ctx.fillStyle = 'white';
      ctx.fillText((overlay.label || 'Dato aportado').slice(0, 35), 0, -60);
      ctx.fillStyle = '#334155'; ctx.fillRect(-310, -5, 620, 38);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-310, -5, 620 * value / 100 * fraction, 38);
      ctx.font = '900 42px sans-serif'; ctx.fillText(`${Math.round(value * fraction)}%`, 0, 80);
    }
  }
  ctx.restore();
}

export function scheduleEffect(context: AudioContext, destination: AudioNode, scene: Scene, start: number) {
  const kind = scene.soundEffect;
  if (!kind || kind === 'none' || kind === 'custom') return;
  const duration = Math.min(scene.duration, kind === 'suspense' ? 1.4 : 0.45);
  const oscillator = context.createOscillator(); const gain = context.createGain();
  oscillator.type = kind === 'comedy' ? 'triangle' : 'sine';
  const frequencies = kind === 'impact' ? [150, 35] : kind === 'comedy' ? [600, 120] : kind === 'whoosh' ? [220, 1500] : [85, 150];
  oscillator.frequency.setValueAtTime(frequencies[0], start);
  oscillator.frequency.exponentialRampToValueAtTime(frequencies[1], start + duration);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(0.5, scene.soundVolume ?? 0.18)), start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain); gain.connect(destination); oscillator.start(start); oscillator.stop(start + duration);
}
