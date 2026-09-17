import React from 'react';
import { Sparkles, Film, Code, Terminal, Settings, Download, Smartphone, Sliders, Wand2, Microscope } from 'lucide-react';
import { VideoProject } from '../types/video';

export type ActiveTab = 'studio' | 'generator' | 'samples' | 'editor' | 'codebase' | 'logs' | 'ai' | 'laboratorio';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  onDownloadZip: () => void;
  currentProject?: VideoProject;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onDownloadZip
}) => {
  const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'ai', label: 'IA · Cualquier Tema', icon: <Wand2 className="w-4 h-4" />, badge: 'NUEVO' },
    { id: 'laboratorio', label: 'Lab · Virales', icon: <Microscope className="w-4 h-4" /> },
    { id: 'studio', label: 'Studio Vertical', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'generator', label: 'Generar 5 Variantes', icon: <Sparkles className="w-4 h-4" />, badge: '5x' },
    { id: 'samples', label: '3 Muestras YouTube', icon: <Film className="w-4 h-4" />, badge: 'Listos' },
    { id: 'editor', label: 'Escenas & Miniaturas', icon: <Sliders className="w-4 h-4" /> },
    { id: 'codebase', label: 'Python 3.11 + FFmpeg', icon: <Code className="w-4 h-4" /> },
    { id: 'logs', label: 'Logs & Terminal', icon: <Terminal className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('studio')}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <span className="text-white font-black text-base tracking-tighter">SF</span>
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-base font-extrabold text-white font-heading tracking-tight flex items-center gap-1.5">
              ShortsForge <span className="text-rose-500">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono block -mt-1">
              Python 3.11 • FFmpeg 1080x1920
            </span>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-2xl">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                  isActive
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            title="Configuración YAML"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onDownloadZip}
            className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition transform active:scale-95"
            title="Descargar paquete completo Python 3.11 (.ZIP)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Descargar Python .ZIP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
