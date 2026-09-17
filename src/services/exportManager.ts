import JSZip from 'jszip';
import { VideoProject } from '../types/video';
import { PYTHON_CODEBASE_FILES } from '../data/pythonCodebase';

export async function downloadPythonProjectZip(currentProject?: VideoProject) {
  const zip = new JSZip();

  // Add all Python files
  PYTHON_CODEBASE_FILES.forEach((file) => {
    zip.file(file.path, file.content);
  });

  // Add sample project metadata and configs
  if (currentProject) {
    const projectMeta = {
      project_id: currentProject.id,
      title: currentProject.title,
      topic: currentProject.topic,
      total_duration: currentProject.totalDuration,
      fps: currentProject.fps,
      width: currentProject.width,
      height: currentProject.height,
      music_genre: currentProject.musicGenre,
      subtitle_style: currentProject.subtitleStyle,
      metadata: currentProject.metadata,
      scenes: currentProject.scenes
    };
    zip.file('project_active_config.json', JSON.stringify(projectMeta, null, 2));
  }

  // Add README.md
  const readmeContent = `# ShortsForge AI — YouTube Shorts Automated Generator (1080x1920)

Senior Multimedia Engineering Video Pipeline built with Python 3.11 and FFmpeg.

## Quickstart Local:
\`\`\`bash
# 1. Dar permisos de ejecución
chmod +x run_local.sh

# 2. Ejecutar generador de 5 variantes de 60s
./run_local.sh "Misterios del Cosmos y Agujeros Negros"
\`\`\`

## O con Docker:
\`\`\`bash
docker build -t shortsforge-ai .
docker run -v $(pwd)/output_shorts:/app/output_shorts shortsforge-ai --topic "5 Hábitos de Productividad" --variants 5
\`\`\`

## Salida generada:
- Videos verticales MP4 en 1080x1920 (H.264 / AAC)
- Miniaturas verticales optimizadas para alto CTR
- Archivos JSON con título, descripción y hashtags para YouTube Shorts
`;
  zip.file('README.md', readmeContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ShortsForge_Python311_FFmpeg_Pipeline.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadJsonMetadata(project: VideoProject) {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(
      {
        youtube_shorts_title: project.metadata.title,
        description: project.metadata.description,
        hashtags: project.metadata.hashtags,
        tags: project.metadata.tags,
        viral_hook: project.metadata.viralHook,
        call_to_action: project.metadata.callToAction,

        scenes_breakdown: project.scenes.map((s) => ({
          scene: s.order,
          duration_seconds: s.duration,
          prompt: s.imagePrompt,
          narration: s.narrationText,
          subtitles: s.subtitles.text
        }))
      },
      null,
      2
    )
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `${project.sampleFileName || 'shorts_video'}_metadata.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
