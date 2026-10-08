'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getTracksFromDB, saveTracksToDB, clearTracksFromDB, Track } from '@/lib/db';

const CILINDROS_LIST = [
  '/image/cilindro.webp',
  '/image/cilindro1.webp',
  '/image/cilindro2.webp',
  '/image/cilindro2.webp',
  '/image/cilindro3.webp',
  '/image/cilindro4.webp',
  '/image/cilindro5.webp',
  '/image/cilindro6.webp',
  '/image/cilindro7.webp',
  '/image/cilindro8.webp',
  '/image/cilindro8.webp',
  '/image/cilindro9.webp',
  '/image/cilindro10.webp',
  '/image/cilindro11.webp',
  '/image/cilindro12.webp',
  '/image/cilindro13.webp',
  '/image/cilindro14.webp',
  '/image/cilindro17.webp',
];

const FREQUENCIES = [60, 250, 800, 2000, 4000, 10000];
const LABELS = ['60Hz', '250Hz', '800Hz', '2kHz', '4kHz', '10kHz'];
const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || 'https://erbj.com.br/listen/power_dance/radio.mp3';
const API_NOW_PLAYING = 'https://erbj.com.br/api/nowplaying/power_dance';

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasLRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [stereoOn, setStereoOn] = useState(false);
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  const [mode, setMode] = useState<'RADIO' | 'PLAYER'>('RADIO');
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [showPlaylistOverlay, setShowPlaylistOverlay] = useState<boolean>(false);
  const [lastDownloadedId, setLastDownloadedId] = useState<string | null>(null);

  const [currentTrackLabel, setCurrentTrackLabel] = useState<string>('POWER DANCE');

  const [cylinderIndex, setCylinderIndex] = useState<number>(0);
  const lastTrackRef = useRef<string>('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const isPlayingRef = useRef(false);

  const currentObjectUrlRef = useRef<string | null>(null);
  const currentCoverUrlRef = useRef<string | null>(null);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldActionRef = useRef<boolean>(false);

  const advanceCylinder = () => {
    setCylinderIndex((prev) => (prev + 1) % CILINDROS_LIST.length);
  };

  const extractAndEmitCover = (fileBlob: Blob) => {
    if (typeof window === 'undefined') return;

    if (currentCoverUrlRef.current) {
      URL.revokeObjectURL(currentCoverUrlRef.current);
      currentCoverUrlRef.current = null;
    }

    window.dispatchEvent(
      new CustomEvent('playerCoverUpdate', { detail: { cover: null } })
    );

    const reader = new FileReader();
    const headerBlob = fileBlob.slice(0, 256 * 1024);

    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) return;

      const view = new DataView(buffer);

      if (
        view.getUint8(0) !== 0x49 ||
        view.getUint8(1) !== 0x44 ||
        view.getUint8(2) !== 0x33
      ) {
        return;
      }

      let offset = 10;
      const totalSize = buffer.byteLength;

      while (offset < totalSize - 10) {
        const frameID = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        );

        const frameSize = view.getUint32(offset + 4);

        if (frameSize <= 0 || offset + 10 + frameSize > totalSize) break;

        if (frameID === 'APIC') {
          const frameDataOffset = offset + 10;
          let mimeEnd = frameDataOffset + 1;

          while (mimeEnd < totalSize && view.getUint8(mimeEnd) !== 0) {
            mimeEnd++;
          }

          const mimeTypeBytes = new Uint8Array(buffer, frameDataOffset + 1, mimeEnd - (frameDataOffset + 1));
          let mimeType = new TextDecoder('ascii').decode(mimeTypeBytes) || 'image/jpeg';
          if (mimeType === 'image/jpg') mimeType = 'image/jpeg';

          let imgStart = mimeEnd + 2;
          while (imgStart < totalSize && view.getUint8(imgStart) !== 0) {
            imgStart++;
          }
          imgStart++;

          const imgData = buffer.slice(imgStart, frameDataOffset + frameSize);
          const imgBlob = new Blob([imgData], { type: mimeType });
          const coverUrl = URL.createObjectURL(imgBlob);

          currentCoverUrlRef.current = coverUrl;

          window.dispatchEvent(
            new CustomEvent('playerCoverUpdate', {
              detail: { cover: coverUrl },
            })
          );
          return;
        }

        offset += 10 + frameSize;
      }
    };

    reader.readAsArrayBuffer(headerBlob);
  };

  const refreshPlaylist = async () => {
    try {
      const savedTracks = await getTracksFromDB();
      setPlaylist(savedTracks || []);
    } catch (err) {
      console.error('Erro ao buscar tracks do IndexedDB:', err);
    }
  };

  const handleClearPlaylist = async () => {
    if (confirm('Deseja apagar todas as músicas da playlist?')) {
      try {
        if (mode === 'PLAYER' && audioRef.current) {
          audioRef.current.pause();
          isPlayingRef.current = false;
          setIsPlaying(false);
          await switchMode('RADIO');
        }

        await clearTracksFromDB();
        setPlaylist([]);
        setCurrentIndex(-1);
        setLastDownloadedId(null);
        await refreshPlaylist();
      } catch (err) {
        console.error('Erro ao limpar a playlist no IndexedDB:', err);
      }
    }
  };

  const notifyModeChange = (newMode: 'RADIO' | 'PLAYER') => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('audioModeChange', {
          detail: { mode: newMode },
        })
      );
    }
  };

  const updateTrackLabel = (newLabel: string) => {
    setCurrentTrackLabel(newLabel);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('trackMetadataUpdate', {
          detail: { label: newLabel },
        })
      );
    }
  };

  useEffect(() => {
    if (mode !== 'RADIO') return;

    const fetchNowPlaying = async () => {
      try {
        const res = await fetch(API_NOW_PLAYING);
        if (!res.ok) return;
        const data = await res.json();

        let artist = 'WEB RADIO POWER DANCE';
        let title = 'Campo Grande MS';

        if (data?.now_playing?.song) {
          artist = data.now_playing.song.artist || artist;
          title = data.now_playing.song.title || title;
        }

        const fullTrack = artist !== 'WEB RADIO POWER DANCE' ? `${artist} - ${title}` : 'POWER DANCE';

        if (fullTrack !== lastTrackRef.current) {
          lastTrackRef.current = fullTrack;
          advanceCylinder();
          updateTrackLabel(fullTrack);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('radio_metadata_updated', {
                detail: { artist, title, fullTrack },
              })
            );
          }
        }
      } catch (error) {
        console.error('Erro ao buscar metadados:', error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 2000);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    refreshPlaylist();

    const handleRadioMetaUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (mode === 'RADIO' && customEvent.detail?.fullTrack) {
        updateTrackLabel(customEvent.detail.fullTrack);
      }
    };

    const handleNewTrack = async (e: Event) => {
      const customEvent = e as CustomEvent;
      await refreshPlaylist();
      if (customEvent.detail?.trackId) {
        setLastDownloadedId(customEvent.detail.trackId);
      }
    };

    window.addEventListener('radio_metadata_updated', handleRadioMetaUpdate);
    window.addEventListener('newTrackDownloaded', handleNewTrack);
    notifyModeChange('RADIO');

    return () => {
      window.removeEventListener('radio_metadata_updated', handleRadioMetaUpdate);
      window.removeEventListener('newTrackDownloaded', handleNewTrack);
    };
  }, [mode]);

  const initWebAudio = () => {
    if (!audioRef.current) return;

    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }

    const ctx = audioCtxRef.current;

    if (!mediaSourceRef.current) {
      mediaSourceRef.current = ctx.createMediaElementSource(audioRef.current);
    }

    if (filtersRef.current.length === 0) {
      const volumeNode = ctx.createGain();
      volumeNode.gain.value = 1.8;

      const filters = FREQUENCIES.map((freq, index) => {
        const f = ctx.createBiquadFilter();
        f.type = 'peaking';
        f.frequency.value = freq;
        f.Q.value = Math.SQRT2;
        f.gain.value = eqGains[index] || 0;
        return f;
      });
      filtersRef.current = filters;

      let currentNode: AudioNode = mediaSourceRef.current;
      filters.forEach((filter) => {
        currentNode.connect(filter);
        currentNode = filter;
      });

      currentNode.connect(volumeNode);
      volumeNode.connect(ctx.destination);

      const splitter = ctx.createChannelSplitter(2);
      const analyserL = ctx.createAnalyser();
      const analyserR = ctx.createAnalyser();
      analyserL.fftSize = 256;
      analyserR.fftSize = 256;

      volumeNode.connect(splitter);
      splitter.connect(analyserL, 0);
      splitter.connect(analyserR, 1);

      let lastStereoState = false;

      const renderVU = () => {
        requestAnimationFrame(renderVU);

        const dataL = new Uint8Array(analyserL.frequencyBinCount);
        const dataR = new Uint8Array(analyserR.frequencyBinCount);

        analyserL.getByteFrequencyData(dataL);
        analyserR.getByteFrequencyData(dataR);

        const avgL = dataL.reduce((a, b) => a + b, 0) / dataL.length;
        const avgR = dataR.reduce((a, b) => a + b, 0) / dataR.length;

        const normL = Math.min(1, Math.pow(avgL / 170, 1.20));
        const normR = Math.min(1, Math.pow(avgR / 170, 1.20));

        const rawAngleL = -68 + normL * 170;
        const rawAngleR = -68 + normR * 170;

        const angleL = Math.max(-58, Math.min(80, rawAngleL));
        const angleR = Math.max(-58, Math.min(80, rawAngleR));

        drawPointer(canvasLRef.current, angleL);
        drawPointer(canvasRRef.current, angleR);

        const isStereo = Math.abs(avgL - avgR) > 2;
        if (isStereo !== lastStereoState) {
          lastStereoState = isStereo;
          setStereoOn(isStereo);
        }
      };

      renderVU();
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    initWebAudio();

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (!isPlayingRef.current) {
      try {
        if (mode === 'RADIO') {
          audioRef.current.src = STREAM_URL;
          notifyModeChange('RADIO');
        }
        isPlayingRef.current = true;
        setIsPlaying(true);
        await audioRef.current.play();
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Erro ao reproduzir:', error);
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      }
    } else {
      audioRef.current.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  };

  const switchMode = async (targetMode?: 'RADIO' | 'PLAYER') => {
    const newMode = targetMode || (mode === 'RADIO' ? 'PLAYER' : 'RADIO');
    setMode(newMode);
    notifyModeChange(newMode);

    if (!audioRef.current) return;

    if (newMode === 'RADIO') {
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
        currentObjectUrlRef.current = null;
      }

      audioRef.current.src = STREAM_URL;
      updateTrackLabel('POWER DANCE');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('playerCoverUpdate', { detail: { cover: null } })
        );
      }
      if (isPlayingRef.current) {
        await audioRef.current.play();
      }
    } else if (newMode === 'PLAYER' && playlist.length > 0) {
      const idx = currentIndex >= 0 ? currentIndex : 0;
      playLocalTrack(idx);
    }
  };

  const playLocalTrack = async (index: number) => {
    if (!playlist[index] || !audioRef.current) return;

    initWebAudio();
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
    }

    const track = playlist[index];
    const streamUrl = URL.createObjectURL(track.blob);
    currentObjectUrlRef.current = streamUrl;

    advanceCylinder();

    setMode('PLAYER');
    notifyModeChange('PLAYER');
    setCurrentIndex(index);
    setShowPlaylistOverlay(false);

    updateTrackLabel(formatTrackLabel(track.name));
    extractAndEmitCover(track.blob);

    audioRef.current.src = streamUrl;
    isPlayingRef.current = true;
    setIsPlaying(true);
    await audioRef.current.play();
  };

  const handleRightVUClick = () => {
    fileInputRef.current?.click();
  };

  const handleLeftVUTouchStart = () => {
    isHoldActionRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      isHoldActionRef.current = true;
      switchMode();
    }, 1600);
  };

  const handleLeftVUTouchEnd = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (!isHoldActionRef.current) {
      setShowPlaylistOverlay((prev) => !prev);
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: Track[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|m4a|aac|wav)$/i)) {
        newTracks.push({
          id: `${file.name}-${Date.now()}-${i}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          blob: file,
          size: file.size,
          addedAt: Date.now(),
        });
      }
    }

    if (newTracks.length > 0) {
      await saveTracksToDB(newTracks);
      await refreshPlaylist();
      setShowPlaylistOverlay(true);
    }
  };

  const formatTrackLabel = (filename: string) => {
    if (filename.includes('-')) {
      const parts = filename.split('-');
      const artist = parts[0].trim().toUpperCase();
      const title = parts.slice(1).join('-').trim().toUpperCase();
      return `${title} - ${artist}`;
    }
    return `${filename.toUpperCase()} - LOCAL PLAYER`;
  };

  const handleAudioEnded = async () => {
    if (mode === 'PLAYER') {
      if (currentIndex + 1 < playlist.length) {
        playLocalTrack(currentIndex + 1);
      } else {
        await switchMode('RADIO');
      }
    }
  };

  const drawPointer = (canvas: HTMLCanvasElement | null, angleDegrees: number) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clampedAngle = Math.max(-48, Math.min(48, angleDegrees));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 1.15);
    ctx.rotate((clampedAngle * Math.PI) / 150);

    ctx.fillStyle = '#a8fe13';
    ctx.fillRect(-1.5, -95, 3, 85);
    ctx.restore();
  };

  const handleEqChange = (index: number, val: number) => {
    const updated = [...eqGains];
    updated[index] = val;
    setEqGains(updated);
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = val;
    }
  };

  const activeCylinderUrl = CILINDROS_LIST[cylinderIndex];

  return (
    <div className="relative w-[995px] flex flex-col items-center select-none">
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-playlist-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 10s linear infinite;
        }
        .animate-playlist-marquee:hover {
          animation-play-state: paused;
        }
        .text-neon-orange {
          color: #ff6600 !important;
          text-shadow: 0 0 8px #ff6600, 0 0 18px #ff3300;
        }
      `}</style>

      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="none"
        onEnded={handleAudioEnded}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFolderSelect}
        // @ts-expect-error - webkitdirectory é suportado pelos navegadores mas não está na tipagem padronizada do React
        webkitdirectory="true"
        multiple
        accept="audio/*,.mp3,.m4a,.aac,.wav"
        className="hidden"
      />

      <div className="absolute top-[1220px] right-132 bg-blue-900/80 border border-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest z-40">
        Modo: {mode === 'RADIO' ? '📻 Power Dance Web Rádio' : `🎵 Player (${currentIndex + 1}/${playlist.length})`}
      </div>

      <div className="flex justify-center gap-2 mt-1">
        <div
          className="relative cursor-pointer group"
          onMouseDown={handleLeftVUTouchStart}
          onMouseUp={handleLeftVUTouchEnd}
          onTouchStart={handleLeftVUTouchStart}
          onTouchEnd={handleLeftVUTouchEnd}
        >
          <canvas
            ref={canvasLRef}
            width={256}
            height={128}
            className="w-[480px] h-[345px] bg-black bg-[url('/vu7.jpg')] bg-cover border-2 border-[#0b42f7] group-hover:brightness-125 transition-all"
          />
          <span className="absolute bottom-2 left-4 text-xs font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Clique: Playlist | Segurar: Trocar Modo
          </span>
        </div>

        <div className="relative cursor-pointer group" onClick={handleRightVUClick}>
          <canvas
            ref={canvasRRef}
            width={256}
            height={128}
            className="w-[480px] h-[345px] bg-black bg-[url('/vu7.jpg')] bg-cover border-2 border-[#0b42f7] group-hover:brightness-125 transition-all"
          />
          <span className="absolute bottom-2 right-4 text-xs font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Clique: Escolher Pasta / Músicas
          </span>
        </div>
      </div>

      <div className="absolute top-[280px] left-[225px] w-[48px] h-[48px] bg-black border-2 border-[#006eff] rounded-full flex items-center justify-center text-white text-3xl font-bold">B</div>
      <div className="absolute top-[280px] right-[225px] w-[48px] h-[48px] bg-black border-2 border-[#0051ff] rounded-full flex items-center justify-center text-white text-3xl font-bold">J</div>

      <div className={`absolute top-[285px] left-[410px] w-5 h-5 rounded-full ${stereoOn ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-[#1f0101]'}`} />
      <div className={`absolute top-[285px] right-[75px] w-5 h-5 rounded-full ${stereoOn ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-[#1f0101]'}`} />

      <div className="relative w-[950px] h-[395px] bg-[url('/image/eq-layout.jpeg')] bg-cover border-[3px] border-[#0051ff] p-5 mt-2 flex justify-around items-center overflow-hidden">
        {showPlaylistOverlay ? (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-40 p-4 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-blue-600 mb-2">
              <h3 className="text-blue-400 font-bold text-2xl tracking-wide">
                📁 Playlist Local ({playlist.length} faixas)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-base px-4 py-1.5 rounded font-bold transition-all"
                >
                  + Add Músicas
                </button>
                <button
                  onClick={handleClearPlaylist}
                  className="bg-orange-500 hover:bg-orange-400 text-black text-base px-4 py-1.5 rounded font-bold uppercase transition-all"
                >
                  LIMPAR
                </button>
                <button
                  onClick={() => setShowPlaylistOverlay(false)}
                  className="bg-red-600 hover:bg-red-500 text-white text-base px-4 py-1.5 rounded font-bold transition-all"
                >
                  Fechar ✖
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {playlist.map((track, idx) => {
                const trackTitle = `${idx + 1}. ${track.name}`;
                const isLongText = trackTitle.length > 25;
                const isNewlyDownloaded = track.id === lastDownloadedId;

                const textClass = isNewlyDownloaded
                  ? 'text-neon-orange font-black'
                  : currentIndex === idx && mode === 'PLAYER'
                  ? 'text-white font-extrabold'
                  : 'text-zinc-100 font-extrabold hover:text-white';

                return (
                  <div
                    key={track.id}
                    onClick={() => playLocalTrack(idx)}
                    className={`flex items-center justify-between p-4 rounded cursor-pointer transition-colors ${
                      currentIndex === idx && mode === 'PLAYER'
                        ? 'bg-blue-600'
                        : 'bg-zinc-900/90 hover:bg-blue-950'
                    }`}
                  >
                    <div className="w-[680px] overflow-hidden whitespace-nowrap">
                      {isLongText ? (
                        <div className="animate-playlist-marquee">
                          <span className={`text-3xl pr-16 leading-tight ${textClass}`}>{trackTitle}</span>
                          <span className={`text-3xl pr-16 leading-tight ${textClass}`}>{trackTitle}</span>
                        </div>
                      ) : (
                        <span className={`text-3xl truncate block leading-tight ${textClass}`}>
                          {trackTitle}
                        </span>
                      )}
                    </div>

                    <span className="text-sm font-bold text-zinc-400 min-w-[70px] text-right">
                      {(track.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {LABELS.map((label, idx) => (
          <div key={label} className="relative flex flex-col items-center h-[370px] justify-between">
            <label className="text-white text-[22px] font-bold">{label}</label>
            <input
              type="range"
              min="-20"
              max="20"
              value={eqGains[idx]}
              onChange={(e) => handleEqChange(idx, Number(e.target.value))}
              className="eq-slider absolute top-[155px]"
            />
            <span className="text-white text-xl font-bold mt-[220px]">{eqGains[idx]} dB</span>
          </div>
        ))}
      </div>

      <div className="relative w-[969px] h-[630px] bg-[#0b031f] bg-[url('/image/base.png')] bg-cover border-[3px] border-[#0077ff] rounded-[30px] mt-4 overflow-hidden">
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-30 cursor-pointer flex items-center justify-center"
        >
          {isPlaying ? (
            <svg className="w-[280px] h-[180px] mt-[-80px] fill-red-600/0 hover:fill-red-600/30" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6zm8-14v14h4V5z" />
            </svg>
          ) : (
            <svg className="w-[280px] h-[280px] fill-[#190aec]/60 hover:fill-[#190aec]/90" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>

        <div
          style={{ backgroundImage: `url('${activeCylinderUrl}')` }}
          className={`absolute top-[10px] left-[1.5px] w-[476px] h-[476px] bg-cover transition-all duration-300 ${isPlaying ? 'animate-spin-slow' : ''}`}
        />
        <div
          style={{ backgroundImage: `url('${activeCylinderUrl}')` }}
          className={`absolute top-[10px] right-[6px] w-[476px] h-[476px] bg-cover transition-all duration-300 ${isPlaying ? 'animate-spin-slow' : ''}`}
        />
        <div
          style={{ backgroundImage: `url('${activeCylinderUrl}')` }}
          className={`absolute top-[520px] left-[45px] w-[96px] h-[96px] bg-cover transition-all duration-300 ${isPlaying ? 'animate-spin-slow' : ''}`}
        />
        <div
          style={{ backgroundImage: `url('${activeCylinderUrl}')` }}
          className={`absolute top-[520px] right-[35px] w-[96px] h-[96px] bg-cover transition-all duration-300 ${isPlaying ? 'animate-spin-slow' : ''}`}
        />

        <div className="absolute inset-0 bg-[url('/image/tampa.png')] bg-cover pointer-events-none z-10" />

        <div className="absolute top-[30px] left-[150px] w-[669px] h-[90px] flex items-center justify-center overflow-hidden pointer-events-none z-20 px-4">
          <div className="w-full text-center overflow-hidden whitespace-nowrap">
            <h1
              className={`text-white font-impact drop-shadow-[0_0_20px_blue] uppercase tracking-wide transition-all ${
                currentTrackLabel.length > 10
                  ? 'text-4xl animate-marquee'
                  : 'text-6xl'
              }`}
            >
              {currentTrackLabel}
            </h1>
          </div>
        </div>
      </div>

      <div className="w-[965px] h-[140px] bg-[url('/image/leds.webp')] bg-cover mt-2" />
    </div>
  );
}