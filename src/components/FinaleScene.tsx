import React from 'react';
import { RotateCcw } from 'lucide-react';

interface FinaleSceneProps {
  visible: boolean;
  onReplay: () => void;
}

const STARS = [
  { id: 1, left: '8%', top: '14%', size: 2, dur: '3.2s', delay: '0s' },
  { id: 2, left: '16%', top: '32%', size: 3, dur: '4.1s', delay: '0.6s' },
  { id: 3, left: '24%', top: '18%', size: 2, dur: '3.7s', delay: '1.3s' },
  { id: 4, left: '33%', top: '10%', size: 3, dur: '4.5s', delay: '0.4s' },
  { id: 5, left: '44%', top: '24%', size: 2, dur: '3.4s', delay: '1.8s' },
  { id: 6, left: '58%', top: '12%', size: 3, dur: '4.0s', delay: '0.9s' },
  { id: 7, left: '69%', top: '22%', size: 2, dur: '3.5s', delay: '2.1s' },
  { id: 8, left: '78%', top: '15%', size: 3, dur: '4.3s', delay: '0.2s' },
  { id: 9, left: '88%', top: '28%', size: 2, dur: '3.8s', delay: '1.5s' },
  { id: 10, left: '92%', top: '46%', size: 3, dur: '4.4s', delay: '0.7s' },
  { id: 11, left: '12%', top: '64%', size: 2, dur: '3.9s', delay: '1.1s' },
  { id: 12, left: '22%', top: '78%', size: 3, dur: '4.2s', delay: '2.4s' },
  { id: 13, left: '76%', top: '72%', size: 2, dur: '3.6s', delay: '0.5s' },
  { id: 14, left: '86%', top: '82%', size: 3, dur: '4.6s', delay: '1.7s' },
  { id: 15, left: '52%', top: '84%', size: 2, dur: '3.3s', delay: '1.0s' },
  { id: 16, left: '38%', top: '74%', size: 2, dur: '4.0s', delay: '2.0s' },
];

const FLOATING_HEARTS = [
  { id: 1, left: '18%', top: '76%', drift: '-14px', dur: '6.5s', delay: '0s', size: 15 },
  { id: 2, left: '32%', top: '82%', drift: '18px', dur: '7.4s', delay: '1.4s', size: 18 },
  { id: 3, left: '50%', top: '86%', drift: '-8px', dur: '6.8s', delay: '0.8s', size: 14 },
  { id: 4, left: '68%', top: '80%', drift: '16px', dur: '7.2s', delay: '2.1s', size: 17 },
  { id: 5, left: '82%', top: '74%', drift: '-16px', dur: '6.9s', delay: '1.1s', size: 15 },
];

export const FinaleScene: React.FC<FinaleSceneProps> = ({ visible, onReplay }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Starlit romantic background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(164, 78, 108, 0.28) 0%, rgba(58, 22, 38, 0.72) 48%, rgba(20, 10, 16, 0.96) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Twinkling stars */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {STARS.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full bg-[#fcebd7] animate-twinkle-star"
            style={
              {
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                boxShadow: '0 0 8px rgba(252, 235, 215, 0.85)',
                '--dur': star.dur,
                '--delay': star.delay,
              } as React.CSSProperties
            }
          />
        ))}

        {/* Gentle rising hearts */}
        {FLOATING_HEARTS.map((heart) => (
          <div
            key={heart.id}
            className="absolute animate-rise-heart"
            style={
              {
                left: heart.left,
                top: heart.top,
                '--drift-x': heart.drift,
                '--dur': heart.dur,
                '--delay': heart.delay,
              } as React.CSSProperties
            }
          >
            <svg width={heart.size} height={heart.size} viewBox="0 0 24 22" fill="none">
              <path
                d="M12 20.5C12 20.5 2 14.2 2 7.2C2 4.1 4.4 1.8 7.3 1.8C9.2 1.8 10.9 2.8 12 4.3C13.1 2.8 14.8 1.8 16.7 1.8C19.6 1.8 22 4.1 22 7.2C22 14.2 12 20.5 12 20.5Z"
                fill="rgba(244, 152, 178, 0.55)"
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Center protagonist message: ONLY "Te amo con mi alma entera" */}
      <div className="relative z-10 max-w-3xl mx-auto animate-finale-reveal">
        <div
          className="pointer-events-none absolute -inset-12 rounded-full animate-gentle-glow"
          style={{
            background:
              'radial-gradient(circle, rgba(246, 189, 198, 0.24) 0%, rgba(235, 185, 130, 0.1) 45%, transparent 72%)',
            filter: 'blur(18px)',
          }}
          aria-hidden="true"
        />
        <h1
          className="relative font-serif italic font-medium text-[40px] sm:text-[62px] md:text-[74px] leading-[1.15] text-[#fdf2ee] tracking-wide"
          style={{
            textWrap: 'balance',
            textShadow:
              '0 0 28px rgba(245, 180, 196, 0.55), 0 0 60px rgba(235, 190, 128, 0.3)',
          }}
        >
          Te amo con mi alma entera
        </h1>
      </div>

      {/* Small discreet replay button */}
      <div className="relative z-10 mt-14 opacity-0 animate-[finale-text-reveal_1.4s_ease-out_1.8s_forwards]">
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full border border-[#f5d5df]/30 bg-[#ffffff]/8 text-xs tracking-wider text-[#f5dce4] hover:bg-[#ffffff]/15 hover:border-[#f5d5df]/55 transition-all duration-200 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-rose-300 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Volver a reproducir
        </button>
      </div>
    </div>
  );
};
