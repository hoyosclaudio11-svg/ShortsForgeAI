import { useEffect, useState } from 'react';
import { generationEvents } from '../services/generationLog';
export function PipelineConsoleLogs() {
  const [events, setEvents] = useState(generationEvents);
  useEffect(() => {
    const update = () => setEvents(generationEvents());
    window.addEventListener('shortsforge-log', update);
    return () => window.removeEventListener('shortsforge-log', update);
  }, []);
  return <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3">
    <h1 className="text-xl font-bold">Actividad de generación</h1>
    <p className="text-sm text-slate-400">Solicitudes realizadas desde el generador automático y el Studio en esta sesión.</p>
    {!events.length && <p className="text-slate-400">Todavía no hay solicitudes registradas.</p>}
    {events.map((event, index) => <p key={index} className={`font-mono text-sm ${event.error ? 'text-rose-300' : 'text-emerald-300'}`}>{event.time} · {event.message}</p>)}
  </section>;
}
