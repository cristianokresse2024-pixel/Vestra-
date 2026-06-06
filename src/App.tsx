/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ReinoProvider, useReino } from './store';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Dashboard } from './components/Dashboard';
import { SalesPOS } from './components/SalesPOS';
import { ProductsList } from './components/ProductsList';
import { ManageMore } from './components/ManageMore';
import { CashFlow } from './components/CashFlow';
import { Reports } from './components/Reports';
import { AuthProvider, useAuth } from './auth';
import { AuthScreen } from './components/AuthScreen';
import { PartnerDashboard } from './components/PartnerDashboard';
import { 
  Crown, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Settings2,
  Store as StoreIcon,
  ChevronDown,
  LogOut,
  User as UserIcon,
  DollarSign,
  BarChart3
} from 'lucide-react';

function AppContent() {
  const { user, profile, loading, logout } = useAuth();
  const { stores, activeStoreId, setActiveStoreId, notifications } = useReino();
  const [activeTab, setActiveTab] = useState<'inicio' | 'vendas' | 'produtos' | 'admin' | 'caixa' | 'relatorios'>('inicio');
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  const isVendedor = profile?.role === 'Vendedor';
  const isParceiro = profile?.role === 'Parceiro';
  const isAdmin = profile?.role === 'Administrador';

  // Force Tab selection safety according to role permissions
  useEffect(() => {
    if (isVendedor) {
      setActiveTab('vendas');
    } else if (isParceiro) {
      setActiveTab('inicio');
    }
  }, [profile?.role]);

  // If loading user state from Firestore/Auth, show immersive premium loading crown
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070a] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="w-14 h-14 bg-zinc-950 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(139,92,246,0.12)]">
          <Crown className="w-7 h-7 text-purple-400 stroke-[1.5] animate-pulse" />
        </div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-400 font-semibold animate-pulse">
          Restaurando Império...
        </p>
      </div>
    );
  }

  // If there's no authenticated session, direct to the premium credentials gateway
  if (!user) {
    return <AuthScreen />;
  }

  // If no stores have been configured yet - enforce the Welcome onboarding
  if (stores.length === 0) {
    if (isAdmin) {
      return <WelcomeScreen />;
    } else {
      // Non-admins wait for store bootstrap
      return (
        <div className="min-h-screen bg-[#07070a] text-zinc-200 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-900/5 rounded-full blur-[100px] pointer-events-none" />
          <Crown className="w-12 h-12 text-purple-400 mb-3 stroke-[1.5]" />
          <h3 className="text-md font-bold uppercase tracking-wider text-white">Aguardando Reino...</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
            Sua conta está ativa, mas a filial principal ainda não foi configurada. Aguarde até que o Administrador geral realize o primeiro acesso.
          </p>
          <button 
            onClick={logout} 
            className="mt-6 px-4 py-2 bg-zinc-955 border border-zinc-800 text-xs rounded-xl hover:text-red-400 font-semibold cursor-pointer transition-all"
          >
            Encerrar Sessão
          </button>
        </div>
      );
    }
  }

  const activeStoreObj = stores.find(s => s.id === activeStoreId);
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-900/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-80 h-80 bg-purple-950/5 rounded-full blur-3xl pointer-events-none" />

      {/* Primary Global Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-zinc-900 border border-purple-500/30 rounded-xl flex items-center justify-center glow-purple">
              <Crown className="w-5 h-5 text-purple-400 stroke-[1.8]" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white uppercase font-sans">
                REINO GESTÃO
              </h1>
              <p className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-semibold mt-0.5">
                Controle • Resultados
              </p>
            </div>
          </div>

          {/* Right Header Navigation/Switchers */}
          <div className="flex items-center gap-4">
            
            {/* Quick Active Store Selector - Only shown to Admin & Sellers */}
            {!isParceiro && (
              <div className="relative">
                <button
                  onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-purple-500/35 rounded-xl text-xs text-zinc-200 font-medium transition-all cursor-pointer"
                >
                  <StoreIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {activeStoreObj?.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {showStoreDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowStoreDropdown(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 py-1 divide-y divide-zinc-800/60">
                      <div className="px-3.5 py-1.5 text-[9px] uppercase font-mono text-purple-400 font-bold">
                        Alternar Filiais do Império
                      </div>
                      {stores.map(st => (
                        <button
                          key={st.id}
                          onClick={() => {
                            setActiveStoreId(st.id);
                            setShowStoreDropdown(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-sans transition-all flex items-center justify-between cursor-pointer ${
                            st.id === activeStoreId 
                              ? 'bg-purple-900/20 text-purple-400 font-semibold' 
                              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                          }`}
                        >
                          <span className="truncate pr-2">{st.name}</span>
                          {st.id === activeStoreId && <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Profile Avatar Badge & Logout Action */}
            <div className="flex items-center gap-3 pl-3.5 border-l border-zinc-900">
              <div className="text-right hidden sm:block font-sans">
                <p className="text-xs font-semibold text-zinc-200 leading-tight">{profile?.name || 'Membro'}</p>
                <p className="text-[9px] font-mono text-purple-400 font-bold uppercase mt-0.5 tracking-wide">{profile?.role}</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-950/20 text-purple-400 flex items-center justify-center border border-purple-500/10">
                <UserIcon className="w-4 h-4 stroke-[1.8]" />
              </div>
              <button
                onClick={logout}
                title="Encerrar Sessão"
                className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-850 hover:text-red-400 border border-zinc-800/80 flex items-center justify-center text-zinc-550 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Responsive Shell layout: Sidebar on desktop, tab view on mobile */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-6 gap-6 relative">
        
        {/* DESKTOP SIDEBAR NAVIGATION - Only shown for Admins or Sellers */}
        {!isParceiro && (
          <aside className="hidden md:flex flex-col w-64 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4 shrink-0 h-fit space-y-2 sticky top-[73px]">
            <div className="text-[10px] uppercase font-mono tracking-wider font-bold text-purple-400 px-3.5 mb-2">
              Módulos de Gestão
            </div>

            {/* Início/Dashboard is only for Admin */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('inicio')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer ${
                  activeTab === 'inicio'
                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                Início / Dashboard
              </button>
            )}

            <button
              onClick={() => setActiveTab('vendas')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer ${
                activeTab === 'vendas'
                  ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-purple-400" />
              Frente de Caixa (PDV)
            </button>

            {/* Inventory available to Admin only */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('produtos')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer ${
                    activeTab === 'produtos'
                      ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
                  }`}
                >
                  <Package className="w-4 h-4 text-purple-400" />
                  Estoque de Produtos
                </button>

                <button
                  onClick={() => setActiveTab('caixa')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer ${
                    activeTab === 'caixa'
                      ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  Fluxo de Caixa
                </button>

                <button
                  onClick={() => setActiveTab('relatorios')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer ${
                    activeTab === 'relatorios'
                      ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  Relatórios Consolidados
                </button>

                <button
                  onClick={() => setActiveTab('admin')}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 bg-transparent border border-transparent'
                  }`}
                >
                  <Settings2 className="w-4 h-4 text-purple-400" />
                  Administração Geral
                  {unreadNotifications > 0 && (
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
              </>
            )}
          </aside>
        )}

        {/* PRIMARY MAIN PANEL VIEW */}
        <main className="flex-1 min-w-0 transition-all duration-300">
          {isParceiro ? (
            <PartnerDashboard linkedPartnerId={profile?.linkedPartnerId} />
          ) : (
            <>
              {activeTab === 'inicio' && <Dashboard />}
              {activeTab === 'vendas' && <SalesPOS />}
              {activeTab === 'produtos' && <ProductsList />}
              {activeTab === 'caixa' && <CashFlow />}
              {activeTab === 'relatorios' && <Reports />}
              {activeTab === 'admin' && <ManageMore />}
            </>
          )}
        </main>

      </div>

      {/* MOBILE BOTTOM NAVIGATION DOCK - Hidden for Partners (they are single-view dashboard) and filtered for Vendedores */}
      {!isParceiro && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900 border-t border-zinc-850 px-4 py-2 flex justify-around items-center backdrop-blur-lg">
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('inicio')}
              className={`flex flex-col items-center gap-1 p-2 transition-all cursor-pointer ${
                activeTab === 'inicio' ? 'text-purple-400' : 'text-zinc-400'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[9px] font-sans">Início</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('vendas')}
            className={`flex flex-col items-center gap-1 p-2 transition-all cursor-pointer ${
              activeTab === 'vendas' ? 'text-purple-400' : 'text-zinc-400'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[9px] font-sans flex items-center gap-0.5">Vendas</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('produtos')}
                className={`flex flex-col items-center gap-1 p-2 transition-all cursor-pointer ${
                  activeTab === 'produtos' ? 'text-purple-400' : 'text-zinc-400'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="text-[9px] font-sans">Produtos</span>
              </button>

              <button
                onClick={() => setActiveTab('caixa')}
                className={`flex flex-col items-center gap-1 p-2 transition-all cursor-pointer ${
                  activeTab === 'caixa' ? 'text-purple-400' : 'text-zinc-400'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-[9px] font-sans">Caixa</span>
              </button>

              <button
                onClick={() => setActiveTab('relatorios')}
                className={`flex flex-col items-center gap-1 p-2 transition-all cursor-pointer ${
                  activeTab === 'relatorios' ? 'text-purple-400' : 'text-zinc-400'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-[9px] font-sans">Relatórios</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex flex-col items-center gap-1 p-2 transition-all cursor-pointer relative ${
                  activeTab === 'admin' ? 'text-purple-400' : 'text-zinc-400'
                }`}
              >
                <Settings2 className="w-5 h-5" />
                <span className="text-[9px] font-sans">Admin</span>
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
                )}
              </button>
            </>
          )}

        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ReinoProvider>
        <AppContent />
      </ReinoProvider>
    </AuthProvider>
  );
}
