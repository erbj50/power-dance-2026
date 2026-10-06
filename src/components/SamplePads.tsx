'use client';

import React, { useEffect, useState } from 'react';

const BANK_1 = [
  { code: '82', key: 'R', label: 'DJ', audio: 'https://static.wixstatic.com/mp3/4ecd86_c4b0d411a9934c32b9ddb1994896a625.mp3', bg: 'bg-[#f2ac0a]' },
  { code: '84', key: 'T', label: 'POWER', audio: 'https://static.wixstatic.com/mp3/4ecd86_e54fefa551d84310a3290dc22d6ba47c.mp3', bg: 'bg-[#1224ed]' },
  { code: '89', key: 'Y', label: 'SUSSU', audio: '/audio/vamos la sussu.mp3', bg: 'bg-[#f00808]' },
  { code: '85', key: 'U', label: 'ATÔMICO', audio: 'https://cdn.pixabay.com/audio/2024/01/22/audio_78d6b9f8ea.mp3', bg: 'bg-[#a71515]' },
  { code: '70', key: 'F', label: 'DJRBJ', audio: '/audio/dj erbj.mp3', bg: 'bg-[#12ed50]' },
  { code: '71', key: 'G', label: 'PWD', audio: '/audio/pwd.mp3', bg: 'bg-[#12afed]' },
  { code: '72', key: 'H', label: 'DJBJ', audio: '/audio/dj-bj11.mp3', bg: 'bg-[#c706f7]' },
  { code: '74', key: 'J', label: 'SIRENE', audio: '/audio/sirene.mp3', bg: 'bg-[#f0d908]' },
];

export default function SamplePads() {
  const [activePad, setActivePad] = useState<string | null>(null);

  const triggerAudio = (key: string, url: string) => {
    setActivePad(key);
    const snd = new Audio(url);
    snd.play().catch(() => {});
    snd.onended = () => setActivePad(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const match = BANK_1.find(p => p.key === e.key.toUpperCase());
      if (match) triggerAudio(match.key, match.audio);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-[1000px] h-[580px] bg-black border-[10px] border-[#e9fa02]/40 flex flex-col justify-center items-center p-4">
      <div className="grid grid-cols-4 gap-4 w-[860px]">
        {BANK_1.map((pad) => (
          <div
            key={pad.key}
            onClick={() => triggerAudio(pad.key, pad.audio)}
            className={`w-[180px] h-[160px] flex items-center justify-center font-bold text-3xl cursor-pointer select-none transition-transform duration-100 ${pad.bg} ${
              activePad === pad.key ? 'scale-95 brightness-125' : 'hover:brightness-110'
            }`}
          >
            {pad.label}
          </div>
        ))}
      </div>
      <h2 className="text-white text-3xl tracking-[15px] font-bold mt-6">POWER SAMPLE PADS</h2>
    </div>
  );
}