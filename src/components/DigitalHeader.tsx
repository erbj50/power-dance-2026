'use client';

import React, { useEffect, useState } from 'react';

interface Props {
  onToggleLeft: () => void;
  onToggleRight: () => void;
}

const MESSAGES = [
  "WEB RADIO",
  "POWER DANCE",
  "CAMPO GRANDE MS",
  "DJ ROBERT BJ",
  "HIGH TECHNOLOGY"
];

export default function DigitalHeader({ onToggleLeft, onToggleRight }: Props) {
  const [time, setTime] = useState("00:00:00");
  const [date, setDate] = useState("");
  const [day, setDay] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [sequencePhase, setSequencePhase] = useState(0); // 0: minha-logo, 1: rotate, 2: top-bg + dj, 3: raiden (relógio e mensagens)

  // Atualiza o relógio, dia e data
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0]);
      const days = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
      setDay(days[now.getDay()]);
      setDate(now.toLocaleDateString('pt-BR'));
    };

    updateTime();
    const clockTimer = setInterval(updateTime, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Controla a sequência de imagens e fundos
  useEffect(() => {
    const sequenceTimer = setInterval(() => {
      setSequencePhase((prev) => (prev + 1) % 4); // Loop: 0 -> 1 -> 2 -> 3 -> 0
    }, 60000); // 60 segundos por fase

    return () => clearInterval(sequenceTimer);
  }, []);

  // Controla a sequência de mensagens (apenas na fase 3: raiden)
  useEffect(() => {
    if (sequencePhase === 3) {
      const msgTimer = setInterval(() => {
        setMsgIndex(prev => (prev + 1) % (MESSAGES.length + 3));
      }, 8000);
      return () => clearInterval(msgTimer);
    }
  }, [sequencePhase]);

  // Retorna o estilo de fundo de acordo com a fase
  const getBackgroundStyle = () => {
    if (sequencePhase === 0 || sequencePhase === 1) {
      return { backgroundImage: "url('/image/raiden.webp')" };
    } else if (sequencePhase === 2) {
      return { backgroundImage: "url('/image/top-bg.webp')" };
    } else {
      return { backgroundImage: "url('/image/raiden.webp')" };
    }
  };

  // Retorna a imagem sobreposta de acordo com a fase
  const getOverlayImage = () => {
    if (sequencePhase === 0) {
      return (
        <img
          src="/image/minha-logo.webp"
          alt="Logo"
          className="absolute inset-0 w-full h-full object-contain"
        />
      );
    } else if (sequencePhase === 1) {
      return (
        <img
          src="/image/rotate.webp"
          alt="Rotate"
          className="absolute inset-0 w-full h-full object-contain"
        />
      );
    } else if (sequencePhase === 2) {
      return (
        <img
          src="/image/dj.webp"
          alt="DJ"
          className="absolute inset-0 w-full h-full object-contain"
        />
      );
    } else {
      return null; // Na fase 3, não há imagem sobreposta
    }
  };

  return (
    <div
      className="w-[995px] h-[160px] flex items-center bg-cover bg-center border border-[#031bf0] my-2 select-none relative overflow-hidden"
      style={getBackgroundStyle()}
    >
      {/* Imagem sobreposta (minha-logo, rotate ou dj) */}
      {getOverlayImage()}

      <button
        onClick={onToggleLeft}
        className="w-[130px] h-[160px] bg-black bg-[url('/image/dance-L.webp')] bg-no-repeat bg-center border border-[#03ccf02a] relative z-10"
      />

      {/* Exibe o relógio e mensagens apenas na fase 3 (raiden) */}
      <div className="w-[750px] h-[160px] flex items-center justify-center text-center whitespace-nowrap overflow-hidden relative z-10">
        {sequencePhase === 3 && (
          msgIndex === 0 ? (
            <span className="text-white text-[100px] font-digital font-bold drop-shadow-[0_0_30px_#0b07e7]">{time}</span>
          ) : msgIndex === 1 ? (
            <span className="text-white text-[84px] font-impact drop-shadow-[0_0_30px_#0b4bee]">{day}</span>
          ) : msgIndex === 2 ? (
            <span className="text-[#e7ff0c] text-[84px] font-bold drop-shadow-[0_0_30px_#0b07e7]">{date}</span>
          ) : (
            <span className="text-[74px] font-bold uppercase animate-neon">{MESSAGES[msgIndex - 3]}</span>
          )
        )}
      </div>

      <button
        onClick={onToggleRight}
        className="w-[130px] h-[160px] bg-black bg-[url('/image/dance-R.webp')] bg-no-repeat bg-center border border-[#03ccf02a] relative z-10"
      />
    </div>
  );
}