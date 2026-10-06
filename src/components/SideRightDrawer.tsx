'use client';

import { useState, useEffect } from 'react';
import { auth, database } from '@/lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  ref, 
  get, 
  push, 
  onChildAdded, 
  remove, 
  update, 
  query, 
  limitToLast,
  set,
  onDisconnect
} from 'firebase/database';

const animatedEmojis: Record<string, string[]> = {
  "😀": [
    "https://i.ibb.co/HTcPv1pr/SIM.webp",
    "https://i.ibb.co/m5zwVsBk/CONC.webp",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f921/512.gif"
  ],
  "👋": [
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64c/512.gif"
  ],
  "❤️": [
    "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f496/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f49d/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif"
  ],
  "🎵": [
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3b5/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3a4/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3a9/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f483/512.gif"
  ]
};

interface Props {
  isOpen: boolean;
}

interface MessageData {
  id?: string;
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  text?: string;
  message?: string;
  timestamp: number;
  gender?: 'men' | 'women';
}

export default function SideRightDrawer({ isOpen }: Props) {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'chat' | 'admin'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPopup, setShowAdminPopup] = useState(false);

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("😀");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userPresenceRef = ref(database, `online_users/${currentUser.uid}`);
        set(userPresenceRef, {
          uid: currentUser.uid,
          name: currentUser.displayName || "Ouvinte",
          photoURL: currentUser.photoURL || "",
          lastSeen: Date.now()
        });
        onDisconnect(userPresenceRef).remove();

        const adminRef = ref(database, 'admins/' + currentUser.uid); 
        const snapshot = await get(adminRef);
        const adminExists = snapshot.exists();
        setIsAdmin(adminExists);

        if (adminExists) {
          setShowAdminPopup(true);
        } else {
          setCurrentScreen('chat');
        }
      } else {
        setIsAdmin(false);
        setCurrentScreen('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentScreen === 'chat' || currentScreen === 'admin') {
      const messagesQuery = query(ref(database, 'messages'), limitToLast(50));
      const unsubscribe = onChildAdded(messagesQuery, (snapshot) => {
        const data = snapshot.val();
        const msgId = snapshot.key as string;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msgId)) return prev;
          const updated = [...prev, { id: msgId, ...data }];
          return updated.slice(-6);
        });
      });
      return () => unsubscribe();
    }
  }, [currentScreen]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      const limit = 3 * 60 * 1000;

      const msgRef = ref(database, 'messages');
      const msgSnap = await get(msgRef);
      if (msgSnap.exists()) {
        const data = msgSnap.val();
        Object.keys(data).forEach((key) => {
          if (data[key].timestamp && (now - data[key].timestamp > limit)) {
            remove(ref(database, `messages/${key}`));
          }
        });
      }

      const pedRef = ref(database, 'pedidos');
      const pedSnap = await get(pedRef);
      if (pedSnap.exists()) {
        const pData = pedSnap.val();
        Object.keys(pData).forEach((key) => {
          if (pData[key].timestamp && (now - pData[key].timestamp > limit)) {
            remove(ref(database, `pedidos/${key}`));
          }
        });
      }

      setMessages((prev) => {
        const filtered = prev.filter((m) => now - m.timestamp < limit);
        return filtered.slice(-6);
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.warn("Popup de login falhou ou foi bloqueado pelo COOP. Redirecionando...", error);
      
      if (
        error.code === 'auth/popup-blocked' || 
        error.code === 'auth/popup-closed-by-user' ||
        error.message?.includes('Cross-Origin-Opener-Policy')
      ) {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr: any) {
          alert("Erro ao realizar o login por redirecionamento: " + redirectErr.message);
        }
      } else {
        alert("Erro ao fazer login: " + error.message);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;
    const msgData = {
      uid: user.uid,
      name: user.displayName || "Ouvinte",
      email: user.email || "",
      photoURL: user.photoURL || "https://via.placeholder.com/75",
      text: inputMessage,
      message: inputMessage,
      timestamp: Date.now()
    };
    await push(ref(database, 'messages'), msgData);
    if (inputMessage.startsWith('!') || inputMessage.includes('-')) {
      await push(ref(database, 'pedidos'), msgData);
    }
    setInputMessage('');
    setShowEmojiPicker(false);
  };

  const addAnimatedEmoji = (emojiUrl: string) => {
    setInputMessage((prev) => prev + ` [emoji:${emojiUrl}] `);
  };

  const handleDeleteMessage = async (id: string) => {
    if (confirm("Deseja excluir esta mensagem?")) {
      await remove(ref(database, `messages/${id}`));
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleEditMessage = async (id: string, currentText: string) => {
    const newText = prompt("Editar mensagem:", currentText);
    if (newText && newText.trim()) {
      await update(ref(database, `messages/${id}`), { message: newText, text: newText });
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, message: newText, text: newText } : m))
      );
    }
  };

  const handleLogout = () => {
    if (user) {
      remove(ref(database, `online_users/${user.uid}`));
    }
    signOut(auth);
    setShowAdminPopup(false);
    setCurrentScreen('landing');
  };

  const getBubbleBorderColor = (msg: MessageData, index: number) => {
    const isMan = msg.gender === 'men' || (index % 2 === 0);
    const menColors = ['border-blue-500', 'border-emerald-500', 'border-yellow-400'];
    const womenColors = ['border-pink-500', 'border-red-500', 'border-orange-500', 'border-purple-500'];

    if (isMan) {
      return menColors[index % menColors.length];
    } else {
      return womenColors[index % womenColors.length];
    }
  };

  const renderMessageContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(\[emoji:.*?\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[emoji:') && part.endsWith(']')) {
        const url = part.replace('[emoji:', '').replace(']', '');
        return (
          <img
            key={index}
            src={url}
            alt="Emoji Animado"
            /* AJUSTE TAMANHO: Emoji nas mensagens recebidas (Aumentado em +20px: era w-14 h-14 [56px], agora é w-[76px] h-[76px]) */
            className="w-[76px] h-[76px] inline-block align-middle mx-1 my-1"
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={`fixed top-[170px] bottom-0 right-0 text-white z-50 transition-all duration-500 overflow-hidden ${
        isOpen ? 'w-full md:w-[995px] md:h-[1590px]      pointer-events-auto' : 'w-0 pointer-events-none'
      }`}
    >
      <style jsx global>{`
        @keyframes marqueeUpFast {
          0% { transform: translateY(160vh); }
          100% { transform: translateY(-100%); }
        }
        .animate-marquee-vertical-fast {
          animation: marqueeUpFast 12s linear infinite;
        }
        .animate-marquee-vertical-fast:hover {
          animation-play-state: paused;
        }
      `}</style>

      {currentScreen === 'landing' && (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#070c2fe8]  border-l border-cyan-500/30">
          <h1 className="text-4xl font-extrabold text-amber-400 mb-3">Bem-vindo ao Chat</h1>
          <h2 className="text-xl text-blue-200 mb-8">Entrar com sua conta</h2>

          <div className="bg-[#5837db44]  p-8 rounded-2xl w-full max-w-sm shadow-2xl border border-cyan-500/30">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-4 text-xl bg-[#db4437] hover:bg-[#c1351d] text-white font-bold rounded-x2 transition-colors cursor-pointer shadow-lg"
            >
              Entrar com Google
            </button>
          </div>

          {showAdminPopup && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
              <div className="bg-[#07094f] border border-cyan-500/50 p-6 rounded-2xl w-full max-w-xs text-center backdrop-blur-md shadow-2xl">
                <h2 className="text-cyan-400 text-xl font-bold mb-4">Escolha onde deseja entrar</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => { setShowAdminPopup(false); setCurrentScreen('admin'); }}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-base rounded-xl cursor-pointer"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => { setShowAdminPopup(false); setCurrentScreen('chat'); }}
                    className="flex-1 py-4  bg-[#0727f4fc] hover:bg-blue-700 text-white font-bold text-base rounded-x4 cursor-pointer"
                  >
                    Mural
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {currentScreen === 'chat' && (
        <div className="flex flex-col h-full bg-[#0727f452] relative overflow-hidden border-l border-cyan-500/30">
          <div className="p-4 bg-[#0e0ee645] backdrop-blur-md flex justify-between items-center border-b border-cyan-500/30 z-10 shrink-0">
            <span className="font-extrabold text-cyan-100 text-2xl tracking-wide left-85px">Chat Bate Papo</span>
            <button onClick={handleLogout} className="text-base bg-red-500/80 hover:bg-red-600 text-white px-5 py-2  font-bold rounded-xl shadow-md transition-all cursor-pointer">Sair</button>
          </div>

          <div className="flex-1 relative overflow-hidden p-4 min-h-0">
            <div className="animate-marquee-vertical-fast space-y-6">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id} 
                  className={`p-5 bg-blue-950/50  border-1 ${getBubbleBorderColor(msg, index)} rounded-3xl flex gap-5 items-center shadow-2xl transition-all`}
                >
                  <img 
                    src={msg.photoURL} 
                    alt="Avatar" 
                    referrerPolicy="no-referrer"
                    /* AJUSTE TAMANHO: Avatar do usuário (Aumentado em +20px: era w-16 h-16 [64px], agora é w-[84px] h-[84px]) */
                    className="w-[84px] h-[84px] rounded-full border-2 border-white/80 object-cover shrink-0 shadow-lg" 
                  />
                  <div className="overflow-hidden flex-1">
                    <div className="text-cyan-300 font-extrabold text-lg truncate">{msg.name}</div>
                    {/* AJUSTE TAMANHO: Texto enviado / recebido no chat (Aumentado em até 2x: era text-xl, agora é text-3xl) */}
                    <div className="text-white text-3xl font-semibold break-words leading-relaxed mt-1">
                      {renderMessageContent(msg.text || msg.message || '')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showEmojiPicker && (
            <div className="bg-blue-950/90 backdrop-blur-md border-2 border-cyan-400/50 p-4 m-2 rounded-2xl z-20 shadow-2xl max-h-64 overflow-y-auto shrink-0">
              <div className="flex gap-4 border-b border-cyan-500/30 pb-3 mb-3">
                {Object.keys(animatedEmojis).map((catKey) => (
                  <button
                    key={catKey}
                    onClick={() => setActiveCategory(catKey)}
                    className={`text-3xl p-2 rounded-xl transition-all cursor-pointer ${activeCategory === catKey ? 'bg-cyan-500/40 scale-110' : ''}`}
                  >
                    {catKey}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-4">
                {animatedEmojis[activeCategory]?.map((emojiUrl, index) => (
                  <button key={index} onClick={() => addAnimatedEmoji(emojiUrl)} className="hover:scale-125 transition-transform flex justify-center items-center cursor-pointer">
                    {/* AJUSTE TAMANHO: Emojis dentro do seletor (Aumentado em +20px: era w-14 h-14 [56px], agora é w-[76px] h-[76px]) */}
                    <img src={emojiUrl} alt="emoji" className="w-[76px] h-[76px] object-contain" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-900/60 backdrop-blur-md border-t border-cyan-500/40 flex gap-3 z-10 shrink-0 items-center">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="bg-blue-950/60 hover:bg-blue-900/80 text-3xl px-4 py-3 rounded-2xl border border-cyan-400/50 transition-all cursor-pointer"
            >
              😀
            </button>
            {/* AJUSTE TAMANHO: Texto dentro da caixa de digitação (Aumentado em 2x: era text-xl, agora é text-3xl. Altura ajustada para min-h-[90px]) */}
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Digite seu recado..."
              className="flex-1 bg-blue-950/50 backdrop-blur-md border-2 border-cyan-400 rounded-2xl px-5 py-3 text-3xl text-white placeholder-blue-200/60 outline-none focus:ring-2 focus:ring-cyan-300 resize-none min-h-[90px]"
            />
            <button onClick={handleSendMessage} className="bg-cyan-400 hover:bg-cyan-300 text-black font-black text-lg px-6 py-4 rounded-2xl transition-all shadow-xl active:scale-95 cursor-pointer">
              Enviar
            </button>
          </div>
        </div>
      )}

      {currentScreen === 'admin' && (
        <div className="flex flex-col h-full bg-blue-950/90 backdrop-blur-md p-6 overflow-y-auto border-l border-blue-500/30">
          <div className="flex justify-between items-center mb-6 border-b border-cyan-500/30 pb-4 shrink-0">
            <h1 className="text-3xl font-extrabold text-cyan-300">Painel Admin</h1>
            <div className="flex gap-3">
              <button onClick={() => setCurrentScreen('chat')} className="text-base bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold rounded-xl shadow-md cursor-pointer">Mural</button>
              <button onClick={handleLogout} className="text-base bg-red-600 hover:bg-red-700 px-5 py-2 font-bold rounded-xl shadow-md cursor-pointer">Sair</button>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="p-5 bg-blue-950/60 backdrop-blur-md rounded-2xl border border-amber-500/40 relative shadow-xl">
                <h3 className="text-cyan-300 font-bold text-lg">{msg.name}</h3>
                <p className="text-sm text-gray-300">{msg.email}</p>
                <p className="text-white font-medium text-lg my-2">{msg.message || msg.text}</p>
                
                <div className="flex gap-3 mt-4">
                  <button onClick={() => handleEditMessage(msg.id!, msg.message || msg.text || '')} className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm px-4 py-2 rounded-xl cursor-pointer">Editar</button>
                  <button onClick={() => handleDeleteMessage(msg.id!)} className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-4 py-2 rounded-xl cursor-pointer">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}