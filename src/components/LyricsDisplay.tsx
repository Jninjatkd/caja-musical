import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ExperiencePhase, LyricCue } from '../types/musicBox';

interface LyricsDisplayProps {
  phase: ExperiencePhase;
  cues: LyricCue[];
  currentTime: number;
  duration: number;
  manualIndex: number;
  onManualIndexChange: (nextIndex: number) => void;
  onOpenTimingEditor: () => void;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  phase,
  cues,
  currentTime,
  duration,
  manualIndex,
  onManualIndexChange,
  onOpenTimingEditor,
}) => {
  const isVisible = phase === 'playing' || phase === 'paused' || phase === 'opening';

  const hasConfiguredTimings = useMemo(
    () => cues.some((c) => c.startTime !== null),
    [cues]
  );

  // When custom timestamps exist, match strictly against cue.startTime <= currentTime.
  // Otherwise, map currentTime proportionally across YouTube's reported duration
  // (or fallback manual stepping if duration is unavailable) and label it honestly as approximate.
  const { activeCue, activeIndex, isEstimatedMode } = useMemo(() => {
    if (hasConfiguredTimings) {
      let matched: LyricCue | null = null;
      let matchedIdx = -1;
      cues.forEach((cue, idx) => {
        if (cue.startTime !== null && cue.startTime <= currentTime + 0.08) {
          if (!matched || (matched.startTime ?? -1) <= cue.startTime) {
            matched = cue;
            matchedIdx = idx;
          }
        }
      });
      return {
        activeCue: matched,
        activeIndex: matchedIdx,
        isEstimatedMode: false,
      };
    }

    // Proportional progression synced to real YouTube playback clock (freezes when paused)
    if (duration > 10 && currentTime >= 0) {
      const introOffset = Math.min(8, duration * 0.05);
      const outroMargin = Math.min(10, duration * 0.06);
      const lyricSpan = Math.max(10, duration - introOffset - outroMargin);
      const progress = Math.min(
        0.999,
        Math.max(0, (currentTime - introOffset) / lyricSpan)
      );
      const idx =
        currentTime < introOffset
          ? 0
          : Math.min(cues.length - 1, Math.floor(progress * cues.length));
      return {
        activeCue: cues[idx] ?? null,
        activeIndex: idx,
        isEstimatedMode: true,
      };
    }

    const safeIdx = Math.min(Math.max(0, manualIndex), cues.length - 1);
    return {
      activeCue: cues[safeIdx] ?? null,
      activeIndex: safeIdx,
      isEstimatedMode: true,
    };
  }, [cues, currentTime, duration, hasConfiguredTimings, manualIndex]);

  if (!isVisible) return null;

  return (
    <div
      className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center justify-center text-center transition-opacity duration-700"
      aria-live="polite"
    >
      <div className="w-full px-5 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-[#fffaf8]/92 border border-[#e6cad3] shadow-[0_6px_24px_rgba(116,58,76,0.1)] flex flex-col items-center justify-center min-h-[82px]">
        {activeCue ? (
          <div
            key={activeCue.id}
            className="animate-[fadeIn_0.55s_ease-out] flex flex-col items-center gap-1.5"
          >
            <p
              className="font-serif italic font-semibold text-[23px] sm:text-[31px] leading-snug text-[#5b2837] drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
              style={{ textWrap: 'balance' }}
            >
              “{activeCue.text}”
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#966a77]">
              {isEstimatedMode ? (
                <>
                  <span>Avance aproximado</span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={onOpenTimingEditor}
                    className="underline decoration-[#c89ba7] underline-offset-2 hover:text-[#6b3646] transition-colors cursor-pointer"
                  >
                    Ajustar tiempos exactos
                  </button>
                </>
              ) : (
                <span className="tabular-nums">
                  Frase {activeIndex + 1} de {cues.length}
                </span>
              )}

              {isEstimatedMode && duration <= 10 && phase !== 'opening' && (
                <span className="inline-flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    onClick={() => onManualIndexChange(Math.max(0, manualIndex - 1))}
                    disabled={manualIndex <= 0}
                    aria-label="Frase anterior"
                    className="p-1 rounded-full hover:bg-[#e8ccd4]/40 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="tabular-nums">
                    {manualIndex + 1}/{cues.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onManualIndexChange(Math.min(cues.length - 1, manualIndex + 1))
                    }
                    disabled={manualIndex >= cues.length - 1}
                    aria-label="Siguiente frase"
                    className="p-1 rounded-full hover:bg-[#e8ccd4]/40 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="font-serif italic text-xl sm:text-2xl text-[#8d5c69]/75">
            ...
          </p>
        )}
      </div>
    </div>
  );
};
