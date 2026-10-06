'use client';

import React, { useEffect, useState } from 'react';
import { auth, database } from '@/lib/firebase';
import { ref, onChildAdded, remove, update } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push('/login');
    });

    const msgRef = ref(database, 'messages');
    onChildAdded(msgRef, (snap) => {
      setMessages((prev) => [...prev, { id: snap.key, ...snap.val() }]);
    });

    return () => unsub();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (confirm("Deseja apagar esta mensagem?")) {
      await remove(ref(database, `messages/${id}`));
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleEdit = async (id: string, current: string) => {
    const novo = prompt("Editar mensagem:", current);
    if (novo && novo.trim() !== "") {
      await update(ref(database, `messages/${id}`), { message: novo, text: novo });
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, message: novo, text: novo } : m));
    }
  };

  return (
    <div className="min-h-screen bg-[#010519] text-white flex flex-col">
      <div className="bg-[#003366] p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel Admin</h1>
        <button
          onClick={() => signOut(auth).then(() => router.push('/login'))}
          className="bg-red-500 px-6 py-2 rounded-lg font-bold"
        >
          Sair
        </button>
      </div>

      <div className="p-8 flex flex-col gap-6 overflow-y-auto max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-amber-950/60 p-6 rounded-xl border border-amber-500/30 relative flex gap-6">
            <img src={msg.photoURL} alt="Avatar" className="w-24 h-24 rounded-full border-2 border-cyan-400" />
            <div className="flex-1">
              <h3 className="text-cyan-400 text-2xl font-bold">{msg.name}</h3>
              <p className="text-sm text-yellow-300">{msg.email}</p>
              <p className="text-xl font-medium mt-2">{msg.message || msg.text}</p>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => handleEdit(msg.id, msg.message || msg.text)}
                  className="bg-amber-500 px-4 py-2 rounded font-bold"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="bg-red-600 px-4 py-2 rounded font-bold"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}