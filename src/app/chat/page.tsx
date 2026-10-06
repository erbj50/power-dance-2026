'use client';

import React, { useEffect, useState } from 'react';
import { auth, database } from '@/lib/firebase';
import { ref, push, onChildAdded, onChildRemoved, query, limitToLast, get, remove } from 'firebase/database';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Message {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  text: string;
  message?: string;
  timestamp: number;
}

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    const msgRef = query(ref(database, 'messages'), limitToLast(30));

    const onAdd = onChildAdded(msgRef, (snap) => {
      const data = snap.val();
      const newId = snap.key!;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newId)) return prev;
        return [...prev, { ...data, id: newId }];
      });
    });

    const onRem = onChildRemoved(msgRef, (snap) => {
      setMessages((prev) => prev.filter((m) => m.id !== snap.key));
    });

    // CORREÇÃO FIREBASE: Apaga mensagens e pedidos do Realtime Database após 3 minutos
    const interval = setInterval(async () => {
      const now = Date.now();
      const limit = 3 * 60 * 1000;

      // Apaga mensagens antigas no Firebase
      const mRef = ref(database, 'messages');
      const mSnap = await get(mRef);
      if (mSnap.exists()) {
        const val = mSnap.val();
        Object.keys(val).forEach((k) => {
          if (val[k].timestamp && (now - val[k].timestamp > limit)) {
            remove(ref(database, `messages/${k}`));
          }
        });
      }

      // Apaga pedidos antigos no Firebase
      const pRef = ref(database, 'pedidos');
      const pSnap = await get(pRef);
      if (pSnap.exists()) {
        const val = pSnap.val();
        Object.keys(val).forEach((k) => {
          if (val[k].timestamp && (now - val[k].timestamp > limit)) {
            remove(ref(database, `pedidos/${k}`));
          }
        });
      }
    }, 10000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const msgData = {
      uid: user.uid,
      name: user.displayName || 'Ouvinte',
      email: user.email || '',
      photoURL: user.photoURL || 'https://via.placeholder.com/75',
      text: text.trim(),
      message: text.trim(),
      timestamp: Date.now(),
    };

    await push(ref(database, 'messages'), msgData);
    if (text.startsWith('!') || text.includes('-')) {
      await push(ref(database, 'pedidos'), msgData);
    }
    setText('');
  };

  return (
    <div className="flex flex-col w-[calc(100%-20px)] max-w-[9930px] h-full max-h-screen mx-auto bg-[#0a1428]/90 text-white overflow-hidden">
      {/* Estilo CSS customizado para garantir o scrolling de exatamente 3s (3000ms) sem atrasos */}
      <style jsx>{`
        @keyframes marqueeVertical {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        .animate-marquee-3s {
          animation: marqueeVertical 3s linear infinite;
        }
        .animate-marquee-3s:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex-1 relative overflow-hidden min-h-0">
        <div className="w-full flex flex-col gap-4 p-4 animate-marquee-3s">
          {messages.map((m) => (
            <div key={m.id} className="border-2 border-cyan-400/40 bg-black/80 p-4 rounded-xl flex gap-4 items-center shadow-lg">
              <img src={m.photoURL} alt="Avatar" className="w-[65px] h-[65px] rounded-full border-2 border-cyan-400 object-cover shrink-0" />
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-cyan-400 font-bold text-xl truncate">{m.name}</span>
                <span className="text-yellow-400 text-xs truncate">{m.email}</span>
                <p className="text-white text-4xl font-semibold mt-1 break-words leading-tight">{m.text || m.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-[#0e0ee650] border-t-2 border-cyan-400 flex gap-3 items-center shrink-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Digite seu recado ou pedido (!toca...)..." : "Faça login para mandar recados"}
          disabled={!user}
          className="flex-1 h-[80px] p-3 bg-black/60 border border-cyan-400 rounded-lg text-white text-2xl font-medium outline-none resize-none focus:ring-2 focus:ring-cyan-300"
        />
        <button
          onClick={handleSend}
          disabled={!user || !text.trim()}
          className="h-[80px] px-8 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xl rounded-lg disabled:bg-gray-600 cursor-pointer transition-all shrink-0"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}