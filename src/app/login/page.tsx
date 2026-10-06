'use client';

import React from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/');
    } catch (err: any) {
      alert('Falha ao autenticar: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#17083d] to-[#0e0b48] text-white p-6">
      <h1 className="text-amber-400 text-4xl font-bold mb-2">Bem-vindo ao Chat</h1>
      <h2 className="text-slate-200 text-lg mb-8">Entrar com sua conta</h2>
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm flex justify-center">
        <button
          onClick={handleLogin}
          className="w-full py-4 bg-[#db4437] hover:bg-[#c1351d] text-white font-bold text-xl rounded-lg transition"
        >
          Google
        </button>
      </div>
    </div>
  );
}