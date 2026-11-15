import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, ExternalLink, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { AmbientParticles } from './components/AmbientParticles';
import { FinaleScene } from './components/FinaleScene';
import { LyricsDisplay } from './components/LyricsDisplay';
import { LyricsTimingEditor } from './components/LyricsTimingEditor';
import { MusicBoxCanvas3D } from './components/MusicBoxCanvas3D';
import { PasswordGate } from './components/PasswordGate';
import {
  clearLyricsTimings,
  loadLyricsConfig,
  saveLyricsConfig,
} from './data/lyricsConfig';
import { YOUTUBE_EXTERNAL_URL, useYouTubePlayer } from './hooks/useYouTubePlayer';
import { ExperiencePhase, LyricCue } from './types/musicBox';

export default function App() {
  const [phase, setPhase] = useState<ExperiencePhase>('locked');
  const [cues, setCues] = useState<LyricCue[]>(() => loadLyricsConfig());
  const [manualLyricIndex, setManualLyricIndex] = useState(0);
  const [isTimingEditorOpen, setIsTimingEditorOpen] = useState(false);
  const [allowSilentDance, setAllowSilentDance] = useState(false);
  const [modelsState, setModelsState] = useState<{
    loaded: boolean;
    error?: string;
    loadProgress: number;
  }>({ loaded: false, loadProgress: 0 });

  const openingTimerRef = useRef<number | null>(null);
  const endingTimerRef = useRef<number | null>(null);

  const clearSequenceTimers = useCallback(() => {
    if (openingTimerRef.current !== null) {
      window.clearTimeout(openingTimerRef.current);
      openingTimerRef.current = null;
    }
    if (endingTimerRef.current !== null) {
      window.clearTimeout(endingTimerRef.current);
      endingTimerRef.current = null;
    }
  }, []);

  const handleSongEnded = useCallback(() => {
    clearSequenceTimers();
    setAllowSilentDance(false);
    setIsTimingEditorOpen(false);
    setPhase('ending');

    // Allow couple tender pose, turntable stop, lid closing & fade (~3.6s) before finale
    endingTimerRef.current = window.setTimeout(() => {
      setPhase('finale');
    }, 3600);
  }, [clearSequenceTimers]);

  const yt = useYouTubePlayer({
    containerId: 'yt-music-box-player',
    onSongEnded: handleSongEnded,
  });

  const effectivelyDancing =
    phase === 'playing' && (yt.isPlaying || allowSilentDance);

  useEffect(() => {
    return () => clearSequenceTimers();
  }, [clearSequenceTimers]);

  // Step 4 -> 5: Password validated -> golden key appears
  const handlePasswordUnlocked = useCallback(() => {
    if (phase !== 'locked') return;
    setPhase('key-ready');
  }, [phase]);

  // Step 6: User clicks/taps the 3D golden key -> key moves, inserts & turns in lock
  const handlePickUpKey = useCallback(() => {
    if (phase !== 'key-ready') return;
    clearSequenceTimers();
    setPhase('unlocking');
  }, [clearSequenceTimers, phase]);

  // Step 7: Lock clicked open & key withdrew -> open lid & start song + dance
  const handleUnlockComplete = useCallback(() => {
    clearSequenceTimers();
    setManualLyricIndex(0);
    setAllowSilentDance(false);
    setPhase('opening');

    yt.restart(true);

    openingTimerRef.current = window.setTimeout(() => {
      setPhase((prev) => (prev === 'opening' ? 'playing' : prev));
    }, 1150);
  }, [clearSequenceTimers, yt]);

  const handleTogglePlayPause = useCallback(() => {
    if (phase === 'playing') {
      if (yt.isPlaying) {
        yt.pause();
      }
      setAllowSilentDance(false);
      setPhase('paused');
    } else if (phase === 'paused') {
      if (yt.hasError) {
        setAllowSilentDance(true);
      } else {
        yt.play();
      }
      setPhase('playing');
    }
  }, [phase, yt]);

  const handleRestartSong = useCallback(() => {
    clearSequenceTimers();
    setManualLyricIndex(0);
    setAllowSilentDance(false);
    setPhase('playing');
    yt.restart(true);
  }, [clearSequenceTimers, yt]);

  const handleReplayAll = useCallback(() => {
    clearSequenceTimers();
    setManualLyricIndex(0);
    setAllowSilentDance(false);
    setIsTimingEditorOpen(false);
    yt.restart(false);
    setPhase('key-ready');
  }, [clearSequenceTimers, yt]);

  const handleUpdateCueTime = useCallback((id: number, nextTime: number | null) => {
    setCues((prev) => {
      const updated = prev.map((cue) =>
        cue.id === id ? { ...cue, startTime: nextTime } : cue
      );
      saveLyricsConfig(updated);
      return updated;
    });
  }, []);

  const handleResetTimings = useCallback(() => {
    const cleared = clearLyricsTimings();
    setCues(cleared);
  }, []);

  const isStageActive = phase === 'opening' || phase === 'playing' || phase === 'paused';
  const isDarkTransition = phase === 'ending' || phase === 'finale';

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden transition-colors duration-[2000ms] ease-in-out select-none"
      style={{
        background: isDarkTransition
          ? 'radial-gradient(circle at 50% 45%, #341726 0%, #1d0d16 55%, #11070d 100%)'
          : 'radial-gradient(circle at 50% 38%, #fffaf8 0%, #f7e6ea 52%, #ebd0d7 100%)',
      }}
    >
      {/* Official YouTube IFrame Player Container */}
      <div
        className="fixed bottom-0 right-0 w-[240px] h-[135px] opacity-[0.005] pointer-events-none -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div id="yt-music-box-player" />
      </div>

      {/* Three.js 3D Music Box, Golden Key & GLB Ternurines Scene */}
      <MusicBoxCanvas3D
        phase={phase}
        isMusicPlaying={yt.isPlaying}
        allowSilentDance={allowSilentDance}
        onPickUpKey={handlePickUpKey}
        onUnlockComplete={handleUnlockComplete}
        onModelsReady={setModelsState}
      />

      {/* Ambient Sparkles & Ending Hearts */}
      <AmbientParticles phase={phase} />

      {/* Top Zone: Lyrics Display above Music Box (pointer-events-none so 3D scene stays draggable) */}
      <header className="relative z-20 w-full pt-4 sm:pt-7 px-4 min-h-[112px] flex flex-col items-center justify-center pointer-events-none gap-2">
        <div className="pointer-events-auto w-full flex justify-center">
          <LyricsDisplay
            phase={phase}
            cues={cues}
            currentTime={yt.currentTime}
            duration={yt.duration}
            manualIndex={manualLyricIndex}
            onManualIndexChange={setManualLyricIndex}
            onOpenTimingEditor={() => setIsTimingEditorOpen(true)}
          />
        </div>

        {/* Model loading state notice (only shown briefly until GLBs finish loading) */}
        {!modelsState.loaded && !modelsState.error && (
          <p className="text-xs text-[#8e5f6c] bg-[#fffaf8]/85 px-3.5 py-1.5 rounded-full border border-[#e6cad3]">
            Preparando los ternurines 3D...
          </p>
        )}
        {modelsState.error && (
          <p className="text-xs text-[#9c3550] bg-[#fffaf8]/92 px-3.5 py-1.5 rounded-full border border-[#e6cad3]">
            {modelsState.error}
          </p>
        )}
      </header>

      {/* Center spacer so the 3D WebGL viewport center remains 100% unobstructed */}
      <main className="relative z-10 flex-1 w-full pointer-events-none" />

      {/* Bottom Dock: Password Gate / Key Prompt / Playback Controls */}
      <footer className="relative z-20 w-full pb-5 sm:pb-7 px-4 flex flex-col items-center justify-end gap-3 pointer-events-none">
        <PasswordGate
          phase={phase}
          onUnlockPassword={handlePasswordUnlocked}
          onPickUpKey={handlePickUpKey}
        />

        {phase === 'unlocking' && (
          <p className="text-sm font-serif italic text-[#6d3948] bg-[#fffaf8]/90 px-4 py-2 rounded-full border border-[#e6cad3]">
            Abriendo nuestra cajita musical...
          </p>
        )}

        {isStageActive && (
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {/* Play / Pause */}
            <button
              type="button"
              onClick={handleTogglePlayPause}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-[#fffaf8]/92 border border-[#dcbcc6] text-xs font-medium text-[#5f2f3d] shadow-xs hover:bg-white hover:border-[#c896a4] transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-500 cursor-pointer"
            >
              {phase === 'playing' ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Reanudar</span>
                </>
              )}
            </button>

            {/* Restart */}
            <button
              type="button"
              onClick={handleRestartSong}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-[#fffaf8]/90 border border-[#e3c7d0] text-xs font-medium text-[#6f3e4c] hover:bg-white hover:border-[#c896a4] transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-500 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>

            {/* Editable Lyric Timings */}
            <button
              type="button"
              onClick={() => setIsTimingEditorOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-[#fffaf8]/90 border border-[#e3c7d0] text-xs font-medium text-[#6f3e4c] hover:bg-white hover:border-[#c896a4] transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-500 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Ajustar tiempos</span>
            </button>
          </div>
        )}

        {/* Buffering hint when YouTube is loading */}
        {isStageActive && yt.isBuffering && !yt.hasError && !allowSilentDance && (
          <p className="text-xs text-[#8f5e6c] bg-[#fffaf8]/85 px-3 py-1 rounded-full">
            Preparando la melodía...
          </p>
        )}

        {/* Fallback if embedded YouTube playback is blocked or restricted */}
        {isStageActive && yt.hasError && (
          <div className="pointer-events-auto max-w-md mx-auto px-4 py-2.5 rounded-xl bg-[#fffaf8]/95 border border-[#e3c3cd] text-center shadow-sm flex flex-col items-center gap-2">
            <p className="text-xs text-[#6d3d4b]">
              No se pudo reproducir el video integrado en este navegador.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href={YOUTUBE_EXTERNAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-[#8c4459] text-white text-xs font-medium hover:bg-[#763749] transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir canción en YouTube
              </a>
              {!effectivelyDancing && (
                <button
                  type="button"
                  onClick={() => {
                    setAllowSilentDance(true);
                    setPhase('playing');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-[#d6b2bd] text-xs font-medium text-[#6d3d4b] hover:bg-[#f8eaee] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Bailar mientras escuchas
                </button>
              )}
              {allowSilentDance && (
                <button
                  type="button"
                  onClick={handleSongEnded}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-[#d6b2bd] text-xs font-medium text-[#6d3d4b] hover:bg-[#f8eaee] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cerrar cajita
                </button>
              )}
            </div>
          </div>
        )}
      </footer>

      {/* Lyrics Timing Configuration Modal */}
      <LyricsTimingEditor
        isOpen={isTimingEditorOpen}
        cues={cues}
        currentTime={yt.currentTime}
        isPlaying={yt.isPlaying}
        onClose={() => setIsTimingEditorOpen(false)}
        onUpdateCueTime={handleUpdateCueTime}
        onResetTimings={handleResetTimings}
        onSeekTo={yt.seekTo}
      />

      {/* Romantic Starlit Finale */}
      <FinaleScene visible={phase === 'finale'} onReplay={handleReplayAll} />
    </div>
  );
}
