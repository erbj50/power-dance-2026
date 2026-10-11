'use client';

import React, { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';
import MetaCover from '@/components/SideLeftDrawer/ThreeDCarousel/meta-cover';

// Cria uma instância isolada do IndexedDB exclusiva para o Carrossel do Firebase
const carouselDB = localforage.createInstance({
  name: 'PowerDanceCarouselDB',
  storeName: 'carousel_data',
});

const BACKGROUND_IMAGES = [
  'https://i.pinimg.com/originals/dd/dd/22/dddd220b1458dc3124516aa02528eecb.gif',
  'https://i.ibb.co/qMjzt3vq/PIST.webp',
  'https://i.pinimg.com/originals/f9/bf/0b/f9bf0b7d6465eeae7d1062542d5dd9f9.gif',
  'https://i.pinimg.com/originals/77/18/8c/77188ca81afc61cc0672a9bf75d565c8.gif',
  'https://i.pinimg.com/originals/3c/c8/b8/3cc8b81ae4daa4a2d45dccafaab1a9a8.gif',
  'https://i.pinimg.com/originals/46/6c/13/466c13661d4e507b4a942edf8c5bd34f.gif',
  'https://i.pinimg.com/originals/90/61/24/906124f481f73867a0cafe1227f7374e.gif', 
  'https://img1.picmix.com/output/stamp/normal/0/5/8/4/1404850_951ff.gif',
  'https://i.pinimg.com/originals/80/f6/6f/80f66fc3c111b7c232bf7b2e18bf776f.gif',
  'https://media.giphy.com/media/lQIZtn9fmPZJqVqEP3/giphy.gif',
  'https://i.pinimg.com/originals/81/28/a4/8128a49d5f7b10b38d9aa6dd17544198.gif',
  'https://cdn.pixabay.com/animation/2023/06/14/03/32/03-32-40-575_512.gif',
  'https://i.pinimg.com/originals/e9/be/91/e9be91ad6c80cc45e292253643d64c5a.gif',
  'https://i.pinimg.com/originals/bd/22/0a/bd220ae76603aeb588b11bd9479e7ff5.gif',
  'https://i.pinimg.com/originals/e0/18/6b/e0186bb13e968af183177a9548e9914c.gif',
  'https://i.pinimg.com/originals/4a/64/45/4a64459b1790703fa6c618a47942404f.gif',
  'https://i.pinimg.com/originals/a8/5b/d3/a85bd3b49927ee9f9f8afec4d0a8f5a9.gif',
  'https://i.pinimg.com/originals/b8/50/05/b85005e08fb4d0a411ae2ce689b313b5.gif',
  'https://i.pinimg.com/originals/54/61/a0/5461a0abbbbb687149736c068651fc23.gif',
  'https://i.pinimg.com/originals/cf/cb/b6/cfcbb6ca7b85b2bd85af51822ab3e56e.gif',
  'https://i.pinimg.com/originals/9c/6c/1d/9c6c1dd45a8c98dcb78b46f0f30bfc22.gif',
  'https://i.pinimg.com/originals/58/12/f0/5812f097d3933d245e4fe88ad5cf96f8.gif',
  'https://i.pinimg.com/originals/f3/33/3e/f3333e1073af77942239b958e2d46e2e.gif',
  '/image/tunel2.webp',
  '/image/tunel1.webp',
  'https://i.redd.it/u7549afhg7xe1.gif',
  'https://i.pinimg.com/originals/1e/31/3a/1e313a58c726ed08e116c1607dfe3875.gif',
  'https://i.makeagif.com/media/9-05-2022/Ec7jqz.gif',
  'https://mir-s3-cdn-cf.behance.net/project_modules/max_632/cf3a49135903777.61f0168cc7e02.gif',
  'https://mir-s3-cdn-cf.behance.net/project_modules/source/210cfd134975723.61df6893e241c.gif',
  'https://i.pinimg.com/originals/6a/a9/d6/6aa9d6be78af19792b3e942ad9599a68.gif',
  'https://i.pinimg.com/originals/f5/c8/d5/f5c8d5f3d83056ccb6551b4c0ee636d0.gif',
  'https://i.pinimg.com/originals/9b/af/93/9baf93ede642258f550354764aecfc04.gif',
  'https://i.ibb.co/qMjzt3vq/PIST.webp',
  'https://i.pinimg.com/originals/32/59/40/325940899507a141f32f294729c8fbe4.gif',
  'https://i.pinimg.com/originals/f1/e4/9b/f1e49bbba9537591c58f455b179ed0c1.gif',
  'https://i.pinimg.com/originals/fd/07/c2/fd07c2cb1c4ed45658b2b11181da742d.gif',
  'https://i.pinimg.com/originals/d8/03/9b/d8039b1ae4983c093f8b291c4412560b.gif',
  'https://i.pinimg.com/originals/1b/f0/f4/1bf0f46f79bb28466bfcb4d9c4663aba.gif',
  'https://i.pinimg.com/originals/87/a9/72/87a9729a6665c38f48c15e5f4b2bb165.gif',
  'https://i.pinimg.com/originals/1c/65/75/1c657551f9c90b09fe7b82e17e4415f0.gif',
  'https://i.pinimg.com/originals/e1/0c/4e/e10c4e8182ab8de13442d0ac31f3808c.gif',
];

const STORAGE_KEY = 'firebase_carousel_data';
const GLOBAL_INDEX_KEY = 'carousel_global_index';
const BLOCK_10_INDEX_KEY = 'carousel_block_10_index';

const rotations = ['rotate-right', 'rotate-left', 'rotate-y', 'rotate-inverse-y', 'rotate-z', 'rotate-inverse-z', 'rotate-xy'];

export default function ThreeDCarousel() {
  const [masterBg, setMasterBg] = useState(BACKGROUND_IMAGES[0]);
  const [dimensions, setDimensions] = useState({ width: 899, height: 899 });
  const [currentRotation, setCurrentRotation] = useState<string>('');

  const [iframeSources, setIframeSources] = useState<string[]>(['META_COVER']);
  const [linkSources, setLinkSources] = useState<string[]>(['https://metadapower.vercel.app']);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const MAX_SIZE = 899;
  const growingRef = useRef<boolean>(false);
  const widthRef = useRef<number>(MAX_SIZE);
  const heightRef = useRef<number>(MAX_SIZE);
  const iframeSourcesRef = useRef<string[]>(iframeSources);
  const isDrawerOpenRef = useRef<boolean>(false);

  useEffect(() => {
    iframeSourcesRef.current = iframeSources;
  }, [iframeSources]);

  useEffect(() => {
    const handleDrawerStatus = (e: any) => {
      if (e.detail && typeof e.detail.isOpen === 'boolean') {
        isDrawerOpenRef.current = e.detail.isOpen;
      }
    };

    window.addEventListener('sideDrawerStatus', handleDrawerStatus);
    return () => {
      window.removeEventListener('sideDrawerStatus', handleDrawerStatus);
    };
  }, []);

  useEffect(() => {
    const syncData = async () => {
      try {
        const dadosLocais = await carouselDB.getItem<Record<string, any>>(STORAGE_KEY);
        if (dadosLocais) {
          montarFontesComMeta(dadosLocais);
        }
      } catch (e) {
        console.error('Erro ao ler do IndexedDB do carrossel:', e);
      }

      try {
        const savedIndex = await carouselDB.getItem<number>(GLOBAL_INDEX_KEY);
        if (typeof savedIndex === 'number') {
          setCurrentIndex(savedIndex);
        }
      } catch (e) {
        console.error('Erro ao ler índice do IndexedDB:', e);
      }

      try {
        const res = await fetch('https://power-adm-galery-default-rtdb.firebaseio.com/dados.json');
        if (res.ok) {
          const snapshot = await res.json();
          if (snapshot) {
            await carouselDB.setItem(STORAGE_KEY, snapshot);
            montarFontesComMeta(snapshot);
          }
        }
      } catch (err) {
        console.error('Erro na sincronização Realtime Database:', err);
      }
    };

    syncData();
  }, []);

  const montarFontesComMeta = (dados: Record<string, any>) => {
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

  // Animação com recolhimento, expansão e transição 3D integrada
  useEffect(() => {
    const PAUSE = 6000;
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

      // Tela totalmente expandida
      if (w >= MAX_SIZE) {
        w = MAX_SIZE;
        h = MAX_SIZE;
        growingRef.current = false;
        widthRef.current = w;
        heightRef.current = h;
        setDimensions({ width: w, height: h });
        
        // Remove a classe de rotação ao atingir o tamanho máximo
        setTimeout(() => {
          setCurrentRotation('');
        }, 1500);

        timeoutId = setTimeout(step, PAUSE);
        return;
      }

      // Tela recolhida a zero: troca o conteúdo e sorteia o efeito 3D
      if (w <= 0) {
        w = 0;
        h = 0;
        growingRef.current = true;
        widthRef.current = w;
        heightRef.current = h;
        setDimensions({ width: w, height: h });

        // Sorteia nova rotação 3D para a expansão
        const randomRot = rotations[Math.floor(Math.random() * rotations.length)];
        setCurrentRotation(randomRot);

        setCurrentIndex((prev) => {
          const total = iframeSourcesRef.current.length;
          const nextIndex = total > 0 ? (prev + 1) % total : 0;

          carouselDB.setItem(GLOBAL_INDEX_KEY, nextIndex);

          if (nextIndex % 10 === 0) {
            carouselDB.setItem(BLOCK_10_INDEX_KEY, nextIndex);
          }

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
  }, []);

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      index = (index + 1) % BACKGROUND_IMAGES.length;
      setMasterBg(BACKGROUND_IMAGES[index]);
    }, 180000);

    return () => clearInterval(timer);
  }, []);

  // O clique só é permitido se a tela estiver totalmente expandida (MAX_SIZE)
  const isFullyExpanded = dimensions.width >= MAX_SIZE;
  const currentLink = linkSources[currentIndex];
  const isClickable = isFullyExpanded && Boolean(currentLink);

  const handleOpenLink = () => {
    if (!isClickable) return;

    if (currentLink.startsWith('whatsapp:')) {
      window.open(currentLink, '_blank');
    } else if (currentLink.startsWith('__whatsapp__')) {
      const numero = window.atob(currentLink.replace('__whatsapp__', ''));
      window.open(`https://wa.me/${numero}`, '_blank');
    } else {
      window.open(currentLink.startsWith('http') ? currentLink : `https://${currentLink}`, '_blank');
    }
  };

  const currentSource = iframeSources[currentIndex] || 'META_COVER';

  return (
    <div className="relative w-[900px] h-[900px] max-w-full max-h-full bg-[rgba(104,103,51,0.027)] overflow-hidden flex items-center justify-center select-none" style={{ perspective: '1000px' }}>
      {/* TELA MASTER COM ROTAÇÃO DE PLANO DE FUNDO */}
      <div
        className="relative w-full h-full max-h-[1600px] bg-cover bg-center flex items-center justify-center transition-all duration-700"
        style={{ backgroundImage: `url('${masterBg}')` }}
      >
        {/* TELA CENTRAL DINÂMICA COM TRANSIÇÃO 3D */}
        <div
          onClick={handleOpenLink}
          className={`absolute overflow-hidden flex items-center justify-center bg-transparent ${currentRotation}`}
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            left: `${(MAX_SIZE - dimensions.width) / 2}px`,
            top: `${(MAX_SIZE - dimensions.height) / 2}px`,
            transformStyle: 'preserve-3d',
            cursor: isClickable ? 'pointer' : 'default',
            pointerEvents: isClickable ? 'auto' : 'none', // Desativa o clique durante o recolhimento/expansión
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

      {/* Estilos CSS Inline para suportar as animações 3D */}
      <style jsx global>{`
        @keyframes rotateRight {
          from { transform: rotateX(0deg); }
          to { transform: rotateX(360deg); }
        }
        @keyframes rotateLeft {
          from { transform: rotateX(0deg); }
          to { transform: rotateX(-360deg); }
        }
        @keyframes rotateY {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        @keyframes rotateInverseY {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(-360deg); }
        }
        @keyframes rotateZ {
          from { transform: rotateZ(0deg); }
          to { transform: rotateZ(360deg); }
        }
        @keyframes rotateInverseZ {
          from { transform: rotateZ(0deg); }
          to { transform: rotateZ(-360deg); }
        }
        @keyframes rotateXY {
          from { transform: rotateX(0deg) rotateY(0deg); }
          to { transform: rotateX(360deg) rotateY(360deg); }
        }

        .rotate-right { animation: rotateRight 1.5s linear infinite; }
        .rotate-left { animation: rotateLeft 1.5s linear infinite; }
        .rotate-y { animation: rotateY 0.8s linear infinite; }
        .rotate-inverse-y { animation: rotateInverseY 1.5s linear infinite; }
        .rotate-z { animation: rotateZ 1.5s linear infinite; }
        .rotate-inverse-z { animation: rotateInverseZ 1.5s linear infinite; }
        .rotate-xy { animation: rotateXY 1.5s linear infinite; }
      `}</style>
    </div>
  );
}