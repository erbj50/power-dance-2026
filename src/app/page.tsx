'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import DigitalHeader from '@/components/DigitalHeader';
import { AudioProvider } from '@/context/AudioContext';

const AudioPlayer = dynamic(() => import('@/components/AudioPlayer'), { ssr: false });
const SideLeftDrawer = dynamic(() => import('@/components/SideLeftDrawer'), { ssr: false });
const SideRightDrawer = dynamic(() => import('@/components/SideRightDrawer'), { ssr: false });
const TurboProtector = dynamic(() => import('@/components/TurboProtector'), { ssr: false });
const LandingOpening = dynamic(() => import('@/components/LandingOpening'), { ssr: false });

export default function MainPage() {
  const [scale, setScale] = useState(1);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true); // Exibe sempre na inicialização/F5

  // Redimensionamento responsivo do container mantendo o aspect ratio
  useEffect(() => {
    const handleResize = () => {
      const originalW = 995;
      const originalH = showLanding ? 2000 : 1800; // Ajusta altura dependendo do estado

      const scaleX = window.innerWidth / originalW;
      const scaleY = window.innerHeight / originalH;
      const fitScale = Math.min(scaleX, scaleY);
      setScale(fitScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [showLanding]);

  // Loop Infinito do Drawer: Só inicia após o encerramento da Landing
  useEffect(() => {
    if (showLanding) return; // Não roda enquanto a Landing estiver ativa

    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    const runCycle = () => {
      // 1. Espera 1 minuto (60.000 ms) com o Drawer fechado
      timer1 = setTimeout(() => {
        setLeftOpen(true);

        // 2. Mantém o Drawer ABERTO por 3 minutos (180.000 ms)
        timer2 = setTimeout(() => {
          setLeftOpen(false);
          // Reinicia o ciclo em loop infinito
          runCycle();
        }, 3 * 60 * 1000);

      }, 1 * 60 * 1000);
    };

    runCycle();

    return () => {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
    };
  }, [showLanding]);

  return (
    <AudioProvider>
      <main className="w-screen h-[100dvh] bg-black flex items-center justify-center overflow-hidden fixed inset-0 select-none">
        <div
          id="wrapper"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            width: '995px',
            height: showLanding ? '2000px' : '1800px',
          }}
          className="relative bg-black flex flex-col items-center justify-start overflow-hidden shadow-2xl transition-transform duration-100 ease-out shrink-0"
        >
          {showLanding ? (
            <LandingOpening onComplete={() => setShowLanding(false)} />
          ) : (
            <>
              {/* Cabeçalho Digital */}
              <div className="relative z-30 w-full flex justify-center">
                <DigitalHeader
                  onToggleLeft={() => setLeftOpen((prev) => !prev)}
                  onToggleRight={() => setRightOpen((prev) => !prev)}
                />
              </div>

              {/* CAMADA 1: PLAYER PRINCIPAL */}
              <div
                className={`relative z-10 w-full flex-1 flex flex-col items-center transition-opacity duration-[3000ms] ${
                  leftOpen ? 'invisible opacity-0 pointer-events-none' : 'visible opacity-100'
                }`}
              >
                <AudioPlayer />

                <div className="absolute top-0 left-0 w-full h-[400px] z-20 pointer-events-none mt-[345px]">
                  <TurboProtector mediaSrc="/image/15.webp" idleTimeoutMs={20000} />
                </div>
              </div>

              {/* CAMADA 2: SIDE LEFT DRAWER (Abertura/Efeito sliding de 3 segundos em loop) */}
              <div
                className={`absolute top-[175px] left-0 w-full h-[1625px] z-40 transition-transform duration-[3000ms] ease-in-out ${
                  leftOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                <SideLeftDrawer isOpen={leftOpen} />
              </div>

              {/* CHAT DIREITO */}
              <div className="absolute top-0 left-0 w-full h-full z-50 pointer-events-none">
                <SideRightDrawer isOpen={rightOpen} />
              </div>
            </>
          )}
        </div>
      </main>
    </AudioProvider>
  );
}