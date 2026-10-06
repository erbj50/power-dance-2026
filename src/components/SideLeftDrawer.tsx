'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sample1 from './SideLeftDrawer/sample1';
import Sample2 from './SideLeftDrawer/sample2';
import { auth, database } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { saveTracksToDB, getTracksFromDB } from '@/lib/db';

const MadrugadaLove = dynamic(() => import('./MadrugadaLove'), { ssr: false });
const ThreeDCarousel = dynamic(() => import('./SideLeftDrawer/ThreeDCarousel'), { ssr: false });

interface Props {
  isOpen?: boolean;
}

export default function SideLeftDrawer({ isOpen: externalIsOpen }: Props) {
  const [internalIsOpen] = useState<boolean>(false);
  const [showSamp1, setShowSamp1] = useState<boolean>(false);
  const [showSamp2, setShowSamp2] = useState<boolean>(false);

  // Telas ativas para a Rádio
  const [showMDL, setShowMDL] = useState<boolean>(false);
  const [showTELA, setShowTELA] = useState<boolean>(true);

  const [metaCoverText, setMetaCoverText] = useState<string>('POWER DANCE');
  const [audioMode, setAudioMode] = useState<'RADIO' | 'PLAYER'>('RADIO');

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [cooldown, setCooldown] = useState<boolean>(false);

  const isExpanded = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Notifica a aplicação sobre o status de expansão da aba esquerda
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sideDrawerStatus', {
          detail: { isOpen: isExpanded },
        })
      );
    }
  }, [isExpanded]);

  // Hook para Autenticação Protegida
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.uid) {
        try {
          const adminRef = ref(database, 'admins/' + currentUser.uid);
          const snapshot = await get(adminRef);
          setIsAdmin(snapshot.exists());
        } catch (e) {
          console.error('Erro ao verificar status de admin:', e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const processMetadataForViewChange = (text: string) => {
    if (!text) return;
    const lowerText = text.toLowerCase();

    const isMDL =
      lowerText.includes('yara alice') ||
      lowerText.includes('mdl') ||
      lowerText.includes('abertura mdl') ||
      lowerText.includes('madrugada love');

    const isTELA =
      lowerText.includes('top dance') ||
      lowerText.includes('flash house') ||
      lowerText.includes('eletro dance');

    if (isMDL) {
      setShowMDL(true);
      setShowTELA(false);
    } else if (isTELA) {
      setShowMDL(false);
      setShowTELA(true);
    }
  };

  // Eventos de Metadados e Áudio
  useEffect(() => {
    const handleTrackUpdate = (e: any) => {
      if (e.detail && e.detail.label) {
        setMetaCoverText(e.detail.label);
        processMetadataForViewChange(e.detail.label);
      }
    };

    const handleRadioMetaUpdate = (e: any) => {
      if (e.detail && e.detail.fullTrack) {
        setMetaCoverText(e.detail.fullTrack);
        processMetadataForViewChange(e.detail.fullTrack);
      }
    };

    const handleModeUpdate = (e: any) => {
      if (e.detail && e.detail.mode) {
        setAudioMode(e.detail.mode);
      }
    };

    window.addEventListener('trackMetadataUpdate', handleTrackUpdate);
    window.addEventListener('radio_metadata_updated', handleRadioMetaUpdate);
    window.addEventListener('audioModeChange', handleModeUpdate);

    return () => {
      window.removeEventListener('trackMetadataUpdate', handleTrackUpdate);
      window.removeEventListener('radio_metadata_updated', handleRadioMetaUpdate);
      window.removeEventListener('audioModeChange', handleModeUpdate);
    };
  }, []);

  // Troca de Telas Baseada no Horário
  useEffect(() => {
    const updateViewBasedOnTime = () => {
      const lowerText = metaCoverText.toLowerCase();
      const hasSpecificKeyword =
        lowerText.includes('yara alice') ||
        lowerText.includes('mdl') ||
        lowerText.includes('abertura mdl') ||
        lowerText.includes('madrugada love') ||
        lowerText.includes('top dance') ||
        lowerText.includes('flash house') ||
        lowerText.includes('eletro dance');

      if (!hasSpecificKeyword) {
        const hours = new Date().getHours();
        if (hours < 6) {
          setShowMDL(true);
          setShowTELA(false);
        } else {
          setShowMDL(false);
          setShowTELA(true);
        }
      }
    };

    updateViewBasedOnTime();
    const interval = setInterval(updateViewBasedOnTime, 60 * 1000);
    return () => clearInterval(interval);
  }, [metaCoverText]);

  const handleTriggerSamp1 = () => {
    setShowSamp1(true);
    setShowSamp2(false);
    setTimeout(() => setShowSamp1(false), 10000);
  };

  const handleTriggerSamp2 = () => {
    setShowSamp2(true);
    setShowSamp1(false);
    setTimeout(() => setShowSamp2(false), 10000);
  };














const handleDownload = async () => {
    if (audioMode === 'PLAYER') return;

    if (!user) {
      alert('Você precisa estar logado no chat para realizar downloads.');
      return;
    }

    let rawQuery = metaCoverText?.trim() || '';
    const isBrandName = /power\s*dance|web\s*radio|erbj/i.test(rawQuery);

    if (!rawQuery || isBrandName) {
      alert('Aguarde o metadado (Nome do Artista / Música) ser transmitido pela rádio.');
      return;
    }

    const cleanQuery = rawQuery
      .replace(/^\(?\d+\)?[\s-_.]*/g, '')
      .replace(/_/g, ' ')
      .trim();

    if (cleanQuery.length < 3) {
      alert('Metadado inconsistente para busca.');
      return;
    }

    try {
      const existingTracks = await getTracksFromDB();
      const isAlreadyDownloaded = existingTracks.some(
        (track) => track.name.trim().toLowerCase() === cleanQuery.toLowerCase()
      );

      if (isAlreadyDownloaded) {
        alert(`A música "${cleanQuery}" já está salva na sua playlist local!`);
        return;
      }
    } catch (dbErr) {
      console.error('Erro ao consultar banco local:', dbErr);
    }

    setIsDownloading(true);
    setIsCompleted(false);
    setDownloadProgress(20);

    try {
      // aponta para o Render em vez do Netlify
      const RENDER_BOT_URL = process.env.NEXT_PUBLIC_RENDER_BOT_URL || 'https://power-dance-bot.onrender.com';
      const response = await fetch(`${RENDER_BOT_URL}/api/download-yt?query=${encodeURIComponent(cleanQuery)}`);

      if (!response.ok) {
        throw new Error('Música não encontrada no YouTube ou erro no processamento.');
      }

      setDownloadProgress(75);
      const audioBlob = await response.blob();

      const trackId = `${cleanQuery}-${Date.now()}`;
      await saveTracksToDB([
        {
          id: trackId,
          name: cleanQuery,
          blob: audioBlob,
          size: audioBlob.size,
          addedAt: Date.now(),
        },
      ]);

      setDownloadProgress(100);
      setIsDownloading(false);
      setIsCompleted(true);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('newTrackDownloaded', {
            detail: { trackId: trackId },
          })
        );
      }

      setTimeout(() => {
        setIsCompleted(false);
        setDownloadProgress(0);
      }, 2500);
    } catch (err: any) {
      console.error('Falha no download:', err);
      alert(`Não foi possível baixar "${cleanQuery}". O sistema aguardará a próxima faixa.`);
      setIsDownloading(false);
      setIsCompleted(false);
      setDownloadProgress(0);
    }
  };







  return (
    <div
      className={`absolute top-0 left-0 w-full h-full z-50 transition-all duration-500 ease-in-out overflow-hidden flex flex-col justify-start items-center bg-black ${
        isExpanded
          ? 'opacity-100 pointer-events-auto visible'
          : 'opacity-0 pointer-events-none invisible'
      }`}
    >
      {isExpanded && (
        <>
          {/* MODO MADRUGADA LOVE */}
          {showMDL && !showTELA && (
            <div className="w-full h-full max-h-[1700px]     bg-black flex flex-col justify-center items-center mt-20 relative z-10">
              <MadrugadaLove />
            </div>
          )}

          {/* MODO CARROSSEL TELA 3D */}
          {showTELA && !showMDL && (
            <div className="relative w-full max-w-[995px] max-h-[1600px] bg-black border-[10px] border-black overflow-hidden flex flex-col justify-between items-center select-none font-['Oswald'] mt-1 z-10">
              <div className="w-full relative z-10 flex justify-center items-center">
                <ThreeDCarousel />
              </div>

              <div className="relative w-full flex flex-col justify-center items-center z-20 mt-[150px]">
                <img
                  src="/image/djdjdj.webp"
                  alt="DJ Performance"
                  className="w-[1000px] h-[480px] object-cover z-20"
                />

                <div className="absolute inset-0 w-[800px] h-[140px] z-30 left-[100px] mt-[-146px]">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{ backgroundImage: "url('/image/wavv.webp')" }}
                  />
                </div>

                <div className="absolute bottom-[460px] left-0 right-0 flex justify-between items-center px-10 z-40">
                  {!showSamp1 ? (
                    <button
                      onClick={handleTriggerSamp1}
                      className="w-[220px] h-[90px] bg-red-600 font-bold text-white text-sm uppercase rounded shadow-lg transition-opacity duration-300 opacity-0 hover:opacity-100 active:opacity-100 active:scale-95"
                    >
                      Tocar Sample 1
                    </button>
                  ) : (
                    <div className="w-[220px]" />
                  )}

                  {user && audioMode === 'RADIO' ? (
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading || isCompleted || cooldown}
                      style={
                        isDownloading
                          ? {
                              background: `linear-gradient(to right, #00ff00 ${downloadProgress}%, #ffffff ${downloadProgress}%)`,
                            }
                          : {}
                      }
                      className={`w-[220px] h-[90px] font-extrabold uppercase rounded shadow-lg transition-all duration-300 active:scale-95 disabled:pointer-events-none flex items-center justify-center ${
                        isDownloading
                          ? 'opacity-100 text-black text-2xl border-2 border-black'
                          : isCompleted
                          ? 'opacity-100 bg-black text-white text-xl border-2 border-green-500'
                          : 'opacity-0 hover:opacity-100 active:opacity-100 bg-orange-600 hover:bg-orange-500 text-white text-lg'
                      }`}
                    >
                      {isDownloading ? (
                        <span className="font-black text-3xl drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                          {downloadProgress}%
                        </span>
                      ) : isCompleted ? (
                        <span className="font-bold tracking-widest text-green-400">
                          CONCLUÍDO
                        </span>
                      ) : cooldown ? (
                        'Aguarde...'
                      ) : (
                        'Download'
                      )}
                    </button>
                  ) : (
                    <div className="w-[220px]" />
                  )}

                  {!showSamp2 ? (
                    <button
                      onClick={handleTriggerSamp2}
                      className="w-[220px] h-[90px] bg-lime-500 font-bold text-white text-sm uppercase rounded shadow-lg transition-opacity duration-300 opacity-0 hover:opacity-100 active:opacity-100 active:scale-95"
                    >
                      Tocar Sample 2
                    </button>
                  ) : (
                    <div className="w-[220px]" />
                  )}
                </div>

                <div className="absolute inset-0 flex justify-center items-center z-50 w-full">
                  {showSamp1 && <Sample1 />}
                  {showSamp2 && <Sample2 />}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}