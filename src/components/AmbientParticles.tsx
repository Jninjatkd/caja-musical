import React from 'react';
import { ExperiencePhase } from '../types/musicBox';

interface AmbientParticlesProps {
  phase: ExperiencePhase;
}

const SPARKLES = [
  { id: 1, left: '12%', top: '24%', size: 6, dur: '6.5s', delay: '0s' },
  { id: 2, left: '22%', top: '68%', size: 5, dur: '7.2s', delay: '1.1s' },
  { id: 3, left: '34%', top: '18%', size: 4, dur: '5.8s', delay: '2.2s' },
  { id: 4, left: '66%', top: '22%', size: 6, dur: '6.9s', delay: '0.7s' },
  { id: 5, left: '78%', top: '62%', size: 5, dur: '7.6s', delay: '1.8s' },
  { id: 6, left: '88%', top: '32%', size: 4, dur: '6.1s', delay: '2.7s' },
  { id: 7, left: '48%', top: '14%', size: 5, dur: '8.0s', delay: '0.4s' },
  { id: 8, left: '18%', top: '44%', size: 4, dur: '7.0s', delay: '3.1s' },
  { id: 9, left: '84%', top: '46%', size: 5, dur: '6.4s', delay: '1.5s' },
  { id: 10, left: '56%', top: '80%', size: 4, dur: '7.4s', delay: '2.4s' },
];

const ENDING_HEARTS = [
  { id: 1, left: '36%', top: '58%', drift: '-22px', dur: '3.8s', delay: '0s', size: 16 },
  { id: 2, left: '44%', top: '62%', drift: '14px', dur: '4.2s', delay: '0.35s', size: 20 },
  { id: 3, left: '52%', top: '56%', drift: '-12px', dur: '3.6s', delay: '0.6s', size: 14 },
  { id: 4, left: '60%', top: '60%', drift: '24px', dur: '4.5s', delay: '0.9s', size: 18 },
  { id: 5, left: '48%', top: '52%', drift: '6px', dur: '3.9s', delay: '1.2s', size: 15 },
  { id: 6, left: '40%', top: '54%', drift: '-18px', dur: '4.1s', delay: '1.45s', size: 13 },
  { id: 7, left: '56%', top: '64%', drift: '18px', dur: '4.3s', delay: '0.2s', size: 16 },
];

export const AmbientParticles: React.FC<AmbientParticlesProps> = ({ phase }) => {
  const isPlayingOrOpening = phase === 'opening' || phase === 'playing';
  const isEnding = phase === 'ending';

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-10" aria-hidden="true">
      {/* Subtle warm golden dust motes */}
      {SPARKLES.map((sp) => (
        <span
          key={sp.id}
          className="absolute rounded-full animate-float-dust transition-opacity duration-1000"
          style={
            {
              left: sp.left,
              top: sp.top,
              width: `${sp.size}px`,
              height: `${sp.size}px`,
              opacity: isPlayingOrOpening ? 0.65 : 0.28,
              background:
                'radial-gradient(circle, rgba(255,244,214,0.95) 0%, rgba(224,182,110,0.45) 55%, transparent 100%)',
              boxShadow: '0 0 8px rgba(235, 198, 130, 0.5)',
              '--dur': sp.dur,
              '--delay': sp.delay,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Rising hearts & sparkles during closing sequence */}
      {isEnding &&
        ENDING_HEARTS.map((heart) => (
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
            <svg
              width={heart.size}
              height={heart.size}
              viewBox="0 0 24 22"
              fill="none"
              className="drop-shadow-[0_2px_10px_rgba(232,120,152,0.55)]"
            >
              <path
                d="M12 20.5C12 20.5 2 14.2 2 7.2C2 4.1 4.4 1.8 7.3 1.8C9.2 1.8 10.9 2.8 12 4.3C13.1 2.8 14.8 1.8 16.7 1.8C19.6 1.8 22 4.1 22 7.2C22 14.2 12 20.5 12 20.5Z"
                fill="#f092ad"
              />
            </svg>
          </div>
        ))}
    </div>
  );
};
