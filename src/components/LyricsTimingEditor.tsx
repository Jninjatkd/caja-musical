import React, { useMemo, useState } from 'react';
import { Clock, RotateCcw, X, Check } from 'lucide-react';
import { LyricCue } from '../types/musicBox';
import { formatTimeSeconds, parseTimeInput } from '../data/lyricsConfig';

interface LyricsTimingEditorProps {
  isOpen: boolean;
  cues: LyricCue[];
  currentTime: number;
  isPlaying: boolean;
  onClose: () => void;
  onUpdateCueTime: (id: number, nextTime: number | null) => void;
  onResetTimings: () => void;
  onSeekTo: (seconds: number) => void;
}

export const LyricsTimingEditor: React.FC<LyricsTimingEditorProps> = ({
  isOpen,
  cues,
  currentTime,
  isPlaying,
  onClose,
  onUpdateCueTime,
  onResetTimings,
  onSeekTo,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftValue, setDraftValue] = useState('');

  // Find the first cue without a timestamp to offer 1-tap live marking while listening
  const nextUnmarkedCue = useMemo(
    () => cues.find((c) => c.startTime === null) ?? null,
    [cues]
  );

  if (!isOpen) return null;

  const handleMarkNext = () => {
    if (!nextUnmarkedCue) return;
    onUpdateCueTime(nextUnmarkedCue.id, Number(currentTime.toFixed(1)));
  };

  const commitDraft = (id: number) => {
    const parsed = parseTimeInput(draftValue);
    onUpdateCueTime(id, parsed);
    setEditingId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a121b]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timing-editor-title"
    >
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-[#fffaf8] border border-[#e3c7cf] shadow-2xl overflow-hidden text-[#4c2833]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#efe0e4]">
          <div>
            <h2 id="timing-editor-title" className="font-serif text-2xl font-semibold text-[#5e2f3d]">
              Sincronización de la letra
            </h2>
            <p className="text-xs text-[#8f6471] mt-0.5 tabular-nums">
              Tiempo actual: {formatTimeSeconds(currentTime)}
              {!isPlaying ? ' (en pausa)' : ''} ·{' '}
              {cues.some((c) => c.startTime !== null)
                ? 'Usando tiempos personalizados'
                : 'Sin tiempos exactos (avance aproximado)'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar editor de tiempos"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-[#f6e8ec] text-[#6d3d4b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Tap Bar */}
        <div className="px-5 py-3 bg-[#fdf2f5] border-b border-[#efe0e4] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#734553] max-w-[260px]">
            {nextUnmarkedCue ? (
              <span>
                Siguiente frase sin tiempo:{' '}
                <strong className="font-medium text-[#542836]">
                  "{nextUnmarkedCue.text}"
                </strong>
              </span>
            ) : (
              <span>Todas las frases tienen un tiempo asignado.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {nextUnmarkedCue && (
              <button
                type="button"
                onClick={handleMarkNext}
                className="px-3.5 py-2 min-h-[40px] rounded-lg bg-[#8c4459] text-white text-xs font-medium hover:bg-[#763749] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                Marcar ahora ({formatTimeSeconds(currentTime)})
              </button>
            )}
            <button
              type="button"
              onClick={onResetTimings}
              title="Limpiar todos los tiempos"
              className="px-3 py-2 min-h-[40px] rounded-lg border border-[#dcc0c8] text-xs font-medium text-[#6c3e4c] hover:bg-[#f6e8ec] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar
            </button>
          </div>
        </div>

        {/* Editable Cue List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-[#f3e6ea]">
          {cues.map((cue, idx) => {
            const isEditing = editingId === cue.id;
            return (
              <div
                key={cue.id}
                className="py-2.5 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-[#9b717e] tabular-nums mr-2">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[#4c2833]">{cue.text}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        commitDraft(cue.id);
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="text"
                        value={draftValue}
                        onChange={(e) => setDraftValue(e.target.value)}
                        placeholder="0:15.0"
                        autoFocus
                        className="w-20 px-2 py-1 text-xs tabular-nums rounded border border-[#c99ca8] bg-white text-[#4c2833] focus:outline-none focus:ring-2 focus:ring-[#8c4459]/40"
                      />
                      <button
                        type="submit"
                        aria-label="Guardar tiempo"
                        className="p-1.5 rounded bg-[#8c4459] text-white hover:bg-[#763749] cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(cue.id);
                          setDraftValue(
                            cue.startTime !== null ? formatTimeSeconds(cue.startTime) : ''
                          );
                        }}
                        className="px-2.5 py-1.5 min-h-[34px] rounded-md border border-[#e3ccd2] text-xs tabular-nums text-[#6d3d4b] hover:bg-[#f7eaee] transition-colors cursor-pointer"
                      >
                        {cue.startTime !== null ? formatTimeSeconds(cue.startTime) : 'Editar'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCueTime(cue.id, Number(currentTime.toFixed(1)))
                        }
                        title="Asignar tiempo actual"
                        className="px-2 py-1.5 min-h-[34px] rounded-md text-xs text-[#8c4459] hover:bg-[#f7eaee] transition-colors cursor-pointer"
                      >
                        Marcar
                      </button>
                      {cue.startTime !== null && (
                        <button
                          type="button"
                          onClick={() => onSeekTo(cue.startTime!)}
                          title="Ir a este momento"
                          className="px-2 py-1.5 min-h-[34px] rounded-md text-xs text-[#9b717e] hover:bg-[#f7eaee] transition-colors cursor-pointer"
                        >
                          Ir
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
