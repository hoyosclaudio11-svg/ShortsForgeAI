import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VideoProject } from '../types/video';
import { Download, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ThumbnailStudioProps {
  project: VideoProject;
  onUpdateProject?: (updated: VideoProject) => void;
}

export const ThumbnailStudio: React.FC<ThumbnailStudioProps> = ({
  project,
  onUpdateProject
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [headline, setHeadline] = useState<string>(project.thumbnailHeadline || '¡ESTO CAMBIA TODO!');
  const [badgeText, setBadgeText] = useState<string>(project.thumbnailBadgeText || 'NO LO SABÍAS 😱');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [accentColor, setAccentColor] = useState<string>('#facc15'); // Yellow
  const [badgeColor, setBadgeColor] = useState<string>('#e11d48'); // Red/Rose
  const [sticker, setSticker] = useState<string>('😱');
  const [showVignette, setShowVignette] = useState<boolean>(true);
  const [contrastBoost, setContrastBoost] = useState<number>(1.25);

  const activeImage = project.scenes[selectedImageIndex]?.imageUrl || project.thumbnailUrl;

  const renderThumbnail = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1920;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activeImage;

    img.onload = () => {
      // Draw background
      ctx.fillStyle = '#050811';
      ctx.fillRect(0, 0, W, H);

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

      // Contrast & Saturation enhancement overlay
      if (contrastBoost > 1.0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(0, 0, W, H);
      }

      // Dark Vignette & Bottom/Top Gradient for high legibility
      if (showVignette) {
        // Top shadow
        const topGrad = ctx.createLinearGradient(0, 0, 0, 450);
        topGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
        topGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, W, 450);

        // Bottom heavy gradient
        const bottomGrad = ctx.createLinearGradient(0, H * 0.45, 0, H);
        bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bottomGrad.addColorStop(0.4, 'rgba(0,0,0,0.65)');
        bottomGrad.addColorStop(1, 'rgba(0,0,0,0.95)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, H * 0.45, W, H * 0.55);

        // Vignette edges
        const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.9);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);
      }

      // 1. Top Left Badge Pill
      if (badgeText.trim()) {
        ctx.save();
        ctx.font = '900 48px Montserrat, sans-serif';
        const badgeFull = badgeText.toUpperCase();
        const metrics = ctx.measureText(badgeFull);
        const bW = metrics.width + 80;
        const bH = 90;
        const bX = 60;
        const bY = 220;

        ctx.shadowColor = badgeColor;
        ctx.shadowBlur = 25;

        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, 45);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeFull, bX + 40, bY + bH / 2 + 2);
        ctx.restore();
      }

      // 2. High Impact Viral Headline Box in lower-third
      if (headline.trim()) {
        ctx.save();
        const headY = H * 0.68;
        const textUpper = headline.toUpperCase();

        // Split headline into max 2 lines
        const words = textUpper.split(' ');
        const lines: string[] = [];
        let curLine = '';

        ctx.font = '900 78px Montserrat, "Cabinet Grotesk", sans-serif';
        words.forEach((w) => {
          const test = curLine ? `${curLine} ${w}` : w;
          if (ctx.measureText(test).width < W * 0.82) {
            curLine = test;
          } else {
            if (curLine) lines.push(curLine);
            curLine = w;
          }
        });
        if (curLine) lines.push(curLine);

        // Render Background Card
        const cardH = lines.length * 110 + 60;
        const cardY = headY - 30;

        ctx.fillStyle = 'rgba(10, 15, 28, 0.9)';
        ctx.beginPath();
        ctx.roundRect(50, cardY, W - 100, cardH, 32);
        ctx.fill();

        // Card Border Glow
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 8;
        ctx.stroke();

        // Text Drawing
        lines.forEach((line, idx) => {
          const lineY = headY + 50 + idx * 110;

          // Black Heavy Outline
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 16;
          ctx.strokeText(line, W / 2, lineY);

          // Fill (alternate white and accent color)
          ctx.fillStyle = idx === 0 ? textColor : accentColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(line, W / 2, lineY);
        });

        ctx.restore();
      }

      // 3. Optional Floating Reaction Sticker / Emoji
      if (sticker) {
        ctx.save();
        ctx.font = '140px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 30;
        ctx.fillText(sticker, W - 160, H * 0.52);
        ctx.restore();
      }

      // 4. Outer Neon Frame Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, W - 12, H - 12);
    };
  }, [activeImage, headline, badgeText, badgeColor, textColor, accentColor, sticker, showVignette, contrastBoost]);

  useEffect(() => {
    renderThumbnail();
  }, [renderThumbnail]);

  const handleDownloadThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${project.sampleFileName ? project.sampleFileName.replace('.mp4', '') : 'shorts'}_cover_1080x1920.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 }
    });
  };

  const syncToProject = () => {
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        thumbnailHeadline: headline,
        thumbnailBadgeText: badgeText,
        thumbnailUrl: activeImage
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* 9:16 Canvas Preview */}
      <div className="flex flex-col items-center mx-auto lg:mx-0 shrink-0">
        <div 
          className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950 flex items-center justify-center"
          style={{ width: '310px', height: '551px' }}
        >
          <canvas
            ref={canvasRef}
            width={1080}
            height={1920}
            className="w-full h-full object-cover select-none"
          />
        </div>

        <button
          onClick={handleDownloadThumbnail}
          className="w-full max-w-[310px] mt-4 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-950/50 transition transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Descargar Miniatura JPG (1080x1920)</span>
        </button>
      </div>

      {/* Customizer Controls Panel */}
      <div className="flex-1 w-full space-y-6 text-left">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Diseñador de Miniatura Viral para YouTube Shorts
          </div>
          <h2 className="text-xl font-bold text-white font-heading">
            Personaliza la Portada de Alto CTR (Click-Through Rate)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Las miniaturas con contrastes altos, insignias llamativas y tipografía de gran tamaño duplican el alcance orgánico en el feed de Shorts.
          </p>
        </div>

        {/* Inputs Form */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          {/* Headline */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Titular Principal de Impacto (Headline)
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:border-rose-500 focus:outline-none"
              placeholder="Ej: ¡EL UNIVERSO ESTÁ COLAPSANDO!"
            />
          </div>

          {/* Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Texto de Insignia Superior (Badge)
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-rose-500 focus:outline-none"
                placeholder="Ej: NO LO SABÍAS 😱"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Sticker Emoji de Reacción
              </label>
              <div className="flex items-center gap-1.5">
                {['😱', '🔥', '⚡', '🧠', '⚔️', '👁️', '🛑', ''].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSticker(s)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition border ${
                      sticker === s
                        ? 'bg-rose-950 border-rose-500 scale-110 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s || '∅'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scene Background Picker */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Seleccionar Fondo de Escena
            </label>
            <div className="grid grid-cols-6 gap-2">
              {project.scenes.map((scene, idx) => (
                <button
                  key={scene.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative rounded-xl overflow-hidden aspect-[9/14] border-2 transition ${
                    selectedImageIndex === idx
                      ? 'border-rose-500 ring-2 ring-rose-500/50 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={scene.imageUrl} alt={`Scene ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/80 px-1 rounded text-white">
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Customizers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Color de Insignia</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={badgeColor}
                  onChange={(e) => setBadgeColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-slate-300 uppercase">{badgeColor}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Color Resaltado</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-slate-300 uppercase">{accentColor}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Color de Texto</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-slate-300 uppercase">{textColor}</span>
              </div>
            </div>
          </div>

          {/* Toggle Switches & Boost */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showVignette}
                onChange={(e) => setShowVignette(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-700"
              />
              <span>Viñeta y Degradado de Contraste</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Brillo/Contraste:</span>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.05"
                value={contrastBoost}
                onChange={(e) => setContrastBoost(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-slate-700 rounded-lg accent-rose-500"
              />
            </div>

            <button
              onClick={syncToProject}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Guardar en Proyecto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
