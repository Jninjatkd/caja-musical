import { useCallback, useEffect, useRef, useState } from 'react';

export const YOUTUBE_VIDEO_ID = 'jhx3hYS__JI';
export const YOUTUBE_EXTERNAL_URL = 'https://youtu.be/jhx3hYS__JI?si=9IiduFeDs2ONXC_u';

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          height?: string | number;
          width?: string | number;
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

interface UseYouTubePlayerOptions {
  containerId: string;
  onSongEnded: () => void;
}

export function useYouTubePlayer({ containerId, onSongEnded }: UseYouTubePlayerOptions) {
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const pendingPlayRef = useRef(false);
  const onEndedRef = useRef(onSongEnded);
  onEndedRef.current = onSongEnded;

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playTimeoutRef = useRef<number | null>(null);

  const clearPlayTimeout = () => {
    if (playTimeoutRef.current !== null) {
      window.clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const createPlayer = () => {
      if (!mounted || !window.YT?.Player || playerRef.current) return;
      const el = document.getElementById(containerId);
      if (!el) return;

      playerRef.current = new window.YT.Player(containerId, {
        width: 240,
        height: 135,
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
          enablejsapi: 1,
        },
        events: {
          onReady: (event) => {
            if (!mounted) return;
            setIsReady(true);
            const dur = event.target.getDuration?.() ?? 0;
            if (dur > 0) setDuration(dur);

            if (pendingPlayRef.current) {
              pendingPlayRef.current = false;
              try {
                event.target.playVideo();
              } catch {
                setHasError(true);
              }
            }
          },
          onStateChange: (event) => {
            if (!mounted || !window.YT) return;
            const st = event.data;
            const PS = window.YT.PlayerState;

            if (st === PS.PLAYING) {
              clearPlayTimeout();
              setHasError(false);
              setIsBuffering(false);
              setIsPlaying(true);
              const dur = event.target.getDuration?.() ?? 0;
              if (dur > 0) setDuration(dur);
            } else if (st === PS.PAUSED) {
              clearPlayTimeout();
              setIsBuffering(false);
              setIsPlaying(false);
              const t = event.target.getCurrentTime?.() ?? 0;
              setCurrentTime(t);
            } else if (st === PS.BUFFERING) {
              setIsBuffering(true);
            } else if (st === PS.ENDED) {
              clearPlayTimeout();
              setIsBuffering(false);
              setIsPlaying(false);
              const dur = event.target.getDuration?.() ?? 0;
              if (dur > 0) setCurrentTime(dur);
              onEndedRef.current();
            }
          },
          onError: () => {
            if (!mounted) return;
            clearPlayTimeout();
            setIsBuffering(false);
            setIsPlaying(false);
            setHasError(true);
          },
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        createPlayer();
      };

      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => {
          if (mounted) setHasError(true);
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      mounted = false;
      clearPlayTimeout();
      try {
        playerRef.current?.destroy();
      } catch {
        // Ignore teardown errors
      }
      playerRef.current = null;
    };
  }, [containerId]);

  // Poll real currentTime smoothly while playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      try {
        const t = playerRef.current?.getCurrentTime?.();
        if (typeof t === 'number' && Number.isFinite(t)) {
          setCurrentTime(t);
        }
      } catch {
        // Ignore read error
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  const play = useCallback(() => {
    clearPlayTimeout();
    setHasError(false);

    if (!playerRef.current || !isReady) {
      pendingPlayRef.current = true;
      setIsBuffering(true);
      playTimeoutRef.current = window.setTimeout(() => {
        if (!playerRef.current || !isReady) {
          setIsBuffering(false);
          setHasError(true);
        }
      }, 6500);
      return;
    }

    try {
      setIsBuffering(true);
      playerRef.current.playVideo();
      playTimeoutRef.current = window.setTimeout(() => {
        try {
          const state = playerRef.current?.getPlayerState?.();
          if (window.YT && state !== window.YT.PlayerState.PLAYING) {
            setIsBuffering(false);
            setHasError(true);
          }
        } catch {
          setIsBuffering(false);
          setHasError(true);
        }
      }, 6000);
    } catch {
      setIsBuffering(false);
      setHasError(true);
    }
  }, [isReady]);

  const pause = useCallback(() => {
    pendingPlayRef.current = false;
    clearPlayTimeout();
    setIsBuffering(false);
    setIsPlaying(false);
    try {
      playerRef.current?.pauseVideo();
    } catch {
      // Ignore
    }
  }, []);

  const restart = useCallback((autoPlay = true) => {
    clearPlayTimeout();
    setCurrentTime(0);
    setHasError(false);
    if (!playerRef.current || !isReady) {
      pendingPlayRef.current = autoPlay;
      return;
    }
    try {
      playerRef.current.seekTo(0, true);
      if (autoPlay) {
        setIsBuffering(true);
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      }
    } catch {
      setHasError(true);
    }
  }, [isReady]);

  const seekTo = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    try {
      playerRef.current?.seekTo(seconds, true);
    } catch {
      // Ignore
    }
  }, []);

  return {
    isReady,
    isPlaying,
    isBuffering,
    hasError,
    currentTime,
    duration,
    play,
    pause,
    restart,
    seekTo,
  };
}
