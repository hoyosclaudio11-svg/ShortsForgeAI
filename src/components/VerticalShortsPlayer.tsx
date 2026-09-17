import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Image as ImageIcon, Sparkles, Smartphone, Eye, Sliders, Layers } from 'lucide-react';
import { VideoProject, SubtitleStyle, VisualFilter, Scene } from '../types/video';
import { audioSynthesizer } from '../services/audioSynthesizer';
import confetti from 'canvas-confetti';
import { prepareProject } from '../services/story';
import { exportVideo } from '../services/videoExport';
import { drawOverlay, loadGif, scheduleEffect } from '../services/effects';
import { EffectsStudio } from './EffectsStudio';

interface VerticalShortsPlayerProps {
  project: VideoProject;
  onProjectUpdate?: (updated: VideoProject) => void;
}

export const VerticalShortsPlayer: React.FC<VerticalShortsPlayerProps> = ({
  project,
  onProjectUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Narración TTS (edge-tts por proxy) + refs de sincronización
  const lastSceneIdxRef = useRef<number>(-1);
  const currentTimeRef = useRef<number>(0);
  const mutedRef = useRef<boolean>(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  const [volume, setVolume] = useState<number>(0.5);
  const [showShortsUiOverlay, setShowShortsUiOverlay] = useState<boolean>(false);
  const [currentSubtitleStyle, setCurrentSubtitleStyle] = useState<SubtitleStyle>(project.subtitleStyle);
  const [activeFilter, setActiveFilter] = useState<VisualFilter>(project.scenes[0]?.filter || 'cinematic_warm');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);

  // Image cache
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imageRevision, setImageRevision] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const exportAbort = useRef<AbortController | null>(null);
  const [mediaError, setMediaError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const voiceRequest = useRef(0);
  const effectsContext = useRef<AudioContext | null>(null);
  useEffect(() => () => { exportAbort.current?.abort(); voiceRequest.current++; void effectsContext.current?.close(); audioSynthesizer.stopSpeech(); audioSynthesizer.stopTrack(); }, []);
  useEffect(() => {
    for (const scene of project.scenes) {
      if (scene.overlay?.kind === 'gif' && scene.overlay.url) void loadGif(scene.overlay.url).then(() => setImageRevision(value => value + 1)).catch(error => setMediaError(String(error)));
    }
  }, [project.scenes]);

  // Preload project images
  useEffect(() => {
    project.scenes.forEach((scene) => {
      if (!imageCacheRef.current.has(scene.imageUrl)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = scene.imageUrl;
        img.onload = () => {
          imageCacheRef.current.set(scene.imageUrl, img);
          setImageRevision(value => value + 1);
        };
      }
    });
  }, [project]);

  // Update subtitle style if project changes
  useEffect(() => {
    setCurrentSubtitleStyle(project.subtitleStyle);
  }, [project.subtitleStyle]);

  // ── Narración TTS: edge-tts vía proxy, con fallback a la voz del navegador ──
  const stopTts = useCallback(() => {
    if (effectsContext.current) { void effectsContext.current.close(); effectsContext.current = null; }
    voiceRequest.current++;
    audioSynthesizer.stopSpeech();
    window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => {
    setIsPlaying(false); setCurrentTime(0); currentTimeRef.current = 0;
    lastSceneIdxRef.current = -1; stopTts(); audioSynthesizer.stopTrack();
    setActiveFilter(project.scenes[0]?.filter || 'cinematic_warm');
  }, [project.id, stopTts]);

  const speakScene = useCallback((scene: Scene, offset = 0) => {
    if (mutedRef.current || !scene?.narrationAudioUrl) return;
    const request = ++voiceRequest.current;
    if (effectsContext.current) void effectsContext.current.close();
    const effects = new AudioContext(); effectsContext.current = effects;
    if (offset < 0.2) {
      scheduleEffect(effects, effects.destination, scene, effects.currentTime);
      if (scene.soundEffect === 'custom' && scene.soundUrl) {
        fetch(scene.soundUrl).then(response => response.arrayBuffer()).then(bytes => effects.decodeAudioData(bytes)).then(buffer => {
          if (request !== voiceRequest.current || effects.state === 'closed') return;
          const source = effects.createBufferSource(); source.buffer = buffer;
          const gain = effects.createGain(); gain.gain.value = scene.soundVolume ?? 0.2;
          source.connect(gain); gain.connect(effects.destination); source.start(0, 0, Math.min(scene.duration, buffer.duration));
        }).catch(() => setMediaError('No se pudo reproducir el efecto sonoro.'));
      }
    }
    audioSynthesizer.playSpeech(scene.narrationAudioUrl, scene.narrationAudioUrl, offset)
      .catch(() => { if (request === voiceRequest.current) setMediaError('No se pudo reproducir la narración. Volvé a preparar el video.'); });
  }, []);

  // Handle Play/Pause
  const togglePlay = useCallback(async () => {
    if (isRecording || preparing) return;
    if (isPlaying) {
      setIsPlaying(false);
      audioSynthesizer.stopTrack();
      stopTts();
    } else {
      if (project.scenes.some(scene => !scene.narrationAudioUrl)) {
        setPreparing(true); setMediaError('');
        try { onProjectUpdate?.(await prepareProject(project)); }
        catch (error) { setMediaError(error instanceof Error ? error.message : 'No se pudo preparar la voz.'); }
        finally { setPreparing(false); }
        return;
      }
      setIsPlaying(true);
      if (!isMuted) {
        audioSynthesizer.playTrack(project.musicGenre, volume * 0.6);
        const sc = getSceneAtTime(currentTimeRef.current);
        lastSceneIdxRef.current = sc.index;
        speakScene(project.scenes[sc.index], sc.sceneTime);
      } else {
        lastSceneIdxRef.current = -1;
      }
      lastTimestampRef.current = performance.now();
    }
  }, [isPlaying, isMuted, project, volume, stopTts, speakScene, isRecording, preparing, onProjectUpdate]);

  // Reset / Rewind
  const handleRestart = () => {
    if (isRecording || preparing) return;
    stopTts(); setCurrentTime(0); currentTimeRef.current = 0;
    lastSceneIdxRef.current = -1;
    if (isPlaying) speakScene(project.scenes[0]);
    lastTimestampRef.current = performance.now();
  };

  // Find active scene based on time
  const getSceneAtTime = (time: number, source = project) => {
    let accumulated = 0;
    for (let i = 0; i < source.scenes.length; i++) {
      const s = source.scenes[i];
      if (time >= accumulated && time < accumulated + s.duration) {
        return {
          scene: s,
          index: i,
          sceneTime: time - accumulated,
          progress: (time - accumulated) / s.duration
        };
      }
      accumulated += s.duration;
    }
    // Fallback to last scene
    const last = source.scenes[source.scenes.length - 1];
    return {
      scene: last,
      index: source.scenes.length - 1,
      sceneTime: last.duration,
      progress: 1.0
    };
  };

  // Canvas Drawing Pipeline (1080x1920)
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, time: number, source = project) => {
    const W = 1080;
    const H = 1920;

    const { scene, progress, sceneTime } = getSceneAtTime(time, source);
    const img = imageCacheRef.current.get(scene.imageUrl);

    // 1. Clear background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, W, H);

    ctx.save();

    // 2. Camera Motion (Ken Burns Effect)
    let scale = 1.0;
    let transX = 0;
    let transY = 0;

    if (scene.cameraMotion === 'zoom_in') {
      scale = 1.0 + progress * 0.22; // 1.0 -> 1.22
    } else if (scene.cameraMotion === 'zoom_out') {
      scale = 1.22 - progress * 0.20; // 1.22 -> 1.02
    } else if (scene.cameraMotion === 'pan_left') {
      scale = 1.15;
      transX = (progress - 0.5) * -120;
    } else if (scene.cameraMotion === 'pan_right') {
      scale = 1.15;
      transX = (progress - 0.5) * 120;
    } else if (scene.cameraMotion === 'tilt_up') {
      scale = 1.15;
      transY = (progress - 0.5) * -140;
    } else if (scene.cameraMotion === 'tilt_down') {
      scale = 1.15;
      transY = (progress - 0.5) * 140;
    } else if (scene.cameraMotion === 'dolly_shake') {
      scale = 1.08 + Math.sin(time * 8) * 0.02;
      transX = Math.sin(time * 12) * 6;
      transY = Math.cos(time * 10) * 6;
    }

    if (source.motionIntensity !== 'suave') {
      // A short entrance impulse, then a gentle mid-scene push: no flash or constant shake.
      scale += 0.07 * Math.exp(-sceneTime * 9);
      scale += 0.035 * (1 - Math.cos(Math.PI * Math.min(1, sceneTime / Math.max(1, scene.duration))));
    }
    ctx.translate(W / 2 + transX, H / 2 + transY);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);

    // Draw Image
    if (img && img.complete && img.naturalWidth > 0) {
      // Draw cover
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const targetRatio = W / H;
      let sW, sH, sX, sY;

      if (imgRatio > targetRatio) {
        sH = img.naturalHeight;
        sW = sH * targetRatio;
        sX = (img.naturalWidth - sW) / 2;
        sY = 0;
      } else {
        sW = img.naturalWidth;
        sH = sW / targetRatio;
        sX = 0;
        sY = (img.naturalHeight - sH) / 2;
      }
      ctx.drawImage(img, sX, sY, sW, sH, 0, 0, W, H);
    } else {
      // Fallback stylized procedural canvas
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#311042');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 44px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(project.title, W / 2, H / 2);
    }

    ctx.restore();

    // 3. Visual Filters & Color LUT simulation
    ctx.save();
    if (activeFilter === 'cyberpunk_neon') {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.08)';
      ctx.fillRect(0, 0, W, H);
    } else if (activeFilter === 'cinematic_warm') {
      const warmGrad = ctx.createLinearGradient(0, 0, 0, H);
      warmGrad.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
      warmGrad.addColorStop(1, 'rgba(180, 83, 9, 0.18)');
      ctx.fillStyle = warmGrad;
      ctx.fillRect(0, 0, W, H);
    } else if (activeFilter === 'noir_contrast') {
      // Boost dark edges
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, W, H);
    } else if (activeFilter === 'vintage_35mm') {
      ctx.fillStyle = 'rgba(217, 119, 6, 0.09)';
      ctx.fillRect(0, 0, W, H);
    }

    // Vignette Effect
    const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.4, W / 2, H / 2, W * 0.95);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Subtle particles / floating cosmic dust
    const dustCount = 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let p = 0; p < dustCount; p++) {
      const px = ((p * 137.5 + time * 35) % W);
      const py = ((p * 223.3 + time * 20) % H);
      const pr = 1.5 + (p % 3);
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Scene Transition Effects
    if (time > 0.2 && sceneTime < 0.16) {
      const transProgress = sceneTime / 0.16; // 0.0 -> 1.0
      ctx.save();
      if (scene.transition === 'flash_white') {
        ctx.fillStyle = `rgba(255, 255, 255, ${1.0 - transProgress})`;
        ctx.fillRect(0, 0, W, H);
      } else if (scene.transition === 'glitch') {
        // RGB slice glitch
        ctx.fillStyle = `rgba(244, 63, 94, ${(1.0 - transProgress) * 0.4})`;
        ctx.fillRect(0, (H * 0.4) + Math.sin(time * 50) * 100, W, 80);
        ctx.fillStyle = `rgba(6, 182, 212, ${(1.0 - transProgress) * 0.4})`;
        ctx.fillRect(0, (H * 0.6) - Math.cos(time * 40) * 100, W, 70);
      } else if (scene.transition === 'crossfade') {
        ctx.fillStyle = `rgba(0, 0, 0, ${(1.0 - transProgress) * 0.5})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    // 5. Scene Badge Overlay (Top Left)
    if (scene.badge) {
      ctx.save();
      const badgeText = scene.badge.toUpperCase();
      ctx.font = '800 36px Montserrat, sans-serif';
      const textMetrics = ctx.measureText(badgeText);
      const bW = textMetrics.width + 60;
      const bH = 68;
      const bX = 70;
      const bY = 240;

      // Badge shadow & glow
      ctx.shadowColor = 'rgba(244, 63, 94, 0.6)';
      ctx.shadowBlur = 20;

      // Badge background pill
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 34);
      ctx.fill();

      // Badge border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, bX + 30, bY + bH / 2 + 2);
      ctx.restore();
    }

    // 6. Kinetic Subtitles Rendering (Middle-Lower region, avoiding Shorts controls)
    ctx.save();
    const subY = H * 0.72; // ~1380px (Optimal safety zone for YouTube Shorts)

    if (currentSubtitleStyle === 'capcut_pop') {
      // CapCut pop: 1-2 palabras por vez, cada palabra aparece con pop, trazo negro grueso, activa en amarillo
      const words = scene.subtitles.words || scene.subtitles.text.split(' ').map((w, i, a) => ({
        word: w,
        start: (i / a.length) * scene.duration,
        end: ((i + 1) / a.length) * scene.duration,
      }));
      const active = words.findIndex(word => sceneTime >= word.start && sceneTime < word.end);
      const last = words.reduce((found, word, index) => sceneTime >= word.start ? index : found, -1);
      const index = active >= 0 ? active : Math.max(0, last);
      const chunkStart = Math.floor(index / 2) * 2;
      const chunk = words.slice(chunkStart, chunkStart + 2);
      if (chunk.length) {
        ctx.font = '900 84px Montserrat, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
        const spaceW = ctx.measureText(' ').width;
        const widths = chunk.map(word => ctx.measureText(word.word.toUpperCase()).width);
        const totalW = widths.reduce((sum, w) => sum + w, 0) + spaceW * (chunk.length - 1);
        let x = -totalW / 2;
        chunk.forEach((word, i) => {
          const upper = word.word.toUpperCase();
          const width = widths[i];
          const isActive = i + chunkStart === active;
          const age = Math.max(0, sceneTime - word.start);
          const pop = isActive && source.motionIntensity !== 'suave' ? 1 + 0.22 * Math.exp(-age * 13) : 1;
          const alpha = Math.min(1, age / 0.1);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(x + width / 2, subY);
          ctx.scale(pop, pop);
          ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 7;
          ctx.strokeStyle = '#000000'; ctx.lineWidth = 14;
          ctx.strokeText(upper, -width / 2, 0);
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = isActive ? '#fde047' : '#ffffff';
          ctx.fillText(upper, -width / 2, 0);
          ctx.restore();
          x += width + spaceW;
        });
      }
    } else if (currentSubtitleStyle === 'karaoke_active') {
      const words = scene.subtitles.words || [];
      const active = words.findIndex(word => sceneTime >= word.start && sceneTime < word.end);
      const last = words.reduce((found, word, index) => sceneTime >= word.start ? index : found, -1);
      const index = active >= 0 ? active : Math.max(0, last);
      const chunkStart = Math.floor(index / 3) * 3;
      const chunk = words.slice(chunkStart, chunkStart + 3);
      const text = chunk.length ? chunk.map(word => word.word).join(' ') : scene.subtitles.text;
      ctx.font = '900 72px Montserrat, sans-serif';
      const lines = splitTextIntoLines(ctx, text.toUpperCase(), W * 0.72);
      const impulse = active >= 0 && source.motionIntensity !== 'suave' ? 1 + 0.065 * Math.exp(-(sceneTime - words[active].start) * 18) : 1;
      ctx.translate(W * 0.47, subY); ctx.scale(impulse, impulse);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      lines.forEach((line, lineIndex) => {
        const y = (lineIndex - (lines.length - 1) / 2) * 86;
        ctx.strokeStyle = '#070b14'; ctx.lineWidth = 16; ctx.strokeText(line, 0, y);
        ctx.fillStyle = '#ffffff'; ctx.fillText(line, 0, y);
        if (active >= 0) {
          const word = words[active].word.toUpperCase();
          const position = line.indexOf(word);
          if (position >= 0) {
            const x = -ctx.measureText(line).width / 2 + ctx.measureText(line.slice(0, position)).width;
            ctx.textAlign = 'left'; ctx.fillStyle = '#fde047'; ctx.fillText(word, x, y); ctx.textAlign = 'center';
          }
        }
      });
    } else if (currentSubtitleStyle === 'hormozi_bold') {
      // Hormozi Style: Big Yellow/Cyan text, heavy black stroke, punchy impact
      ctx.font = '900 68px Montserrat, "Cabinet Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const words = scene.subtitles.words || scene.subtitles.text.split(' ').map((w, i, a) => ({
        word: w,
        start: (i / a.length) * scene.duration,
        end: ((i + 1) / a.length) * scene.duration
      }));

      // Render 2-3 words per chunk or active word
      const activeWordObj = words.find((w) => sceneTime >= w.start && sceneTime <= w.end);
      const currentWordText = activeWordObj ? activeWordObj.word.toUpperCase() : (words[0]?.word.toUpperCase() || '');

      // Full scene text in 2 lines
      const fullText = scene.subtitles.text.toUpperCase();
      const textLines = splitTextIntoLines(ctx, fullText, W * 0.85);

      textLines.forEach((line, idx) => {
        const lineY = subY - (textLines.length - 1) * 45 + idx * 90;
        
        // Background black stroke
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 14;
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;
        ctx.strokeText(line, W / 2, lineY);

        // Fill: check if current word is inside this line
        const hasActiveWord = line.includes(currentWordText);
        ctx.fillStyle = hasActiveWord ? '#facc15' : '#ffffff'; // Vibrant Yellow highlight
        ctx.fillText(line, W / 2, lineY);
      });

    } else if (currentSubtitleStyle === 'cinematic_gold') {
      // Cinematic Gold: Elegant serif look with gold gradient and subtle shadow
      ctx.font = '800 58px Syne, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fullText = scene.subtitles.text;
      const textLines = splitTextIntoLines(ctx, fullText, W * 0.82);

      textLines.forEach((line, idx) => {
        const lineY = subY - (textLines.length - 1) * 40 + idx * 80;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;

        ctx.strokeStyle = '#181204';
        ctx.lineWidth = 8;
        ctx.strokeText(line, W / 2, lineY);

        const goldGrad = ctx.createLinearGradient(0, lineY - 30, 0, lineY + 30);
        goldGrad.addColorStop(0, '#fef08a');
        goldGrad.addColorStop(0.5, '#f59e0b');
        goldGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = goldGrad;
        ctx.fillText(line, W / 2, lineY);
      });

    } else if (currentSubtitleStyle === 'cyber_neon') {
      // Cyber Neon: Cyan text with magenta glow
      ctx.font = '900 62px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fullText = `> ${scene.subtitles.text.toUpperCase()}`;
      const textLines = splitTextIntoLines(ctx, fullText, W * 0.85);

      textLines.forEach((line, idx) => {
        const lineY = subY - (textLines.length - 1) * 45 + idx * 85;
        
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 25;

        ctx.strokeStyle = '#050b14';
        ctx.lineWidth = 10;
        ctx.strokeText(line, W / 2, lineY);

        ctx.fillStyle = '#22d3ee';
        ctx.fillText(line, W / 2, lineY);
      });

    } else if (currentSubtitleStyle === 'clean_minimal') {
      // Clean Minimalist: Modern sans with translucent dark pill background
      ctx.font = '700 52px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fullText = scene.subtitles.text;
      const textLines = splitTextIntoLines(ctx, fullText, W * 0.8);

      textLines.forEach((line, idx) => {
        const lineY = subY - (textLines.length - 1) * 40 + idx * 80;
        const metrics = ctx.measureText(line);
        const padX = 40;
        const padY = 24;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(W / 2 - metrics.width / 2 - padX, lineY - padY - 20, metrics.width + padX * 2, 70, 16);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, W / 2, lineY + 6);
      });
    } else {
      // Pop / MrBeast Style with slight dynamic rotation
      ctx.font = '900 70px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fullText = scene.subtitles.text.toUpperCase();
      const textLines = splitTextIntoLines(ctx, fullText, W * 0.85);

      textLines.forEach((line, idx) => {
        const lineY = subY - (textLines.length - 1) * 45 + idx * 95;
        ctx.save();
        ctx.translate(W / 2, lineY);
        ctx.rotate((idx % 2 === 0 ? -0.03 : 0.03));

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 14;
        ctx.strokeText(line, 0, 0);

        ctx.fillStyle = '#4ade80'; // Lime green
        ctx.fillText(line, 0, 0);
        ctx.restore();
      });
    }
    ctx.restore();

    // 7. Video Progress Bar (Bottom edge)
    drawOverlay(ctx, scene, sceneTime);
    const totalDur = source.totalDuration || 30;
    const progRatio = Math.min(1.0, Math.max(0.0, time / totalDur));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, H - 12, W, 12);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(0, H - 12, W * progRatio, 12);

  }, [project, getSceneAtTime, activeFilter, currentSubtitleStyle, imageRevision]);

  // Helper to split text cleanly into lines
  const splitTextIntoLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const width = ctx.measureText(testLine).width;
      if (width < maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = words[i];
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 3); // Max 3 lines
  };

  // Main Animation / Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localCurrentTime = currentTime;

    const render = (now: number) => {
      if (lastTimestampRef.current !== null && isPlaying) {
        const delta = (now - lastTimestampRef.current) / 1000;
        localCurrentTime += delta;

        if (localCurrentTime >= project.totalDuration) {
          localCurrentTime = project.totalDuration;
          setIsPlaying(false);
          audioSynthesizer.stopTrack();
          stopTts();
        }
        setCurrentTime(localCurrentTime);
      }
      lastTimestampRef.current = now;

      drawFrame(ctx, localCurrentTime);

      // Narración: hablar al cambiar de escena
      if (isPlaying && localCurrentTime < project.totalDuration) {
        const scIdx = getSceneAtTime(localCurrentTime).index;
        if (scIdx !== lastSceneIdxRef.current) {
          lastSceneIdxRef.current = scIdx;
          speakScene(project.scenes[scIdx]);
        }
      }

      if (isPlaying || isRecording) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    // Initial single frame render
    drawFrame(ctx, currentTime);

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(render);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isRecording, drawFrame, project.totalDuration, currentTime, speakScene, stopTts]);

  // Timeline Scrubber Change
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRecording || preparing) return;
    const newTime = parseFloat(e.target.value);
    stopTts();
    const position = getSceneAtTime(newTime);
    lastSceneIdxRef.current = position.index;
    if (isPlaying) speakScene(position.scene, position.sceneTime);
    setCurrentTime(newTime);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) drawFrame(ctx, newTime);
    }
  };

  // High-Res Single Frame Thumbnail Capture (1080x1920)
  const handleCaptureThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${project.sampleFileName ? project.sampleFileName.replace('.mp4', '') : 'shorts'}_thumbnail_1080x1920.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  // Real In-Browser Video Export (MP4 / WebM with Audio)
  const handleExportRealVideo = async () => {
    if (isRecording || preparing) return;
    setIsPlaying(false); stopTts(); audioSynthesizer.stopTrack();
    setPreparing(true); setMediaError(''); setRecordingProgress(0);
    const controller = new AbortController(); exportAbort.current = controller;
    try {
      const prepared = await prepareProject(project);
      controller.signal.throwIfAborted();
      await Promise.all(prepared.scenes.map(async scene => {
        if (scene.overlay?.kind === 'gif') {
          if (!scene.overlay.url) throw new Error('Cargá un GIF o quitá el gráfico vacío.');
          await loadGif(scene.overlay.url);
        }
        const image = new Image(); image.crossOrigin = 'anonymous'; image.src = scene.imageUrl;
        await image.decode(); imageCacheRef.current.set(scene.imageUrl, image);
      }));
      controller.signal.throwIfAborted();
      setPreparing(false); setIsRecording(true);
      await exportVideo(prepared, (ctx, time) => drawFrame(ctx, time, prepared), setRecordingProgress, controller.signal);
      onProjectUpdate?.(prepared);
    } catch (error) {
      if (!controller.signal.aborted) setMediaError(error instanceof Error ? error.message : 'No se pudo exportar el video.');
    } finally { setPreparing(false); setIsRecording(false); exportAbort.current = null; }
  };

  const activeSceneInfo = getSceneAtTime(currentTime);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      {/* 9:16 Vertical Video Player Container */}
      <div className="flex flex-col items-center w-full lg:w-auto mx-auto">
        <div 
          ref={containerRef}
          className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 flex items-center justify-center group"
          style={{ width: '330px', height: '586px' }} // Proportional to 1080x1920 (9:16 aspect ratio)
        >
          {/* Canvas resolution is true 1080x1920 */}
          <canvas
            ref={canvasRef}
            width={1080}
            height={1920}
            className="w-full h-full object-cover cursor-pointer select-none"
            onClick={togglePlay}
          />

          {/* YouTube Shorts UI Overlay Simulation */}
          {showShortsUiOverlay && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-gradient-to-b from-black/40 via-transparent to-black/70">
              {/* Top Header */}
              <div className="flex items-center justify-between pt-1">
                <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider text-white border border-white/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  SHORTS 9:16
                </span>
                <span className="text-[11px] font-mono font-bold text-white/90 bg-black/60 px-2 py-0.5 rounded-md">
                  {Math.floor(currentTime)}s / {project.totalDuration}s
                </span>
              </div>

              {/* Right Action Icons (Like, Comment, Share, Remix, Sound Disc) */}
              <div className="self-end flex flex-col items-center gap-4 pb-14 pr-1">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-base shadow-lg border border-white/10">
                    👍
                  </div>
                  <span className="text-[10px] font-bold text-white mt-1">42K</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-base shadow-lg border border-white/10">
                    💬
                  </div>
                  <span className="text-[10px] font-bold text-white mt-1">1.8K</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white text-base shadow-lg border border-white/10">
                    ↗️
                  </div>
                  <span className="text-[10px] font-bold text-white mt-1">Share</span>
                </div>
                {/* Rotating Sound Disc */}
                <div className={`w-8 h-8 rounded-full border-2 border-rose-500 overflow-hidden bg-slate-900 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}>
                  <span className="text-xs">🎵</span>
                </div>
              </div>

              {/* Bottom Metadata Hook */}
              <div className="pb-4 pr-14 text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-[10px] font-black text-white">
                    SF
                  </div>
                  <span className="text-xs font-bold text-white">@ShortsForge_AI</span>
                  <button className="bg-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full text-white pointer-events-auto hover:bg-red-500">
                    Suscribirse
                  </button>
                </div>
                <p className="text-xs font-semibold text-white/95 line-clamp-2 drop-shadow-md">
                  {project.metadata.title}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {project.metadata.hashtags.slice(0, 3).map((h, i) => (
                    <span key={i} className="text-[10px] font-bold text-cyan-300">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Central Play/Pause Watermark on Hover */}
          {!isPlaying && !isRecording && (
            <div 
              onClick={togglePlay}
              className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer backdrop-blur-[2px] transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center pl-1 shadow-2xl transform transition hover:scale-110">
                <Play className="w-8 h-8 fill-white" />
              </div>
            </div>
          )}

          {/* Recording Overlay */}
          {isRecording && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center p-4 backdrop-blur-md z-30">
              <div className="w-12 h-12 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mb-3"></div>
              <p className="text-sm font-bold text-white">Renderizando Video MP4...</p>
              <p className="text-xs text-slate-400 mt-1">Compilando 1080x1920 (~30s)</p>
              <div className="w-48 bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-rose-500 h-full transition-all duration-200"
                  style={{ width: `${recordingProgress}%` }}
                ></div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 mt-1">{recordingProgress}%</span>
            </div>
          )}
        </div>

        {/* Player Controls Bar */}
        <div className="w-full max-w-[330px] mt-4 flex flex-col gap-2.5 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
          {/* Progress Scrubber */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 w-8">
              {Math.floor(currentTime)}s
            </span>
            <input
              type="range"
              min={0}
              max={project.totalDuration}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <span className="text-[11px] font-mono text-slate-400 w-8">
              {project.totalDuration}s
            </span>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                disabled={preparing || isRecording} onClick={togglePlay}
                className="w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition shadow-md shadow-rose-950/40"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>
              <button
                disabled={preparing || isRecording} onClick={handleRestart}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                title="Reiniciar desde el inicio"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-xl">
                <button
                  onClick={() => {
                    const newMute = !isMuted;
                    setIsMuted(newMute);
                    if (newMute) { audioSynthesizer.stopTrack(); stopTts(); }
                    else if (isPlaying) {
                      audioSynthesizer.playTrack(project.musicGenre, volume * 0.6);
                      const sc = getSceneAtTime(currentTimeRef.current);
                      lastSceneIdxRef.current = sc.index;
                      speakScene(project.scenes[sc.index], sc.sceneTime);
                    }
                  }}
                  className={`text-slate-300 hover:text-white transition ${isMuted ? 'text-amber-400' : ''}`}
                  title={isMuted ? 'Activar Sonido' : 'Silenciar'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (v > 0 && isMuted) setIsMuted(false);
                    if (isPlaying && !isMuted) audioSynthesizer.playTrack(project.musicGenre, v * 0.6);
                  }}
                  className="w-12 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-rose-500"
                  title={`Volumen: ${Math.round(volume * 100)}%`}
                />
              </div>
            </div>

            {/* Shorts UI toggle */}
            <button
              onClick={() => setShowShortsUiOverlay(!showShortsUiOverlay)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                showShortsUiOverlay 
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Mostrar/Ocultar interfaz de YouTube Shorts"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>UI Shorts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Controls & Scene Inspector */}
      <div className="flex-1 w-full space-y-5">
        {/* Active Variant Header Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800 border border-slate-700/70 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Variante #{project.variantIndex}: {project.variantStyleName}
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-md">
              Rendimiento: sin medición
            </span>
          </div>

          <h2 className="text-xl font-bold text-white font-heading mt-1 mb-2">
            {project.title}
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {project.metadata.viralHook}
          </p>

          {mediaError && <p role="alert" className="text-rose-300 mt-3">{mediaError}</p>}
          {preparing && <p className="text-amber-200 text-sm">Preparando narración y subtítulos. Al terminar podés reproducir.</p>}
          <div className="flex gap-3 mt-3">
            <label>Movimiento <select aria-label="Intensidad del movimiento" disabled={isRecording || preparing} value={project.motionIntensity || 'dinamica'} onChange={e => onProjectUpdate?.({ ...project, motionIntensity: e.target.value as 'suave' | 'dinamica' })} className="bg-slate-800 rounded p-2"><option value="dinamica">Dinámico</option><option value="suave">Suave</option></select></label>
            <button disabled={isRecording || preparing} onClick={() => onProjectUpdate?.({ ...project, subtitleStyle: 'karaoke_active' })} className="bg-slate-800 rounded p-2">Subtítulos por palabra</button>
          </div>
          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-800">
            <button
              onClick={handleExportRealVideo}
              disabled={isRecording || preparing}
              className="flex-1 min-w-[200px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{preparing ? 'Preparando voces e imágenes…' : isRecording ? `Exportando ${Math.round(recordingProgress)}%` : 'Exportar video (MP4 / WebM)'}</span>
            </button>

            <button
              onClick={handleCaptureThumbnail}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-sm flex items-center gap-2 border border-slate-700 transition"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Guardar Miniatura</span>
            </button>
          </div>
        </div>

        {onProjectUpdate && <fieldset disabled={isRecording || preparing}><EffectsStudio project={project} onChange={onProjectUpdate} /></fieldset>}
        {/* Real-Time Style Customizers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subtitle Typography Styler */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              Estilo de Subtítulos Animados
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'capcut_pop', label: '🔥 CapCut Pop', desc: 'Palabra por palabra, pop + trazo' },
                { id: 'hormozi_bold', label: '⚡ Hormozi Bold', desc: 'Amarillo + Trazo Negro' },
                { id: 'cinematic_gold', label: '🏛️ Oro Cinemático', desc: 'Degradado Dorado' },
                { id: 'cyber_neon', label: '👾 Cyber Neon', desc: 'Cian + Resplandor' },
                { id: 'clean_minimal', label: '📄 Minimal Caja', desc: 'Fondo Oscuro Suave' },
                { id: 'mrbeast_pop', label: '💥 Pop Dinámico', desc: 'Verde Lima Rebelde' }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    setCurrentSubtitleStyle(style.id as SubtitleStyle);
                    if (onProjectUpdate) {
                      onProjectUpdate({ ...project, subtitleStyle: style.id as SubtitleStyle });
                    }
                  }}
                  className={`p-2 rounded-xl text-left transition border ${
                    currentSubtitleStyle === style.id
                      ? 'bg-rose-950/60 border-rose-500/80 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <p className="text-xs font-semibold">{style.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Filter & LUT Styler */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Filtro Cinemático & Color Grading
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cinematic_warm', label: '🔥 Cálido Épico', desc: 'Curva Vintage Oro' },
                { id: 'cyberpunk_neon', label: '🌌 Cyber Neon', desc: 'Contraste + Saturación' },
                { id: 'noir_contrast', label: '🌑 Noir Drama', desc: 'Alto Contraste' },
                { id: 'vintage_35mm', label: '🎞️ Película 35mm', desc: 'Grano y Tono Ámbar' },
                { id: 'natural', label: '🌿 Natural Nítido', desc: 'Balance Neutro' }
              ].map((fil) => (
                <button
                  key={fil.id}
                  onClick={() => setActiveFilter(fil.id as VisualFilter)}
                  className={`p-2 rounded-xl text-left transition border ${
                    activeFilter === fil.id
                      ? 'bg-cyan-950/60 border-cyan-500/80 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <p className="text-xs font-semibold">{fil.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{fil.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Active Scene Inspector */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Escena Activa: #{activeSceneInfo.index + 1} de {project.scenes.length} ({activeSceneInfo.scene.duration}s)
            </span>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-rose-300">
              Cámara: {activeSceneInfo.scene.cameraMotion.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="flex gap-4 items-start">
            <img
              src={activeSceneInfo.scene.imageUrl}
              alt="Scene preview"
              className="w-16 h-28 object-cover rounded-xl border border-slate-700 shrink-0 shadow-md"
            />
            <div className="flex-1 text-left space-y-1.5">
              <p className="text-xs font-mono text-cyan-400/90 line-clamp-1">
                Prompt SD: {activeSceneInfo.scene.imagePrompt}
              </p>
              <p className="text-xs text-slate-200 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <span className="text-rose-400 font-bold">Voz: </span>
                {activeSceneInfo.scene.narrationText}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span>Transición: <strong className="text-white">{activeSceneInfo.scene.transition}</strong></span>
                <span>•</span>
                <span>Insignia: <strong className="text-amber-400">{activeSceneInfo.scene.badge || 'Ninguna'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
