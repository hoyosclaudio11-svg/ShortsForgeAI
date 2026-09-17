import type { VideoProject } from '../types/video';
import { requestApi, storyProject, type Story } from './story';

export async function generateFiveVariantsForTopic(topic: string, channel = 'General', progress?: (index: number) => void): Promise<VideoProject[]> {
  const angles = ['Pregunta concreta', 'Acción inmediata', 'Contraste inesperado', 'Decisión difícil', 'Revelación visual'];
  const projects: VideoProject[] = [];
  for (const [index, angle] of angles.entries()) {
    progress?.(index);
    const { guion } = await requestApi<{guion: Story}>('guion', {
      tema: topic, channel, seconds: 20,
      brief: `Apertura: ${angle}. Elegí un enfoque diferente a estos ya usados: ${projects.map(p => p.metadata.viralHook).join('; ')}`,
    });
    const images: string[] = [];
    for (const scene of guion.escenas) {
      const { url } = await requestApi<{url: string}>('imagen', { prompt: scene.prompt_imagen });
      images.push(url);
    }
    const project = storyProject(guion, topic, images, channel);
    projects.push({ ...project, variantIndex: index + 1, variantStyleName: angle, motionIntensity: 'dinamica' });
  }
  return projects;
}
