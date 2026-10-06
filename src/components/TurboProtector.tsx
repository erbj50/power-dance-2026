'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TurboProtectorProps {
  children?: React.ReactNode;
  mediaSrc?: string; // O WebP animado do fundo
  idleTimeoutMs?: number;
}

export default function TurboProtector({
  children,
  mediaSrc = '/image/15.webp',
  idleTimeoutMs = 20000,
}: TurboProtectorProps) {
  const [isTurboVisible, setIsTurboVisible] = useState(true);
  const [isAbasAbertas, setIsAbasAbertas] = useState(false);

  // Define /image/cover.webp como a capa padrao inicial
  const [currentCover, setCurrentCover] = useState<string>('/image/cover.webp');

  // Estado para controlar a exibicao da capa a cada 30s
  const [showCoverCycle, setShowCoverCycle] = useState(true);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Alterna a exibicao da capa a cada 30 segundos (30s visivel / 30s oculto)
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCoverCycle((prev) => !prev);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Sanitiza a string para busca no Deezer
  const cleanQuery = (term: string) => {
    if (!term) return '';
    return term
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/www\.\S+/gi, '')
      .replace(/\.(cl|com|br|net|org|mp3|wav|m4a|aac)/gi, '')
      .replace(/\(\d+\)/g, '')
      .replace(/LOCAL\s*PLAYER/gi, '')
      .replace(/HOT\s*MIX/gi, '')
      .replace(/POWER\s*DANCE/gi, '')
      .replace(/[-_]/g, ' ')
      .trim();
  };

  // Busca a capa na API do Deezer se nao houver capa local (memorizada com useCallback)
  const fetchDeezerCover = useCallback(async (searchTerm: string) => {
    const query = cleanQuery(searchTerm);
    if (!query || query.length < 3) return null;

    const cacheKey = `deezer_cover_${query.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
      // Uso de caminho relativo para a rota da API
      const res = await fetch(`/api/deezer?q=${encodeURIComponent(query)}`);
      if (!res.ok) return null;
      const data = await res.json();

      if (data?.data && data.data.length > 0) {
        const coverUrl = data.data[0].album?.cover_big || data.data[0].album?.cover_medium;
        if (coverUrl) {
          localStorage.setItem(cacheKey, coverUrl);
          return coverUrl;
        }
      }
    } catch {
      // Captura erros de conexao e evita quebras/avisos no console
      console.warn('API Deezer indisponivel ou falha de conexao temporaria.');
    }
    return null;
  }, []);

  useEffect(() => {
    // 1. Tratador de evento para atualizacao direta de capa
    const handleCoverUpdate = async (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail?.cover) {
        setCurrentCover(event.detail.cover);
        setShowCoverCycle(true);
        return;
      }

      const title = event.detail?.title || event.detail?.label || event.detail?.fullTrack || '';
      const artist = event.detail?.artist || '';
      const query = artist ? `${artist} ${title}` : title;

      if (query) {
        const deezerImg = await fetchDeezerCover(query);
        setCurrentCover(deezerImg || '/image/cover.webp');
        setShowCoverCycle(true);
      } else {
        setCurrentCover('/image/cover.webp');
      }
    };

    // 2. Tratador de evento para atualizacao de metadados das faixas
    const handleMetadataUpdate = async (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail?.cover) {
        setCurrentCover(event.detail.cover);
        setShowCoverCycle(true);
        return;
      }

      const fullTrack = event.detail?.fullTrack || event.detail?.label || '';
      const artist = event.detail?.artist || '';
      const title = event.detail?.title || '';
      const query = artist && title ? `${artist} ${title}` : fullTrack;

      if (query) {
        const deezerImg = await fetchDeezerCover(query);
        setCurrentCover(deezerImg || '/image/cover.webp');
        setShowCoverCycle(true);
      } else {
        setCurrentCover('/image/cover.webp');
      }
    };

    window.addEventListener('playerCoverUpdate', handleCoverUpdate);
    window.addEventListener('trackMetadataUpdate', handleMetadataUpdate);
    window.addEventListener('radio_metadata_updated', handleMetadataUpdate);

    return () => {
      window.removeEventListener('playerCoverUpdate', handleCoverUpdate);
      window.removeEventListener('trackMetadataUpdate', handleMetadataUpdate);
      window.removeEventListener('radio_metadata_updated', handleMetadataUpdate);
    };
  }, [fetchDeezerCover]);

  const reativarProtecao = useCallback(() => {
    setIsAbasAbertas(false);
    setTimeout(() => {
      setIsTurboVisible(true);
    }, 4000);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (isAbasAbertas) {
      idleTimerRef.current = setTimeout(() => {
        reativarProtecao();
      }, idleTimeoutMs);
    }
  }, [isAbasAbertas, idleTimeoutMs, reativarProtecao]);

  const handleCapaClick = () => {
    if (!isAbasAbertas) {
      setIsTurboVisible(false);
      setIsAbasAbertas(true);
      resetIdleTimer();
    }
  };

  useEffect(() => {
    const handleUserActivity = () => {
      if (isAbasAbertas) {
        resetIdleTimer();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isAbasAbertas, resetIdleTimer]);

  return (
    <div
      id="master"
      className="relative w-[950px] h-[420px] bg-transparent overflow-hidden mx-auto select-none pointer-events-none"
    >
      {/* CAMADA DE FUNDO */}
      {children && (
        <div id="center" className="absolute inset-0 z-0 w-full h-full bg-transparent pointer-events-none">
          {children}
        </div>
      )}

      {/* ABA ESQUERDA (ABA L) */}
      <div
        id="aba-l"
        className={`absolute top-0 w-[476px] h-[420px] bg-no-repeat bg-cover z-20 cursor-pointer transition-all duration-[4000ms] ease-in-out ${
          isAbasAbertas ? '-left-[475px] pointer-events-none' : 'left-0 pointer-events-auto'
        }`}
        style={{ backgroundImage: "url('/image/L.jpeg')" }}
        onClick={handleCapaClick}
      />

      {/* ABA DIREITA (ABA R) */}
      <div
        id="aba-r"
        className={`absolute top-0 w-[476px] h-[420px] bg-no-repeat bg-cover z-20 cursor-pointer transition-all duration-[4000ms] ease-in-out ${
          isAbasAbertas ? '-right-[475px] pointer-events-none' : 'right-0 pointer-events-auto'
        }`}
        style={{ backgroundImage: "url('/image/R.jpg')" }}
        onClick={handleCapaClick}
      />

      {/* TELA DE PROTECAO (TURBO) */}
      <div
        id="TURBO"
        className={`absolute top-0 left-0 w-[950px] h-[420px] z-30 transition-all duration-500 ease-in-out ${
          isTurboVisible ? 'block opacity-100 pointer-events-auto' : 'hidden opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* 1. WEBP ANIMADO 100% VISIVEL NO BACKGROUND */}
          <div
            className="absolute inset-0 bg-cover bg-center w-full h-full z-0 opacity-100"
            style={{ backgroundImage: `url('${mediaSrc}')` }}
          />

          {/* 2. CAPA QUADRADA CENTRALIZADA (TRANSPARENTE / VISIVEL A CADA 30s POR 30s) */}
          {currentCover && (
            <div
              className={`relative z-10 transition-all duration-1000 transform ${
                showCoverCycle ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              {/* Moldura com Profundidade 3D / Brilho Neon */}
              <div className="relative group cursor-pointer flex items-center justify-center">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-1 via-cyan-1 to-indigo-1 rounded-xl blur-md opacity-80 group-hover:opacity-100 transition duration-500 animate-pulse" />

                <div className="relative w-[380px] h-[380px] bg-transparent-900 border-none border-black/60 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_25px_rgba(0,195,255,0.4)] flex items-center justify-center">
                  <img
                    src={currentCover}
                    alt="Cover da Midia"
                    className="w-full h-full object-contain rounded-lg bg-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AREA INVISIVEL PARA CAPTURAR CLIQUE E ABRIR ABAS */}
      <div
        id="touch"
        className={`absolute top-0 left-0 w-[950px] h-[420px] z-40 bg-transparent cursor-pointer ${
          isTurboVisible ? 'block pointer-events-auto' : 'hidden pointer-events-none'
        }`}
        onClick={handleCapaClick}
      />
    </div>
  );
}