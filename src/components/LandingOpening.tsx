'use client';

import React, { useState, useRef, useEffect } from 'react';

interface LandingOpeningProps {
  onComplete: () => void;
}

interface ImagemMarquee {
  src: string;
  width: number;
}

export default function LandingOpening({ onComplete }: LandingOpeningProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const [leftClosed, setLeftClosed] = useState(false);
  const [rightClosed, setRightClosed] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isDoorHidden, setIsDoorHidden] = useState(false);

  // Lista de imagens com dimensões para o espaçador proporcional
  const listaImagens: ImagemMarquee[] = [
    { src: "/images/landd/1disc.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 1600 },
    { src: "/images/landd/10.webp", width: 320 },
    { src: "/images/landd/ridem.webp", width: 650 },
    { src: "/images/landd/9.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 650 },
    { src: "/images/landd/8.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 650 },
    { src: "/images/landd/7.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 650 },
    { src: "/images/landd/6.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 650 },
    { src: "/images/landd/5.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 650 },
    { src: "/images/landd/4.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 650 },
    { src: "/images/landd/3.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 650 },
    { src: "/images/landd/2.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 550 },
    { src: "/images/landd/1.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 2000 },
    { src: "/images/landd/1disc.webp", width: 280 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/1disc.webp", width: 280 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/1disc.webp", width: 280 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/dj-stuff-dj-cat.webp", width: 280 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/snap1.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 950 },
    { src: "/images/landd/dd4.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/le-click.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/technotroni.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/snap-power.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/party1985.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/snap.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 280 },
    { src: "/images/landd/dancing-90s.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 350 },
    { src: "/images/landd/gotcha.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/dd.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/dd3.webp", width: 220 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/john.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/dd1.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/jackson.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/dirty-dancing.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/running.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/dancess.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 450 },
    { src: "/images/landd/eu.webp", width: 250 },
    { src: "/images/landd/ridem.webp", width: 1000 },
    { src: "/images/landd/eu-dj.webp", width: 280 },
    { src: "/images/landd/ridem.webp", width: 860 },
    { src: "/images/landd/1disc.webp", width: 300 },
  ];

  // Algoritmo de sincronização com a reprodução do áudio
  const sincronizarMarquee = () => {
    const audio = audioRef.current;
    const container = marqueeRef.current;

    if (!audio || !container || audio.paused || audio.ended) {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      return;
    }

    const containerWidth = 995;
    const totalWidth = container.scrollWidth;
    const totalDistance = containerWidth + totalWidth;

    const duracao = audio.duration || 1;
    const progresso = audio.currentTime / duracao;

    const deslocamento = progresso * totalDistance;
    container.style.transform = `translateX(-${deslocamento}px)`;

    animFrameId.current = requestAnimationFrame(sincronizarMarquee);
  };

  const iniciarAbertura = () => {
    if (isStarted) return;
    setIsStarted(true);

    // Ativa a animação das portas
    setLeftClosed(true);
    setRightClosed(true);

    // Oculta completamente as abas apenas após concluir os 3 segundos (3000ms) de transição
    setTimeout(() => {
      setIsDoorHidden(true);
    }, 3000);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        animFrameId.current = requestAnimationFrame(sincronizarMarquee);
      }).catch((err) => console.warn("Autoplay bloqueado:", err));
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  return (
    <div className="relative w-[995px] h-[2000px] bg-black select-none overflow-hidden">
      {/* Fundo e Logo */}
      <img src="/images/landd/fd1.webp" alt="Fundo" width={995} height={1000} />
      <img
        className="absolute top-[430px] left-[400px] z-0"
        src="/images/landd/danclog.webp"
        alt="Logo Dance"
        width={150}
        height={150}
      />

      <img src="/images/landd/leds1.webp" width={995} height={97} alt="LEDs" />

      {/* ÁREA DO LETREIRO / MARQUEE SINCRONIZADO */}
      <div className="relative z-20 w-[995px] h-[297px] bg-black overflow-hidden flex items-center">
        <div
          ref={marqueeRef}
          className="absolute left-[100%] flex items-center whitespace-nowrap will-change-transform"
        >
          {listaImagens.map((item, index) => (
            <img
              key={index}
              src={item.src}
              alt=""
              style={{
                height: '250px',
                width: `${item.width}px`,
                minWidth: `${item.width}px`,
                maxWidth: `${item.width}px`,
                flexShrink: 0,
                objectFit: 'cover',
                display: 'inline-block',
              }}
            />
          ))}
        </div>
      </div>

      {/* Botão Entrar / Pular */}
      <button
        onClick={onComplete}
        className="relative z-20 w-[900px] h-[200px] mx-auto mt-4 block p-0 border-none bg-gradient-to-br from-[#2b2b2b] to-[#111111] rounded-xl cursor-pointer shadow-2xl hover:brightness-110 active:translate-y-1 transition-all overflow-hidden"
      >
        <img src="/images/landd/noar.webp" width={900} height={200} alt="No Ar" className="w-full h-full object-cover rounded-xl" />
      </button>

      {/* Aba Esquerda (50% de 995px = 497.5px) */}
      <div
        className={`absolute top-0 left-0 w-[497.5px] h-[2000px] bg-[url('/images/landd/UUWRyU1.webp')] bg-cover bg-center z-30 transition-transform duration-[3000ms] ease-in-out ${
          leftClosed ? '-translate-x-full pointer-events-none' : 'translate-x-0'
        } ${isDoorHidden ? 'hidden' : ''}`}
      >
        <button onClick={iniciarAbertura} className="w-full h-full bg-transparent border-none cursor-pointer" />
      </div>

      {/* Aba Direita (50% de 995px = 497.5px) */}
      <div
        className={`absolute top-0 left-[497.5px] w-[497.5px] h-[2000px] bg-[url('/images/landd/UUWRyU1.webp')] bg-cover bg-center z-30 transition-transform duration-[3000ms] ease-in-out ${
          rightClosed ? 'translate-x-full pointer-events-none' : 'translate-x-0'
        } ${isDoorHidden ? 'hidden' : ''}`}
      >
        <button onClick={iniciarAbertura} className="w-full h-full bg-transparent border-none cursor-pointer" />
      </div>

      <audio
        ref={audioRef}
        src="/media/abertura.mp3"
        onEnded={() => {
          if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
          onComplete();
        }}
        onPause={() => {
          if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
        }}
        onPlay={() => {
          animFrameId.current = requestAnimationFrame(sincronizarMarquee);
        }}
      />
    </div>
  );
}