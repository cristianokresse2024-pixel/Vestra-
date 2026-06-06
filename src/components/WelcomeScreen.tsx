import React, { useState } from 'react';
import { useReino } from '../store';
import { useAuth } from '../auth';
import { Crown, Store as StoreIcon, ChevronRight, LogOut } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { addStore } = useReino();
  const { logout, profile } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setError('Por favor, informe o nome da sua primeira loja.');
      return;
    }
    addStore(storeName.trim(), location.trim() || undefined);
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-50 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-purple-600 selection:text-white">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-950/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[440px] bg-[#0d0d12]/80 backdrop-blur-xl border border-purple-500/15 rounded-3xl p-8 relative overflow-hidden z-10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
        {/* Subtle decorative purple line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-fuchsia-600 to-indigo-500" />
        
        <div className="flex flex-col items-center text-center">
          {/* Main Royal Shield / Logo Wrapper */}
          <div className="w-16 h-16 bg-zinc-950 border border-purple-500/25 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(139,92,246,0.15)] animate-pulse">
            <Crown className="w-9 h-9 text-purple-400 stroke-[1.5]" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">
            REINO GESTÃO
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-purple-400 mt-1 font-bold">
            Fundação do Império
          </p>
          
          <div className="w-full h-[1px] bg-zinc-900 my-5" />

          <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-6">
            Saudações, <strong className="text-white">{profile?.name || 'Administrador'}</strong>! Para inicializar seu painel corporativo, cadastre a loja física ou filial principal do seu império comercial.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 pl-0.5">
              Nome da Loja Física / Filial *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                <StoreIcon className="w-4 h-4 text-purple-500/60" />
              </span>
              <input
                type="text"
                placeholder="Ex: Reino Central, Filial Shopping, etc."
                value={storeName}
                onChange={(e) => {
                  setStoreName(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/85 border border-purple-500/10 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/40 rounded-xl text-sm text-zinc-100 placeholder-zinc-650 outline-none transition-all duration-200 shadow-sm"
              />
            </div>
            {error && <p className="text-[11px] text-red-400 mt-1.5 pl-1">{error}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 pl-0.5">
              Localização / Cidade (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Av. Principal, 1200 - Centro"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950/85 border border-purple-500/10 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/40 rounded-xl text-sm text-zinc-100 placeholder-zinc-650 outline-none transition-all duration-200 shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:via-purple-600 hover:to-indigo-550 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 border border-purple-400/25 transition-all duration-200 cursor-pointer uppercase tracking-wider"
          >
            Fundar Filial do Império
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="w-full h-[1px] bg-zinc-900 my-6" />

        <div className="flex justify-center text-xs">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-zinc-550 hover:text-red-400 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da Conta Administrador
          </button>
        </div>

        <p className="text-center text-[10px] text-zinc-600 mt-6 font-mono uppercase tracking-widest">
          🔒 Conexão segura • v2.0
        </p>
      </div>
    </div>
  );
};
