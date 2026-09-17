import React from 'react';
import { Cpu, Film, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-900 bg-slate-950/90 text-slate-400 py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-left space-y-1">
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            ShortsForge AI — Sistema Automatizado de YouTube Shorts
          </p>
          <p className="text-xs text-slate-500">
            Guiones originales • Voz sincronizada • GIF y efectos • Biblioteca local
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <Film className="w-3.5 h-3.5 text-rose-400" />
            1080×1920 (9:16)
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Duración adaptable
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Listo para YouTube
          </span>
        </div>
      </div>
    </footer>
  );
};
