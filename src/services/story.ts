import type { VideoProject, WordTimestamp } from '../types/video';
import { generationEvent } from './generationLog';

export const CHANNELS = ['General', 'Roldán', 'Fútbol Medieval'] as const;
export interface Story {
  titulo: string; hook: string; cta: string; descripcion: string; hashtags: string[];
  escenas: { narracion: string; subtitulo: string; prompt_imagen: string }[];
}

export async function requestApi<T>(route: string, body: unknown): Promise<T> {
  generationEvent(`Iniciando ${route}`);
  try {
  const response = await fetch(`/api/${route}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(300_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
  generationEvent(`Completado ${route}`);
  return data;
  } catch (error) {
    generationEvent(`Falló ${route}`, true);
    throw error;
  }
}

export async function prepareVoice(text: string) {
  const data = await requestApi<{ url: string; words: WordTimestamp[] }>('tts', { texto: text });
  const response = await fetch(data.url);
  if (!response.ok) throw new Error('No se pudo descargar la narración.');
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(await response.arrayBuffer());
    if (!(audio.duration > 0)) throw new Error('La narración está vacía.');
    return { url: data.url, duration: audio.duration, words: data.words };
  } finally { await context.close(); }
}

export function storyProject(story: Story, topic: string, images: string[], channel = 'General'): VideoProject {
  const scenes = story.escenas.map((scene, i) => ({
    id: `scene-${i}`, order: i + 1, duration: Math.max(2, scene.narracion.split(/\s+/).length / 2.8 + 0.2),
    imageUrl: images[i], imagePrompt: scene.prompt_imagen, narrationText: scene.narracion,
    subtitles: { text: scene.narracion }, cameraMotion: i % 2 ? 'pan_left' as const : 'zoom_in' as const,
    transition: 'crossfade' as const, filter: 'cinematic_warm' as const,
  }));
  return {
    id: `ai-${crypto.randomUUID()}`, title: story.titulo, topic, channel, variantIndex: 1,
    variantStyleName: 'Historia original', aspectRatio: '9:16', width: 1080, height: 1920,
    totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0), fps: 30,
    musicGenre: 'cinematic_epic', musicVolume: 0.2, voiceSpeed: 1,
    subtitleStyle: 'karaoke_active', thumbnailUrl: images[0], thumbnailHeadline: story.hook,
    thumbnailBadgeText: channel, createdAt: new Date().toISOString(), scenes,
    metadata: { title: story.titulo, description: story.descripcion, tags: [channel, topic],
      hashtags: story.hashtags, viralHook: story.hook, callToAction: story.cta,
      soundtrackName: 'Música sintetizada', targetAudience: channel, estimatedCTR: 'Sin datos' },
  };
}

export async function prepareProject(project: VideoProject): Promise<VideoProject> {
  const scenes = [];
  for (const scene of project.scenes) {
    const voice = await prepareVoice(scene.narrationText);
    scenes.push({ ...scene, duration: voice.duration + 0.2, narrationAudioUrl: voice.url,
      subtitles: { text: scene.narrationText, words: voice.words } });
  }
  return { ...project, scenes, totalDuration: scenes.reduce((sum, scene) => sum + scene.duration, 0) };
}
