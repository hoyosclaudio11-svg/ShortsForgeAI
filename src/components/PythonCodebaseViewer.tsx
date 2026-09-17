import React, { useState } from 'react';
import { PYTHON_CODEBASE_FILES } from '../data/pythonCodebase';
import { PythonCodeFile, VideoProject } from '../types/video';
import { downloadPythonProjectZip } from '../services/exportManager';
import { FileCode, Download, Copy, Check, Terminal, Folder, File, Search } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PythonCodebaseViewerProps {
  currentProject?: VideoProject;
}

export const PythonCodebaseViewer: React.FC<PythonCodebaseViewerProps> = ({ currentProject }) => {
  const [selectedFile, setSelectedFile] = useState<PythonCodeFile>(PYTHON_CODEBASE_FILES[3]); // main.py
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [cliTopic, setCliTopic] = useState<string>(currentProject?.topic || 'Misterios del Cosmos y Agujeros Negros');
  const [cliVariants, setCliVariants] = useState<number>(5);
  const [cliDuration, setCliDuration] = useState<number>(60);

  const filteredFiles = PYTHON_CODEBASE_FILES.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadPythonProjectZip(currentProject);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } finally {
      setIsZipping(false);
    }
  };

  const getCliCommand = () => {
    return `python main.py --topic "${cliTopic}" --variants ${cliVariants} --duration ${cliDuration} --output-dir ./output_shorts`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4 text-left">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 inline-flex items-center gap-1.5 mb-2">
            <FileCode className="w-3.5 h-3.5" />
            Código Fuente Python 3.11 + FFmpeg 6.x
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white font-heading">
            Arquitectura de Software Multimedia Profesional
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl">
            Pipeline modular con manejo de excepciones, logs estructurados Rich, configuración YAML, cálculo de filtro gráfico FFmpeg con Ken Burns, síntesis de voz Edge-TTS, DALL·E 3 / Stable Diffusion y normalización de audio -14 LUFS.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-rose-500 hover:from-cyan-500 hover:to-rose-400 text-white font-bold text-sm flex items-center gap-2.5 shadow-xl shadow-cyan-950/50 transition transform active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Empaquetando ZIP...' : 'Descargar Proyecto Python (.ZIP)'}</span>
        </button>
      </div>

      {/* CLI Quick Runner Assistant */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-rose-400" />
            Generador de Comando CLI de Ejecución Local
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Python 3.11</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={cliTopic}
            onChange={(e) => setCliTopic(e.target.value)}
            placeholder="Tema del video..."
            className="flex-1 min-w-[220px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
          />
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>Variantes:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={cliVariants}
              onChange={(e) => setCliVariants(parseInt(e.target.value) || 5)}
              className="w-14 px-2 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white text-center"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>Duración (s):</span>
            <input
              type="number"
              min={10}
              max={120}
              value={cliDuration}
              onChange={(e) => setCliDuration(parseInt(e.target.value) || 60)}
              className="w-16 px-2 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white text-center"
            />
          </div>
        </div>

        <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
          <code className="text-xs font-mono text-cyan-300 overflow-x-auto whitespace-nowrap">
            {getCliCommand()}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(getCliCommand());
              setHasCopied(true);
              setTimeout(() => setHasCopied(false), 2000);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 shrink-0 transition"
          >
            {hasCopied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Main IDE Code Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Left: File Tree Directory */}
        <div className="lg:col-span-4 bg-slate-900/90 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 flex flex-col justify-between text-left">
          <div>
            {/* Search Files */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar archivo o módulo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
              <span>Estructura del Proyecto</span>
              <span className="text-cyan-400 font-mono">{filteredFiles.length} archivos</span>
            </div>

            <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile.path === file.path;
                const isPipeline = file.path.startsWith('pipeline/');
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full p-2 rounded-xl text-left transition flex items-center gap-2.5 border ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-white shadow-md'
                        : 'bg-slate-950/40 border-slate-900 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    {isPipeline ? (
                      <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    ) : (
                      <File className={`w-4 h-4 shrink-0 ${isSelected ? 'text-rose-400' : 'text-slate-500'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-semibold truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{file.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Entorno: Python 3.11.x</span>
            <span className="text-emerald-400 font-mono font-bold">FFmpeg 6.1+</span>
          </div>
        </div>

        {/* Right: Code Viewer & Actions */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950 text-left">
          {/* Header of Code Editor */}
          <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                {selectedFile.language}
              </span>
              <span className="text-xs font-mono text-slate-200 font-bold truncate">
                {selectedFile.path}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Text with Line Numbers */}
          <div className="p-4 overflow-x-auto max-h-[580px] font-mono-code text-xs leading-relaxed text-slate-200 bg-slate-950/90">
            <pre className="table">
              {selectedFile.content.split('\n').map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/50">
                  <span className="table-cell pr-4 text-right select-none text-slate-600 w-10 text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre font-mono">
                    {highlightCodeKeywords(line, selectedFile.language)}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple syntax colorizer helper for aesthetic display
function highlightCodeKeywords(line: string, lang: string): React.ReactNode {
  if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }
  if (lang === 'yaml' && line.includes(':')) {
    const parts = line.split(':');
    return (
      <span>
        <span className="text-cyan-400 font-bold">{parts[0]}</span>:
        <span className="text-amber-300">{parts.slice(1).join(':')}</span>
      </span>
    );
  }
  return <span>{line}</span>;
}
