import { LyricCue } from '../types/musicBox';

const STORAGE_KEY = 'nuestra_cajita_lyrics_timings_v2';

/**
 * Transcripción exacta de la canción proporcionada por el usuario.
 * Los tiempos (startTime en segundos) inician en `null` para no inventar
 * marcas de tiempo falsas. Pueden configurarse aquí directamente o desde
 * el editor interactivo dentro de la aplicación (guardado en localStorage).
 */
export const DEFAULT_LYRICS_CONFIG: LyricCue[] = [
  // Estrofa 1
  { id: 1, stanza: 1, text: 'Tus besos se llegaron a recrear', startTime: null },
  { id: 2, stanza: 1, text: 'Aquí en mi boca', startTime: null },
  { id: 3, stanza: 1, text: 'Llenando de ilusión y de pasión', startTime: null },
  { id: 4, stanza: 1, text: 'Mi vida loca', startTime: null },

  // Estrofa 2
  { id: 5, stanza: 2, text: 'Las horas más felices de mi amor', startTime: null },
  { id: 6, stanza: 2, text: 'Fueron contigo', startTime: null },
  { id: 7, stanza: 2, text: 'Por eso es que mi alma siempre extraña', startTime: null },
  { id: 8, stanza: 2, text: 'El dulce alivio', startTime: null },

  // Estrofa 3
  { id: 9, stanza: 3, text: 'Te puedo yo jurar ante un altar', startTime: null },
  { id: 10, stanza: 3, text: 'Mi amor sincero', startTime: null },
  { id: 11, stanza: 3, text: 'A todo el mundo le puedes contar', startTime: null },
  { id: 12, stanza: 3, text: 'Que sí te quiero', startTime: null },

  // Estrofa 4
  { id: 13, stanza: 4, text: 'Tus labios me enseñaron a sentir', startTime: null },
  { id: 14, stanza: 4, text: 'Lo que es ternura', startTime: null },
  { id: 15, stanza: 4, text: 'Y no me cansaré de bendecir', startTime: null },
  { id: 16, stanza: 4, text: 'Tanta dulzura', startTime: null },

  // Estrofa 5
  { id: 17, stanza: 5, text: 'Tus besos se llegaron a recrear', startTime: null },
  { id: 18, stanza: 5, text: 'Aquí en mi boca', startTime: null },
  { id: 19, stanza: 5, text: 'Llenando de ilusión y de pasión', startTime: null },
  { id: 20, stanza: 5, text: 'Mi vida loca', startTime: null },

  // Estrofa 6
  { id: 21, stanza: 6, text: 'Las horas más felices de mi amor', startTime: null },
  { id: 22, stanza: 6, text: 'Fueron contigo', startTime: null },
  { id: 23, stanza: 6, text: 'Por eso es que mi alma siempre extraña', startTime: null },
  { id: 24, stanza: 6, text: 'El dulce alivio', startTime: null },

  // Estrofa 7
  { id: 25, stanza: 7, text: 'Te puedo yo jurar ante un altar', startTime: null },
  { id: 26, stanza: 7, text: 'Mi amor sincero', startTime: null },
  { id: 27, stanza: 7, text: 'A todo el mundo le puedes contar', startTime: null },
  { id: 28, stanza: 7, text: 'Que sí te quiero', startTime: null },

  // Estrofa 8
  { id: 29, stanza: 8, text: 'Tus labios me enseñaron a sentir', startTime: null },
  { id: 30, stanza: 8, text: 'Lo que es ternura', startTime: null },
  { id: 31, stanza: 8, text: 'Y no me cansaré de bendecir', startTime: null },
  { id: 32, stanza: 8, text: 'Tanta dulzura', startTime: null },
];

export function loadLyricsConfig(): LyricCue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LYRICS_CONFIG;
    const parsed = JSON.parse(raw) as Array<{ id: number; startTime: number | null }>;
    if (!Array.isArray(parsed)) return DEFAULT_LYRICS_CONFIG;

    const timeById = new Map<number, number | null>();
    for (const item of parsed) {
      if (typeof item.id === 'number') {
        timeById.set(
          item.id,
          typeof item.startTime === 'number' && Number.isFinite(item.startTime)
            ? Math.max(0, item.startTime)
            : null
        );
      }
    }

    return DEFAULT_LYRICS_CONFIG.map((cue) => ({
      ...cue,
      startTime: timeById.has(cue.id) ? timeById.get(cue.id)! : cue.startTime,
    }));
  } catch {
    return DEFAULT_LYRICS_CONFIG;
  }
}

export function saveLyricsConfig(cues: LyricCue[]): void {
  try {
    const compact = cues.map(({ id, startTime }) => ({ id, startTime }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function clearLyricsTimings(): LyricCue[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_LYRICS_CONFIG;
}

export function formatTimeSeconds(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '--:--';
  const clamped = Math.max(0, seconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  const tenths = Math.floor((clamped % 1) * 10);
  return `${mins}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export function parseTimeInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length !== 2) return null;
    const mins = Number(parts[0]);
    const secs = Number(parts[1]);
    if (!Number.isFinite(mins) || !Number.isFinite(secs) || mins < 0 || secs < 0) return null;
    return Number((mins * 60 + secs).toFixed(1));
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return null;
  return Number(num.toFixed(1));
}
