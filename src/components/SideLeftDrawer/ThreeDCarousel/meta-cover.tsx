'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';

interface SongData {
  artist: string;
  title: string;
  genre: string;
  artUrl: string;
}

interface MetaCoverProps {
  onMetadataUpdate?: (artist: string, title: string) => void;
}

export default function MetaCover({ onMetadataUpdate }: MetaCoverProps) {
  const [songInfo, setSongInfo] = useState<SongData>({
    artist: 'WEB RADIO POWER DANCE',
    title: 'Campo Grande MS',
    genre: 'Dance',
    artUrl: '/image/logodj.gif',
  });

  const [displayImage, setDisplayImage] = useState<string>('/image/logodj.gif');
  const [isFading, setIsFading] = useState<boolean>(false);
  const currentArtRef = useRef<string>('/image/logodj.gif');

  const apiURL = 'https://erbj.com.br/api/nowplaying/power_dance';

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch(apiURL);
      if (!res.ok) throw new Error('Erro na requisição');
      const data = await res.json();

      let artist = 'WEB RADIO POWER DANCE';
      let title = 'Campo Grande MS';
      let genre = 'Dance';
      let art = '';

      if (data?.now_playing?.song) {
        artist = data.now_playing.song.artist || artist;
        title = data.now_playing.song.title || title;
        art = data.now_playing.song.art || '';
      }

      if (data?.station?.genre) {
        genre = data.station.genre;
      }

      const targetArt = isValidUrl(art) ? art : '/image/logodj.gif';

      setSongInfo({ artist, title, genre, artUrl: targetArt });

      // Dispara callback local e evento global de metadado
      if (onMetadataUpdate) {
        onMetadataUpdate(artist, title);
      }

      if (typeof window !== 'undefined') {
        const fullTrack =
          artist !== 'WEB RADIO POWER DANCE'
            ? `${artist} - ${title}`
            : 'POWER DANCE';

        window.dispatchEvent(
          new CustomEvent('radio_metadata_updated', {
            detail: { artist, title, fullTrack },
          })
        );
      }

      if (targetArt !== currentArtRef.current) {
        currentArtRef.current = targetArt;
        const img = new Image();
        img.src = targetArt;
        img.onload = () => {
          setIsFading(true);
          setTimeout(() => {
            setDisplayImage(targetArt);
            setIsFading(false);
          }, 450);
        };
        img.onerror = () => {
          setIsFading(true);
          setTimeout(() => {
            setDisplayImage('/image/logodj.gif');
            setIsFading(false);
          }, 450);
        };
      }
    } catch {
      setSongInfo((prev) => ({
        ...prev,
        artist: 'WEB RADIO POWER DANCE',
        title: 'Campo Grande MS',
      }));
    }
  }, [onMetadataUpdate]);

  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  return (
    <div className="flex items-center justify-center w-full h-full bg-transparent overflow-hidden select-none">
      <div className="relative w-full max-w-[650px] h-[650px] max-h-full bg-transparent bg-cover bg-center rounded-xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.5)] mt-4 aspect-square">
        <img
          src={displayImage}
          alt="Capa da música"
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <div className="absolute bottom-0 w-full bg-black/70 text-white text-base py-2.5 px-3 overflow-hidden text-center">
          <div className="whitespace-nowrap inline-block animate-[slideText_15s_linear_infinite] font-['Impact','Arial_Narrow_Bold',sans-serif] tracking-wider">
            🎤 {songInfo.artist} &nbsp;&nbsp; 🎵 {songInfo.title} &nbsp;&nbsp; 🎧 {songInfo.genre} &nbsp;&nbsp;
            <strong>WEB RADIO POWER DANCE Campo Grande MS</strong>
          </div>
        </div>
      </div>
    </div>
  );
}