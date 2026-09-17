export type GenerationEvent = { time: string; message: string; error: boolean };
const events: GenerationEvent[] = [];
export function generationEvent(message: string, error = false) {
  events.push({ time: new Date().toLocaleTimeString(), message, error });
  if (events.length > 100) events.shift();
  window.dispatchEvent(new Event('shortsforge-log'));
}
export function generationEvents() { return [...events]; }
