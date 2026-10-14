'use client';

import React, { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';
import MetaCover from '@/components/SideLeftDrawer/ThreeDCarousel/meta-cover';
import { PLAYLIST_THEMES } from './playlistsConfig';

// Instância do IndexedDB para o Carrossel
const carouselDB = localforage.createInstance({
  name: 'PowerDanceCarouselDB',
  storeName: 'carousel_data',
});

// Lista de fundos do modo Padrão / Dance Now
const BACKGROUND_IMAGES = [
  'https://i.pinimg.com/originals/dd/dd/22/dddd220b1458dc3124516aa02528eecb.gif',
  'https://i.ibb.co/qMjzt3vq/PIST.webp',
  'https://i.pinimg.com/originals/f9/bf/0b/f9bf0b7d6465eeae7d1062542d5dd9f9.gif',
  'https://i.pinimg.com/originals/77/18/8c/77188ca81afc61cc0672a9bf75d565c8.gif',
  'https://i.pinimg.com/originals/3c/c8/b8/3cc8b81ae4daa4a2d45dccafaab1a9a8.gif',
  'https://i.pinimg.com/originals/46/6c/13/466c13661d4e507b4a942edf8c5bd34f.gif',
  '/image/tunel2.webp',
  '/image/tunel1.webp',
];

// Lista de fundos da rotação do Hits 80 (3 minutos)
const HITS80_BACKGROUNDS = [
  '/image/carrosel/bg1.webp',
  '/image/carrosel/bg2.webp',
  '/image/carrosel/bg3.webp',
  '/image/carrosel/bg4.webp',
  '/image/carrosel/bg5.webp',
  '/image/carrosel/bg6.webp',
];

const STORAGE_KEY = 'firebase_carousel_data';
const GLOBAL_INDEX_KEY = 'carousel_global_index';

interface ThreeDCarouselProps {
  activePlaylist?: string; // Nome da playlist ativa vinda do AzuraCast
}

export default function ThreeDCarousel({ activePlaylist = 'dance now' }: ThreeDCarouselProps) {
  const normalizedPlaylist = activePlaylist ? activePlaylist.toLowerCase().trim() : 'dance now';

  // Mapeamento dinâmico das playlists
  const isHits80 = normalizedPlaylist === 'hits 80' || normalizedPlaylist === 'hits80';
  const isDanceNow =
    normalizedPlaylist === 'dance now' ||
    normalizedPlaylist === 'dancenow' ||
    normalizedPlaylist === 'top 10' ||
    normalizedPlaylist === 'default';

  // Refs de controle global e gaveta
  const isDrawerOpenRef = useRef<boolean>(false);

  // Estados do Modo Padrão / Dance Now
  const [masterBg, setMasterBg] = useState(BACKGROUND_IMAGES[0]);
  const [dimensions, setDimensions] = useState({ width: 899, height: 899 });
  const [iframeSources, setIframeSources] = useState<string[]>(['META_COVER']);
  const [linkSources, setLinkSources] = useState<string[]>(['https://metadapower.vercel.app']);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const MAX_SIZE = 899;
  const growingRef = useRef<boolean>(false);
  const widthRef = useRef<number>(MAX_SIZE);
  const heightRef = useRef<number>(MAX_SIZE);
  const iframeSourcesRef = useRef<string[]>(iframeSources);

  // Estados do Modo Hits 80 (Anel Orbital 3D)
  const [hits80BgIndex, setHits80BgIndex] = useState(0);
  const [cardsData, setCardsData] = useState<string[]>([]);
  const [zoomedCardIndex, setZoomedCardIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);
  const currentAngleRef = useRef(0);
  const isPausedRef = useRef(false);
  const lapCounterRef = useRef(0);
  const targetCardIndexRef = useRef(0);
  const currentImageNumRef = useRef(1);

  const TOTAL_CARDS = 25;
  const MAX_IMAGES = 100;
  const RADIUS = 1900;
  const LAPS_REQUIRED = 2;

  useEffect(() => {
    iframeSourcesRef.current = iframeSources;
  }, [iframeSources]);

  // Escuta a abertura da aba SideLeftDrawer
  useEffect(() => {
    const handleDrawerStatus = (e: any) => {
      if (e.detail && typeof e.detail.isOpen === 'boolean') {
        isDrawerOpenRef.current = e.detail.isOpen;
      }
    };
    window.addEventListener('sideDrawerStatus', handleDrawerStatus);
    return () => window.removeEventListener('sideDrawerStatus', handleDrawerStatus);
  }, []);

  // =========================================================================
  // LOGICA MODO HITS 80 (ANEL ORBITAL 3D - LOCAL WEBP)
  // =========================================================================

  const getNextHits80Image = () => {
    const url = `/image/carrosel/${currentImageNumRef.current}.webp`;
    currentImageNumRef.current = currentImageNumRef.current >= MAX_IMAGES ? 1 : currentImageNumRef.current + 1;
    return url;
  };

  // Inicializa o carrossel do Hits 80
  useEffect(() => {
    if (!isHits80) return;

    currentImageNumRef.current = 1;
    const initialImages: string[] = [];
    for (let i = 0; i < TOTAL_CARDS; i++) {
      initialImages.push(getNextHits80Image());
    }
    setCardsData(initialImages);
    currentAngleRef.current = 0;
    lapCounterRef.current = 0;
    targetCardIndexRef.current = 0;
    isPausedRef.current = false;
    setIsZoomed(false);
    setZoomedCardIndex(null);
  }, [isHits80]);

  // Rotação do background pai a cada 3 minutos no Hits 80
  useEffect(() => {
    if (!isHits80) return;
    const bgTimer = setInterval(() => {
      setHits80BgIndex((prev) => (prev + 1) % HITS80_BACKGROUNDS.length);
    }, 180000);
    return () => clearInterval(bgTimer);
  }, [isHits80]);

  // Loop de Animação 3D do Hits 80
  useEffect(() => {
    if (!isHits80) return;

    let animId: number;

    const animateWheel = () => {
      if (!isPausedRef.current && isDrawerOpenRef.current) {
        currentAngleRef.current -= 0.3;

        const wheelEl = wheelRef.current;
        if (wheelEl) {
          const children = Array.from(wheelEl.children) as HTMLElement[];
          children.forEach((cardEl, idx) => {
            if (!cardEl.classList.contains('expanded')) {
              const baseAngle = (360 / TOTAL_CARDS) * idx;
              const totalAngle = baseAngle + currentAngleRef.current;
              const normalized = ((totalAngle % 360) + 360) % 360;

              if (normalized > 90 && normalized < 270) {
                cardEl.style.zIndex = '10';
                cardEl.style.opacity = '0.6';
              } else {
                cardEl.style.zIndex = '100';
                cardEl.style.opacity = '1';
              }

              cardEl.style.transform = `rotateY(${totalAngle}deg) translateZ(${RADIUS}px)`;
            }
          });
        }

        const currentLap = Math.floor(Math.abs(currentAngleRef.current) / 360);
        const targetIdx = targetCardIndexRef.current;
        const baseAngleTarget = (360 / TOTAL_CARDS) * targetIdx;
        const normalizedAngleTarget = Math.abs((baseAngleTarget + currentAngleRef.current) % 360);

        if (currentLap >= lapCounterRef.current + LAPS_REQUIRED && normalizedAngleTarget < 0.8) {
          lapCounterRef.current = currentLap;
          triggerHits80Expand(targetIdx);
        }
      }

      animId = requestAnimationFrame(animateWheel);
    };

    animId = requestAnimationFrame(animateWheel);
    return () => cancelAnimationFrame(animId);
  }, [isHits80, cardsData]);

  const triggerHits80Expand = (targetIdx: number) => {
    isPausedRef.current = true;
    setIsZoomed(true);

    setTimeout(() => {
      setZoomedCardIndex(targetIdx);
    }, 50);

    // Permanece expandido por 10 segundos
    setTimeout(() => {
      setZoomedCardIndex(null);

      // Troca a imagem para a próxima sequencial (1.webp a 100.webp)
      const nextImg = getNextHits80Image();
      setCardsData((prev) => {
        const next = [...prev];
        next[targetIdx] = nextImg;
        return next;
      });

      // Retoma o giro acelerado sem delay
      setTimeout(() => {
        setIsZoomed(false);
        targetCardIndexRef.current = (targetCardIndexRef.current + 1) % TOTAL_CARDS;
        isPausedRef.current = false;
      }, 150);
    }, 10000);
  };

  // =========================================================================
  // LOGICA MODO DANCE NOW / DEMAIS PLAYLISTS (FIREBASE E CLOUDINARY)
  // =========================================================================

  useEffect(() => {
    if (isHits80) return;

    const loadPlaylistData = async () => {
      const theme = PLAYLIST_THEMES[normalizedPlaylist];

      if (theme && theme.images.length > 0) {
        montarFontesComMetaLocal(theme.images, theme.links);
        return;
      }

      // Se for Dance Now ou modo padrão com banco Firebase
      try {
        const dadosLocais = await carouselDB.getItem<Record<string, any>>(STORAGE_KEY);
        if (dadosLocais) {
          montarFontesComFirebase(dadosLocais);
        }
      } catch (e) {
        console.error('Erro ao ler IndexedDB:', e);
      }

      try {
        const res = await fetch('https://power-adm-galery-default-rtdb.firebaseio.com/dados.json');
        if (res.ok) {
          const snapshot = await res.json();
          if (snapshot) {
            await carouselDB.setItem(STORAGE_KEY, snapshot);
            montarFontesComFirebase(snapshot);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar do Realtime Database:', err);
      }
    };

    loadPlaylistData();
  }, [activePlaylist, isHits80, normalizedPlaylist]);

  const montarFontesComMetaLocal = (images: string[], links: string[]) => {
    const finalIframes: string[] = [];
    const finalLinks: string[] = [];

    for (let i = 0; i < images.length; i++) {
      finalIframes.push(images[i]);
      finalLinks.push(links[i] || 'https://metadapower.vercel.app');

      if ((i + 1) % 5 === 0) {
        finalIframes.push('META_COVER');
        finalLinks.push('https://metadapower.vercel.app');
      }
    }

    setIframeSources(finalIframes);
    setLinkSources(finalLinks);
    setCurrentIndex(0);
  };

  const montarFontesComFirebase = (dados: Record<string, any>) => {
    const rawIframes: string[] = [];
    const rawLinks: string[] = [];

    for (let id = 1; id <= 100; id++) {
      if (dados[id] && typeof dados[id] === 'object') {
        const img = dados[id].img && !dados[id].img.startsWith('data:image') ? dados[id].img : '';
        if (img) {
          rawIframes.push(img);
          rawLinks.push(dados[id].url || '');
        }
      }
    }

    const finalIframes: string[] = [];
    const finalLinks: string[] = [];

    for (let i = 0; i < rawIframes.length; i++) {
      finalIframes.push(rawIframes[i]);
      finalLinks.push(rawLinks[i]);

      if ((i + 1) % 5 === 0) {
        finalIframes.push('META_COVER');
        finalLinks.push('https://metadapower.vercel.app');
      }
    }

    if (finalIframes.length === 0) {
      finalIframes.push('META_COVER');
      finalLinks.push('https://metadapower.vercel.app');
    }

    setIframeSources(finalIframes);
    setLinkSources(finalLinks);
  };

  // Animação contínua do modo Dance Now
  useEffect(() => {
    if (isHits80) return;

    const PAUSE = 10000;
    const INTERVAL = 20;
    let timeoutId: NodeJS.Timeout | null = null;

    const step = () => {
      if (!isDrawerOpenRef.current) {
        timeoutId = setTimeout(step, 500);
        return;
      }

      let w = widthRef.current;
      let h = heightRef.current;

      if (growingRef.current) {
        w += 10;
        h += 10;
      } else {
        w -= 10;
        h -= 10;
      }

      if (w >= MAX_SIZE) {
        w = MAX_SIZE;
        h = MAX_SIZE;
        growingRef.current = false;
        widthRef.current = w;
        heightRef.current = h;
        setDimensions({ width: w, height: h });
        timeoutId = setTimeout(step, PAUSE);
        return;
      }

      if (w <= 0) {
        w = 0;
        h = 0;
        growingRef.current = true;
        widthRef.current = w;
        heightRef.current = h;
        setDimensions({ width: w, height: h });

        setCurrentIndex((prev) => {
          const total = iframeSourcesRef.current.length;
          const nextIndex = total > 0 ? (prev + 1) % total : 0;
          carouselDB.setItem(GLOBAL_INDEX_KEY, nextIndex);
          return nextIndex;
        });

        timeoutId = setTimeout(step, 500);
        return;
      }

      widthRef.current = w;
      heightRef.current = h;
      setDimensions({ width: w, height: h });
      timeoutId = setTimeout(step, INTERVAL);
    };

    timeoutId = setTimeout(step, PAUSE);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isHits80]);

  // Troca de fundo do Master (Dance Now)
  useEffect(() => {
    if (isHits80) return;
    let index = 0;
    const timer = setInterval(() => {
      index = (index + 1) % BACKGROUND_IMAGES.length;
      setMasterBg(BACKGROUND_IMAGES[index]);
    }, 180000);

    return () => clearInterval(timer);
  }, [isHits80]);

  const handleOpenLink = () => {
    const link = linkSources[currentIndex];
    if (!link) return;

    if (link.startsWith('whatsapp:')) {
      window.open(link, '_blank');
    } else if (link.startsWith('__whatsapp__')) {
      const numero = window.atob(link.replace('__whatsapp__', ''));
      window.open(`https://wa.me/${numero}`, '_blank');
    } else {
      window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
    }
  };

  // =========================================================================
  // RENDERIZAÇÃO DA INTERFACE
  // =========================================================================

  if (isHits80) {
    return (
      <div
        className={`relative w-[899px] h-[899px] max-w-[95vw] max-h-[95vw] overflow-hidden flex items-center justify-center select-none bg-cover bg-center transition-all duration-1000 ${
          isZoomed ? 'zoomed' : ''
        }`}
        style={{
          backgroundImage: `url('${HITS80_BACKGROUNDS[hits80BgIndex]}')`,
          perspective: '2500px',
        }}
      >
        <div className="absolute w-full h-full bg-[radial-gradient(circle_at_50%_45%,rgba(0,0,0,0.22)_0%,transparent_65%)] pointer-events-none z-[1]" />

        {/* LOGO CENTRAL HITS 80 */}
        <div
          className={`absolute top-[23%] w-[600px] h-[300px] rounded-[24px] border-4 border-[rgba(0,255,255,0)] bg-cover bg-center bg-no-repeat z-[50] pointer-events-none transition-opacity duration-200 ${
            isZoomed ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backgroundImage: "url('/image/h80s.webp')" }}
        />

        {/* ANEL ORBITAL 3D */}
        <div
          ref={wheelRef}
          className="absolute w-full h-full top-[23%] left-0 flex items-center justify-center z-[20]"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateY(20px) rotateX(-18deg) translateZ(-1800px)',
          }}
        >
          {cardsData.map((imgUrl, idx) => {
            const isExpanded = zoomedCardIndex === idx;
            return (
              <div
                key={idx}
                className={`absolute w-[260px] h-[260px] rounded-[16px] bg-cover bg-center bg-no-repeat border-2 border-[rgba(0,213,255,0.975)] shadow-[0_0_25px_rgba(0,255,255,0.3)] transition-all duration-800 cursor-pointer ${
                  isExpanded
                    ? 'expanded !fixed !top-[-24%] !left-0 !w-[899px] !h-[899px] !rounded-[20px] !border-[#ff00ff00] !shadow-[0_0_100px_#ff00ff03,inset_0_0_60px_rgba(0,255,255,0)] !z-[999999] !opacity-100'
                    : isZoomed
                    ? '!opacity-0 pointer-events-none'
                    : ''
                }`}
                style={{
                  backgroundImage: `url('${imgUrl}')`,
                  transform: isExpanded ? 'translate3d(0px, 0px, 1800px) rotateY(0deg) rotateX(0deg)' : undefined,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // MODO DANCE NOW / DEMAIS PLAYLISTS (Carrossel Padrão com URLs e Links)
  const currentSource = iframeSources[currentIndex] || 'META_COVER';

  return (
    <div className="relative w-[900px] h-[900px] max-w-full max-h-full bg-[rgba(104,103,51,0.027)] overflow-hidden flex items-center justify-center select-none">
      <div
        className="relative w-full h-full max-h-[1600px] bg-cover bg-center flex items-center justify-center transition-all duration-700"
        style={{ backgroundImage: `url('${masterBg}')` }}
      >
        <div
          onClick={handleOpenLink}
          className="absolute overflow-hidden cursor-pointer flex items-center justify-center bg-transparent"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            left: `${(MAX_SIZE - dimensions.width) / 2}px`,
            top: `${(MAX_SIZE - dimensions.height) / 2}px`,
          }}
        >
          {currentSource === 'META_COVER' ? (
            <MetaCover />
          ) : currentSource.endsWith('.html') ||
            (currentSource.startsWith('https://') &&
              !currentSource.includes('cloudinary.com') &&
              !currentSource.includes('imgur.com')) ? (
            <iframe
              src={currentSource}
              className="w-full h-full border-none pointer-events-none"
              scrolling="no"
            />
          ) : (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url('${currentSource}')` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}