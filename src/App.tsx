import { useEffect, useState } from 'react';
import { listProjects, saveProject } from './services/projectStore';
import { SAMPLE_SHORTS_PROJECTS } from './data/samples';
import { VideoProject } from './types/video';
import { Navbar, ActiveTab } from './components/Navbar';
import { VerticalShortsPlayer } from './components/VerticalShortsPlayer';
import { AiStoryGenerator } from './components/AiStoryGenerator';
import { ViralLab } from './components/ViralLab';
import { BatchVariantGenerator } from './components/BatchVariantGenerator';
import { SampleShortsShowcase } from './components/SampleShortsShowcase';
import { SceneTimelineEditor } from './components/SceneTimelineEditor';
import { ThumbnailStudio } from './components/ThumbnailStudio';
import { PythonCodebaseViewer } from './components/PythonCodebaseViewer';
import { PipelineConsoleLogs } from './components/PipelineConsoleLogs';
import { ConfigSettingsModal } from './components/ConfigSettingsModal';
import { Footer } from './components/Footer';
import { downloadPythonProjectZip } from './services/exportManager';
import { Sliders, Image as ImageIcon } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [currentProject, setCurrentProject] = useState<VideoProject>(SAMPLE_SHORTS_PROJECTS[0]);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [editorSubTab, setEditorSubTab] = useState<'scenes' | 'thumbnail'>('scenes');
  const [savedProjects, setSavedProjects] = useState<VideoProject[]>([]);
  const [saveError, setSaveError] = useState('');
  const [libraryReady, setLibraryReady] = useState(false);
  useEffect(() => { listProjects().then(setSavedProjects).catch(() => setSaveError('No se pudo abrir la biblioteca local.')).finally(() => setLibraryReady(true)); }, []);
  useEffect(() => {
    if (!libraryReady) return;
    const timer = setTimeout(() => {
      saveProject(currentProject).then(listProjects).then(projects => { setSavedProjects(projects); setSaveError(''); }).catch(() => setSaveError('No se pudo guardar: revisá el espacio del navegador.'));
    }, 600);
    return () => clearTimeout(timer);
  }, [currentProject, libraryReady]);

  const handleSelectProject = (project: VideoProject) => {
    setCurrentProject(project);
    setActiveTab('studio');
  };

  const handleUpdateProject = (updated: VideoProject) => {
    setCurrentProject(updated);
  };

  const handleDownloadZip = () => {
    downloadPythonProjectZip(currentProject);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDownloadZip={handleDownloadZip}
        currentProject={currentProject}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5 flex flex-wrap gap-3 items-center text-sm">
          <label>Biblioteca local <select aria-label="Biblioteca local" className="bg-slate-900 border border-slate-700 rounded-lg p-2 max-w-72" value="" onChange={e => { const project = savedProjects.find(p => p.id === e.target.value); if (project) { setCurrentProject(project); setActiveTab('studio'); } }}><option value="">Abrir proyecto guardado…</option>{savedProjects.map(p => <option key={p.id} value={p.id}>{p.channel || 'General'} · {p.title}</option>)}</select></label>
          <span className="text-slate-400">Los cambios se guardan en este navegador.</span>
          {saveError && <p role="alert" className="text-rose-300">{saveError}</p>}
        </div>
        {/* TAB 0: GENERADOR IA PARA CUALQUIER TEMA */}
      {activeTab === 'ai' && (
        <AiStoryGenerator
          onLoadProject={(project) => {
            setCurrentProject(project);
            setActiveTab('studio');
          }}
        />
      )}

      {/* TAB 0B: LABORATORIO DE VIRALES */}
      {activeTab === 'laboratorio' && <ViralLab />}

      {/* TAB 1: STUDIO & REPRODUCTOR VERTICAL */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-left">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white font-heading">
                  Studio de Producción YouTube Shorts (1080×1920)
                </h1>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Revisá el gancho, el ritmo, los subtítulos y los efectos antes de exportar el video.
                </p>
              </div>

              {/* Quick Switch to other 2 sample shorts */}
              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 px-2">Muestras:</span>
                {SAMPLE_SHORTS_PROJECTS.map((sample, idx) => (
                  <button
                    key={sample.id}
                    onClick={() => setCurrentProject(sample)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                      currentProject.id === sample.id
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    #{idx + 1} {sample.topic.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Shorts Canvas Player */}
            <VerticalShortsPlayer
              project={currentProject}
              onProjectUpdate={handleUpdateProject}
            />
          </div>
        )}

        {/* TAB 2: GENERADOR DE 5 VARIANTES */}
        {activeTab === 'generator' && (
          <BatchVariantGenerator
            activeProject={currentProject}
            onSelectProjectForPlayback={handleSelectProject}
          />
        )}

        {/* TAB 3: 3 MUESTRAS DE VIDEOS LISTOS PARA YOUTUBE */}
        {activeTab === 'samples' && (
          <SampleShortsShowcase
            activeProject={currentProject}
            onSelectSample={handleSelectProject}
          />
        )}

        {/* TAB 4: EDITOR DE ESCENAS & MINIATURAS */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <button
                onClick={() => setEditorSubTab('scenes')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition ${
                  editorSubTab === 'scenes'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Línea de Tiempo de Escenas (~30s)</span>
              </button>

              <button
                onClick={() => setEditorSubTab('thumbnail')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition ${
                  editorSubTab === 'thumbnail'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Diseñador de Miniatura Viral</span>
              </button>
            </div>

            {editorSubTab === 'scenes' ? (
              <SceneTimelineEditor
                project={currentProject}
                onUpdateProject={handleUpdateProject}
              />
            ) : (
              <ThumbnailStudio
                project={currentProject}
                onUpdateProject={handleUpdateProject}
              />
            )}
          </div>
        )}

        {/* TAB 5: CÓDIGO FUENTE PYTHON 3.11 + FFMPEG */}
        {activeTab === 'codebase' && (
          <PythonCodebaseViewer currentProject={currentProject} />
        )}

        {/* TAB 6: LOGS & TERMINAL */}
        {activeTab === 'logs' && <PipelineConsoleLogs />}
      </main>

      {/* Settings Modal */}
      <ConfigSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
