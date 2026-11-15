import React, { useState } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import { ExperiencePhase } from '../types/musicBox';
import { isValidAnniversaryDate } from '../utils/dateValidator';

interface PasswordGateProps {
  phase: ExperiencePhase;
  onUnlockPassword: () => void;
  onPickUpKey: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({
  phase,
  onUnlockPassword,
  onPickUpKey,
}) => {
  const [dateInput, setDateInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (phase !== 'locked' && phase !== 'key-ready') {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidAnniversaryDate(dateInput)) {
      setErrorMessage(null);
      onUnlockPassword();
    } else {
      setErrorMessage(
        'Esa no es nuestra fecha especial, mi amor. Inténtalo nuevamente con todo tu corazón.'
      );
    }
  };

  if (phase === 'key-ready') {
    return (
      <div className="w-full max-w-md mx-auto px-4 pointer-events-auto">
        <div className="px-6 py-4 rounded-2xl bg-[#fffaf8]/92 border border-[#e3c4ce] shadow-[0_12px_32px_rgba(95,42,58,0.16)] text-center flex flex-col items-center gap-3">
          <p
            className="font-serif italic text-xl sm:text-2xl text-[#5a2938]"
            style={{ textWrap: 'balance' }}
          >
            «¡Lo recordaste! Ahora abre nuestro pequeño mundo»
          </p>
          <button
            type="button"
            onClick={onPickUpKey}
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full bg-[#8c4459] text-white text-xs font-medium tracking-wide hover:bg-[#743548] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-rose-500 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Tocar o recoger la llave dorada</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 pointer-events-auto">
      <form
        onSubmit={handleSubmit}
        className="px-6 py-5 rounded-2xl bg-[#fffaf8]/94 border border-[#e3c4ce] shadow-[0_14px_36px_rgba(95,42,58,0.16)] text-center flex flex-col items-center gap-3.5"
      >
        <div className="flex items-center justify-center gap-2 text-[#8c4459]">
          <Lock className="w-4 h-4 shrink-0" />
          <span className="text-[11px] font-medium tracking-[0.16em] uppercase">
            Cajita protegida
          </span>
        </div>

        <p
          className="font-serif italic text-lg sm:text-xl leading-snug text-[#552635]"
          style={{ textWrap: 'balance' }}
        >
          «Esta cajita guarda algo muy especial. Primero, demuestra que conoces nuestra fecha más importante».
        </p>

        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={dateInput}
            onChange={(e) => {
              setDateInput(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Ej. 24/02/2025"
            aria-label="Fecha de nuestro aniversario"
            className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#dec0c9] bg-white text-sm text-[#4a222f] placeholder:text-[#b48f9a] focus:outline-none focus:ring-2 focus:ring-[#8c4459]/40"
          />
          <button
            type="submit"
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#8c4459] text-white text-xs font-medium tracking-wide hover:bg-[#743548] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-500 cursor-pointer"
          >
            Desbloquear
          </button>
        </div>

        {errorMessage && (
          <p role="alert" className="text-xs text-[#9c3550] leading-relaxed">
            {errorMessage}
          </p>
        )}
      </form>
    </div>
  );
};
