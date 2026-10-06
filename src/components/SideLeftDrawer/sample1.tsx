'use client';

import React, { useEffect, useState } from 'react';

interface PadData {
  id: number;
  label: string;
  key: string;
  keyCode: number;
  audioUrl: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

const padConfig: PadData[] = [
  { id: 1, label: 'BRAS', key: 'R', keyCode: 82, audioUrl: './audio/Brasil-zil.mp3', bgClass: 'bg-[#f2ac0a]', borderClass: 'border-[#2ecc71]', textClass: 'text-[rgba(0,0,255,0.45)] text-3xl font-bold' },
  { id: 2, label: 'BR', key: 'T', keyCode: 84, audioUrl: './audio/brasil.mp3', bgClass: 'bg-[rgba(18,36,237,0.45)]', borderClass: 'border-[#2ecc71]', textClass: 'text-white text-xl font-bold' },
  { id: 3, label: 'BRASIL', key: 'Y', keyCode: 89, audioUrl: './audio/Brasil1.mp3', bgClass: 'bg-[#f00808]', borderClass: 'border-[#2ecc71]', textClass: 'text-white text-xl font-bold' },
  { id: 4, label: 'TURN', key: 'U', keyCode: 85, audioUrl: './audio/turnup.mp3', bgClass: 'bg-[rgba(167,21,21,0.523)]', borderClass: 'border-[#2ecc71]', textClass: 'text-[rgba(7,188,243,0.966)] text-xl font-bold' },
  { id: 5, label: 'DJRBJ', key: 'F', keyCode: 70, audioUrl: './audio/dj erbj.mp3', bgClass: 'bg-[#12ed50]', borderClass: 'border-[#07b8ee]', textClass: 'text-[rgba(255,8,140,0.86)] text-xl font-bold' },
  { id: 6, label: 'PWD', key: 'G', keyCode: 71, audioUrl: './audio/pwd.mp3', bgClass: 'bg-[#12afee]', borderClass: 'border-[#07b8ee]', textClass: 'text-[#ec3507] text-xl font-bold' },
  { id: 7, label: 'SOM', key: 'H', keyCode: 72, audioUrl: './audio/Cash box.mp3', bgClass: 'bg-[rgba(199,6,247,0.945)]', borderClass: 'border-[#07b8ee]', textClass: 'text-[#04e3f3] text-xl font-bold' },
  { id: 8, label: 'SIRENE', key: 'J', keyCode: 74, audioUrl: './audio/sirene.mp3', bgClass: 'bg-[#f0d908]', borderClass: 'border-[#07b8ee]', textClass: 'text-[rgba(28,9,237,0.668)] text-xl font-bold' },
];

export default function Sample2() {
  const [activePad, setActivePad] = useState<number | null>(null);

  const playAudio = (pad: PadData) => {
    setActivePad(pad.id);
    const audio = new Audio(pad.audioUrl);
    audio.play().catch((err) => console.log('Erro ao tocar áudio:', err));
    audio.onended = () => {
      setActivePad((current) => (current === pad.id ? null : current));
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const pad = padConfig.find((p) => p.keyCode === e.keyCode);
      if (pad) playAudio(pad);
    };

    const handleKeyUp = () => setActivePad(null);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="w-full max-w-[895px] h-full max-h-[580px] bg-black border-[10px] border-[rgba(233,250,2,0.342)] flex flex-col justify-between items-center p-4 relative font-['Oswald',sans-serif] select-none">
      <h3 className="text-[#2a2b23] text-2xl font-bold tracking-[15px] uppercase text-center mt-1">
        HIGH POWER AUDIO BANK
      </h3>

      <div className="w-full grid grid-cols-4 gap-3 my-auto">
        {padConfig.map((pad) => {
          const isActive = activePad === pad.id;
          return (
            <button
              key={pad.id}
              onMouseDown={() => playAudio(pad)}
              onMouseUp={() => setActivePad(null)}
              className={`h-[140px] flex items-center justify-center border-[3px] shadow-[0_8px_6px_-6px_black] transition-transform duration-200 ${
                pad.bgClass
              } ${pad.borderClass} ${pad.textClass} ${
                isActive ? 'bg-[#2b2b2b] scale-110' : 'hover:bg-[#5e5e5e]'
              }`}
            >
              {pad.label}
            </button>
          );
        })}
      </div>

      <h2 className="text-[#251f1f] text-3xl font-bold tracking-[25px] uppercase text-center mb-1">
        POWER SAMPLE PADS
      </h2>
    </div>
  );
}