import type { VideoProject } from '../types/video';
import { audioSynthesizer } from './audioSynthesizer';
import { scheduleEffect } from './effects';

export async function exportVideo(project: VideoProject,
  draw: (ctx: CanvasRenderingContext2D, time: number) => void,
  progress: (percent: number) => void, signal: AbortSignal) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext('2d')!;
  const audio = new AudioContext();
  const sources: AudioBufferSourceNode[] = [];
  let videoStream: MediaStream | undefined;
  let recorder: MediaRecorder | undefined;
  try {
    const buffers = await Promise.all(project.scenes.map(async scene => {
      if (!scene.narrationAudioUrl) throw new Error('Falta la narración de una escena.');
      const response = await fetch(scene.narrationAudioUrl, { signal });
      if (!response.ok) throw new Error('No se pudo cargar el audio.');
      return audio.decodeAudioData(await response.arrayBuffer());
    }));
    const effects = await Promise.all(project.scenes.map(async scene => {
      if (scene.soundEffect !== 'custom') return null;
      if (!scene.soundUrl) throw new Error('Cargá el sonido personalizado o elegí otro efecto.');
      const response = await fetch(scene.soundUrl, { signal });
      if (!response.ok) throw new Error('No se pudo cargar un efecto sonoro.');
      return audio.decodeAudioData(await response.arrayBuffer());
    }));
    signal.throwIfAborted();
    await document.fonts.ready;
    const mime = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']
      .find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) throw new Error('Este navegador no admite exportación de video.');
    await audio.resume();
    const destination = audio.createMediaStreamDestination();
    audioSynthesizer.stopSpeech();
    audioSynthesizer.playTrack(project.musicGenre, project.musicVolume * 0.35);
    const music = audioSynthesizer.getAudioStream();
    if (music) audio.createMediaStreamSource(music).connect(destination);
    draw(ctx, 0);
    videoStream = canvas.captureStream(project.fps);
    const stream = new MediaStream([...videoStream.getTracks(), ...destination.stream.getAudioTracks()]);
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    const start = audio.currentTime + 0.1;
    let offset = 0;
    buffers.forEach((buffer, index) => {
      const source = audio.createBufferSource();
      source.buffer = buffer; source.connect(destination);
      source.start(start + offset); sources.push(source);
      const scene = project.scenes[index];
      scheduleEffect(audio, destination, scene, start + offset);
      if (effects[index]) {
        const effect = audio.createBufferSource(); effect.buffer = effects[index];
        const gain = audio.createGain(); gain.gain.value = scene.soundVolume ?? 0.2;
        effect.connect(gain); gain.connect(destination);
        effect.start(start + offset, 0, Math.min(scene.duration, effect.buffer!.duration)); sources.push(effect);
      }
      offset += project.scenes[index].duration;
    });
    await new Promise<void>((resolve, reject) => {
      let frame = 0;
      const cleanup = () => { cancelAnimationFrame(frame); signal.removeEventListener('abort', abort); document.removeEventListener('visibilitychange', visibility); };
      const fail = (message: string) => { cleanup(); reject(new Error(message)); };
      const abort = () => fail('Exportación cancelada.');
      const visibility = () => { if (document.hidden) fail('La exportación se interrumpió al ocultar la pestaña. Mantenela visible y reintentá.'); };
      signal.addEventListener('abort', abort, { once: true });
      document.addEventListener('visibilitychange', visibility);
      recorder!.onerror = () => fail('El navegador no pudo grabar el video.');
      recorder!.onstop = () => { cleanup(); resolve(); };
      const render = () => {
        try {
          const time = Math.max(0, audio.currentTime - start);
          draw(ctx, Math.min(time, project.totalDuration - 0.001));
          progress(Math.min(100, time / project.totalDuration * 100));
          if (time >= project.totalDuration) { recorder!.stop(); return; }
          frame = requestAnimationFrame(render);
        } catch { fail('No se pudo dibujar una escena.'); }
      };
      if (signal.aborted || document.hidden) { fail('Mantené la pestaña visible para exportar.'); return; }
      recorder!.start(250);
      frame = requestAnimationFrame(render);
    });
    signal.throwIfAborted();
    const url = URL.createObjectURL(new Blob(chunks, { type: mime }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 90) || 'short'}.${mime.includes('mp4') ? 'mp4' : 'webm'}`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } finally {
    if (recorder?.state === 'recording') recorder.stop();
    sources.forEach(source => { try { source.stop(); } catch { /* already stopped */ } });
    videoStream?.getTracks().forEach(track => track.stop());
    audioSynthesizer.stopTrack();
    await audio.close();
  }
}
