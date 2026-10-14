'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface AudioContextType {
  isPlaying: boolean;
  togglePlay: () => void;
  playAudio: () => void;
  pauseAudio: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  activePlaylist: string; // <-- Nome da playlist atual vinda do AzuraCast
  nowPlayingData: any;    // <-- Dados completos do Now Playing (se precisar das capas, etc.)
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePlaylist, setActivePlaylist] = useState<string>('default');
  const [nowPlayingData, setNowPlayingData] = useState<any>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      // Instância persistente de áudio que não é destruída nas trocas de tela
      audioRef.current = new Audio('https://seu-stream-de-radio.com/stream');
      audioRef.current.preload = 'none';
    }
  }, []);

  // Hook/Poller para buscar os metadados do AzuraCast periodicamente
  useEffect(() => {
    const fetchAzuraCastMeta = async () => {
      try {
        // Substitua pelo link real da API do seu AzuraCast (ex: /api/nowplaying/sua_estacao)
        const response = await fetch('https://erbj.com.br/api/nowplaying/power_dance');
        if (response.ok) {
          const data = await response.json();
          setNowPlayingData(data);

          // Extrai o nome da playlist atual informada pelo AzuraCast
          // (Geralmente vem em data.now_playing.playlist ou data.live.playlist)
          const playlistName = data?.now_playing?.playlist || data?.live?.playlist || 'default';
          setActivePlaylist(playlistName);
        }
      } catch (error) {
        console.error('Erro ao buscar metadados do AzuraCast:', error);
      }
    };

    // Chamada inicial
    fetchAzuraCastMeta();

    // Atualiza a cada 15 segundos para sincronizar a programação
    const interval = setInterval(fetchAzuraCastMeta, 15000);
    return () => clearInterval(interval);
  }, []);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  return (
    <AudioContext.Provider value={{ 
      isPlaying, 
      togglePlay, 
      playAudio, 
      pauseAudio, 
      audioRef, 
      activePlaylist, 
      nowPlayingData 
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio precisa ser usado dentro de AudioProvider');
  }
  return context;
};